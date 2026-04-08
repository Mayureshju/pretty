/**
 * Fix product image URLs to use the LARGEST WordPress-generated version on S3.
 *
 * The WooCommerce originals are small (e.g. 21.png at 255x300), but WordPress
 * generated larger versions (e.g. 21-630x741.png, 21-650x800.png) that exist
 * on S3. This script finds the largest available version and updates MongoDB.
 *
 * Usage:
 *   node scripts/fix-image-urls-to-originals.mjs --dry-run   (preview)
 *   node scripts/fix-image-urls-to-originals.mjs              (apply)
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import {
  S3Client,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

function loadEnv() {
  const envPath = resolve(__dirname, "..", ".env.local");
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env.local not found
  }
}

loadEnv();

const MONGO_URI = process.env.MONGO_URI;
const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION;
const S3_BASE = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const dryRun = process.argv.includes("--dry-run");

// Cache: original key -> best version key
const bestVersionCache = new Map();

/**
 * Extract S3 key from full URL.
 */
function extractS3Key(url) {
  if (!url || typeof url !== "string") return null;
  const prefix = S3_BASE + "/";
  if (url.startsWith(prefix)) return url.slice(prefix.length);
  return null;
}

/**
 * Given a key like "uploads/2023/02/21.png", find the largest WordPress
 * variant on S3 (e.g. "uploads/2023/02/21-650x800.png").
 *
 * WordPress variants follow the pattern: {name}-{W}x{H}.{ext}
 * We list all objects with the same prefix and pick the one with the
 * largest pixel area (W * H).
 */
async function findLargestVersion(key) {
  if (bestVersionCache.has(key)) return bestVersionCache.get(key);

  // Parse key: "uploads/2023/02/21.png" -> prefix="uploads/2023/02/21", ext=".png"
  const lastDot = key.lastIndexOf(".");
  if (lastDot === -1) { bestVersionCache.set(key, null); return null; }
  const baseName = key.slice(0, lastDot);  // "uploads/2023/02/21"
  const ext = key.slice(lastDot);          // ".png"

  // List all S3 objects with this prefix
  const res = await s3.send(new ListObjectsV2Command({
    Bucket: S3_BUCKET,
    Prefix: baseName,
    MaxKeys: 200,
  }));

  if (!res.Contents || res.Contents.length === 0) {
    bestVersionCache.set(key, null);
    return null;
  }

  // Find WordPress size variants (exclude .webp, match same extension)
  const sizeRegex = new RegExp(
    `^${escapeRegex(baseName)}-(\\d+)x(\\d+)${escapeRegex(ext)}$`
  );

  let bestKey = null;
  let bestArea = 0;
  let bestW = 0;
  let bestH = 0;

  for (const obj of res.Contents) {
    const match = obj.Key.match(sizeRegex);
    if (match) {
      const w = parseInt(match[1], 10);
      const h = parseInt(match[2], 10);
      const area = w * h;
      if (area > bestArea) {
        bestArea = area;
        bestKey = obj.Key;
        bestW = w;
        bestH = h;
      }
    }
  }

  const result = bestKey ? { key: bestKey, width: bestW, height: bestH } : null;
  bestVersionCache.set(key, result);
  return result;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function fixUrl(url) {
  const key = extractS3Key(url);
  if (!key) return null;

  // Only process uploads/ paths (WordPress images)
  if (!key.startsWith("uploads/")) return null;

  const best = await findLargestVersion(key);
  if (!best) return null;

  // Only upgrade if the best version is different from current
  if (best.key === key) return null;

  return {
    newUrl: `${S3_BASE}/${best.key}`,
    newKey: best.key,
    oldKey: key,
    width: best.width,
    height: best.height,
  };
}

async function main() {
  console.log("=== Fix Image URLs to Largest WordPress Version ===");
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}\n`);

  if (!MONGO_URI) { console.error("Error: MONGO_URI not set"); process.exit(1); }
  if (!S3_BUCKET) { console.error("Error: AWS credentials not set"); process.exit(1); }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected!\n");

  const db = mongoose.connection.db;
  const products = db.collection("products");
  const allProducts = await products.find({}).toArray();

  console.log(`Total products: ${allProducts.length}\n`);

  let productsUpdated = 0;
  let imageUrlsFixed = 0;
  let variantUrlsFixed = 0;
  let addonUrlsFixed = 0;
  let noLargerVersion = 0;
  let notWordpress = 0;

  for (const product of allProducts) {
    let changed = false;
    const updates = {};

    // Fix images[].url
    if (product.images && product.images.length > 0) {
      const newImages = [];
      for (const img of product.images) {
        const result = await fixUrl(img.url);
        if (result) {
          changed = true;
          imageUrlsFixed++;
          if (dryRun) {
            console.log(`  [image] ${product.name}`);
            console.log(`    FROM: ${result.oldKey}`);
            console.log(`      TO: ${result.newKey} (${result.width}x${result.height})`);
          }
          newImages.push({ ...img, url: result.newUrl });
        } else {
          const key = extractS3Key(img.url);
          if (key && !key.startsWith("uploads/")) notWordpress++;
          else noLargerVersion++;
          newImages.push(img);
        }
      }
      if (changed) updates.images = newImages;
    }

    // Fix variants[].image
    if (product.variants && product.variants.length > 0) {
      let variantsChanged = false;
      const newVariants = [];
      for (const v of product.variants) {
        if (!v.image) { newVariants.push(v); continue; }
        const result = await fixUrl(v.image);
        if (result) {
          changed = true;
          variantsChanged = true;
          variantUrlsFixed++;
          newVariants.push({ ...v, image: result.newUrl });
        } else {
          newVariants.push(v);
        }
      }
      if (variantsChanged) updates.variants = newVariants;
    }

    // Fix addons[].image
    if (product.addons && product.addons.length > 0) {
      let addonsChanged = false;
      const newAddons = [];
      for (const a of product.addons) {
        if (!a.image) { newAddons.push(a); continue; }
        const result = await fixUrl(a.image);
        if (result) {
          changed = true;
          addonsChanged = true;
          addonUrlsFixed++;
          newAddons.push({ ...a, image: result.newUrl });
        } else {
          newAddons.push(a);
        }
      }
      if (addonsChanged) updates.addons = newAddons;
    }

    if (changed) {
      if (!dryRun) {
        await products.updateOne({ _id: product._id }, { $set: updates });
      }
      productsUpdated++;
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Products scanned:       ${allProducts.length}`);
  console.log(`Products updated:       ${productsUpdated}`);
  console.log(`Image URLs upgraded:    ${imageUrlsFixed}`);
  console.log(`Variant URLs upgraded:  ${variantUrlsFixed}`);
  console.log(`Addon URLs upgraded:    ${addonUrlsFixed}`);
  console.log(`No larger version:      ${noLargerVersion}`);
  console.log(`Non-WordPress (skip):   ${notWordpress}`);
  console.log(`Total URLs upgraded:    ${imageUrlsFixed + variantUrlsFixed + addonUrlsFixed}`);

  if (dryRun) {
    console.log("\n(Dry run — no changes were made)");
  }

  await mongoose.disconnect();
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
