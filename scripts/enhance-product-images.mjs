/**
 * Bulk-enhance product images stored on S3.
 *
 * Downloads each image, applies sharpening / contrast / quality improvements
 * via Sharp, backs up the original, and re-uploads the enhanced version
 * to the same S3 key (no MongoDB URL changes needed).
 *
 * Usage:
 *   node scripts/enhance-product-images.mjs --dry-run        (preview changes)
 *   node scripts/enhance-product-images.mjs --limit 3        (test with 3 images)
 *   node scripts/enhance-product-images.mjs                  (full run)
 *   node scripts/enhance-product-images.mjs --resume         (resume after interruption)
 *
 * Flags:
 *   --dry-run       Preview only, no S3 writes
 *   --limit N       Process only N images
 *   --resume        Skip already-processed images
 *   --concurrency N Parallel S3 operations (default: 3)
 *   --no-backup     Skip backing up originals
 *   --product SLUG  Process only one product by slug
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import mongoose from "mongoose";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
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
    // .env.local not found, rely on existing env vars
  }
}

loadEnv();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MONGO_URI = process.env.MONGO_URI;
const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION;
const S3_BASE = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;
const BACKUP_PREFIX = "backups/originals/";
const PROGRESS_FILE = resolve(__dirname, ".enhance-progress.json");

const SHARP_CONFIG = {
  resize: { width: 1200, height: 1500, fit: "inside", withoutEnlargement: true },
  modulate: { brightness: 1.02, saturation: 1.08 },
  sharpen: { sigma: 1.0, m1: 1.0, m2: 0.5 },
  jpeg: { quality: 85, mozjpeg: true },
};

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------


function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {
    dryRun: args.includes("--dry-run"),
    resume: args.includes("--resume"),
    noBackup: args.includes("--no-backup"),
    limit: null,
    concurrency: 3,
    product: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) flags.limit = parseInt(args[i + 1], 10);
    if (args[i] === "--concurrency" && args[i + 1]) flags.concurrency = parseInt(args[i + 1], 10);
    if (args[i] === "--product" && args[i + 1]) flags.product = args[i + 1];
  }

  return flags;
}

// ---------------------------------------------------------------------------
// S3 helpers
// ---------------------------------------------------------------------------

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function extractS3Key(url) {
  if (!url || typeof url !== "string") return null;
  const prefix = S3_BASE + "/";
  if (url.startsWith(prefix)) return url.slice(prefix.length);
  return null;
}

async function downloadFromS3(key) {
  const res = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function uploadToS3(key, buffer, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

async function backupOriginal(key) {
  await s3.send(
    new CopyObjectCommand({
      Bucket: S3_BUCKET,
      CopySource: `${S3_BUCKET}/${key}`,
      Key: BACKUP_PREFIX + key,
    })
  );
}

// ---------------------------------------------------------------------------
// Progress tracking
// ---------------------------------------------------------------------------

function loadProgress() {
  if (!existsSync(PROGRESS_FILE)) {
    return { processedKeys: [], failedKeys: [], stats: { processed: 0, failed: 0, skipped: 0 } };
  }
  try {
    return JSON.parse(readFileSync(PROGRESS_FILE, "utf-8"));
  } catch {
    return { processedKeys: [], failedKeys: [], stats: { processed: 0, failed: 0, skipped: 0 } };
  }
}

function saveProgress(progress) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ---------------------------------------------------------------------------
// Image enhancement
// ---------------------------------------------------------------------------

async function enhanceImage(inputBuffer) {
  const meta = await sharp(inputBuffer).metadata();
  const isJpeg = meta.format === "jpeg" || meta.format === "jpg";
  const isPng = meta.format === "png";

  let pipeline = sharp(inputBuffer)
    .rotate() // Auto-rotate from EXIF
    .resize(SHARP_CONFIG.resize)
    .normalize() // Auto-stretch contrast
    .modulate(SHARP_CONFIG.modulate)
    .sharpen(SHARP_CONFIG.sharpen);

  let contentType;
  if (isPng) {
    pipeline = pipeline.png({ quality: 85 });
    contentType = "image/png";
  } else {
    pipeline = pipeline.jpeg(SHARP_CONFIG.jpeg);
    contentType = "image/jpeg";
  }

  const outputBuffer = await pipeline.toBuffer();

  return {
    buffer: outputBuffer,
    contentType,
    inputSize: inputBuffer.length,
    outputSize: outputBuffer.length,
    width: meta.width,
    height: meta.height,
    format: meta.format,
  };
}

// ---------------------------------------------------------------------------
// Collect all image URLs from products
// ---------------------------------------------------------------------------

function collectImageUrls(products) {
  const seen = new Set();
  const items = [];

  for (const product of products) {
    // Main images
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.url && !seen.has(img.url)) {
          seen.add(img.url);
          items.push({ url: img.url, productName: product.name, field: "images" });
        }
      }
    }

    // Variant images
    if (product.variants && product.variants.length > 0) {
      for (const v of product.variants) {
        if (v.image && !seen.has(v.image)) {
          seen.add(v.image);
          items.push({ url: v.image, productName: product.name, field: "variants" });
        }
      }
    }

    // Addon images
    if (product.addons && product.addons.length > 0) {
      for (const a of product.addons) {
        if (a.image && !seen.has(a.image)) {
          seen.add(a.image);
          items.push({ url: a.image, productName: product.name, field: "addons" });
        }
      }
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Process a batch with concurrency control
// ---------------------------------------------------------------------------

async function processBatch(items, fn, concurrency) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const flags = parseArgs();

  // Validate required env vars
  if (!MONGO_URI) {
    console.error("Error: MONGO_URI not set. Check .env.local");
    process.exit(1);
  }
  if (!S3_BUCKET || !AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("Error: AWS credentials not set. Check .env.local");
    process.exit(1);
  }

  console.log("=== Pretty Petals Image Enhancement ===");
  console.log(`Mode: ${flags.dryRun ? "DRY RUN" : "LIVE"} | Concurrency: ${flags.concurrency} | Backup: ${flags.noBackup ? "OFF" : "ON"}`);
  if (flags.limit) console.log(`Limit: ${flags.limit} images`);
  if (flags.product) console.log(`Product filter: ${flags.product}`);
  console.log();

  // Connect to MongoDB
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected!");

  const db = mongoose.connection.db;
  const productsCol = db.collection("products");

  // Fetch products
  const query = flags.product ? { slug: flags.product } : {};
  const allProducts = await productsCol.find(query).toArray();
  console.log(`Found ${allProducts.length} products.\n`);

  if (allProducts.length === 0) {
    console.log("No products found. Exiting.");
    await mongoose.disconnect();
    return;
  }

  // Collect unique image URLs
  console.log("Collecting image URLs...");
  let imageItems = collectImageUrls(allProducts);

  const fromImages = imageItems.filter((i) => i.field === "images").length;
  const fromVariants = imageItems.filter((i) => i.field === "variants").length;
  const fromAddons = imageItems.filter((i) => i.field === "addons").length;
  console.log(`Found ${imageItems.length} unique images (${fromImages} product, ${fromVariants} variant, ${fromAddons} addon)`);

  // Filter out non-S3 URLs
  const s3Items = imageItems.filter((item) => extractS3Key(item.url) !== null);
  const skippedExternal = imageItems.length - s3Items.length;
  if (skippedExternal > 0) {
    console.log(`Skipping ${skippedExternal} non-S3 URLs`);
  }
  imageItems = s3Items;

  // Resume support
  let progress = loadProgress();
  if (flags.resume) {
    const processedSet = new Set(progress.processedKeys);
    const before = imageItems.length;
    imageItems = imageItems.filter((item) => !processedSet.has(extractS3Key(item.url)));
    console.log(`Resuming: skipping ${before - imageItems.length} already-processed images`);
  } else {
    progress = { processedKeys: [], failedKeys: [], stats: { processed: 0, failed: 0, skipped: 0 } };
  }

  // Apply limit
  if (flags.limit && imageItems.length > flags.limit) {
    imageItems = imageItems.slice(0, flags.limit);
    console.log(`Limited to ${flags.limit} images`);
  }

  console.log(`\nProcessing ${imageItems.length} images...\n`);

  let totalSavedBytes = 0;
  let idx = 0;

  const processItem = async (item) => {
    const num = ++idx;
    const key = extractS3Key(item.url);
    const label = `[${num}/${imageItems.length}] ${key}`;

    try {
      if (flags.dryRun) {
        console.log(`  ${label}  (dry run — would enhance)`);
        progress.stats.processed++;
        return;
      }

      // Download
      const inputBuffer = await downloadFromS3(key);

      // Enhance
      const result = await enhanceImage(inputBuffer);
      const sizeDiff = result.inputSize - result.outputSize;
      const pctChange = ((sizeDiff / result.inputSize) * 100).toFixed(0);
      totalSavedBytes += sizeDiff;

      // Backup original
      if (!flags.noBackup) {
        await backupOriginal(key);
      }

      // Upload enhanced
      await uploadToS3(key, result.buffer, result.contentType);

      const sizeStr = `${(result.inputSize / 1024).toFixed(0)}KB -> ${(result.outputSize / 1024).toFixed(0)}KB`;
      console.log(`  ${label}  ${sizeStr}  (${result.width}x${result.height}, ${pctChange >= 0 ? "-" : "+"}${Math.abs(pctChange)}%) OK`);

      progress.processedKeys.push(key);
      progress.stats.processed++;
    } catch (err) {
      const code = err.Code || err.name || "Unknown";
      console.log(`  ${label}  FAIL: ${code} - ${err.message}`);
      progress.failedKeys.push(key);
      progress.stats.failed++;
    }
  };

  // Process with concurrency control
  for (let i = 0; i < imageItems.length; i += flags.concurrency) {
    const batch = imageItems.slice(i, i + flags.concurrency);
    await Promise.allSettled(batch.map(processItem));
    // Save progress after each batch
    if (!flags.dryRun) saveProgress(progress);
  }

  // Final summary
  console.log("\n--- Summary ---");
  console.log(`Total images:    ${imageItems.length}`);
  console.log(`Enhanced:        ${progress.stats.processed}`);
  console.log(`Failed:          ${progress.stats.failed}`);
  if (!flags.dryRun && totalSavedBytes !== 0) {
    const savedMB = (Math.abs(totalSavedBytes) / (1024 * 1024)).toFixed(1);
    console.log(`Size change:     ${totalSavedBytes > 0 ? "-" : "+"}${savedMB}MB total`);
  }
  if (!flags.noBackup && !flags.dryRun) {
    console.log(`Originals:       s3://${S3_BUCKET}/${BACKUP_PREFIX}`);
  }
  if (!flags.dryRun) {
    saveProgress(progress);
    console.log(`Progress:        ${PROGRESS_FILE}`);
  }

  if (flags.dryRun) {
    console.log("\n(Dry run — no changes were made)");
  }

  await mongoose.disconnect();
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Enhancement failed:", err);
  process.exit(1);
});
