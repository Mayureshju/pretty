"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

interface AdminHeaderProps {
  onMenuToggle: () => void;
}

export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  // e.g. /admin/products/new -> ["admin", "products", "new"]
  const segments = pathname
    .split("/")
    .filter(Boolean);

  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-4 md:px-6">
      {/* Left side: hamburger + breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Hamburger menu - mobile only */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#464646"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.href} className="flex items-center">
              {index > 0 && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-1.5 shrink-0"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              )}
              {crumb.isLast ? (
                <span className="text-gray-800 font-medium">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right side: View Store, Notification bell, UserButton */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* View Store button */}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          View Store
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </Link>

        {/* Notification bell */}
        <button
          className="relative p-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#464646"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          {/* Red dot indicator */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Clerk UserButton */}
        <UserButton
          appearance={{
            elements: {
              organizationSwitcherTrigger: { display: "none" },
            },
          }}
        />
      </div>
    </header>
  );
}
