/**
 * Ensures storefront category docs exist so legacy URLs return CategoryPage instead of 404.
 *
 * Run from repo root after loading MONGO_URI (e.g. `node --env-file=.env.local`):
 *   npm run seed:legacy-categories
 *
 * Notes:
 * - Slug is globally unique; `/photo-cake/` and `/cakes/photo-cake/` cannot both exist as categories.
 *   Production already resolves `/photo-cake/`; `/cakes/photo-cake/` is handled via redirect in next.config.ts.
 */

import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import Category from "../src/models/Category";

type NestedDef = {
  parentSlug: string;
  parentName: string;
  childSlug: string;
  childName: string;
};

const NESTED: NestedDef[] = [
  {
    parentSlug: "combos-gifts",
    parentName: "Combos & Gifts",
    childSlug: "flowers-cakes",
    childName: "Flowers & Cakes",
  },
  {
    parentSlug: "combos-gifts",
    parentName: "Combos & Gifts",
    childSlug: "flowers-chocolates",
    childName: "Flowers & Chocolates",
  },
  {
    parentSlug: "combos-gifts",
    parentName: "Combos & Gifts",
    childSlug: "personalized-gifts",
    childName: "Personalized Gifts",
  },
  {
    parentSlug: "combos-gifts",
    parentName: "Combos & Gifts",
    childSlug: "flowers-teddy",
    childName: "Flowers & Teddy",
  },
  {
    parentSlug: "flowers",
    parentName: "Flowers",
    childSlug: "garlands",
    childName: "Garlands",
  },
  {
    parentSlug: "occasions",
    parentName: "Occasions",
    childSlug: "womens-day",
    childName: "Women's Day",
  },
  {
    parentSlug: "occasions",
    parentName: "Occasions",
    childSlug: "fathers-day",
    childName: "Father's Day",
  },
  {
    parentSlug: "occasions",
    parentName: "Occasions",
    childSlug: "parents-day",
    childName: "Parents' Day",
  },
  {
    parentSlug: "occasions",
    parentName: "Occasions",
    childSlug: "mens-day",
    childName: "Men's Day",
  },
  {
    parentSlug: "occasions",
    parentName: "Occasions",
    childSlug: "friendship-day",
    childName: "Friendship Day",
  },
  {
    parentSlug: "occasions",
    parentName: "Occasions",
    childSlug: "diwali",
    childName: "Diwali",
  },
  {
    parentSlug: "occasions",
    parentName: "Occasions",
    childSlug: "holi",
    childName: "Holi",
  },
];

async function ensureParent(slug: string, name: string) {
  const existing = await Category.findOne({ slug });
  if (existing) return existing;

  console.log(`Create parent "${name}" (${slug})`);
  return Category.create({
    name,
    slug,
    parent: null,
    isActive: true,
    order: 999,
    productCount: 0,
  });
}

async function ensureChild(
  parentId: mongoose.Types.ObjectId,
  parentSlug: string,
  childSlug: string,
  childName: string
) {
  const ours = await Category.findOne({
    slug: childSlug,
    parent: parentId,
  });
  if (ours) {
    console.log(`OK (exists): /${parentSlug}/${childSlug}/`);
    return;
  }

  const collision = await Category.findOne({ slug: childSlug });
  if (collision) {
    console.warn(
      `SKIP ${parentSlug}/${childSlug}: slug "${childSlug}" already exists under another parent (global unique slug).`
    );
    return;
  }

  console.log(`Create child /${parentSlug}/${childSlug}/`);
  await Category.create({
    name: childName,
    slug: childSlug,
    parent: parentId,
    isActive: true,
    order: 0,
    productCount: 0,
  });
}

async function main() {
  await connectDB();

  const seenParents = new Map<string, mongoose.Types.ObjectId>();

  for (const row of NESTED) {
    let parentId = seenParents.get(row.parentSlug);
    if (!parentId) {
      const parentDoc = await ensureParent(row.parentSlug, row.parentName);
      parentId = parentDoc._id as mongoose.Types.ObjectId;
      seenParents.set(row.parentSlug, parentId);
    }

    await ensureChild(parentId, row.parentSlug, row.childSlug, row.childName);
  }

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
