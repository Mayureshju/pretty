import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireAdmin, handleAuthError, errorResponse } from "@/lib/auth";
import Category from "@/models/Category";
import { categorySchema } from "@/lib/validators/category";

export async function GET() {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    await connectDB();
    const categories = await Category.find()
      .populate("parent", "name")
      .sort({ order: 1 })
      .lean();

    return Response.json(categories);
  } catch (err) {
    console.error("GET /api/admin/categories error:", err);
    return errorResponse("Failed to fetch categories");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
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

    // Clean up empty optional fields
    if (!data.image) delete data.image;
    if (!data.parent) {
      data.parent = null;
    }

    const category = await Category.create(data);

    // Fresh categories affect the homepage listings and the sitemap
    // immediately, and the new URL itself must be prerendered.
    const populated = await Category.findById(category._id)
      .populate("parent", "slug")
      .lean<{ slug: string; parent?: { slug?: string } | null }>();
    if (populated) {
      const parentSlug = populated.parent?.slug;
      const path = parentSlug
        ? `/${parentSlug}/${populated.slug}`
        : `/${populated.slug}`;
      revalidatePath(path);
    }
    revalidatePath("/");
    revalidatePath("/sitemap.xml");

    return Response.json(category, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/categories error:", err);
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? (err as { code?: number }).code
        : undefined;
    if (code === 11000) {
      return Response.json(
        {
          error:
            "A category with this name already exists (same URL slug). Try a different name or edit the existing category.",
        },
        { status: 409 }
      );
    }
    return errorResponse("Failed to create category");
  }
}
