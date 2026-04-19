"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ── Section Types ── */

interface TextSection { type: "text"; title: string; content: string; subHeading?: string; listItems?: string[] }
interface OccasionsSection { type: "occasions"; title: string; content: string; listLabel?: string; occasions: string[]; closingLine?: string }
interface ProductHighlightSection { type: "product-highlight"; title: string; content?: string; highlights: { name: string; description: string }[]; closingLine?: string }
interface FeaturesSection { type: "features"; title: string; content?: string; features: { title: string; description: string }[] }
interface PromiseSection { type: "promise"; title: string; content: string; ensureLabel?: string; bullets: string[]; closingLine?: string; stepsIntro?: string; steps?: { label: string; description: string }[]; stepsClosing?: string }
interface ProcessSection { type: "process"; title: string; content?: string; qualitySteps?: { intro: string; items: string[]; closing?: string }; orderingIntro?: string; steps: { label: string; description: string }[]; closingLine?: string }
interface FAQSection { type: "faq"; title: string; faqs: { question: string; answer: string }[] }

export type ContentSection =
  | TextSection
  | OccasionsSection
  | ProductHighlightSection
  | FeaturesSection
  | PromiseSection
  | ProcessSection
  | FAQSection;

export type ContentSlot =
  | { slot: "section"; index: number }
  | { slot: "best-sellers" }
  | { slot: "popular-products" }
  | { slot: "collections" };

interface CityProduct {
  _id: string;
  name: string;
  slug: string;
  pricing: { regularPrice: number; salePrice?: number | null; currentPrice: number };
  images: { url: string; alt?: string; order: number }[];
  metrics: { ratingCount: number; averageRating: number; totalSales: number };
  isFeatured: boolean;
  _saleInfo?: { effectivePrice: number; discountPercent: number; saleLabel: string | null } | null;
}

export interface CityData {
  city: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  intro: string;
  sections: ContentSection[];
  contentLayout: ContentSlot[];
  testimonials: { name: string; text: string; rating: number }[];
  categories: { name: string; count: number; href: string }[];
  bestSellers?: CityProduct[];
  popularProducts?: CityProduct[];
}

/* ── Shared Components ── */

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

/* ── Collection Grid ── */

const collections = [
  { title: "Luxury Roses", href: "/flowers/roses", image: "/images/products/red-roses.jpg" },
  { title: "Gift Hampers", href: "/hampers/same-day-delivery", image: "/images/categories/hampers.jpg" },
  { title: "Flower Boxes", href: "/flowers/in-box", image: "/images/products/flower-box.jpg" },
  { title: "Birthday Specials", href: "/birthday/flowers", image: "/images/products/birthday-flowers.jpg" },
  { title: "Wedding Collection", href: "/flowers/wedding", image: "/images/products/wedding-flowers.jpg" },
  { title: "Premium Plants", href: "/plants/premium", image: "/images/products/premium-plants.jpg" },
  { title: "Chocolates", href: "/gifts/", image: "/images/gifts/chocolates.jpg" },
  { title: "Corporate Gifts", href: "/gifts/corporate", image: "/images/products/corporate-gifts.jpg" },
];

