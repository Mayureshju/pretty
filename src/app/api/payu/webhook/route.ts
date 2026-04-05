import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { verifyPayUResponse } from "@/lib/payu";
import { confirmOrderPayment } from "@/lib/order-confirmation";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    // Verify PayU hash
    const isValid = verifyPayUResponse(params);
    if (!isValid) {
      return Response.json({ error: "Invalid hash" }, { status: 400 });
    }

    const orderId = params.udf1;
    if (!orderId) {
      return Response.json({ error: "Missing order ID" }, { status: 400 });
    }

    if (params.status === "success") {
      const order = await confirmOrderPayment(
        orderId,
        params.mihpayid || params.txnid
      );

      if (!order) {
        // Already processed or not found
        const existing = await Order.findById(orderId).lean();
        if (existing) {
          return Response.json({ status: "already_processed" });
        }
        return Response.json({ error: "Order not found" }, { status: 404 });
      }

      return Response.json({ status: "ok", orderNumber: order.orderNumber });
    } else {
      await Order.findByIdAndUpdate(orderId, {
        "payment.status": "failed",
        $push: {
          statusHistory: {
            status: "failed",
            timestamp: new Date(),
            note: `Payment failed (webhook): ${params.error_Message || "Unknown"}`,
          },
        },
      });
      return Response.json({ status: "failed" });
    }
  } catch (err) {
    console.error("PayU webhook error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
