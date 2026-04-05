import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const order = await Order.findById(id)
      .select(
        "orderNumber customer items shipping deliverySlot pricing payment status invoice createdAt"
      )
      .lean();

    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    return Response.json(order);
  } catch (err) {
    console.error("GET /api/orders/[id] error:", err);
    return Response.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
