import type { IProductVariant } from "@/models/Product";
import type { ISale } from "@/models/Sale";
import { htmlToPlainText } from "@/lib/plate-html";
import { getSiteBaseUrl } from "@/lib/review-links";
import { computeSalePrice, findMatchingSale } from "@/lib/sale-utils";

const TITLE_MAX = 150;
const DESCRIPTION_MAX = 5000;
const EXTRA_IMAGES_MAX = 10;

const TAXONOMY = {
  cakes: "2194",
  plants: "543558",
  flowers: "2899",
} as const;

export type MerchantAvailability =
  | "IN_STOCK"
  | "OUT_OF_STOCK"
  | "BACKORDER";

export type MerchantPrice = {
  amountMicros: string;
  currencyCode: string;
};

export type MerchantProductAttributes = {
  title: string;
  description: string;
  link: string;
  imageLink: string;
  additionalImageLinks?: string[];
  availability: MerchantAvailability;
  condition: "NEW";
  brand: string;
  mpn: string;
  price: MerchantPrice;
  salePrice?: MerchantPrice;
  googleProductCategory: string;
  productTypes?: string[];
  itemGroupId?: string;
};

export type MerchantProductInput = {
  offerId: string;
  contentLanguage: string;
  feedLabel: string;
  productAttributes: MerchantProductAttributes;
};

export type MerchantFeedConfig = {
  feedLabel: string;
  contentLanguage: string;
  currencyCode: string;
  brand: string;
  baseUrl: string;
};

type PopulatedCategory = {
  _id?: unknown;
  name?: string;
  slug?: string;
  parent?: { name?: string; slug?: string } | null;
};

export type MerchantProductSource = {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  type: "simple" | "variable";
  pricing: {
    regularPrice: number;
    salePrice?: number | null;
    currentPrice: number;
  };
  inventory: {
    stock: number;
    stockStatus: "instock" | "outofstock" | "onbackorder";
    trackStock: boolean;
  };
  images: { url: string; order?: number }[];
  categories?: (PopulatedCategory | string)[];
  variants?: IProductVariant[];
};

export function getMerchantFeedConfig(): MerchantFeedConfig {
  return {
    feedLabel: process.env.GOOGLE_MERCHANT_FEED_LABEL || "IN",
    contentLanguage: process.env.GOOGLE_MERCHANT_CONTENT_LANGUAGE || "en",
    currencyCode: process.env.GOOGLE_MERCHANT_CURRENCY || "INR",
    brand: process.env.GOOGLE_MERCHANT_BRAND || "Pretty Petals",
    baseUrl: getSiteBaseUrl(),
  };
}

export function toMerchantProductInputs(
  product: MerchantProductSource,
  activeSales: ISale[],
  config: MerchantFeedConfig = getMerchantFeedConfig()
): MerchantProductInput[] {
  if (product.type === "variable" && product.variants && product.variants.length > 0) {
    return product.variants.flatMap((variant, index) => {
      const offer = buildOffer(product, activeSales, config, variant, index);
      return offer ? [offer] : [];
    });
  }

  const offer = buildOffer(product, activeSales, config);
  return offer ? [offer] : [];
}

function buildOffer(
  product: MerchantProductSource,
  activeSales: ISale[],
  config: MerchantFeedConfig,
  variant?: IProductVariant,
  variantIndex = 0
): MerchantProductInput | null {
  const images = sortedImageUrls(product, variant);
  const imageLink = images[0];
  if (!imageLink) return null;

  const { price, salePrice } = resolvePricing(product, variant, activeSales);
  const sellingPrice = salePrice ?? price;
  if (sellingPrice <= 0) return null;

  const offerId = variant
    ? sanitizeOfferId(
        variant.sku || `${product.sku || product.slug}-${slugFragment(variant.label) || variantIndex}`
      )
    : sanitizeOfferId(product.sku || product.slug);
  if (!offerId) return null;

  const title = clip(
    variant ? `${product.name} - ${variant.label}` : product.name,
    TITLE_MAX
  );
  const description = clip(
    htmlToPlainText(variant?.shortDescription || product.description || product.shortDescription) ||
      product.name,
    DESCRIPTION_MAX
  );

  const additionalImageLinks = images.slice(1, EXTRA_IMAGES_MAX + 1);
  const attrs: MerchantProductAttributes = {
    title,
    description,
    link: `${config.baseUrl}/product/${product.slug}/`,
    imageLink,
    availability: resolveAvailability(product, variant),
    condition: "NEW",
    brand: config.brand,
    mpn: offerId,
    price: toMerchantPrice(price, config.currencyCode),
    googleProductCategory: googleProductCategory(product.categories),
  };

  if (additionalImageLinks.length > 0) {
    attrs.additionalImageLinks = additionalImageLinks;
  }
  if (salePrice != null && salePrice > 0 && salePrice < price) {
    attrs.salePrice = toMerchantPrice(salePrice, config.currencyCode);
  }
  const productTypes = categoryNames(product.categories);
  if (productTypes.length > 0) {
    attrs.productTypes = productTypes;
  }
  if (variant) {
    attrs.itemGroupId = product.slug;
  }

  return {
    offerId,
    contentLanguage: config.contentLanguage,
    feedLabel: config.feedLabel,
    productAttributes: attrs,
  };
}

