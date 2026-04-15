import type { Metadata } from "next";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import Quote from "@/models/Quote";
import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("quotes", {
    title: "Flower Quotes & Wishes | Pretty Petals",
    description:
      "Beautiful flower quotes, love messages, birthday wishes, and anniversary messages. Find the perfect words to pair with your Pretty Petals bouquet.",
  });
}

export const revalidate = 3600;

export default async function QuotesPage() {
  await connectDB();

  const quotes = await Quote.find({ isActive: true })
    .select("text author category color order")
    .sort({ category: 1, order: 1 })
    .lean();

  // Group by category, preserving order and color from the first quote in each group
  const categoryMap = new Map<
    string,
    { color: string; quotes: { text: string; author: string }[] }
  >();

  for (const q of quotes) {
    const cat = q.category;
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, { color: q.color || "#737530", quotes: [] });
    }
    categoryMap.get(cat)!.quotes.push({ text: q.text, author: q.author || "" });
  }

  const quoteCategories = Array.from(categoryMap.entries()).map(
    ([title, data]) => ({
      title,
      color: data.color,
      quotes: data.quotes,
    })
  );

  return (
    <main>
      {/* Hero */}
      <section className="bg-[#1C2120] py-12 md:py-16">
        <div className="max-w-[1440px] mx-auto px-4">
          <h1 className="text-2xl md:text-4xl font-bold text-white">
            Flower Quotes &amp; Wishes
          </h1>
          <p className="text-sm md:text-base text-white/60 mt-2">
            Find the perfect words to pair with your bouquet
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-white/50">
            <Link href="/" className="hover:text-white/80 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/80">Quotes</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-[1440px] mx-auto px-4 py-10 md:py-14">
        {quoteCategories.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-[#939393]">
              No quotes available yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-12 md:space-y-16">
            {quoteCategories.map((category) => (
              <div key={category.title}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-1 h-7 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <h2 className="text-xl md:text-2xl font-bold text-[#1C2120]">
                    {category.title}
                  </h2>
                </div>

                {/* Quotes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {category.quotes.map((quote, i) => (
                    <div
                      key={i}
                      className="bg-white border border-[#EEEEEE] rounded-xl p-5 md:p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow relative"
                    >
                      {/* Quote mark */}
                      <span
                        className="absolute top-3 right-4 text-4xl md:text-5xl font-serif leading-none opacity-10 select-none"
                        style={{ color: category.color }}
                      >
                        &ldquo;
                      </span>

                      <p className="text-[14px] md:text-[15px] text-[#444] leading-[1.8] relative z-10">
                        &ldquo;{quote.text}&rdquo;
                      </p>
                      {quote.author && (
                        <p
                          className="mt-3 text-[13px] font-medium"
                          style={{ color: category.color }}
                        >
                          &mdash; {quote.author}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 bg-[#F7F8F1] rounded-2xl px-6 md:px-10 py-8 md:py-10 text-center">
          <h3 className="text-xl md:text-2xl font-bold text-[#1C2120] mb-2">
            Pair Your Words With Fresh Flowers
          </h3>
          <p className="text-[14px] md:text-[15px] text-[#555] mb-5 max-w-lg mx-auto">
            Add a personalized message with any of these quotes when you order
            from Pretty Petals.
          </p>
          <Link
            href="/flowers/"
            className="inline-flex px-8 py-3.5 text-[14px] font-semibold text-white bg-[#737530] rounded-xl hover:bg-[#4C4D27] transition-colors"
          >
            Shop Flowers Now
          </Link>
        </div>
      </section>
    </main>
  );
}
