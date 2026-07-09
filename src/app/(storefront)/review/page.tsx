import type { Metadata } from "next";
import { Suspense } from "react";
import WriteReviewForm from "@/components/WriteReviewForm";

export const metadata: Metadata = {
  title: "Write a Review | Pretty Petals",
  description:
    "Share your experience with Pretty Petals. Rate your order and help others discover fresh flower delivery in Mumbai.",
  robots: { index: false, follow: false },
};

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-10 text-center text-[#888]">Loading…</div>}>
      <WriteReviewForm />
    </Suspense>
  );
}
