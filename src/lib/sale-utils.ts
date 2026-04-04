import { connectDB } from "@/lib/db";
import Sale, { ISale } from "@/models/Sale";

/**
 * Fetch currently active sales (within date range and isActive).
 */
export async function getActiveSales(): Promise<ISale[]> {
  await connectDB();
  const now = new Date();
  return Sale.find({
    isActive: true,
    startDateTime: { $lte: now },
    endDateTime: { $gte: now },
  })
    .lean<ISale[]>();
}

/**
 * Find the best matching sale for a product's category.
 * Returns the sale with the highest effective discount.
 */
export function findMatchingSale(
  categoryIds: string[],
  activeSales: ISale[]
): ISale | null {
  if (activeSales.length === 0) return null;

  const matching = activeSales.filter((sale) => {
    if (sale.applyTo === "all") return true;
    if (categoryIds.length === 0) return false;
    return sale.categories.some((catId) =>
      categoryIds.some((cid) => cid === catId.toString())
    );
  });

  if (matching.length === 0) return null;

  // If multiple sales match, return the one with highest discount value
  // (for percentage: higher % wins, for fixed: higher amount wins)
  return matching.reduce((best, sale) => {
    if (!best) return sale;
    // Compare effective discount — simple heuristic: higher value wins
    // For mixed types, percentage generally wins for expensive items
    return sale.discountValue > best.discountValue ? sale : best;
  }, null as ISale | null);
}

/**
 * Compute the effective sale price for a product given active sales.
 */
export function computeSalePrice(
  regularPrice: number,
  sale: ISale
): number {
  if (sale.discountType === "percentage") {
    return Math.round(regularPrice * (1 - sale.discountValue / 100));
  }
  return Math.max(0, regularPrice - sale.discountValue);
}

/**
 * Apply active sales to a product and return augmented pricing info.
 */
export function applyActiveSale(
  product: {
    pricing: { regularPrice: number; salePrice?: number | null; currentPrice: number };
    categories?: ({ _id?: string } | string)[];
  },
  activeSales: ISale[]
): {
  effectivePrice: number;
  originalPrice: number;
  saleLabel: string | null;
  hasSale: boolean;
  discountPercent: number;
} {
  const categoryIds = (product.categories ?? [])
    .map((cat) => {
      if (typeof cat === "object" && cat) return cat._id?.toString();
      return cat?.toString();
    })
    .filter((id): id is string => !!id);

  const sale = findMatchingSale(categoryIds, activeSales);

  if (!sale) {
    const effectivePrice = product.pricing.currentPrice;
    const originalPrice = product.pricing.regularPrice;
    const hasSale = !!product.pricing.salePrice;
    const discountPercent = hasSale
      ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
      : 0;

    return {
      effectivePrice,
      originalPrice,
      saleLabel: null,
      hasSale,
      discountPercent,
    };
  }

  // Sale overrides existing sale price
  const salePrice = computeSalePrice(product.pricing.regularPrice, sale);
  const discountPercent = Math.round(
    ((product.pricing.regularPrice - salePrice) / product.pricing.regularPrice) * 100
  );

  return {
    effectivePrice: salePrice,
    originalPrice: product.pricing.regularPrice,
    saleLabel: sale.name,
    hasSale: true,
    discountPercent,
  };
}
