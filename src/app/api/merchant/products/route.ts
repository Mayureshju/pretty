import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import "@/models/Category";
import { getActiveSales } from "@/lib/sale-utils";
import {
  getMerchantFeedConfig,
  toMerchantProductInputs,
  type MerchantProductSource,
} from "@/lib/google-merchant";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      1000,
      Math.max(1, parseInt(searchParams.get("limit") || "250", 10))
    );
    const skip = (page - 1) * limit;

    const filter = { isActive: true, isAddon: { $ne: true } };
    const config = getMerchantFeedConfig();

    const [docs, total, activeSales] = await Promise.all([
      Product.find(filter)
        .select(
          "name slug description shortDescription sku type pricing inventory images categories variants"
        )
        .populate({
          path: "categories",
          select: "name slug parent",
          populate: { path: "parent", select: "name slug" },
        })
        .sort({ order: 1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean<MerchantProductSource[]>(),
      Product.countDocuments(filter),
      getActiveSales(),
    ]);

    const products = docs.flatMap((product) =>
      toMerchantProductInputs(product, activeSales, config)
    );

    return Response.json({
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET /api/merchant/products error:", err);
    return Response.json({ error: "Failed to fetch merchant products" }, { status: 500 });
  }
}
