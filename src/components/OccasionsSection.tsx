"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const occasions = [
  { name: "Birthday", href: "/birthday", image: "/images/occasions/birthday.jpg" },
  { name: "Anniversary", href: "/anniversary", image: "/images/occasions/anniversary.jpg" },
  { name: "Valentine's Day", href: "/valentines-day", image: "/images/occasions/valentines.jpg" },
  { name: "Wedding", href: "/wedding", image: "/images/occasions/wedding.jpg" },
  { name: "Get Well Soon", href: "/get-well-soon", image: "/images/occasions/get-well.jpg" },
  { name: "Housewarming", href: "/housewarming", image: "/images/occasions/housewarming.jpg" },
  { name: "Congratulations", href: "/congratulations", image: "/images/occasions/congratulations.jpg" },
  { name: "Corporate", href: "/corporate", image: "/images/occasions/corporate.jpg" },
];

export default function OccasionsSection() {
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
          stagger: 0.06,
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
        Shop by Occasion
      </h2>

      <div className="flex gap-5 overflow-x-auto pb-2 scroll-container md:flex-wrap md:overflow-visible md:pb-0">
        {occasions.map((occ, i) => (
          <a
            key={occ.name}
            href={occ.href}
            ref={(el) => { itemsRef.current[i] = el; }}
            className="flex flex-col items-center gap-2 group shrink-0"
          >
            <div className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] overflow-hidden rounded-full bg-[#F5F5F5]">
              <img
                src={occ.image}
                alt={occ.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <span className="text-[13px] font-medium text-[#1C2120] text-center leading-tight transition-colors duration-200 group-hover:text-[#737530]">
              {occ.name}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
