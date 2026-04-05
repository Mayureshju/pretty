import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import AdminLayoutClient from "@/components/admin/layout/AdminLayoutClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | Pretty Petals",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check admin role from database (source of truth)
  await connectDB();
  const dbUser = await UserModel.findOne({ clerkId: user.id }).lean();
  if (!dbUser || dbUser.role !== "admin") {
    redirect("/");
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
