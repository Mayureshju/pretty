"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const flowers = [
  { name: "Roses", href: "/flowers/roses/", image: "/images/flowers/roses.jpg" },
  { name: "Carnations", href: "/flowers/carnations/", image: "/images/flowers/carnations.jpg" },
  { name: "Orchids", href: "/flowers/orchids/", image: "/images/flowers/orchids.jpg" },
  { name: "Mixed Flowers", href: "/flowers/mixed-flowers/", image: "/images/flowers/sunflowers.jpg" },
  { name: "Gerberas", href: "/flowers/gerberas/", image: "/images/flowers/gerberas.jpg" },
  { name: "Luxe", href: "/signature/", image: "/images/flowers/luxe.jpg" },
];

export default function FlowerTypes() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      const cards = sectionRef.current!.querySelectorAll(".flower-card");
      gsap.fromTo(cards,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 85%" } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="max-w-[1440px] mx-auto px-4 py-4 md:py-6">
      <h2 className="text-lg md:text-xl font-semibold text-[#1C2120] mb-3 md:mb-4">
        Pick Their Fav Flowers
      </h2>

      <div className="flex gap-3 md:gap-4 overflow-x-auto scroll-container pb-2 md:pb-0">
        {flowers.map((flower) => (
          <a
            key={flower.name}
            href={flower.href}
            className="flower-card shrink-0 w-[140px] md:w-[180px] lg:flex-1 group"
          >
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-[#F5F0EB] transition-shadow duration-300 group-hover:shadow-lg">
              <img
                src={flower.image}
                alt={flower.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <p className="text-[13px] md:text-sm font-medium text-[#1C2120] text-center mt-2 transition-colors group-hover:text-[#737530]">
              {flower.name}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
