"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const collections = [
  { title: "Roses", href: "/flowers/roses/", image: "/images/categories/roses.png" },
  { title: "Exotic Flowers", href: "/flowers/exotic-flowers/", image: "/images/categories/exotic-flowers.png" },
  { title: "Combos & Gifts", href: "/combos-gifts/", image: "/images/categories/combos-gifts.png" },
  { title: "Signature Floral Arrangements", href: "/signature/", image: "/images/categories/signature.png" },
  { title: "Birthday", href: "/flowers/birthday/", image: "/images/categories/birthday.png" },
  { title: "Wedding", href: "/flowers/wedding/", image: "/images/categories/wedding.png" },
  { title: "Corporate", href: "/flowers/corporate/", image: "/images/categories/corporate.png" },
  { title: "Fruits", href: "/fruits/", image: "/images/categories/fruits.png" },
];

export default function FeaturedCollection() {
  const sectionRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const items = itemsRef.current.filter(Boolean);
    gsap.fromTo(
      items,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 78%" },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="max-w-[1440px] mx-auto px-4 py-10 md:py-16">
      <h2 className="text-lg md:text-xl font-semibold text-[#1C2120] mb-4 md:mb-6">
        Explore Our Collections
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {collections.map((col, i) => (
          <Link
            key={col.title}
            href={col.href}
            ref={(el) => { itemsRef.current[i] = el; }}
            className="group block"
          >
            <div className="aspect-square rounded-xl overflow-hidden bg-[#F7F8F1]">
              <img
                src={col.image}
                alt={col.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <p className="mt-2 text-[14px] font-medium text-[#1C2120] group-hover:text-[#737530] transition-colors">
              {col.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
