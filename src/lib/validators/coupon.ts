import { z } from "zod";

export const couponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").trim(),
  type: z.enum(["percentage", "fixed"], {
    error: "Coupon type is required",
  }),
  value: z.number().min(0, "Value must be positive"),
  description: z.string().default(""),
  termsAndConditions: z.string().default(""),
  isPubliclyVisible: z.boolean().default(true),
  minOrderAmount: z.number().min(0).default(0),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  perUserLimit: z.number().int().min(1).default(1),
  validFrom: z.string().min(1, "Valid from date is required"),
  validTo: z.string().min(1, "Valid to date is required"),
  isActive: z.boolean().default(true),
});

export type CouponInput = z.infer<typeof couponSchema>;
