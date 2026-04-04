import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  requireAdmin,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from "@/lib/auth";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { categorySchema } from "@/lib/validators/category";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    await connectDB();

    const category = await Category.findById(id)
      .populate("parent", "name")
      .lean();

    if (!category) {
      return notFoundResponse("Category not found");
    }

    return Response.json(category);
  } catch (err) {
    console.error("GET /api/admin/categories/[id] error:", err);
    return errorResponse("Failed to fetch category");
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
    const { id } = await params;
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const data = { ...parsed.data };
    if (!data.image) delete data.image;
    if (!data.parent) {
      data.parent = null;
    }

    const category = await Category.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate("parent", "name");

    if (!category) {
      return notFoundResponse("Category not found");
    }

    return Response.json(category);
  } catch (err) {
    console.error("PUT /api/admin/categories/[id] error:", err);
    return errorResponse("Failed to update category");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    await connectDB();

    // Check if category has products
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return Response.json(
        {
          error: `Cannot delete category. It has ${productCount} product(s) associated with it. Please reassign or remove them first.`,
        },
        { status: 400 }
      );
    }

    // Check if category has child categories
    const childCount = await Category.countDocuments({ parent: id });
    if (childCount > 0) {
      return Response.json(
        {
          error: `Cannot delete category. It has ${childCount} sub-category(ies). Please reassign or remove them first.`,
        },
        { status: 400 }
      );
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return notFoundResponse("Category not found");
    }

    return Response.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/admin/categories/[id] error:", err);
    return errorResponse("Failed to delete category");
  }
}
