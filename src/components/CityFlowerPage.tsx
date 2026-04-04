"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface CityData {
  city: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  intro: string;
  sections: { title: string; content: string }[];
  testimonials: { name: string; text: string; rating: number }[];
  categories: { name: string; count: number; href: string }[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} width="14" height="14" viewBox="0 0 24 24" fill={star <= rating ? "#FDCB6E" : "#E5E7EB"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function CityFlowerPage({ data }: { data: CityData }) {
  const heroRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Content sections fade in
    if (contentRef.current) {
      const sections = contentRef.current.querySelectorAll(".content-section");
      gsap.fromTo(
        sections,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: contentRef.current, start: "top 80%" },
        }
      );
    }

    // Testimonials fade in
    if (testimonialsRef.current) {
      const cards = testimonialsRef.current.querySelectorAll(".testimonial-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: testimonialsRef.current, start: "top 80%" },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative w-full h-[240px] sm:h-[300px] md:h-[360px] overflow-hidden"
      >
        <img
          src={data.heroImage}
          alt={data.heroTitle}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(28,33,32,0.8) 0%, rgba(28,33,32,0.4) 60%, rgba(28,33,32,0.15) 100%)" }}
        />
        <div className="relative z-10 h-full max-w-[1440px] mx-auto px-4 sm:px-8 flex flex-col justify-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
            {data.heroTitle}
          </h1>
          <p className="text-sm sm:text-base text-white/70 mt-2 max-w-lg">
            {data.heroSubtitle}
          </p>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mt-4 text-xs text-white/50">
            <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80">Send Flowers to {data.city}</span>
          </div>
        </div>
      </section>

      {/* Categories Strip */}
      <div className="border-b border-[#E5E5E5]">
        <div className="max-w-[1440px] mx-auto px-4 py-4 flex items-center gap-4 md:gap-6 overflow-x-auto scroll-container">
          {data.categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="flex items-center gap-2 shrink-0 text-sm text-[#1C2120] hover:text-[#737530] transition-colors font-medium"
            >
              {cat.name}
              <span className="text-[11px] text-[#939393]">({cat.count})</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl">
          {/* Intro */}
          <p className="text-[15px] md:text-base text-[#444] leading-relaxed mb-8">
            {data.intro}
          </p>

          {/* Content Sections */}
          <div ref={contentRef} className="space-y-8">
            {data.sections.map((section, i) => (
              <div key={i} className="content-section">
                <h2 className="text-lg md:text-xl font-semibold text-[#1C2120] mb-3">
                  {section.title}
                </h2>
                <p className="text-[14px] md:text-[15px] text-[#555] leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-[#F7F8F1]">
        <div className="max-w-[1440px] mx-auto px-4 py-10 md:py-14" ref={testimonialsRef}>
          <h2 className="text-lg md:text-xl font-semibold text-[#1C2120] mb-6">
            What Our Customers in {data.city} Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {data.testimonials.map((t, i) => (
              <div
                key={i}
                className="testimonial-card bg-white rounded-xl border border-[#E8E8E8] p-5"
              >
                <StarRating rating={t.rating} />
                <p className="mt-3 text-[14px] text-[#444] leading-relaxed line-clamp-4">
                  {t.text}
                </p>
                <p className="mt-4 text-[14px] font-semibold text-[#1C2120]">
                  {t.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="max-w-[1440px] mx-auto px-4 py-10 md:py-14">
        <div className="bg-[#1C2120] rounded-2xl px-6 md:px-10 py-8 md:py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl md:text-2xl font-semibold text-white">
              Ready to Send Flowers to {data.city}?
            </h3>
            <p className="text-sm text-white/60 mt-1">
              Same-day delivery available. Order before 4 PM.
            </p>
          </div>
          <Link
            href="/flowers/"
            className="px-6 py-3 text-sm font-medium text-[#1C2120] bg-white rounded-full hover:bg-gray-100 transition-colors shrink-0"
          >
            Shop Flowers Now
          </Link>
        </div>
      </div>
    </>
  );
}
