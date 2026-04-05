import { NextRequest } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin, handleAuthError, errorResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";

    const client = await clerkClient();

    const params: Parameters<typeof client.users.getUserList>[0] = {
      limit,
      offset: (page - 1) * limit,
      orderBy: "-created_at",
    };

    if (search) {
      params.query = search;
    }

    const { data: clerkUsers, totalCount } =
      await client.users.getUserList(params);

    const users = clerkUsers.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)
        ?.emailAddress,
      imageUrl: u.imageUrl,
      role: (u.publicMetadata as { role?: string })?.role || null,
      createdAt: u.createdAt,
    }));

    return Response.json({
      users,
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
    });
  } catch (err) {
    console.error("Failed to list users:", err);
    return errorResponse("Failed to list users");
  }
}
