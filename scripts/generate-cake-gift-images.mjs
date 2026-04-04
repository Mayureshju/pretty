/**
 * Generate cake and gift images via OpenRouter
 * Run: node scripts/generate-cake-gift-images.mjs
 */
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const API_KEY = "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";

const images = [
  // Cakes - FNP style product photography on warm beige bg
  { path: "public/images/cakes/chocolate.jpg", prompt: "Professional product photograph of a rich dark chocolate ganache cake on a gold cake stand with a cake server beside it, warm beige studio background, soft studio lighting, high quality bakery product photography" },
  { path: "public/images/cakes/butterscotch.jpg", prompt: "Professional product photograph of a beautiful butterscotch cake with caramel drizzle and butterscotch crumbles on top on a gold cake stand with a cake server, warm beige studio background, soft studio lighting, high quality bakery product photography" },
  { path: "public/images/cakes/luxe.jpg", prompt: "Professional product photograph of a premium luxurious chocolate truffle cake with gold leaf decoration on a dark maroon/burgundy velvet background, dramatic studio lighting, high quality premium bakery product photography" },
  { path: "public/images/cakes/fresh-fruits.jpg", prompt: "Professional product photograph of a fresh fruit cake topped with strawberries kiwi blueberries and glazed fruits on a gold cake stand with a cake server, warm beige studio background, soft studio lighting, high quality bakery product photography" },
  { path: "public/images/cakes/cakes-with-flowers.jpg", prompt: "Professional product photograph of a beautiful chocolate cake placed next to a bouquet of red roses wrapped in black paper, warm beige studio background, soft studio lighting, high quality product photography showing cake and flowers together" },

  // Gifts - FNP style on warm beige bg
  { path: "public/images/gifts/photo-gifts.jpg", prompt: "Professional product photograph of personalized wooden photo frames with family photos displayed on a wooden table, warm beige studio background, soft studio lighting, high quality gift product photography" },
  { path: "public/images/gifts/soft-toys.jpg", prompt: "Professional product photograph of a cute large brown teddy bear plush toy with a red bow tie sitting upright, warm beige studio background, soft studio lighting, high quality gift product photography" },
  { path: "public/images/gifts/chocolates.jpg", prompt: "Professional product photograph of an open premium chocolate gift box showing assorted truffles and pralines in gold wrapping, warm beige studio background, soft studio lighting, high quality gift product photography" },
  { path: "public/images/gifts/mugs.jpg", prompt: "Professional product photograph of a personalized white ceramic coffee mug with a beautiful custom design and steam rising, warm beige studio background, soft studio lighting, high quality gift product photography" },
  { path: "public/images/gifts/cushions.jpg", prompt: "Professional product photograph of a decorative personalized cushion with a floral embroidery pattern on a cozy setting, warm beige studio background, soft studio lighting, high quality gift product photography" },
];

async function generateImage(item) {
  if (existsSync(item.path)) { console.log(`  SKIP: ${item.path}`); return true; }
  process.stdout.write(`  Generating: ${item.path}...`);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: item.prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) { console.log(` FAIL (${res.status})`); return false; }
    const data = await res.json();
    const imgs = data.choices?.[0]?.message?.images;
    if (!imgs?.length) { console.log(` FAIL (no images)`); return false; }
    const url = imgs[0].image_url?.url;
    if (!url?.startsWith("data:")) { console.log(` FAIL (bad url)`); return false; }
    const b64 = url.split(",", 2)[1];
    const buffer = Buffer.from(b64, "base64");
    const dir = dirname(item.path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(item.path, buffer);
    console.log(` OK (${(buffer.length / 1024).toFixed(0)}KB)`);
    return true;
  } catch (err) { console.log(` FAIL: ${err.message}`); return false; }
}

async function main() {
  console.log("Generating cake & gift images...\n");
  let ok = 0, fail = 0;
  for (const img of images) {
    const r = await generateImage(img);
    if (r) ok++; else fail++;
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log(`\nDone! OK: ${ok} | Failed: ${fail}`);
}

main().catch(err => { console.error(err); process.exit(1); });
