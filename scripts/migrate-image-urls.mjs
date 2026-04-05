/**
 * Migrate product image URLs from old WordPress domains to S3.
 *
 * Transforms:
 *   https://www.prettypetals.com/wp-content/uploads/... -> https://pretty-petals-web.s3.eu-central-1.amazonaws.com/uploads/...
 *   http(s)://floristaindia.com/wp-content/uploads/...  -> https://pretty-petals-web.s3.eu-central-1.amazonaws.com/uploads/...
 *
 * Usage:
 *   node scripts/migrate-image-urls.mjs --dry-run   (preview changes)
 *   node scripts/migrate-image-urls.mjs              (apply changes)
 */

import mongoose from "mongoose";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://mayuresh:IoDL89RcuajN2AKz@complianceone.obgaz.mongodb.net/new-test-db?retryWrites=true&w=majority";

const S3_BASE = "https://pretty-petals-web.s3.eu-central-1.amazonaws.com";

const OLD_PREFIXES = [
  "https://www.prettypetals.com/wp-content",
  "https://prettypetals.com/wp-content",
  "http://www.prettypetals.com/wp-content",
  "http://prettypetals.com/wp-content",
  "https://floristaindia.com/wp-content",
  "http://floristaindia.com/wp-content",
  "https://www.floristaindia.com/wp-content",
  "http://www.floristaindia.com/wp-content",
];

function migrateUrl(url) {
  if (!url || typeof url !== "string") return url;

  for (const prefix of OLD_PREFIXES) {
    if (url.startsWith(prefix)) {
      // Strip prefix, keep everything from /uploads/... onward
      return S3_BASE + url.slice(prefix.length);
    }
  }
  return url;
}

const dryRun = process.argv.includes("--dry-run");

async function main() {
  console.log(`Mode: ${dryRun ? "DRY RUN (no changes)" : "LIVE"}\n`);
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected!\n");

  const db = mongoose.connection.db;
  const products = db.collection("products");
  const allProducts = await products.find({}).toArray();

  console.log(`Total products: ${allProducts.length}\n`);

  let productsUpdated = 0;
  let imageUrlsMigrated = 0;
  let variantUrlsMigrated = 0;
  let addonUrlsMigrated = 0;

  for (const product of allProducts) {
    let changed = false;
    const updates = {};

    // Migrate images[].url
    if (product.images && product.images.length > 0) {
      const newImages = product.images.map((img) => {
        const newUrl = migrateUrl(img.url);
        if (newUrl !== img.url) {
          changed = true;
          imageUrlsMigrated++;
          if (dryRun) {
            console.log(`  [image] ${img.url}`);
            console.log(`       -> ${newUrl}`);
          }
          return { ...img, url: newUrl };
        }
        return img;
      });
      if (changed) updates.images = newImages;
    }

    // Migrate variants[].image
    if (product.variants && product.variants.length > 0) {
      let variantsChanged = false;
      const newVariants = product.variants.map((v) => {
        if (v.image) {
          const newUrl = migrateUrl(v.image);
          if (newUrl !== v.image) {
            changed = true;
            variantsChanged = true;
            variantUrlsMigrated++;
            if (dryRun) {
              console.log(`  [variant] ${v.image}`);
              console.log(`         -> ${newUrl}`);
            }
            return { ...v, image: newUrl };
          }
        }
        return v;
      });
      if (variantsChanged) updates.variants = newVariants;
    }

    // Migrate addons[].image
    if (product.addons && product.addons.length > 0) {
      let addonsChanged = false;
      const newAddons = product.addons.map((a) => {
        if (a.image) {
          const newUrl = migrateUrl(a.image);
          if (newUrl !== a.image) {
            changed = true;
            addonsChanged = true;
            addonUrlsMigrated++;
            if (dryRun) {
              console.log(`  [addon] ${a.image}`);
              console.log(`       -> ${newUrl}`);
            }
            return { ...a, image: newUrl };
          }
        }
        return a;
      });
      if (addonsChanged) updates.addons = newAddons;
    }

    if (changed) {
      if (dryRun) {
        console.log(`  Product: "${product.name}" (${product._id})\n`);
      } else {
        await products.updateOne({ _id: product._id }, { $set: updates });
      }
      productsUpdated++;
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Products scanned:  ${allProducts.length}`);
  console.log(`Products updated:  ${productsUpdated}`);
  console.log(`Image URLs:        ${imageUrlsMigrated}`);
  console.log(`Variant URLs:      ${variantUrlsMigrated}`);
  console.log(`Addon URLs:        ${addonUrlsMigrated}`);
  console.log(
    `Total URLs:        ${imageUrlsMigrated + variantUrlsMigrated + addonUrlsMigrated}`
  );

  if (dryRun) {
    console.log("\n(Dry run — no changes were made)");
  }

  // Verification: show a few migrated product image URLs
  if (!dryRun && productsUpdated > 0) {
    console.log("\n--- Verification (first 3 updated products) ---");
    const sample = await products
      .find({ "images.url": { $regex: "^https://pretty-petals-web" } })
      .limit(3)
      .toArray();
    for (const p of sample) {
      console.log(`\n${p.name}:`);
      for (const img of p.images || []) {
        console.log(`  ${img.url}`);
      }
    }
  }

  await mongoose.disconnect();
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
