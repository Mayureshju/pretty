"use client";

export default function ReferBanner() {
  return (
    <section className="max-w-[1320px] mx-auto px-4 py-4 md:py-6">
      <a
        href="/refer-and-earn"
        className="block w-full rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl"
        style={{
          background: "linear-gradient(135deg, #C48B9F 0%, #A87389 40%, #C9A96E 100%)",
        }}
      >
        <div className="flex items-center justify-between px-6 sm:px-8 py-6 md:py-8">
          <div className="text-white flex-1">
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold">Refer &amp; Earn</h3>
            <p className="text-xs sm:text-sm mt-1 text-white/80 max-w-[400px]">
              Invite friends and earn exciting rewards on every successful referral!
            </p>
            <span className="inline-block mt-3 px-5 py-2 bg-white text-[#C48B9F] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
              Refer Now
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none" className="md:w-[100px] md:h-[100px]">
              <circle cx="50" cy="50" r="45" fill="white" opacity="0.1" />
              <circle cx="50" cy="50" r="30" fill="white" opacity="0.1" />
              <path d="M35 55 l8 8 20-20" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="70" cy="30" r="12" fill="#FDCB6E" />
              <text x="70" y="35" textAnchor="middle" fill="#C48B9F" fontSize="14" fontWeight="bold">%</text>
            </svg>
          </div>
        </div>
      </a>
    </section>
  );
}
