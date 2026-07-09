import { z } from "zod";

export const reviewSubmitSchema = z.object({
  productId: z.string().trim().min(1).optional(),
  orderNumber: z.string().trim().max(40).optional(),
  customerName: z.string().trim().min(2).max(80),
  customerEmail: z.string().trim().email().optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  comment: z.string().trim().max(2000).optional(),
  source: z.enum(["website", "offline"]).optional(),
});

export type ReviewSubmitInput = z.infer<typeof reviewSubmitSchema>;
