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

  // Prefer discounts over hikes; among discounts pick highest value
  const discounts = matching.filter((s) => (s.adjustmentDirection ?? "discount") === "discount");
  const pool = discounts.length > 0 ? discounts : matching;

  return pool.reduce((best, sale) => {
    if (!best) return sale;
    return sale.discountValue > best.discountValue ? sale : best;
  }, null as ISale | null);
}

/**
 * Compute the effective price for a product given a sale (supports both discount and hike).
 */
export function computeSalePrice(
  regularPrice: number,
  sale: ISale
): number {
  const direction = sale.adjustmentDirection ?? "discount";
  if (direction === "hike") {
    if (sale.discountType === "percentage") {
      return Math.round(regularPrice * (1 + sale.discountValue / 100));
    }
    return Math.round(regularPrice + sale.discountValue);
  }
  // discount
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
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  adjustmentDirection?: "discount" | "hike";
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
  const adjustedPrice = computeSalePrice(product.pricing.regularPrice, sale);
  const direction = sale.adjustmentDirection ?? "discount";
  // positive = discount, negative = hike
  const discountPercent = Math.round(
    ((product.pricing.regularPrice - adjustedPrice) / product.pricing.regularPrice) * 100
  );

  return {
    effectivePrice: adjustedPrice,
    originalPrice: product.pricing.regularPrice,
    saleLabel: sale.name,
    hasSale: true,
    discountPercent: direction === "hike" ? -Math.abs(discountPercent) : Math.abs(discountPercent),
    discountType: sale.discountType,
    discountValue: sale.discountValue,
    adjustmentDirection: direction,
  };
}
