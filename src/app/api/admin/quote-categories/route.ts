import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireAdmin, handleAuthError, errorResponse } from "@/lib/auth";
import QuoteCategory from "@/models/QuoteCategory";
import { quoteCategorySchema } from "@/lib/validators/quoteCategory";

function revalidateQuotes() {
  revalidatePath("/quotes");
  revalidatePath("/sitemap.xml");
}

export async function GET() {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    await connectDB();

    const categories = await QuoteCategory.find()
      .sort({ order: 1, name: 1 })
      .lean();

    return Response.json({ categories });
  } catch (err) {
    console.error("GET /api/admin/quote-categories error:", err);
    return errorResponse("Failed to fetch quote categories");
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
    const parsed = quoteCategorySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await QuoteCategory.findOne({ name: parsed.data.name });
    if (existing) {
      return Response.json(
        { error: "A category with this name already exists" },
        { status: 409 }
      );
    }

    const category = await QuoteCategory.create(parsed.data);
    revalidateQuotes();

    return Response.json(category, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/quote-categories error:", err);
    return errorResponse("Failed to create quote category");
  }
}
