import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, unauthorizedResponse, errorResponse } from "@/lib/auth";
import Customer from "@/models/Customer";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorizedResponse();
  }

  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get("limit") || "10", 10))
    );
    const search = searchParams.get("search") || "";

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { "name.first": { $regex: search, $options: "i" } },
        { "name.last": { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Customer.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit);

    return Response.json({ customers, total, page, pages });
  } catch (err) {
    console.error("GET /api/admin/customers error:", err);
    return errorResponse("Failed to fetch customers");
  }
}
