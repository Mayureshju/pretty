import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import {
  requireAdmin,
  handleAuthError,
  notFoundResponse,
  errorResponse,
} from "@/lib/auth";
import Order from "@/models/Order";
import { orderStatusSchema } from "@/lib/validators/order";
import {
  sendOutForDeliveryWhatsApp,
  sendDeliveredWhatsApp,
  sendOrderCancelledWhatsApp,
} from "@/lib/whatsapp";
import {
  sendOutForDeliveryEmail,
  sendDeliveredEmail,
} from "@/lib/email";

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
      return notFoundResponse("Invalid order ID");
    }

    await connectDB();

    let order = await Order.findById(id).lean();

    if (!order) {
      return notFoundResponse("Order not found");
    }

    // Populate product details only for items that have a valid product ref
    try {
      order = await Order.populate(order, {
        path: "items.product",
        select: "name images",
      });
    } catch {
      // Populate may fail for invalid refs, continue with raw data
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
  } catch (err) {
    return handleAuthError(err);
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

    // Send WhatsApp notification (fire-and-forget)
    const whatsappByStatus: Record<string, ((o: typeof order) => Promise<void>) | undefined> = {
      "out-for-delivery": sendOutForDeliveryWhatsApp,
      "delivered": sendDeliveredWhatsApp,
      "cancelled": sendOrderCancelledWhatsApp,
    };
    const whatsappFn = whatsappByStatus[parsed.data.status];
    if (whatsappFn) whatsappFn(order).catch(() => {});

    // Send customer email for delivery milestones (fire-and-forget)
    const emailByStatus: Record<string, ((o: typeof order) => Promise<void>) | undefined> = {
      "out-for-delivery": sendOutForDeliveryEmail,
      "delivered": sendDeliveredEmail,
    };
    const emailFn = emailByStatus[parsed.data.status];
    if (emailFn) emailFn(order).catch(() => {});

    return Response.json(order);
  } catch (err) {
    console.error("PUT /api/admin/orders/[id] error:", err);
    return errorResponse("Failed to update order status");
  }
}
