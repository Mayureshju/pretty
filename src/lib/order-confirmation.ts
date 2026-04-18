import { after } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { Counter } from "@/models/Order";
import Coupon from "@/models/Coupon";
import User from "@/models/User";
import GuestUser from "@/models/GuestUser";
import { sendOrderConfirmationEmail, sendNewOrderSellerEmail } from "@/lib/email";
import { sendOrderConfirmedWhatsApp, sendNewOrderSellerWhatsApp } from "@/lib/whatsapp";

/**
 * Shared order confirmation logic used by both PayU success redirect and webhook.
 * Idempotent: only processes if payment.status is still "pending".
 */
export async function confirmOrderPayment(
  orderId: string,
  payuTransactionId: string
) {
  await connectDB();

  // Generate invoice number
  const year = new Date().getFullYear();
  const counter = await Counter.findByIdAndUpdate(
    "invoiceNumber",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const invoiceNumber = `INV-${year}-${String(counter.seq).padStart(5, "0")}`;

  // Atomic update: only succeeds if payment is still pending (idempotent)
  const order = await Order.findOneAndUpdate(
    { _id: orderId, "payment.status": "pending" },
    {
      "payment.status": "paid",
      "payment.transactionId": payuTransactionId,
      status: "confirmed",
      "invoice.number": invoiceNumber,
      "invoice.date": new Date(),
      $push: {
        statusHistory: {
          status: "confirmed",
          timestamp: new Date(),
          note: `Payment successful via PayU (${payuTransactionId})`,
        },
      },
    },
    { new: true }
  );

  if (!order) {
    // Either order not found or already processed
    return null;
  }

  // Increment coupon usage if applicable
  if (order.pricing.couponCode) {
    try {
      await Coupon.findOneAndUpdate(
        { code: order.pricing.couponCode },
        { $inc: { usedCount: 1 } }
      );
    } catch (err) {
      console.error("Failed to increment coupon usage:", err);
    }
  }

  // Update order metrics on the user/guest record
  const metricsUpdate = {
    $inc: { orderCount: 1, totalSpent: order.pricing.total },
    $set: { lastOrderDate: new Date() },
  };

  if (order.customer.clerkId) {
    await User.findOneAndUpdate(
      { clerkId: order.customer.clerkId },
      metricsUpdate
    );
  } else if (order.customer.email) {
    await GuestUser.findOneAndUpdate(
      { email: order.customer.email },
      metricsUpdate
    );
  }

  // Dispatch notifications after the HTTP response so they survive Vercel's
  // serverless teardown. `after()` runs even when the route redirects.
  after(async () => {
    console.log("[notify] dispatch", order.orderNumber);

    try {
      await sendOrderConfirmationEmail(order);
    } catch (e) {
      console.error("[notify] customer email failed:", e);
    }

    try {
      await sendOrderConfirmedWhatsApp(order);
    } catch (e) {
      console.error("[notify] customer whatsapp failed:", e);
    }

    try {
      await sendNewOrderSellerWhatsApp(order);
    } catch (e) {
      console.error("[notify] seller whatsapp failed:", e);
    }

    try {
      await sendNewOrderSellerEmail(order);
    } catch (e) {
      console.error("[notify] seller email failed:", e);
    }
  });

  return order;
}
