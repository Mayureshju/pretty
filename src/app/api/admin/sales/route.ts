import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, handleAuthError, errorResponse } from "@/lib/auth";
import Sale from "@/models/Sale";
import { createSaleSchema } from "@/lib/validators/sale";

export async function GET() {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    await connectDB();
    const sales = await Sale.find()
      .populate("categories", "name")
      .sort({ createdAt: -1 })
      .lean();

    return Response.json(sales);
  } catch (err) {
    console.error("GET /api/admin/sales error:", err);
    return errorResponse("Failed to fetch sales");
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
    const parsed = createSaleSchema.safeParse(body);

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

    const sale = await Sale.create(data);
    return Response.json(sale, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/sales error:", err);
    return errorResponse("Failed to create sale");
  }
}
