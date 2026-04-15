import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { sendOrderFailedWhatsApp } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const orderId = formData.get("udf1")?.toString();

    if (orderId) {
      const failedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          "payment.status": "failed",
          $push: {
            statusHistory: {
              status: "failed",
              timestamp: new Date(),
              note: "Payment failed or cancelled by user",
            },
          },
        },
        { new: true }
      );

      if (failedOrder) {
        sendOrderFailedWhatsApp(failedOrder).catch(() => {});
      }
    }

    return NextResponse.redirect(
      new URL("/checkout/?error=payment_failed", request.url)
    );
  } catch (err) {
    console.error("PayU failure callback error:", err);
    return NextResponse.redirect(
      new URL("/checkout/?error=server_error", request.url)
    );
  }
}
