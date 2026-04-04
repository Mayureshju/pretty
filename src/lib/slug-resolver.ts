import { connectDB } from "@/lib/db";
import Product, { IProduct } from "@/models/Product";
import Category, { ICategory } from "@/models/Category";
import Blog, { IBlog } from "@/models/Blog";

export type SlugResult =
  | { type: "product"; data: IProduct }
  | { type: "category"; data: ICategory }
  | { type: "blog"; data: IBlog }
  | null;

export async function resolveSlug(slug: string): Promise<SlugResult> {
  await connectDB();

  const [product, category, blog] = await Promise.all([
    Product.findOne({ slug, isActive: true })
      .populate("category", "name slug")
      .lean<IProduct>(),
    Category.findOne({ slug, isActive: true })
      .populate("parent", "name slug")
      .lean<ICategory>(),
    Blog.findOne({ slug, isPublished: true }).lean<IBlog>(),
  ]);

  if (product) return { type: "product", data: product };
  if (category) return { type: "category", data: category };
  if (blog) return { type: "blog", data: blog };
  return null;
}
