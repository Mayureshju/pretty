"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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

interface CityData {
  city: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  intro: string;
  sections: { title: string; content: string }[];
  testimonials: { name: string; text: string; rating: number }[];
  categories: { name: string; count: number; href: string }[];
  bestSellers?: CityProduct[];
  popularProducts?: CityProduct[];
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
    <div ref={sectionRef} className="max-w-[1440px] mx-auto px-4 py-8 md:py-12">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-[#1C2120]">{title}</h2>
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
            <div key={product._id} className="city-product-card shrink-0 w-[160px] md:w-auto bg-white rounded-lg overflow-hidden">
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
    <div ref={gridRef} className="max-w-[1440px] mx-auto px-4 py-8 md:py-12">
      <h2 className="text-lg md:text-xl font-semibold text-[#1C2120] mb-4 md:mb-5">
        Explore Collections in {city}
      </h2>
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

export default function CityFlowerPage({ data }: { data: CityData }) {
  const heroRef = useRef<HTMLElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate all .content-section elements on the page
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

      {/* Intro */}
      <div className="max-w-[1440px] mx-auto px-4 pt-8 md:pt-12">
        <div className="max-w-3xl">
          <p className="text-[15px] md:text-base text-[#444] leading-relaxed">
            {data.intro}
          </p>
        </div>
      </div>

      {/* Best Sellers Carousel */}
      {data.bestSellers && data.bestSellers.length > 0 && (
        <ProductCarousel products={data.bestSellers} title={`Best Sellers in ${data.city}`} city={data.city} />
      )}

      {/* SEO Section 1 */}
      {data.sections[0] && (
        <div className="max-w-[1440px] mx-auto px-4 py-6 md:py-8">
          <div className="max-w-3xl content-section">
            <h2 className="text-lg md:text-xl font-semibold text-[#1C2120] mb-3">{data.sections[0].title}</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-relaxed">{data.sections[0].content}</p>
          </div>
        </div>
      )}

      {/* Collections Grid */}
      <CollectionGrid city={data.city} />

      {/* SEO Section 2 */}
      {data.sections[1] && (
        <div className="max-w-[1440px] mx-auto px-4 py-6 md:py-8">
          <div className="max-w-3xl content-section">
            <h2 className="text-lg md:text-xl font-semibold text-[#1C2120] mb-3">{data.sections[1].title}</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-relaxed">{data.sections[1].content}</p>
          </div>
        </div>
      )}

      {/* Popular Products Carousel */}
      {data.popularProducts && data.popularProducts.length > 0 && (
        <ProductCarousel products={data.popularProducts} title={`Popular Flowers in ${data.city}`} city={data.city} />
      )}

      {/* Remaining SEO Sections */}
      {data.sections.length > 2 && (
        <div className="max-w-[1440px] mx-auto px-4 py-6 md:py-8">
          <div className="max-w-3xl space-y-8">
            {data.sections.slice(2).map((section, i) => (
              <div key={i} className="content-section">
                <h2 className="text-lg md:text-xl font-semibold text-[#1C2120] mb-3">{section.title}</h2>
                <p className="text-[14px] md:text-[15px] text-[#555] leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
