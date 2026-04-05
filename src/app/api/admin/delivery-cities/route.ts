import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, handleAuthError, errorResponse } from "@/lib/auth";
import DeliveryCity from "@/models/DeliveryCity";
import { deliveryCitySchema } from "@/lib/validators/delivery-city";

export async function GET() {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    await connectDB();
    const cities = await DeliveryCity.find().sort({ city: 1 }).lean();
    return Response.json(cities);
  } catch (err) {
    console.error("GET /api/admin/delivery-cities error:", err);
    return errorResponse("Failed to fetch delivery cities");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    const body = await request.json();
    const parsed = deliveryCitySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();
    const city = await DeliveryCity.create(parsed.data);
    return Response.json(city, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/delivery-cities error:", err);
    return errorResponse("Failed to create delivery city");
  }
}
