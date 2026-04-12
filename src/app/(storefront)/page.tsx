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
import Blog from "@/models/Blog";
import Category from "@/models/Category";
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
    mobileImage: (b as unknown as Record<string, string>).mobileImage || undefined,
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

async function getCakeProducts() {
  await connectDB();
  const cakesCat = await Category.findOne({ slug: "cakes" }).lean();
  const premiumCat = await Category.findOne({ slug: "premium-cakes" }).lean();
  const categoryIds = [cakesCat?._id, premiumCat?._id].filter(Boolean);

  if (categoryIds.length === 0) return [];

  const products = await Product.find({
    isActive: true,
    categories: { $in: categoryIds },
  })
    .select("name slug images pricing")
    .sort({ "metrics.totalSales": -1 })
    .limit(5)
    .lean();

  return products.map((p) => ({
    name: p.name,
    slug: p.slug,
    image: p.images?.[0]?.url || "/images/cakes/chocolate.jpg",
    price: p.pricing?.currentPrice ?? p.pricing?.regularPrice,
  }));
}

async function getLatestBlogs() {
  await connectDB();
  const blogs = await Blog.find({ isPublished: true })
    .select("title slug excerpt image")
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();
  return blogs;
}

export default async function Home() {
  const [heroBanners, bestSellers, cakeProducts, latestBlogs] = await Promise.all([
    getHeroBanners(),
    getBestSellers(),
    getCakeProducts(),
    getLatestBlogs(),
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
      <CategoryCards cakes={JSON.parse(JSON.stringify(cakeProducts))} />
      <ReferBanner />
      <Testimonials />
      <NewsletterCTA />
      <SeoContent />
      <BlogSection blogs={JSON.parse(JSON.stringify(latestBlogs))} />
    </>
  );
}
