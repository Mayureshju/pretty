import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  requireAdmin,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from "@/lib/auth";
import Customer from "@/models/Customer";

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

    const customer = await Customer.findById(id).lean();
    if (!customer) {
      return notFoundResponse("Customer not found");
    }

    return Response.json(customer);
  } catch (err) {
    console.error("GET /api/admin/customers/[id] error:", err);
    return errorResponse("Failed to fetch customer");
  }
}