function CollectionGrid({ city }: { city: string }) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current) return;
    const items = gridRef.current.querySelectorAll(".collection-item");
    gsap.fromTo(
      items,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: "power2.out",
        scrollTrigger: { trigger: gridRef.current, start: "top 78%" },
      }
    );
    return () => { ScrollTrigger.getAll().forEach((t) => t.kill()); };
  }, []);

  return (
    <div ref={gridRef} className="max-w-[1440px] mx-auto px-4 py-10 md:py-14">
      <h2 className="text-xl md:text-2xl font-bold text-[#1C2120] mb-1">
        Explore Collections in {city}
      </h2>
      <p className="text-sm text-[#939393] mb-6">Curated categories for every occasion</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {collections.map((col) => (
          <Link key={col.title} href={col.href} className="collection-item group block">
            <div className="aspect-square rounded-xl overflow-hidden bg-[#F7F8F1]">
              <img
                src={col.image}
                alt={col.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <p className="mt-2 text-[13px] md:text-[14px] font-medium text-[#1C2120] group-hover:text-[#737530] transition-colors">
              {col.title}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Product Carousel ── */

function ProductCarousel({ products, title, city }: { products: CityProduct[]; title: string; city: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const cards = sectionRef.current.querySelectorAll(".city-product-card");
    gsap.fromTo(
      cards,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 78%" },
      }
    );
    return () => { ScrollTrigger.getAll().forEach((t) => t.kill()); };
  }, []);

  if (!products || products.length === 0) return null;

  return (
    <div ref={sectionRef} className="max-w-[1440px] mx-auto px-4 py-10 md:py-14">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#1C2120]">{title}</h2>
          <p className="text-sm text-[#939393] mt-0.5">Fresh delivery across {city}</p>
        </div>
        <Link
          href="/flowers/"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium border border-[#737530] text-[#737530] rounded-lg px-4 py-2 transition-colors hover:bg-[#737530] hover:text-white shrink-0"
        >
          View All
        </Link>
      </div>

      <div className="flex gap-3 md:gap-4 overflow-x-auto scroll-container pb-2 md:pb-0 md:grid md:grid-cols-4 md:overflow-visible">
        {products.map((product) => {
          const price = product._saleInfo?.effectivePrice ?? product.pricing.currentPrice;
          const originalPrice = product.pricing.regularPrice;
          const hasDiscount = price < originalPrice;
          const image = product.images?.[0]?.url || "/images/products/placeholder.jpg";

          return (
            <div key={product._id} className="city-product-card shrink-0 w-[160px] md:w-auto bg-white rounded-xl overflow-hidden border border-[#F0F0F0] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
              <Link href={`/product/${product.slug}/`} className="block">
                <div className="aspect-[4/5] bg-[#F5F5F5] overflow-hidden relative">
                  <Image
                    src={image}
                    alt={product.images?.[0]?.alt || product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 160px, 25vw"
                    loading="lazy"
                  />
                  {product._saleInfo?.saleLabel && (
                    <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500 text-white">
                      {product._saleInfo.discountPercent}% OFF
                    </span>
                  )}
                  {product.isFeatured && !product._saleInfo?.saleLabel && (
                    <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#737530] text-[#737530] bg-white">
                      Best Seller
                    </span>
                  )}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
                    {product.images.slice(0, 3).map((_, idx) => (
                      <span key={idx} className={`w-1.5 h-1.5 rounded-full bg-[#1C2120] ${idx === 0 ? "opacity-80" : "opacity-30"}`} />
                    ))}
                  </div>
                </div>
              </Link>
              <div className="p-2.5 md:p-3">
                <Link href={`/product/${product.slug}/`}>
                  <h3 className="text-[13px] md:text-sm font-medium text-[#1C2120] truncate">{product.name}</h3>
                </Link>
                <div className="flex items-center gap-1.5 mt-1">
                  {hasDiscount && (
                    <span className="text-[11px] md:text-xs text-[#939393] line-through">&#8377;{originalPrice}</span>
                  )}
                  <span className="text-[13px] md:text-sm font-bold text-[#1C2120]">&#8377;{price}</span>
                </div>
                {product.metrics.averageRating > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[11px] md:text-xs text-[#1C2120]">
                      &#11088; {product.metrics.averageRating.toFixed(1)} | {product.metrics.ratingCount}
                    </span>
                  </div>
                )}
                <p className="text-[10px] md:text-[11px] text-[#939393] mt-1">
                  Earliest Delivery : <span className="text-[#1C2120] font-medium">Tomorrow</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center mt-5 sm:hidden">
        <Link
          href="/flowers/"
          className="inline-flex items-center gap-1 px-6 py-2 text-sm font-medium border border-[#737530] text-[#737530] rounded-lg transition-colors hover:bg-[#737530] hover:text-white"
        >
          View All &gt;
        </Link>
      </div>
    </div>
  );
}

/* ── Section Renderers ── */

function TextSectionRenderer({ section }: { section: TextSection }) {
  return (
    <div className="max-w-[1440px] mx-auto px-4 py-8 md:py-12">
      <div className="max-w-10xl content-section border-l-3 border-[#737530] pl-5 md:pl-6">
        <h2 className="text-xl md:text-2xl font-bold text-[#1C2120] mb-3">{section.title}</h2>
        <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">{section.content}</p>
        {section.subHeading && (
          <p className="text-[14px] md:text-[15px] font-semibold text-[#1C2120] mt-4 mb-2">{section.subHeading}</p>
        )}
        {section.listItems && section.listItems.length > 0 && (
          <ul className="space-y-2 mt-3">
            {section.listItems.map((item) => (
              <li key={item} className="flex items-center gap-3 text-[14px] md:text-[15px] text-[#444]">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#009D43]/10 shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12.5l5 5 9-9" stroke="#009D43" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function OccasionsRenderer({ section }: { section: OccasionsSection }) {
  return (
    <div className="max-w-[1440px] mx-auto px-4 py-8 md:py-12">
      <div className="content-section">
        <h2 className="text-xl md:text-2xl font-bold text-[#1C2120] mb-3">{section.title}</h2>
        <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-5 max-w-3xl">{section.content}</p>
        {section.listLabel && (
          <p className="text-[14px] md:text-[15px] font-semibold text-[#1C2120] mb-4">{section.listLabel}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {section.occasions.map((item) => (
            <div key={item} className="flex items-center gap-3 bg-white border border-[#EEEEEE] rounded-xl px-4 py-3.5 hover:border-[#737530]/30 hover:shadow-sm transition-all">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#009D43]/10 shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12.5l5 5 9-9" stroke="#009D43" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-[14px] md:text-[15px] font-medium text-[#1C2120]">{item}</span>
            </div>
          ))}
        </div>
        {section.closingLine && (
          <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mt-5 max-w-3xl">{section.closingLine}</p>
        )}
      </div>
    </div>
  );
}

function ProductHighlightsRenderer({ section }: { section: ProductHighlightSection }) {
  const icons = [
    <svg key="bouquet" width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="#737530" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M32 38V56" /><path d="M26 56h12" /><path d="M32 38c-8-2-14-10-14-20a14 14 0 0 1 28 0c0 10-6 18-14 20z" fill="#F2F3E8" /><circle cx="32" cy="20" r="4" fill="#F2F3E8" stroke="#737530" /><path d="M24 24c2-3 5-5 8-5s6 2 8 5" /></svg>,
    <svg key="gift" width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="#737530" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="10" y="28" width="44" height="28" rx="3" fill="#F2F3E8" /><rect x="6" y="20" width="52" height="10" rx="3" /><path d="M32 20v36" /><path d="M32 20c-4-8-14-10-14-4s10 4 14 4" /><path d="M32 20c4-8 14-10 14-4s-10 4-14 4" /></svg>,
    <svg key="diamond" width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="#737530" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 24h40l-20 30L12 24z" fill="#F2F3E8" /><path d="M12 24l8-12h24l8 12" /><path d="M32 12v42" /></svg>,
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-8 md:py-12">
      <div className="content-section">
        <h2 className="text-xl md:text-2xl font-bold text-[#1C2120] mb-2 text-center">{section.title}</h2>
        {section.content && (
          <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-8 text-center max-w-2xl mx-auto">{section.content}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {section.highlights.map((item, i) => (
            <div key={item.name} className="group bg-white border border-[#EEEEEE] rounded-2xl p-6 md:p-8 text-center flex flex-col items-center gap-4 hover:shadow-[0_8px_24px_rgba(115,117,48,0.12)] hover:border-[#737530]/20 transition-all">
              <div className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#F7F8F1] group-hover:bg-[#F2F3E8] transition-colors">
                {icons[i] || icons[0]}
              </div>
              <h3 className="text-base md:text-lg font-semibold text-[#1C2120]">{item.name}</h3>
              <p className="text-[13px] md:text-[14px] text-[#555] leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
        {section.closingLine && (
          <p className="text-[14px] md:text-[15px] text-[#737530] font-medium leading-[1.8] mt-6 text-center">{section.closingLine}</p>
        )}
      </div>
    </div>
  );
}

function FeaturesRenderer({ section }: { section: FeaturesSection }) {
  return (
    <div className="bg-[#F7F8F1]">
      <div className="max-w-[1440px] mx-auto px-4 py-10 md:py-14">
        <div className="content-section">
          <h2 className="text-xl md:text-2xl font-bold text-[#1C2120] mb-2 text-center">{section.title}</h2>
          {section.content && (
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-8 text-center max-w-2xl mx-auto">{section.content}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {section.features.map((feat, i) => (
              <div
                key={feat.title}
                className={`bg-white rounded-xl p-5 md:p-6 flex items-start gap-4 hover:shadow-[0_8px_24px_rgba(115,117,48,0.12)] transition-all ${i === section.features.length - 1 && section.features.length % 3 === 1 ? "sm:col-span-2 lg:col-span-1 sm:max-w-none lg:max-w-none" : ""}`}
              >
                <div className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-xl bg-[#737530]/10 shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12.5l5 5 9-9" stroke="#737530" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[15px] md:text-base font-semibold text-[#1C2120] mb-1">{feat.title}</h3>
                  <p className="text-[13px] md:text-[14px] text-[#555] leading-relaxed">{feat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PromiseRenderer({ section }: { section: PromiseSection }) {
  return (
    <div className="max-w-[1440px] mx-auto px-4 py-8 md:py-12">
      <div className="content-section">
        <h2 className="text-xl md:text-2xl font-bold text-[#1C2120] mb-3">{section.title}</h2>
        <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-5 max-w-3xl">{section.content}</p>

        {/* Ensure label */}
        {section.ensureLabel && (
          <p className="text-[14px] md:text-[15px] font-semibold text-[#1C2120] mb-3">{section.ensureLabel}</p>
        )}

        {/* Bullet points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl">
          {section.bullets.map((item) => (
            <div key={item} className="flex items-center gap-3 bg-[#F7F8F1] rounded-xl px-4 py-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#009D43]/10 shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12.5l5 5 9-9" stroke="#009D43" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-[14px] md:text-[15px] font-medium text-[#1C2120]">{item}</span>
            </div>
          ))}
        </div>

        {/* Closing line after bullets */}
        {section.closingLine && (
          <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mt-5 max-w-3xl">{section.closingLine}</p>
        )}

        {/* Optional process steps */}
        {section.steps && section.steps.length > 0 && (
          <>
            {section.stepsIntro && (
              <p className="text-[14px] md:text-[15px] text-[#555] leading-relaxed mt-8 mb-6 max-w-3xl font-medium">{section.stepsIntro}</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mt-6">
              {section.steps.map((step, i) => (
                <div key={step.label} className="relative bg-white border border-[#EEEEEE] rounded-2xl p-5 md:p-6 text-center flex flex-col items-center gap-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#737530] text-white text-base md:text-lg font-bold">
                    {i + 1}
                  </div>
                  <h4 className="text-[13px] md:text-[14px] font-semibold text-[#1C2120] leading-snug">{step.label}</h4>
                  <p className="text-[11px] md:text-[12px] text-[#777] leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
            {section.stepsClosing && (
              <p className="text-[14px] md:text-[15px] text-[#555] leading-relaxed mt-6 max-w-3xl">{section.stepsClosing}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProcessRenderer({ section }: { section: ProcessSection }) {
  return (
    <div className="bg-[#F7F8F1]">
      <div className="max-w-[1440px] mx-auto px-4 py-10 md:py-14">
        <div className="max-w-4xl mx-auto content-section">
          <h2 className="text-xl md:text-2xl font-bold text-[#1C2120] mb-2 text-center">{section.title}</h2>
          {section.content && (
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-6 text-center">{section.content}</p>
          )}

          {/* Quality steps (bullet list before ordering steps) */}
          {section.qualitySteps && (
            <div className="max-w-3xl mx-auto mb-8">
              <p className="text-[14px] md:text-[15px] font-semibold text-[#1C2120] mb-3">{section.qualitySteps.intro}</p>
              <ul className="space-y-2.5">
                {section.qualitySteps.items.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[14px] md:text-[15px] text-[#444]">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#009D43]/10 shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12.5l5 5 9-9" stroke="#009D43" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {section.qualitySteps.closing && (
                <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mt-4">{section.qualitySteps.closing}</p>
              )}
            </div>
          )}

          {/* Ordering intro */}
          {section.orderingIntro && (
            <p className="text-[14px] md:text-[15px] font-semibold text-[#1C2120] mb-6 text-center">{section.orderingIntro}</p>
          )}

          {/* Desktop: horizontal steps */}
          <div className="hidden md:block">
            <div className="grid grid-cols-4 gap-6 relative">
              {/* Connector line */}
              <div className="absolute top-6 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-[2px] bg-[#737530]/20" />

              {section.steps.map((step, i) => (
                <div key={step.label} className="relative flex flex-col items-center text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#737530] text-white text-lg font-bold relative z-10 shadow-[0_2px_8px_rgba(115,117,48,0.25)]">
                    {i + 1}
                  </div>
                  <h4 className="text-[15px] font-semibold text-[#1C2120] mt-4 mb-1">{step.label}</h4>
                  {step.description && <p className="text-[13px] text-[#555] leading-relaxed">{step.description}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: vertical cards */}
          <div className="md:hidden space-y-3">
            {section.steps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-4 bg-white rounded-xl p-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#737530] text-white text-sm font-bold shrink-0 shadow-[0_2px_8px_rgba(115,117,48,0.25)]">
                  {i + 1}
                </div>
                <div>
                  <h4 className="text-[14px] font-semibold text-[#1C2120]">{step.label}</h4>
                  {step.description && <p className="text-[13px] text-[#555] leading-relaxed mt-0.5">{step.description}</p>}
                </div>
              </div>
            ))}
          </div>

          {section.closingLine && (
            <p className="text-[15px] md:text-base text-[#737530] font-semibold leading-relaxed mt-8 text-center">
              {section.closingLine}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FAQRenderer({ section }: { section: FAQSection }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-10 md:py-14">
      <div className="max-w-3xl mx-auto content-section">
        <h2 className="text-xl md:text-2xl font-bold text-[#1C2120] mb-2 text-center">{section.title}</h2>
        <p className="text-sm text-[#939393] text-center mb-8">Quick answers to common questions</p>
        <div className="space-y-3">
          {section.faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`border rounded-xl overflow-hidden transition-colors ${isOpen ? "border-[#737530]/30 bg-[#F7F8F1]" : "border-[#EEEEEE] bg-white"}`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-4 md:p-5 text-left group"
                  aria-expanded={isOpen}
                >
                  <span className="text-[14px] md:text-[15px] font-semibold text-[#1C2120] pr-4">{faq.question}</span>
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 transition-colors ${isOpen ? "bg-[#737530]" : "bg-[#F0F0F0] group-hover:bg-[#E5E5E5]"}`}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    >
                      <path d="M6 9l6 6 6-6" stroke={isOpen ? "#fff" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <p className="px-4 md:px-5 pb-4 md:pb-5 text-[13px] md:text-[14px] text-[#555] leading-[1.8]">{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Section Dispatcher ── */

function ContentSectionRenderer({ section }: { section: ContentSection }) {
  switch (section.type) {
    case "text":
      return <TextSectionRenderer section={section} />;
    case "occasions":
      return <OccasionsRenderer section={section} />;
    case "product-highlight":
      return <ProductHighlightsRenderer section={section} />;
    case "features":
      return <FeaturesRenderer section={section} />;
    case "promise":
      return <PromiseRenderer section={section} />;
    case "process":
      return <ProcessRenderer section={section} />;
    case "faq":
      return <FAQRenderer section={section} />;
    default:
      return null;
  }
}

/* ── Main Component ── */

export default function CityFlowerPage({ data }: { data: CityData }) {
  const heroRef = useRef<HTMLElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const allSections = document.querySelectorAll(".content-section");
    allSections.forEach((section) => {
      gsap.fromTo(
        section,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: { trigger: section, start: "top 85%" },
        }
      );
    });

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
        className="relative w-full h-[260px] sm:h-[320px] md:h-[380px] overflow-hidden"
      >
        <img
          src={data.heroImage}
          alt={data.heroTitle}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(28,33,32,0.85) 0%, rgba(28,33,32,0.5) 50%, rgba(28,33,32,0.2) 100%)" }}
        />
        <div className="relative z-10 h-full max-w-[1440px] mx-auto px-4 sm:px-8 flex flex-col justify-center">
          <h1 className="text-2xl sm:text-3xl md:text-[42px] font-bold text-white leading-tight">
            {data.heroTitle}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-white/70 mt-2 md:mt-3 max-w-lg">
            {data.heroSubtitle}
          </p>
          <div className="flex items-center gap-2 mt-4 md:mt-5 text-xs text-white/50">
            <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80">Send Flowers to {data.city}</span>
          </div>
        </div>
      </section>

      {/* Categories Strip */}
      <div className="border-b border-[#E5E5E5] bg-white sticky top-0 z-20">
        <div className="max-w-[1440px] mx-auto px-4 py-3.5 flex items-center gap-3 md:gap-5 overflow-x-auto scroll-container">
          {data.categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="flex items-center gap-1.5 shrink-0 text-sm text-[#1C2120] hover:text-[#737530] transition-colors font-medium px-3 py-1.5 rounded-full hover:bg-[#F7F8F1]"
            >
              {cat.name}
              <span className="text-[11px] text-[#939393]">({cat.count})</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Intro */}
      <div className="max-w-[1440px] mx-auto px-4 pt-8 md:pt-12 pb-2">
        <div className="max-w-10xl">
          <p className="text-[15px] md:text-base text-[#444] leading-[1.8]">
            {data.intro}
          </p>
        </div>
      </div>

      {/* Dynamic Content Layout */}
      {data.contentLayout.map((slot, i) => {
        switch (slot.slot) {
          case "section": {
            const section = data.sections[slot.index];
            if (!section) return null;
            return <ContentSectionRenderer key={`section-${i}`} section={section} />;
          }
          case "best-sellers":
            return data.bestSellers && data.bestSellers.length > 0 ? (
              <ProductCarousel key={`bs-${i}`} products={data.bestSellers} title={`Best Sellers in ${data.city}`} city={data.city} />
            ) : null;
          case "popular-products":
            return data.popularProducts && data.popularProducts.length > 0 ? (
              <ProductCarousel key={`pp-${i}`} products={data.popularProducts} title={`Popular Flowers in ${data.city}`} city={data.city} />
            ) : null;
          case "collections":
            return <CollectionGrid key={`cg-${i}`} city={data.city} />;
          default:
            return null;
        }
      })}

      {/* Testimonials */}
      <div className="bg-[#F7F8F1]">
        <div className="max-w-[1440px] mx-auto px-4 py-10 md:py-14" ref={testimonialsRef}>
          <h2 className="text-xl md:text-2xl font-bold text-[#1C2120] mb-1 text-center">
            What Our Customers in {data.city} Say
          </h2>
          <p className="text-sm text-[#939393] text-center mb-8">Real reviews from happy customers</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {data.testimonials.map((t, i) => (
              <div
                key={i}
                className="testimonial-card bg-white rounded-xl border border-[#E8E8E8] p-5 md:p-6 hover:shadow-sm transition-shadow"
              >
                <StarRating rating={t.rating} />
                <p className="mt-3 text-[14px] text-[#444] leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#F0F0F0]">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#737530] text-white text-sm font-semibold">
                    {t.name.charAt(0)}
                  </div>
                  <p className="text-[14px] font-semibold text-[#1C2120]">{t.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="max-w-[1440px] mx-auto px-4 py-10 md:py-14">
        <div className="bg-[#1C2120] rounded-2xl px-6 md:px-12 py-8 md:py-12 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-bold text-white">
              Ready to Send Flowers to {data.city}?
            </h3>
            <p className="text-sm md:text-base text-white/60 mt-2">
              Same-day delivery available. Order before 4 PM.
            </p>
          </div>
          <Link
            href="/flowers/"
            className="px-8 py-3.5 text-sm font-semibold text-[#1C2120] bg-white rounded-full hover:bg-gray-100 transition-colors shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
          >
            Shop Flowers Now
          </Link>
        </div>
      </div>
    </>
  );
}
