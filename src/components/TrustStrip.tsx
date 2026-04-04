"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function TrustStrip() {
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stripRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        stripRef.current,
        { opacity: 0, y: 8 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
          scrollTrigger: { trigger: stripRef.current, start: "top 92%" },
        }
      );
    }, stripRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={stripRef}
      className="border-y border-[#E5E5E5]"
    >
      <div className="max-w-[1440px] mx-auto px-4 py-3 flex items-center justify-center gap-1.5">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="#FDCB6E"
          stroke="none"
          className="shrink-0"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <span className="text-[13px] font-medium text-[#1C2120]">
          Rated 4.9/5
        </span>
        <span className="text-[13px] text-[#939393] mx-1">|</span>
        <span className="text-[13px] font-medium text-[#1C2120]">
          Trusted by 50,000+ Happy Customers
        </span>
      </div>
    </div>
  );
}
