"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { addToCart } from "@/lib/cart";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ProductImage {
  url: string;
  alt?: string;
  order: number;
}

interface ProductVariant {
  label: string;
  sku?: string;
  price: number;
  salePrice?: number;
  image?: string;
  stock: number;
}

interface ProductAddon {
  name: string;
  price: number;
  image?: string;
}

interface ProductCategoryParent {
  _id: string;
  name: string;
  slug: string;
}

interface ProductCategory {
  _id: string;
  name: string;
  slug: string;
  parent?: ProductCategoryParent | null;
}

interface ProductData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  type: "simple" | "variable";
  pricing: {
    regularPrice: number;
    salePrice?: number;
    currentPrice: number;
  };
  images: ProductImage[];
  categories: ProductCategory[];
  variants: ProductVariant[];
  addons: ProductAddon[];
  metrics: {
    ratingCount: number;
    averageRating: number;
    totalSales: number;
  };
  deliveryInfo?: string;
}

interface SimilarProduct {
  _id: string;
  name: string;
  slug: string;
  pricing: {
    regularPrice: number;
    salePrice?: number;
    currentPrice: number;
  };
  images: ProductImage[];
  metrics: {
    ratingCount: number;
    averageRating: number;
  };
}

interface SaleInfo {
  effectivePrice: number;
  originalPrice: number;
  saleLabel: string | null;
  hasSale: boolean;
  discountPercent: number;
}

interface ProductDetailProps {
  product: ProductData;
  similarProducts: SimilarProduct[];
  saleInfo?: SaleInfo;
}

const trustBadges = [
  { icon: "smile", label: "20+ Mn Smiles", sub: "Delivered" },
  { icon: "pin", label: "20000+", sub: "Pincodes Covered" },
  { icon: "truck", label: "620+ Cities Enjoying", sub: "same-day delivery" },
];

