import { connectDB } from "@/lib/db";
import Coupon from "@/models/Coupon";

export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      isPubliclyVisible: true,
      validFrom: { $lte: now },
      validTo: { $gte: now },
    })
      .select("code type value description termsAndConditions minOrderAmount maxDiscount validFrom validTo")
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({ coupons });
  } catch (err) {
    console.error("GET /api/coupons error:", err);
    return Response.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}
