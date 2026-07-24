import { connectDB } from "@/lib/db";
import GlobalSettings from "@/models/GlobalSettings";

/** Public: calendar date strings (YYYY-MM-DD) blocked for all cities. */
function toDateKey(d: Date | string): string {
  const date = new Date(d);
  return date.toISOString().split("T")[0];
}

export async function GET() {
  try {
    await connectDB();
    const settings = await GlobalSettings.findOne({ key: "global" }).lean();
    const blockedDates = [
      ...new Set((settings?.blockedDeliveryDates || []).map(toDateKey)),
    ];
    return Response.json({ blockedDates });
  } catch (err) {
    console.error("GET /api/blocked-delivery-dates error:", err);
    return Response.json({ blockedDates: [] });
  }
}
