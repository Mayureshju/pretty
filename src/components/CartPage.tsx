"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import toast from "react-hot-toast";
import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  getCartTotal,
  type CartItem,
} from "@/lib/cart";

interface AddonProduct {
  _id: string;
  name: string;
  slug: string;
  pricing: {
    regularPrice: number;
    salePrice?: number;
    currentPrice: number;
  };
  images: { url: string; alt?: string }[];
}

/* ── Browse categories for empty state ── */
const browseCategories = [
  { name: "Flowers", image: "/images/categories/flowers.jpg", href: "/flowers/" },
  { name: "Cakes", image: "/images/categories/cakes.jpg", href: "/cakes" },
  { name: "Gifts", image: "/images/products/gifts-category.jpg", href: "/gifts" },
  { name: "Combos", image: "/images/categories/combos.jpg", href: "/gift-hampers" },
  { name: "Personalized Gifts", image: "/images/products/gifts-category.jpg", href: "/personalised-gifts" },
  { name: "Plants", image: "/images/categories/plants.jpg", href: "/plants" },
];

/* ── Component ── */
export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const emptyRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  /* ── Guest email ── */
  const [guestEmail, setGuestEmail] = useState("");

  /* ── Coupon state ── */
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  /* ── Addons state ── */
  const [addonProducts, setAddonProducts] = useState<AddonProduct[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const addonsScrollRef = useRef<HTMLDivElement>(null);


  /* Load cart on mount and listen for updates */
  useEffect(() => {
    setCartItems(getCart());
    setMounted(true);

    const handleCartUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CartItem[]>;
      setCartItems(customEvent.detail);
    };

    window.addEventListener("cart-updated", handleCartUpdate);
    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, []);

  /* GSAP fade-in on mount */
  useEffect(() => {
    if (mounted && cartItems.length > 0 && containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" }
      );
    }
  }, [mounted, cartItems.length]);

  /* Animate empty state when cart becomes empty */
  useEffect(() => {
    if (mounted && cartItems.length === 0 && emptyRef.current) {
      gsap.fromTo(
        emptyRef.current.children,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.2)" }
      );
    }
  }, [mounted, cartItems.length]);

  /* Fetch add-on products when cart has items */
  useEffect(() => {
    if (!mounted || cartItems.length === 0) return;
    let cancelled = false;
    setAddonsLoading(true);
    fetch("/api/products?isAddon=true&limit=12")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setAddonProducts(data.products || []);
      })
      .catch(() => {
        if (!cancelled) setAddonProducts([]);
      })
      .finally(() => {
        if (!cancelled) setAddonsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mounted, cartItems.length]);

  const handleAddAddon = useCallback((p: AddonProduct) => {
    addToCart({
      productId: p._id,
      name: p.name,
      slug: p.slug,
      price: p.pricing.currentPrice,
      originalPrice: p.pricing.regularPrice,
      image: p.images?.[0]?.url || "/images/products/placeholder.jpg",
    });
    toast.success(`${p.name} added to cart`);
  }, []);

  const scrollAddons = useCallback((dir: 1 | -1) => {
    const el = addonsScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: "smooth" });
  }, []);

  const handleUpdateQty = useCallback(
    (productId: string, currentQty: number, delta: number, variant?: string) => {
      const newQty = currentQty + delta;
      if (newQty <= 0) {
        removeFromCart(productId, variant);
        toast.success("Item removed from cart");
      } else {
        updateCartQuantity(productId, newQty, variant);
      }
    },
    []
  );

  const handleRemove = useCallback(
    (productId: string, name: string, variant?: string) => {
      removeFromCart(productId, variant);
      toast.success(`${name} removed from cart`);
    },
    []
  );

  /* ── Coupon handlers ── */
  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setCouponMessage("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal: cartItems.reduce((s, i) => s + i.price * i.quantity, 0),
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscount(data.discount);
        setCouponApplied(true);
        setCouponMessage(data.message);
        setCouponError("");
        toast.success(data.message);
      } else {
        setDiscount(0);
        setCouponApplied(false);
        setCouponError(data.message);
        setCouponMessage("");
      }
    } catch {
      setCouponError("Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode, cartItems]);

  const handleRemoveCoupon = useCallback(() => {
    setCouponCode("");
    setDiscount(0);
    setCouponApplied(false);
    setCouponMessage("");
    setCouponError("");
  }, []);

  const handleGuestCheckout = useCallback(() => {
    const email = guestEmail.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      router.push(`/checkout/?mode=guest&email=${encodeURIComponent(email)}`);
    } else {
      router.push("/checkout/?mode=guest");
    }
  }, [guestEmail, router]);

  /* Computed totals */
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  /* Filter out addons already in cart */
  const cartProductIds = new Set(cartItems.map((c) => c.productId));
  const availableAddons = addonProducts.filter((p) => !cartProductIds.has(p._id));

  /* Don't render anything until mounted (avoids hydration mismatch with localStorage) */
  if (!mounted) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-10">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-2 border-[#737530] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  /* ── Empty Cart ── */
  if (cartItems.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-10">
        <div ref={emptyRef} className="flex flex-col items-center text-center py-10">
          {/* Illustration */}
          <div className="w-[260px] h-[260px] md:w-[320px] md:h-[320px] mb-6">
            <svg viewBox="0 0 400 400" fill="none" className="w-full h-full">
              {/* Cart */}
              <rect x="140" y="200" width="140" height="110" rx="8" fill="#F5E6D8" stroke="#E8C9A8" strokeWidth="2" />
              <rect x="145" y="195" width="130" height="15" rx="4" fill="#E8C9A8" />
              <circle cx="170" cy="325" r="14" fill="#888" />
              <circle cx="170" cy="325" r="7" fill="#ddd" />
              <circle cx="260" cy="325" r="14" fill="#888" />
              <circle cx="260" cy="325" r="7" fill="#ddd" />
              <path d="M140 240 L120 200 L105 200" stroke="#E8C9A8" strokeWidth="3" strokeLinecap="round" />
              {/* Person */}
              <circle cx="100" cy="130" r="28" fill="#F5D5C8" />
              <rect x="75" y="158" width="50" height="80" rx="10" fill="#737530" />
              <rect x="58" y="165" width="20" height="55" rx="8" fill="#737530" />
              <path d="M125 180 Q145 200 135 235" stroke="#F5D5C8" strokeWidth="8" strokeLinecap="round" />
              <rect x="75" y="238" width="16" height="50" rx="6" fill="#FDCB6E" />
              <rect x="105" y="238" width="16" height="50" rx="6" fill="#FDCB6E" />
              {/* Hair */}
              <path d="M72 130 Q72 90 100 85 Q128 80 128 115" stroke="#C0392B" strokeWidth="10" strokeLinecap="round" fill="none" />
              <circle cx="85" cy="95" r="12" fill="#C0392B" />
              {/* Bag in cart */}
              <rect x="170" y="220" width="50" height="60" rx="5" fill="#E74C3C" opacity="0.7" />
              <rect x="230" y="230" width="35" height="50" rx="5" fill="#FDCB6E" opacity="0.7" />
              <path d="M185 220 Q185 205 195 205 Q205 205 205 220" stroke="#C0392B" strokeWidth="2.5" fill="none" />
            </svg>
          </div>

          <h2 className="text-xl md:text-2xl font-semibold text-[#737530] leading-snug">
            Your bag is empty,<br />
            Let&apos;s add some items.
          </h2>

          <a
            href="/"
            className="mt-8 px-10 py-3.5 bg-[#737530] text-white text-sm font-semibold rounded-lg hover:bg-[#4C4D27] transition-colors"
          >
            CONTINUE SHOPPING
          </a>

          {/* Browse Categories */}
          <div className="w-full mt-14">
            <h3 className="text-xl md:text-2xl font-semibold text-[#1C2120] mb-6">
              Browse Through Our Best Categories
            </h3>
            <div className="flex items-start justify-center gap-4 md:gap-6 flex-wrap">
              {browseCategories.map((cat) => (
                <a
                  key={cat.name}
                  href={cat.href}
                  className="flex flex-col items-center gap-2 group w-[120px] md:w-[140px]"
                >
                  <div className="w-[110px] h-[110px] md:w-[130px] md:h-[130px] rounded-2xl overflow-hidden shadow-md transition-transform duration-300 group-hover:scale-105">
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm font-medium text-[#1C2120] text-center group-hover:text-[#737530] transition-colors">
                    {cat.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Cart with Items ── */
  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 md:py-8" ref={containerRef}>
      {/* Header */}
      <h1 className="text-xl md:text-2xl font-semibold text-[#1C2120] mb-5">
        Your Cart ({totalItems} item{totalItems !== 1 ? "s" : ""})
      </h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left: Cart Items ── */}
        <div className="flex-1">
          {cartItems.map((item) => {
            const lineTotal = item.price * item.quantity;
            const itemKey = item.variant
              ? `${item.productId}-${item.variant}`
              : item.productId;

            return (
              <div
                key={itemKey}
                className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 mb-4"
                style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <a
                    href={`/product/${item.slug}/`}
                    className="relative shrink-0"
                  >
                    <div className="w-[80px] h-[80px] rounded-lg overflow-hidden bg-[#f8f8f8]">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  </a>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <a
                          href={`/product/${item.slug}/`}
                          className="text-sm md:text-base font-medium text-[#1C2120] hover:text-[#737530] transition-colors"
                        >
                          {item.name}
                        </a>
                        {item.variant && (
                          <p className="text-xs text-[#888] mt-0.5">
                            Variant: {item.variant}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-base font-bold text-[#1C2120]">
                            &#8377; {item.price.toLocaleString()}
                          </span>
                          {item.originalPrice > item.price && (
                            <span className="text-xs text-[#999] line-through">
                              &#8377; {item.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemove(item.productId, item.name, item.variant)}
                        className="shrink-0 text-[#999] hover:text-[#E74C3C] transition-colors cursor-pointer p-1"
                        title="Remove"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Qty + Line Total */}
                    <div className="flex items-center justify-between mt-3">
                      {/* Qty selector */}
                      <div className="flex items-center border border-[#737530] rounded-lg overflow-hidden">
                        <button
                          onClick={() =>
                            handleUpdateQty(item.productId, item.quantity, -1, item.variant)
                          }
                          className="w-8 h-8 flex items-center justify-center text-[#737530] hover:bg-[#737530]/5 transition-colors cursor-pointer text-lg font-bold"
                        >
                          -
                        </button>
                        <span className="w-8 h-8 flex items-center justify-center text-sm font-semibold text-[#1C2120] border-x border-[#737530]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateQty(item.productId, item.quantity, 1, item.variant)
                          }
                          className="w-8 h-8 flex items-center justify-center text-[#737530] hover:bg-[#737530]/5 transition-colors cursor-pointer text-lg font-bold"
                        >
                          +
                        </button>
                      </div>

                      {/* Line total */}
                      <span className="text-sm font-semibold text-[#1C2120]">
                        &#8377; {lineTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ── Add-ons Upsell ── */}
          {(addonsLoading || availableAddons.length > 0) && (
            <div
              className="relative rounded-2xl p-5 md:p-6 mb-4 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #FFF9F0 0%, #FEF3E2 50%, #FDEBD0 100%)",
                boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
              }}
            >
              {/* Decorative blobs */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#737530]/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-[#EA1E61]/10 blur-2xl pointer-events-none" />

              <div className="relative flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 12 20 22 4 22 4 12" />
                      <rect x="2" y="7" width="20" height="5" />
                      <line x1="12" y1="22" x2="12" y2="7" />
                      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
                      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-[#1C2120] leading-tight">
                      Make it extra special
                    </h3>
                    <p className="text-xs md:text-[13px] text-[#6b6b6b] mt-0.5">
                      Pair your gift with a sweet little something
                    </p>
                  </div>
                </div>
                {availableAddons.length > 2 && (
                  <div className="hidden md:flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => scrollAddons(-1)}
                      aria-label="Scroll left"
                      className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-[#737530] hover:text-white text-[#737530] transition-colors cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    <button
                      onClick={() => scrollAddons(1)}
                      aria-label="Scroll right"
                      className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-[#737530] hover:text-white text-[#737530] transition-colors cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                  </div>
                )}
              </div>

              {addonsLoading ? (
                <div className="relative flex gap-3 overflow-x-auto pb-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="shrink-0 w-[150px] rounded-xl bg-white/60 p-2 animate-pulse">
                      <div className="aspect-square bg-gray-200 rounded-lg" />
                      <div className="h-3 bg-gray-200 rounded mt-2 w-3/4" />
                      <div className="h-3 bg-gray-200 rounded mt-2 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  ref={addonsScrollRef}
                  className="relative flex gap-3 overflow-x-auto pb-1 scroll-smooth snap-x snap-mandatory"
                  style={{ scrollbarWidth: "none" }}
                >
                  {availableAddons.map((p) => {
                    const img = p.images?.[0]?.url || "/images/products/placeholder.jpg";
                    const hasDiscount = p.pricing.salePrice && p.pricing.salePrice < p.pricing.regularPrice;
                    return (
                      <div
                        key={p._id}
                        className="shrink-0 w-[150px] md:w-[160px] rounded-xl bg-white border border-white/80 overflow-hidden snap-start group hover:shadow-md transition-shadow"
                      >
                        <a href={`/product/${p.slug}/`} className="block relative aspect-square bg-[#f8f8f8] overflow-hidden">
                          <Image
                            src={img}
                            alt={p.name}
                            width={160}
                            height={160}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                          {hasDiscount && (
                            <span className="absolute top-1.5 left-1.5 text-[10px] font-bold bg-[#EA1E61] text-white px-1.5 py-0.5 rounded">
                              SALE
                            </span>
                          )}
                        </a>
                        <div className="p-2.5">
                          <p className="text-[12px] md:text-[13px] font-medium text-[#1C2120] leading-tight line-clamp-2 min-h-[2.3em]">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-sm font-bold text-[#1C2120]">
                              &#8377;{p.pricing.currentPrice.toLocaleString()}
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] text-[#999] line-through">
                                &#8377;{p.pricing.regularPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddAddon(p)}
                            className="mt-2 w-full py-1.5 text-xs font-bold text-[#737530] border border-[#737530] rounded-md hover:bg-[#737530] hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            ADD
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Sidebar ── */}
        <div className="lg:w-[380px] shrink-0 space-y-4">

          {/* Coupon */}
          <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            <div className="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2"><path d="M21.41 11.58l-9-9A2 2 0 0011 2H4a2 2 0 00-2 2v7c0 .53.21 1.04.59 1.41l9 9a2 2 0 002.82 0l7-7a2 2 0 000-2.83z" /><circle cx="7.5" cy="7.5" r="1.5" fill="#737530" /></svg>
              <h3 className="text-sm font-semibold text-[#1C2120]">Apply Coupon</h3>
            </div>
            {couponApplied ? (
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#737530]/5 border border-[#737530]/20">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
                  <span className="text-sm font-medium text-[#737530]">{couponMessage}</span>
                </div>
                <button onClick={handleRemoveCoupon} className="text-xs text-[#888] hover:text-[#E74C3C] cursor-pointer font-medium">Remove</button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    placeholder="Enter coupon code"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#737530] transition-colors uppercase placeholder:normal-case"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2.5 bg-[#737530] text-white text-sm font-medium rounded-lg hover:bg-[#4C4D27] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {couponLoading ? "..." : "Apply"}
                  </button>
                </div>
                {couponError && <p className="text-xs text-[#EA1E61] mt-2">{couponError}</p>}
              </>
            )}
          </div>

          {/* Bill Summary + Checkout */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 lg:sticky lg:top-[120px]" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            <h3 className="text-lg font-semibold text-[#1C2120] mb-4">Bill Summary</h3>

            <div className="flex items-center justify-between text-sm mb-2.5">
              <span className="text-[#464646]">Subtotal ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
              <span className="font-semibold text-[#1C2120]">&#8377; {subtotal.toLocaleString()}</span>
            </div>

            {discount > 0 && (
              <div className="flex items-center justify-between text-sm mb-2.5">
                <span className="text-[#4CAF50]">Coupon Discount</span>
                <span className="font-semibold text-[#4CAF50]">- &#8377; {discount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm mb-2.5">
              <span className="text-[#464646]">Delivery</span>
              <span className="text-sm text-[#888]">Calculated at checkout</span>
            </div>

            <div className="border-t border-gray-100 pt-3 mt-2 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-[#1C2120]">Total</span>
                <span className="text-xl font-bold text-[#1C2120]">&#8377; {(subtotal - discount).toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout Options */}
            <div className="space-y-2.5">
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGuestCheckout()}
                placeholder="Enter your email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#737530] transition-colors"
              />
              <button
                onClick={handleGuestCheckout}
                className="w-full py-3 bg-[#737530] text-white text-sm font-bold rounded-lg hover:bg-[#4C4D27] transition-colors cursor-pointer tracking-wide"
              >
                CONTINUE AS GUEST
              </button>

              <a href="/sign-in?redirect_url=/checkout/"
                className="w-full py-3 flex items-center justify-center gap-2 border-2 border-[#737530] text-[#737530] text-sm font-bold rounded-lg hover:bg-[#737530]/5 transition-colors cursor-pointer tracking-wide">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
                SIGN IN
              </a>

              <a href="/sign-up?redirect_url=/checkout/"
                className="w-full py-3 flex items-center justify-center gap-2 border border-gray-200 text-[#464646] text-sm font-medium rounded-lg hover:border-[#737530] hover:text-[#737530] transition-colors cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6M23 11h-6" /></svg>
                CREATE ACCOUNT
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
