import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  requireAdmin,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from "@/lib/auth";
import DeliveryCity from "@/models/DeliveryCity";
import { deliveryCitySchema } from "@/lib/validators/delivery-city";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    await connectDB();

    const city = await DeliveryCity.findById(id).lean();
    if (!city) {
      return notFoundResponse("Delivery city not found");
    }

    return Response.json(city);
  } catch (err) {
    console.error("GET /api/admin/delivery-cities/[id] error:", err);
    return errorResponse("Failed to fetch delivery city");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = deliveryCitySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const city = await DeliveryCity.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    });

    if (!city) {
      return notFoundResponse("Delivery city not found");
    }

    return Response.json(city);
  } catch (err) {
    console.error("PUT /api/admin/delivery-cities/[id] error:", err);
    return errorResponse("Failed to update delivery city");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    await connectDB();

    const city = await DeliveryCity.findByIdAndDelete(id);
    if (!city) {
      return notFoundResponse("Delivery city not found");
    }

    return Response.json({ message: "Delivery city deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/admin/delivery-cities/[id] error:", err);
    return errorResponse("Failed to delete delivery city");
  }
}
