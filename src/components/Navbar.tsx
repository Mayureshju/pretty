"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";

interface MenuLink {
  label: string;
  href: string;
  isNew?: boolean;
}

interface MenuColumn {
  title: string;
  links: MenuLink[];
}

interface TopMenuItem {
  label: string;
  href: string;
  columns?: MenuColumn[];
}

/* Menu structure matches CurrentMenu.docx exactly */
const MENU: TopMenuItem[] = [
  {
    label: "Flowers",
    href: "/flowers/",
    columns: [
      {
        title: "Flowers For Every Occasions",
        links: [
          { label: "Birthday", href: "/flowers/birthday/" },
          { label: "Anniversary", href: "/flowers/anniversary/" },
          // { label: "Congratulations", href: "/flowers/congratulations/" },
          // { label: "Love n Romance", href: "/flowers/love-n-romance/" },
          { label: "Wedding", href: "/flowers/wedding/" },
          { label: "Housewarming", href: "/flowers/house-warming/" },
          { label: "Get Well Soon", href: "/flowers/get-well-soon/" },
          { label: "Mother's Day", href: "/flowers/mother-flower/" },
          { label: "Valentine", href: "/flowers/valentines-day/" },
        ],
      },
      {
        title: "Floral Types",
        links: [
          { label: "Roses", href: "/flowers/roses/" },
          { label: "Mixed Flowers", href: "/flowers/mixed-flowers/" },
          { label: "Carnations", href: "/flowers/carnations/" },
          { label: "Exotic Flowers", href: "/flowers/exotic-flowers/" },
          { label: "Orchids", href: "/flowers/orchids/" },
          { label: "Gerberas", href: "/flowers/gerberas/" },
          { label: "Lilies", href: "/flowers/lilies/" },
          { label: "Garlands", href: "/flowers/garlands/" },
          // { label: "Dried Flowers", href: "/flowers/dried-flowers/", isNew: true },
          // { label: "Daisies", href: "/flowers/daisies/", isNew: true },
        ],
      },
    ],
  },
  { label: "Cakes", href: "/cakes/" },
  { label: "Combos", href: "/combos-gifts/" },
  { label: "Birthday", href: "/flowers/birthday/" },
  { label: "Corporate", href: "/corporate/" },
  { label: "Gifts", href: "/gifts/" },
  { label: "Popular", href: "/popular/" },
  { label: "Fruits", href: "/fruits/" },
  { label: "Signature Floral Arrangements", href: "/signature/" },
];

export default function Navbar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.06, ease: "power3.out", delay: 0.05 }
      );
    }
  }, [activeMenu]);

  const activeItem = MENU.find((m) => m.label === activeMenu) || null;
  const hasDropdown = !!(activeItem && activeItem.columns && activeItem.columns.length > 0);

  return (
    <nav className="bg-white border-b border-[#e5e7eb] sticky top-[60px] md:top-[66px] z-40 hidden md:block">
      <div className="max-w-[1440px] mx-auto px-4">
        <ul className="flex items-center justify-center overflow-x-auto scroll-container">
          {MENU.map((item) => {
            const showDropdown = !!(item.columns && item.columns.length > 0);
            return (
              <li
                key={item.label}
                onMouseEnter={() => showDropdown && handleEnter(item.label)}
                onMouseLeave={handleLeave}
                className="relative"
              >
                <a
                  href={item.href}
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
      {hasDropdown && activeItem && activeItem.columns && (
        <div
          ref={dropdownRef}
          onMouseEnter={handleDropdownEnter}
          onMouseLeave={handleDropdownLeave}
          className="absolute left-0 right-0 z-50 bg-white border-b border-gray-200"
          style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.1)" }}
        >
          <div className="max-w-[1440px] mx-auto px-4 py-6">
            <div className="flex gap-10">
              {activeItem.columns.map((col) => (
                <div key={col.title} className="mega-col min-w-[200px]">
                  <h4 className="text-[13px] font-semibold text-[#737530] mb-3 pb-2 border-b border-[#737530]/15 uppercase tracking-wide">
                    {col.title}
                  </h4>
                  <ul className="space-y-2">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="group inline-flex items-center gap-2 text-[13px] text-[#464646] hover:text-[#737530] transition-colors py-0.5"
                        >
                          <span>{link.label}</span>
                          {link.isNew && (
                            <span className="text-[9px] font-bold bg-[#EA1E61] text-white px-1.5 py-0.5 rounded uppercase tracking-wider leading-none">
                              New
                            </span>
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
