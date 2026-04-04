import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import "@/models/Category";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(48, Math.max(1, parseInt(searchParams.get("limit") || "24", 10)));
    const sort = searchParams.get("sort") || "popularity";

    const filter: Record<string, unknown> = { isActive: true };

    if (category) {
      filter.categories = category;
    }

    // Sort mapping
    let sortObj: Record<string, 1 | -1> = { order: 1, "metrics.totalSales": -1 };
    if (sort === "price-low") sortObj = { "pricing.currentPrice": 1 };
    else if (sort === "price-high") sortObj = { "pricing.currentPrice": -1 };
    else if (sort === "newest") sortObj = { createdAt: -1 };
    else if (sort === "rating") sortObj = { "metrics.averageRating": -1 };

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select("name slug pricing images metrics isFeatured")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return Response.json({
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET /api/products error:", err);
    return Response.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
