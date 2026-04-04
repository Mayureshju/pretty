"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const categories = [
  { name: "Flowers", href: "/flowers/", image: "/images/categories/flowers.jpg" },
  { name: "Cakes", href: "/cakes", image: "/images/categories/cakes.jpg" },
  { name: "Combos", href: "/gift-hampers", image: "/images/categories/combos.jpg" },
  { name: "Balloon\nDecor", href: "/gifts/balloon-decorations", image: "/images/categories/balloons.jpg" },
  { name: "Plants", href: "/plants", image: "/images/categories/plants.jpg" },
  { name: "Hampers", href: "/hampers/same-day-delivery", image: "/images/categories/hampers.jpg" },
  { name: "Same Day", href: "/same-day-delivery-gifts", image: "/images/categories/sameday.jpg" },
  { name: "International", href: "/delivery-countries", image: "/images/categories/international.jpg" },
];

export default function Categories() {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const items = itemsRef.current.filter(Boolean);

    gsap.set(items, { opacity: 0, y: 30, scale: 0.85 });

    gsap.to(items, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.5,
      stagger: 0.08,
      ease: "back.out(1.4)",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });

    // Hover ripple effect
    items.forEach((item) => {
      if (!item) return;
      const circle = item.querySelector(".cat-circle") as HTMLElement;
      if (!circle) return;

      item.addEventListener("mouseenter", () => {
        gsap.to(circle, {
          scale: 1.12,
          boxShadow: "0 8px 25px rgba(14,77,101,0.2)",
          duration: 0.35,
          ease: "power2.out",
        });
      });
      item.addEventListener("mouseleave", () => {
        gsap.to(circle, {
          scale: 1,
          boxShadow: "0 3px 12px rgba(0,0,0,0.08)",
          duration: 0.35,
          ease: "power2.inOut",
        });
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section className="max-w-[1320px] mx-auto px-4 py-6 md:py-8" ref={containerRef}>
      <div className="flex items-start justify-between overflow-x-auto scroll-container gap-2 sm:gap-0 pb-2">
        {categories.map((cat, i) => (
          <a
            key={cat.name}
            href={cat.href}
            ref={(el) => { itemsRef.current[i] = el; }}
            className="flex flex-col items-center gap-2.5 cursor-pointer shrink-0 px-1 sm:px-0"
          >
            <div
              className="cat-circle w-[72px] h-[72px] sm:w-[82px] sm:h-[82px] md:w-[96px] md:h-[96px] rounded-full overflow-hidden border-[3px] border-white"
              style={{ boxShadow: "0 3px 12px rgba(0,0,0,0.08)" }}
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <span className="text-[11px] sm:text-xs md:text-[13px] font-medium text-[#1C2120] text-center leading-tight whitespace-pre-line">
              {cat.name}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
