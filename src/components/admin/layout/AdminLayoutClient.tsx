"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import AdminHeader from "@/components/admin/layout/AdminHeader";

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const normalizedPath = pathname?.replace(/\/$/, "");
  const isPrintRoute =
    normalizedPath?.endsWith("/packing-slip") ||
    normalizedPath?.endsWith("/invoice");

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleToggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const handleMobileMenuClose = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const sidebarWidth = collapsed ? 72 : 260;

  if (isPrintRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileMenuOpen}
        onMobileClose={handleMobileMenuClose}
      />

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={handleMobileMenuClose}
        />
      )}

      {/* Main content area
          On mobile (< md): full width, no left margin
          On desktop (>= md): margin-left matches sidebar width with smooth transition
          The inline style sets the sidebar-aware margin, and max-md:!ml-0
          overrides it with !important on screens below the md breakpoint */}
      <div
        className="min-h-screen transition-[margin-left] duration-300 ease-in-out max-md:!ml-0"
        style={{ marginLeft: sidebarWidth }}
      >
        <AdminHeader onMenuToggle={handleMobileMenuToggle} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
