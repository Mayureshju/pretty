"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const categoryCards = [
  {
    title: "Delicious Cakes",
    image: "/images/products/cakes-category.jpg",
    links: [
      { label: "Birthday Cakes", href: "/birthday/cakes" },
      { label: "Anniversary Cakes", href: "/anniversary/cakes" },
      { label: "Designer Cakes", href: "/cakes/designer" },
      { label: "Photo Cakes", href: "/cakes/photo" },
      { label: "Chocolate Cakes", href: "/cakes/chocolate" },
    ],
  },
  {
    title: "Gifting Gallery",
    image: "/images/products/gifts-category.jpg",
    links: [
      { label: "Photo Gifts", href: "/gifts/photo-gifts" },
      { label: "Mugs", href: "/gifts/mugs" },
      { label: "Cushions", href: "/gifts/cushions" },
      { label: "Name Gifts", href: "/personalised-gifts/name-gifts" },
      { label: "Caricatures", href: "/personalised-gifts/caricatures" },
    ],
  },
  {
    title: "Floral Delights",
    image: "/images/products/flowers-category.jpg",
    links: [
      { label: "Red Roses", href: "/flowers/roses" },
      { label: "Birthday Flowers", href: "/birthday/flowers" },
      { label: "Anniversary Flowers", href: "/anniversary/flowers" },
      { label: "Exotic Flowers", href: "/flowers/exotic" },
      { label: "Flower Boxes", href: "/flowers/in-box" },
    ],
  },
  {
    title: "Plant Paradise",
    image: "/images/products/plants-category.jpg",
    links: [
      { label: "Bonsai", href: "/plants/bonsai" },
      { label: "Indoor", href: "/plants/indoor" },
      { label: "Air Purifying", href: "/plants/air-purifying" },
      { label: "Lucky Bamboo", href: "/plants/lucky-bamboo" },
      { label: "Flowering", href: "/plants/flowering" },
    ],
  },
];

export default function CategoryCards() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const cards = cardsRef.current.filter(Boolean);

    gsap.fromTo(
      cards,
      { opacity: 0, y: 30, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.55,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      }
    );

    // Image parallax on hover
    cards.forEach((card) => {
      if (!card) return;
      const img = card.querySelector("img");
      if (!img) return;

      card.addEventListener("mouseenter", () => {
        gsap.to(img, { scale: 1.06, duration: 0.5, ease: "power2.out" });
        gsap.to(card, { boxShadow: "0 8px 30px rgba(0,0,0,0.1)", duration: 0.3 });
      });
      card.addEventListener("mouseleave", () => {
        gsap.to(img, { scale: 1, duration: 0.5, ease: "power2.inOut" });
        gsap.to(card, { boxShadow: "0 1px 6px rgba(0,0,0,0.06)", duration: 0.3 });
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-8 md:py-10" style={{ backgroundColor: "var(--bg-section)" }}>
      <div className="max-w-[1320px] mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {categoryCards.map((card, i) => (
            <div
              key={card.title}
              ref={(el) => { cardsRef.current[i] = el; }}
              className="bg-white rounded-xl overflow-hidden flex"
              style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}
            >
              {/* Image Side */}
              <div className="w-[140px] sm:w-[160px] md:w-[200px] shrink-0 overflow-hidden">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Content Side */}
              <div className="flex-1 p-4 md:p-5">
                <h3 className="text-base md:text-lg font-semibold text-[#1C2120] italic mb-3">
                  {card.title}
                </h3>
                <ul className="space-y-1.5">
                  {card.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-[13px] md:text-sm text-[#464646] hover:text-[#C48B9F] transition-colors flex items-center gap-1.5"
                      >
                        <svg width="6" height="6" viewBox="0 0 6 6" className="shrink-0 opacity-40">
                          <circle cx="3" cy="3" r="3" fill="currentColor" />
                        </svg>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
