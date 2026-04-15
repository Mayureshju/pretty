import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  requireAdmin,
  handleAuthError,
  notFoundResponse,
  errorResponse,
} from "@/lib/auth";
import Quote from "@/models/Quote";
import { updateQuoteSchema } from "@/lib/validators/quote";

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

    const quote = await Quote.findById(id).lean();
    if (!quote) {
      return notFoundResponse("Quote not found");
    }

    return Response.json(quote);
  } catch (err) {
    console.error("GET /api/admin/quotes/[id] error:", err);
    return errorResponse("Failed to fetch quote");
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
    const parsed = updateQuoteSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const quote = await Quote.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    });

    if (!quote) {
      return notFoundResponse("Quote not found");
    }

    return Response.json(quote);
  } catch (err) {
    console.error("PUT /api/admin/quotes/[id] error:", err);
    return errorResponse("Failed to update quote");
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

    const quote = await Quote.findByIdAndDelete(id);
    if (!quote) {
      return notFoundResponse("Quote not found");
    }

    return Response.json({ message: "Quote deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/admin/quotes/[id] error:", err);
    return errorResponse("Failed to delete quote");
  }
}
