"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const products = [
  {
    id: 1,
    name: "10 Red Roses Bouquet",
    href: "/product/red-roses-bouquet/",
    price: 695,
    originalPrice: 770,
    rating: 4.9,
    reviews: 1645,
    delivery: "Tomorrow",
    image: "/images/products/red-roses.jpg",
    badge: "Best Seller",
  },
  {
    id: 2,
    name: "Profuse Jade Terrarium",
    href: "/product/profuse-jade-terrarium/",
    price: 695,
    originalPrice: 999,
    rating: 4.9,
    reviews: 68,
    delivery: "Tomorrow",
    image: "/images/products/jade-plant.jpg",
    badge: "PRICE DROP",
  },
  {
    id: 3,
    name: "Chocolate Truffle Cake",
    href: "/product/chocolate-truffle-cake/",
    price: 595,
    originalPrice: 745,
    rating: 4.9,
    reviews: 829,
    delivery: "Tomorrow",
    image: "/images/products/chocolate-cake.jpg",
    badge: "Best Seller",
  },
  {
    id: 4,
    name: "Bellina Purple Orchid Bouquet",
    href: "/product/purple-orchid-bouquet/",
    price: 795,
    originalPrice: 999,
    rating: 4.9,
    reviews: 676,
    delivery: "Tomorrow",
    image: "/images/products/purple-orchid.jpg",
    badge: null,
  },
  {
    id: 5,
    name: "Pastel Blooms Of Serenity",
    href: "/product/pastel-blooms/",
    price: 595,
    originalPrice: 795,
    rating: 5,
    reviews: 2,
    delivery: "Tomorrow",
    image: "/images/products/pink-bouquet.jpg",
    badge: "PRICE DROP",
  },
  {
    id: 6,
    name: "Red Roses Wrapped In Heartfelt Devotion",
    href: "/product/red-roses-wrapped/",
    price: 545,
    originalPrice: 795,
    rating: 4.8,
    reviews: 4,
    delivery: "Tomorrow",
    image: "/images/products/red-wrapped.jpg",
    badge: "PRICE DROP",
  },
  {
    id: 7,
    name: "Decadent Red Velvet Cake",
    href: "/product/red-velvet-cake/",
    price: 685,
    originalPrice: 895,
    rating: 4.9,
    reviews: 320,
    delivery: "Tomorrow",
    image: "/images/products/red-velvet.jpg",
    badge: "Best Seller",
  },
  {
    id: 8,
    name: "Twin Hearts Floral Balloon",
    href: "/product/twin-hearts-balloon/",
    price: 895,
    originalPrice: 1295,
    rating: 4.6,
    reviews: 8,
    delivery: "Tomorrow",
    image: "/images/products/balloon.jpg",
    badge: null,
  },
];

export default function BestSellers() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    // Header fade-in
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          },
        }
      );
    }

    // Product cards stagger fade-in
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
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 65%",
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="max-w-[1320px] mx-auto px-4 py-10 md:py-16">
      {/* Header */}
      <div ref={headerRef} className="flex items-start justify-between mb-6 md:mb-8">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-[#1C2120]">
            Best Selling Flowers &amp; Gifts
          </h2>
          <p className="text-sm text-[#939393] mt-1">Surprise Your Loved Ones</p>
        </div>
        <a
          href="/best-seller"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium border border-[#737530] text-[#737530] rounded-lg px-4 py-2 transition-colors hover:bg-[#737530] hover:text-white shrink-0"
        >
          View All
        </a>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {products.map((product, i) => (
          <div
            key={product.id}
            ref={(el) => {
              cardsRef.current[i] = el;
            }}
            className="bg-white rounded-lg overflow-hidden"
          >
            {/* Product Image */}
            <a href={product.href} className="block">
              <div className="aspect-square bg-[#F5F5F5] overflow-hidden relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {product.badge && (
                  <span
                    className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      product.badge === "PRICE DROP"
                        ? "bg-red-500 text-white"
                        : "border border-[#737530] text-[#737530] bg-white"
                    }`}
                  >
                    {product.badge}
                  </span>
                )}
                {/* Carousel dots indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1C2120] opacity-80" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1C2120] opacity-30" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1C2120] opacity-30" />
                </div>
              </div>
            </a>

            {/* Product Info */}
            <div className="p-3">
              <a href={product.href}>
                <h3 className="text-sm font-medium text-[#1C2120] truncate">
                  {product.name}
                </h3>
              </a>

              {/* Price */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs text-[#939393] line-through">
                  &#8377;{product.originalPrice}
                </span>
                <span className="text-sm font-bold text-[#1C2120]">
                  &#8377;{product.price}
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-xs text-[#1C2120]">
                  &#11088; {product.rating} | {product.reviews}
                </span>
              </div>

              {/* Delivery */}
              <p className="text-[11px] text-[#939393] mt-1.5">
                Earliest Delivery :{" "}
                <span className="text-[#1C2120] font-medium">
                  {product.delivery}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button - full width, centered */}
      <div className="flex justify-center mt-6">
        <a
          href="/best-seller"
          className="inline-flex items-center gap-1 px-8 py-2.5 text-sm font-medium border border-[#737530] text-[#737530] rounded-lg transition-colors hover:bg-[#737530] hover:text-white"
        >
          View All Best Sellers &gt;
        </a>
      </div>
    </section>
  );
}
