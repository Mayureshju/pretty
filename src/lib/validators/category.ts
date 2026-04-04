import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().optional(),
  parent: z.string().optional().nullable(),
  order: z.number().default(0),
  isActive: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;
