import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, handleAuthError, errorResponse } from "@/lib/auth";
import Product from "@/models/Product";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return Response.json(
        { error: "orderedIds must be a non-empty array" },
        { status: 400 }
      );
    }

    await connectDB();

    const operations = orderedIds.map((id: string, index: number) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index } },
      },
    }));

    await Product.bulkWrite(operations);

    return Response.json({ message: "Products reordered successfully" });
  } catch (err) {
    console.error("POST /api/admin/products/reorder error:", err);
    return errorResponse("Failed to reorder products");
  }
}
