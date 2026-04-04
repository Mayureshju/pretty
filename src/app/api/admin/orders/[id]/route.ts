import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  requireAdmin,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from "@/lib/auth";
import Order from "@/models/Order";
import { orderStatusSchema } from "@/lib/validators/order";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    await connectDB();

    const order = await Order.findById(id)
      .populate("items.product", "name images")
      .lean();

    if (!order) {
      return notFoundResponse("Order not found");
    }

    return Response.json(order);
  } catch (err) {
    console.error("GET /api/admin/orders/[id] error:", err);
    return errorResponse("Failed to fetch order");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = orderStatusSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const order = await Order.findById(id);
    if (!order) {
      return notFoundResponse("Order not found");
    }

    order.status = parsed.data.status;
    order.statusHistory.push({
      status: parsed.data.status,
      note: parsed.data.note,
      timestamp: new Date(),
    });

    await order.save();

    return Response.json(order);
  } catch (err) {
    console.error("PUT /api/admin/orders/[id] error:", err);
    return errorResponse("Failed to update order status");
  }
}
