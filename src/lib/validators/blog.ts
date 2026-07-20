import { z } from "zod";

const optionalImageUrl = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.string().url("Featured image must be a valid URL").optional()
);

/**
 * A Plate/Slate document. The node shapes are validated by the editor's schema,
 * not here — this only guards the outer container so a malformed body cannot
 * reach the serializer.
 */
const slateDocument = z.array(z.record(z.string(), z.unknown())).optional();

export const createBlogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  // `content`/`excerpt` are derived server-side from the *Json fields; they are
  // still accepted so older clients keep working.
  content: z.string().optional(),
  excerpt: z.string().optional(),
  contentJson: slateDocument,
  excerptJson: slateDocument,
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
