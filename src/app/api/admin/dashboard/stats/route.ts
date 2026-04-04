import { connectDB } from "@/lib/db";
import { requireAdmin, unauthorizedResponse, errorResponse } from "@/lib/auth";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Customer from "@/models/Customer";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return unauthorizedResponse();
  }

  try {
    await connectDB();

    // Run all independent queries in parallel
    const [
      totalOrders,
      totalProducts,
      totalCustomers,
      revenueResult,
      recentOrders,
      ordersByStatus,
      revenueByDay,
      topProducts,
    ] = await Promise.all([
      // Total orders count
      Order.countDocuments(),

      // Total products count
      Product.countDocuments(),

      // Total customers count
      Customer.countDocuments(),

      // Total revenue
      Order.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$pricing.total" },
          },
        },
      ]),

      // Recent 10 orders
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("orderNumber customer.name pricing.total status createdAt")
        .lean(),

      // Orders grouped by status
      Order.aggregate([
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
      ]),

      // Revenue by day for last 30 days
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            revenue: { $sum: "$pricing.total" },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            revenue: 1,
          },
        },
      ]),

      // Top 5 products by total sales
      Product.find()
        .sort({ "metrics.totalSales": -1 })
        .limit(5)
        .select("name metrics.totalSales")
        .lean(),
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].total : 0;

    return Response.json({
      totalOrders,
      totalRevenue,
      totalProducts,
      totalCustomers,
      recentOrders,
      ordersByStatus,
      revenueByDay,
      topProducts,
    });
  } catch {
    return errorResponse();
  }
}
