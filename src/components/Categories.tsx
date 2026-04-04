"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const categories = [
  { name: "Flowers", href: "/flowers/", image: "/images/products/pink-bouquet.jpg", mobileImage: "/images/categories/flowers.jpg" },
  { name: "Birthday", href: "/birthday", image: "/images/occasions/birthday.jpg", mobileImage: "/images/products/red-roses.jpg" },
  { name: "Anniversary", href: "/anniversary", image: "/images/occasions/anniversary.jpg", mobileImage: "/images/products/lily-bouquet.jpg" },
  { name: "Combos", href: "/gift-hampers", image: "/images/categories/combos.jpg", mobileImage: "/images/categories/hampers.jpg" },
  { name: "Cakes", href: "/cakes", image: "/images/products/chocolate-cake.jpg", mobileImage: "/images/products/red-velvet.jpg" },
  { name: "Bouquets", href: "/flowers/bouquets", image: "/images/products/purple-orchid.jpg", mobileImage: "/images/products/red-wrapped.jpg" },
  { name: "Plants", href: "/plants", image: "/images/products/jade-plant.jpg", mobileImage: "/images/categories/plants.jpg" },
  { name: "Hampers", href: "/hampers/same-day-delivery", image: "/images/categories/hampers.jpg", mobileImage: "/images/categories/sameday.jpg" },
];

export default function Categories() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const itemsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      if (headingRef.current) {
        gsap.fromTo(
          headingRef.current,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 88%",
            },
          }
        );
      }

      const items = itemsRef.current.filter(Boolean);
      gsap.fromTo(
        items,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 82%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="max-w-[1320px] mx-auto px-4 py-8 md:py-12">
      <h2
        ref={headingRef}
        className="text-lg md:text-xl font-semibold text-[#1C2120] mb-4 md:mb-5"
      >
        Shop by Category
      </h2>

      <div className="flex gap-4 overflow-x-auto pb-2 scroll-container md:grid md:grid-cols-8 md:gap-6 md:overflow-visible md:pb-0">
        {categories.map((cat, i) => (
          <a
            key={cat.name}
            href={cat.href}
            ref={(el) => { itemsRef.current[i] = el; }}
            className="flex flex-col items-center gap-2 group shrink-0"
          >
            <div className="w-[80px] h-[80px] md:w-[90px] md:h-[90px] overflow-hidden rounded-full bg-[#F5F5F5]">
              <picture className="block w-full h-full">
                <source media="(min-width: 768px)" srcSet={cat.image} />
                <img
                  src={cat.mobileImage}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </picture>
            </div>
            <span className="text-[13px] font-medium text-[#1C2120] text-center leading-tight transition-colors duration-200 group-hover:text-[#737530]">
              {cat.name}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
