import { z } from "zod";

export const offerSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  description: z.string().default(""),
  highlight: z.string().default(""),
  code: z.string().default(""),
  icon: z
    .enum(["percent", "gift", "truck", "star", "tag"])
    .default("percent"),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  validFrom: z.string().optional().nullable(),
  validTo: z.string().optional().nullable(),
});

export const updateOfferSchema = offerSchema.partial();

export type OfferInput = z.infer<typeof offerSchema>;
