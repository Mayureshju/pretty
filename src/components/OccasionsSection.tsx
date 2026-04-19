"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const birthdayCategories = [
  { name: "Flowers", href: "/flowers/birthday/", image: "/images/birthday-section/flowers.png" },
  { name: "Cakes", href: "/cakes/", image: "/images/birthday-section/cakes.png" },
  { name: "Personalised", href: "/gifts/", image: "/images/birthday-section/personalised.png" },
  { name: "Plants", href: "/plants/", image: "/images/birthday-section/plants.png" },
  { name: "Gift Sets", href: "/combos-gifts/", image: "/images/birthday-section/gift-sets.png" },
  { name: "Fruit Basket", href: "/fruits/", image: "/images/birthday-section/hampers.png" },
  { name: "Balloon Decor", href: "/gifts/", image: "/images/birthday-section/balloons.png" },
  { name: "Bestsellers", href: "/popular/", image: "/images/birthday-section/bestsellers.png" },
];

export default function OccasionsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      const banner = sectionRef.current!.querySelector(".banner-side");
      if (banner) {
        gsap.fromTo(banner,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.6, ease: "power2.out",
            scrollTrigger: { trigger: sectionRef.current, start: "top 80%" } }
        );
      }
      const cards = sectionRef.current!.querySelectorAll(".bday-card");
      gsap.fromTo(cards,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%" } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="max-w-[1440px] mx-auto px-4 py-4 md:py-6">
      <div className="flex flex-col md:flex-row gap-4 md:gap-5">
        {/* Left: Promotional Banner */}
        <a
          href="/flowers/birthday/"
          className="banner-side relative w-full md:w-[38%] rounded-2xl overflow-hidden bg-[#FFF8E7] group flex-shrink-0"
        >
          <div className="relative aspect-[4/3] md:aspect-auto md:h-full min-h-[280px] md:min-h-[360px]">
            <img
              src="/images/birthday-section/banner.png"
              alt="Birthdays Made Special"
              className="w-full h-full object-cover object-center"
              loading="lazy"
            />
            {/* Overlay text */}
            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 bg-gradient-to-t from-[#FFF8E7]/95 via-[#FFF8E7]/60 to-transparent">
              <h3 className="text-2xl md:text-3xl font-bold text-[#D4145A] leading-tight">
                Birthdays Made Special
              </h3>
              <p className="text-sm text-[#444] mt-1">
                Joyful gifts to #MakeItSpecial
              </p>
              {/* Arrow button */}
              <div className="mt-3 w-12 h-12 rounded-full bg-[#EA1E61] flex items-center justify-center transition-transform group-hover:scale-110">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </a>

        {/* Right: Category Grid */}
        <div className="flex-1 grid grid-cols-4 gap-2 md:gap-3">
          {birthdayCategories.map((cat) => (
            <a
              key={cat.name}
              href={cat.href}
              className="bday-card flex flex-col items-center group"
            >
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#FFF5F0] border border-[#FFE8DE]/50 transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.03]">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-contain p-1"
                  loading="lazy"
                />
              </div>
              <span className="text-[11px] md:text-[13px] font-medium text-[#1C2120] text-center mt-1.5 leading-tight">
                {cat.name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
