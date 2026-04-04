"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const cakeItems = [
  { title: "Chocolate", href: "/cakes/premium-cakes/", image: "/images/cakes/chocolate.jpg" },
  { title: "Butterscotch", href: "/cakes/premium-cakes/", image: "/images/cakes/butterscotch.jpg" },
  { title: "LUXE", href: "/cakes/premium-cakes/", image: "/images/cakes/luxe.jpg" },
  { title: "Fresh Fruits", href: "/cakes/premium-cakes/", image: "/images/cakes/fresh-fruits.jpg" },
  { title: "Cakes With Flowers", href: "/cakes/premium-cakes/", image: "/images/cakes/cakes-with-flowers.jpg" },
];

const giftItems = [
  { title: "Photo Gifts", href: "/gifts/", image: "/images/gifts/photo-gifts.jpg" },
  { title: "Soft Toys", href: "/gifts/", image: "/images/gifts/soft-toys.jpg" },
  { title: "Chocolates", href: "/gifts/", image: "/images/gifts/chocolates.jpg" },
  { title: "Mugs", href: "/gifts/", image: "/images/gifts/mugs.jpg" },
  { title: "Cushions", href: "/gifts/", image: "/images/gifts/cushions.jpg" },
];

function LargeCardRow({
  title,
  items,
}: {
  title: string;
  items: typeof cakeItems;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      const cards = sectionRef.current!.querySelectorAll(".lg-card");
      gsap.fromTo(cards,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 82%" } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef}>
      <h2 className="text-lg md:text-xl font-semibold text-[#1C2120] mb-3 md:mb-4">
        {title}
      </h2>
      <div className="flex gap-3 md:gap-4 overflow-x-auto scroll-container pb-2 md:pb-0">
        {items.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="lg-card shrink-0 w-[160px] md:w-[200px] lg:flex-1 group"
          >
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-[#F5F0EB] transition-shadow duration-300 group-hover:shadow-lg">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <p className="text-[13px] md:text-sm font-medium text-[#1C2120] text-center mt-2.5 transition-colors group-hover:text-[#737530]">
              {item.title}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function CategoryCards() {
  return (
    <section className="max-w-[1440px] mx-auto px-4 py-6 md:py-10 space-y-8 md:space-y-10">
      <LargeCardRow title="Bakery-Fresh Cakes" items={cakeItems} />
      <LargeCardRow title="Personalise Your Moments" items={giftItems} />
    </section>
  );
}
