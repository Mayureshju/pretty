"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getWishlist, toggleWishlist as toggleWishlistLib } from "@/lib/wishlist";
// Sale pricing is computed server-side and passed via activeSales prop

gsap.registerPlugin(ScrollTrigger);

interface CategoryProduct {
  _id: string;
  name: string;
  slug: string;
  pricing: {
    regularPrice: number;
    salePrice?: number;
    currentPrice: number;
  };
  images: { url: string; alt?: string; order: number }[];
  metrics: {
    ratingCount: number;
    averageRating: number;
    totalSales: number;
  };
  isFeatured: boolean;
  categories?: string[];
  _saleInfo?: { effectivePrice: number; discountPercent: number; saleLabel: string | null } | null;
}

interface ChildCategory {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  productCount: number;
}

interface ParentCategory {
  _id: string;
  name: string;
  slug: string;
}

interface CategoryPageProps {
  category: {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    parent?: ParentCategory | null;
  };
  products: CategoryProduct[];
  childCategories: ChildCategory[];
  totalProducts: number;
}

const priceFilters = [
  { label: "All Prices", value: "all" },
  { label: "Under ₹500", value: "0-500" },
  { label: "₹500 - ₹1000", value: "500-1000" },
  { label: "₹1000 - ₹2000", value: "1000-2000" },
  { label: "Above ₹2000", value: "2000+" },
];

const ratingFilters = [
  { label: "All", value: 0 },
  { label: "4★ & above", value: 4 },
  { label: "3★ & above", value: 3 },
];

const sortOptions = [
  { label: "Popularity", value: "popularity" },
  { label: "Price: Low to High", value: "price-low" },
  { label: "Price: High to Low", value: "price-high" },
  { label: "Newest First", value: "newest" },
  { label: "Rating", value: "rating" },
];

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "var(--accent-rose)" : "none"} stroke={filled ? "var(--accent-rose)" : "currentColor"} strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} width="12" height="12" viewBox="0 0 24 24"
            fill={i < fullStars ? "var(--accent-gold)" : i === fullStars && hasHalf ? "url(#half)" : "#e0e0e0"}
            stroke="none">
            <defs><linearGradient id="half"><stop offset="50%" stopColor="var(--accent-gold)" /><stop offset="50%" stopColor="#e0e0e0" /></linearGradient></defs>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      {count > 0 && (
        <span className="text-[11px] text-[var(--text-gray)]">({count.toLocaleString()})</span>
      )}
    </div>
  );
}

