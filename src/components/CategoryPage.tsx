"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";

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

const sortOptions = [
  "Popularity",
  "Price: Low to High",
  "Price: High to Low",
  "Newest First",
];

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "#0E4D65" : "none"} stroke={filled ? "#0E4D65" : "#fff"} strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

export default function CategoryPage({
  category,
  products,
  childCategories,
  totalProducts,
}: CategoryPageProps) {
  const [sortBy, setSortBy] = useState("Popularity");
  const [showSort, setShowSort] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const toggleWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -15 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
    }
    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll(".product-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power3.out", delay: 0.2 }
      );
    }
  }, []);

  const discount = (product: CategoryProduct) => {
    if (!product.pricing.salePrice) return 0;
    return Math.round(
      ((product.pricing.regularPrice - product.pricing.salePrice) /
        product.pricing.regularPrice) *
        100
    );
  };

  return (
    <div className="max-w-[1320px] mx-auto px-4">
      {/* Page Header */}
      <div ref={headerRef} className="py-5 md:py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center text-xs md:text-sm text-[#888] mb-3">
          <Link href="/" className="text-[#0E4D65] hover:underline">Home</Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-1.5 opacity-50">
            <path d="M9 18l6-6-6-6" />
          </svg>
          {category.parent && (
            <>
              <Link href={`/${category.parent.slug}/`} className="text-[#0E4D65] hover:underline">
                {category.parent.name}
              </Link>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-1.5 opacity-50">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </>
          )}
          <span className="text-[#1C2120] font-medium">{category.name}</span>
        </nav>

        <h1 className="text-xl md:text-2xl font-semibold text-[#1C2120]">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-sm text-[#464646] mt-2 max-w-2xl">{category.description}</p>
        )}

        <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
          <p className="text-xs md:text-sm text-[#888]">
            {totalProducts} Product{totalProducts !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Child Categories */}
      {childCategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto scroll-container pb-4 border-b border-gray-100">
          {childCategories.map((child) => (
            <Link
              key={child._id}
              href={`/${child.slug}/`}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-medium border bg-white text-[#1C2120] border-gray-200 hover:border-[#0E4D65] hover:text-[#0E4D65] transition-all duration-200"
            >
              {child.name}
              {child.productCount > 0 && (
                <span className="ml-1 text-[#888]">({child.productCount})</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Sort */}
      <div className="flex items-center justify-end gap-4 py-4 border-b border-gray-100">
        <div className="relative shrink-0">
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-[#1C2120] hover:border-gray-300 transition-colors cursor-pointer min-w-[160px]"
          >
            <span className="truncate">{sortBy}</span>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              className={`shrink-0 transition-transform duration-200 ${showSort ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {showSort && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowSort(false)} />
              <div className="absolute right-0 top-full mt-1 z-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1 min-w-[200px]">
                {sortOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => { setSortBy(option); setShowSort(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                      sortBy === option
                        ? "bg-[#0E4D65]/5 text-[#0E4D65] font-medium"
                        : "text-[#464646] hover:bg-gray-50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {products.length > 0 ? (
        <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 py-6">
          {products.map((product) => {
            const disc = discount(product);
            const mainImage = product.images?.[0]?.url || "/images/placeholder.jpg";

            return (
              <div
                key={product._id}
                className="product-card relative bg-white rounded-xl overflow-hidden group"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              >
                {product.isFeatured && (
                  <span className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-[#0E4D65] text-white text-[11px] font-semibold rounded-md shadow-sm">
                    Best Seller
                  </span>
                )}

                <button
                  onClick={() => toggleWishlist(product._id)}
                  className="absolute top-3 right-3 z-10 bg-white/30 backdrop-blur-sm rounded-full p-1.5 transition-all hover:scale-110 hover:bg-white/60 cursor-pointer"
                >
                  <HeartIcon filled={wishlist.includes(product._id)} />
                </button>

                <Link href={`/${product.slug}/`} className="block">
                  <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#f5f5f5]">
                    <Image
                      src={mainImage}
                      alt={product.images?.[0]?.alt || product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      loading="lazy"
                    />
                  </div>
                </Link>

                <div className="p-3 md:p-4">
                  <Link href={`/${product.slug}/`}>
                    <h3 className="text-[13px] md:text-sm font-medium text-[#1C2120] leading-snug line-clamp-2 min-h-[36px]">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-base md:text-lg font-bold text-[#1C2120]">
                      &#8377; {product.pricing.currentPrice.toLocaleString()}
                    </span>
                    {disc > 0 && (
                      <>
                        <span className="text-xs text-[#999] line-through">
                          &#8377; {product.pricing.regularPrice.toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold text-[#FFA500]">
                          {disc}% OFF
                        </span>
                      </>
                    )}
                  </div>

                  {product.metrics.averageRating > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold text-white bg-[#4CAF50]">
                        &#9733; {product.metrics.averageRating}
                      </span>
                      {product.metrics.ratingCount > 0 && (
                        <>
                          <span className="text-[11px] text-[#888]">&bull;</span>
                          <span className="text-[11px] md:text-xs text-[#0E4D65]">
                            ({product.metrics.ratingCount.toLocaleString()} Reviews)
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-lg text-[#888]">No products found in this category.</p>
          <Link href="/" className="inline-block mt-4 text-[#0E4D65] font-medium hover:underline">
            Browse all products
          </Link>
        </div>
      )}
    </div>
  );
}
