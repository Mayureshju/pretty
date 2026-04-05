import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, handleAuthError, errorResponse } from "@/lib/auth";
import Banner from "@/models/Banner";
import { createBannerSchema } from "@/lib/validators/banner";

export async function GET() {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    await connectDB();

    const banners = await Banner.find().sort({ order: 1 }).lean();

    return Response.json({ banners });
  } catch (err) {
    console.error("GET /api/admin/banners error:", err);
    return errorResponse("Failed to fetch banners");
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
    const parsed = createBannerSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const banner = new Banner(parsed.data);
    await banner.save();

    return Response.json(banner, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/banners error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create banner";
    return errorResponse(message);
  }
}
