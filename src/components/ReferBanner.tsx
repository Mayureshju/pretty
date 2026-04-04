"use client";

import Link from "next/link";

export default function ReferBanner() {
  return (
    <section className="max-w-[1320px] mx-auto px-4 py-4 md:py-6">
      <div className="w-full rounded-xl bg-[#F2F3E8] px-6 sm:px-8 py-6 md:py-8 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-[#1C2120]">
            Refer &amp; Earn &#8377;100
          </h3>
          <p className="text-sm text-[#939393] mt-1 max-w-[400px]">
            Invite friends and earn exciting rewards on every successful referral!
          </p>
          <Link
            href="/refer-and-earn"
            className="inline-block mt-4 px-6 py-2.5 bg-[#737530] text-white rounded-lg text-sm font-medium hover:bg-[#4C4D27] transition-colors"
          >
            Share Now
          </Link>
        </div>

        <div className="hidden sm:flex items-center justify-center w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-full bg-[#737530]/10">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6M22 11h-6" />
          </svg>
        </div>
      </div>
    </section>
  );
}
