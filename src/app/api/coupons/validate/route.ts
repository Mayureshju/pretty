import { NextRequest } from "next/server";
import { validateCoupon } from "@/lib/coupon-validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal } = body;

    if (!code || typeof subtotal !== "number") {
      return Response.json(
        { error: "Code and subtotal are required" },
        { status: 400 }
      );
    }

    const result = await validateCoupon(code, subtotal);
    return Response.json(result);
  } catch (err) {
    console.error("POST /api/coupons/validate error:", err);
    return Response.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
