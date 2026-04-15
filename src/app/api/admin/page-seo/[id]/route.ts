import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  requireAdmin,
  handleAuthError,
  notFoundResponse,
  errorResponse,
} from "@/lib/auth";
import PageSeo from "@/models/PageSeo";
import { pageSeoSchema } from "@/lib/validators/page-seo";

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

    const page = await PageSeo.findById(id).lean();
    if (!page) {
      return notFoundResponse("Page SEO not found");
    }

    return Response.json(page);
  } catch (err) {
    console.error("GET /api/admin/page-seo/[id] error:", err);
    return errorResponse("Failed to fetch page SEO");
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
    const parsed = pageSeoSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const page = await PageSeo.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    });

    if (!page) {
      return notFoundResponse("Page SEO not found");
    }

    return Response.json(page);
  } catch (err) {
    console.error("PUT /api/admin/page-seo/[id] error:", err);
    return errorResponse("Failed to update page SEO");
  }
}
