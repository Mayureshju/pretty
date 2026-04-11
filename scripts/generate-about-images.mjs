/**
 * Generate images for the About Us page using OpenRouter image generation API.
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-about-images.mjs
 */

import fs from "fs";
import path from "path";

const API_KEY = process.env.NEXT_PUBLIC_OPENROUTER;
const OUTPUT_DIR = path.resolve("public/images/about");

if (!API_KEY) {
  console.error("NEXT_PUBLIC_OPENROUTER env var is required");
  process.exit(1);
}

const images = [
  {
    name: "hero",
    prompt:
      "A stunning premium floral arrangement with red roses, white lilies, and green foliage in a gold vase on a draped cream silk cloth. Warm studio lighting, editorial photography style, shallow depth of field, moody dark textured background. No text, no watermarks.",
  },
  {
    name: "story",
    prompt:
      "A professional Indian female florist in a bright modern flower shop in Mumbai, hand-crafting a beautiful bouquet with pink roses and greenery. Natural daylight, warm tones, shallow depth of field, editorial lifestyle photography. No text, no watermarks.",
  },
  {
    name: "delivering-emotions",
    prompt:
      "A happy young Indian woman receiving a beautiful bouquet of colorful flowers at her doorstep in Mumbai. Warm golden hour lighting, genuine joy on her face, modern Indian home entrance. Lifestyle photography, warm tones. No text, no watermarks.",
  },
  {
    name: "vision",
    prompt:
      "A vibrant close-up of a woman holding a large bouquet of fresh yellow sunflowers and white daisies outdoors with lush green garden background. Bright natural daylight, joyful mood, editorial fashion photography style. No text, no watermarks.",
  },
  {
    name: "mission",
    prompt:
      "A young Indian couple smiling while looking at a beautiful flower arrangement and cake gift box together in a modern living room. Warm, romantic lighting, pastel pink and white tones, lifestyle photography. No text, no watermarks.",
  },
  {
    name: "rooted-in-love",
    prompt:
      "A wide shot of a happy Indian family of three sitting on a sofa, the woman is unwrapping a gift with flowers on the table, warm festive Indian home interior with plants. Warm ambient lighting, cinematic wide-angle shot, lifestyle photography. No text, no watermarks.",
  },
  {
    name: "custom-designs",
    prompt:
      "Hands of a florist arranging an artistic custom bouquet with exotic flowers — proteas, orchids, and eucalyptus leaves on a rustic wooden workbench. Top-down angle, soft natural light, artisanal craft photography. No text, no watermarks.",
  },
  {
    name: "delivery",
    prompt:
      "A delivery person in a branded polo shirt handing over a beautiful wrapped flower bouquet to a smiling young Indian woman at her apartment door. Modern Mumbai building corridor, bright daylight, candid lifestyle photography. No text, no watermarks.",
  },
];

async function generateImage(item) {
  console.log(`Generating: ${item.name}...`);

  const response = await fetch(
    "https://openrouter.ai/api/v1/images/generations",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/dall-e-3",
        prompt: item.prompt,
        n: 1,
        size: "1792x1024",
        quality: "hd",
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error(`  Failed (${response.status}): ${err}`);
    return false;
  }

  const data = await response.json();
  const imageUrl = data.data?.[0]?.url;

  if (!imageUrl) {
    console.error(`  No image URL in response:`, JSON.stringify(data));
    return false;
  }

  // Download the image
  const imgResponse = await fetch(imageUrl);
  if (!imgResponse.ok) {
    console.error(`  Failed to download image`);
    return false;
  }

  const buffer = Buffer.from(await imgResponse.arrayBuffer());
  const filePath = path.join(OUTPUT_DIR, `${item.name}.png`);
  fs.writeFileSync(filePath, buffer);
  console.log(`  Saved: ${filePath} (${(buffer.length / 1024).toFixed(0)} KB)`);
  return true;
}

async function main() {
  console.log(`\nGenerating ${images.length} images for About Us page\n`);

  let success = 0;
  let failed = 0;

  for (const item of images) {
    const ok = await generateImage(item);
    if (ok) success++;
    else failed++;
  }

  console.log(`\nDone: ${success} generated, ${failed} failed\n`);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
