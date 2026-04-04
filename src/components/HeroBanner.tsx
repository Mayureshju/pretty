"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(SplitText, ScrollTrigger);

const banners = [
  {
    id: 1,
    tag: "Handcrafted With Love",
    title: "Fresh Blooms\nDelivered Daily",
    subtitle: "Premium bouquets crafted by Mumbai's finest florists",
    cta: { text: "Explore Collection", href: "/flowers/" },
    image: "/images/banners/flowers.jpg",
  },
  {
    id: 2,
    tag: "Celebrate Every Moment",
    title: "Birthday\nSurprises",
    subtitle: "Cakes, flowers & gifts that make their day unforgettable",
    cta: { text: "Shop Birthday", href: "/birthday/" },
    image: "/images/banners/birthday.jpg",
  },
  {
    id: 3,
    tag: "The Perfect Gift",
    title: "Curated\nHampers",
    subtitle: "Thoughtfully assembled hampers full of love and surprises",
    cta: { text: "Browse Hampers", href: "/hampers/" },
    image: "/images/banners/hamper.jpg",
  },
  {
    id: 4,
    tag: "Baked Fresh Daily",
    title: "Artisan\nCakes",
    subtitle: "Delicious handcrafted cakes for every celebration",
    cta: { text: "Order Cakes", href: "/cakes/" },
    image: "/images/banners/cakes.jpg",
  },
  {
    id: 5,
    tag: "Breathe Life Into Spaces",
    title: "Living\nGreens",
    subtitle: "Lush plants to brighten your home and office",
    cta: { text: "Shop Plants", href: "/plants/" },
    image: "/images/banners/plants.jpg",
  },
];

const SLIDE_DURATION = 6;

