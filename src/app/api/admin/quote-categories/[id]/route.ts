import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import {
  requireAdmin,
  handleAuthError,
  notFoundResponse,
  errorResponse,
} from "@/lib/auth";
import QuoteCategory from "@/models/QuoteCategory";
import Quote from "@/models/Quote";
import { updateQuoteCategorySchema } from "@/lib/validators/quoteCategory";
import mongoose from "mongoose";

function revalidateQuotes() {
  revalidatePath("/quotes");
  revalidatePath("/sitemap.xml");
}

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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return notFoundResponse("Invalid category ID");
    }

    await connectDB();

    const category = await QuoteCategory.findById(id).lean();
    if (!category) {
      return notFoundResponse("Quote category not found");
    }

    return Response.json(category);
  } catch (err) {
    console.error("GET /api/admin/quote-categories/[id] error:", err);
    return errorResponse("Failed to fetch quote category");
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return notFoundResponse("Invalid category ID");
    }

    const body = await request.json();
    const parsed = updateQuoteCategorySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const before = await QuoteCategory.findById(id)
      .select("name")
      .lean<{ name: string }>();
    if (!before) {
      return notFoundResponse("Quote category not found");
    }

    if (parsed.data.name && parsed.data.name !== before.name) {
      const collision = await QuoteCategory.findOne({
        name: parsed.data.name,
        _id: { $ne: id },
      });
      if (collision) {
        return Response.json(
          { error: "A category with this name already exists" },
          { status: 409 }
        );
      }
    }

    const category = await QuoteCategory.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return notFoundResponse("Quote category not found");
    }

    // Propagate rename to existing quotes so they stay attached.
    if (parsed.data.name && parsed.data.name !== before.name) {
      await Quote.updateMany(
        { category: before.name },
        { category: parsed.data.name }
      );
    }

    revalidateQuotes();

    return Response.json(category);
  } catch (err) {
    console.error("PUT /api/admin/quote-categories/[id] error:", err);
    return errorResponse("Failed to update quote category");
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
      return notFoundResponse("Invalid category ID");
    }

    await connectDB();

    const category = await QuoteCategory.findById(id);
    if (!category) {
      return notFoundResponse("Quote category not found");
    }

    const inUse = await Quote.countDocuments({ category: category.name });
    if (inUse > 0) {
      return Response.json(
        {
          error: `Reassign or delete the ${inUse} quote${inUse === 1 ? "" : "s"} in this category first.`,
        },
        { status: 409 }
      );
    }

    await category.deleteOne();
    revalidateQuotes();

    return Response.json({ message: "Quote category deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/admin/quote-categories/[id] error:", err);
    return errorResponse("Failed to delete quote category");
  }
}
