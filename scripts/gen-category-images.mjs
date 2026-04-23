/**
 * Generate the 8 "Explore Our Collections" category images.
 *
 * Pulls real category data from MongoDB, generates a photorealistic product
 * image for each via OpenRouter (Gemini 2.5 Flash Image), saves to
 * public/images/categories/<slug>.png, and writes the path back to the
 * category.image field in the database.
 *
 * Run: node scripts/gen-category-images.mjs
 */

import mongoose from "mongoose";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

// ---------- env ----------
const envText = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
function envVar(name) {
  const m = envText.match(new RegExp(`^${name}=(.+)$`, "m"));
  if (!m) throw new Error(`${name} not found in .env.local`);
  return m[1].trim().replace(/^['"]|['"]$/g, "");
}
const MONGO_URI = envVar("MONGO_URI");
const API_KEY = envVar("NEXT_PUBLIC_OPENROUTER");

const MODEL = "google/gemini-2.5-flash-image";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

// ---------- the 8 featured slugs, ordered as the homepage grid ----------
// Each entry maps a real DB slug → a visual brief for the image.
const FEATURED = [
  {
    slug: "roses",
    visual:
      "A luxurious bouquet of deep red and blush pink roses in full bloom, wrapped in soft cream paper with a silk ribbon, natural daylight, shallow depth of field, florist shop quality.",
  },
  {
    slug: "exotic-flowers",
    visual:
      "An elegant exotic arrangement with orange bird-of-paradise, purple orchids, red anthuriums and tropical foliage in a ceramic vase, warm ambient lighting.",
  },
  {
    slug: "combos-gifts",
    visual:
      "A curated gift hamper on a light wooden table: a small floral bouquet, a wrapped chocolate box with a red ribbon, and a greeting card, soft morning light.",
  },
  {
    slug: "signature",
    visual:
      "A signature floral arrangement in a square hatbox: pastel roses, hydrangeas and eucalyptus leaves neatly tucked into a premium white box, clean studio background.",
  },
  {
    slug: "birthday",
    visual:
      "A cheerful birthday bouquet of mixed pink, yellow and white flowers with a small 'Happy Birthday' ribbon, balloons softly blurred in the background.",
  },
  {
    slug: "wedding",
    visual:
      "An outdoor wedding aisle framed by white and blush floral arches, rose petals along a runner, soft golden-hour lighting, romantic cinematic tone.",
  },
  {
    slug: "corporate",
    visual:
      "An elegant corporate gift setup on a modern desk: a tasteful white-and-green floral arrangement beside a minimalist gift box, warm office lighting.",
  },
  {
    slug: "fruits",
    visual:
      "A lush fresh-fruit gift basket overflowing with apples, oranges, kiwi, grapes, pears and strawberries, wrapped in a transparent cellophane with a ribbon, soft morning light on a light wooden surface.",
  },
];

const STYLE_SUFFIX =
  " Square 1:1 aspect ratio, premium florist product photography, vibrant but natural colors, no text, no watermark, no logos.";

// ---------- OpenRouter call ----------
async function generateImage(name, visual, outPath) {
  const prompt =
    `Create a high-quality photograph for the "${name}" collection of a premium Indian florist. ` +
    visual +
    STYLE_SUFFIX;

  process.stdout.write(`  generating ${name} → ${outPath} ... `);
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      modalities: ["image", "text"],
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.log("FAIL");
    console.error("    " + JSON.stringify(data).slice(0, 400));
    return false;
  }

  const imageUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageUrl) {
    console.log("NO IMAGE");
    console.error("    " + JSON.stringify(data).slice(0, 400));
    return false;
  }

  const base64 = imageUrl.replace(/^data:image\/\w+;base64,/, "");
  const buf = Buffer.from(base64, "base64");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, buf);
  console.log(`ok (${(buf.length / 1024).toFixed(1)} KB)`);
  return true;
}

// ---------- main ----------
async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  const categories = mongoose.connection.db.collection("categories");

  const slugs = FEATURED.map((f) => f.slug);
  const docs = await categories
    .find(
      { slug: { $in: slugs }, isActive: true },
      { projection: { name: 1, slug: 1, description: 1, image: 1 } }
    )
    .toArray();

  const bySlug = new Map(docs.map((d) => [d.slug, d]));
  const missing = slugs.filter((s) => !bySlug.has(s));
  if (missing.length) {
    console.error(`\nMissing slugs in DB: ${missing.join(", ")}`);
    console.error("Aborting so you can fix the mapping first.");
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Found ${docs.length}/${FEATURED.length} categories in DB.\n`);

  const manifest = [];
  let ok = 0;
  for (const item of FEATURED) {
    const cat = bySlug.get(item.slug);
    const outRel = `public/images/categories/${cat.slug}.png`;
    const outAbs = resolve(process.cwd(), outRel);
    console.log(`[${cat.name}]  slug=${cat.slug}  products desc? ${cat.description ? "yes" : "no"}`);

    const visual = cat.description
      ? `${item.visual} Collection note: ${cat.description}`
      : item.visual;

    const success = await generateImage(cat.name, visual, outAbs);
    if (!success) continue;

    const webPath = `/images/categories/${cat.slug}.png`;
    await categories.updateOne({ _id: cat._id }, { $set: { image: webPath } });
    manifest.push({ name: cat.name, slug: cat.slug, image: webPath });
    ok++;
  }

  console.log(`\nGenerated ${ok}/${FEATURED.length} images.`);
  console.log("Updated categories.image field for each generated slug.");
  console.log("\nManifest:");
  console.table(manifest);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
