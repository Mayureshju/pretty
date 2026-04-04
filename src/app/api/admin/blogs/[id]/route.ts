import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  requireAdmin,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from "@/lib/auth";
import Blog from "@/models/Blog";
import { updateBlogSchema } from "@/lib/validators/blog";
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
      return notFoundResponse("Invalid blog ID");
    }

    const blog = await Blog.findById(id).lean();

    if (!blog) {
      return notFoundResponse("Blog not found");
    }

    return Response.json(blog);
  } catch (err) {
    console.error("GET /api/admin/blogs/[id] error:", err);
    return errorResponse("Failed to fetch blog");
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
      return notFoundResponse("Invalid blog ID");
    }

    const body = await request.json();
    const parsed = updateBlogSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Clean up empty image
    if (data.image === "") {
      (data as Record<string, unknown>).image = undefined;
    }

    const blog = await Blog.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!blog) {
      return notFoundResponse("Blog not found");
    }

    return Response.json(blog);
  } catch (err) {
    console.error("PUT /api/admin/blogs/[id] error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to update blog";
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
      return notFoundResponse("Invalid blog ID");
    }

    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return notFoundResponse("Blog not found");
    }

    return Response.json({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/admin/blogs/[id] error:", err);
    return errorResponse("Failed to delete blog");
  }
}
