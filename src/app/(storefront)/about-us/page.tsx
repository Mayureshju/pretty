import type { Metadata } from "next";
import Image from "next/image";
import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("about-us", {
    title: "About Us | Pretty Petals",
    description:
      "Learn about Pretty Petals — Mumbai's trusted florist for same-day flower delivery. Fresh blooms, handcrafted bouquets, and meaningful gifting.",
    ogTitle: "About Us | Pretty Petals",
    ogDescription:
      "Learn about Pretty Petals — Mumbai's trusted florist for same-day flower delivery.",
  });
}

/* ── SVG icons ── */
function BouquetIcon({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 38V56" />
      <path d="M26 56h12" />
      <path d="M32 38c-8-2-14-10-14-20a14 14 0 0 1 28 0c0 10-6 18-14 20z" />
      <circle cx="32" cy="20" r="4" fill="#F2F3E8" />
      <path d="M24 24c2-3 5-5 8-5s6 2 8 5" />
    </svg>
  );
}

function DeliveryIcon({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="20" width="34" height="24" rx="2" />
      <path d="M40 32h12l6 8v4H40V32z" />
      <circle cx="18" cy="48" r="4" fill="#F2F3E8" />
      <circle cx="50" cy="48" r="4" fill="#F2F3E8" />
      <path d="M22 44h24" />
    </svg>
  );
}

function HeartIcon({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 54S8 38 8 22a12 12 0 0 1 24 0 12 12 0 0 1 24 0c0 16-24 32-24 32z" fill="#F2F3E8" />
      <path d="M26 30l4 4 8-8" />
    </svg>
  );
}

function ClockIcon({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="32" r="22" />
      <path d="M32 16v16l10 6" />
    </svg>
  );
}

function ShieldIcon({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 6L10 18v16c0 14 10 22 22 24 12-2 22-10 22-24V18L32 6z" fill="#F2F3E8" />
      <path d="M24 32l6 6 10-12" />
    </svg>
  );
}

function LeafIcon({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 52S8 20 32 8c24 12 20 44 20 44S36 56 32 40" fill="#F2F3E8" />
      <path d="M32 40V56" />
    </svg>
  );
}

