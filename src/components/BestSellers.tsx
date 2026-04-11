"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface BestSellerProduct {
  _id: string;
  name: string;
  slug: string;
  pricing: { regularPrice: number; salePrice?: number | null; currentPrice: number };
  images: { url: string; alt?: string; order: number }[];
  metrics: { ratingCount: number; averageRating: number; totalSales: number };
  isFeatured: boolean;
  _saleInfo?: { effectivePrice: number; discountPercent: number; saleLabel: string | null } | null;
}

export default function BestSellers({ products }: { products?: BestSellerProduct[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
        }
      );
    }

    const cards = cardsRef.current.filter(Boolean);
    gsap.fromTo(
      cards,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.06,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
      }
    );

    return () => { ScrollTrigger.getAll().forEach((t) => t.kill()); };
  }, []);

  if (!products || products.length === 0) return null;

  return (
    <section ref={sectionRef} className="max-w-[1440px] mx-auto px-4 py-10 md:py-16">
      {/* Header */}
      <div ref={headerRef} className="flex items-start justify-between mb-6 md:mb-8">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-[#1C2120]">
            Best Selling Flowers &amp; Gifts
          </h2>
          <p className="text-sm text-[#939393] mt-1">Surprise Your Loved Ones</p>
        </div>
        <Link
          href="/flowers/"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium border border-[#737530] text-[#737530] rounded-lg px-4 py-2 transition-colors hover:bg-[#737530] hover:text-white shrink-0"
        >
          View All
        </Link>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {products.map((product, i) => {
          const price = product._saleInfo?.effectivePrice ?? product.pricing.currentPrice;
          const originalPrice = product.pricing.regularPrice;
          const hasDiscount = price < originalPrice;
          const image = product.images?.[0]?.url || "/images/products/placeholder.jpg";

          return (
            <div
              key={product._id}
              ref={(el) => { cardsRef.current[i] = el; }}
              className="bg-white rounded-xl overflow-hidden border border-[#F0F0F0] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow"
            >
              <Link href={`/product/${product.slug}/`} className="block">
                <div className="aspect-square bg-[#F5F5F5] overflow-hidden relative">
                  <Image
                    src={image}
                    alt={product.images?.[0]?.alt || product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
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

              <div className="p-3">
                <Link href={`/product/${product.slug}/`}>
                  <h3 className="text-sm font-medium text-[#1C2120] truncate">{product.name}</h3>
                </Link>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {hasDiscount && (
                    <span className="text-xs text-[#939393] line-through">&#8377;{originalPrice}</span>
                  )}
                  <span className="text-sm font-bold text-[#1C2120]">&#8377;{price}</span>
                </div>
                {product.metrics.averageRating > 0 && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-xs text-[#1C2120]">
                      &#11088; {product.metrics.averageRating.toFixed(1)} | {product.metrics.ratingCount}
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-[#939393] mt-1.5">
                  Earliest Delivery : <span className="text-[#1C2120] font-medium">Tomorrow</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center mt-6 sm:hidden">
        <Link
          href="/flowers/"
          className="inline-flex items-center gap-1 px-8 py-2.5 text-sm font-medium border border-[#737530] text-[#737530] rounded-lg transition-colors hover:bg-[#737530] hover:text-white"
        >
          View All Best Sellers &gt;
        </Link>
      </div>
    </section>
  );
}
