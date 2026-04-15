import type { Metadata } from "next";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import Coupon from "@/models/Coupon";
import OffersContent from "@/components/OffersContent";
import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("offers", {
    title: "Offers & Coupons | Pretty Petals",
    description:
      "Grab the best deals and discount coupons on fresh flowers, bouquets, and gifts from Pretty Petals. Save on every order with exclusive coupon codes.",
  });
}

export const revalidate = 3600;

export default async function OffersPage() {
  await connectDB();

  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    isPubliclyVisible: true,
    validFrom: { $lte: now },
    validTo: { $gte: now },
  })
    .select(
      "code type value description termsAndConditions minOrderAmount maxDiscount validFrom validTo"
    )
    .sort({ createdAt: -1 })
    .lean();

  return (
    <main>
      {/* Hero */}
      <section className="bg-[#1C2120] py-12 md:py-16">
        <div className="max-w-[1440px] mx-auto px-4">
          <h1 className="text-2xl md:text-4xl font-bold text-white">
            Offers &amp; Coupons
          </h1>
          <p className="text-sm md:text-base text-white/60 mt-2">
            Save more on beautiful flowers with exclusive deals
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-white/50">
            <Link href="/" className="hover:text-white/80 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/80">Offers</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-[1440px] mx-auto px-4 py-10 md:py-14">
        <OffersContent coupons={JSON.parse(JSON.stringify(coupons))} />
      </section>
    </main>
  );
}
