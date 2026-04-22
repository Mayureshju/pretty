import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import {
  requireAdmin,
  handleAuthError,
  notFoundResponse,
  errorResponse,
} from "@/lib/auth";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { categorySchema } from "@/lib/validators/category";

// Revalidate every storefront surface that could be showing this category.
// Covers: listing pages (parent/child or standalone), the homepage (which
// lists categories), and the sitemap.
async function revalidateCategory(cat: {
  slug: string;
  parent?: { slug?: string } | string | null;
}) {
  const parentSlug =
    cat.parent && typeof cat.parent === "object" && "slug" in cat.parent
      ? cat.parent.slug
      : null;

  const path = parentSlug ? `/${parentSlug}/${cat.slug}` : `/${cat.slug}`;
  revalidatePath(path);
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
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
  } catch (err) {
    return handleAuthError(err);
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

    // Capture pre-update slug/parent so we can revalidate the old URL too if
    // either changed.
    const before = await Category.findById(id)
      .populate("parent", "slug")
      .lean<{ slug: string; parent?: { slug?: string } | null }>();

    const category = await Category.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate("parent", "name slug");

    if (!category) {
      return notFoundResponse("Category not found");
    }

    if (before) await revalidateCategory(before);
    await revalidateCategory(category);

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
  } catch (err) {
    return handleAuthError(err);
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

    const category = await Category.findByIdAndDelete(id).populate(
      "parent",
      "slug"
    );
    if (!category) {
      return notFoundResponse("Category not found");
    }

    await revalidateCategory(
      category as unknown as { slug: string; parent?: { slug?: string } | null }
    );

    return Response.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/admin/categories/[id] error:", err);
    return errorResponse("Failed to delete category");
  }
}
