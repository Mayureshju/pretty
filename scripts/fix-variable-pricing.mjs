/**
 * Migration: Fix variable product pricing
 *
 * For variable products, sets pricing.regularPrice and pricing.currentPrice
 * from the lowest-priced variant instead of the last variant.
 *
 * Usage: node scripts/fix-variable-pricing.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
try {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
} catch {}

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI not set in .env.local");
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
console.log("Connected to MongoDB");

const Product = mongoose.connection.collection("products");

const variableProducts = await Product.find({
  type: "variable",
  "variants.0": { $exists: true },
}).toArray();

console.log(`Found ${variableProducts.length} variable products`);

let updated = 0;
for (const product of variableProducts) {
  // Filter out variants with no valid price
  const validVariants = product.variants.filter((v) => v.price > 0);
  if (validVariants.length === 0) {
    console.log(`  SKIPPED ${product.name}: no variants with price > 0`);
    continue;
  }

  const getEffective = (v) => (v.salePrice && v.salePrice > 0 ? v.salePrice : v.price);
  const lowestVariant = validVariants.reduce((min, v) =>
    getEffective(v) < getEffective(min) ? v : min
  );

  const newRegularPrice = lowestVariant.price;
  const newSalePrice = lowestVariant.salePrice > 0 ? lowestVariant.salePrice : null;
  const newCurrentPrice = getEffective(lowestVariant);

  const oldCurrentPrice = product.pricing?.currentPrice;

  if (oldCurrentPrice !== newCurrentPrice) {
    await Product.updateOne(
      { _id: product._id },
      {
        $set: {
          "pricing.regularPrice": newRegularPrice,
          "pricing.salePrice": newSalePrice,
          "pricing.currentPrice": newCurrentPrice,
        },
      }
    );
    updated++;
    console.log(
      `  ${product.name}: ₹${oldCurrentPrice} → ₹${newCurrentPrice}`
    );
  }
}

console.log(`\nDone. Updated ${updated} of ${variableProducts.length} variable products.`);
await mongoose.disconnect();
