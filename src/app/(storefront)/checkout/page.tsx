"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import toast, { Toaster } from "react-hot-toast";
import gsap from "gsap";
import { getCart, CartItem } from "@/lib/cart";
import { getSavedDelivery } from "@/lib/delivery-store";

/* ── Delivery API response shape ── */
interface DeliveryInfo {
  city: string;
  state: string;
  cutoffTime: string | null;
  blockedDates: string[];
  sameDayAvailable: boolean;
  deliveryCharge: number;
  freeDeliveryAbove: number | null;
  estimatedTime: string | null;
}

/* ── Checkout form inner component (uses useSearchParams) ── */
function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, user, isLoaded } = useUser();

  /* ── Checkout gate ── */
  const [checkoutMode, setCheckoutMode] = useState<"gate" | "form">("gate");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestEmailError, setGuestEmailError] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);

  /* ── Cart state ─�� */
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Customer form ── */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  /* ── Address form ── */
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  /* ── Delivery ── */
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  /* ── Gifting ── */
  const [floristInstruction, setFloristInstruction] = useState("");
  const [messageOnCard, setMessageOnCard] = useState("");

  /* ── Coupon ── */
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  /* ── Coupon handlers ── */
  const handleApplyCoupon = async () => {
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
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setDiscount(0);
    setCouponApplied(false);
    setCouponMessage("");
    setCouponError("");
  };

  /* ── Form state ── */
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  /* ── Init: load cart, restore saved delivery ── */
  useEffect(() => {
    const items = getCart();
    if (items.length === 0) {
      router.replace("/cart/");
      return;
    }
    setCartItems(items);
    setMounted(true);

    // Restore saved delivery info from product page
    const saved = getSavedDelivery();
    if (saved) {
      setPincode(saved.pincode);
      if (saved.selectedDate) {
        setDeliveryDate(saved.selectedDate);
        const d = new Date(saved.selectedDate + "T00:00:00");
        setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    }
  }, [router]);

  /* ── Auto-skip gate for signed-in users or guest mode from cart ── */
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && user) {
      setName(user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim());
      setEmail(user.primaryEmailAddress?.emailAddress || "");
      setPhone(user.phoneNumbers?.[0]?.phoneNumber?.replace(/^\+91/, "") || "");
      setCheckoutMode("form");
    } else if (searchParams.get("mode") === "guest") {
      const guestEmailParam = searchParams.get("email");
      if (guestEmailParam) setEmail(decodeURIComponent(guestEmailParam));
      setCheckoutMode("form");
    }
  }, [isLoaded, isSignedIn, user, searchParams]);

  /* ── Check for payment_failed in URL ── */
  useEffect(() => {
    if (searchParams.get("error") === "payment_failed") {
      toast.error("Payment failed. Please try again.");
    }
  }, [searchParams]);

  /* ── GSAP entrance animation ── */
  useEffect(() => {
    if (mounted && containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power3.out" }
      );
    }
  }, [mounted]);

  /* ── Fetch delivery info when pincode changes (6 digits) ── */
  useEffect(() => {
    if (pincode.length !== 6) {
      setDeliveryInfo(null);
      setCity("");
      setState("");
      setDeliveryError("");
      setDeliveryDate("");
      return;
    }

    const controller = new AbortController();
    setDeliveryLoading(true);
    setDeliveryError("");

    fetch(`/api/delivery-availability?pincode=${pincode}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("not_available");
        return res.json();
      })
      .then((data: DeliveryInfo) => {
        setDeliveryInfo(data);
        setCity(data.city);
        setState(data.state);
        setDeliveryLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setDeliveryInfo(null);
        setCity("");
        setState("");
        setDeliveryError("Delivery not available for this pincode");
        setDeliveryLoading(false);
      });

    return () => controller.abort();
  }, [pincode]);

  /* ── Calendar helpers ── */
  const minDeliveryDate = useMemo(() => {
    const now = new Date();
    const istOffset = 5.5 * 60;
    const istTime = new Date(now.getTime() + istOffset * 60 * 1000);
    if (deliveryInfo && !deliveryInfo.sameDayAvailable) {
      istTime.setDate(istTime.getDate() + 1);
    }
    return new Date(istTime.getUTCFullYear(), istTime.getUTCMonth(), istTime.getUTCDate());
  }, [deliveryInfo]);

  const blockedSet = useMemo(() => {
    if (!deliveryInfo) return new Set<string>();
    return new Set(deliveryInfo.blockedDates);
  }, [deliveryInfo]);

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
    if (!deliveryDate) return false;
    const sel = new Date(deliveryDate + "T00:00:00");
    return (
      sel.getDate() === day &&
      sel.getMonth() === calendarMonth.getMonth() &&
      sel.getFullYear() === calendarMonth.getFullYear()
    );
  }

  function isTodayDay(day: number) {
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

  function selectCalendarDay(day: number) {
    const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    setDeliveryDate(toISO(date));
    setShowCalendar(false);
  }

  /* ── Totals ── */
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryCharge = deliveryInfo
    ? deliveryInfo.freeDeliveryAbove && subtotal >= deliveryInfo.freeDeliveryAbove
      ? 0
      : deliveryInfo.deliveryCharge
    : 0;
  const total = subtotal + deliveryCharge - discount;

  /* ── Validate ── */
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) errs.name = "Full name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Enter a valid email";
    if (!phone.trim()) errs.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(phone)) errs.phone = "Enter a valid 10-digit phone number";
    if (!address.trim()) errs.address = "Address is required";
    if (!pincode.trim()) errs.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(pincode)) errs.pincode = "Enter a valid 6-digit pincode";
    if (!deliveryInfo) errs.pincode = "Delivery not available for this pincode";
    if (!deliveryDate) errs.deliveryDate = "Please select a delivery date";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── Handle Pay Now ── */
  const handlePayNow = async () => {
    if (!validate()) {
      toast.error("Please fill all required fields correctly.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: name.trim(), email: email.trim(), phone: phone.trim() },
          items: cartItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            slug: item.slug,
            variant: item.variant || "",
            quantity: item.quantity,
            price: item.price,
            image: item.image,
          })),
          shipping: {
            address: address.trim(),
            pincode: pincode.trim(),
            city,
            state,
          },
          deliveryCharge,
          deliverySlot: deliveryDate,
          floristInstruction: floristInstruction.trim() || undefined,
          messageOnCard: messageOnCard.trim() || undefined,
          couponCode: couponCode.trim() || undefined,
          discount,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create order");
      }

      const { payuData } = await res.json();

      // Create hidden form and auto-submit to PayU
      const form = document.createElement("form");
      form.method = "POST";
      form.action = payuData.action;
      Object.entries(payuData).forEach(([key, value]) => {
        if (key === "action") return;
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  /* ── Format date for display ── */
  const formatDate = (iso: string): string => {
    const d = new Date(iso + "T00:00:00");
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const isToday = iso === today.toISOString().split("T")[0];
    const isTomorrow = iso === tomorrow.toISOString().split("T")[0];

    const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
    const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

    if (isToday) return `Today, ${dateStr}`;
    if (isTomorrow) return `Tomorrow, ${dateStr}`;
    return `${dayName}, ${dateStr}`;
  };

  /* ── Handle guest continue ── */
  const handleGuestContinue = async () => {
    if (!guestEmail.trim()) {
      setGuestEmailError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      setGuestEmailError("Enter a valid email");
      return;
    }
    setGuestEmailError("");
    setGuestLoading(true);
    try {
      await fetch("/api/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: guestEmail.trim().toLowerCase() }),
      });
    } catch {
      // Non-critical — continue even if capture fails
    }
    setEmail(guestEmail.trim().toLowerCase());
    setCheckoutMode("form");
    setGuestLoading(false);
  };

  if (!mounted) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-[#737530] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="max-w-[1440px] mx-auto px-4 py-6 md:py-8" ref={containerRef}>
        {/* Page title */}
        <h1 className="text-2xl md:text-3xl font-bold text-[#1C2120] mb-6">Checkout</h1>

        {/* ── Checkout Gate (for unauthenticated users) ── */}
        {checkoutMode === "gate" && isLoaded && !isSignedIn && (
          <div className="max-w-xl mx-auto mb-8">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-[#1C2120] mb-1 text-center">How would you like to checkout?</h2>
              <p className="text-sm text-[#888] mb-6 text-center">Sign in for a faster experience or continue as a guest</p>

              <div className="space-y-3">
                {/* Sign In */}
                <a
                  href={`/sign-in?redirect_url=/checkout`}
                  className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-[#737530] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#F2F3E8] flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round">
                      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1C2120] group-hover:text-[#737530] transition-colors">Sign In</p>
                    <p className="text-xs text-[#888]">Already have an account? Sign in to prefill your details</p>
                  </div>
                </a>

                {/* Create Account */}
                <a
                  href={`/sign-up?redirect_url=/checkout`}
                  className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-[#737530] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#F2F3E8] flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round">
                      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1C2120] group-hover:text-[#737530] transition-colors">Create Account</p>
                    <p className="text-xs text-[#888]">Save your details for faster checkout next time</p>
                  </div>
                </a>

                {/* Continue as Guest */}
                <div className="rounded-lg border border-gray-200 hover:border-[#737530] transition-colors">
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-full bg-[#F2F3E8] flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#1C2120]">Continue as Guest</p>
                      <p className="text-xs text-[#888]">Just enter your email to proceed</p>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleGuestContinue()}
                        placeholder="your@email.com"
                        className={`flex-1 border ${guestEmailError ? "border-[#EA1E61]" : "border-gray-200"} rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#737530] transition-colors`}
                      />
                      <button
                        type="button"
                        onClick={handleGuestContinue}
                        disabled={guestLoading}
                        className="px-5 py-2.5 text-sm font-semibold bg-[#737530] text-white rounded-lg hover:bg-[#4C4D27] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {guestLoading ? "..." : "Continue"}
                      </button>
                    </div>
                    {guestEmailError && <p className="text-xs text-[#EA1E61] mt-1">{guestEmailError}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Checkout Form (shown after gate is passed) ── */}
        {checkoutMode === "form" && <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left Column: Form ── */}
          <div className="flex-1 lg:w-[60%]">
            {/* Customer Info */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
              <h2 className="text-lg font-semibold text-[#1C2120] mb-4 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Customer Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#464646] mb-1.5">
                    Full Name <span className="text-[#EA1E61]">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full border ${errors.name ? "border-[#EA1E61]" : "border-gray-200"} rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#737530] transition-colors`}
                  />
                  {errors.name && <p className="text-xs text-[#EA1E61] mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#464646] mb-1.5">
                    Email <span className="text-[#EA1E61]">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={`w-full border ${errors.email ? "border-[#EA1E61]" : "border-gray-200"} rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#737530] transition-colors`}
                  />
                  {errors.email && <p className="text-xs text-[#EA1E61] mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#464646] mb-1.5">
                    Phone <span className="text-[#EA1E61]">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPhone(val);
                    }}
                    placeholder="10-digit mobile number"
                    className={`w-full border ${errors.phone ? "border-[#EA1E61]" : "border-gray-200"} rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#737530] transition-colors`}
                  />
                  {errors.phone && <p className="text-xs text-[#EA1E61] mt-1">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
              <h2 className="text-lg font-semibold text-[#1C2120] mb-4 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Delivery Address
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#464646] mb-1.5">
                    Address <span className="text-[#EA1E61]">*</span>
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter complete delivery address"
                    rows={3}
                    className={`w-full border ${errors.address ? "border-[#EA1E61]" : "border-gray-200"} rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#737530] transition-colors resize-none`}
                  />
                  {errors.address && <p className="text-xs text-[#EA1E61] mt-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#464646] mb-1.5">
                      Pincode <span className="text-[#EA1E61]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setPincode(val);
                        }}
                        placeholder="6-digit pincode"
                        className={`w-full border ${errors.pincode ? "border-[#EA1E61]" : "border-gray-200"} rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#737530] transition-colors`}
                      />
                      {deliveryLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-[#737530] border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    {errors.pincode && <p className="text-xs text-[#EA1E61] mt-1">{errors.pincode}</p>}
                    {deliveryError && <p className="text-xs text-[#EA1E61] mt-1">{deliveryError}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#464646] mb-1.5">City</label>
                    <input
                      type="text"
                      value={city}
                      readOnly
                      placeholder="Auto-filled"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-[#888] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#464646] mb-1.5">State</label>
                    <input
                      type="text"
                      value={state}
                      readOnly
                      placeholder="Auto-filled"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-[#888] outline-none"
                    />
                  </div>
                </div>

                {/* Delivery info banner */}
                {deliveryInfo && (
                  <div className="bg-[#E8F5E9] border border-[#A5D6A7] rounded-lg px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                      <span className="text-[#2E7D32] font-medium flex items-center gap-1.5">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round">
                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                          <path d="M22 4L12 14.01l-3-3" />
                        </svg>
                        Delivery available
                      </span>
                      {deliveryInfo.estimatedTime && (
                        <span className="text-[#464646]">Est. {deliveryInfo.estimatedTime}</span>
                      )}
                      <span className="text-[#464646]">
                        Charge: {deliveryCharge === 0 ? (
                          <span className="text-[#2E7D32] font-semibold">FREE</span>
                        ) : (
                          <>&#8377; {deliveryCharge}</>
                        )}
                      </span>
                      {deliveryInfo.sameDayAvailable && (
                        <span className="px-2 py-0.5 bg-[#009D43] text-white text-xs font-semibold rounded">
                          Same Day
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivery date selector */}
                {deliveryInfo && (
                  <div>
                    <label className="block text-sm font-medium text-[#464646] mb-1.5">
                      Delivery Date <span className="text-[#EA1E61]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCalendar(true)}
                      className={`w-full flex items-center border rounded-lg px-3 py-2.5 hover:border-[#737530] transition-colors cursor-pointer bg-white ${errors.deliveryDate ? "border-[#EA1E61]" : "border-gray-200"}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" className="shrink-0 mr-2">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      <span className={`flex-1 text-left text-sm ${deliveryDate ? "text-[#464646]" : "text-gray-400"}`}>
                        {deliveryDate ? formatDate(deliveryDate) : "Select delivery date"}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" className="shrink-0"><path d="M6 9l6 6 6-6" /></svg>
                    </button>
                    {errors.deliveryDate && (
                      <p className="text-xs text-[#EA1E61] mt-1">{errors.deliveryDate}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Gifting Options */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
              <h2 className="text-lg font-semibold text-[#1C2120] mb-1 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round">
                  <polyline points="20 12 20 22 4 22 4 12" />
                  <rect x="2" y="7" width="20" height="5" />
                  <line x1="12" y1="22" x2="12" y2="7" />
                  <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
                  <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
                </svg>
                Gifting Options
              </h2>
              <p className="text-xs text-[#888] mb-4">Optional — leave blank if not needed</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#464646] mb-1.5">
                    Florist Instruction
                  </label>
                  <textarea
                    value={floristInstruction}
                    onChange={(e) => setFloristInstruction(e.target.value.slice(0, 500))}
                    placeholder="Any special instructions for the florist (e.g., preferred colors, arrangement style)"
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#737530] transition-colors resize-none"
                  />
                  <p className="text-xs text-[#888] mt-1 text-right">{floristInstruction.length}/500</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#464646] mb-1.5">
                    Message on Card
                  </label>
                  <textarea
                    value={messageOnCard}
                    onChange={(e) => setMessageOnCard(e.target.value.slice(0, 250))}
                    placeholder="Your personal message for the recipient"
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#737530] transition-colors resize-none"
                  />
                  <p className="text-xs text-[#888] mt-1 text-right">{messageOnCard.length}/250</p>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-lg font-semibold text-[#1C2120] mb-4 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Payment
              </h2>

              <div className="flex items-center gap-3 p-3 bg-[#F2F3E8] rounded-lg border border-[#E0E0E0] mb-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1C2120]">Pay with PayU</p>
                  <p className="text-xs text-[#888]">Credit/Debit Card, UPI, Net Banking, Wallets</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePayNow}
                disabled={submitting}
                className={`w-full py-3.5 text-sm font-bold rounded-lg tracking-wide transition-colors cursor-pointer ${
                  submitting
                    ? "bg-[#737530]/60 text-white/80 cursor-not-allowed"
                    : "bg-[#737530] text-white hover:bg-[#4C4D27]"
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>PAY NOW &#8212; &#8377; {total.toLocaleString("en-IN")}</>
                )}
              </button>
            </div>
          </div>

          {/* ── Right Column: Order Summary ── */}
          <div className="lg:w-[40%] shrink-0">
            <div
              className="bg-white rounded-xl border border-gray-100 p-5 lg:sticky lg:top-[120px]"
              style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
            >
              <h2 className="text-lg font-semibold text-[#1C2120] mb-4">
                Order Summary ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)
              </h2>

              {/* Cart items */}
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {cartItems.map((item, idx) => (
                  <div key={`${item.productId}-${item.variant || ""}-${idx}`} className="flex gap-3">
                    <div className="w-[60px] h-[60px] rounded-lg overflow-hidden bg-[#f8f8f8] shrink-0 relative">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="60px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1C2120] line-clamp-2">{item.name}</p>
                      {item.variant && (
                        <p className="text-xs text-[#888] mt-0.5">{item.variant}</p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-[#888]">Qty: {item.quantity}</span>
                        <span className="text-sm font-semibold text-[#1C2120]">
                          &#8377; {(item.price * item.quantity).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 mt-4 pt-4 space-y-2.5">
                {/* Coupon */}
                {couponApplied ? (
                  <div className="flex items-center justify-between bg-[#E8F5E9] rounded-lg px-3 py-2.5">
                    <div>
                      <span className="text-sm font-semibold text-[#2E7D32]">{couponCode}</span>
                      <span className="text-xs text-[#2E7D32] ml-2">{couponMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs text-[#EA1E61] font-semibold hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Coupon code"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#737530] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2 text-sm font-semibold border-2 border-[#737530] text-[#737530] rounded-lg hover:bg-[#737530] hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-[#EA1E61] mt-1">{couponError}</p>
                    )}
                  </div>
                )}

                {/* Subtotal */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#464646]">Subtotal</span>
                  <span className="text-[#1C2120] font-medium">
                    &#8377; {subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Delivery Charge */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#464646]">Delivery Charge</span>
                  {deliveryInfo ? (
                    deliveryCharge === 0 ? (
                      <span className="text-[#2E7D32] font-medium">FREE</span>
                    ) : (
                      <span className="text-[#1C2120] font-medium">
                        &#8377; {deliveryCharge.toLocaleString("en-IN")}
                      </span>
                    )
                  ) : (
                    <span className="text-[#888]">--</span>
                  )}
                </div>

                {/* Discount */}
                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#2E7D32]">Discount</span>
                    <span className="text-[#2E7D32] font-medium">
                      - &#8377; {discount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="border-t border-gray-100 pt-3 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-[#1C2120]">Total</span>
                    <span className="text-xl font-bold text-[#1C2120]">
                      &#8377; {total.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>}
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
              <button type="button" onClick={() => setShowCalendar(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between px-5 pb-4">
              <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#464646" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span className="text-sm font-semibold text-[#1C2120]">
                {calendarMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </span>
              <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
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
                const today = isTodayDay(day);

                return (
                  <div key={`d-${day}`} className="flex items-center justify-center py-[5px]">
                    <button
                      type="button"
                      disabled={!available}
                      onClick={() => selectCalendarDay(day)}
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
    </>
  );
}

/* ── Page wrapper with Suspense boundary for useSearchParams ── */
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1440px] mx-auto px-4 py-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-2 border-[#737530] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}
