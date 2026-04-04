/**
 * Generate AI images via OpenRouter (Gemini 2.5 Flash Image)
 * Run: node scripts/generate-ai-images.mjs
 */

import { writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const API_KEY = "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";
const MODEL = "google/gemini-2.5-flash-image";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const images = [
  // Category Icons
  { path: "public/images/categories/icons/birthday.png", prompt: "Create a 3D illustrated icon of colorful birthday balloons and wrapped gift boxes, cute cartoon style, vibrant colors, on pure white background, no text" },
  { path: "public/images/categories/icons/anniversary.png", prompt: "Create a 3D illustrated icon of two champagne glasses clinking with golden sparkles and hearts, cute cartoon style, on pure white background, no text" },
  { path: "public/images/categories/icons/valentines.png", prompt: "Create a 3D illustrated icon of red roses arranged in a heart shape with small love hearts, cute cartoon style, on pure white background, no text" },
  { path: "public/images/categories/icons/wedding.png", prompt: "Create a 3D illustrated icon of white wedding flowers arch with roses, cute cartoon style, elegant, on pure white background, no text" },
  { path: "public/images/categories/icons/sameday.png", prompt: "Create a 3D illustrated icon of a green delivery scooter carrying colorful flowers, cute cartoon style, on pure white background, no text" },
  { path: "public/images/categories/icons/flowers.png", prompt: "Create a 3D illustrated icon of a beautiful red rose bouquet with green leaves, cute cartoon style, on pure white background, no text" },
  { path: "public/images/categories/icons/cakes.png", prompt: "Create a 3D illustrated icon of a decorated chocolate birthday cake with cream and a candle, cute cartoon style, on pure white background, no text" },
  { path: "public/images/categories/icons/plants.png", prompt: "Create a 3D illustrated icon of a small green potted indoor plant in a terracotta pot, cute cartoon style, on pure white background, no text" },

  // Flower Photos
  { path: "public/images/flowers/roses.jpg", prompt: "Professional product photo of a beautiful bouquet of fresh red roses wrapped in light pink paper with ribbon, warm beige studio background, soft diffused lighting, high quality product photography" },
  { path: "public/images/flowers/carnations.jpg", prompt: "Professional product photo of a bouquet of pink and white carnations arranged elegantly in a clear glass vase, warm beige studio background, soft lighting, high quality product photography" },
  { path: "public/images/flowers/orchids.jpg", prompt: "Professional product photo of blue and purple orchids bouquet with green tropical leaves, warm beige studio background, soft lighting, high quality product photography" },
  { path: "public/images/flowers/sunflowers.jpg", prompt: "Professional product photo of bright yellow sunflower bouquet wrapped in brown kraft paper tied with twine, warm beige studio background, soft lighting, high quality product photography" },
  { path: "public/images/flowers/gerberas.jpg", prompt: "Professional product photo of colorful mixed gerbera daisies bouquet in a sleek black flower box, warm beige studio background, soft lighting, high quality product photography" },
  { path: "public/images/flowers/luxe.jpg", prompt: "Professional product photo of a premium luxury purple and blue hydrangea arrangement in a tall clear glass vase, warm beige studio background, soft lighting, high quality product photography" },

  // Birthday Section Icons
  { path: "public/images/birthday-section/flowers.png", prompt: "Create a cute 3D cartoon illustration of a small colorful flower bouquet with a birthday ribbon, warm cream pastel background with torn paper edge effect at bottom, no text" },
  { path: "public/images/birthday-section/cakes.png", prompt: "Create a cute 3D cartoon illustration of a decorated birthday cake with orange icing and candles, warm cream pastel background with torn paper edge effect at bottom, no text" },
  { path: "public/images/birthday-section/personalised.png", prompt: "Create a cute 3D cartoon illustration of a personalized photo mug with a red ribbon bow, warm cream pastel background with torn paper edge effect at bottom, no text" },
  { path: "public/images/birthday-section/plants.png", prompt: "Create a cute 3D cartoon illustration of a small green plant in a yellow pot with a happy birthday tag, warm cream pastel background with torn paper edge effect at bottom, no text" },
  { path: "public/images/birthday-section/gift-sets.png", prompt: "Create a cute 3D cartoon illustration of a gift hamper box with flowers chocolates and ribbon, warm cream pastel background with torn paper edge effect at bottom, no text" },
  { path: "public/images/birthday-section/hampers.png", prompt: "Create a cute 3D cartoon illustration of a wicker gift basket with fruits flowers and wine, warm cream pastel background with torn paper edge effect at bottom, no text" },
  { path: "public/images/birthday-section/balloons.png", prompt: "Create a cute 3D cartoon illustration of a colorful balloon arch decoration in gold black and pink, warm cream pastel background with torn paper edge effect at bottom, no text" },
  { path: "public/images/birthday-section/bestsellers.png", prompt: "Create a cute 3D cartoon illustration of a bestseller gift tag with a gold star on a wrapped present box, warm cream pastel background with torn paper edge effect at bottom, no text" },
  { path: "public/images/birthday-section/banner.png", prompt: "Create a vibrant birthday celebration scene with 3D colorful balloons in pink blue yellow and red, wrapped gift boxes in pastel colors stacked together, party bunting flags, on warm cream and yellow gradient background, festive and joyful, no text" },
];

async function generateImage(item) {
  if (existsSync(item.path)) {
    console.log(`  SKIP: ${item.path}`);
    return true;
  }

  process.stdout.write(`  Generating: ${item.path}...`);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: item.prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.log(` FAIL (${response.status})`);
      return false;
    }

    const data = await response.json();
    const imgs = data.choices?.[0]?.message?.images;

    if (!imgs || imgs.length === 0) {
      console.log(` FAIL (no images in response)`);
      return false;
    }

    const url = imgs[0].image_url?.url;
    if (!url || !url.startsWith("data:")) {
      console.log(` FAIL (unexpected URL format)`);
      return false;
    }

    const b64 = url.split(",", 2)[1];
    const buffer = Buffer.from(b64, "base64");

    const dir = dirname(item.path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(item.path, buffer);

    console.log(` OK (${(buffer.length / 1024).toFixed(0)}KB)`);
    return true;
  } catch (err) {
    console.log(` FAIL: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log("=== AI Image Generation via OpenRouter ===");
  console.log(`Model: ${MODEL}\n`);

  const toGenerate = images.filter(i => !existsSync(i.path));
  console.log(`Total: ${images.length} | Already exist: ${images.length - toGenerate.length} | To generate: ${toGenerate.length}\n`);

  let ok = 0, fail = 0;
  for (const img of images) {
    const result = await generateImage(img);
    if (result) ok++; else fail++;
    // Rate limit
    if (!existsSync(img.path)) await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n=== Done! OK: ${ok} | Failed: ${fail} ===`);
}

main().catch(err => { console.error(err); process.exit(1); });
