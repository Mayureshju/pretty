import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import PageSeo from "@/models/PageSeo";

const BASE_URL = "https://www.prettypetals.com";

/**
 * All static pages that can have their SEO managed from admin.
 * pageSlug is the key, pageLabel is the display name.
 */
export const STATIC_PAGES = [
  { pageSlug: "home", pageLabel: "Homepage", path: "/" },
  { pageSlug: "send-flowers-thane", pageLabel: "Flowers in Thane", path: "/send-flowers-thane/" },
  { pageSlug: "send-flowers-navi-mumbai", pageLabel: "Flowers in Navi Mumbai", path: "/send-flowers-navi-mumbai/" },
  { pageSlug: "faq", pageLabel: "FAQ", path: "/faq/" },
  { pageSlug: "about-us", pageLabel: "About Us", path: "/about-us/" },
  { pageSlug: "contact-us", pageLabel: "Contact Us", path: "/contact-us/" },
  { pageSlug: "quotes", pageLabel: "Quotes", path: "/quotes/" },
  { pageSlug: "blog", pageLabel: "Blog", path: "/blog/" },
  { pageSlug: "offers", pageLabel: "Offers & Coupons", path: "/offers/" },
  { pageSlug: "delivery-and-refund-policy", pageLabel: "Delivery & Refund Policy", path: "/delivery-and-refund-policy/" },
  { pageSlug: "privacy-policy", pageLabel: "Privacy Policy", path: "/privacy-policy/" },
  { pageSlug: "terms-and-conditions", pageLabel: "Terms & Conditions", path: "/terms-and-conditions/" },
] as const;

interface FallbackSeo {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
}

/**
 * Build page metadata by merging DB values over hardcoded fallbacks.
 * Reads from DB if a record exists; otherwise uses the provided defaults.
 */
export async function getPageMetadata(
  pageSlug: string,
  fallback: FallbackSeo
): Promise<Metadata> {
  const page = STATIC_PAGES.find((p) => p.pageSlug === pageSlug);
  const canonical = page ? `${BASE_URL}${page.path}` : undefined;

  try {
    await connectDB();
    const seo = await PageSeo.findOne({ pageSlug }).lean();

    const title = seo?.metaTitle || fallback.title;
    const description = seo?.metaDescription || fallback.description;
    const ogTitle = seo?.ogTitle || fallback.ogTitle || title;
    const ogDescription = seo?.ogDescription || fallback.ogDescription || description;

    return {
      title,
      description,
      ...(canonical && { alternates: { canonical } }),
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        ...(canonical && { url: canonical }),
        type: "website",
      },
    };
  } catch {
    // If DB fails, return hardcoded fallbacks
    return {
      title: fallback.title,
      description: fallback.description,
      ...(canonical && { alternates: { canonical } }),
      openGraph: {
        title: fallback.ogTitle || fallback.title,
        description: fallback.ogDescription || fallback.description,
        ...(canonical && { url: canonical }),
        type: "website",
      },
    };
  }
}
