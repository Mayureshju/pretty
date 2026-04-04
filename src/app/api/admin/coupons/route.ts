import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, unauthorizedResponse, errorResponse } from "@/lib/auth";
import Coupon from "@/models/Coupon";
import { couponSchema } from "@/lib/validators/coupon";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorizedResponse();
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
  } catch {
    return unauthorizedResponse();
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

    const data = {
      ...parsed.data,
      code: parsed.data.code.toUpperCase(),
      validFrom: new Date(parsed.data.validFrom),
      validTo: new Date(parsed.data.validTo),
    };

    const coupon = await Coupon.create(data);
    return Response.json(coupon, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/coupons error:", err);
    return errorResponse("Failed to create coupon");
  }
}
