import type { Metadata } from "next";
import { Suspense } from "react";
import WriteReviewForm from "@/components/WriteReviewForm";

export const metadata: Metadata = {
  title: "Offline Customer Review | Pretty Petals",
  description:
    "Rate your Pretty Petals offline order and share feedback with our team.",
  robots: { index: false, follow: false },
};

export default function OfflineReviewPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-10 text-center text-[#888]">Loading...</div>}>
      <WriteReviewForm
        mode="offline"
        title="Review Your Pretty Petals Experience"
        description="Bought from us offline? Share your rating and feedback here."
      />
    </Suspense>
  );
}