function resolvePricing(
  product: MerchantProductSource,
  variant: IProductVariant | undefined,
  activeSales: ISale[]
): { price: number; salePrice?: number } {
  const regularPrice = variant ? variant.price : product.pricing.regularPrice;
  const ownSale = variant
    ? variant.salePrice
    : product.pricing.salePrice ?? undefined;

  const categoryIds = (product.categories ?? [])
    .map((cat) => {
      if (typeof cat === "object" && cat) return cat._id?.toString();
      return cat?.toString();
    })
    .filter((id): id is string => !!id);

  const sale = findMatchingSale(categoryIds, activeSales);
  if (sale) {
    const adjusted = computeSalePrice(regularPrice, sale);
    if ((sale.adjustmentDirection ?? "discount") === "hike") {
      return { price: adjusted };
    }
    if (adjusted < regularPrice) {
      return { price: regularPrice, salePrice: adjusted };
    }
    return { price: adjusted };
  }

  if (ownSale && ownSale > 0 && ownSale < regularPrice) {
    return { price: regularPrice, salePrice: ownSale };
  }

  if (variant) {
    return { price: ownSale && ownSale > 0 ? ownSale : regularPrice };
  }

  return { price: product.pricing.currentPrice || regularPrice };
}

function resolveAvailability(
  product: MerchantProductSource,
  variant?: IProductVariant
): MerchantAvailability {
  if (product.inventory.trackStock) {
    const stock = variant ? variant.stock : product.inventory.stock;
    if (stock <= 0) return "OUT_OF_STOCK";
  }

  if (product.inventory.stockStatus === "outofstock") return "OUT_OF_STOCK";
  if (product.inventory.stockStatus === "onbackorder") return "BACKORDER";
  return "IN_STOCK";
}

function toMerchantPrice(amount: number, currencyCode: string): MerchantPrice {
  return {
    amountMicros: String(Math.round(amount * 1_000_000)),
    currencyCode,
  };
}

function sortedImageUrls(
  product: MerchantProductSource,
  variant?: IProductVariant
): string[] {
  const urls: string[] = [];
  if (variant?.image) urls.push(variant.image);
  const rest = [...(product.images ?? [])]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((img) => img.url)
    .filter(Boolean);
  for (const url of rest) {
    if (!urls.includes(url)) urls.push(url);
  }
  return urls;
}

function googleProductCategory(categories: MerchantProductSource["categories"]): string {
  const slugs = collectSlugs(categories);
  if (slugs.some((s) => s.includes("cake"))) return TAXONOMY.cakes;
  if (slugs.some((s) => s.includes("plant"))) return TAXONOMY.plants;
  return TAXONOMY.flowers;
}

function collectSlugs(categories: MerchantProductSource["categories"]): string[] {
  const slugs: string[] = [];
  for (const cat of categories ?? []) {
    if (typeof cat === "string") {
      slugs.push(cat.toLowerCase());
      continue;
    }
    if (cat?.slug) slugs.push(cat.slug.toLowerCase());
    if (cat?.parent?.slug) slugs.push(cat.parent.slug.toLowerCase());
  }
  return slugs;
}

function categoryNames(categories: MerchantProductSource["categories"]): string[] {
  const names: string[] = [];
  for (const cat of categories ?? []) {
    if (typeof cat === "string") continue;
    const name = cat?.name?.trim();
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

function sanitizeOfferId(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._~-]/g, "")
    .slice(0, 50);
}

function slugFragment(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function clip(value: string, max: number): string {
  if (value.length <= max) return value;
  return value.slice(0, max - 1).trimEnd() + "…";
}
