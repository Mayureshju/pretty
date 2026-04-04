"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const filterChips = [
  "Roses",
  "Orchids",
  "Birthday",
  "Anniversary",
  "Flowers in Boxes",
  "Flower Bouquet",
  "Exotic Flowers",
  "Premium",
];

const sortOptions = [
  "Popularity",
  "Price: Low to High",
  "Price: High to Low",
  "Newest First",
  "Rating",
];

const allProducts = [
  {
    id: 1,
    name: "Pastel Blooms Of Serenity",
    price: 595,
    originalPrice: 795,
    discount: 26,
    rating: 5,
    reviews: 2,
    delivery: "In 3 hours",
    image: "/images/products/pink-bouquet.jpg",
    badge: "Best Seller",
  },
  {
    id: 2,
    name: "Bellina Purple Orchid Bouquet",
    price: 795,
    originalPrice: 999,
    discount: 21,
    rating: 4.9,
    reviews: 676,
    delivery: "In 3 hours",
    image: "/images/products/purple-orchid.jpg",
    badge: "Best Seller",
  },
  {
    id: 3,
    name: "10 Red Roses Bouquet",
    price: 695,
    originalPrice: 770,
    discount: 10,
    rating: 4.9,
    reviews: 1645,
    delivery: "In 3 hours",
    image: "/images/products/red-roses.jpg",
    badge: "Best Seller",
  },
  {
    id: 4,
    name: "Mystic Orchids N Cake Combo",
    price: 1545,
    originalPrice: 1945,
    discount: 21,
    rating: 4.6,
    reviews: 9,
    delivery: "In 3 hours",
    image: "/images/products/purple-orchid.jpg",
    badge: "Best Seller",
  },
  {
    id: 5,
    name: "Lily and the Celestial Daisy",
    price: 1995,
    originalPrice: 2245,
    discount: 12,
    rating: 4.9,
    reviews: 32,
    delivery: "In 3 hours",
    image: "/images/products/lily-bouquet.jpg",
    badge: "Best Seller",
  },
  {
    id: 6,
    name: "Red Roses Wrapped In Heartfelt Devotion",
    price: 545,
    originalPrice: 795,
    discount: 32,
    rating: 4.8,
    reviews: 4,
    delivery: "In 3 hours",
    image: "/images/products/red-wrapped.jpg",
    badge: "Best Seller",
  },
  {
    id: 7,
    name: "Whispers Of Affection Pink Rose Bouquet",
    price: 845,
    originalPrice: 890,
    discount: 6,
    rating: 4.9,
    reviews: 145,
    delivery: "In 3 hours",
    image: "/images/products/pink-bouquet.jpg",
    badge: "Best Seller",
  },
  {
    id: 8,
    name: "Chic Rose Birthday Box",
    price: 645,
    originalPrice: 680,
    discount: 6,
    rating: 4.9,
    reviews: 20,
    delivery: "In 3 hours",
    image: "/images/products/red-roses.jpg",
    badge: "Best Seller",
  },
  {
    id: 9,
    name: "Elegant White Lily Arrangement",
    price: 1295,
    originalPrice: 1595,
    discount: 19,
    rating: 4.7,
    reviews: 58,
    delivery: "Tomorrow",
    image: "/images/products/lily-bouquet.jpg",
    badge: null,
  },
  {
    id: 10,
    name: "Royal Purple Orchid Basket",
    price: 1195,
    originalPrice: 1495,
    discount: 20,
    rating: 4.8,
    reviews: 92,
    delivery: "In 3 hours",
    image: "/images/products/purple-orchid.jpg",
    badge: null,
  },
  {
    id: 11,
    name: "Sunshine Blossoms Mixed Bouquet",
    price: 899,
    originalPrice: 1199,
    discount: 25,
    rating: 4.9,
    reviews: 210,
    delivery: "In 3 hours",
    image: "/images/products/flowers-category.jpg",
    badge: "Best Seller",
  },
  {
    id: 12,
    name: "Crimson Love Red Rose Bunch",
    price: 495,
    originalPrice: 650,
    discount: 24,
    rating: 4.8,
    reviews: 445,
    delivery: "In 3 hours",
    image: "/images/products/red-wrapped.jpg",
    badge: null,
  },
];

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "#737530" : "none"} stroke={filled ? "#737530" : "#fff"} strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

