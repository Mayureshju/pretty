"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const occasions = [
  {
    name: "Birthday Gifts",
    href: "/birthday",
    image: "/images/occasions/birthday.jpg",
  },
  {
    name: "Anniversary Gifts",
    href: "/anniversary",
    image: "/images/occasions/anniversary.jpg",
  },
  {
    name: "Gifts for Him",
    href: "/gifts/for-him",
    image: "/images/occasions/gifts-him.jpg",
  },
  {
    name: "Gifts for Her",
    href: "/gifts/for-her",
    image: "/images/occasions/gifts-her.jpg",
  },
];

export default function OccasionsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    // Heading animation
    if (headingRef.current) {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          },
        }
      );
    }

    // Cards stagger
    const cards = cardsRef.current.filter(Boolean);
    gsap.fromTo(
      cards,
      { opacity: 0, y: 50, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
      }
    );

    // Hover parallax on images
    cards.forEach((card) => {
      if (!card) return;
      const img = card.querySelector("img");
      if (!img) return;

      card.addEventListener("mouseenter", () => {
        gsap.to(img, { scale: 1.08, duration: 0.5, ease: "power2.out" });
      });
      card.addEventListener("mouseleave", () => {
        gsap.to(img, { scale: 1, duration: 0.5, ease: "power2.inOut" });
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="max-w-[1320px] mx-auto px-4 py-6 md:py-10">
      <div ref={headingRef}>
        <h2 className="text-xl md:text-2xl font-semibold text-[#1C2120] text-center">
          Shop By Occasions &amp; Relations
        </h2>
        <p className="text-sm text-[#888] text-center mt-1 mb-6 md:mb-8">
          Surprise Your Loved Ones
        </p>
      </div>

      <div className="flex items-start justify-center gap-4 sm:gap-6 md:gap-8 flex-wrap">
        {occasions.map((occ, i) => (
          <a
            key={occ.name}
            href={occ.href}
            ref={(el) => { cardsRef.current[i] = el; }}
            className="flex flex-col items-center gap-3 cursor-pointer"
          >
            <div className="w-[150px] h-[180px] sm:w-[170px] sm:h-[200px] md:w-[200px] md:h-[240px] lg:w-[240px] lg:h-[280px] rounded-2xl overflow-hidden shadow-md">
              <img
                src={occ.image}
                alt={occ.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <span className="text-sm md:text-[15px] font-medium text-[#1C2120] text-center transition-colors hover:text-[#0E4D65]">
              {occ.name}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
