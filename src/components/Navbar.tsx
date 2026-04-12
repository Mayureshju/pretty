"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";

interface NavCategory {
  _id: string;
  name: string;
  slug: string;
  productCount: number;
  children: { _id: string; name: string; slug: string; productCount: number }[];
}

/* Nav items with their slugs — order matters for display */
const navOrder = [
  { label: "Flowers", slug: "flowers" },
  { label: "Cakes", slug: "cakes" },
  { label: "Combos", slug: "combos-gifts" },
  { label: "Birthday", slug: "birthday", parentSlug: "flowers" },
  { label: "Anniversary", slug: "anniversary", parentSlug: "flowers" },
  { label: "Gifts", slug: "gifts" },
  { label: "Personalised", slug: "gifts" },
  { label: "Plants", slug: "plants" },
  { label: "Chocolates", slug: "gifts" },
  { label: "Occasions", slug: "" },
  { label: "International", slug: "" },
];

function buildHref(cat: NavCategory | undefined, nav: typeof navOrder[0]): string {
  if (nav.parentSlug) return `/${nav.parentSlug}/${nav.slug}/`;
  if (cat) return `/${cat.slug}/`;
  return "#";
}

function buildChildHref(parent: NavCategory, child: { slug: string }): string {
  return `/${parent.slug}/${child.slug}/`;
}

export default function Navbar() {
  const [categories, setCategories] = useState<NavCategory[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch categories
  useEffect(() => {
    fetch("/api/categories/nav")
      .then((r) => r.json())
      .then((data: NavCategory[]) => setCategories(data))
      .catch(() => {});
  }, []);

  const handleEnter = (label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(label);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveMenu(null), 150);
  };

  const handleDropdownEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleDropdownLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveMenu(null), 150);
  };

  // GSAP entrance animation for dropdown
  useEffect(() => {
    if (activeMenu && dropdownRef.current) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.25, ease: "power3.out" }
      );
      const cols = dropdownRef.current.querySelectorAll(".mega-col");
      gsap.fromTo(
        cols,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: "power3.out", delay: 0.05 }
      );
    }
  }, [activeMenu]);

  // Find the category matching the active menu
  function getMenuCategory(): NavCategory | null {
    if (!activeMenu) return null;
    const nav = navOrder.find((n) => n.label === activeMenu);
    if (!nav) return null;
    // For items like "Birthday" that are children, find the parent "flowers"
    const parentSlug = nav.parentSlug || nav.slug;
    return categories.find((c) => c.slug === parentSlug) || null;
  }

  const menuCategory = getMenuCategory();
  const hasDropdown = menuCategory && menuCategory.children.length > 0;

  // Split children into columns of ~8 items
  function getColumns(children: NavCategory["children"]): NavCategory["children"][] {
    const cols: NavCategory["children"][] = [];
    const perCol = 8;
    for (let i = 0; i < children.length; i += perCol) {
      cols.push(children.slice(i, i + perCol));
    }
    return cols;
  }

  return (
    <nav className="bg-white border-b border-[#e5e7eb] sticky top-[60px] md:top-[66px] z-40 hidden md:block">
      <div className="max-w-[1440px] mx-auto px-4">
        <ul className="flex items-center justify-start overflow-x-auto scroll-container">
          {navOrder.map((item) => {
            const cat = categories.find((c) => c.slug === item.slug);
            const parentCat = item.parentSlug
              ? categories.find((c) => c.slug === item.parentSlug)
              : cat;
            const showDropdown = parentCat && parentCat.children.length > 0;

            return (
              <li
                key={item.label}
                onMouseEnter={() => showDropdown && handleEnter(item.label)}
                onMouseLeave={handleLeave}
                className="relative"
              >
                <a
                  href={buildHref(cat, item)}
                  className={`block px-4 lg:px-5 py-2.5 text-[13px] lg:text-[14px] font-normal whitespace-nowrap transition-colors relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:bg-[#737530] after:transition-all ${
                    activeMenu === item.label
                      ? "text-[#737530] after:w-full"
                      : "text-[#1C2120] hover:text-[#737530] after:w-0 hover:after:w-full"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Mega Dropdown ── */}
      {hasDropdown && menuCategory && (
        <div
          ref={dropdownRef}
          onMouseEnter={handleDropdownEnter}
          onMouseLeave={handleDropdownLeave}
          className="absolute left-0 right-0 z-50 bg-white border-b border-gray-200"
          style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.1)" }}
        >
          <div className="max-w-[1440px] mx-auto px-4 py-5">
            <div className="flex gap-8">
              {/* "All" link + category name */}
              <div className="mega-col min-w-[160px]">
                <h4 className="text-[13px] font-semibold text-[#737530] mb-2.5 pb-1.5 border-b border-[#737530]/10">
                  {menuCategory.name}
                </h4>
                <ul className="space-y-1.5">
                  <li>
                    <a href={`/${menuCategory.slug}/`}
                      className="text-[13px] text-[#737530] font-medium hover:text-[#4C4D27] transition-colors block py-0.5">
                      All {menuCategory.name}
                    </a>
                  </li>
                </ul>
              </div>

              {/* Subcategories in columns */}
              {getColumns(menuCategory.children.filter((c) => c.productCount > 0)).map((col, colIdx) => (
                <div key={colIdx} className="mega-col min-w-[160px]">
                  <h4 className="text-[13px] font-semibold text-[#737530] mb-2.5 pb-1.5 border-b border-[#737530]/10">
                    {colIdx === 0 ? "Subcategories" : "\u00A0"}
                  </h4>
                  <ul className="space-y-1.5">
                    {col.map((child) => (
                      <li key={child._id}>
                        <a
                          href={buildChildHref(menuCategory, child)}
                          className="text-[13px] text-[#464646] hover:text-[#737530] transition-colors block py-0.5"
                        >
                          {child.name}
                          {child.productCount > 0 && (
                            <span className="text-[11px] text-[#999] ml-1">({child.productCount})</span>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
