/**
 * Quick migration: Convert product.category (single ObjectId) to product.categories (array)
 * Run: node scripts/migrate-category-to-categories.mjs
 */

import mongoose from "mongoose";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://mayuresh:IoDL89RcuajN2AKz@complianceone.obgaz.mongodb.net/new-test-db?retryWrites=true&w=majority";

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected!\n");

  const db = mongoose.connection.db;
  const products = db.collection("products");

  // Find all products that have old `category` field but no `categories` field
  const toMigrate = await products
    .find({
      category: { $exists: true, $ne: null },
      $or: [
        { categories: { $exists: false } },
        { categories: { $size: 0 } },
      ],
    })
    .toArray();

  console.log(`Found ${toMigrate.length} products to migrate`);

  if (toMigrate.length === 0) {
    // Also check products that have category but categories is missing
    const withOldField = await products.countDocuments({
      category: { $exists: true },
    });
    console.log(`Products with old 'category' field: ${withOldField}`);

    if (withOldField === 0) {
      console.log("Nothing to migrate. All products are up to date.");
      await mongoose.disconnect();
      return;
    }
  }

  let migrated = 0;
  for (const product of toMigrate) {
    await products.updateOne(
      { _id: product._id },
      {
        $set: { categories: [product.category] },
        $unset: { category: "" },
      }
    );
    migrated++;
  }

  // Also set categories to empty array for products without any category
  const noCategory = await products.updateMany(
    {
      category: { $exists: false },
      categories: { $exists: false },
    },
    { $set: { categories: [] } }
  );

  // Clean up old `category` field from remaining products
  const cleanup = await products.updateMany(
    { category: { $exists: true } },
    {
      $set: { categories: [] },
      $unset: { category: "" },
    }
  );

  // Set default order for products that don't have it
  await products.updateMany(
    { order: { $exists: false } },
    { $set: { order: 0 } }
  );

  console.log(`Migrated ${migrated} products (category -> categories)`);
  console.log(`Set empty categories on ${noCategory.modifiedCount} products`);
  console.log(`Cleaned up old field on ${cleanup.modifiedCount} products`);
  console.log(`Set default order on remaining products`);

  await mongoose.disconnect();
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
