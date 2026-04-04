/**
 * Download high-quality stock images from Unsplash for missing placeholders
 * Run: node scripts/download-images.mjs
 */

import { writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";

// Curated Unsplash photo IDs for each category
const images = [
  // Occasions
  { path: "public/images/occasions/valentines.jpg", url: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=600&h=600&fit=crop&crop=center&q=80" },
  { path: "public/images/occasions/wedding.jpg", url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=600&fit=crop&crop=center&q=80" },
  { path: "public/images/occasions/get-well.jpg", url: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=600&h=600&fit=crop&crop=center&q=80" },
  { path: "public/images/occasions/housewarming.jpg", url: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&h=600&fit=crop&crop=center&q=80" },
  { path: "public/images/occasions/congratulations.jpg", url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&h=600&fit=crop&crop=center&q=80" },
  { path: "public/images/occasions/corporate.jpg", url: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=600&fit=crop&crop=center&q=80" },

  // Products - Flowers
  { path: "public/images/products/flower-box.jpg", url: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&h=600&fit=crop&crop=center&q=80" },
  { path: "public/images/products/birthday-flowers.jpg", url: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=600&fit=crop&crop=center&q=80" },
  { path: "public/images/products/wedding-flowers.jpg", url: "https://images.unsplash.com/photo-1522057306606-8d84afe902e1?w=600&h=600&fit=crop&crop=center&q=80" },
  { path: "public/images/products/corporate-gifts.jpg", url: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=600&h=600&fit=crop&crop=center&q=80" },
  { path: "public/images/products/premium-plants.jpg", url: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&h=600&fit=crop&crop=center&q=80" },

  // Products - Cakes
  { path: "public/images/products/butterscotch-cake.jpg", url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=600&fit=crop&crop=center&q=80" },
  { path: "public/images/products/red-velvet-cake.jpg", url: "https://images.unsplash.com/photo-1586788224331-947f68671cf1?w=600&h=600&fit=crop&crop=center&q=80" },
  { path: "public/images/products/fruit-cake.jpg", url: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=600&fit=crop&crop=center&q=80" },
  { path: "public/images/products/designer-cake.jpg", url: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600&h=600&fit=crop&crop=center&q=80" },

  // Products - Gifts
  { path: "public/images/products/photo-gifts.jpg", url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&h=600&fit=crop&crop=center&q=80" },
  { path: "public/images/products/soft-toys.jpg", url: "https://images.unsplash.com/photo-1559715541-5daf8a0296d0?w=600&h=600&fit=crop&crop=center&q=80" },
  { path: "public/images/products/chocolates.jpg", url: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&h=600&fit=crop&crop=center&q=80" },
  { path: "public/images/products/mugs.jpg", url: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&h=600&fit=crop&crop=center&q=80" },
  { path: "public/images/products/cushions.jpg", url: "https://images.unsplash.com/photo-1629949009765-40fc74c9ec21?w=600&h=600&fit=crop&crop=center&q=80" },
];

async function downloadImage(item) {
  if (existsSync(item.path)) {
    console.log(`  SKIP (exists): ${item.path}`);
    return true;
  }

  try {
    const response = await fetch(item.url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });

    if (!response.ok) {
      console.log(`  FAIL (${response.status}): ${item.path}`);
      return false;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const dir = dirname(item.path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    writeFileSync(item.path, buffer);
    console.log(`  OK: ${item.path} (${(buffer.length / 1024).toFixed(0)}KB)`);
    return true;
  } catch (err) {
    console.log(`  FAIL: ${item.path} — ${err.message}`);
    return false;
  }
}

// Also create a simple placeholder
function createPlaceholder() {
  const path = "public/images/products/placeholder.jpg";
  if (existsSync(path)) {
    console.log(`  SKIP (exists): ${path}`);
    return;
  }
  // Create a minimal 1x1 gray JPEG as placeholder
  // Better to download a proper one
  console.log(`  Will download placeholder...`);
}

async function main() {
  console.log("Downloading missing images from Unsplash...\n");

  let ok = 0, fail = 0;
  for (const img of images) {
    const result = await downloadImage(img);
    if (result) ok++; else fail++;
  }

  // Download placeholder separately
  const phResult = await downloadImage({
    path: "public/images/products/placeholder.jpg",
    url: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400&h=400&fit=crop&crop=center&q=60&blur=50",
  });
  if (phResult) ok++; else fail++;

  console.log(`\nDone! OK: ${ok} | Failed: ${fail}`);
}

main().catch(err => { console.error(err); process.exit(1); });
