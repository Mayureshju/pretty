import { requireAuth, unauthorizedResponse, errorResponse } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    await connectDB();

    const orders = await Order.find({ "customer.clerkId": userId })
      .sort({ createdAt: -1 })
      .select("orderNumber status pricing items.name createdAt")
      .lean();

    return Response.json({ orders });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    return errorResponse();
  }
}
