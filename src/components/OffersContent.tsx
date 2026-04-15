"use client";

import { useState } from "react";

interface CouponData {
  _id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  description: string;
  termsAndConditions: string;
  minOrderAmount: number;
  maxDiscount?: number;
  validFrom: string;
  validTo: string;
}

const FILTERS = [
  { label: "All Coupons", value: "all" },
  { label: "Percentage Off", value: "percentage" },
  { label: "Flat Discount", value: "fixed" },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function OffersContent({ coupons }: { coupons: CouponData[] }) {
  const [filter, setFilter] = useState("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedTnc, setExpandedTnc] = useState<string | null>(null);

  const filtered =
    filter === "all" ? coupons : coupons.filter((c) => c.type === filter);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
              filter === f.value
                ? "bg-[#737530] text-white border-[#737530]"
                : "bg-white text-[#464646] border-[#E0E0E0] hover:border-[#737530] hover:text-[#737530]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Coupon Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-[#939393]">
            No coupons available right now. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filtered.map((coupon) => (
            <div
              key={coupon._id}
              className="bg-white rounded-xl border-2 border-dashed border-[#E0E0E0] hover:border-[#737530]/40 transition-colors overflow-hidden"
            >
              {/* Discount Badge */}
              <div className="bg-[#F7F8F1] px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[#737530]">
                    {coupon.type === "percentage"
                      ? `${coupon.value}%`
                      : formatCurrency(coupon.value)}
                  </span>
                  <span className="text-sm text-[#737530] font-medium">OFF</span>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    coupon.type === "percentage"
                      ? "bg-[#E3F2FD] text-[#1565C0]"
                      : "bg-[#FFF3E0] text-[#E65100]"
                  }`}
                >
                  {coupon.type === "percentage" ? "Percentage" : "Flat"}
                </span>
              </div>

              <div className="px-5 py-4 space-y-3">
                {/* Code + Copy */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#FAFAFA] border border-dashed border-[#D0D0D0] rounded-lg px-3 py-2 text-center">
                    <span className="font-bold font-mono text-[15px] text-[#1C2120] tracking-wider">
                      {coupon.code}
                    </span>
                  </div>
                  <button
                    onClick={() => copyCode(coupon.code)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      copiedCode === coupon.code
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-[#737530] text-white hover:bg-[#4C4D27]"
                    }`}
                  >
                    {copiedCode === coupon.code ? (
                      <span className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Copied
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                        Copy
                      </span>
                    )}
                  </button>
                </div>

                {/* Description */}
                {coupon.description && (
                  <p className="text-[13px] text-[#555] leading-relaxed">
                    {coupon.description}
                  </p>
                )}

                {/* Details */}
                <div className="space-y-1.5 text-[12px] text-[#888]">
                  {coupon.minOrderAmount > 0 && (
                    <p>
                      Min. order: {formatCurrency(coupon.minOrderAmount)}
                    </p>
                  )}
                  {coupon.maxDiscount && (
                    <p>
                      Max. discount: {formatCurrency(coupon.maxDiscount)}
                    </p>
                  )}
                  <p>
                    Valid:{" "}
                    {new Date(coupon.validFrom).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    -{" "}
                    {new Date(coupon.validTo).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* T&C Toggle */}
                {coupon.termsAndConditions && (
                  <div className="pt-1">
                    <button
                      onClick={() =>
                        setExpandedTnc(
                          expandedTnc === coupon._id ? null : coupon._id
                        )
                      }
                      className="text-[12px] font-medium text-[#737530] hover:underline flex items-center gap-1"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform ${
                          expandedTnc === coupon._id ? "rotate-180" : ""
                        }`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                      {expandedTnc === coupon._id
                        ? "Hide T&C"
                        : "View T&C"}
                    </button>
                    {expandedTnc === coupon._id && (
                      <div className="mt-2 bg-[#FAFAFA] rounded-lg p-3 text-[12px] text-[#666] leading-relaxed whitespace-pre-line">
                        {coupon.termsAndConditions}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
