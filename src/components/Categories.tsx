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

    if (headingRef.current) {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power3.out",
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
      { opacity: 0, y: 25 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 82%",
        },
      }
    );

    items.forEach((item) => {
      if (!item) return;
      const img = item.querySelector("picture");
      if (!img) return;

      item.addEventListener("mouseenter", () => {
        gsap.to(img, { scale: 1.06, duration: 0.4, ease: "power2.out" });
      });
      item.addEventListener("mouseleave", () => {
        gsap.to(img, { scale: 1, duration: 0.4, ease: "power2.inOut" });
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="max-w-[1320px] mx-auto px-4 py-6 md:py-10">
      <h2
        ref={headingRef}
        className="font-serif text-[22px] md:text-[28px] font-semibold text-center tracking-wide text-text-dark mb-6 md:mb-8"
      >
        Categories
      </h2>

      <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-6">
        {categories.map((cat, i) => (
          <a
            key={cat.name}
            href={cat.href}
            ref={(el) => { itemsRef.current[i] = el; }}
            className="flex flex-col items-center gap-2 md:gap-2.5 group"
          >
            <div className="w-full aspect-square overflow-hidden rounded-lg md:rounded-xl bg-bg-light">
              <picture className="block w-full h-full transition-transform duration-300">
                <source media="(min-width: 768px)" srcSet={cat.image} />
                <img
                  src={cat.mobileImage}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </picture>
            </div>
            <span className="font-sans text-[13px] md:text-[14px] font-medium tracking-[0.01em] text-text-dark text-center leading-tight transition-colors duration-200 group-hover:text-primary">
              {cat.name}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
