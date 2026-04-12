"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { addToCart } from "@/lib/cart";
import { saveDeliveryInfo, updateSelectedDate } from "@/lib/delivery-store";
import { isInWishlist, toggleWishlist as toggleWishlistLib } from "@/lib/wishlist";
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
  const [wishlisted, setWishlisted] = useState(() => isInWishlist(product._id));
  const [showOffers, setShowOffers] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgContainerRef = useRef<HTMLDivElement>(null);

  // Pincode & Delivery
  const [pincode, setPincode] = useState("");
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [pincodeResult, setPincodeResult] = useState<{
    city: string;
    state?: string;
    sameDayAvailable: boolean;
    blockedDates: string[];
    deliveryCharge: number;
    freeDeliveryAbove: number | null;
    estimatedTime: string | null;
    deliveryDays: number;
  } | null>(null);
  const [pincodeError, setPincodeError] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }

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

  async function checkPincode() {
    const code = pincode.trim();
    if (!/^\d{6}$/.test(code)) {
      setPincodeError("Enter a valid 6-digit pincode");
      setPincodeResult(null);
      setSelectedDate(null);
      return;
    }
    setPincodeChecking(true);
    setPincodeError("");
    setPincodeResult(null);
    setSelectedDate(null);
    try {
      const res = await fetch(`/api/delivery-availability?pincode=${code}`);
      if (!res.ok) {
        setPincodeError("Sorry, delivery is not available at this pincode");
        return;
      }
      const data = await res.json();
      setPincodeResult(data);
      saveDeliveryInfo({
        pincode: code,
        city: data.city,
        state: data.state,
        sameDayAvailable: data.sameDayAvailable,
        blockedDates: data.blockedDates,
        deliveryCharge: data.deliveryCharge,
        freeDeliveryAbove: data.freeDeliveryAbove,
        estimatedTime: data.estimatedTime,
        deliveryDays: data.deliveryDays,
        selectedDate: null,
      });
    } catch {
      setPincodeError("Something went wrong. Please try again.");
    } finally {
      setPincodeChecking(false);
    }
  }

  // Compute min date and blocked dates for the date picker
  const minDeliveryDate = useMemo(() => {
    const now = new Date();
    const istOffset = 5.5 * 60;
    const istTime = new Date(now.getTime() + istOffset * 60 * 1000);
    if (pincodeResult && !pincodeResult.sameDayAvailable) {
      istTime.setDate(istTime.getDate() + 1);
    }
    return new Date(istTime.getUTCFullYear(), istTime.getUTCMonth(), istTime.getUTCDate());
  }, [pincodeResult]);

  const blockedSet = useMemo(() => {
    if (!pincodeResult) return new Set<string>();
    return new Set(pincodeResult.blockedDates);
  }, [pincodeResult]);

  // Auto-select default date on mount and when pincode result arrives
  useEffect(() => {
    const d = new Date(minDeliveryDate);
    for (let i = 0; i < 30; i++) {
      const iso = d.toISOString().split("T")[0];
      if (!blockedSet.has(iso)) {
        setSelectedDate(new Date(d));
        setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
        break;
      }
      d.setDate(d.getDate() + 1);
    }
  }, [pincodeResult, minDeliveryDate, blockedSet]);

  function formatDisplayDate(date: Date) {
    return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  }

  function toISO(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function isDayAvailable(day: number) {
    const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    if (date < minDeliveryDate) return false;
    return !blockedSet.has(toISO(date));
  }

  function isDaySelected(day: number) {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === calendarMonth.getMonth() &&
      selectedDate.getFullYear() === calendarMonth.getFullYear()
    );
  }

  function isToday(day: number) {
    const now = new Date();
    return (
      now.getDate() === day &&
      now.getMonth() === calendarMonth.getMonth() &&
      now.getFullYear() === calendarMonth.getFullYear()
    );
  }

  function getCalendarDays(): (number | null)[] {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }

  function selectDay(day: number) {
    const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    setSelectedDate(date);
    setShowCalendar(false);
    updateSelectedDate(toISO(date));
  }

  function prevMonth() {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
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
      gsap.fromTo(galleryRef.current, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out", clearProps: "transform" });
    }
    if (infoRef.current) {
      gsap.fromTo(infoRef.current.children, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power3.out", delay: 0.15, clearProps: "transform" });
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
            <div
              ref={imgContainerRef}
              className="flex-1 relative rounded-xl overflow-hidden bg-[#f8f8f8] aspect-square sm:aspect-auto sm:h-[520px] cursor-crosshair"
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              onMouseMove={handleMouseMove}
            >
              <Image
                src={images[activeImg].url}
                alt={images[activeImg].alt || product.name}
                fill
                className="object-contain transition-opacity duration-300"
                key={activeImg}
                sizes="(max-width: 1024px) 100vw, 55vw"
                priority
              />
              {isZooming && (
                <div
                  className="absolute inset-0 z-10 hidden md:block"
                  style={{
                    backgroundImage: `url(${images[activeImg].url})`,
                    backgroundSize: "250%",
                    backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                    backgroundRepeat: "no-repeat",
                  }}
                />
              )}
              {isZooming && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-1.5
                  bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-3 py-1.5 rounded-full pointer-events-none">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /><path d="M11 8v6M8 11h6" /></svg>
                  Move to zoom
                </div>
              )}
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
                onClick={() => { const result = toggleWishlistLib(product._id); setWishlisted(result.wishlisted); }}
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

            {/* Pincode Checker */}
            <div className="mt-5 p-4 rounded-xl border border-gray-200">
              <p className="text-sm font-medium text-[#1C2120] mb-2">Check Delivery Availability</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center flex-1 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-[#737530] transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" className="shrink-0 mr-2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setPincode(val);
                      if (pincodeError) setPincodeError("");
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") checkPincode(); }}
                    placeholder="Enter 6-digit pincode"
                    className="flex-1 text-sm text-[#464646] outline-none bg-transparent placeholder:text-gray-400"
                  />
                </div>
                <button
                  onClick={checkPincode}
                  disabled={pincodeChecking}
                  className="px-4 py-2.5 rounded-lg bg-[#737530] text-white text-sm font-medium hover:bg-[#4C4D27] transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {pincodeChecking ? "Checking..." : "Check"}
                </button>
              </div>

              {pincodeError && (
                <p className="text-xs text-[#EA1E61] mt-2 flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
                  {pincodeError}
                </p>
              )}

              {pincodeResult && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-[#4CAF50]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
                    <span className="font-medium">
                      Delivery available to {pincodeResult.city}{pincodeResult.state ? `, ${pincodeResult.state}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#464646]">
                    {pincodeResult.estimatedTime && (
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                        {pincodeResult.estimatedTime}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                      {pincodeResult.deliveryCharge === 0
                        ? "Free Delivery"
                        : `Delivery: ₹${pincodeResult.deliveryCharge}`}
                    </span>
                    {pincodeResult.sameDayAvailable && (
                      <span className="text-[#4CAF50] font-medium">Same-day available</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Date */}
            <div className="mt-3 p-4 rounded-xl border border-gray-200">
              <p className="text-sm font-medium text-[#1C2120] mb-2">Select Delivery Date</p>
              <button
                onClick={() => setShowCalendar(true)}
                className="w-full flex items-center border border-gray-200 rounded-lg px-3 py-2.5 hover:border-[#737530] transition-colors cursor-pointer bg-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" className="shrink-0 mr-2">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                <span className={`flex-1 text-left text-sm ${selectedDate ? "text-[#464646]" : "text-gray-400"}`}>
                  {selectedDate ? formatDisplayDate(selectedDate) : "Select delivery date"}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" className="shrink-0"><path d="M6 9l6 6 6-6" /></svg>
              </button>

              {selectedDate && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#737530]/5 border border-[#737530]/20">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
                  </svg>
                  <span className="text-sm font-medium text-[#737530]">
                    Delivery on {formatDisplayDate(selectedDate)}
                  </span>
                </div>
              )}
            </div>

            {/* Calendar Modal */}
            {showCalendar && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
                onClick={() => setShowCalendar(false)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[380px] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h3 className="text-xs font-bold tracking-widest text-[#464646] uppercase">Select Delivery Date</h3>
                    <button onClick={() => setShowCalendar(false)}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>

                  {/* Month Navigation */}
                  <div className="flex items-center justify-between px-5 pb-4">
                    <button onClick={prevMonth}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#464646" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <span className="text-sm font-semibold text-[#1C2120]">
                      {calendarMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                    </span>
                    <button onClick={nextMonth}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#464646" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                  </div>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 px-4">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={i} className="text-center text-[11px] font-semibold text-[#999] py-2">{d}</div>
                    ))}
                  </div>

                  {/* Day Grid */}
                  <div className="grid grid-cols-7 px-4 pb-5">
                    {getCalendarDays().map((day, idx) => {
                      if (day === null) return <div key={`e-${idx}`} />;
                      const available = isDayAvailable(day);
                      const selected = isDaySelected(day);
                      const today = isToday(day);

                      return (
                        <div key={`d-${day}`} className="flex items-center justify-center py-[5px]">
                          <button
                            disabled={!available}
                            onClick={() => selectDay(day)}
                            className={`w-9 h-9 rounded-full text-[13px] font-medium transition-all cursor-pointer flex items-center justify-center
                              ${selected
                                ? "bg-[#737530] text-white font-bold shadow-md"
                                : today && available
                                  ? "bg-[#737530]/10 text-[#737530] font-bold ring-1 ring-[#737530]/30"
                                  : available
                                    ? "text-[#1C2120] hover:bg-[#737530]/8"
                                    : "text-[#d1d5db] cursor-not-allowed"
                              }`}
                          >
                            {day}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

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
