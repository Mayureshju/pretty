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
        { label: "Birthday Flowers", href: "/birthday/flowers" },
        { label: "Love & Affection", href: "/flowers/love" },
        { label: "Anniversary Flowers", href: "/anniversary/flowers" },
        { label: "Bridal Bouquet", href: "/flowers/bridal" },
        { label: "Flower Bouquet", href: "/flowers/bouquet" },
        { label: "Green Plants Combos", href: "/flowers/plant-combos" },
        { label: "Flowers in Vase", href: "/flowers/in-vase" },
        { label: "Flowers in Gift Box", href: "/flowers/in-box" },
        { label: "Luxury Flowers", href: "/flowers/luxury" },
        { label: "All Flowers", href: "/flowers/" },
      ],
    },
    {
      title: "Shop By Flower Type",
      links: [
        { label: "Rose Bouquet", href: "/flowers/roses" },
        { label: "Orchids Bouquet", href: "/flowers/orchids" },
        { label: "Mixed Flower Bouquet", href: "/flowers/mixed" },
        { label: "Carnation Bouquet", href: "/flowers/carnation" },
        { label: "Lily Bouquet", href: "/flowers/lily" },
        { label: "Sunflower Bouquet", href: "/flowers/sunflower" },
        { label: "Hydrangea Bouquet", href: "/flowers/hydrangea" },
      ],
    },
    {
      title: "By Occasions",
      links: [
        { label: "Congratulations", href: "/flowers/congratulations" },
        { label: "Get Well Soon", href: "/flowers/get-well-soon" },
        { label: "I Am Sorry", href: "/flowers/sorry" },
        { label: "Cheer Up", href: "/flowers/cheer-up" },
        { label: "Thank You", href: "/flowers/thank-you" },
        { label: "Appreciation", href: "/flowers/appreciation" },
      ],
    },
    {
      title: "Cities",
      links: [
        { label: "Flowers To Bangalore", href: "/flowers/bangalore" },
        { label: "Flowers To Chennai", href: "/flowers/chennai" },
        { label: "Flowers To Delhi", href: "/flowers/delhi" },
        { label: "Flowers To Gurgaon", href: "/flowers/gurgaon" },
        { label: "Flowers To Hyderabad", href: "/flowers/hyderabad" },
        { label: "Flowers To Mumbai", href: "/flowers/mumbai" },
        { label: "Flowers To Pune", href: "/flowers/pune" },
        { label: "All 620+ Cities", href: "/flowers/cities" },
      ],
    },
    {
      title: "Floral Assortments",
      links: [
        { label: "Flowers & Cakes", href: "/combos/flowers-cakes" },
        { label: "Flowers & Chocolates", href: "/combos/flowers-chocolates" },
        { label: "Flowers & Teddy", href: "/combos/flowers-teddy" },
        { label: "Gift Flowers Combos", href: "/combos/flowers" },
      ],
    },
    {
      title: "Blossoms By Hue",
      links: [
        { label: "Red Flowers", href: "/flowers/red" },
        { label: "Yellow Flowers", href: "/flowers/yellow" },
        { label: "White Flowers", href: "/flowers/white" },
        { label: "Mixed Flowers", href: "/flowers/mixed-colors" },
        { label: "Pink Flowers", href: "/flowers/pink" },
        { label: "Orange Roses", href: "/flowers/orange" },
      ],
    },
  ],
  Cakes: [
    {
      title: "By Flavour",
      links: [
        { label: "Chocolate Cakes", href: "/cakes/chocolate" },
        { label: "Butterscotch Cakes", href: "/cakes/butterscotch" },
        { label: "Red Velvet Cakes", href: "/cakes/red-velvet" },
        { label: "Black Forest Cakes", href: "/cakes/black-forest" },
        { label: "Pineapple Cakes", href: "/cakes/pineapple" },
        { label: "Fruit Cakes", href: "/cakes/fruit" },
        { label: "Vanilla Cakes", href: "/cakes/vanilla" },
        { label: "All Cakes", href: "/all-cakes" },
      ],
    },
    {
      title: "By Type",
      links: [
        { label: "Designer Cakes", href: "/cakes/designer" },
        { label: "Photo Cakes", href: "/cakes/photo" },
        { label: "Theme Cakes", href: "/cakes/theme" },
        { label: "Bento Cakes", href: "/cakes/bento" },
        { label: "Jar Cakes", href: "/cakes/jar" },
        { label: "Pinata Cakes", href: "/cakes/pinata" },
        { label: "Bomb Cakes", href: "/cakes/bomb" },
      ],
    },
    {
      title: "By Occasion",
      links: [
        { label: "Birthday Cakes", href: "/birthday/cakes" },
        { label: "Anniversary Cakes", href: "/anniversary/cakes" },
        { label: "Wedding Cakes", href: "/cakes/wedding" },
        { label: "Baby Shower Cakes", href: "/cakes/baby-shower" },
        { label: "Valentine Cakes", href: "/cakes/valentine" },
      ],
    },
    {
      title: "Cities",
      links: [
        { label: "Cakes To Delhi", href: "/cakes/delhi" },
        { label: "Cakes To Mumbai", href: "/cakes/mumbai" },
        { label: "Cakes To Bangalore", href: "/cakes/bangalore" },
        { label: "Cakes To Hyderabad", href: "/cakes/hyderabad" },
        { label: "Cakes To Pune", href: "/cakes/pune" },
        { label: "All 620+ Cities", href: "/cakes/cities" },
      ],
    },
  ],
  Gifts: [
    {
      title: "Gift Ideas",
      links: [
        { label: "Photo Gifts", href: "/gifts/photo-gifts" },
        { label: "Mugs", href: "/gifts/mugs" },
        { label: "Cushions", href: "/gifts/cushions" },
        { label: "Home Decor", href: "/gifts/home-decor" },
        { label: "Jewellery", href: "/gifts/jewellery" },
        { label: "Perfumes", href: "/gifts/perfumes" },
        { label: "Soft Toys", href: "/gifts/soft-toys" },
      ],
    },
    {
      title: "By Recipient",
      links: [
        { label: "Gifts for Him", href: "/gifts/for-him" },
        { label: "Gifts for Her", href: "/gifts/for-her" },
        { label: "Gifts for Kids", href: "/gifts/for-kids" },
        { label: "Gifts for Parents", href: "/gifts/for-parents" },
        { label: "Gifts for Friends", href: "/gifts/for-friends" },
      ],
    },
    {
      title: "By Occasion",
      links: [
        { label: "Birthday Gifts", href: "/birthday/gifts" },
        { label: "Anniversary Gifts", href: "/anniversary/gifts" },
        { label: "Wedding Gifts", href: "/gifts/wedding" },
        { label: "Housewarming Gifts", href: "/gifts/housewarming" },
        { label: "Farewell Gifts", href: "/gifts/farewell" },
      ],
    },
  ],
  Plants: [
    {
      title: "By Type",
      links: [
        { label: "Indoor Plants", href: "/plants/indoor" },
        { label: "Air Purifying", href: "/plants/air-purifying" },
        { label: "Flowering Plants", href: "/plants/flowering" },
        { label: "Succulents", href: "/plants/succulents" },
        { label: "Bonsai Plants", href: "/plants/bonsai" },
        { label: "Lucky Bamboo", href: "/plants/lucky-bamboo" },
        { label: "Cactus", href: "/plants/cactus" },
      ],
    },
    {
      title: "Planters",
      links: [
        { label: "Ceramic Planters", href: "/plants/ceramic-planters" },
        { label: "Metal Planters", href: "/plants/metal-planters" },
        { label: "Self Watering", href: "/plants/self-watering" },
        { label: "Terracotta", href: "/plants/terracotta" },
      ],
    },
    {
      title: "By Occasion",
      links: [
        { label: "Birthday Plants", href: "/birthday/plants" },
        { label: "Diwali Plants", href: "/plants/diwali" },
        { label: "New Year Plants", href: "/plants/new-year" },
        { label: "Housewarming", href: "/plants/housewarming" },
      ],
    },
  ],
};

const navItems = [
  { label: "Flowers", href: "/flowers/" },
  { label: "Cakes", href: "/all-cakes" },
  { label: "Combos", href: "/gift-hampers" },
  { label: "Birthday", href: "/birthday" },
  { label: "Anniversary", href: "/anniversary" },
  { label: "Gifts", href: "/gifts" },
  { label: "Personalised", href: "/personalised-gifts" },
  { label: "Plants", href: "/plants" },
  { label: "Chocolates", href: "/chocolates" },
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
                  className={`block px-4 lg:px-5 py-2.5 text-[13px] lg:text-[14px] font-normal whitespace-nowrap transition-colors relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:bg-[#0E4D65] after:transition-all ${
                    activeMenu === item.label
                      ? "text-[#0E4D65] after:w-full"
                      : "text-[#1C2120] hover:text-[#0E4D65] after:w-0 hover:after:w-full"
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
                  <h4 className="text-[13px] font-semibold text-[#0E4D65] mb-2.5 pb-1.5 border-b border-[#0E4D65]/10">
                    {col.title}
                  </h4>
                  <ul className="space-y-1.5">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="text-[13px] text-[#464646] hover:text-[#0E4D65] transition-colors block py-0.5"
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
