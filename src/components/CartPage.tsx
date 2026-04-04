"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";

/* ── Demo cart data ── */
const initialItems = [
  {
    id: 1,
    name: "Decadent Red Velvet Cake",
    price: 685,
    originalPrice: 895,
    discount: 30,
    weight: "0.9 kg",
    qty: 1,
    image: "/images/products/red-velvet.jpg",
    delivery: "Express Delivery",
  },
];

const addons = [
  { id: 101, name: "Silk Dairy Milk Chocolate Set", price: 99, image: "/images/products/chocolate-cake.jpg" },
  { id: 102, name: "Corn Bakes Cake Topper", price: 95, image: "/images/products/cakes-category.jpg" },
  { id: 103, name: "5 Cadbury Milk Chocolates (13gm each)", price: 149, image: "/images/products/chocolate-cake.jpg" },
  { id: 104, name: "3 Roasted Alnut Crayon Candles", price: 345, image: "/images/products/gifts-category.jpg" },
];

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
  const [cartItems, setCartItems] = useState(initialItems);
  const containerRef = useRef<HTMLDivElement>(null);
  const emptyRef = useRef<HTMLDivElement>(null);

  const updateQty = (id: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const orderTotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const totalSaved = cartItems.reduce(
    (sum, item) => sum + (item.originalPrice - item.price) * item.qty,
    0
  );

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" }
      );
    }
  }, []);

  // Empty animation when cart clears
  useEffect(() => {
    if (cartItems.length === 0 && emptyRef.current) {
      gsap.fromTo(
        emptyRef.current.children,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.2)" }
      );
    }
  }, [cartItems.length]);

  /* ── Empty Cart ── */
  if (cartItems.length === 0) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-10">
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
              <rect x="75" y="158" width="50" height="80" rx="10" fill="#0E4D65" />
              <rect x="58" y="165" width="20" height="55" rx="8" fill="#0E4D65" />
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

          <h2 className="text-xl md:text-2xl font-semibold text-[#0E4D65] leading-snug">
            Hey, cart bag seems to be empty,<br />
            Let&apos;s add some items.
          </h2>

          <a
            href="/"
            className="mt-8 px-10 py-3.5 bg-[#0E4D65] text-white text-sm font-semibold rounded-lg hover:bg-[#0a3d52] transition-colors"
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
                  <span className="text-sm font-medium text-[#1C2120] text-center group-hover:text-[#0E4D65] transition-colors">
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
    <div className="max-w-[1320px] mx-auto px-4 py-6 md:py-8" ref={containerRef}>
      {/* Savings banner */}
      {totalSaved > 0 && (
        <div className="bg-[#E8F5E9] border border-[#A5D6A7] rounded-lg px-4 py-2.5 mb-5 text-center">
          <span className="text-sm font-medium text-[#2E7D32]">
            You have saved &#8377; {totalSaved.toLocaleString()} on this order
          </span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left: Cart Items ── */}
        <div className="flex-1">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 mb-4"
              style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
            >
              {/* Express badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-[#0E4D65] text-white text-xs font-semibold rounded-md">
                  {item.delivery}
                </span>
                <span className="text-xs text-[#888]">&#8377; 30-40 km</span>
              </div>

              <div className="flex gap-4">
                {/* Product Image */}
                <div className="relative shrink-0">
                  {item.discount > 0 && (
                    <span className="absolute -top-1 -left-1 z-10 px-1.5 py-0.5 bg-[#FFA500] text-white text-[10px] font-bold rounded">
                      &#8377; {item.originalPrice - item.price} OFF
                    </span>
                  )}
                  <div className="w-[90px] h-[90px] md:w-[100px] md:h-[100px] rounded-lg overflow-hidden bg-[#f8f8f8]">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm md:text-base font-medium text-[#1C2120]">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-base font-bold text-[#1C2120]">&#8377; {item.price}</span>
                        {item.originalPrice > item.price && (
                          <span className="text-xs text-[#999] line-through">&#8377; {item.originalPrice}</span>
                        )}
                      </div>
                      <p className="text-xs text-[#888] mt-0.5">Weight: {item.weight}</p>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="shrink-0 text-[#999] hover:text-[#E74C3C] transition-colors cursor-pointer p-1"
                      title="Remove"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Message + Qty */}
                  <div className="flex items-center justify-between mt-3">
                    <button className="text-xs text-[#0E4D65] flex items-center gap-1 hover:underline cursor-pointer">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Write your message
                    </button>

                    {/* Qty selector */}
                    <div className="flex items-center border border-[#0E4D65] rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center text-[#0E4D65] hover:bg-[#0E4D65]/5 transition-colors cursor-pointer text-lg font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 h-8 flex items-center justify-center text-sm font-semibold text-[#1C2120] border-x border-[#0E4D65]">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#0E4D65] hover:bg-[#0E4D65]/5 transition-colors cursor-pointer text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* ── Last Minute Addons ── */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-[#1C2120] mb-4">
              Your last minute add-ons
            </h3>
            <div className="flex gap-3 overflow-x-auto scroll-container pb-2">
              {addons.map((addon) => (
                <div
                  key={addon.id}
                  className="shrink-0 w-[150px] md:w-[170px] bg-white rounded-xl border border-gray-200 overflow-hidden"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                >
                  <div className="h-[100px] md:h-[110px] bg-[#f8f8f8] overflow-hidden">
                    <img src={addon.image} alt={addon.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs text-[#464646] line-clamp-2 min-h-[32px]">{addon.name}</p>
                    <p className="text-sm font-bold text-[#1C2120] mt-1">&#8377; {addon.price}</p>
                    <button className="w-full mt-2 py-1.5 text-xs font-semibold border-2 border-[#0E4D65] text-[#0E4D65] rounded-lg hover:bg-[#0E4D65] hover:text-white transition-colors cursor-pointer">
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Bill Summary ── */}
        <div className="lg:w-[340px] shrink-0">
          <div
            className="bg-white rounded-xl border border-gray-200 p-5 lg:sticky lg:top-[120px]"
            style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
          >
            <h3 className="text-lg font-semibold text-[#1C2120] mb-4">Bill Summary</h3>

            <div className="flex items-center justify-between text-sm mb-3">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#464646" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <span className="text-[#464646]">Order Total</span>
              </div>
              <span className="text-[#888]">{totalItems} item{totalItems > 1 ? "s" : ""}</span>
              <span className="font-semibold text-[#1C2120]">&#8377; {orderTotal.toLocaleString()}</span>
            </div>

            <div className="border-t border-gray-100 pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-[#1C2120]">Grand Total</span>
                <span className="text-xl font-bold text-[#1C2120]">&#8377; {orderTotal.toLocaleString()}</span>
              </div>
            </div>

            <button className="w-full mt-5 py-3.5 bg-[#0E4D65] text-white text-sm font-bold rounded-lg hover:bg-[#0a3d52] transition-colors cursor-pointer tracking-wide">
              PLACE ORDER
            </button>

            <p className="text-xs text-[#888] text-center mt-3">
              Have a Coupon Code? You can apply the discount coupon at the Checkout Process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
