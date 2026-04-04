import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  requireAdmin,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from "@/lib/auth";
import Product from "@/models/Product";
import "@/models/Category"; // Register Category model for populate
import { updateProductSchema } from "@/lib/validators/product";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorizedResponse();
  }

  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return notFoundResponse("Invalid product ID");
    }

    const product = await Product.findById(id)
      .populate("categories", "name slug")
      .lean();

    if (!product) {
      return notFoundResponse("Product not found");
    }

    return Response.json(product);
  } catch (err) {
    console.error("GET /api/admin/products/[id] error:", err);
    return errorResponse("Failed to fetch product");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorizedResponse();
  }

  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return notFoundResponse("Invalid product ID");
    }

    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // If pricing is updated, recalculate currentPrice
    if (data.pricing) {
      const existing = await Product.findById(id).lean();
      if (!existing) {
        return notFoundResponse("Product not found");
      }

      const regularPrice =
        data.pricing.regularPrice ?? existing.pricing.regularPrice;
      const salePrice =
        data.pricing.salePrice !== undefined
          ? data.pricing.salePrice
          : existing.pricing.salePrice;

      (data as Record<string, unknown>).pricing = {
        ...data.pricing,
        regularPrice,
        salePrice: salePrice ?? undefined,
        currentPrice: salePrice ?? regularPrice,
      };
    }

    // Handle empty categories
    if (data.categories && (data.categories as string[]).length === 0) {
      (data as Record<string, unknown>).categories = [];
    }

    const product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate("categories", "name slug");

    if (!product) {
      return notFoundResponse("Product not found");
    }

    return Response.json(product);
  } catch (err) {
    console.error("PUT /api/admin/products/[id] error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to update product";
    return errorResponse(message);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorizedResponse();
  }

  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return notFoundResponse("Invalid product ID");
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return notFoundResponse("Product not found");
    }

    return Response.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/admin/products/[id] error:", err);
    return errorResponse("Failed to delete product");
  }
}
