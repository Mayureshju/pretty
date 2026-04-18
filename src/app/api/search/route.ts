import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import "@/models/Category";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(48, Math.max(1, parseInt(searchParams.get("limit") || "24", 10)));

    if (!q) {
      return Response.json({ products: [], total: 0, page: 1, pages: 0, query: "" });
    }

    const regex = new RegExp(escapeRegex(q), "i");
    const filter = {
      isActive: true,
      $or: [
        { name: regex },
        { shortDescription: regex },
        { tags: regex },
      ],
    };

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select("name slug pricing images metrics isFeatured categories")
        .sort({ "metrics.totalSales": -1, isFeatured: -1 })
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
      query: q,
    });
  } catch (err) {
    console.error("GET /api/search error:", err);
    return Response.json({ error: "Failed to search products" }, { status: 500 });
  }
}