export default function ProductDetail({ product, similarProducts, saleInfo }: ProductDetailProps) {
  const router = useRouter();
  const [activeImg, setActiveImg] = useState(0);
  const [activeVariant, setActiveVariant] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [showOffers, setShowOffers] = useState(false);

  function handleAddToCart() {
    const variantLabel = product.variants.length > 0 ? product.variants[activeVariant].label : undefined;
    addToCart({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      price: currentPrice,
      originalPrice: product.pricing.regularPrice,
      image: product.images?.[0]?.url || "/images/products/placeholder.jpg",
      variant: variantLabel,
    });
    toast.success("Added to cart!");
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push("/cart/");
  }

  const galleryRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const similarRef = useRef<HTMLDivElement>(null);

  const images = product.images.length > 0
    ? product.images.sort((a, b) => a.order - b.order)
    : [{ url: "/images/placeholder.jpg", alt: product.name, order: 0 }];

  // Use saleInfo for active campaign sales, fallback to product pricing
  const currentPrice =
    product.variants.length > 0
      ? (product.variants[activeVariant].salePrice || product.variants[activeVariant].price)
      : saleInfo?.hasSale
        ? saleInfo.effectivePrice
        : product.pricing.currentPrice;

  const discount = saleInfo?.hasSale
    ? saleInfo.discountPercent
    : product.pricing.salePrice
      ? Math.round(
          ((product.pricing.regularPrice - product.pricing.salePrice) /
            product.pricing.regularPrice) *
            100
        )
      : 0;

  const saleLabel = saleInfo?.saleLabel;

  useEffect(() => {
    if (galleryRef.current) {
      gsap.fromTo(galleryRef.current, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" });
    }
    if (infoRef.current) {
      gsap.fromTo(infoRef.current.children, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power3.out", delay: 0.15 });
    }
    if (similarRef.current) {
      const cards = similarRef.current.querySelectorAll(".sim-card");
      gsap.fromTo(cards, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out",
        scrollTrigger: { trigger: similarRef.current, start: "top 80%" },
      });
    }
    return () => { ScrollTrigger.getAll().forEach((t) => t.kill()); };
  }, []);

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-[#f5f7fa] border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto px-4 py-3">
          <nav className="flex items-center text-xs md:text-sm text-[#888] flex-wrap gap-1">
            <Link href="/" className="text-[#737530] hover:underline">Home</Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40"><path d="M9 18l6-6-6-6" /></svg>
            {product.categories?.[0]?.parent && (
              <>
                <Link href={`/${product.categories[0].parent.slug}/`} className="text-[#737530] hover:underline">
                  {product.categories[0].parent.name}
                </Link>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40"><path d="M9 18l6-6-6-6" /></svg>
              </>
            )}
            {product.categories?.[0] && (
              <>
                <Link
                  href={product.categories[0].parent
                    ? `/${product.categories[0].parent.slug}/${product.categories[0].slug}/`
                    : `/${product.categories[0].slug}/`
                  }
                  className="text-[#737530] hover:underline"
                >
                  {product.categories[0].name}
                </Link>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40"><path d="M9 18l6-6-6-6" /></svg>
              </>
            )}
            <span className="text-[#1C2120] font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="max-w-[1440px] mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">

          {/* LEFT: Image Gallery */}
          <div ref={galleryRef} className="lg:w-[55%] flex flex-col-reverse sm:flex-row gap-3 lg:sticky lg:top-[120px] lg:self-start">
            {/* Thumbnails */}
            <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto scroll-container sm:max-h-[520px] shrink-0">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`shrink-0 w-[60px] h-[72px] md:w-[72px] md:h-[86px] rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                    activeImg === i ? "ring-2 ring-[#737530] opacity-100" : "opacity-50 hover:opacity-80"
                  }`}
                >
                  <Image src={img.url} alt={img.alt || ""} width={72} height={86} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div className="flex-1 relative rounded-xl overflow-hidden bg-[#f8f8f8] aspect-[4/5] sm:aspect-auto sm:h-[520px]">
              <Image
                src={images[activeImg].url}
                alt={images[activeImg].alt || product.name}
                fill
                className="object-cover transition-opacity duration-300"
                key={activeImg}
                sizes="(max-width: 1024px) 100vw, 55vw"
                priority
              />
            </div>
          </div>

          {/* RIGHT: Product Info */}
          <div ref={infoRef} className="lg:w-[45%]">

            {/* Title + Wishlist */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl md:text-2xl font-semibold text-[#1C2120] leading-tight">
                {product.name}
              </h1>
              <button
                onClick={() => setWishlisted(!wishlisted)}
                className="shrink-0 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#737530] transition-colors cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={wishlisted ? "#737530" : "none"} stroke={wishlisted ? "#737530" : "#888"} strokeWidth="1.8">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </button>
            </div>

            {/* Rating */}
            {product.metrics.averageRating > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#4CAF50] text-white text-sm font-bold">
                  &#9733; {product.metrics.averageRating}
                </span>
                <span className="text-sm text-[#888]">&bull;</span>
                <span className="text-sm text-[#737530]">{product.metrics.ratingCount} Reviews</span>
              </div>
            )}

            {/* Sale Badge */}
            {saleLabel && (
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><path d="M21.41 11.58l-9-9A2 2 0 0011 2H4a2 2 0 00-2 2v7c0 .53.21 1.04.59 1.41l9 9a2 2 0 002.82 0l7-7a2 2 0 000-2.83z" /><circle cx="7.5" cy="7.5" r="1.5" fill="#DC2626" /></svg>
                <span className="text-sm font-semibold text-red-600">{saleLabel}</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-2xl md:text-3xl font-bold text-[#1C2120]">&#8377; {currentPrice.toLocaleString()}</span>
              {discount > 0 && (
                <>
                  <span className="text-base text-[#999] line-through">&#8377; {product.pricing.regularPrice.toLocaleString()}</span>
                  <span className="text-base font-semibold text-[#FFA500]">{discount}% OFF</span>
                </>
              )}
            </div>

            {/* Variants */}
            {product.variants.length > 0 && (
              <div className="mt-5">
                <p className="text-sm font-medium text-[#464646] mb-2">Make this gift extra special</p>
                <div className="flex gap-3">
                  {product.variants.map((v, i) => (
                    <button
                      key={v.label}
                      onClick={() => setActiveVariant(i)}
                      className={`flex flex-col rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer w-[110px] ${
                        activeVariant === i ? "border-[#737530] shadow-md" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {v.image && (
                        <div className="h-[80px] bg-[#f8f8f8] overflow-hidden">
                          <Image src={v.image} alt={v.label} width={110} height={80} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-xs font-medium text-[#1C2120]">{v.label}</p>
                        <p className="text-xs font-bold text-[#1C2120]">&#8377; {v.price.toLocaleString()}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Addons */}
            {product.addons.length > 0 && (
              <div className="mt-5">
                <p className="text-sm font-medium text-[#464646] mb-2">Recommended Addon Products</p>
                <div className="flex gap-3 overflow-x-auto scroll-container pb-1">
                  {product.addons.map((addon) => (
                    <div key={addon.name} className="shrink-0 w-[110px] rounded-xl border border-gray-200 overflow-hidden">
                      {addon.image && (
                        <div className="h-[75px] bg-[#f8f8f8] overflow-hidden">
                          <Image src={addon.image} alt={addon.name} width={110} height={75} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-[11px] text-[#464646] truncate">{addon.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-bold text-[#1C2120]">&#8377; {addon.price.toLocaleString()}</span>
                          <button className="text-[10px] font-bold text-[#737530] border border-[#737530] rounded px-2 py-0.5 hover:bg-[#737530] hover:text-white transition-colors cursor-pointer">
                            ADD
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Location */}
            <div className="mt-5 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-[#1C2120]">Select Area / Location</p>
                <button className="text-xs font-medium text-[#737530] flex items-center gap-1 cursor-pointer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>
                  Use My Location
                </button>
              </div>
              <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" className="shrink-0 mr-2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                <input type="text" placeholder="Select Area / Location" className="flex-1 text-sm text-[#464646] outline-none bg-transparent placeholder:text-gray-400" />
              </div>
            </div>

            {/* Offers */}
            <button
              onClick={() => setShowOffers(!showOffers)}
              className="mt-4 w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#737530]/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round"><path d="M21.41 11.58l-9-9A2 2 0 0011 2H4a2 2 0 00-2 2v7c0 .53.21 1.04.59 1.41l9 9a2 2 0 002.82 0l7-7a2 2 0 000-2.83z" /><circle cx="7.5" cy="7.5" r="1.5" fill="#737530" /></svg>
                <span className="text-sm font-semibold text-[#737530]">Offers Available</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" className={`transition-transform duration-200 ${showOffers ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {showOffers && (
              <div className="border border-t-0 border-gray-200 rounded-b-xl p-4 -mt-1 text-sm text-[#464646] space-y-2">
                <p className="flex items-center gap-2"><span className="text-[#4CAF50] font-bold">10%</span> off on orders above &#8377;999 with code <span className="font-semibold text-[#737530]">BLOOM10</span></p>
                <p className="flex items-center gap-2"><span className="text-[#4CAF50] font-bold">Free</span> delivery on your first order</p>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="mt-5 p-4 rounded-xl border border-gray-200">
                <h3 className="text-sm font-semibold text-[#1C2120] mb-2">Description</h3>
                <p className="text-sm text-[#464646] leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Delivery Info */}
            {product.deliveryInfo && (
              <div className="mt-3 p-4 rounded-xl border border-gray-200">
                <h3 className="text-sm font-semibold text-[#1C2120] mb-2">Delivery Information</h3>
                <p className="text-sm text-[#464646] leading-relaxed">{product.deliveryInfo}</p>
              </div>
            )}

            {/* SKU */}
            {product.sku && (
              <div className="mt-3 px-4">
                <p className="text-xs text-[#888]">SKU Number</p>
                <p className="text-xs font-medium text-[#1C2120]">{product.sku}</p>
              </div>
            )}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-8 md:gap-16 py-8 mt-4 border-t border-gray-100">
          {trustBadges.map((badge) => (
            <div key={badge.label} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#f5f7fa] flex items-center justify-center mb-2">
                {badge.icon === "smile" && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><circle cx="9" cy="9" r="0.5" fill="#737530" /><circle cx="15" cy="9" r="0.5" fill="#737530" /></svg>
                )}
                {badge.icon === "pin" && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                )}
                {badge.icon === "truck" && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                )}
              </div>
              <p className="text-sm font-semibold text-[#1C2120]">{badge.label}</p>
              <p className="text-xs text-[#888]">{badge.sub}</p>
            </div>
          ))}
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div ref={similarRef} className="py-8 border-t border-gray-100">
            <h2 className="text-lg md:text-xl font-semibold text-[#1C2120] mb-5">Similar Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              {similarProducts.map((p) => {
                const simDiscount = p.pricing.salePrice
                  ? Math.round(((p.pricing.regularPrice - p.pricing.salePrice) / p.pricing.regularPrice) * 100)
                  : 0;
                const simImage = p.images?.[0]?.url || "/images/placeholder.jpg";

                return (
                  <Link
                    key={p._id}
                    href={`/product/${p.slug}/`}
                    className="sim-card bg-white rounded-xl border border-[#eee] overflow-hidden group transition-all hover:shadow-lg"
                  >
                    <div className="aspect-square overflow-hidden bg-[#f8f8f8] relative">
                      <Image
                        src={simImage}
                        alt={p.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="text-[13px] font-medium text-[#1C2120] truncate">{p.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-sm font-bold text-[#1C2120]">&#8377; {p.pricing.currentPrice.toLocaleString()}</span>
                        {simDiscount > 0 && (
                          <>
                            <span className="text-xs text-[#999] line-through">&#8377; {p.pricing.regularPrice.toLocaleString()}</span>
                            <span className="text-xs font-medium text-[#FFA500]">{simDiscount}% OFF</span>
                          </>
                        )}
                      </div>
                      {p.metrics.averageRating > 0 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-[#4CAF50]">&#9733; {p.metrics.averageRating}</span>
                          {p.metrics.ratingCount > 0 && (
                            <span className="text-[10px] text-[#737530]">({p.metrics.ratingCount.toLocaleString()})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar */}
      <div className="sticky bottom-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-[1440px] mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={handleAddToCart} className="flex-1 py-3 rounded-lg border-2 border-[#737530] text-[#737530] text-sm md:text-base font-semibold transition-colors hover:bg-[#737530]/5 cursor-pointer">
            ADD TO CART
          </button>
          <button onClick={handleBuyNow} className="flex-1 py-3 rounded-lg bg-[#737530] text-white text-sm md:text-base font-semibold transition-colors hover:bg-[#4C4D27] cursor-pointer">
            BUY NOW | &#8377; {currentPrice.toLocaleString()}
          </button>
        </div>
      </div>
    </>
  );
}
