import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, unauthorizedResponse, errorResponse } from "@/lib/auth";
import Category from "@/models/Category";
import { categorySchema } from "@/lib/validators/category";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return unauthorizedResponse();
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
  } catch {
    return unauthorizedResponse();
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
    return Response.json(category, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/categories error:", err);
    return errorResponse("Failed to create category");
  }
}
