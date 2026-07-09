import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Order, { IOrder } from "@/models/Order";
import { sendOrderReminderEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const IST_TZ = "+05:30";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  // Allow ?secret= for manual invocation / non-Vercel schedulers.
  return request.nextUrl.searchParams.get("secret") === secret;
}

/**
 * Daily reminder: one day BEFORE the anniversary of a past order, email the
 * customer to send flowers again. Example: order on 24 Apr 2025 -> reminder on
 * 23 Apr 2026. So we look for orders whose order-date anniversary is TOMORROW.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // "Tomorrow" in IST.
    const now = new Date();
    const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const tomorrow = new Date(istNow);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const targetMonth = tomorrow.getUTCMonth() + 1; // 1-12
    const targetDay = tomorrow.getUTCDate();
    const targetYear = tomorrow.getUTCFullYear();

    const orders = await Order.aggregate<IOrder>([
      {
        $match: { "payment.status": "paid", "customer.email": { $ne: null } },
      },
      {
        $addFields: {
          _m: { $month: { date: "$createdAt", timezone: IST_TZ } },
          _d: { $dayOfMonth: { date: "$createdAt", timezone: IST_TZ } },
          _y: { $year: { date: "$createdAt", timezone: IST_TZ } },
        },
      },
      {
        $match: {
          _m: targetMonth,
          _d: targetDay,
          _y: { $lt: targetYear }, // only past years (at least last year)
        },
      },
    ]);

    let sent = 0;
    const failures: string[] = [];
    for (const order of orders) {
      try {
        await sendOrderReminderEmail(order);
        sent++;
      } catch (e) {
        console.error("[cron] reminder failed for", order.orderNumber, e);
        failures.push(order.orderNumber);
      }
    }

    return Response.json({
      ok: true,
      target: `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(
        targetDay
      ).padStart(2, "0")}`,
      matched: orders.length,
      sent,
      failures,
    });
  } catch (err) {
    console.error("GET /api/cron/order-reminders error:", err);
    return Response.json({ error: "Reminder job failed" }, { status: 500 });
  }
}
