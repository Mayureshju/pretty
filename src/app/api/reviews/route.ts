import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
import { reviewSubmitSchema } from "@/lib/validators/review";
import { recomputeProductRating } from "@/lib/review-utils";

// Public visibility rule: only approved reviews with rating >= 3 are shown.
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = request.nextUrl;
    const product = searchParams.get("product");
    const featured = searchParams.get("featured") === "true";
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));

    const filter: Record<string, unknown> = { isApproved: true, rating: { $gte: 3 } };

    if (product) {
      if (!mongoose.Types.ObjectId.isValid(product)) {
        return Response.json({ reviews: [], total: 0, average: 0 });
      }
      filter.product = product;
    } else if (featured) {
      // Homepage testimonials: strongest, most recent reviews across the site.
      filter.rating = { $gte: 4 };
    }

    const [reviews, total, agg] = await Promise.all([
      Review.find(filter)
        .select("customerName rating title comment createdAt source")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
      product
        ? Review.aggregate<{ avg: number }>([
            {
              $match: {
                product: new mongoose.Types.ObjectId(product),
                isApproved: true,
                rating: { $gte: 3 },
              },
            },
            { $group: { _id: null, avg: { $avg: "$rating" } } },
          ])
        : Promise.resolve([]),
    ]);

    return Response.json({
      reviews,
      total,
      average: agg.length ? Math.round(agg[0].avg * 10) / 10 : 0,
    });
  } catch (err) {
    console.error("GET /api/reviews error:", err);
    return Response.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = reviewSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const { rating, productId, customerEmail, source, ...rest } = parsed.data;

    // Gating: rating >= 3 is public-eligible (auto-approved). rating < 3 is
    // stored for internal follow-up and never shown publicly.
    const isPublic = rating >= 3;

    const doc = await Review.create({
      ...rest,
      rating,
      product:
        productId && mongoose.Types.ObjectId.isValid(productId)
          ? productId
          : undefined,
      customerEmail: customerEmail || undefined,
      source: source || "website",
      isApproved: isPublic,
      needsFollowUp: !isPublic,
      isVerified: Boolean(rest.orderNumber),
    });

    // Keep product rating in sync when a public product review lands.
    if (isPublic && doc.product) {
      recomputeProductRating(String(doc.product)).catch((e) =>
        console.error("[reviews] recompute failed:", e)
      );
    }

    return Response.json(
      {
        ok: true,
        published: isPublic,
        message: isPublic
          ? "Thank you! Your review has been published."
          : "Thank you for your feedback. Our team will reach out to make things right.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/reviews error:", err);
    return Response.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
