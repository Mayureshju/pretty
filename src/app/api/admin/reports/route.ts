import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, handleAuthError, errorResponse } from "@/lib/auth";
import Order from "@/models/Order";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    const dateFilter: Record<string, unknown> = {};
    if (from) {
      dateFilter.$gte = new Date(from);
    }
    if (to) {
      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.$lte = endDate;
    }

    const matchStage: Record<string, unknown> = {};
    if (Object.keys(dateFilter).length > 0) {
      matchStage.createdAt = dateFilter;
    }

    // Revenue by day
    const revenueByDay = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$pricing.total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          revenue: 1,
          orders: 1,
        },
      },
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
        },
      },
    ]);

    // Top 10 products by sales
    const topProducts = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.productName" },
          salesCount: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.total" },
        },
      },
      { $sort: { salesCount: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          name: 1,
          salesCount: 1,
          revenue: 1,
        },
      },
    ]);

    // Total revenue and orders
    const totals = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$pricing.total" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = totals[0]?.totalRevenue || 0;
    const totalOrders = totals[0]?.totalOrders || 0;

    return Response.json({
      revenueByDay,
      ordersByStatus,
      topProducts,
      totalRevenue,
      totalOrders,
    });
  } catch (err) {
    console.error("GET /api/admin/reports error:", err);
    return errorResponse("Failed to generate report");
  }
}
