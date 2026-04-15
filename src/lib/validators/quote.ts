import { z } from "zod";

export const quoteSchema = z.object({
  text: z.string().min(1, "Quote text is required"),
  author: z.string().default(""),
  category: z.string().min(1, "Category is required"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex code")
    .default("#737530"),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateQuoteSchema = quoteSchema.partial();

export type QuoteInput = z.infer<typeof quoteSchema>;
