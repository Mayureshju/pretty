import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function requireAdmin() {
  const { userId } = await auth();

  if (!userId) {
    throw new AuthError("Unauthorized", 401);
  }

  const user = await currentUser();
  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }

  await connectDB();
  const dbUser = await UserModel.findOne({ clerkId: userId }).lean();
  if (!dbUser || dbUser.role !== "admin") {
    throw new AuthError("Forbidden: Admin access required", 403);
  }

  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;

  return { userId, email: email || "" };
}

export async function requireAuth() {
  const { userId } = await auth();

  if (!userId) {
    throw new AuthError("Unauthorized", 401);
  }

  const user = await currentUser();
  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }

  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;

  await connectDB();
  const dbUser = await UserModel.findOne({ clerkId: userId }).lean();
  const role = dbUser?.role === "admin" ? "admin" : "member";

  return { userId, email: email || "", role };
}

export function handleAuthError(err: unknown) {
  if (err instanceof AuthError) {
    return Response.json({ error: err.message }, { status: err.statusCode });
  }
  return unauthorizedResponse();
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
