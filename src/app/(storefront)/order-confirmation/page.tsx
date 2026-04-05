"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { clearCart } from "@/lib/cart";

interface OrderData {
  orderNumber: string;
  customer: { name: string; email: string; phone?: string };
  items: {
    productName?: string;
    variant?: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  shipping: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  deliverySlot?: string;
  pricing: {
    subtotal: number;
    discount: number;
    couponCode?: string;
    shipping: number;
    total: number;
  };
  payment: { status: string; transactionId?: string };
  status: string;
  invoice: { number?: string; date?: string };
  createdAt: string;
}

/* ── Inner component (uses useSearchParams) ── */
function OrderConfirmationInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id") || "";
  const containerRef = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  /* ── Clear cart on mount ── */
  useEffect(() => {
    clearCart();
  }, []);

  /* ── Fetch order details ── */
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    fetch(`/api/orders/${orderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setOrder(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  /* ── GSAP fade-in ── */
  useEffect(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.12,
          ease: "back.out(1.2)",
        }
      );
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-20">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-2 border-[#737530] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 md:py-20">
      <div ref={containerRef} className="flex flex-col items-center">
        {/* Green checkmark */}
        <div className="w-24 h-24 mb-6">
          <svg viewBox="0 0 96 96" fill="none" className="w-full h-full">
            <circle cx="48" cy="48" r="46" stroke="#009D43" strokeWidth="4" fill="#E8F5E9" />
            <path
              d="M28 50L42 64L68 34"
              stroke="#009D43"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-2xl md:text-3xl font-bold text-[#1C2120] mb-2 text-center">
          Order Placed Successfully!
        </h1>
        <p className="text-base text-[#464646] mb-6 text-center">
          Your order has been confirmed and is being processed.
        </p>

        {/* Order info card */}
        {order ? (
          <div className="w-full space-y-5">
            {/* Order number + invoice */}
            <div className="bg-white rounded-xl border border-gray-100 p-5" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-[#888]">Order Number</p>
                  <p className="text-lg font-bold text-[#1C2120] font-mono">{order.orderNumber}</p>
                </div>
                {order.invoice?.number && (
                  <div className="text-right">
                    <p className="text-sm text-[#888]">Invoice</p>
                    <p className="text-sm font-semibold text-[#1C2120] font-mono">{order.invoice.number}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[#464646] mt-3 pt-3 border-t border-gray-100">
                <span>Payment: <strong className="text-[#009D43]">{order.payment.status === "paid" ? "Paid" : order.payment.status}</strong></span>
                {order.deliverySlot && (
                  <span>Delivery: <strong>{new Date(order.deliverySlot).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</strong></span>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-xl border border-gray-100 p-5" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
              <h2 className="text-base font-semibold text-[#1C2120] mb-3">Items Ordered</h2>
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1C2120] truncate">
                        {item.productName || "Product"}
                        {item.variant ? <span className="text-[#888] font-normal"> ({item.variant})</span> : null}
                      </p>
                      <p className="text-xs text-[#888]">Qty: {item.quantity} &times; &#8377;{item.price.toLocaleString("en-IN")}</p>
                    </div>
                    <span className="font-semibold text-[#1C2120] ml-4">
                      &#8377; {item.total.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pricing breakdown */}
              <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#464646]">Subtotal</span>
                  <span>&#8377; {order.pricing.subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#464646]">Delivery</span>
                  <span>{order.pricing.shipping === 0 ? <span className="text-[#2E7D32]">FREE</span> : `₹ ${order.pricing.shipping.toLocaleString("en-IN")}`}</span>
                </div>
                {order.pricing.discount > 0 && (
                  <div className="flex justify-between text-[#2E7D32]">
                    <span>Discount{order.pricing.couponCode ? ` (${order.pricing.couponCode})` : ""}</span>
                    <span>- &#8377; {order.pricing.discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-100 pt-3 mt-1 font-bold text-base">
                  <span>Total</span>
                  <span>&#8377; {order.pricing.total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Delivery address */}
            {order.shipping?.address && (
              <div className="bg-white rounded-xl border border-gray-100 p-5" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                <h2 className="text-base font-semibold text-[#1C2120] mb-2">Delivery Address</h2>
                <p className="text-sm text-[#464646] leading-relaxed">
                  {order.customer.name}<br />
                  {order.shipping.address}<br />
                  {order.shipping.city}{order.shipping.state ? `, ${order.shipping.state}` : ""} {order.shipping.pincode}<br />
                  {order.customer.phone && <>Phone: {order.customer.phone}</>}
                </p>
              </div>
            )}

            {/* Thank you */}
            <div className="bg-[#F2F3E8] rounded-xl px-6 py-4">
              <p className="text-sm text-[#464646] flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
                A confirmation email has been sent to {order.customer.email}
              </p>
            </div>
          </div>
        ) : (
          /* Fallback if order can't be loaded */
          orderId && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 w-full mb-6" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
              <p className="text-sm text-[#888] mb-1">Order ID</p>
              <p className="text-lg font-bold text-[#1C2120] font-mono tracking-wide break-all">
                {orderId}
              </p>
            </div>
          )
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
          <Link
            href="/"
            className="flex-1 py-3.5 bg-[#737530] text-white text-sm font-bold rounded-lg hover:bg-[#4C4D27] transition-colors text-center tracking-wide"
          >
            CONTINUE SHOPPING
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Page wrapper with Suspense boundary for useSearchParams ── */
export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-12 md:py-20">
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 border-2 border-[#737530] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      }
    >
      <OrderConfirmationInner />
    </Suspense>
  );
}
