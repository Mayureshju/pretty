import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import {
  requireAdmin,
  handleAuthError,
  notFoundResponse,
  errorResponse,
} from "@/lib/auth";
import Review from "@/models/Review";
import { recomputeProductRating } from "@/lib/review-utils";

export async function PATCH(
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return notFoundResponse("Invalid review ID");
    }

    const body = await request.json();
    await connectDB();

    const review = await Review.findById(id);
    if (!review) return notFoundResponse("Review not found");

    if (typeof body.isApproved === "boolean") {
      // Never allow publishing a sub-3-star review.
      review.isApproved = body.isApproved && review.rating >= 3;
      if (review.isApproved) review.needsFollowUp = false;
    }
    if (typeof body.needsFollowUp === "boolean") {
      review.needsFollowUp = body.needsFollowUp;
    }

    await review.save();

    if (review.product) {
      await recomputeProductRating(String(review.product));
    }

    return Response.json(review);
  } catch (err) {
    console.error("PATCH /api/admin/reviews/[id] error:", err);
    return errorResponse("Failed to update review");
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return notFoundResponse("Invalid review ID");
    }

    await connectDB();
    const review = await Review.findByIdAndDelete(id);
    if (!review) return notFoundResponse("Review not found");

    if (review.product) {
      await recomputeProductRating(String(review.product));
    }

    return Response.json({ message: "Review deleted" });
  } catch (err) {
    console.error("DELETE /api/admin/reviews/[id] error:", err);
    return errorResponse("Failed to delete review");
  }
}
