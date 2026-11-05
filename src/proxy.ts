import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isMaintenanceEnabled } from "@/lib/maintenance";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isAdminApiRoute = createRouteMatcher(["/api/admin(.*)"]);
const isAccountRoute = createRouteMatcher(["/account(.*)"]);
const isMaintenancePage = createRouteMatcher(["/maintenance(.*)"]);
const isMaintenanceBypass = createRouteMatcher([
  "/maintenance(.*)",
  "/admin(.*)",
  "/api/admin(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/payu(.*)",
  "/api/webhooks(.*)",
  "/api/cron(.*)",
  "/delivery(.*)",
  "/api/delivery(.*)",
]);

export const proxy = clerkMiddleware(async (auth, req) => {
  if (isMaintenanceEnabled()) {
    if (!isMaintenanceBypass(req)) {
      const url = req.nextUrl.clone();
      url.pathname = "/maintenance/";
      url.search = "";
      return NextResponse.rewrite(url);
    }
  } else if (isMaintenancePage(req)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

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
