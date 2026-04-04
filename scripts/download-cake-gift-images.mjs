/**
 * Download high-quality cake and gift images from Unsplash
 * Curated to match FNP's warm beige product photography style
 */
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const images = [
  // Cakes — warm backgrounds
  { path: "public/images/cakes/chocolate.jpg", url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=1000&fit=crop&crop=center&q=85" },
  { path: "public/images/cakes/butterscotch.jpg", url: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800&h=1000&fit=crop&crop=center&q=85" },
  { path: "public/images/cakes/luxe.jpg", url: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800&h=1000&fit=crop&crop=center&q=85" },
  { path: "public/images/cakes/fresh-fruits.jpg", url: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=1000&fit=crop&crop=center&q=85" },
  { path: "public/images/cakes/cakes-with-flowers.jpg", url: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=800&h=1000&fit=crop&crop=center&q=85" },
  // Gifts — warm backgrounds
  { path: "public/images/gifts/photo-gifts.jpg", url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&h=1000&fit=crop&crop=center&q=85" },
  { path: "public/images/gifts/soft-toys.jpg", url: "https://images.unsplash.com/photo-1562040506-a9b32cb51b94?w=800&h=1000&fit=crop&crop=center&q=85" },
  { path: "public/images/gifts/chocolates.jpg", url: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&h=1000&fit=crop&crop=center&q=85" },
  { path: "public/images/gifts/mugs.jpg", url: "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=800&h=1000&fit=crop&crop=center&q=85" },
  { path: "public/images/gifts/cushions.jpg", url: "https://images.unsplash.com/photo-1584100936595-c0c8e4beff37?w=800&h=1000&fit=crop&crop=center&q=85" },
];

async function download(item) {
  if (existsSync(item.path)) { console.log(`  SKIP: ${item.path}`); return true; }
  try {
    const res = await fetch(item.url, { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" });
    if (!res.ok) { console.log(`  FAIL (${res.status}): ${item.path}`); return false; }
    const buf = Buffer.from(await res.arrayBuffer());
    const dir = dirname(item.path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(item.path, buf);
    console.log(`  OK: ${item.path} (${(buf.length / 1024).toFixed(0)}KB)`);
    return true;
  } catch (e) { console.log(`  FAIL: ${item.path} — ${e.message}`); return false; }
}

async function main() {
  console.log("Downloading cake & gift images...\n");
  let ok = 0, fail = 0;
  for (const img of images) { if (await download(img)) ok++; else fail++; }
  console.log(`\nDone! OK: ${ok} | Failed: ${fail}`);
}

main();
