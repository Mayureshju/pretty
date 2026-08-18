import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import {
  requireAdmin,
  handleAuthError,
  notFoundResponse,
  errorResponse,
} from "@/lib/auth";
import Coupon from "@/models/Coupon";
import { couponSchema } from "@/lib/validators/coupon";
import { couponDateFields } from "@/lib/coupon-dates";
import { isDuplicateKeyError } from "@/lib/api-client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
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
  } catch (err) {
    return handleAuthError(err);
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

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      couponDateFields(parsed.data),
      {
        new: true,
        runValidators: true,
      }
    );

    if (!coupon) {
      return notFoundResponse("Coupon not found");
    }

    revalidatePath("/offers");
    return Response.json(coupon);
  } catch (err) {
    console.error("PUT /api/admin/coupons/[id] error:", err);
    if (isDuplicateKeyError(err)) {
      return Response.json(
        { error: "Coupon code already exists" },
        { status: 409 }
      );
    }
    return errorResponse("Failed to update coupon");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    const { id } = await params;
    await connectDB();

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return notFoundResponse("Coupon not found");
    }

    revalidatePath("/offers");
    return Response.json({ message: "Coupon deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/admin/coupons/[id] error:", err);
    return errorResponse("Failed to delete coupon");
  }
}
