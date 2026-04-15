import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  requireAdmin,
  handleAuthError,
  notFoundResponse,
  errorResponse,
} from "@/lib/auth";
import FAQ from "@/models/FAQ";
import { updateFaqSchema } from "@/lib/validators/faq";

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

    const faq = await FAQ.findById(id).lean();
    if (!faq) {
      return notFoundResponse("FAQ not found");
    }

    return Response.json(faq);
  } catch (err) {
    console.error("GET /api/admin/faqs/[id] error:", err);
    return errorResponse("Failed to fetch FAQ");
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
    const parsed = updateFaqSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const faq = await FAQ.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    });

    if (!faq) {
      return notFoundResponse("FAQ not found");
    }

    return Response.json(faq);
  } catch (err) {
    console.error("PUT /api/admin/faqs/[id] error:", err);
    return errorResponse("Failed to update FAQ");
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

    const faq = await FAQ.findByIdAndDelete(id);
    if (!faq) {
      return notFoundResponse("FAQ not found");
    }

    return Response.json({ message: "FAQ deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/admin/faqs/[id] error:", err);
    return errorResponse("Failed to delete FAQ");
  }
}
