import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireAdmin, handleAuthError, errorResponse } from "@/lib/auth";
import Coupon from "@/models/Coupon";
import { couponSchema } from "@/lib/validators/coupon";
import { couponDateFields } from "@/lib/coupon-dates";
import { isDuplicateKeyError } from "@/lib/api-client";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get("limit") || "10", 10))
    );

    const [coupons, total] = await Promise.all([
      Coupon.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Coupon.countDocuments(),
    ]);

    const pages = Math.ceil(total / limit);

    return Response.json({ coupons, total, page, pages });
  } catch (err) {
    console.error("GET /api/admin/coupons error:", err);
    return errorResponse("Failed to fetch coupons");
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
    const parsed = couponSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const coupon = await Coupon.create(couponDateFields(parsed.data));
    revalidatePath("/offers");
    return Response.json(coupon, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/coupons error:", err);
    if (isDuplicateKeyError(err)) {
      return Response.json(
        { error: "Coupon code already exists" },
        { status: 409 }
      );
    }
    return errorResponse("Failed to create coupon");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    const body = await request.json().catch(() => ({}));
    if (
      !body ||
      typeof body !== "object" ||
      (body as { confirm?: unknown }).confirm !== "DELETE_ALL"
    ) {
      return Response.json(
        { error: 'Confirmation required. Send { "confirm": "DELETE_ALL" }.' },
        { status: 400 }
      );
    }

    await connectDB();
    const result = await Coupon.deleteMany({});
    revalidatePath("/offers");
    return Response.json({
      message: "All coupons deleted",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("DELETE /api/admin/coupons error:", err);
    return errorResponse("Failed to delete coupons");
  }
}
