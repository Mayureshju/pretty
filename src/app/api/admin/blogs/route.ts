import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireAdmin, handleAuthError, errorResponse } from "@/lib/auth";
import Blog from "@/models/Blog";
import { createBlogSchema } from "@/lib/validators/blog";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
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
    const status = searchParams.get("status") || "";

    // Build filter query
    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    if (status === "published") {
      filter.isPublished = true;
    } else if (status === "draft") {
      filter.isPublished = false;
    }

    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit);

    return Response.json({ blogs, total, page, pages });
  } catch (err) {
    console.error("GET /api/admin/blogs error:", err);
    return errorResponse("Failed to fetch blogs");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    await connectDB();

    const body = await request.json();
    const parsed = createBlogSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Clean up empty image
    if (data.image === "") {
      data.image = undefined;
    }

    const blog = new Blog(data);
    await blog.save();

    // Prerender the new blog URL and refresh the listings / sitemap.
    revalidatePath(`/${blog.slug}`);
    revalidatePath("/blog");
    revalidatePath("/sitemap.xml");

    return Response.json(blog, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/blogs error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create blog";
    return errorResponse(message);
  }
}
