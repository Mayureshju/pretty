import { connectDB } from "@/lib/db";
import Coupon from "@/models/Coupon";

interface CouponResult {
  valid: boolean;
  discount: number;
  message: string;
  couponCode?: string;
}

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<CouponResult> {
  await connectDB();

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });

  if (!coupon) {
    return { valid: false, discount: 0, message: "Invalid coupon code" };
  }

  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validTo) {
    return { valid: false, discount: 0, message: "Coupon has expired" };
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, discount: 0, message: "Coupon usage limit reached" };
  }

  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      discount: 0,
      message: `Minimum order amount is ₹${coupon.minOrderAmount}`,
    };
  }

  let discount: number;
  if (coupon.type === "percentage") {
    discount = Math.round((subtotal * coupon.value) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.value;
  }

  // Discount cannot exceed subtotal
  if (discount > subtotal) {
    discount = subtotal;
  }

  return {
    valid: true,
    discount,
    message:
      coupon.type === "percentage"
        ? `${coupon.value}% off applied!`
        : `₹${coupon.value} off applied!`,
    couponCode: coupon.code,
  };
}
