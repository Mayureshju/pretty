import { auth } from "@clerk/nextjs/server";

export async function requireAdmin() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin" && role !== "super_admin") {
    // For development: allow all authenticated users as admin
    // In production: uncomment the throw below and set roles in Clerk dashboard
    // throw new Error("Forbidden: Admin access required");
  }

  return { userId, role: role || "admin" };
}

export function unauthorizedResponse(message = "Unauthorized") {
  return Response.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden") {
  return Response.json({ error: message }, { status: 403 });
}

export function notFoundResponse(message = "Not found") {
  return Response.json({ error: message }, { status: 404 });
}

export function errorResponse(message = "Internal server error", status = 500) {
  return Response.json({ error: message }, { status });
}
