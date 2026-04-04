import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  requireAdmin,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from "@/lib/auth";
import Coupon from "@/models/Coupon";
import { couponSchema } from "@/lib/validators/coupon";

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

    const coupon = await Coupon.findById(id).lean();
    if (!coupon) {
      return notFoundResponse("Coupon not found");
    }

    return Response.json(coupon);
  } catch (err) {
    console.error("GET /api/admin/coupons/[id] error:", err);
    return errorResponse("Failed to fetch coupon");
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
    const parsed = couponSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const data = {
      ...parsed.data,
      code: parsed.data.code.toUpperCase(),
      validFrom: new Date(parsed.data.validFrom),
      validTo: new Date(parsed.data.validTo),
    };

    const coupon = await Coupon.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return notFoundResponse("Coupon not found");
    }

    return Response.json(coupon);
  } catch (err) {
    console.error("PUT /api/admin/coupons/[id] error:", err);
    return errorResponse("Failed to update coupon");
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

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return notFoundResponse("Coupon not found");
    }

    return Response.json({ message: "Coupon deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/admin/coupons/[id] error:", err);
    return errorResponse("Failed to delete coupon");
  }
}
