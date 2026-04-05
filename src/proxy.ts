import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isAdminApiRoute = createRouteMatcher(["/api/admin(.*)"]);
const isAccountRoute = createRouteMatcher(["/account(.*)"]);

export const proxy = clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  if (isAdminRoute(req) || isAdminApiRoute(req)) {
    if (!userId) {
      await auth.protect();
      return;
    }

    const role = (sessionClaims?.metadata as { role?: string })?.role;
    if (role !== "admin") {
      if (isAdminApiRoute(req)) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (isAccountRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
