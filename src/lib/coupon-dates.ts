import type { CouponInput } from "@/lib/validators/coupon";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Start of the calendar day in IST (UTC+5:30). */
export function couponValidFrom(dateStr: string): Date {
  if (DATE_ONLY.test(dateStr)) {
    return new Date(`${dateStr}T00:00:00.000+05:30`);
  }
  return new Date(dateStr);
}

/** Inclusive end of the calendar day in IST (UTC+5:30). */
export function couponValidTo(dateStr: string): Date {
  if (DATE_ONLY.test(dateStr)) {
    return new Date(`${dateStr}T23:59:59.999+05:30`);
  }
  return new Date(dateStr);
}

export function couponDateFields(data: CouponInput) {
  return {
    ...data,
    code: data.code.toUpperCase(),
    validFrom: couponValidFrom(data.validFrom),
    validTo: couponValidTo(data.validTo),
  };
}
