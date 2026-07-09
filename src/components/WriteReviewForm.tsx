"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1.5">
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
          <svg width="36" height="36" viewBox="0 0 24 24" fill={s <= (hover || value) ? "#FDCB6E" : "#E5E7EB"}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function WriteReviewForm() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") || "";

  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

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
          customerName: name,
          customerEmail: email,
          rating,
          comment,
          orderNumber: orderNumber || undefined,
          source: orderNumber ? "website" : "offline",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not submit review");
      } else {
        setDone(data.message || "Thank you for your review!");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-[#1C2120] mb-1">Share Your Experience</h1>
      <p className="text-sm text-[#888] mb-6">
        {orderNumber
          ? `We'd love to hear about your order ${orderNumber}.`
          : "Tell us how we did — your feedback helps us bloom."}
      </p>

      {done ? (
        <div className="p-6 rounded-xl border border-gray-200 bg-[#F5FBF2] text-center">
          <div className="text-4xl mb-2">🌸</div>
          <p className="text-[#1C2120] font-medium">{done}</p>
          {rating >= 4 && (
            <a
              href="https://search.google.com/local/writereview?placeid=PLACE_ID_HERE"
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-4 px-6 py-2.5 text-sm font-medium bg-[#737530] text-white rounded-lg hover:bg-[#4C4D27] transition-all"
            >
              Also leave us a Google review
            </a>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="p-5 rounded-xl border border-gray-200">
          <label className="block text-sm font-medium text-[#464646] mb-2">Your Rating</label>
          <StarInput value={rating} onChange={setRating} />

          <div className="grid grid-cols-1 gap-3 mt-5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name *"
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#737530]"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional)"
              type="email"
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#737530]"
            />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about your experience..."
              rows={4}
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#737530]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full px-6 py-3 text-sm font-medium bg-[#737530] text-white rounded-lg hover:bg-[#4C4D27] transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
          <p className="mt-3 text-xs text-[#999]">
            Reviews of 3 stars and above are published on our website. Lower ratings are sent
            privately to our team so we can make things right.
          </p>
        </form>
      )}
    </div>
  );
}
