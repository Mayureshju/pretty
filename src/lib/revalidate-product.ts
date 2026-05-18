import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import { getCategoryPath } from "@/lib/slug-resolver";

/** Next.js revalidatePath expects no trailing slash. */
function pathForRevalidate(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

async function revalidateCategoriesByIds(categoryIds: string[]) {
  if (categoryIds.length === 0) return;

  await connectDB();
  const categories = await Category.find({ _id: { $in: categoryIds } })
    .populate("parent", "slug")
    .select("slug parent")
    .lean<{ slug: string; parent?: { slug: string } | null }[]>();

  for (const cat of categories) {
    revalidatePath(pathForRevalidate(getCategoryPath(cat)));
  }
}

/**
 * Invalidate storefront caches after a product is created, updated, or deleted.
 * Covers the product detail page, homepage, search/offers, sitemap, and category listings.
 */
export async function revalidateProductSurfaces(options: {
  slug: string;
  oldSlug?: string;
  categoryIds?: string[];
}) {
  const { slug, oldSlug, categoryIds = [] } = options;

  revalidatePath(pathForRevalidate(`/product/${slug}`));
  if (oldSlug && oldSlug !== slug) {
    revalidatePath(pathForRevalidate(`/product/${oldSlug}`));
  }

  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/offers");
  revalidatePath("/sitemap.xml");

  await revalidateCategoriesByIds(categoryIds);
}
