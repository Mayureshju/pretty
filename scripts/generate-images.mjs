/**
 * Generate missing images using OpenRouter API (DALL-E 3)
 * Run: node scripts/generate-images.mjs
 */

import { writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const API_KEY = "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";

const images = [
  // Occasions
  { path: "public/images/occasions/valentines.jpg", prompt: "A beautiful Valentine's day bouquet of red roses arranged in a heart shape, romantic and elegant, studio product photography on clean white background, high quality" },
  { path: "public/images/occasions/wedding.jpg", prompt: "Elegant white wedding flower arrangement with white roses and baby's breath, bridal bouquet style, studio product photography on clean white background, high quality" },
  { path: "public/images/occasions/get-well.jpg", prompt: "Cheerful get well soon flower bouquet with yellow sunflowers and daisies, bright and uplifting, studio product photography on clean white background, high quality" },
  { path: "public/images/occasions/housewarming.jpg", prompt: "Beautiful housewarming gift indoor green plant in a decorative ceramic pot, modern style, studio product photography on clean white background, high quality" },
  { path: "public/images/occasions/congratulations.jpg", prompt: "Vibrant congratulations celebration flower bouquet with colorful mixed flowers, festive and joyful, studio product photography on clean white background, high quality" },
  { path: "public/images/occasions/corporate.jpg", prompt: "Elegant corporate flower arrangement in a sleek vase, professional and sophisticated white and green flowers, studio product photography on clean white background, high quality" },

  // Products
  { path: "public/images/products/flower-box.jpg", prompt: "Premium luxury flower box with red and pink roses arranged beautifully inside a round hat box, studio product photography on clean white background, high quality" },
  { path: "public/images/products/birthday-flowers.jpg", prompt: "Colorful birthday celebration flower bouquet with mixed flowers in pink yellow and purple wrapping, studio product photography on clean white background, high quality" },
  { path: "public/images/products/wedding-flowers.jpg", prompt: "White and cream wedding flowers elegant cascade bouquet with peonies and roses, studio product photography on clean white background, high quality" },
  { path: "public/images/products/corporate-gifts.jpg", prompt: "Corporate gift hamper with flowers chocolates and premium items in elegant packaging, studio product photography on clean white background, high quality" },
  { path: "public/images/products/premium-plants.jpg", prompt: "Premium monstera deliciosa indoor plant in a modern white ceramic pot, lush green leaves, studio product photography on clean white background, high quality" },
  { path: "public/images/products/butterscotch-cake.jpg", prompt: "Delicious butterscotch cake with caramel drizzle and cream decoration on a cake stand, studio product photography on clean white background, high quality" },
  { path: "public/images/products/red-velvet-cake.jpg", prompt: "Beautiful red velvet cake with smooth cream cheese frosting and red velvet crumbs on top, studio product photography on clean white background, high quality" },
  { path: "public/images/products/fruit-cake.jpg", prompt: "Fresh fruit cake topped with strawberries kiwi and blueberries with whipped cream, studio product photography on clean white background, high quality" },
  { path: "public/images/products/designer-cake.jpg", prompt: "Artistic designer birthday cake with colorful fondant decoration and happy birthday topper, studio product photography on clean white background, high quality" },
  { path: "public/images/products/photo-gifts.jpg", prompt: "Personalized wooden photo frame with family photos as a gift item, studio product photography on clean white background, high quality" },
  { path: "public/images/products/soft-toys.jpg", prompt: "Cute brown teddy bear plush toy with a red bow tie, soft and cuddly gift item, studio product photography on clean white background, high quality" },
  { path: "public/images/products/chocolates.jpg", prompt: "Premium chocolate gift box with assorted truffles and pralines in elegant gold packaging, studio product photography on clean white background, high quality" },
  { path: "public/images/products/mugs.jpg", prompt: "Personalized white ceramic coffee mug with a heartfelt message printed on it, studio product photography on clean white background, high quality" },
  { path: "public/images/products/cushions.jpg", prompt: "Decorative personalized cushion pillow with floral print pattern as a gift, studio product photography on clean white background, high quality" },
  { path: "public/images/products/placeholder.jpg", prompt: "Minimal light gray placeholder image with a simple flower outline icon in the center, clean and modern, 400x400" },
];

async function generateImage(item) {
  if (existsSync(item.path)) {
    console.log(`  SKIP (exists): ${item.path}`);
    return true;
  }

  console.log(`  Generating: ${item.path}`);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/dall-e-3",
        prompt: item.prompt,
        n: 1,
        size: "1024x1024",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.log(`  ERROR (${response.status}): ${err.substring(0, 200)}`);
      return false;
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      console.log(`  ERROR: No image URL in response`);
      console.log(`  Response: ${JSON.stringify(data).substring(0, 300)}`);
      return false;
    }

    // Download image
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) {
      console.log(`  ERROR downloading image: ${imgResponse.status}`);
      return false;
    }

    const buffer = Buffer.from(await imgResponse.arrayBuffer());

    // Ensure directory exists
    const dir = dirname(item.path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    writeFileSync(item.path, buffer);
    console.log(`  DONE: ${item.path} (${(buffer.length / 1024).toFixed(0)}KB)`);
    return true;
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log("==========================================");
  console.log("  Image Generation via OpenRouter/DALL-E 3");
  console.log("==========================================\n");

  const existing = images.filter(i => existsSync(i.path)).length;
  const missing = images.filter(i => !existsSync(i.path)).length;
  console.log(`Total: ${images.length} | Existing: ${existing} | To generate: ${missing}\n`);

  let success = 0;
  let failed = 0;

  for (const item of images) {
    const result = await generateImage(item);
    if (result) success++;
    else failed++;

    // Small delay between API calls to avoid rate limiting
    if (!existsSync(item.path)) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n==========================================`);
  console.log(`  Done! Success: ${success} | Failed: ${failed}`);
  console.log(`==========================================\n`);
}

main().catch(err => {
  console.error("Script failed:", err);
  process.exit(1);
});
