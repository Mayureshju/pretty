import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import Product, { IProduct } from "@/models/Product";
import "@/models/Category"; // Ensure Category schema is registered for populate
import { getActiveSales, applyActiveSale } from "@/lib/sale-utils";
import ProductDetail from "@/components/ProductDetail";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  await connectDB();
  const products = await Product.find({ isActive: true }, "slug").lean();
  return products.map((p) => ({ slug: p.slug }));
}

export const revalidate = 3600;

const BASE_URL = "https://www.prettypetals.com";

async function getProduct(slug: string) {
  await connectDB();
  return Product.findOne({ slug, isActive: true })
    .populate({
      path: "categories",
      select: "name slug parent",
      populate: { path: "parent", select: "name slug" },
    })
    .lean<IProduct>();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return { title: "Not Found | Pretty Petals" };

  const title = product.seo?.metaTitle || product.name;
  const description =
    product.seo?.metaDescription ||
    product.shortDescription ||
    `Buy ${product.name} online. Fresh flower delivery in Mumbai by Pretty Petals.`;
  const image = product.images?.[0]?.url;

  return {
    title: `${title} | Pretty Petals`,
    description,
    alternates: { canonical: `${BASE_URL}/product/${slug}/` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/product/${slug}/`,
      type: "website",
      ...(image && { images: [{ url: image, alt: product.name }] }),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  await connectDB();
  const primaryCategory = (product.categories as unknown as { _id: string }[])?.[0];
  const similarProducts = primaryCategory
    ? await Product.find({
        categories:
          primaryCategory._id ?? primaryCategory,
        isActive: true,
        _id: { $ne: product._id },
      })
        .limit(4)
        .select("name slug pricing images metrics")
        .lean()
    : [];

  // Apply active sales
  const activeSales = await getActiveSales();
  const saleInfo = applyActiveSale(product as unknown as Parameters<typeof applyActiveSale>[0], activeSales);

  return (
    <ProductDetail
      product={JSON.parse(JSON.stringify(product))}
      similarProducts={JSON.parse(JSON.stringify(similarProducts))}
      saleInfo={saleInfo}
    />
  );
}
