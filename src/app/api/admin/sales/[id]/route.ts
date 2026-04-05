import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  requireAdmin,
  handleAuthError,
  notFoundResponse,
  errorResponse,
} from "@/lib/auth";
import Sale from "@/models/Sale";
import { updateSaleSchema } from "@/lib/validators/sale";

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

    const sale = await Sale.findById(id)
      .populate("categories", "name")
      .lean();

    if (!sale) {
      return notFoundResponse("Sale not found");
    }

    return Response.json(sale);
  } catch (err) {
    console.error("GET /api/admin/sales/[id] error:", err);
    return errorResponse("Failed to fetch sale");
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
    const parsed = updateSaleSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const data = {
      ...parsed.data,
      startDateTime: new Date(parsed.data.startDateTime),
      endDateTime: new Date(parsed.data.endDateTime),
    };

    const sale = await Sale.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate("categories", "name");

    if (!sale) {
      return notFoundResponse("Sale not found");
    }

    return Response.json(sale);
  } catch (err) {
    console.error("PUT /api/admin/sales/[id] error:", err);
    return errorResponse("Failed to update sale");
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

    const sale = await Sale.findByIdAndDelete(id);
    if (!sale) {
      return notFoundResponse("Sale not found");
    }

    return Response.json({ message: "Sale deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/admin/sales/[id] error:", err);
    return errorResponse("Failed to delete sale");
  }
}
