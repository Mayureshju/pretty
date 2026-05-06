import { z } from "zod";

export const quoteCategorySchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex code")
    .default("#737530"),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateQuoteCategorySchema = quoteCategorySchema.partial();

export type QuoteCategoryInput = z.infer<typeof quoteCategorySchema>;
