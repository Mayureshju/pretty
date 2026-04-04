"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";

/* ── Mega menu data per nav item ── */
type MegaColumn = { title: string; links: { label: string; href: string }[] };

const megaMenus: Record<string, MegaColumn[]> = {
  Flowers: [
    {
      title: "Collection",
      links: [
        { label: "Best Sellers", href: "/flowers/?sort=best-seller" },
        { label: "Birthday Flowers", href: "/flowers/birthday/" },
        { label: "Love & Affection", href: "/flowers/valentines-day/" },
        { label: "Anniversary Flowers", href: "/flowers/anniversary/" },
        { label: "Bridal Bouquet", href: "/flowers/wedding/" },
        { label: "Flower Bouquet", href: "/flowers/" },
        { label: "Green Plants Combos", href: "/plants/" },
        { label: "Flowers in Vase", href: "/flowers/" },
        { label: "Flowers in Gift Box", href: "/flowers/" },
        { label: "Luxury Flowers", href: "/signature/" },
        { label: "All Flowers", href: "/flowers/" },
      ],
    },
    {
      title: "Shop By Flower Type",
      links: [
        { label: "Rose Bouquet", href: "/flowers/roses/" },
        { label: "Orchids Bouquet", href: "/flowers/orchids/" },
        { label: "Mixed Flower Bouquet", href: "/flowers/mixed-flowers/" },
        { label: "Carnation Bouquet", href: "/flowers/carnations/" },
        { label: "Lily Bouquet", href: "/flowers/lilies/" },
        { label: "Sunflower Bouquet", href: "/flowers/" },
        { label: "Hydrangea Bouquet", href: "/flowers/" },
      ],
    },
    {
      title: "By Occasions",
      links: [
        { label: "Congratulations", href: "/flowers/" },
        { label: "Get Well Soon", href: "/flowers/get-well-soon/" },
        { label: "I Am Sorry", href: "/flowers/" },
        { label: "Cheer Up", href: "/flowers/" },
        { label: "Thank You", href: "/flowers/" },
        { label: "Appreciation", href: "/flowers/corporate/" },
      ],
    },
    {
      title: "Cities",
      links: [
        { label: "Flowers To Bangalore", href: "/flowers/" },
        { label: "Flowers To Chennai", href: "/flowers/" },
        { label: "Flowers To Delhi", href: "/flowers/" },
        { label: "Flowers To Gurgaon", href: "/flowers/" },
        { label: "Flowers To Hyderabad", href: "/flowers/" },
        { label: "Flowers To Mumbai", href: "/flowers/" },
        { label: "Flowers To Pune", href: "/flowers/" },
        { label: "All 620+ Cities", href: "/flowers/" },
      ],
    },
    {
      title: "Floral Assortments",
      links: [
        { label: "Flowers & Cakes", href: "/combos-gifts/" },
        { label: "Flowers & Chocolates", href: "/combos-gifts/" },
        { label: "Flowers & Teddy", href: "/combos-gifts/" },
        { label: "Gift Flowers Combos", href: "/combos-gifts/" },
      ],
    },
    {
      title: "Blossoms By Hue",
      links: [
        { label: "Red Flowers", href: "/flowers/roses/" },
        { label: "Yellow Flowers", href: "/flowers/" },
        { label: "White Flowers", href: "/flowers/lilies/" },
        { label: "Mixed Flowers", href: "/flowers/mixed-flowers/" },
        { label: "Pink Flowers", href: "/flowers/roses/" },
        { label: "Orange Roses", href: "/flowers/roses/" },
      ],
    },
  ],
  Cakes: [
    {
      title: "By Flavour",
      links: [
        { label: "Chocolate Cakes", href: "/cakes/premium-cakes/" },
        { label: "Butterscotch Cakes", href: "/cakes/premium-cakes/" },
        { label: "Red Velvet Cakes", href: "/cakes/premium-cakes/" },
        { label: "Black Forest Cakes", href: "/cakes/premium-cakes/" },
        { label: "Pineapple Cakes", href: "/cakes/premium-cakes/" },
        { label: "Fruit Cakes", href: "/cakes/premium-cakes/" },
        { label: "Vanilla Cakes", href: "/cakes/premium-cakes/" },
        { label: "All Cakes", href: "/cakes/" },
      ],
    },
    {
      title: "By Type",
      links: [
        { label: "Designer Cakes", href: "/cakes/premium-cakes/" },
        { label: "Photo Cakes", href: "/photo-cake/" },
        { label: "Theme Cakes", href: "/cakes/premium-cakes/" },
        { label: "Bento Cakes", href: "/cakes/premium-cakes/" },
        { label: "Jar Cakes", href: "/cakes/premium-cakes/" },
        { label: "Pinata Cakes", href: "/cakes/premium-cakes/" },
        { label: "Bomb Cakes", href: "/cakes/premium-cakes/" },
      ],
    },
    {
      title: "By Occasion",
      links: [
        { label: "Birthday Cakes", href: "/cakes/premium-cakes/" },
        { label: "Anniversary Cakes", href: "/cakes/premium-cakes/" },
        { label: "Wedding Cakes", href: "/cakes/premium-cakes/" },
        { label: "Baby Shower Cakes", href: "/cakes/premium-cakes/" },
        { label: "Valentine Cakes", href: "/cakes/premium-cakes/" },
      ],
    },
    {
      title: "Cities",
      links: [
        { label: "Cakes To Delhi", href: "/cakes/" },
        { label: "Cakes To Mumbai", href: "/cakes/" },
        { label: "Cakes To Bangalore", href: "/cakes/" },
        { label: "Cakes To Hyderabad", href: "/cakes/" },
        { label: "Cakes To Pune", href: "/cakes/" },
        { label: "All 620+ Cities", href: "/cakes/" },
      ],
    },
  ],
  Gifts: [
    {
      title: "Gift Ideas",
      links: [
        { label: "Photo Gifts", href: "/gifts/" },
        { label: "Mugs", href: "/gifts/" },
        { label: "Cushions", href: "/gifts/" },
        { label: "Home Decor", href: "/gifts/" },
        { label: "Jewellery", href: "/gifts/" },
        { label: "Perfumes", href: "/gifts/" },
        { label: "Soft Toys", href: "/gifts/" },
      ],
    },
    {
      title: "By Recipient",
      links: [
        { label: "Gifts for Him", href: "/gifts/" },
        { label: "Gifts for Her", href: "/gifts/" },
        { label: "Gifts for Kids", href: "/gifts/" },
        { label: "Gifts for Parents", href: "/gifts/" },
        { label: "Gifts for Friends", href: "/gifts/" },
      ],
    },
    {
      title: "By Occasion",
      links: [
        { label: "Birthday Gifts", href: "/gifts/" },
        { label: "Anniversary Gifts", href: "/gifts/" },
        { label: "Wedding Gifts", href: "/gifts/" },
        { label: "Housewarming Gifts", href: "/gifts/" },
        { label: "Farewell Gifts", href: "/gifts/" },
      ],
    },
  ],
  Plants: [
    {
      title: "By Type",
      links: [
        { label: "Indoor Plants", href: "/plants/" },
        { label: "Air Purifying", href: "/plants/" },
        { label: "Flowering Plants", href: "/plants/" },
        { label: "Succulents", href: "/plants/" },
        { label: "Bonsai Plants", href: "/plants/" },
        { label: "Lucky Bamboo", href: "/plants/" },
        { label: "Cactus", href: "/plants/" },
      ],
    },
    {
      title: "Planters",
      links: [
        { label: "Ceramic Planters", href: "/plants/" },
        { label: "Metal Planters", href: "/plants/" },
        { label: "Self Watering", href: "/plants/" },
        { label: "Terracotta", href: "/plants/" },
      ],
    },
    {
      title: "By Occasion",
      links: [
        { label: "Birthday Plants", href: "/plants/" },
        { label: "Diwali Plants", href: "/plants/" },
        { label: "New Year Plants", href: "/plants/" },
        { label: "Housewarming", href: "/plants/" },
      ],
    },
  ],
};