export default function CategoryPage({
  category,
  products: initialProducts,
  childCategories,
  totalProducts,
}: CategoryPageProps) {
  const [allProducts, setAllProducts] = useState<CategoryProduct[]>(initialProducts);
  const [sortBy, setSortBy] = useState("popularity");
  const [showSort, setShowSort] = useState(false);
  const [priceRange, setPriceRange] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [wishlist, setWishlist] = useState<string[]>(() => getWishlist());
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length < totalProducts);
  const gridRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const toggleWishlist = (id: string) => {
    const result = toggleWishlistLib(id);
    setWishlist(result.list);
  };

  // Scroll animation
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current, { opacity: 0, y: -15 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
    }
  }, []);

  useEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll(".product-card:not(.animated)");
    if (cards.length === 0) return;

    gsap.fromTo(cards,
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out",
        scrollTrigger: { trigger: gridRef.current, start: "top 90%" },
        onComplete: () => { cards.forEach(c => c.classList.add("animated")); }
      }
    );

    return () => { ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, [allProducts]);

  // Filter + Sort
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Price filter
    if (priceRange !== "all") {
      if (priceRange === "2000+") {
        result = result.filter(p => p.pricing.currentPrice >= 2000);
      } else {
        const [min, max] = priceRange.split("-").map(Number);
        result = result.filter(p => p.pricing.currentPrice >= min && p.pricing.currentPrice < max);
      }
    }

    // Rating filter
    if (minRating > 0) {
      result = result.filter(p => p.metrics.averageRating >= minRating);
    }

    // Sort
    if (sortBy === "price-low") result.sort((a, b) => a.pricing.currentPrice - b.pricing.currentPrice);
    else if (sortBy === "price-high") result.sort((a, b) => b.pricing.currentPrice - a.pricing.currentPrice);
    else if (sortBy === "rating") result.sort((a, b) => b.metrics.averageRating - a.metrics.averageRating);
    // popularity and newest use server order

    return result;
  }, [allProducts, priceRange, minRating, sortBy]);

  // Load More
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams({
        category: category._id,
        page: nextPage.toString(),
        limit: "24",
        sort: sortBy,
      });
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const newProducts = data.products as CategoryProduct[];
      setAllProducts(prev => [...prev, ...newProducts]);
      setPage(nextPage);
      setHasMore(nextPage < data.pages);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, category._id, sortBy]);

  const discount = (product: CategoryProduct) => {
    if (!product.pricing.salePrice) return 0;
    return Math.round(((product.pricing.regularPrice - product.pricing.salePrice) / product.pricing.regularPrice) * 100);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4">
      {/* Header */}
      <div ref={headerRef} className="py-5 md:py-6">
        <nav className="flex items-center text-xs md:text-sm text-[#888] mb-3">
          <Link href="/" className="text-[#737530] hover:underline">Home</Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-1.5 opacity-50"><path d="M9 18l6-6-6-6" /></svg>
          {category.parent && (
            <>
              <Link href={`/${category.parent.slug}/`} className="text-[#737530] hover:underline">{category.parent.name}</Link>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-1.5 opacity-50"><path d="M9 18l6-6-6-6" /></svg>
            </>
          )}
          <span className="text-[#1C2120] font-medium">{category.name}</span>
        </nav>

        <h1 className="text-xl md:text-2xl font-semibold text-[#1C2120]">{category.name}</h1>
        {category.description && (
          <p className="text-sm text-[#464646] mt-2 max-w-2xl">{category.description}</p>
        )}
        <p className="text-xs md:text-sm text-[#888] mt-2">{totalProducts} Product{totalProducts !== 1 ? "s" : ""}</p>
      </div>

      {/* Child Categories */}
      {childCategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto scroll-container pb-4 border-b border-gray-100">
          {childCategories.map((child) => (
            <Link key={child._id} href={`/${category.slug}/${child.slug}/`}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-medium border bg-white text-[#1C2120] border-gray-200 hover:border-[#737530] hover:text-[#737530] transition-all duration-200">
              {child.name}
              {child.productCount > 0 && <span className="ml-1 text-[#888]">({child.productCount})</span>}
            </Link>
          ))}
        </div>
      )}

      {/* Filters + Sort Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 overflow-x-auto scroll-container pb-1 md:pb-0">
          {/* Price filter */}
          {priceFilters.map((f) => (
            <button key={f.value} onClick={() => setPriceRange(f.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                priceRange === f.value
                  ? "bg-[#737530] text-white border-[#737530]"
                  : "bg-white text-[#464646] border-gray-200 hover:border-[#737530]"
              }`}>
              {f.label}
            </button>
          ))}

          <div className="w-px h-5 bg-gray-200 shrink-0 mx-1" />

          {/* Rating filter */}
          {ratingFilters.map((f) => (
            <button key={f.value} onClick={() => setMinRating(f.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                minRating === f.value
                  ? "bg-[#737530] text-white border-[#737530]"
                  : "bg-white text-[#464646] border-gray-200 hover:border-[#737530]"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort + Count */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#888] whitespace-nowrap">
            {filteredProducts.length} of {totalProducts}
          </span>
          <div className="relative shrink-0">
            <button onClick={() => setShowSort(!showSort)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-[#1C2120] hover:border-gray-300 transition-colors cursor-pointer min-w-[140px]">
              <span className="truncate">{sortOptions.find(s => s.value === sortBy)?.label}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`shrink-0 transition-transform duration-200 ${showSort ? "rotate-180" : ""}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {showSort && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowSort(false)} />
                <div className="absolute right-0 top-full mt-1 z-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1 min-w-[180px]">
                  {sortOptions.map((option) => (
                    <button key={option.value}
                      onClick={() => { setSortBy(option.value); setShowSort(false); }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer ${
                        sortBy === option.value ? "bg-[#737530]/5 text-[#737530] font-medium" : "text-[#464646] hover:bg-gray-50"
                      }`}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <>
          <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 lg:gap-6 py-8">
            {filteredProducts.map((product) => {
              const si = product._saleInfo;
              const effectivePrice = si ? si.effectivePrice : product.pricing.currentPrice;
              const effectiveDiscount = si ? si.discountPercent : discount(product);
              const saleLabel = si?.saleLabel;
              const mainImage = product.images?.[0]?.url || "/images/products/placeholder.jpg";
              const hoverImage = product.images?.[1]?.url;

              return (
                <Link key={product._id} href={`/product/${product.slug}/`}
                  className="product-card relative bg-white rounded-xl overflow-hidden group cursor-pointer
                    border border-[var(--border-card)] hover:border-[var(--accent-sage)]
                    transition-all duration-500 ease-out hover:-translate-y-1.5"
                  style={{ boxShadow: "var(--shadow-card)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-card)"; }}>

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
                    {product.isFeatured && (
                      <span className="inline-flex items-center gap-1 px-2 py-[3px] text-[9px] font-bold tracking-wider uppercase
                        bg-[var(--primary)] text-white rounded-[4px] shadow-sm">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                        Bestseller
                      </span>
                    )}
                    {saleLabel && !product.isFeatured && (
                      <span className="px-2 py-[3px] text-[9px] font-bold tracking-wider uppercase
                        bg-[var(--accent-rose)] text-white rounded-[4px] shadow-sm">
                        {saleLabel}
                      </span>
                    )}
                  </div>

                  {/* Discount tag */}
                  {effectiveDiscount > 0 && (
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className="block px-1.5 py-[3px] text-[10px] font-bold
                        bg-[var(--accent-rose)] text-white rounded-[4px] leading-none shadow-sm">
                        -{effectiveDiscount}%
                      </span>
                    </div>
                  )}

                  {/* Image container */}
                  <div className="relative w-full aspect-[4/5] overflow-hidden bg-[var(--bg-lighter)]">
                    <Image src={mainImage} alt={product.images?.[0]?.alt || product.name} fill unoptimized
                      className={`object-cover transition-all duration-700 ease-out ${hoverImage ? "group-hover:opacity-0" : "group-hover:scale-[1.06]"}`}
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw" loading="lazy" />
                    {hoverImage && (
                      <Image src={hoverImage} alt={product.name} fill unoptimized
                        className="object-cover opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out scale-[1.04] group-hover:scale-100"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw" loading="lazy" />
                    )}

                    {/* Hover overlay actions */}
                    <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2
                      translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out pb-3 pt-10
                      bg-gradient-to-t from-black/30 to-transparent">
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product._id); }}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm
                          text-[var(--text-dark)] hover:bg-white hover:scale-110 transition-all duration-200
                          shadow-[0_2px_8px_rgba(0,0,0,0.15)] cursor-pointer">
                        <HeartIcon filled={wishlist.includes(product._id)} />
                      </button>
                    </div>
                  </div>

                  {/* Product info */}
                  <div className="px-3 pt-3 pb-3.5 md:px-3.5 md:pt-3.5 md:pb-4 flex flex-col gap-1.5">
                    <h3 className="text-[12.5px] md:text-[13px] font-medium text-[var(--text-dark)] leading-[1.4] line-clamp-2 min-h-[36px]
                      group-hover:text-[var(--primary)] transition-colors duration-300">
                      {product.name}
                    </h3>

                    {/* Price row */}
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-[15px] md:text-base font-bold text-[var(--text-dark)] tracking-tight">
                        &#8377;{effectivePrice.toLocaleString()}
                      </span>
                      {effectiveDiscount > 0 && (
                        <span className="text-[11px] text-[var(--text-light)] line-through decoration-[var(--text-light)]">
                          &#8377;{product.pricing.regularPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Rating */}
                    {product.metrics.averageRating > 0 && (
                      <StarRating rating={product.metrics.averageRating} count={product.metrics.ratingCount} />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pb-8">
              <button onClick={loadMore} disabled={loading}
                className="px-8 py-3 text-sm font-medium border-2 border-[#737530] text-[#737530] rounded-lg hover:bg-[#737530] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                {loading ? "Loading..." : "Load More Products"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-16 text-center">
          <p className="text-lg text-[#888]">No products match your filters.</p>
          <button onClick={() => { setPriceRange("all"); setMinRating(0); }}
            className="mt-4 text-[#737530] font-medium hover:underline cursor-pointer">
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
