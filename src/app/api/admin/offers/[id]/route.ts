import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  requireAdmin,
  handleAuthError,
  notFoundResponse,
  errorResponse,
} from "@/lib/auth";
import Offer from "@/models/Offer";
import { updateOfferSchema } from "@/lib/validators/offer";

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

    const offer = await Offer.findById(id).lean();
    if (!offer) {
      return notFoundResponse("Offer not found");
    }

    return Response.json(offer);
  } catch (err) {
    console.error("GET /api/admin/offers/[id] error:", err);
    return errorResponse("Failed to fetch offer");
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
    const parsed = updateOfferSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.code !== undefined) {
      data.code = parsed.data.code ? parsed.data.code.toUpperCase() : "";
    }
    if (parsed.data.validFrom !== undefined) {
      data.validFrom = parsed.data.validFrom ? new Date(parsed.data.validFrom) : null;
    }
    if (parsed.data.validTo !== undefined) {
      data.validTo = parsed.data.validTo ? new Date(parsed.data.validTo) : null;
    }

    const offer = await Offer.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!offer) {
      return notFoundResponse("Offer not found");
    }

    return Response.json(offer);
  } catch (err) {
    console.error("PUT /api/admin/offers/[id] error:", err);
    return errorResponse("Failed to update offer");
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

    const offer = await Offer.findByIdAndDelete(id);
    if (!offer) {
      return notFoundResponse("Offer not found");
    }

    return Response.json({ message: "Offer deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/admin/offers/[id] error:", err);
    return errorResponse("Failed to delete offer");
  }
}
