import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, handleAuthError, errorResponse } from "@/lib/auth";
import Quote from "@/models/Quote";
import { quoteSchema } from "@/lib/validators/quote";

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
    const category = searchParams.get("category") || "";

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.text = { $regex: search, $options: "i" };
    }
    if (category) {
      filter.category = category;
    }

    const [quotes, total] = await Promise.all([
      Quote.find(filter)
        .sort({ category: 1, order: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Quote.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit);

    return Response.json({ quotes, total, page, pages });
  } catch (err) {
    console.error("GET /api/admin/quotes error:", err);
    return errorResponse("Failed to fetch quotes");
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
    const parsed = quoteSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const quote = await Quote.create(parsed.data);
    return Response.json(quote, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/quotes error:", err);
    return errorResponse("Failed to create quote");
  }
}
