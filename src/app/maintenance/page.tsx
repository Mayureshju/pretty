import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "We'll be back soon | Pretty Petals",
  description:
    "Pretty Petals is temporarily unavailable while we tend to the shop. Please check back shortly or reach us on WhatsApp and phone.",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#F2F3E8] flex flex-col">
      <header className="px-4 py-5">
        <div className="max-w-[1440px] mx-auto">
          <Image
            src="/logo11.webp"
            alt="Pretty Petals"
            width={160}
            height={50}
            className="h-[38px] md:h-[44px] w-auto"
            priority
          />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <section className="w-full max-w-[560px] text-center bg-white rounded-2xl border border-[#E0E0E0] px-6 py-12 md:px-10 md:py-14 shadow-[0_8px_24px_rgba(115,117,48,0.08)]">
          <p className="text-sm font-semibold tracking-wide text-[#737530] uppercase">
            Maintenance
          </p>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold text-[#1C2120]">
            We&apos;ll be back soon
          </h1>
          <p className="mt-4 text-[15px] text-[#939393] leading-relaxed">
            Pretty Petals is taking a short pause while we freshen things up.
            Fresh flowers, cakes, and gifts will be back online shortly.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://api.whatsapp.com/send?phone=919833100194"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#737530] text-white text-sm font-medium hover:bg-[#4C4D27] transition-colors"
            >
              WhatsApp us
            </a>
            <a
              href="tel:+919833100194"
              className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 rounded-lg border border-[#737530] text-sm font-medium text-[#737530] hover:bg-[#737530] hover:text-white transition-colors"
            >
              Call +91 98331 00194
            </a>
          </div>

          <p className="mt-6 text-sm text-[#939393]">
            Or email{" "}
            <a
              href="mailto:support@prettypetals.com"
              className="font-medium text-[#737530] hover:underline"
            >
              support@prettypetals.com
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
