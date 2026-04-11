/**
 * Generate 5 hero banners with separate desktop & mobile images.
 * Uses OpenRouter (gpt-5-image-mini), uploads to AWS S3, saves to MongoDB.
 *
 * Recommended sizes for future admin uploads:
 *   Desktop: 1440 x 520 px  (aspect ~2.77:1)
 *   Mobile:  768 x 480 px   (aspect ~1.6:1)
 *   Format:  JPEG or WebP, max 2MB
 *
 * Run: node scripts/generate-banners.mjs
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import mongoose from "mongoose";

// Load .env.local
try {
  const envPath = resolve(process.cwd(), ".env.local");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* ignore */ }

const OPENROUTER_KEY = process.env.NEXT_PUBLIC_OPENROUTER;
const MONGO_URI = process.env.MONGO_URI;
const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME;

if (!OPENROUTER_KEY || !MONGO_URI || !S3_BUCKET) {
  console.error("Missing env vars");
  process.exit(1);
}

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
});

function getS3Url(key) {
  return `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}

const bannerConfigs = [
  {
    title: "Fresh Blooms\nDelivered Daily",
    subtitle: "Handcrafted With Love",
    link: "/flowers/",
    desktopPrompt: "A wide panoramic landscape photograph of a luxurious arrangement of fresh pink roses, white lilies and red orchids spread across a cream marble countertop, soft warm morning light from the left side, shallow depth of field, clean minimalist background, premium florist commercial photography, the flowers take up the lower two-thirds with breathing room above, no text no watermark, photorealistic, 4k",
    mobilePrompt: "A tall portrait photograph of a beautiful bouquet of pink roses, white lilies and red orchids in a glass vase centered in frame, soft warm golden lighting, cream colored background, flowers fill the center with space at top and bottom for text overlay, premium commercial florist photography, no text no watermark, photorealistic, 4k",
  },
  {
    title: "Birthday\nSurprises",
    subtitle: "Celebrate Every Moment",
    link: "/birthday/",
    desktopPrompt: "A wide panoramic landscape photograph of a colorful birthday celebration scene with vibrant flower bouquet of gerberas and roses in center, small gift boxes and confetti scattered around, pastel pink background, the arrangement spans horizontally across the frame, festive and joyful mood, premium commercial photography, no text no watermark, photorealistic, 4k",
    mobilePrompt: "A tall portrait photograph of a cheerful birthday flower bouquet with colorful gerberas, roses and carnations wrapped in craft paper, held by hands against a pastel pink background, gift box below, celebratory festive mood, flowers centered vertically, premium photography, no text no watermark, photorealistic, 4k",
  },
  {
    title: "Curated\nGift Hampers",
    subtitle: "The Perfect Gift",
    link: "/hampers/same-day-delivery/",
    desktopPrompt: "A wide panoramic landscape photograph of an elegant gift hamper basket with chocolates, a small flower bouquet, wine bottle, dried fruits and treats arranged beautifully on a rustic wooden table, soft bokeh background with warm fairy lights, the hamper spans the full width, luxury gifting photography, no text no watermark, photorealistic, 4k",
    mobilePrompt: "A tall portrait photograph of a premium gift hamper basket with chocolates, flowers and treats arranged vertically, satin ribbon bow on top, placed on rustic wooden surface, warm soft lighting with bokeh, centered composition, luxury product photography, no text no watermark, photorealistic, 4k",
  },
  {
    title: "Artisan\nCakes",
    subtitle: "Baked Fresh Daily",
    link: "/cakes/",
    desktopPrompt: "A wide panoramic landscape photograph of three different beautiful cakes on white cake stands - a chocolate drip cake, a berry fruit cake, and a red velvet cake - arranged in a horizontal row on a marble counter, scattered fresh berries and rose petals, professional bakery photography with soft natural light, no text no watermark, photorealistic, 4k",
    mobilePrompt: "A tall portrait photograph of a single beautifully decorated chocolate layer cake with fresh strawberries and edible flowers on top, placed on a white cake stand, a few rose petals scattered on the table, soft natural lighting from above, professional bakery photography, centered composition, no text no watermark, photorealistic, 4k",
  },
  {
    title: "Living\nGreens",
    subtitle: "Breathe Life Into Spaces",
    link: "/plants/",
    desktopPrompt: "A wide panoramic landscape photograph of a collection of beautiful indoor plants including a large monstera, fiddle leaf fig, peace lily and succulent arrangement in minimalist white and terracotta ceramic pots, arranged horizontally on a modern wooden shelf, natural sunlight streaming through a window, fresh green tones, interior magazine style, no text no watermark, photorealistic, 4k",
    mobilePrompt: "A tall portrait photograph of a beautiful monstera plant in a minimalist white ceramic pot, placed on a modern side table near a sunlit window, other small plants in background with soft bokeh, fresh green and warm tones, interior design magazine style, centered vertical composition, no text no watermark, photorealistic, 4k",
  },
];

async function generateImage(prompt) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-5-image-mini",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error: ${response.status} - ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;
  const images = message?.images || [];

  if (images.length > 0) {
    const url = images[0]?.image_url?.url || images[0]?.url;
    if (url?.startsWith("data:")) return { b64: url.split(",")[1] };
    if (url) return url;
  }

  throw new Error(`No image in response. Keys: ${Object.keys(message || {}).join(",")}`);
}

async function downloadImage(urlOrB64) {
  if (typeof urlOrB64 === "object" && urlOrB64.b64) {
    return Buffer.from(urlOrB64.b64, "base64");
  }
  const res = await fetch(urlOrB64);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadToS3(buffer, key) {
  await s3.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: buffer, ContentType: "image/png" }));
  return getS3Url(key);
}

async function main() {
  console.log("=== Pretty Petals Banner Generator (Desktop + Mobile) ===\n");
  console.log("Recommended sizes for admin uploads:");
  console.log("  Desktop: 1440 x 520 px");
  console.log("  Mobile:  768 x 480 px\n");

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.\n");

  const BannerSchema = new mongoose.Schema({
    title: String, subtitle: String, image: String, mobileImage: String,
    link: String, position: { type: String, default: "hero" },
    order: { type: Number, default: 0 }, isActive: { type: Boolean, default: true },
    startDate: Date, endDate: Date,
  }, { timestamps: true });
  const Banner = mongoose.models.Banner || mongoose.model("Banner", BannerSchema);

  // Delete existing hero banners
  const deleted = await Banner.deleteMany({ position: "hero" });
  console.log(`Deleted ${deleted.deletedCount} existing hero banners.\n`);

  const results = [];
  const ts = Date.now();

  for (let i = 0; i < bannerConfigs.length; i++) {
    const config = bannerConfigs[i];
    const label = config.title.replace("\n", " ");
    console.log(`[${i + 1}/5] "${label}"`);

    try {
      // Generate desktop image
      console.log("  Generating desktop image...");
      const desktopResult = await generateImage(config.desktopPrompt);
      const desktopBuffer = await downloadImage(desktopResult);
      const desktopKey = `banners/desktop-${i + 1}-${ts}.png`;
      const desktopUrl = await uploadToS3(desktopBuffer, desktopKey);
      console.log(`  Desktop: ${(desktopBuffer.length / 1024).toFixed(0)} KB -> ${desktopUrl}`);

      // Pause between API calls
      await new Promise((r) => setTimeout(r, 3000));

      // Generate mobile image
      console.log("  Generating mobile image...");
      const mobileResult = await generateImage(config.mobilePrompt);
      const mobileBuffer = await downloadImage(mobileResult);
      const mobileKey = `banners/mobile-${i + 1}-${ts}.png`;
      const mobileUrl = await uploadToS3(mobileBuffer, mobileKey);
      console.log(`  Mobile:  ${(mobileBuffer.length / 1024).toFixed(0)} KB -> ${mobileUrl}`);

      // Save to MongoDB
      const banner = await Banner.create({
        title: config.title,
        subtitle: config.subtitle,
        image: desktopUrl,
        mobileImage: mobileUrl,
        link: config.link,
        position: "hero",
        order: i,
        isActive: true,
      });

      results.push({ title: label, desktop: desktopUrl, mobile: mobileUrl, id: String(banner._id) });
      console.log(`  Saved to DB: ${banner._id}\n`);
    } catch (err) {
      console.error(`  FAILED: ${err.message}\n`);
    }

    if (i < bannerConfigs.length - 1) await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\n=== Summary ===");
  console.log(`Generated: ${results.length}/5 banners\n`);
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.title}`);
    console.log(`   Desktop: ${r.desktop}`);
    console.log(`   Mobile:  ${r.mobile}`);
    console.log(`   DB ID:   ${r.id}\n`);
  });

  await mongoose.disconnect();
  console.log("Done!");
}

main().catch((err) => { console.error(err); process.exit(1); });
