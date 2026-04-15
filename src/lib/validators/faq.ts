import { z } from "zod";

export const faqSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  category: z.string().min(1, "Category is required").default("General"),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateFaqSchema = faqSchema.partial();

export type FAQInput = z.infer<typeof faqSchema>;
