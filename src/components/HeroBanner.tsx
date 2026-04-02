"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import gsap from "gsap";

const banners = [
  {
    id: 1,
    title: "A Hamper",
    subtitle: "full of love and surprises",
    image: "/images/banners/hamper.jpg",
    overlay: "linear-gradient(90deg, rgba(245,230,240,0.92) 0%, rgba(245,230,240,0.7) 50%, rgba(245,230,240,0.2) 100%)",
  },
  {
    id: 2,
    titleTop: "A Slice of Happiness for",
    titleAccent: "Their",
    subtitle: "Birthday",
    image: "/images/banners/birthday.jpg",
    overlay: "linear-gradient(90deg, rgba(242,196,196,0.92) 0%, rgba(242,196,196,0.7) 50%, rgba(242,196,196,0.15) 100%)",
  },
  {
    id: 3,
    title: "Fresh Flowers",
    subtitle: "Delivered with Love",
    image: "/images/banners/flowers.jpg",
    overlay: "linear-gradient(90deg, rgba(196,232,212,0.92) 0%, rgba(196,232,212,0.7) 50%, rgba(196,232,212,0.15) 100%)",
  },
  {
    id: 4,
    title: "Delicious Cakes",
    subtitle: "For Every Celebration",
    image: "/images/banners/cakes.jpg",
    overlay: "linear-gradient(90deg, rgba(232,212,196,0.92) 0%, rgba(232,212,196,0.7) 50%, rgba(232,212,196,0.15) 100%)",
  },
  {
    id: 5,
    title: "Green Plants",
    subtitle: "To Brighten Your Space",
    image: "/images/banners/plants.jpg",
    overlay: "linear-gradient(90deg, rgba(196,216,232,0.92) 0%, rgba(196,216,232,0.7) 50%, rgba(196,216,232,0.15) 100%)",
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const deliveryRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<(HTMLDivElement | null)[]>([]);

  const animateTextIn = useCallback(() => {
    if (!textRef.current || !deliveryRef.current) return;
    const tl = gsap.timeline();
    tl.fromTo(
      textRef.current.children,
      { opacity: 0, y: 25, clipPath: "inset(0 0 100% 0)" },
      { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 0.6, stagger: 0.1, ease: "power3.out" }
    );
    tl.fromTo(
      deliveryRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
      "-=0.3"
    );
  }, []);

  const goTo = useCallback((idx: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    const currentSlide = slidesRef.current[current];
    const nextSlide = slidesRef.current[idx];

    if (currentSlide && nextSlide) {
      const tl = gsap.timeline({
        onComplete: () => {
          setCurrent(idx);
          setIsTransitioning(false);
          animateTextIn();
        },
      });

      // Ken Burns - subtle zoom on current image
      tl.to(currentSlide, { opacity: 0, scale: 1.05, duration: 0.7, ease: "power2.inOut" });
      tl.fromTo(
        nextSlide,
        { opacity: 0, scale: 1.1 },
        { opacity: 1, scale: 1, duration: 0.7, ease: "power2.inOut" },
        "-=0.5"
      );
    } else {
      setCurrent(idx);
      setIsTransitioning(false);
    }
  }, [isTransitioning, current, animateTextIn]);

  // Initial entrance animation
  useEffect(() => {
    animateTextIn();
    // Subtle Ken Burns drift on active slide
    const currentSlide = slidesRef.current[current];
    if (currentSlide) {
      gsap.fromTo(
        currentSlide.querySelector("img"),
        { scale: 1 },
        { scale: 1.06, duration: 8, ease: "none", repeat: -1, yoyo: true }
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setInterval(() => {
      goTo((current + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [current, goTo]);

  const banner = banners[current];

  return (
    <div className="relative w-full">
      {/* Banner */}
      <div className="relative w-full h-[200px] sm:h-[280px] md:h-[360px] lg:h-[420px] overflow-hidden">
        {banners.map((b, idx) => (
          <div
            key={b.id}
            ref={(el) => { slidesRef.current[idx] = el; }}
            className="absolute inset-0"
            style={{ opacity: idx === current ? 1 : 0 }}
          >
            <img
              src={b.image}
              alt={b.title || b.subtitle}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: b.overlay }} />
          </div>
        ))}

        {/* Text Content */}
        <div className="relative z-10 h-full max-w-[1320px] mx-auto px-4 sm:px-8 flex flex-col justify-center">
          <div ref={textRef}>
            {banner.titleTop ? (
              <>
                <p className="text-base sm:text-lg md:text-xl text-[#1C2120]/70 font-light">
                  {banner.titleTop}
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#1C2120] leading-tight">
                  <span className="italic font-light mr-2">{banner.titleAccent}</span>
                  {banner.subtitle}
                </h2>
              </>
            ) : (
              <>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#1C2120] leading-tight">
                  {banner.title}
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-[#1C2120]/70 font-light italic mt-1">
                  {banner.subtitle}
                </p>
              </>
            )}
          </div>

          {/* Delivery Location Input */}
          <div className="mt-4 sm:mt-6 max-w-[420px]" ref={deliveryRef}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-3 py-2 text-[11px] sm:text-xs font-medium text-[#0E4D65] bg-[#0E4D65]/5 border-b border-[#0E4D65]/10">
                Enter delivery location
              </div>
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="text-sm">🇮🇳</span>
                <div className="flex items-center gap-2 flex-1 border border-gray-200 rounded px-2 py-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search for area / landmark..."
                    className="flex-1 text-xs sm:text-sm text-gray-600 outline-none bg-transparent placeholder:text-gray-400"
                  />
                </div>
                <button
                  className="shrink-0 p-1.5 rounded transition-colors hover:bg-gray-100 cursor-pointer"
                  title="Use current location"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0E4D65" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => goTo((current - 1 + banners.length) % banners.length)}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          onClick={() => goTo((current + 1) % banners.length)}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Dots - animated active indicator */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className="rounded-full transition-all duration-500 cursor-pointer"
            style={{
              width: current === idx ? 28 : 8,
              height: 8,
              backgroundColor: current === idx ? "#0E4D65" : "#D1D5DB",
              borderRadius: 4,
            }}
          />
        ))}
      </div>
    </div>
  );
}
