"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const categories = [
  { name: "Birthday", href: "/flowers/birthday/", image: "/images/categories/icons/birthday.png" },
  { name: "Anniversary", href: "/flowers/anniversary/", image: "/images/categories/icons/anniversary.png" },
  { name: "Valentine's", href: "/flowers/valentines-day/", image: "/images/categories/icons/valentines.png" },
  { name: "Wedding", href: "/flowers/wedding/", image: "/images/categories/icons/wedding.png" },
  { name: "Get Same Day", href: "/flowers/", image: "/images/categories/icons/sameday.png" },
  { name: "Flowers", href: "/flowers/", image: "/images/categories/icons/flowers.png" },
  { name: "Cakes", href: "/cakes/", image: "/images/categories/icons/cakes.png" },
  { name: "Plants", href: "/plants/", image: "/images/categories/icons/plants.png" },
];

export default function Categories() {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rowRef.current) return;
    const ctx = gsap.context(() => {
      const items = rowRef.current!.querySelectorAll(".cat-item");
      gsap.fromTo(items,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out",
          scrollTrigger: { trigger: rowRef.current, start: "top 90%" } }
      );
    }, rowRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="max-w-[1440px] mx-auto px-4 py-3 md:py-5">
      <div
        ref={rowRef}
        className="flex items-center justify-start md:justify-center gap-3 md:gap-5 overflow-x-auto scroll-container pb-2 md:pb-0"
      >
        {categories.map((cat) => (
          <a
            key={cat.name}
            href={cat.href}
            className="cat-item flex flex-col items-center gap-1.5 shrink-0 group"
          >
            <div className="w-[72px] h-[72px] md:w-[84px] md:h-[84px] rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:scale-105">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-contain p-1"
                loading="lazy"
              />
            </div>
            <span className="text-[12px] md:text-[13px] font-medium text-[#1C2120] text-center leading-tight whitespace-nowrap">
              {cat.name}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
