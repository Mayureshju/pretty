"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

interface ReviewItem {
  _id: string;
  customerName: string;
  rating: number;
  title?: string;
  comment?: string;
  createdAt: string;
  source?: string;
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="15" height="15" viewBox="0 0 24 24" fill={s <= value ? "#FDCB6E" : "#E5E7EB"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="cursor-pointer"
          aria-label={`${s} star`}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill={s <= (hover || value) ? "#FDCB6E" : "#E5E7EB"}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?product=${productId}&limit=20`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          customerName: name,
          customerEmail: email,
          rating,
          comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not submit review");
      } else {
        toast.success(data.message || "Thank you for your review!");
        setShowForm(false);
        setName("");
        setEmail("");
        setComment("");
        setRating(5);
        if (data.published) load();
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-8 border-t border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg md:text-xl font-semibold text-[#1C2120]">
          Customer Reviews
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 text-sm font-medium border-2 border-[#737530] text-[#737530] rounded-lg hover:bg-[#737530] hover:text-white transition-all cursor-pointer"
        >
          {showForm ? "Cancel" : "Write a Review"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-8 p-5 rounded-xl border border-gray-200 bg-[#FAFAF5]">
          <p className="text-sm text-[#464646] mb-3">
            How would you rate <span className="font-medium">{productName}</span>?
          </p>
          <StarInput value={rating} onChange={setRating} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name *"
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#737530]"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional)"
              type="email"
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#737530]"
            />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            rows={3}
            className="w-full mt-3 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#737530]"
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-3 px-6 py-2.5 text-sm font-medium bg-[#737530] text-white rounded-lg hover:bg-[#4C4D27] transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-[#888]">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-[#888]">No reviews yet. Be the first to review this product!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <div key={r._id} className="p-4 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} />
                <span className="text-[11px] text-[#939393]">
                  {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              {r.title && <p className="mt-2 text-sm font-semibold text-[#1C2120]">{r.title}</p>}
              {r.comment && <p className="mt-1 text-sm text-[#464646] leading-relaxed">{r.comment}</p>}
              <p className="mt-3 text-[13px] font-medium text-[#1C2120]">
                {r.customerName}
                {r.source === "google" && <span className="ml-1 text-[11px] text-[#888]">via Google</span>}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
