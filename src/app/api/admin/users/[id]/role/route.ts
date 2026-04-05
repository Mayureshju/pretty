import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin, handleAuthError, errorResponse } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    const { id: targetUserId } = await params;
    const body = await request.json();
    const role = body.role; // "admin" | null

    if (role !== "admin" && role !== null) {
      return Response.json(
        { error: 'Invalid role. Use "admin" or null.' },
        { status: 400 }
      );
    }

    // Prevent self-demotion
    const { userId } = await auth();
    if (targetUserId === userId && role !== "admin") {
      return Response.json(
        { error: "You cannot remove your own admin role." },
        { status: 400 }
      );
    }

    // Update Clerk publicMetadata
    const client = await clerkClient();
    await client.users.updateUser(targetUserId, {
      publicMetadata: { role },
    });

    // Sync role to MongoDB (source of truth for admin layout check)
    await connectDB();
    const dbRole = role === "admin" ? "admin" : "member";
    await UserModel.findOneAndUpdate(
      { clerkId: targetUserId },
      { $set: { role: dbRole } }
    );

    return Response.json({ success: true, role });
  } catch (err) {
    console.error("Failed to update user role:", err);
    return errorResponse("Failed to update user role");
  }
}
