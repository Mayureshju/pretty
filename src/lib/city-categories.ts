import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { getCategoryPath } from "@/lib/slug-resolver";

/**
 * Category chips shown in the sticky strip on the city landing pages.
 *
 * Only the slug is authored here. The label, the product count, and above all
 * the href are resolved from the DB, so a chip can never drift into a 404 the
 * way the previously hardcoded hrefs did: if a category is re-parented the path
 * follows it, and if it is deactivated or deleted the chip drops out entirely.
 */
const CHIP_SLUGS = ["flowers", "birthday", "anniversary", "fruits", "corporate"];

type LeanChipCategory = {
  _id: unknown;
  name: string;
  slug: string;
  parent?: { slug: string } | null;
};

export interface CityCategoryChip {
  name: string;
  count: number;
  href: string;
}

export async function getCityCategoryChips(): Promise<CityCategoryChip[]> {
  await connectDB();

  const categories = (await Category.find({ slug: { $in: CHIP_SLUGS }, isActive: true })
    .select("name slug parent")
    .populate("parent", "slug")
    .lean()) as unknown as LeanChipCategory[];

  const chips = await Promise.all(
    categories.map(async (category) => ({
      slug: category.slug,
      name: category.name,
      // Direct members only — mirrors the total the destination CategoryPage reports.
      count: await Product.countDocuments({ categories: category._id, isActive: true }),
      href: getCategoryPath(category),
    }))
  );

  // Mongo returns these unordered; restore the authored chip order.
  return CHIP_SLUGS.flatMap((slug) => {
    const chip = chips.find((c) => c.slug === slug);
    return chip ? [{ name: chip.name, count: chip.count, href: chip.href }] : [];
  });
}
