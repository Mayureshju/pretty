import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GlobalSettings from "@/models/GlobalSettings";

export async function GET() {
  try {
    await connectDB();
    let settings = await GlobalSettings.findOne({ key: "global" }).lean();
    if (!settings) {
      settings = await GlobalSettings.create({ key: "global", blockedDeliveryDates: [] });
    }
    return NextResponse.json(settings);
  } catch (err) {
    console.error("GET /api/admin/global-settings error:", err);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { blockedDeliveryDates } = body;

    const settings = await GlobalSettings.findOneAndUpdate(
      { key: "global" },
      { blockedDeliveryDates: blockedDeliveryDates || [] },
      { upsert: true, new: true }
    );

    return NextResponse.json(settings);
  } catch (err) {
    console.error("PUT /api/admin/global-settings error:", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
