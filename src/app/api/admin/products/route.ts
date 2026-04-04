import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, unauthorizedResponse, errorResponse } from "@/lib/auth";
import Product from "@/models/Product";
import { createProductSchema } from "@/lib/validators/product";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorizedResponse();
  }

  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10))
    );
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") === "asc" ? 1 : -1;

    // Build filter query
    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    } else if (status === "instock") {
      filter["inventory.stockStatus"] = "instock";
    } else if (status === "outofstock") {
      filter["inventory.stockStatus"] = "outofstock";
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort({ [sort]: order })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit);

    return Response.json({ products, total, page, pages });
  } catch (err) {
    console.error("GET /api/admin/products error:", err);
    return errorResponse("Failed to fetch products");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorizedResponse();
  }

  try {
    await connectDB();

    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Build product document
    const productData: Record<string, unknown> = {
      ...data,
      pricing: {
        regularPrice: data.pricing.regularPrice,
        salePrice: data.pricing.salePrice ?? undefined,
        currentPrice:
          data.pricing.salePrice ?? data.pricing.regularPrice,
      },
    };

    // Remove empty category
    if (!productData.category) {
      delete productData.category;
    }

    const product = new Product(productData);
    await product.save();

    // Populate category for response
    await product.populate("category", "name slug");

    return Response.json(product, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/products error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create product";
    return errorResponse(message);
  }
}
