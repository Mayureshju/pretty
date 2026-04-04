"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const cakeItems = [
  { title: "Chocolate", href: "/cakes/chocolate", image: "/images/products/chocolate-cake.jpg" },
  { title: "Butterscotch", href: "/cakes/butterscotch", image: "/images/products/butterscotch-cake.jpg" },
  { title: "Red Velvet", href: "/cakes/red-velvet", image: "/images/products/red-velvet-cake.jpg" },
  { title: "Fruit", href: "/cakes/fruit", image: "/images/products/fruit-cake.jpg" },
  { title: "Designer", href: "/cakes/designer", image: "/images/products/designer-cake.jpg" },
];

const giftItems = [
  { title: "Photo Gifts", href: "/gifts/photo-gifts", image: "/images/products/photo-gifts.jpg" },
  { title: "Soft Toys", href: "/gifts/soft-toys", image: "/images/products/soft-toys.jpg" },
  { title: "Chocolates", href: "/gifts/chocolates", image: "/images/products/chocolates.jpg" },
  { title: "Mugs", href: "/gifts/mugs", image: "/images/products/mugs.jpg" },
  { title: "Cushions", href: "/gifts/cushions", image: "/images/products/cushions.jpg" },
];

function CategoryRow({
  title,
  items,
  sectionRef,
}: {
  title: string;
  items: typeof cakeItems;
  sectionRef: React.RefObject<HTMLDivElement | null>;
}) {
  const rowRef = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const els = rowRef.current.filter(Boolean);
    gsap.fromTo(
      els,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        stagger: 0.07,
        ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [sectionRef]);

  return (
    <div ref={sectionRef}>
      <h2 className="text-lg md:text-xl font-semibold text-[#1C2120] mb-4 md:mb-5">
        {title}
      </h2>
      <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item, i) => (
          <Link
            key={item.title}
            href={item.href}
            ref={(el) => { rowRef.current[i] = el; }}
            className="group flex-shrink-0 w-[130px] md:w-[160px]"
          >
            <div className="aspect-square rounded-xl overflow-hidden bg-[#F5F5F5]">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <p className="mt-2 text-[13px] font-medium text-[#1C2120] text-center group-hover:text-[#737530] transition-colors">
              {item.title}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function CategoryCards() {
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);

  return (
    <section className="max-w-[1320px] mx-auto px-4 py-8 md:py-12 space-y-10">
      <CategoryRow title="Fresh Cakes & More" items={cakeItems} sectionRef={section1Ref} />
      <CategoryRow title="Gift Something Special" items={giftItems} sectionRef={section2Ref} />
    </section>
  );
}