const navItems = [
  { label: "Flowers", href: "/flowers/" },
  { label: "Cakes", href: "/cakes/" },
  { label: "Combos", href: "/combos-gifts/" },
  { label: "Birthday", href: "/flowers/birthday/" },
  { label: "Anniversary", href: "/flowers/anniversary/" },
  { label: "Gifts", href: "/gifts/" },
  { label: "Personalised", href: "/gifts/" },
  { label: "Plants", href: "/plants/" },
  { label: "Chocolates", href: "/gifts/" },
  { label: "Occasions", href: "#" },
  { label: "International", href: "#" },
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

  // GSAP entrance animation for dropdown
  useEffect(() => {
    if (activeMenu && dropdownRef.current) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.25, ease: "power3.out" }
      );
      // Stagger columns
      const cols = dropdownRef.current.querySelectorAll(".mega-col");
      gsap.fromTo(
        cols,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: "power3.out", delay: 0.05 }
      );
    }
  }, [activeMenu]);

  const currentMenu = activeMenu ? megaMenus[activeMenu] : null;

  return (
    <nav className="bg-white border-b border-[#e5e7eb] sticky top-[60px] md:top-[66px] z-40 hidden md:block">
      <div className="max-w-[1320px] mx-auto px-4">
        <ul className="flex items-center justify-start overflow-x-auto scroll-container">
          {navItems.map((item) => {
            const hasMenu = !!megaMenus[item.label];
            return (
              <li
                key={item.label}
                onMouseEnter={() => hasMenu && handleEnter(item.label)}
                onMouseLeave={handleLeave}
                className="relative"
              >
                <a
                  href={item.href}
                  className={`block px-4 lg:px-5 py-2.5 text-[13px] lg:text-[14px] font-normal whitespace-nowrap transition-colors relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:bg-[#C48B9F] after:transition-all ${
                    activeMenu === item.label
                      ? "text-[#C48B9F] after:w-full"
                      : "text-[#1C2120] hover:text-[#C48B9F] after:w-0 hover:after:w-full"
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
      {currentMenu && (
        <div
          ref={dropdownRef}
          onMouseEnter={handleDropdownEnter}
          onMouseLeave={handleDropdownLeave}
          className="absolute left-0 right-0 z-50 bg-white border-b border-gray-200"
          style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.1)" }}
        >
          <div className="max-w-[1320px] mx-auto px-4 py-5">
            <div
              className="grid gap-6"
              style={{
                gridTemplateColumns: `repeat(${Math.min(currentMenu.length, 6)}, minmax(0, 1fr))`,
              }}
            >
              {currentMenu.map((col) => (
                <div key={col.title} className="mega-col">
                  <h4 className="text-[13px] font-semibold text-[#C48B9F] mb-2.5 pb-1.5 border-b border-[#C48B9F]/10">
                    {col.title}
                  </h4>
                  <ul className="space-y-1.5">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="text-[13px] text-[#464646] hover:text-[#C48B9F] transition-colors block py-0.5"
                        >
                          {link.label}
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
