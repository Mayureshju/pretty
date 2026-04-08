/**
 * AI-upscale product images using Real-ESRGAN (local GPU).
 *
 * Downloads each image from S3, upscales with Real-ESRGAN (4x),
 * then resizes to a max of 1200x1500 via Sharp and re-uploads.
 *
 * Usage:
 *   node scripts/upscale-product-images.mjs --dry-run        (preview)
 *   node scripts/upscale-product-images.mjs --limit 3        (test with 3)
 *   node scripts/upscale-product-images.mjs                  (full run)
 *   node scripts/upscale-product-images.mjs --resume         (resume)
 *
 * Flags:
 *   --dry-run       Preview only, no S3 writes
 *   --limit N       Process only N images
 *   --resume        Skip already-processed images
 *   --scale 2|3|4   Upscale factor (default: 4)
 *   --product SLUG  Process only one product
 *   --no-backup     Skip backup (originals already backed up by enhance script)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { resolve, dirname, basename, extname } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";
import sharp from "sharp";
import mongoose from "mongoose";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ESRGAN_BIN = "/tmp/realesrgan-bin/realesrgan-ncnn-vulkan";
const ESRGAN_MODEL = "realesrgan-x4plus";
const TEMP_DIR = resolve(__dirname, ".upscale-tmp");
const PROGRESS_FILE = resolve(__dirname, ".upscale-progress.json");

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

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MONGO_URI = process.env.MONGO_URI;
const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION;
const S3_BASE = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;
const BACKUP_PREFIX = "backups/pre-upscale/";

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1500;

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
    scale: 4,
    product: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) flags.limit = parseInt(args[i + 1], 10);
    if (args[i] === "--scale" && args[i + 1]) flags.scale = parseInt(args[i + 1], 10);
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
// Real-ESRGAN upscale
// ---------------------------------------------------------------------------

function upscaleWithESRGAN(inputPath, outputPath, scale) {
  execFileSync(ESRGAN_BIN, [
    "-i", inputPath,
    "-o", outputPath,
    "-n", ESRGAN_MODEL,
    "-s", String(scale),
    "-g", "0",           // Use GPU 0
    "-f", "png",         // Output as PNG (lossless intermediate)
  ], { stdio: "pipe", timeout: 120000 });
}

// ---------------------------------------------------------------------------
// Collect all image URLs from products
// ---------------------------------------------------------------------------

function collectImageUrls(products) {
  const seen = new Set();
  const items = [];

  for (const product of products) {
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.url && !seen.has(img.url)) {
          seen.add(img.url);
          items.push({ url: img.url, productName: product.name, field: "images" });
        }
      }
    }
    if (product.variants && product.variants.length > 0) {
      for (const v of product.variants) {
        if (v.image && !seen.has(v.image)) {
          seen.add(v.image);
          items.push({ url: v.image, productName: product.name, field: "variants" });
        }
      }
    }
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
// Process single image
// ---------------------------------------------------------------------------

async function processImage(item, idx, total, flags, progress) {
  const key = extractS3Key(item.url);
  const label = `[${idx}/${total}] ${key}`;

  try {
    if (flags.dryRun) {
      console.log(`  ${label}  (dry run — would upscale)`);
      progress.stats.processed++;
      return;
    }

    // Download from S3
    const inputBuffer = await downloadFromS3(key);
    const inputMeta = await sharp(inputBuffer).metadata();
    const inputW = inputMeta.width;
    const inputH = inputMeta.height;

    // Skip if already large enough
    if (inputW >= MAX_WIDTH && inputH >= MAX_HEIGHT) {
      console.log(`  ${label}  ${inputW}x${inputH} already large enough — SKIP`);
      progress.stats.skipped++;
      progress.processedKeys.push(key);
      return;
    }

    // Write to temp file for Real-ESRGAN
    const ext = extname(key) || ".jpg";
    const inputTmp = resolve(TEMP_DIR, `input${ext}`);
    const outputTmp = resolve(TEMP_DIR, "output.png");
    writeFileSync(inputTmp, inputBuffer);

    // Upscale with Real-ESRGAN
    upscaleWithESRGAN(inputTmp, outputTmp, flags.scale);

    // Read upscaled output and resize to max dimensions + optimize with Sharp
    const upscaledBuffer = readFileSync(outputTmp);
    const isPng = ext.toLowerCase() === ".png";

    let pipeline = sharp(upscaledBuffer)
      .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true });

    let contentType;
    let finalBuffer;
    if (isPng) {
      finalBuffer = await pipeline.png({ quality: 85 }).toBuffer();
      contentType = "image/png";
    } else {
      finalBuffer = await pipeline.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
      contentType = "image/jpeg";
    }

    const finalMeta = await sharp(finalBuffer).metadata();

    // Backup
    if (!flags.noBackup) {
      await backupOriginal(key);
    }

    // Upload
    await uploadToS3(key, finalBuffer, contentType);

    // Cleanup temp files
    try { unlinkSync(inputTmp); } catch {}
    try { unlinkSync(outputTmp); } catch {}

    const sizeIn = (inputBuffer.length / 1024).toFixed(0);
    const sizeOut = (finalBuffer.length / 1024).toFixed(0);
    console.log(`  ${label}  ${inputW}x${inputH} -> ${finalMeta.width}x${finalMeta.height}  ${sizeIn}KB -> ${sizeOut}KB  OK`);

    progress.processedKeys.push(key);
    progress.stats.processed++;
  } catch (err) {
    const msg = err.message || String(err);
    console.log(`  ${label}  FAIL: ${msg.slice(0, 150)}`);
    progress.failedKeys.push(key);
    progress.stats.failed++;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const flags = parseArgs();

  // Validate
  if (!existsSync(ESRGAN_BIN)) {
    console.error(`Error: Real-ESRGAN binary not found at ${ESRGAN_BIN}`);
    console.error("Run: cd /tmp && wget https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-ubuntu.zip -O realesrgan.zip && unzip realesrgan.zip -d realesrgan-bin && chmod +x realesrgan-bin/realesrgan-ncnn-vulkan");
    process.exit(1);
  }
  if (!MONGO_URI) { console.error("Error: MONGO_URI not set"); process.exit(1); }
  if (!S3_BUCKET || !AWS_REGION) { console.error("Error: AWS credentials not set"); process.exit(1); }

  // Create temp dir
  if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true });

  console.log("=== Pretty Petals Image Upscaling (Real-ESRGAN) ===");
  console.log(`Mode: ${flags.dryRun ? "DRY RUN" : "LIVE"} | Scale: ${flags.scale}x | Backup: ${flags.noBackup ? "OFF" : "ON"}`);
  console.log(`Max output: ${MAX_WIDTH}x${MAX_HEIGHT} | GPU: NVIDIA RTX 3050`);
  if (flags.limit) console.log(`Limit: ${flags.limit} images`);
  if (flags.product) console.log(`Product filter: ${flags.product}`);
  console.log();

  // Connect to MongoDB
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected!");

  const db = mongoose.connection.db;
  const productsCol = db.collection("products");

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
  console.log(`Found ${imageItems.length} unique images`);

  // Filter to S3 only
  const s3Items = imageItems.filter((item) => extractS3Key(item.url) !== null);
  const skippedExternal = imageItems.length - s3Items.length;
  if (skippedExternal > 0) console.log(`Skipping ${skippedExternal} non-S3 URLs`);
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

  console.log(`\nProcessing ${imageItems.length} images (sequentially — GPU bound)...\n`);

  // Process one at a time (GPU can only handle one image at a time)
  for (let i = 0; i < imageItems.length; i++) {
    await processImage(imageItems[i], i + 1, imageItems.length, flags, progress);
    if (!flags.dryRun && (i + 1) % 10 === 0) saveProgress(progress);
  }

  // Final save
  if (!flags.dryRun) saveProgress(progress);

  // Summary
  console.log("\n--- Summary ---");
  console.log(`Total images:    ${imageItems.length}`);
  console.log(`Upscaled:        ${progress.stats.processed}`);
  console.log(`Skipped (large): ${progress.stats.skipped}`);
  console.log(`Failed:          ${progress.stats.failed}`);
  if (!flags.noBackup && !flags.dryRun) {
    console.log(`Backups:         s3://${S3_BUCKET}/${BACKUP_PREFIX}`);
  }
  if (!flags.dryRun) {
    console.log(`Progress:        ${PROGRESS_FILE}`);
  }
  if (flags.dryRun) {
    console.log("\n(Dry run — no changes were made)");
  }

  // Cleanup temp dir
  try { unlinkSync(resolve(TEMP_DIR, "input.jpg")); } catch {}
  try { unlinkSync(resolve(TEMP_DIR, "output.png")); } catch {}

  await mongoose.disconnect();
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Upscaling failed:", err);
  process.exit(1);
});
