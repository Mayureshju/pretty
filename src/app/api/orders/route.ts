import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import Order from "@/models/Order";
import DeliveryCity from "@/models/DeliveryCity";
import GlobalSettings from "@/models/GlobalSettings";
import { generateTxnId, getPayUFormData } from "@/lib/payu";
import { validateCoupon } from "@/lib/coupon-validation";

function toDateKey(d: Date | string): string {
  return new Date(d).toISOString().split("T")[0];
}

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

    // Reject blocked delivery dates (global + city)
    const slot = typeof body.deliverySlot === "string" ? body.deliverySlot.trim() : "";
    if (slot) {
      const slotKey = /^\d{4}-\d{2}-\d{2}/.test(slot) ? slot.slice(0, 10) : toDateKey(slot);
      const globalSettings = await GlobalSettings.findOne({ key: "global" }).lean();
      const globalBlocked = (globalSettings?.blockedDeliveryDates || []).map(toDateKey);

      let cityBlocked: string[] = [];
      const pincode = body.shipping?.pincode;
      if (pincode) {
        const deliveryCity = await DeliveryCity.findOne({
          isActive: true,
          "pincodes.code": String(pincode),
        })
          .select("blockedDates")
          .lean();
        cityBlocked = (deliveryCity?.blockedDates || []).map(toDateKey);
      }

      if ([...globalBlocked, ...cityBlocked].includes(slotKey)) {
        return Response.json(
          { error: "Selected delivery date is not available. Please choose another date." },
          { status: 400 }
        );
      }
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
      shipping: {
        address: body.shipping?.address,
        city: body.shipping?.city,
        state: body.shipping?.state,
        pincode: body.shipping?.pincode,
        method: body.shipping?.method,
        receiverName: body.shipping?.receiverName?.trim() || "",
        receiverPhone: body.shipping?.receiverPhone?.trim() || "",
      },
      deliveryCharge,
      deliverySlot: body.deliverySlot || "",
      floristInstruction: body.floristInstruction?.trim() || "",
      messageOnCard: body.messageOnCard?.trim() || "",
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
