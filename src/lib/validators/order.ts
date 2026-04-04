import { z } from "zod";

export const orderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "out-for-delivery",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  note: z.string().optional(),
});

export type OrderStatusInput = z.infer<typeof orderStatusSchema>;
