import HeroBanner from "@/components/HeroBanner";
import Categories from "@/components/Categories";
import FlowerTypes from "@/components/FlowerTypes";
import TrustStrip from "@/components/TrustStrip";
import OccasionsSection from "@/components/OccasionsSection";
import BestSellers from "@/components/BestSellers";
import FeaturedCollection from "@/components/FeaturedCollection";
import CategoryCards from "@/components/CategoryCards";
import ReferBanner from "@/components/ReferBanner";
import Testimonials from "@/components/Testimonials";
import NewsletterCTA from "@/components/NewsletterCTA";
import SeoContent from "@/components/SeoContent";
import BlogSection from "@/components/BlogSection";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Banner from "@/models/Banner";
import { getActiveSales, applyActiveSale } from "@/lib/sale-utils";

export const revalidate = 3600;

async function getHeroBanners() {
  await connectDB();
  const now = new Date();
  const banners = await Banner.find({
    isActive: true,
    position: "hero",
    $or: [
      { startDate: { $exists: false }, endDate: { $exists: false } },
      { startDate: null, endDate: null },
      { startDate: { $lte: now }, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: null },
      { startDate: null, endDate: { $gte: now } },
    ],
  })
    .sort({ order: 1 })
    .lean();

  return banners.map((b) => ({
    id: String(b._id),
    tag: b.subtitle || "",
    title: b.title,
    subtitle: b.subtitle || "",
    cta: { text: "Shop Now", href: b.link || "/flowers/" },
    image: b.image,
  }));
}

async function getBestSellers() {
  await connectDB();
  const [products, activeSales] = await Promise.all([
    Product.find({ isActive: true })
      .select("name slug pricing images metrics isFeatured categories")
      .sort({ "metrics.totalSales": -1 })
      .limit(8)
      .lean(),
    getActiveSales(),
  ]);

  return products.map((p) => {
    const sale = applyActiveSale(
      { pricing: p.pricing, categories: p.categories?.map((c: unknown) => String(c)) },
      activeSales as Parameters<typeof applyActiveSale>[1]
    );
    return {
      ...p,
      _saleInfo: sale.hasSale
        ? { effectivePrice: sale.effectivePrice, discountPercent: sale.discountPercent, saleLabel: sale.saleLabel }
        : null,
    };
  });
}

export default async function Home() {
  const [heroBanners, bestSellers] = await Promise.all([
    getHeroBanners(),
    getBestSellers(),
  ]);

  return (
    <>
      <HeroBanner banners={heroBanners.length > 0 ? heroBanners : undefined} />
      <Categories />
      <FlowerTypes />
      <TrustStrip />
      <OccasionsSection />
      <BestSellers products={JSON.parse(JSON.stringify(bestSellers))} />
      <FeaturedCollection />
      <CategoryCards />
      <ReferBanner />
      <Testimonials />
      <NewsletterCTA />
      <SeoContent />
      <BlogSection />
    </>
  );
}
