"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import toast from "react-hot-toast";
import {
  getCart,
  removeFromCart,
  updateCartQuantity,
  getCartTotal,
  type CartItem,
} from "@/lib/cart";

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

  /* Computed totals */
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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
        </div>

        {/* ── Right: Bill Summary ── */}
        <div className="lg:w-[340px] shrink-0">
          <div
            className="bg-white rounded-xl border border-gray-200 p-5 lg:sticky lg:top-[120px]"
            style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
          >
            <h3 className="text-lg font-semibold text-[#1C2120] mb-4">Bill Summary</h3>

            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-[#464646]">Subtotal ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
              <span className="font-semibold text-[#1C2120]">&#8377; {subtotal.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-[#464646]">Delivery</span>
              <span className="text-sm text-[#888]">Calculated at checkout</span>
            </div>

            <div className="border-t border-gray-100 pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-[#1C2120]">Total</span>
                <span className="text-xl font-bold text-[#1C2120]">&#8377; {subtotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => router.push("/checkout/")}
              className="w-full mt-5 py-3.5 bg-[#737530] text-white text-sm font-bold rounded-lg hover:bg-[#4C4D27] transition-colors cursor-pointer tracking-wide"
            >
              PROCEED TO CHECKOUT
            </button>

            <p className="text-xs text-[#888] text-center mt-3">
              Have a Coupon Code? Apply at checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
