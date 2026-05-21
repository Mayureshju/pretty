import { z } from "zod";

export const createBannerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  tag: z.string().optional(),
  subtitle: z.string().optional(),
  image: z.string().url("Image must be a valid URL"),
  mobileImage: z
    .union([z.string().url("Must be a valid URL"), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v === null ? undefined : v)),
  link: z.string().optional(),
  position: z.enum(["hero", "sidebar", "popup"]).default("hero"),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().optional().or(z.date().optional()),
  endDate: z.string().optional().or(z.date().optional()),
});

export const updateBannerSchema = createBannerSchema.partial();
