import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { resolveSlug } from "@/lib/slug-resolver";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Blog from "@/models/Blog";
import ProductDetail from "@/components/ProductDetail";
import CategoryPage from "@/components/CategoryPage";
import BlogPostPage from "@/components/BlogPostPage";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  await connectDB();

  const [products, categories, blogs] = await Promise.all([
    Product.find({ isActive: true }, "slug").lean(),
    Category.find({ isActive: true }, "slug").lean(),
    Blog.find({ isPublished: true }, "slug").lean(),
  ]);

  return [
    ...products.map((p) => ({ slug: p.slug })),
    ...categories.map((c) => ({ slug: c.slug })),
    ...blogs.map((b) => ({ slug: b.slug })),
  ];
}

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await resolveSlug(slug);

  if (!result) {
    return { title: "Not Found | Pretty Petals" };
  }

  const baseUrl = "https://www.prettypetals.com";

  if (result.type === "product") {
    const product = result.data;
    const title = product.seo?.metaTitle || product.name;
    const description =
      product.seo?.metaDescription ||
      product.shortDescription ||
      `Buy ${product.name} online. Fresh flower delivery in Mumbai by Pretty Petals.`;
    const image = product.images?.[0]?.url;

    return {
      title: `${title} | Pretty Petals`,
      description,
      alternates: { canonical: `${baseUrl}/${slug}/` },
      openGraph: {
        title,
        description,
        url: `${baseUrl}/${slug}/`,
        type: "website",
        ...(image && { images: [{ url: image, alt: product.name }] }),
      },
    };
  }

  if (result.type === "category") {
    const category = result.data;
    const title = category.name;
    const description =
      category.description ||
      `Shop ${category.name} online. Fresh flower delivery in Mumbai by Pretty Petals.`;

    return {
      title: `${title} | Pretty Petals`,
      description,
      alternates: { canonical: `${baseUrl}/${slug}/` },
      openGraph: {
        title,
        description,
        url: `${baseUrl}/${slug}/`,
        type: "website",
      },
    };
  }

  // blog
  const blog = result.data;
  const title = blog.seo?.metaTitle || blog.title;
  const description =
    blog.seo?.metaDescription ||
    blog.excerpt ||
    `${blog.title} - Pretty Petals Blog`;

  return {
    title: `${title} | Pretty Petals Blog`,
    description,
    alternates: { canonical: `${baseUrl}/${slug}/` },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${slug}/`,
      type: "article",
      ...(blog.image && { images: [{ url: blog.image, alt: blog.title }] }),
    },
  };
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const result = await resolveSlug(slug);

  if (!result) {
    notFound();
  }

  if (result.type === "product") {
    const product = result.data;

    // Fetch similar products from the same category
    await connectDB();
    const similarProducts = product.category
      ? await Product.find({
          category: (product.category as unknown as { _id: string })?._id ?? product.category,
          isActive: true,
          _id: { $ne: product._id },
        })
          .limit(4)
          .select("name slug pricing images metrics")
          .lean()
      : [];

    return (
      <ProductDetail
        product={JSON.parse(JSON.stringify(product))}
        similarProducts={JSON.parse(JSON.stringify(similarProducts))}
      />
    );
  }

  if (result.type === "category") {
    const category = result.data;

    await connectDB();
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

  // blog
  const blog = result.data;
  return <BlogPostPage blog={JSON.parse(JSON.stringify(blog))} />;
}
