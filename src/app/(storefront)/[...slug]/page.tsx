import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import {
  resolveNestedCategory,
  getServedCategoryPath,
  categoryRequestPath,
} from "@/lib/slug-resolver";
import Category from "@/models/Category";
import Blog, { IBlog } from "@/models/Blog";
import Product from "@/models/Product";
import { getActiveSales, applyActiveSale } from "@/lib/sale-utils";
import { htmlToPlainText } from "@/lib/plate-html";
import CategoryPage from "@/components/CategoryPage";
import BlogPostPage from "@/components/BlogPostPage";

type Props = {
  params: Promise<{ slug: string[] }>;
};

type CategoryDoc = {
  _id: unknown;
  name: string;
  slug: string;
  description?: string;
  parent?: { slug: string; name?: string } | null;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
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

  // Categories: served URL segments (flat when a legacy 308 wins, e.g. photo-cake)
  for (const c of categories) {
    const served = getServedCategoryPath(
      c as Parameters<typeof getServedCategoryPath>[0]
    );
    const segments = served.replace(/^\/|\/$/g, "").split("/").filter(Boolean);
    params.push({ slug: segments });
  }

  // Blogs: single segment
  for (const b of blogs) {
    params.push({ slug: [b.slug] });
  }

  return params;
}

export const revalidate = 3600;

const BASE_URL = "https://www.prettypetals.com";

function asCategoryPathInput(category: CategoryDoc) {
  return category as Parameters<typeof getServedCategoryPath>[0];
}

function redirectIfNotPreferred(segments: string[], category: CategoryDoc) {
  const requested = categoryRequestPath(segments);
  const served = getServedCategoryPath(asCategoryPathInput(category));
  if (requested !== served) {
    permanentRedirect(served);
  }
}

function categoryMetadata(category: CategoryDoc, path: string): Metadata {
  const seo = category.seo;
  const title = seo?.metaTitle || category.name;
  const description =
    seo?.metaDescription ||
    category.description ||
    `Shop ${category.name} online. Fresh flower delivery in Mumbai by Pretty Petals.`;

  return {
    title: seo?.metaTitle ? seo.metaTitle : `${category.name} | Pretty Petals`,
    description,
    alternates: { canonical: `${BASE_URL}${path}` },
    openGraph: {
      title: seo?.ogTitle || title,
      description: seo?.ogDescription || description,
      url: `${BASE_URL}${path}`,
      type: "website",
    },
  };
}

async function loadCategoryBySlug(slug: string): Promise<CategoryDoc | null> {
  await connectDB();
  return Category.findOne({ slug, isActive: true })
    .populate("parent", "name slug")
    .lean<CategoryDoc>();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const segments = (await params).slug;

  if (segments.length === 2) {
    let category = (await resolveNestedCategory(
      segments[0],
      segments[1]
    )) as CategoryDoc | null;
    if (!category) {
      category = await loadCategoryBySlug(segments[1]);
      if (!category) return { title: "Not Found | Pretty Petals" };
    }
    redirectIfNotPreferred(segments, category);
    return categoryMetadata(category, categoryRequestPath(segments));
  }

  if (segments.length > 2) {
    return { title: "Not Found | Pretty Petals" };
  }

  const slug = segments[0];
  const [category, blog] = await Promise.all([
    loadCategoryBySlug(slug),
    (async () => {
      await connectDB();
      return Blog.findOne({ slug, isPublished: true }).lean<IBlog>();
    })(),
  ]);

  if (category) {
    redirectIfNotPreferred(segments, category);
    return categoryMetadata(category, categoryRequestPath(segments));
  }

  if (blog) {
    const title = blog.seo?.metaTitle || blog.title;
    const description =
      blog.seo?.metaDescription ||
      htmlToPlainText(blog.excerpt) ||
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

async function renderCategoryPage(category: CategoryDoc) {
  await connectDB();
  const [products, childCategories, totalProducts, activeSales] = await Promise.all([
    Product.find({ categories: category._id, isActive: true, isAddon: { $ne: true } })
      .select("name slug pricing images metrics isFeatured categories")
      .sort({ order: 1, "metrics.totalSales": -1, _id: 1 })
      .limit(24)
      .lean(),
    Category.find({ parent: category._id, isActive: true })
      .select("name slug image productCount")
      .sort({ order: 1 })
      .lean(),
    Product.countDocuments({ categories: category._id, isActive: true, isAddon: { $ne: true } }),
    getActiveSales(),
  ]);

  const productsWithSales = products.map((p) => {
    const sale = applyActiveSale(
      { pricing: p.pricing, categories: p.categories?.map((c: unknown) => String(c)) },
      activeSales as Parameters<typeof applyActiveSale>[1]
    );
    return {
      ...p,
      _saleInfo: sale.hasSale
        ? {
            effectivePrice: sale.effectivePrice,
            discountPercent: sale.discountPercent,
            saleLabel: sale.saleLabel,
          }
        : null,
    };
  });

  return (
    <CategoryPage
      category={JSON.parse(JSON.stringify(category))}
      products={JSON.parse(JSON.stringify(productsWithSales))}
      childCategories={JSON.parse(JSON.stringify(childCategories))}
      totalProducts={totalProducts}
    />
  );
}

export default async function SlugPage({ params }: Props) {
  const segments = (await params).slug;

  if (segments.length > 2) {
    notFound();
  }

  if (segments.length === 2) {
    let category = (await resolveNestedCategory(
      segments[0],
      segments[1]
    )) as CategoryDoc | null;
    if (!category) {
      category = await loadCategoryBySlug(segments[1]);
      if (!category) notFound();
    }
    redirectIfNotPreferred(segments, category);
    return renderCategoryPage(category);
  }

  const slug = segments[0];
  const category = await loadCategoryBySlug(slug);

  if (category) {
    redirectIfNotPreferred(segments, category);
    return renderCategoryPage(category);
  }

  await connectDB();
  const blog = await Blog.findOne({ slug, isPublished: true }).lean<IBlog>();
  if (blog) {
    return <BlogPostPage blog={JSON.parse(JSON.stringify(blog))} />;
  }

  notFound();
}
