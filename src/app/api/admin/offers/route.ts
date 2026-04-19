import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, handleAuthError, errorResponse } from "@/lib/auth";
import Offer from "@/models/Offer";
import { offerSchema } from "@/lib/validators/offer";

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
    const limit = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get("limit") || "10", 10))
    );
    const search = searchParams.get("search") || "";

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const [offers, total] = await Promise.all([
      Offer.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Offer.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit);
    return Response.json({ offers, total, page, pages });
  } catch (err) {
    console.error("GET /api/admin/offers error:", err);
    return errorResponse("Failed to fetch offers");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    const body = await request.json();
    const parsed = offerSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const data: Record<string, unknown> = {
      ...parsed.data,
      code: parsed.data.code ? parsed.data.code.toUpperCase() : "",
    };
    if (parsed.data.validFrom) data.validFrom = new Date(parsed.data.validFrom);
    if (parsed.data.validTo) data.validTo = new Date(parsed.data.validTo);

    const offer = await Offer.create(data);
    return Response.json(offer, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/offers error:", err);
    return errorResponse("Failed to create offer");
  }
}
