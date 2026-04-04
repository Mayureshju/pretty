import type { Metadata } from "next";
import AdminLayoutClient from "@/components/admin/layout/AdminLayoutClient";

export const metadata: Metadata = {
  title: "Admin | Pretty Petals",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
