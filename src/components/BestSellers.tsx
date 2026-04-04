"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

const products = [
  {
    id: 1,
    name: "10 Red Roses Bouquet",
    href: "/product/red-roses-bouquet/",
    price: 695,
    originalPrice: 770,
    discount: 10,
    rating: 4.9,
    reviews: 1645,
    delivery: "Tomorrow",
    image: "/images/products/red-roses.jpg",
  },
  {
    id: 2,
    name: "Profuse Jade Terrarium",
    href: "/product/profuse-jade-terrarium/",
    price: 695,
    originalPrice: 999,
    discount: 31,
    rating: 4.9,
    reviews: 68,
    delivery: "Tomorrow",
    image: "/images/products/jade-plant.jpg",
  },
  {
    id: 3,
    name: "Chocolate Truffle Cake",
    href: "/product/chocolate-truffle-cake/",
    price: 595,
    originalPrice: 745,
    discount: 21,
    rating: 4.9,
    reviews: 829,
    delivery: "Tomorrow",
    image: "/images/products/chocolate-cake.jpg",
  },
  {
    id: 4,
    name: "Bellina Purple Orchid Bouquet",
    href: "/product/purple-orchid-bouquet/",
    price: 795,
    originalPrice: 999,
    discount: 21,
    rating: 4.9,
    reviews: 676,
    delivery: "Tomorrow",
    image: "/images/products/purple-orchid.jpg",
  },
  {
    id: 5,
    name: "Pastel Blooms Of Serenity",
    href: "/product/pastel-blooms/",
    price: 595,
    originalPrice: 795,
    discount: 26,
    rating: 5,
    reviews: 2,
    delivery: "Tomorrow",
    image: "/images/products/pink-bouquet.jpg",
  },
  {
    id: 6,
    name: "Red Roses Wrapped In Heartfelt Devotion",
    href: "/product/red-roses-wrapped/",
    price: 545,
    originalPrice: 795,
    discount: 32,
    rating: 4.8,
    reviews: 4,
    delivery: "Tomorrow",
    image: "/images/products/red-wrapped.jpg",
  },
  {
    id: 7,
    name: "Decadent Red Velvet Cake",
    href: "/product/red-velvet-cake/",
    price: 685,
    originalPrice: 895,
    discount: 24,
    rating: 4.9,
    reviews: 320,
    delivery: "Tomorrow",
    image: "/images/products/red-velvet.jpg",
  },
  {
    id: 8,
    name: "Twin Hearts Floral Balloon",
    href: "/product/twin-hearts-balloon/",
    price: 895,
    originalPrice: 1295,
    discount: 31,
    rating: 4.6,
    reviews: 8,
    delivery: "Tomorrow",
    image: "/images/products/balloon.jpg",
  },
];

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "#B5748A" : "none"} stroke={filled ? "#B5748A" : "#666"} strokeWidth="1.8">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

export default function BestSellers() {
  const [wishlist, setWishlist] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const toggleWishlist = (id: number) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (!sectionRef.current) return;

    // Header with SplitText word reveal
    if (headerRef.current) {
      const heading = headerRef.current.querySelector("h2");
      if (heading) {
        const split = new SplitText(heading, { type: "words" });
        gsap.fromTo(
          split.words,
          { opacity: 0, y: 30, rotateX: -30 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.6,
            stagger: 0.04,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
            },
          }
        );
      }
    }

    // Product cards stagger with clip-path reveal
    const cards = cardsRef.current.filter(Boolean);
    gsap.fromTo(
      cards,
      { opacity: 0, y: 30, clipPath: "inset(8% 8% 8% 8% round 12px)" },
      {
        opacity: 1,
        y: 0,
        clipPath: "inset(0% 0% 0% 0% round 12px)",
        duration: 0.6,
        stagger: 0.06,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 65%",
        },
      }
    );

    // Image zoom on hover
    cards.forEach((card) => {
      if (!card) return;
      const img = card.querySelector(".product-img") as HTMLElement;
      if (!img) return;

      card.addEventListener("mouseenter", () => {
        gsap.to(img, { scale: 1.08, duration: 0.45, ease: "power2.out" });
        gsap.to(card, { y: -4, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", duration: 0.3, ease: "power2.out" });
      });
      card.addEventListener("mouseleave", () => {
        gsap.to(img, { scale: 1, duration: 0.45, ease: "power2.inOut" });
        gsap.to(card, { y: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", duration: 0.3, ease: "power2.inOut" });
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="max-w-[1320px] mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div ref={headerRef} className="flex items-center justify-between mb-1">
        <h2 className="text-xl md:text-2xl font-semibold text-[#1C2120]">
          Best Selling Flowers &amp; Gifts
        </h2>
        <a
          href="/best-seller"
          className="px-5 py-2 text-sm font-medium border-2 border-[#B5748A] text-[#B5748A] rounded-lg transition-colors hover:bg-[#B5748A] hover:text-white hidden sm:block"
        >
          View All
        </a>
      </div>
      <p className="text-sm text-[#888] mb-5">Surprise Your Loved Ones</p>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {products.map((product, i) => (
          <div
            key={product.id}
            ref={(el) => { cardsRef.current[i] = el; }}
            className="relative bg-white rounded-xl border border-[#eee] overflow-hidden"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
          >
            {/* Wishlist */}
            <button
              onClick={() => toggleWishlist(product.id)}
              className="absolute top-2.5 right-2.5 z-10 bg-white rounded-full p-1.5 shadow-sm transition-transform hover:scale-110 cursor-pointer"
            >
              <HeartIcon filled={wishlist.includes(product.id)} />
            </button>

            {/* Product Image */}
            <a href={product.href} className="block">
              <div className="relative w-full aspect-square overflow-hidden bg-[#f8f8f8]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-img w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </a>

            {/* Product Info */}
            <div className="p-3">
              <a href={product.href}>
                <h3 className="text-[13px] md:text-sm font-medium text-[#1C2120] truncate leading-tight">
                  {product.name}
                </h3>
              </a>

              {/* Price */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[15px] font-semibold text-[#1C2120]">
                  &#8377; {product.price}
                </span>
                <span className="text-xs text-[#999] line-through">
                  &#8377; {product.originalPrice}
                </span>
                <span className="text-xs font-medium text-[#FFA500]">
                  {product.discount}% OFF
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold text-white bg-[#4CAF50]">
                  &#9733; {product.rating}
                </span>
                <span className="text-[11px] md:text-xs text-[#B5748A]">
                  ({product.reviews.toLocaleString()} Reviews)
                </span>
              </div>

              {/* Delivery */}
              <p className="text-[11px] md:text-xs text-[#999] mt-2">
                Earliest Delivery : <span className="text-[#1C2120] font-medium">{product.delivery}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile View All */}
      <div className="flex justify-center mt-5 sm:hidden">
        <a
          href="/best-seller"
          className="px-8 py-2.5 text-sm font-medium border-2 border-[#B5748A] text-[#B5748A] rounded-lg transition-colors hover:bg-[#B5748A] hover:text-white"
        >
          View All
        </a>
      </div>
    </section>
  );
}
