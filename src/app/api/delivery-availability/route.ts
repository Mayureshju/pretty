import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import DeliveryCity from "@/models/DeliveryCity";
import GlobalSettings from "@/models/GlobalSettings";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const city = searchParams.get("city") || "";
    const pincode = searchParams.get("pincode") || "";

    if (!city && !pincode) {
      return Response.json(
        { error: "Provide city or pincode query parameter" },
        { status: 400 }
      );
    }

    let deliveryCity;

    if (pincode) {
      deliveryCity = await DeliveryCity.findOne({
        isActive: true,
        "pincodes.code": pincode,
      }).lean();
    } else {
      deliveryCity = await DeliveryCity.findOne({
        isActive: true,
        city: { $regex: `^${city}$`, $options: "i" },
      }).lean();
    }

    if (!deliveryCity) {
      return Response.json(
        { error: "Delivery not available for this location" },
        { status: 404 }
      );
    }

    // Check same-day availability based on cutoff time (IST)
    const now = new Date();
    const istOffset = 5.5 * 60; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + istOffset * 60 * 1000);
    const currentHours = istTime.getUTCHours();
    const currentMinutes = istTime.getUTCMinutes();

    let sameDayAvailable = true;

    // Check cutoff time
    if (deliveryCity.cutoffTime) {
      const [cutoffH, cutoffM] = deliveryCity.cutoffTime.split(":").map(Number);
      const currentTotalMinutes = currentHours * 60 + currentMinutes;
      const cutoffTotalMinutes = cutoffH * 60 + cutoffM;

      if (currentTotalMinutes >= cutoffTotalMinutes) {
        sameDayAvailable = false;
      }
    }

    // Check blocked dates (per-city + global)
    const todayIST = istTime.toISOString().split("T")[0]; // "2026-04-04"
    const cityBlockedDates = (deliveryCity.blockedDates || []).map(
      (d: Date) => new Date(d).toISOString().split("T")[0]
    );

    const globalSettings = await GlobalSettings.findOne({ key: "global" }).lean();
    const globalBlockedDates = (globalSettings?.blockedDeliveryDates || []).map(
      (d: Date) => new Date(d).toISOString().split("T")[0]
    );

    const blockedDates = [...new Set([...cityBlockedDates, ...globalBlockedDates])];

    if (blockedDates.includes(todayIST)) {
      sameDayAvailable = false;
    }

    return Response.json({
      city: deliveryCity.city,
      state: deliveryCity.state,
      cutoffTime: deliveryCity.cutoffTime || null,
      blockedDates,
      sameDayAvailable,
      deliveryCharge: deliveryCity.baseCharge,
      freeDeliveryAbove: deliveryCity.freeDeliveryAbove || null,
      estimatedTime: deliveryCity.estimatedTime || null,
    });
  } catch (err) {
    console.error("GET /api/delivery-availability error:", err);
    return Response.json(
      { error: "Failed to check delivery availability" },
      { status: 500 }
    );
  }
}
