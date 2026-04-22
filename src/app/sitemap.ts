import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Blog from "@/models/Blog";

export const revalidate = 3600;

const BASE_URL = "https://www.prettypetals.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDB();

  const [products, categories, blogs] = await Promise.all([
    Product.find({ isActive: true }, "slug updatedAt").lean(),
    Category.find({ isActive: true }, "slug updatedAt parent")
      .populate("parent", "slug")
      .lean(),
    Blog.find({ isPublished: true }, "slug updatedAt").lean(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about-us/`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact-us/`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/faq/`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/blog/`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/offers/`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/quotes/`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/send-flowers-navi-mumbai/`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/send-flowers-thane/`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/privacy-policy/`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/delivery-and-refund-policy/`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms-and-conditions/`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // Categories: nested path for children, flat for parents/standalone
  const categoryUrls: MetadataRoute.Sitemap = categories.map((c) => {
    const parent = c.parent as { slug: string } | null;
    const path = parent && typeof parent === "object" && parent.slug
      ? `/${parent.slug}/${c.slug}/`
      : `/${c.slug}/`;

    return {
      url: `${BASE_URL}${path}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.9,
    };
  });

  const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/product/${p.slug}/`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogUrls: MetadataRoute.Sitemap = blogs.map((b) => ({
    url: `${BASE_URL}/${b.slug}/`,
    lastModified: b.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...categoryUrls, ...productUrls, ...blogUrls];
}
