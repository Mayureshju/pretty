/**
 * Re-compress OVERSIZED images already stored on S3.
 *
 * Lists objects under an S3 prefix, and for any object larger than a size
 * threshold (or larger than the max edge), downloads it, re-compresses with
 * Sharp (resize fit:inside, no enlargement -> never distorts), backs up the
 * original under backups/originals/, and re-uploads to the SAME key so no
 * MongoDB URL changes are needed. The ContentType header is updated so browsers
 * and the Next.js image optimizer read the new (webp) bytes correctly even if
 * the key keeps its old extension.
 *
 * Usage:
 *   node scripts/recompress-s3-images.mjs --dry-run
 *   node scripts/recompress-s3-images.mjs --max-kb 300 --limit 20
 *   node scripts/recompress-s3-images.mjs                       (full run)
 *
 * Flags:
 *   --dry-run        Preview only, no S3 writes
 *   --max-kb N       Only touch objects larger than N KB (default: 300)
 *   --max-edge N     Longest edge after resize (default: 1600)
 *   --quality N      webp quality (default: 80)
 *   --prefix P       S3 prefix to scan (default: products/)
 *   --limit N        Process at most N oversized objects
 *   --concurrency N  Parallel operations (default: 3)
 *   --no-backup      Skip backing up originals
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
      let val = trimmed.slice(eqIdx + 1).trim();
      // Strip matching surrounding quotes (e.g. AWS_REGION="eu-central-1").
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // rely on existing env
  }
}

loadEnv();

const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION;
const BACKUP_PREFIX = "backups/originals/";

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {
    dryRun: args.includes("--dry-run"),
    noBackup: args.includes("--no-backup"),
    maxKb: 300,
    maxEdge: 1600,
    quality: 80,
    prefix: "products/",
    limit: null,
    concurrency: 3,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--max-kb" && args[i + 1]) flags.maxKb = parseInt(args[i + 1], 10);
    if (args[i] === "--max-edge" && args[i + 1]) flags.maxEdge = parseInt(args[i + 1], 10);
    if (args[i] === "--quality" && args[i + 1]) flags.quality = parseInt(args[i + 1], 10);
    if (args[i] === "--prefix" && args[i + 1]) flags.prefix = args[i + 1];
    if (args[i] === "--limit" && args[i + 1]) flags.limit = parseInt(args[i + 1], 10);
    if (args[i] === "--concurrency" && args[i + 1]) flags.concurrency = parseInt(args[i + 1], 10);
  }
  return flags;
}

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function listAll(prefix) {
  const out = [];
  let token;
  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: prefix,
        ContinuationToken: token,
      })
    );
    for (const o of res.Contents || []) out.push(o);
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return out;
}

async function download(key) {
  const res = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function upload(key, buffer, contentType) {
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

async function backup(key) {
  await s3.send(
    new CopyObjectCommand({
      Bucket: S3_BUCKET,
      CopySource: `${S3_BUCKET}/${encodeURIComponent(key)}`,
      Key: BACKUP_PREFIX + key,
    })
  );
}

const SKIP_EXT = [".svg", ".gif"];

async function main() {
  const flags = parseArgs();

  if (!S3_BUCKET || !AWS_REGION || !process.env.AWS_ACCESS_KEY_ID) {
    console.error("Error: AWS credentials/bucket not set. Check .env.local");
    process.exit(1);
  }

  console.log("=== Pretty Petals S3 Re-compress (oversized only) ===");
  console.log(
    `Mode: ${flags.dryRun ? "DRY RUN" : "LIVE"} | prefix=${flags.prefix} | >${flags.maxKb}KB | maxEdge=${flags.maxEdge} | q=${flags.quality} | backup=${flags.noBackup ? "OFF" : "ON"}`
  );

  const all = await listAll(flags.prefix);
  const thresholdBytes = flags.maxKb * 1024;

  let candidates = all.filter(
    (o) =>
      o.Size > thresholdBytes &&
      !o.Key.startsWith(BACKUP_PREFIX) &&
      !SKIP_EXT.some((e) => o.Key.toLowerCase().endsWith(e))
  );

  console.log(
    `Scanned ${all.length} objects, ${candidates.length} exceed ${flags.maxKb}KB.\n`
  );

  if (flags.limit && candidates.length > flags.limit) {
    candidates = candidates.slice(0, flags.limit);
    console.log(`Limited to ${flags.limit} objects.\n`);
  }

  let idx = 0;
  let savedBytes = 0;
  let processed = 0;
  let failed = 0;

  const processOne = async (obj) => {
    const num = ++idx;
    const key = obj.Key;
    const label = `[${num}/${candidates.length}] ${key}`;
    try {
      if (flags.dryRun) {
        console.log(`  ${label}  ${(obj.Size / 1024).toFixed(0)}KB (would recompress)`);
        processed++;
        return;
      }

      const input = await download(key);
      const output = await sharp(input)
        .rotate()
        .resize({
          width: flags.maxEdge,
          height: flags.maxEdge,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: flags.quality })
        .toBuffer();

      // Only rewrite if we actually saved meaningful space.
      if (output.length >= input.length * 0.95) {
        console.log(
          `  ${label}  ${(input.length / 1024).toFixed(0)}KB -> ${(output.length / 1024).toFixed(0)}KB (no gain, skipped)`
        );
        return;
      }

      if (!flags.noBackup) await backup(key);
      await upload(key, output, "image/webp");

      savedBytes += input.length - output.length;
      processed++;
      const pct = (((input.length - output.length) / input.length) * 100).toFixed(0);
      console.log(
        `  ${label}  ${(input.length / 1024).toFixed(0)}KB -> ${(output.length / 1024).toFixed(0)}KB (-${pct}%) OK`
      );
    } catch (err) {
      failed++;
      console.log(`  ${label}  FAIL: ${err.name || "Error"} - ${err.message}`);
    }
  };

  for (let i = 0; i < candidates.length; i += flags.concurrency) {
    const batch = candidates.slice(i, i + flags.concurrency);
    await Promise.allSettled(batch.map(processOne));
  }

  console.log("\n--- Summary ---");
  console.log(`Candidates: ${candidates.length}`);
  console.log(`Processed:  ${processed}`);
  console.log(`Failed:     ${failed}`);
  if (!flags.dryRun && savedBytes > 0) {
    console.log(`Saved:      ${(savedBytes / (1024 * 1024)).toFixed(1)}MB`);
    if (!flags.noBackup) console.log(`Originals:  s3://${S3_BUCKET}/${BACKUP_PREFIX}`);
  }
  if (flags.dryRun) console.log("\n(Dry run — no changes were made)");
  console.log("Done!");
}

main().catch((err) => {
  console.error("Recompress failed:", err);
  process.exit(1);
});
