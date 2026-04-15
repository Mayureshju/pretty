import type { Metadata } from "next";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import FAQ from "@/models/FAQ";
import FAQContent from "@/components/FAQContent";
import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("faq", {
    title: "FAQ | Pretty Petals",
    description:
      "Find answers to frequently asked questions about ordering flowers, delivery, payments, and more at Pretty Petals.",
  });
}

export const revalidate = 3600;

export default async function FAQPage() {
  await connectDB();

  const faqs = await FAQ.find({ isActive: true })
    .select("question answer category order")
    .sort({ category: 1, order: 1 })
    .lean();

  // Group by category
  const groupMap = new Map<string, { _id: string; question: string; answer: string; category: string }[]>();
  for (const faq of faqs) {
    const cat = faq.category || "General";
    if (!groupMap.has(cat)) groupMap.set(cat, []);
    groupMap.get(cat)!.push({
      _id: String(faq._id),
      question: faq.question,
      answer: faq.answer,
      category: cat,
    });
  }

  const groups = Array.from(groupMap.entries()).map(([category, items]) => ({
    category,
    items,
  }));

  return (
    <main>
      {/* Hero */}
      <section className="bg-[#1C2120] py-12 md:py-16">
        <div className="max-w-[1440px] mx-auto px-4">
          <h1 className="text-2xl md:text-4xl font-bold text-white">
            Frequently Asked Questions
          </h1>
          <p className="text-sm md:text-base text-white/60 mt-2">
            Everything you need to know about ordering from Pretty Petals
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-white/50">
            <Link href="/" className="hover:text-white/80 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/80">FAQ</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-[900px] mx-auto px-4 py-10 md:py-14">
        <FAQContent groups={groups} />
      </section>
    </main>
  );
}
