import HeroBanner from "@/components/HeroBanner";
import Categories from "@/components/Categories";
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

export default function Home() {
  return (
    <>
      <HeroBanner />
      <Categories />
      <TrustStrip />
      <OccasionsSection />
      <BestSellers />
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
