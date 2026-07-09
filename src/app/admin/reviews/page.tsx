"use client";

import { useState, useEffect, useCallback } from "react";

interface AdminReview {
  _id: string;
  product?: { name: string; slug: string } | null;
  orderNumber?: string;
  customerName: string;
  customerEmail?: string;
  rating: number;
  title?: string;
  comment?: string;
  source: string;
  isApproved: boolean;
  needsFollowUp: boolean;
  createdAt: string;
}

const TABS = [
  { key: "all", label: "All" },
  { key: "approved", label: "Published" },
  { key: "pending", label: "Pending" },
  { key: "low", label: "Low (<3★)" },
  { key: "followup", label: "Follow-up" },
];

function Stars({ value }: { value: number }) {
  return (
    <span className="text-[#FDCB6E]">
      {"★".repeat(value)}
      <span className="text-gray-300">{"★".repeat(5 - value)}</span>
    </span>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?status=${tab}&limit=100`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (id: string, body: Record<string, boolean>) => {
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-[#1C2120] mb-1">Reviews</h1>
      <p className="text-sm text-[#888] mb-5">
        Reviews of 3★ and above can be published to the website. Reviews below 3★ are kept
        private for internal follow-up.
      </p>

      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
              tab === t.key
                ? "bg-[#737530] text-white border-[#737530]"
                : "bg-white text-[#464646] border-gray-200 hover:border-[#737530]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[#888]">Loading…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-[#888]">No reviews in this view.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="p-4 rounded-xl border border-gray-200 bg-white">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Stars value={r.rating} />
                    <span className="text-sm font-semibold text-[#1C2120]">{r.customerName}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase">{r.source}</span>
                    {r.isApproved ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">Published</span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Hidden</span>
                    )}
                    {r.needsFollowUp && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">Needs follow-up</span>
                    )}
                  </div>
                  {r.product && (
                    <p className="text-xs text-[#888] mt-1">Product: {r.product.name}</p>
                  )}
                  {r.orderNumber && (
                    <p className="text-xs text-[#888]">Order: {r.orderNumber}</p>
                  )}
                  {r.comment && <p className="text-sm text-[#464646] mt-2">{r.comment}</p>}
                  <p className="text-[11px] text-[#aaa] mt-2">
                    {r.customerEmail ? `${r.customerEmail} · ` : ""}
                    {new Date(r.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.rating >= 3 &&
                    (r.isApproved ? (
                      <button
                        onClick={() => patch(r._id, { isApproved: false })}
                        className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        Unpublish
                      </button>
                    ) : (
                      <button
                        onClick={() => patch(r._id, { isApproved: true })}
                        className="px-3 py-1.5 text-xs font-medium bg-[#737530] text-white rounded-lg hover:bg-[#4C4D27] cursor-pointer"
                      >
                        Publish
                      </button>
                    ))}
                  {r.needsFollowUp && (
                    <button
                      onClick={() => patch(r._id, { needsFollowUp: false })}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      Mark resolved
                    </button>
                  )}
                  <button
                    onClick={() => remove(r._id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
