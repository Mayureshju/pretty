import HeroBanner from "@/components/HeroBanner";
import Categories from "@/components/Categories";
import OccasionsSection from "@/components/OccasionsSection";
import BestSellers from "@/components/BestSellers";
import CategoryCards from "@/components/CategoryCards";
import ReferBanner from "@/components/ReferBanner";
import Testimonials from "@/components/Testimonials";
import SeoContent from "@/components/SeoContent";
import BlogSection from "@/components/BlogSection";

export default function Home() {
  return (
    <>
      <HeroBanner />
      <Categories />
      <OccasionsSection />
      <BestSellers />
      <CategoryCards />
      <ReferBanner />
      <Testimonials />
      <SeoContent />
      <BlogSection />
    </>
  );
}
