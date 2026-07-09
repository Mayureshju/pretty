import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { verifyOrderToken } from "@/lib/delivery-token";
import { dispatchStatusNotifications } from "@/lib/order-notifications";

// Statuses a delivery person is allowed to set from the link.
const ALLOWED_STATUSES = ["out-for-delivery", "delivered"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

function resolveOrderId(token: string): string | null {
  const orderId = verifyOrderToken(token);
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) return null;
  return orderId;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const orderId = resolveOrderId(token);
  if (!orderId) {
    return Response.json({ error: "Invalid or expired link" }, { status: 401 });
  }

  try {
    await connectDB();
    const order = await Order.findById(orderId)
      .select(
        "orderNumber status shipping deliverySlot items customer.name messageOnCard floristInstruction"
      )
      .lean<{
        orderNumber: string;
        status: string;
        shipping?: Record<string, unknown>;
        deliverySlot?: string;
        items?: { productName?: string; quantity: number }[];
        customer?: { name?: string };
        messageOnCard?: string;
        floristInstruction?: string;
      }>();

    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    return Response.json({
      orderNumber: order.orderNumber,
      status: order.status,
      deliverySlot: order.deliverySlot || null,
      receiverName: order.shipping?.receiverName || order.customer?.name || "",
      receiverPhone: order.shipping?.receiverPhone || "",
      address: order.shipping?.address || "",
      city: order.shipping?.city || "",
      state: order.shipping?.state || "",
      pincode: order.shipping?.pincode || "",
      messageOnCard: order.messageOnCard || "",
      floristInstruction: order.floristInstruction || "",
      items: (order.items || []).map((i) => ({
        name: i.productName || "Product",
        quantity: i.quantity,
      })),
    });
  } catch (err) {
    console.error("GET /api/delivery/[token] error:", err);
    return Response.json({ error: "Failed to load order" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const orderId = resolveOrderId(token);
  if (!orderId) {
    return Response.json({ error: "Invalid or expired link" }, { status: 401 });
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const status = body.status as AllowedStatus | undefined;
  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return Response.json(
      { error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const order = await Order.findById(orderId);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      note: "Updated via delivery link",
      timestamp: new Date(),
    });
    await order.save();

    // Same customer notifications as the admin flow (no seller "delivered").
    dispatchStatusNotifications(order, status);

    return Response.json({ ok: true, status: order.status });
  } catch (err) {
    console.error("POST /api/delivery/[token] error:", err);
    return Response.json({ error: "Failed to update status" }, { status: 500 });
  }
}