export default function AboutUsPage() {
  return (
    <main>
      {/* ════════════ HERO ════════════ */}
      <section className="relative h-105 md:h-125 overflow-hidden">
        <Image
          src="/images/about/hero.jpg"
          alt="Pretty Petals — fresh flower arrangements"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-4">
          <p className="text-lg md:text-xl font-medium tracking-wide mb-2">
            Your Trusted Florist for
          </p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Same-Day Flower
            <br />
            Delivery in Mumbai
          </h1>
        </div>
      </section>

      {/* ════════════ INTRO ════════════ */}
      <section className="max-w-[1280px] mx-auto px-6 md:px-10 py-14 md:py-20">
        <p className="text-base md:text-lg leading-relaxed text-text-body">
          At Pretty Petals, we don&apos;t just deliver flowers — we deliver
          emotions, thoughtfully handcrafted into every bouquet. As a growing and
          trusted name in online flower delivery in Mumbai, our mission is
          simple:
        </p>
        <p className="text-lg md:text-2xl font-semibold text-primary mt-5">
          Make every moment special with fresh, elegant, and meaningful floral
          arrangements.
        </p>
        <p className="text-base md:text-lg leading-relaxed text-text-body mt-5">
          Whether it&apos;s a birthday surprise, anniversary celebration,
          wedding, or a simple gesture of love, we ensure your feelings are
          delivered beautifully and on time.
        </p>
      </section>

      {/* ════════════ OUR STORY ════════════ */}
      <section className="bg-bg-light">
        <div className="max-w-300 mx-auto px-4 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div className="relative aspect-4/3 rounded-lg overflow-hidden">
            <Image
              src="/images/about/story.png"
              alt="Indian florist hand-crafting a bouquet with pink roses and white lilies"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
              Our Story — From Passion to Petal-Perfect Gifting
            </h2>
            <p className="text-[15px] leading-relaxed text-text-body">
              Pretty Petals was born from a deep passion for flowers and
              meaningful gifting. What started as a small initiative to create
              personalized floral arrangements has now evolved into a premium
              florist brand in Mumbai, serving hundreds of happy customers across
              the city.
            </p>
            <p className="text-[15px] leading-relaxed text-text-body mt-4">
              We noticed a gap in the market — most online flower delivery
              platforms were transactional, lacking personalization and emotional
              connection. That&apos;s when Pretty Petals stepped in to redefine
              floral gifting with:
            </p>
            <ul className="mt-4 space-y-2 text-[15px] text-text-body">
              <li className="flex items-start gap-2">
                <span className="text-accent-rose">&#x1F496;</span>
                Custom-designed bouquets
              </li>
              <li className="flex items-start gap-2">
                <span>&#x1F69A;</span>
                Reliable same-day delivery
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-green">&#x1F33F;</span>
                Fresh, handpicked flowers sourced daily
              </li>
            </ul>
            <p className="text-[15px] leading-relaxed text-text-body mt-4 font-medium">
              Today, we proudly stand as a brand that blends creativity, quality,
              and customer trust.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════ DELIVERING EMOTIONS ════════════ */}
      <section className="max-w-300 mx-auto px-4 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
        <div className="order-2 md:order-1">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
            Delivering Emotions, One Bouquet at a Time
          </h2>
          <p className="text-[15px] leading-relaxed text-text-body">
            At Pretty Petals, we don&apos;t just deliver flowers — we deliver
            emotions, thoughtfully handcrafted into every bouquet. Whether
            it&apos;s a birthday surprise, anniversary celebration, wedding, or a
            simple gesture of love, we ensure your feelings are delivered
            beautifully and on time.
          </p>
        </div>
        <div className="relative aspect-4/3 rounded-lg overflow-hidden order-1 md:order-2">
          <Image
            src="/images/about/delivering-emotions.jpg"
            alt="Beautiful bouquet being delivered"
            fill
            className="object-cover"
          />
        </div>
      </section>

      {/* ════════════ THE PERFECT SURPRISE (3 icons) ════════════ */}
      <section className="bg-bg-light">
        <div className="max-w-300 mx-auto px-4 py-14 md:py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-text-dark mb-12">
            The Perfect Surprise
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 max-w-3xl mx-auto">
            <div className="flex flex-col items-center gap-3">
              <BouquetIcon />
              <span className="text-[15px] font-semibold text-text-dark">
                Custom Bouquets
              </span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <DeliveryIcon />
              <span className="text-[15px] font-semibold text-text-dark">
                Same-Day Delivery
              </span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <HeartIcon />
              <span className="text-[15px] font-semibold text-text-dark">
                Personalised for Them
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ VISION & MISSION ════════════ */}
      <section className="max-w-300 mx-auto px-4 py-14 md:py-20 grid md:grid-cols-2 gap-10">
        {/* Vision */}
        <div>
          <div className="relative aspect-4/3 rounded-lg overflow-hidden mb-6">
            <Image
              src="/images/about/vision.jpg"
              alt="Pretty Petals vision — celebrating the joy of giving"
              fill
              className="object-cover"
            />
          </div>
          <h3 className="text-2xl font-bold text-primary mb-2">Vision</h3>
          <p className="text-[15px] leading-relaxed text-text-body">
            Be Mumbai&apos;s most trusted florist brand — celebrating the joy of
            giving through fresh flowers and heartfelt gifting experiences.
          </p>
        </div>
        {/* Mission */}
        <div>
          <div className="relative aspect-4/3 rounded-lg overflow-hidden mb-6">
            <Image
              src="/images/about/mission.jpg"
              alt="Pretty Petals mission — premium quality and people-first approach"
              fill
              className="object-cover"
            />
          </div>
          <h3 className="text-2xl font-bold text-primary mb-2">Mission</h3>
          <p className="text-[15px] leading-relaxed text-text-body">
            Wow every customer, every time — through premium quality flowers,
            reliable same-day delivery, transparent pricing, and a genuinely
            people-first approach.
          </p>
        </div>
      </section>

      {/* ════════════ ROOTED IN LOVE (full-width) ════════════ */}
      <section className="relative h-90 md:h-105 overflow-hidden">
        <Image
          src="/images/about/rooted-in-love.jpg"
          alt="Pretty Petals — rooted in love, growing with you"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-4">
          <h2 className="text-3xl md:text-5xl font-bold mb-2">
            Rooted in Love, Growing With You
          </h2>
          <p className="text-base md:text-lg max-w-xl opacity-90">
            From our first bouquet to thousands of deliveries, every petal
            carries our promise of freshness and care.
          </p>
        </div>
      </section>

      {/* ════════════ OUR EXPERTISE ════════════ */}
      <section className="max-w-300 mx-auto px-4 py-14 md:py-20">
        <h2 className="text-2xl md:text-3xl font-bold text-text-dark mb-2 text-center">
          Our Expertise
        </h2>
        <p className="text-center text-text-gray mb-12">
          Crafted by Professional Florists
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Occasion-Based */}
          <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-(--shadow-hover) transition-shadow bg-white">
            <div className="relative h-52">
              <Image
                src="/images/about/occasions.jpg"
                alt="Occasion-based floral arrangements"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <h3 className="absolute bottom-4 left-4 right-4 text-lg font-semibold text-white">
                Occasion-Based Floral Arrangements
              </h3>
            </div>
            <div className="p-5">
              <ul className="space-y-2.5">
                {[
                  "Birthday flowers",
                  "Anniversary bouquets",
                  "Romantic flower gifts",
                  "Wedding and event floral decor",
                ].map((item) => (
                  <li key={item} className="text-sm text-text-body flex items-start gap-2">
                    <span className="text-accent-green mt-0.5">&#10003;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Combos */}
          <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-(--shadow-hover) transition-shadow bg-white">
            <div className="relative h-52">
              <Image
                src="/images/about/combos.jpg"
                alt="Flower and gift combos"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <h3 className="absolute bottom-4 left-4 right-4 text-lg font-semibold text-white">
                Flower &amp; Gift Combos
              </h3>
            </div>
            <div className="p-5">
              <ul className="space-y-2.5">
                {[
                  "Flowers with cakes",
                  "Flowers with chocolates",
                  "Luxury gifting hampers",
                ].map((item) => (
                  <li key={item} className="text-sm text-text-body flex items-start gap-2">
                    <span className="text-accent-green mt-0.5">&#10003;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Custom */}
          <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-(--shadow-hover) transition-shadow bg-white">
            <div className="relative h-52">
              <Image
                src="/images/about/custom-designs.jpg"
                alt="Custom floral designs"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <h3 className="absolute bottom-4 left-4 right-4 text-lg font-semibold text-white">
                Custom Floral Designs
              </h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-text-body leading-relaxed">
                Looking for something unique? We specialize in custom bouquet
                creation, allowing you to design flowers based on your
                preferences, budget, and occasion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ DELIVERY NETWORK ════════════ */}
      <section className="bg-bg-light">
        <div className="max-w-300 mx-auto px-4 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
              Our Delivery Network — Fast, Reliable &amp; On-Time
            </h2>
            <p className="text-[15px] leading-relaxed text-text-body mb-4">
              We provide same-day flower delivery in Mumbai, including:
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              {["Mumbai", "Thane", "Navi Mumbai"].map((city) => (
                <span
                  key={city}
                  className="px-4 py-2 bg-white border border-border-light rounded-full text-sm font-medium text-text-dark"
                >
                  {city}
                </span>
              ))}
            </div>
            <p className="text-[15px] leading-relaxed text-text-body mb-3">
              Our logistics system ensures:
            </p>
            <ul className="space-y-2 text-[15px] text-text-body">
              <li className="flex items-start gap-2">
                <span>&#x23F1;</span> Timely deliveries
              </li>
              <li className="flex items-start gap-2">
                <span>&#x1F4E6;</span> Safe handling of delicate flowers
              </li>
              <li className="flex items-start gap-2">
                <span>&#x1F338;</span> Freshness guaranteed
              </li>
            </ul>
          </div>
          <div className="relative aspect-4/3 rounded-lg overflow-hidden">
            <Image
              src="/images/about/delivery.jpg"
              alt="Same-day flower delivery in Mumbai"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ════════════ STATS BAR ════════════ */}
      <section className="bg-primary">
        <div className="max-w-300 mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[
            { value: "500+", label: "Bouquets Crafted" },
            { value: "3", label: "Cities Served" },
            { value: "100%", label: "Fresh Flowers" },
            { value: "100%", label: "Smiles Delivered" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl md:text-4xl font-bold">{stat.value}</div>
              <div className="text-sm opacity-85 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════ WHY CHOOSE PRETTY PETALS ════════════ */}
      <section className="max-w-300 mx-auto px-4 py-14 md:py-20">
        <h2 className="text-2xl md:text-3xl font-bold text-text-dark mb-2 text-center">
          Why Choose Pretty Petals?
        </h2>
        <p className="text-center text-text-gray mb-10">
          Here&apos;s what makes us different from other florists
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Freshness */}
          <div className="border border-border-card rounded-lg p-6 text-center flex flex-col items-center gap-3 hover:shadow-(--shadow-hover) transition-shadow">
            <LeafIcon />
            <h3 className="text-base font-semibold text-text-dark">
              Freshness You Can Trust
            </h3>
            <p className="text-sm text-text-body leading-relaxed">
              We source flowers daily to ensure every bouquet looks vibrant and
              lasts longer.
            </p>
          </div>

          {/* Personalized */}
          <div className="border border-border-card rounded-lg p-6 text-center flex flex-col items-center gap-3 hover:shadow-(--shadow-hover) transition-shadow">
            <HeartIcon />
            <h3 className="text-base font-semibold text-text-dark">
              Personalized Gifting Experience
            </h3>
            <p className="text-sm text-text-body leading-relaxed">
              Unlike generic platforms, we focus on customization and emotional
              value.
            </p>
          </div>

          {/* Transparent */}
          <div className="border border-border-card rounded-lg p-6 text-center flex flex-col items-center gap-3 hover:shadow-(--shadow-hover) transition-shadow">
            <ShieldIcon />
            <h3 className="text-base font-semibold text-text-dark">
              Transparent Pricing
            </h3>
            <p className="text-sm text-text-body leading-relaxed">
              No hidden charges — what you see is what you pay.
            </p>
          </div>

          {/* Customer-First */}
          <div className="border border-border-card rounded-lg p-6 text-center flex flex-col items-center gap-3 hover:shadow-(--shadow-hover) transition-shadow">
            <ClockIcon />
            <h3 className="text-base font-semibold text-text-dark">
              Customer-First Approach
            </h3>
            <p className="text-sm text-text-body leading-relaxed">
              From order placement to delivery, we prioritize your experience at
              every step.
            </p>
          </div>

          {/* Real Local Florist */}
          <div className="border border-border-card rounded-lg p-6 text-center flex flex-col items-center gap-3 hover:shadow-(--shadow-hover) transition-shadow">
            <BouquetIcon />
            <h3 className="text-base font-semibold text-text-dark">
              Real Local Florist in Mumbai
            </h3>
            <p className="text-sm text-text-body leading-relaxed">
              We are not just an aggregator — we are a hands-on florist brand,
              ensuring quality control.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════ BOTTOM TRUST STRIP ════════════ */}
      <section className="border-t border-border-light bg-white">
        <div className="max-w-300 mx-auto px-4 py-6 flex flex-wrap justify-center gap-8 text-sm text-text-body">
          <div className="flex items-center gap-2">
            <DeliveryIcon size={28} />
            <span>Same-Day Delivery across Mumbai</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldIcon size={28} />
            <span>100% Safe &amp; Secure Payments</span>
          </div>
        </div>
      </section>
    </main>
  );
}
