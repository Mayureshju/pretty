import { z } from "zod";

export const pincodeSchema = z.object({
  code: z.string().min(1, "Pincode is required").trim(),
  deliveryDays: z.number().int().min(0).default(0),
  codAvailable: z.boolean().default(true),
});

export const deliveryCitySchema = z.object({
  city: z.string().min(1, "City name is required").trim(),
  state: z.string().optional(),
  pincodes: z.array(pincodeSchema).default([]),
  baseCharge: z.number().min(0, "Base charge must be positive").default(0),
  freeDeliveryAbove: z.number().min(0).optional(),
  isActive: z.boolean().default(true),
  estimatedTime: z.string().optional(),
  cutoffTime: z.string().optional(),
  blockedDates: z.array(z.string()).optional(),
});

export type DeliveryCityInput = z.infer<typeof deliveryCitySchema>;
