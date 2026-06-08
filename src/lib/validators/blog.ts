import { z } from "zod";

const optionalImageUrl = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.string().url("Featured image must be a valid URL").optional()
);

export const createBlogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  image: optionalImageUrl,
  author: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().default(false),
  seo: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })
    .optional(),
});

export const updateBlogSchema = createBlogSchema.partial();