function FloatingPetals() {
  const petals = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: 6 + Math.random() * 10,
    delay: Math.random() * 12,
    duration: 14 + Math.random() * 10,
    swayDuration: 4 + Math.random() * 4,
    rotation: Math.random() * 360,
    opacity: 0.08 + Math.random() * 0.1,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {petals.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: p.left,
            top: "-20px",
            width: p.size,
            height: p.size * 1.3,
            opacity: p.opacity,
            borderRadius: "50% 0 50% 50%",
            background: `linear-gradient(135deg, var(--accent-rose), var(--primary-light))`,
            transform: `rotate(${p.rotation}deg)`,
            animation: `petalDrift ${p.duration}s ${p.delay}s linear infinite, petalSway ${p.swayDuration}s ${p.delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const slidesRef = useRef<(HTMLDivElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressRefs = useRef<(HTMLDivElement | null)[]>([]);
  const splitInstanceRef = useRef<SplitText | null>(null);
  const progressTweenRef = useRef<gsap.core.Tween | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kenBurnsRef = useRef<gsap.core.Tween | null>(null);

  const cleanupSplit = useCallback(() => {
    if (splitInstanceRef.current) {
      splitInstanceRef.current.revert();
      splitInstanceRef.current = null;
    }
  }, []);

  const animateSlideIn = useCallback((index: number) => {
    const content = contentRefs.current[index];
    const slide = slidesRef.current[index];
    if (!content || !slide) return;

    const tag = content.querySelector("[data-tag]");
    const title = content.querySelector("[data-title]");
    const subtitle = content.querySelector("[data-subtitle]");
    const cta = content.querySelector("[data-cta]");
    const img = slide.querySelector("img");

    const tl = gsap.timeline();

    // Image clip-path reveal
    tl.fromTo(
      slide,
      { clipPath: "inset(0 0 100% 0)" },
      { clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: "power3.inOut" },
      0
    );

    // Ken Burns zoom
    if (img) {
      kenBurnsRef.current?.kill();
      gsap.set(img, { scale: 1 });
      kenBurnsRef.current = gsap.to(img, {
        scale: 1.08,
        duration: 8,
        ease: "none",
        repeat: -1,
        yoyo: true,
      });
    }

    // Tag fade up
    if (tag) {
      tl.fromTo(
        tag,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" },
        0.4
      );
    }

    // Title SplitText reveal
    if (title) {
      cleanupSplit();
      splitInstanceRef.current = new SplitText(title, { type: "words" });
      tl.fromTo(
        splitInstanceRef.current.words,
        { opacity: 0, y: 60, rotateX: -40 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.7,
          stagger: 0.04,
          ease: "power4.out",
        },
        0.5
      );
    }

    // Subtitle fade up
    if (subtitle) {
      tl.fromTo(
        subtitle,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" },
        0.9
      );
    }

    // CTA button
    if (cta) {
      tl.fromTo(
        cta,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.7)" },
        1.1
      );
    }
  }, [cleanupSplit]);

  const animateProgressBar = useCallback((index: number) => {
    // Reset all segments
    progressRefs.current.forEach((seg) => {
      if (seg) gsap.set(seg, { scaleX: 0 });
    });
    // Fill completed segments
    for (let i = 0; i < index; i++) {
      const seg = progressRefs.current[i];
      if (seg) gsap.set(seg, { scaleX: 1 });
    }
    // Animate current segment
    const seg = progressRefs.current[index];
    if (seg) {
      progressTweenRef.current?.kill();
      gsap.set(seg, { scaleX: 0 });
      progressTweenRef.current = gsap.to(seg, {
        scaleX: 1,
        duration: SLIDE_DURATION,
        ease: "none",
      });
    }
  }, []);

  const goTo = useCallback(
    (idx: number) => {
      if (isTransitioning || idx === current) return;
      setIsTransitioning(true);

      const currentSlide = slidesRef.current[current];
      const currentContent = contentRefs.current[current];

      const tl = gsap.timeline({
        onComplete: () => {
          setCurrent(idx);
          setIsTransitioning(false);
        },
      });

      // Exit current slide content
      if (currentContent) {
        tl.to(currentContent.children, {
          opacity: 0,
          y: -30,
          duration: 0.3,
          stagger: 0.03,
          ease: "power2.in",
        }, 0);
      }

      // Exit current slide image
      if (currentSlide) {
        tl.to(currentSlide, {
          clipPath: "inset(100% 0 0 0)",
          duration: 0.6,
          ease: "power3.inOut",
        }, 0.15);
      }

      kenBurnsRef.current?.kill();
    },
    [isTransitioning, current]
  );

  // Entrance animation on slide change
  useEffect(() => {
    animateSlideIn(current);
    animateProgressBar(current);
  }, [current, animateSlideIn, animateProgressBar]);

  // Auto-play timer
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      const next = (current + 1) % banners.length;
      goTo(next);
    }, SLIDE_DURATION * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, goTo]);

  // Parallax on scroll
  useEffect(() => {
    if (!heroRef.current) return;
    const images = heroRef.current.querySelectorAll("[data-parallax-img]");
    const st = ScrollTrigger.create({
      trigger: heroRef.current,
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        const offset = self.progress * 60;
        images.forEach((img) => {
          gsap.set(img, { y: offset });
        });
      },
    });
    return () => st.kill();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative w-full h-[280px] sm:h-[380px] md:h-[450px] lg:h-[520px] overflow-hidden bg-[#3C2A20]"
    >
      {/* Slides */}
      {banners.map((b, idx) => (
        <div
          key={b.id}
          ref={(el) => { slidesRef.current[idx] = el; }}
          className="absolute inset-0"
          style={{
            clipPath: idx === 0 ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
            zIndex: idx === current ? 2 : 1,
          }}
        >
          {/* Background Image */}
          <div className="absolute inset-0" data-parallax-img>
            <Image
              src={b.image}
              alt={b.tag}
              fill
              className="object-cover"
              priority={idx === 0}
              sizes="100vw"
            />
          </div>

          {/* Gradient Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(60,42,32,0.82) 0%, rgba(60,42,32,0.55) 45%, rgba(60,42,32,0.15) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(60,42,32,0.5) 0%, transparent 40%)",
            }}
          />
        </div>
      ))}

      {/* Floating Petals */}
      <FloatingPetals />

      {/* Content Layer */}
      <div className="relative z-20 h-full max-w-[1440px] mx-auto px-6 sm:px-10 flex items-center">
        {banners.map((b, idx) => (
          <div
            key={b.id}
            ref={(el) => { contentRefs.current[idx] = el; }}
            className="absolute max-w-2xl"
            style={{
              visibility: idx === current ? "visible" : "hidden",
              pointerEvents: idx === current ? "auto" : "none",
            }}
          >
            {/* Tag */}
            <span
              data-tag
              className="inline-block text-[11px] sm:text-xs font-medium tracking-[0.2em] uppercase mb-3 sm:mb-4"
              style={{ color: "var(--accent-gold)", opacity: 0 }}
            >
              {b.tag}
            </span>

            {/* Title */}
            <h1
              data-title
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-4 sm:mb-5 whitespace-pre-line"
              style={{ perspective: "600px" }}
            >
              {b.title}
            </h1>

            {/* Subtitle */}
            <p
              data-subtitle
              className="text-sm sm:text-base md:text-lg text-white/70 font-light max-w-md mb-6 sm:mb-8"
              style={{ opacity: 0 }}
            >
              {b.subtitle}
            </p>

            {/* CTA Button */}
            <Link
              href={b.cta.href}
              data-cta
              className="group inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-sm sm:text-base font-medium text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
              style={{
                background: "var(--accent-gold)",
                opacity: 0,
                boxShadow: "0 4px 20px rgba(201,169,110,0.3)",
              }}
            >
              {b.cta.text}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => goTo((current - 1 + banners.length) % banners.length)}
        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 flex items-center justify-center transition-all duration-300 hover:bg-white/10 hover:border-white/40 cursor-pointer backdrop-blur-sm"
        aria-label="Previous slide"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={() => goTo((current + 1) % banners.length)}
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 flex items-center justify-center transition-all duration-300 hover:bg-white/10 hover:border-white/40 cursor-pointer backdrop-blur-sm"
        aria-label="Next slide"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex h-[3px]">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className="relative flex-1 cursor-pointer bg-white/15 group"
            aria-label={`Go to slide ${idx + 1}`}
          >
            <div
              ref={(el) => { progressRefs.current[idx] = el; }}
              className="absolute inset-0 origin-left"
              style={{
                background: "var(--accent-gold)",
                transform: "scaleX(0)",
              }}
            />
            {/* Hover expand area */}
            <div className="absolute -top-3 inset-x-0 h-3 group-hover:bg-white/5 transition-colors" />
          </button>
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-6 right-6 sm:right-10 z-30 flex items-center gap-1.5 text-white/50 text-xs font-light tracking-wider">
        <span className="text-white font-medium text-sm">{String(current + 1).padStart(2, "0")}</span>
        <span>/</span>
        <span>{String(banners.length).padStart(2, "0")}</span>
      </div>
    </section>
  );
}
