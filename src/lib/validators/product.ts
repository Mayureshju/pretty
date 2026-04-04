import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
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
  category: z.string().optional(), // ObjectId as string
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
