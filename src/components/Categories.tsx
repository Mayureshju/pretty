"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const categories = [
  { name: "Birthday", href: "/flowers/birthday/", image: "/images/categories/icons/birthday.png" },
  { name: "Anniversary", href: "/flowers/anniversary/", image: "/images/categories/icons/anniversary.png" },
  { name: "Valentine's", href: "/flowers/valentines-day/", image: "/images/categories/icons/valentines.png" },
  { name: "Get Same Day", href: "/flowers/", image: "/images/categories/icons/sameday.png" },
  { name: "Flowers", href: "/flowers/", image: "/images/categories/icons/flowers.png" },
  { name: "Wedding", href: "/flowers/wedding/", image: "/images/categories/icons/wedding.png" },
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
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: "power2.out",
          scrollTrigger: { trigger: rowRef.current, start: "top 92%" } }
      );
    }, rowRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="max-w-[1440px] mx-auto px-4 py-4 md:py-6">
      <div
        ref={rowRef}
        className="flex items-start justify-start md:justify-center gap-5 md:gap-8 lg:gap-10 overflow-x-auto scroll-container pb-2 md:pb-0"
      >
        {categories.map((cat) => (
          <a
            key={cat.name}
            href={cat.href}
            className="cat-item flex flex-col items-center gap-2 shrink-0 group"
          >
            <div className="w-[88px] h-[88px] md:w-[100px] md:h-[100px] rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm transition-all duration-200 group-hover:shadow-lg group-hover:scale-105">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-contain p-1.5"
                loading="lazy"
              />
            </div>
            <span className="text-[12px] md:text-[13px] font-medium text-[#1C2120] text-center leading-tight whitespace-nowrap group-hover:text-[#737530] transition-colors">
              {cat.name}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
