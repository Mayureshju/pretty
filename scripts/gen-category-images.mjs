/**
 * Generate updated category icons via OpenRouter (Gemini 2.5 Flash Image).
 * Matches the existing birthday-section icon style so they blend with neighbors.
 * Run: node scripts/gen-category-images.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";

// Load NEXT_PUBLIC_OPENROUTER from .env.local
const envPath = resolve(process.cwd(), ".env.local");
const envText = readFileSync(envPath, "utf8");
const match = envText.match(/^NEXT_PUBLIC_OPENROUTER=(.+)$/m);
if (!match) throw new Error("NEXT_PUBLIC_OPENROUTER not found in .env.local");
const API_KEY = match[1].trim().replace(/^['"]|['"]$/g, "");

const MODEL = "google/gemini-2.5-flash-image";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const images = [
  {
    path: "public/images/birthday-section/popular.png",
    prompt:
      "Create a cute 3D cartoon illustration of a premium pink and red rose bouquet with a gold 'popular' ribbon or golden star badge, warm cream pastel background with torn paper edge effect at bottom, no text",
  },
  {
    path: "public/images/birthday-section/exotic-flowers.png",
    prompt:
      "Create a cute 3D cartoon illustration of an exotic tropical flower arrangement with orange bird-of-paradise, purple orchids and red anthurium with lush green leaves, warm cream pastel background with torn paper edge effect at bottom, no text",
  },
  {
    path: "public/images/birthday-section/featured-flowers.png",
    prompt:
      "Create a cute 3D cartoon illustration of a featured signature bouquet of mixed pink and white roses with lilies tied with a silk ribbon, a small gold 'featured' ribbon accent, warm cream pastel background with torn paper edge effect at bottom, no text",
  },
];

async function generateImage(item) {
  process.stdout.write(`Generating ${item.path}...`);
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      modalities: ["image", "text"],
      messages: [{ role: "user", content: item.prompt }],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.log(" FAIL");
    console.error(JSON.stringify(data).slice(0, 500));
    return false;
  }

  const imageUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageUrl) {
    console.log(" NO IMAGE");
    console.error(JSON.stringify(data).slice(0, 500));
    return false;
  }

  const base64 = imageUrl.replace(/^data:image\/\w+;base64,/, "");
  const buf = Buffer.from(base64, "base64");
  mkdirSync(dirname(item.path), { recursive: true });
  writeFileSync(item.path, buf);
  console.log(` OK (${buf.length} bytes)`);
  return true;
}

let ok = 0;
for (const img of images) {
  if (await generateImage(img)) ok++;
}
console.log(`\n${ok}/${images.length} generated`);
