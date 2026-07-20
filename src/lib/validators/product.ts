import { z } from "zod";

/**
 * A Plate/Slate document. The node shapes are validated by the editor's schema,
 * not here — this only guards the outer container so a malformed body cannot
 * reach the serializer.
 */
const slateDocument = z.array(z.record(z.string(), z.unknown())).optional();

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  // `description`/`shortDescription` are derived server-side from the *Json
  // fields; they are still accepted so older clients keep working.
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  descriptionJson: slateDocument,
  shortDescriptionJson: slateDocument,
  sku: z.string().optional(),
  type: z.enum(["simple", "variable"]).default("simple"),
  pricing: z.object({
    regularPrice: z.number().min(0, "Price must be positive"),
    salePrice: z.number().min(0).optional().nullable(),
  }),
  inventory: z
    .object({
      stock: z.number().int().min(0).default(0),
      stockStatus: z
        .enum(["instock", "outofstock", "onbackorder"])
        .default("instock"),
      trackStock: z.boolean().default(false),
    })
    .optional(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().optional(),
        order: z.number().default(0),
      })
    )
    .optional(),
  categories: z.array(z.string()).optional(), // ObjectId strings
  tags: z.array(z.string()).optional(),
  variants: z
    .array(
      z.object({
        label: z.string(),
        sku: z.string().optional(),
        price: z.number().min(0),
        salePrice: z.number().min(0).optional().nullable(),
        image: z.string().optional(),
        stock: z.number().int().min(0).default(0),
        shortDescription: z.string().optional(),
      })
    )
    .optional(),
  addons: z
    .array(
      z.object({
        name: z.string(),
        price: z.number().min(0),
        image: z.string().optional(),
      })
    )
    .optional(),
  seo: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })
    .optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isAddon: z.boolean().default(false),
  deliveryInfo: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();
