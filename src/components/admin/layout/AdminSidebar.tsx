"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ---------------------------------------------------------------------------
// Icon components (inline SVG, no external library)
// ---------------------------------------------------------------------------

function IconGrid() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconShoppingBag() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}

function IconImage() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function IconFileText() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconTruck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function IconTag() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function IconPercent() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconBarChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Navigation data
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", href: "/admin", icon: IconGrid },
      { label: "Orders", href: "/admin/orders", icon: IconShoppingBag, badge: "New" },
      { label: "Products", href: "/admin/products", icon: IconBox },
      { label: "Categories", href: "/admin/categories", icon: IconFolder },
    ],
  },
  {
    title: "CONTENT",
    items: [
      { label: "Banners", href: "/admin/banners", icon: IconImage },
      { label: "Blogs", href: "/admin/blogs", icon: IconFileText },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "Delivery Cities", href: "/admin/delivery-cities", icon: IconTruck },
      { label: "Coupons", href: "/admin/coupons", icon: IconTag },
      { label: "Sales", href: "/admin/sales", icon: IconPercent },
      { label: "Customers", href: "/admin/customers", icon: IconUsers },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Reports", href: "/admin/reports", icon: IconBarChart },
      { label: "Settings", href: "/admin/settings", icon: IconSettings },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helper: determine whether a nav item is active
// ---------------------------------------------------------------------------

function isActive(href: string, pathname: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname.startsWith(href);
}

// ---------------------------------------------------------------------------
// AdminSidebar component
// ---------------------------------------------------------------------------

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function AdminSidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();

  // ---- Sidebar content (shared between desktop and mobile) ----
  const sidebarContent = (
    <div
      className={`flex flex-col h-full bg-[#737530] text-white transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* ---- Logo ---- */}
      <div className="flex items-center gap-3 px-5 h-[64px] shrink-0 border-b border-white/10">
        <svg
          width="32"
          height="32"
          viewBox="0 0 120 120"
          fill="none"
          className="shrink-0"
        >
          <ellipse cx="60" cy="28" rx="14" ry="20" fill="#E74C3C" />
          <ellipse cx="60" cy="92" rx="14" ry="20" fill="#C0392B" />
          <ellipse cx="28" cy="60" rx="20" ry="14" fill="#E74C3C" />
          <ellipse cx="92" cy="60" rx="20" ry="14" fill="#C0392B" />
          <ellipse cx="37" cy="37" rx="14" ry="20" fill="#E74C3C" transform="rotate(-45 37 37)" />
          <ellipse cx="83" cy="37" rx="14" ry="20" fill="#C0392B" transform="rotate(45 83 37)" />
          <ellipse cx="37" cy="83" rx="14" ry="20" fill="#C0392B" transform="rotate(45 37 83)" />
          <ellipse cx="83" cy="83" rx="14" ry="20" fill="#E74C3C" transform="rotate(-45 83 83)" />
          <circle cx="60" cy="60" r="12" fill="#F1C40F" />
          <circle cx="60" cy="60" r="5" fill="#E67E22" />
        </svg>
        {!collapsed && (
          <span className="text-[15px] font-bold tracking-[0.08em] uppercase whitespace-nowrap">
            Pretty Petals
          </span>
        )}
      </div>

      {/* ---- Navigation groups ---- */}
      <nav className="flex-1 overflow-y-auto py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-4">
            {/* Group label */}
            {!collapsed && (
              <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2 px-4">
                {group.title}
              </div>
            )}

            {/* Items */}
            <ul>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, pathname);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`
                        flex items-center gap-3 px-4 py-2.5 text-[14px] transition-colors duration-150
                        ${collapsed ? "justify-center" : ""}
                        ${
                          active
                            ? "bg-white/15 border-l-3 border-white font-medium"
                            : "border-l-3 border-transparent hover:bg-white/10"
                        }
                        ${active ? "text-white" : "text-white/75 hover:text-white"}
                      `}
                    >
                      <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                        <Icon />
                      </span>

                      {!collapsed && (
                        <span className="flex-1 whitespace-nowrap">{item.label}</span>
                      )}

                      {!collapsed && item.badge && (
                        <span className="ml-auto text-[11px] font-semibold bg-red-500 text-white rounded-full px-2 py-0.5 leading-none">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ---- Collapse toggle (desktop only, hidden on mobile overlay) ---- */}
      <button
        onClick={onToggleCollapse}
        className="hidden md:flex items-center justify-center gap-2 h-[48px] shrink-0 border-t border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-150 cursor-pointer"
      >
        {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
        {!collapsed && (
          <span className="text-[13px]">Collapse</span>
        )}
      </button>
    </div>
  );

  return (
    <>
      {/* ---- Desktop sidebar (fixed) ---- */}
      <aside
        className={`hidden md:block fixed top-0 left-0 h-full z-40 transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* ---- Mobile overlay ---- */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onMobileClose}
          />
          {/* Slide-in sidebar */}
          <aside className="relative z-10 animate-slide-in-left">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* ---- Inline keyframes for mobile slide-in ---- */}
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}
