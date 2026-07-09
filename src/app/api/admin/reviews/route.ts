import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, handleAuthError, errorResponse } from "@/lib/auth";
import Review from "@/models/Review";
import "@/models/Product";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    await connectDB();
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));

    const filter: Record<string, unknown> = {};
    if (status === "approved") filter.isApproved = true;
    else if (status === "pending") filter.isApproved = false;
    else if (status === "low") filter.rating = { $lt: 3 };
    else if (status === "followup") filter.needsFollowUp = true;

    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("product", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    return Response.json({ reviews, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("GET /api/admin/reviews error:", err);
    return errorResponse("Failed to fetch reviews");
  }
}
