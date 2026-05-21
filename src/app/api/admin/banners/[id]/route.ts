import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { revalidateHomeBanner } from "@/lib/revalidate-banner";
import {
  requireAdmin,
  handleAuthError,
  notFoundResponse,
  errorResponse,
} from "@/lib/auth";
import Banner from "@/models/Banner";
import { updateBannerSchema } from "@/lib/validators/banner";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return notFoundResponse("Invalid banner ID");
    }

    const banner = await Banner.findById(id).lean();

    if (!banner) {
      return notFoundResponse("Banner not found");
    }

    return Response.json(banner);
  } catch (err) {
    console.error("GET /api/admin/banners/[id] error:", err);
    return errorResponse("Failed to fetch banner");
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
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return notFoundResponse("Invalid banner ID");
    }

    const body = await request.json();
    const parsed = updateBannerSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = { ...parsed.data };
    if (Object.prototype.hasOwnProperty.call(body, "mobileImage")) {
      const raw = body.mobileImage;
      update.mobileImage =
        raw === null || raw === ""
          ? null
          : (parsed.data.mobileImage as string | undefined) ?? raw;
    }

    const banner = await Banner.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!banner) {
      return notFoundResponse("Banner not found");
    }

    revalidateHomeBanner();

    return Response.json(banner);
  } catch (err) {
    console.error("PUT /api/admin/banners/[id] error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to update banner";
    return errorResponse(message);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return notFoundResponse("Invalid banner ID");
    }

    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
      return notFoundResponse("Banner not found");
    }

    revalidateHomeBanner();

    return Response.json({ message: "Banner deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/admin/banners/[id] error:", err);
    return errorResponse("Failed to delete banner");
  }
}
