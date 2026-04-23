"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface CardItem {
  title: string;
  href: string;
  image: string;
  price?: number;
}

const occasionItems: CardItem[] = [
  { title: "Birthday", href: "/flowers/birthday/", image: "/images/occasions/birthday.png" },
  { title: "Wedding", href: "/flowers/wedding/", image: "/images/occasions/wedding.png" },
  { title: "House Warming", href: "/flowers/house-warming/", image: "/images/occasions/house-warming.png" },
  { title: "Anniversary", href: "/flowers/anniversary/", image: "/images/occasions/anniversary.png" },
  { title: "Mother's Day", href: "/flowers/mother-flower/", image: "/images/occasions/mother-flower.png" },
];

function LargeCardRow({
  title,
  items,
  showPrice,
}: {
  title: string;
  items: CardItem[];
  showPrice?: boolean;
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
            {showPrice && item.price != null && (
              <p className="text-[12px] md:text-[13px] text-[#737530] font-semibold text-center mt-0.5">
                &#8377;{item.price.toLocaleString("en-IN")}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

interface CakeProduct {
  name: string;
  slug: string;
  image: string;
  price: number;
}

export default function CategoryCards({ cakes }: { cakes?: CakeProduct[] }) {
  const cakeItems: CardItem[] = cakes && cakes.length > 0
    ? cakes.map((c) => ({
        title: c.name,
        href: `/product/${c.slug}/`,
        image: c.image,
        price: c.price,
      }))
    : [
        { title: "Chocolate", href: "/cakes/premium-cakes/", image: "/images/cakes/chocolate.jpg" },
        { title: "Butterscotch", href: "/cakes/premium-cakes/", image: "/images/cakes/butterscotch.jpg" },
        { title: "LUXE", href: "/cakes/premium-cakes/", image: "/images/cakes/luxe.jpg" },
        { title: "Fresh Fruits", href: "/cakes/premium-cakes/", image: "/images/cakes/fresh-fruits.jpg" },
        { title: "Cakes With Flowers", href: "/cakes/premium-cakes/", image: "/images/cakes/cakes-with-flowers.jpg" },
      ];

  return (
    <section className="max-w-[1440px] mx-auto px-4 py-6 md:py-10 space-y-8 md:space-y-10">
      <LargeCardRow title="Bakery-Fresh Cakes" items={cakeItems} showPrice={!!cakes?.length} />
      <LargeCardRow title="Special Occasions" items={occasionItems} />
    </section>
  );
}
