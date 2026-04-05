import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  requireAdmin,
  handleAuthError,
  notFoundResponse,
  errorResponse,
} from "@/lib/auth";
import User from "@/models/User";

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
    await connectDB();

    const customer = await User.findById(id).lean();
    if (!customer) {
      return notFoundResponse("User not found");
    }

    return Response.json(customer);
  } catch (err) {
    console.error("GET /api/admin/customers/[id] error:", err);
    return errorResponse("Failed to fetch customer");
  }
}
