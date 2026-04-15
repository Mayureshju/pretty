import { z } from "zod";

export const pageSeoSchema = z.object({
  metaTitle: z.string().default(""),
  metaDescription: z.string().default(""),
  ogTitle: z.string().default(""),
  ogDescription: z.string().default(""),
});

export type PageSeoInput = z.infer<typeof pageSeoSchema>;
