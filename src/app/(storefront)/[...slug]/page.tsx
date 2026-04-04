import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import {
  resolveNestedCategory,
  getCategoryPath,
} from "@/lib/slug-resolver";
import Category from "@/models/Category";
import Blog, { IBlog } from "@/models/Blog";
import Product from "@/models/Product";
import CategoryPage from "@/components/CategoryPage";
import BlogPostPage from "@/components/BlogPostPage";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export async function generateStaticParams() {
  await connectDB();

  const [categories, blogs] = await Promise.all([
    Category.find({ isActive: true }, "slug parent")
      .populate("parent", "slug")
      .lean(),
    Blog.find({ isPublished: true }, "slug").lean(),
  ]);

  const params: { slug: string[] }[] = [];

  // Categories: single segment for parents/standalone, two segments for children
  for (const c of categories) {
    if (c.parent && typeof c.parent === "object" && "slug" in c.parent) {
      params.push({ slug: [(c.parent as { slug: string }).slug, c.slug] });
    } else {
      params.push({ slug: [c.slug] });
    }
  }

  // Blogs: single segment
  for (const b of blogs) {
    params.push({ slug: [b.slug] });
  }

  return params;
}

export const revalidate = 3600;

const BASE_URL = "https://www.prettypetals.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const segments = (await params).slug;

  // Two segments: nested category (e.g., /flowers/roses/)
  if (segments.length === 2) {
    const category = await resolveNestedCategory(segments[0], segments[1]);
    if (!category) return { title: "Not Found | Pretty Petals" };

    const title = category.name;
    const description =
      category.description ||
      `Shop ${category.name} online. Fresh flower delivery in Mumbai by Pretty Petals.`;
    const path = getCategoryPath(category as Parameters<typeof getCategoryPath>[0]);

    return {
      title: `${title} | Pretty Petals`,
      description,
      alternates: { canonical: `${BASE_URL}${path}` },
      openGraph: {
        title,
        description,
        url: `${BASE_URL}${path}`,
        type: "website",
      },
    };
  }

  // More than 2 segments: not found
  if (segments.length > 2) {
    return { title: "Not Found | Pretty Petals" };
  }

  // Single segment: category or blog (products are at /product/[slug])
  const slug = segments[0];
  await connectDB();

  const [category, blog] = await Promise.all([
    Category.findOne({ slug, isActive: true })
      .populate("parent", "name slug")
      .lean(),
    Blog.findOne({ slug, isPublished: true }).lean<IBlog>(),
  ]);

  if (category) {
    const title = category.name;
    const description =
      (category.description as string) ||
      `Shop ${category.name} online. Fresh flower delivery in Mumbai by Pretty Petals.`;
    const path = getCategoryPath(category as Parameters<typeof getCategoryPath>[0]);

    return {
      title: `${title} | Pretty Petals`,
      description,
      alternates: { canonical: `${BASE_URL}${path}` },
      openGraph: {
        title,
        description,
        url: `${BASE_URL}${path}`,
        type: "website",
      },
    };
  }

  if (blog) {
    const title = blog.seo?.metaTitle || blog.title;
    const description =
      blog.seo?.metaDescription ||
      blog.excerpt ||
      `${blog.title} - Pretty Petals Blog`;

    return {
      title: `${title} | Pretty Petals Blog`,
      description,
      alternates: { canonical: `${BASE_URL}/${slug}/` },
      openGraph: {
        title,
        description,
        url: `${BASE_URL}/${slug}/`,
        type: "article",
        ...(blog.image && { images: [{ url: blog.image, alt: blog.title }] }),
      },
    };
  }

  return { title: "Not Found | Pretty Petals" };
}

export default async function SlugPage({ params }: Props) {
  const segments = (await params).slug;

  // More than 2 segments: not valid
  if (segments.length > 2) {
    notFound();
  }

  // Two segments: parent/child category (e.g., /flowers/roses/)
  if (segments.length === 2) {
    const category = await resolveNestedCategory(segments[0], segments[1]);
    if (!category) notFound();

    await connectDB();
    const [products, childCategories, totalProducts] = await Promise.all([
      Product.find({ category: category!._id, isActive: true })
        .select("name slug pricing images metrics isFeatured")
        .sort({ "metrics.totalSales": -1 })
        .limit(24)
        .lean(),
      Category.find({ parent: category!._id, isActive: true })
        .select("name slug image productCount")
        .sort({ order: 1 })
        .lean(),
      Product.countDocuments({ category: category!._id, isActive: true }),
    ]);

    return (
      <CategoryPage
        category={JSON.parse(JSON.stringify(category))}
        products={JSON.parse(JSON.stringify(products))}
        childCategories={JSON.parse(JSON.stringify(childCategories))}
        totalProducts={totalProducts}
      />
    );
  }

  // Single segment: category or blog
  const slug = segments[0];
  await connectDB();

  const category = await Category.findOne({ slug, isActive: true })
    .populate("parent", "name slug")
    .lean();

  if (category) {
    const [products, childCategories, totalProducts] = await Promise.all([
      Product.find({ category: category._id, isActive: true })
        .select("name slug pricing images metrics isFeatured")
        .sort({ "metrics.totalSales": -1 })
        .limit(24)
        .lean(),
      Category.find({ parent: category._id, isActive: true })
        .select("name slug image productCount")
        .sort({ order: 1 })
        .lean(),
      Product.countDocuments({ category: category._id, isActive: true }),
    ]);

    return (
      <CategoryPage
        category={JSON.parse(JSON.stringify(category))}
        products={JSON.parse(JSON.stringify(products))}
        childCategories={JSON.parse(JSON.stringify(childCategories))}
        totalProducts={totalProducts}
      />
    );
  }

  const blog = await Blog.findOne({ slug, isPublished: true }).lean<IBlog>();
  if (blog) {
    return <BlogPostPage blog={JSON.parse(JSON.stringify(blog))} />;
  }

  notFound();
}
