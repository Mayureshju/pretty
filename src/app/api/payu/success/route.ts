import { NextRequest, NextResponse } from "next/server";
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

    const orderId = params.udf1;

    if (!orderId) {
      return NextResponse.redirect(
        new URL("/checkout/?error=invalid_order", request.url),
        303
      );
    }

    if (isValid && params.status === "success") {
      // Use shared confirmation logic (idempotent)
      await confirmOrderPayment(orderId, params.mihpayid || params.txnid);

      return NextResponse.redirect(
        new URL(`/order-confirmation/?id=${orderId}`, request.url),
        303
      );
    } else {
      // Payment reported success but hash invalid
      await Order.findByIdAndUpdate(orderId, {
        "payment.status": "failed",
        $push: {
          statusHistory: {
            status: "failed",
            timestamp: new Date(),
            note: "Payment verification failed",
          },
        },
      });

      return NextResponse.redirect(
        new URL("/checkout/?error=verification_failed", request.url),
        303
      );
    }
  } catch (err) {
    console.error("PayU success callback error:", err);
    return NextResponse.redirect(
      new URL("/checkout/?error=server_error", request.url),
      303
    );
  }
}
