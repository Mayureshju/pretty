import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import Order from "@/models/Order";
import { generateTxnId, getPayUFormData } from "@/lib/payu";
import { validateCoupon } from "@/lib/coupon-validation";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Optional auth (guest checkout allowed)
    let clerkId = null;
    try {
      const { userId } = await auth();
      clerkId = userId;
    } catch {}

    const body = await request.json();

    // Validate required fields
    if (!body.customer?.name || !body.customer?.email || !body.items?.length) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = body.items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );
    const deliveryCharge = body.deliveryCharge || 0;

    // Server-side coupon validation (never trust client discount)
    let discount = 0;
    let couponCode = "";
    if (body.couponCode) {
      const couponResult = await validateCoupon(body.couponCode, subtotal);
      if (couponResult.valid) {
        discount = couponResult.discount;
        couponCode = couponResult.couponCode || body.couponCode.toUpperCase();
      }
    }

    const total = subtotal + deliveryCharge - discount;

    // Generate transaction ID
    const txnid = generateTxnId();

    // Create order with pending status
    const order = new Order({
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        phone: body.customer.phone || "",
        clerkId,
      },
      items: body.items.map(
        (item: {
          productId?: string;
          name: string;
          variant?: string;
          quantity: number;
          price: number;
        }) => ({
          ...(item.productId && mongoose.Types.ObjectId.isValid(item.productId)
            ? { product: new mongoose.Types.ObjectId(item.productId) }
            : {}),
          productName: item.name,
          variant: item.variant || "",
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })
      ),
      shipping: body.shipping || {},
      deliveryCharge,
      deliverySlot: body.deliverySlot || "",
      pricing: {
        subtotal,
        discount,
        couponCode,
        tax: 0,
        shipping: deliveryCharge,
        total,
      },
      payment: {
        method: "PayU",
        status: "pending",
        transactionId: txnid,
      },
      status: "pending",
      statusHistory: [
        {
          status: "pending",
          timestamp: new Date(),
          note: "Order created, payment pending",
        },
      ],
    });

    await order.save();

    // Generate PayU form data
    const payuData = getPayUFormData({
      txnid,
      amount: total.toFixed(2),
      productinfo: `Pretty Petals Order`,
      firstname: body.customer.name.split(" ")[0],
      email: body.customer.email,
      phone: body.customer.phone,
      udf1: order._id.toString(),
    });

    return Response.json({
      orderId: order._id,
      orderNumber: order.orderNumber,
      payuData,
    });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return Response.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