export default function FlowerListing() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("Popularity");
  const [showSort, setShowSort] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);

  const toggleWishlist = (id: number) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    // Header entrance
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -15 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
    }

    // Cards stagger entrance
    const cards = cardsRef.current.filter(Boolean);
    gsap.fromTo(
      cards,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        stagger: 0.06,
        ease: "power3.out",
        delay: 0.2,
      }
    );

    // Hover effects
    cards.forEach((card) => {
      if (!card) return;
      const img = card.querySelector(".product-img") as HTMLElement;
      if (!img) return;

      card.addEventListener("mouseenter", () => {
        gsap.to(img, { scale: 1.05, duration: 0.5, ease: "power2.out" });
        gsap.to(card, { y: -5, boxShadow: "0 12px 35px rgba(0,0,0,0.12)", duration: 0.3, ease: "power2.out" });
      });
      card.addEventListener("mouseleave", () => {
        gsap.to(img, { scale: 1, duration: 0.5, ease: "power2.inOut" });
        gsap.to(card, { y: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", duration: 0.3, ease: "power2.inOut" });
      });
    });
  }, []);

  const priceRange = {
    min: Math.min(...allProducts.map((p) => p.price)),
    max: Math.max(...allProducts.map((p) => p.price)),
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4">
      {/* Page Header */}
      <div ref={headerRef} className="py-5 md:py-6">
        <h1 className="text-xl md:text-2xl font-semibold text-[#1C2120]">
          Flower Delivery in India
        </h1>

        {/* Breadcrumb + Count */}
        <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
          <nav className="flex items-center text-xs md:text-sm text-[#888]">
            <a href="/" className="text-[#737530] hover:underline">Home</a>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-1.5 opacity-50">
              <path d="M9 18l6-6-6-6" />
            </svg>
            <span className="text-[#1C2120] font-medium">All Flowers</span>
          </nav>
          <p className="text-xs md:text-sm text-[#888]">
            Item {allProducts.length} of 469 Total | Ranging From &#8377;{priceRange.min} to &#8377;{priceRange.max}
          </p>
        </div>
      </div>

      {/* Filters + Sort */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-100">
        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto scroll-container pb-1 flex-1">
          {filterChips.map((chip) => (
            <button
              key={chip}
              onClick={() => setActiveFilter(activeFilter === chip ? null : chip)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer ${
                activeFilter === chip
                  ? "bg-[#737530] text-white border-[#737530]"
                  : "bg-white text-[#1C2120] border-gray-200 hover:border-[#737530] hover:text-[#737530]"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-[#1C2120] hover:border-gray-300 transition-colors cursor-pointer min-w-[160px]"
          >
            <span className="truncate">{sortBy}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
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
                    onClick={() => {
                      setSortBy(option);
                      setShowSort(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                      sortBy === option
                        ? "bg-[#737530]/5 text-[#737530] font-medium"
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
      <div
        ref={gridRef}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 py-6"
      >
        {allProducts.map((product, i) => (
          <div
            key={product.id}
            ref={(el) => { cardsRef.current[i] = el; }}
            className="relative bg-white rounded-xl overflow-hidden group"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            {/* Badge */}
            {product.badge && (
              <span className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-[#737530] text-white text-[11px] font-semibold rounded-md shadow-sm">
                {product.badge}
              </span>
            )}

            {/* Wishlist */}
            <button
              onClick={() => toggleWishlist(product.id)}
              className="absolute top-3 right-3 z-10 bg-white/30 backdrop-blur-sm rounded-full p-1.5 transition-all hover:scale-110 hover:bg-white/60 cursor-pointer"
            >
              <HeartIcon filled={wishlist.includes(product.id)} />
            </button>

            {/* Product Image */}
            <a href={`/product/${product.id}/`} className="block">
              <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#f5f5f5]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-img w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Image dots indicator */}
                <div className="absolute bottom-2.5 left-3 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#737530]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                </div>
              </div>
            </a>

            {/* Product Info */}
            <div className="p-3 md:p-4">
              <a href={`/product/${product.id}/`}>
                <h3 className="text-[13px] md:text-sm font-medium text-[#1C2120] leading-snug line-clamp-2 min-h-[36px]">
                  {product.name}
                </h3>
              </a>

              {/* Price */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-base md:text-lg font-bold text-[#1C2120]">
                  &#8377; {product.price.toLocaleString()}
                </span>
                <span className="text-xs text-[#999] line-through">
                  &#8377; {product.originalPrice.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-[#FFA500]">
                  {product.discount}% OFF
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold text-white bg-[#4CAF50]">
                  &#9733; {product.rating}
                </span>
                <span className="text-[11px] text-[#888]">
                  &bull;
                </span>
                <span className="text-[11px] md:text-xs text-[#737530]">
                  ({product.reviews.toLocaleString()} Reviews)
                </span>
              </div>

              {/* Delivery */}
              <div className="flex items-center justify-between mt-2.5">
                <p className="text-[11px] md:text-xs text-[#999]">
                  Earliest Delivery : <span className="text-[#737530] font-semibold">{product.delivery}</span>
                </p>
                <button className="text-[#888] hover:text-[#737530] transition-colors cursor-pointer" title="More info">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="flex justify-center py-8">
        <button className="px-10 py-3 text-sm font-semibold border-2 border-[#737530] text-[#737530] rounded-lg transition-all duration-300 hover:bg-[#737530] hover:text-white hover:shadow-lg cursor-pointer">
          Load More Flowers
        </button>
      </div>
    </div>
  );
}
