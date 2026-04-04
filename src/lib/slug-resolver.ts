import { connectDB } from "@/lib/db";
import Product, { IProduct } from "@/models/Product";
import Category, { ICategory } from "@/models/Category";
import Blog, { IBlog } from "@/models/Blog";

export type SlugResult =
  | { type: "product"; data: IProduct }
  | { type: "category"; data: ICategory }
  | { type: "blog"; data: IBlog }
  | null;

/**
 * Resolve a single-segment slug to a product, category, or blog.
 * Priority: Product > Category > Blog
 */
export async function resolveSlug(slug: string): Promise<SlugResult> {
  await connectDB();

  const [product, category, blog] = await Promise.all([
    Product.findOne({ slug, isActive: true })
      .populate({
        path: "categories",
        select: "name slug parent",
        populate: { path: "parent", select: "name slug" },
      })
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

/**
 * Resolve a two-segment path like /flowers/roses/ to a child category.
 * Looks up parent by parentSlug, then finds child under that parent.
 */
export async function resolveNestedCategory(
  parentSlug: string,
  childSlug: string
): Promise<ICategory | null> {
  await connectDB();

  const parent = await Category.findOne({
    slug: parentSlug,
    isActive: true,
  }).lean<ICategory>();

  if (!parent) return null;

  const child = await Category.findOne({
    slug: childSlug,
    parent: parent._id,
    isActive: true,
  })
    .populate("parent", "name slug")
    .lean<ICategory>();

  return child;
}

/**
 * Build the full URL path for a category, accounting for parent nesting.
 * - No parent: /signature/
 * - Has parent: /flowers/roses/
 */
export function getCategoryPath(category: {
  slug: string;
  parent?: { slug: string } | null;
}): string {
  if (category.parent && typeof category.parent === "object" && category.parent.slug) {
    return `/${category.parent.slug}/${category.slug}/`;
  }
  return `/${category.slug}/`;
}
