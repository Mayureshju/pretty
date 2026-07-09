import mongoose from "mongoose";
import Review from "@/models/Review";
import Product from "@/models/Product";

/**
 * Recompute a product's public rating from APPROVED website reviews (rating >= 3).
 * If the product has no such reviews yet, the existing (imported) metrics are left
 * untouched so we never zero-out legacy WooCommerce ratings.
 */
export async function recomputeProductRating(
  productId: string | mongoose.Types.ObjectId
): Promise<void> {
  const _id =
    typeof productId === "string"
      ? new mongoose.Types.ObjectId(productId)
      : productId;

  const agg = await Review.aggregate<{ avg: number; count: number }>([
    { $match: { product: _id, isApproved: true, rating: { $gte: 3 } } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  if (!agg.length || agg[0].count === 0) return;

  await Product.updateOne(
    { _id },
    {
      $set: {
        "metrics.averageRating": Math.round(agg[0].avg * 10) / 10,
        "metrics.ratingCount": agg[0].count,
      },
    }
  );
}
