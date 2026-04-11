/**
 * Download high-quality stock images for the About Us page from Unsplash.
 *
 * Usage:
 *   node scripts/download-about-images.mjs
 */

import fs from "fs";
import path from "path";
import https from "https";

const OUTPUT_DIR = path.resolve("public/images/about");

const images = [
  {
    name: "hero.jpg",
    // Premium red rose arrangement, editorial style
    url: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1800&q=85&auto=format",
  },
  {
    name: "story.jpg",
    // Florist working on bouquet
    url: "https://images.unsplash.com/photo-1567696911980-2eed69a46042?w=1200&q=85&auto=format",
  },
  {
    name: "delivering-emotions.jpg",
    // Beautiful bouquet in hands
    url: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=1200&q=85&auto=format",
  },
  {
    name: "vision.jpg",
    // Vibrant yellow sunflower bouquet
    url: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=1200&q=85&auto=format",
  },
  {
    name: "mission.jpg",
    // Romantic gift with flowers
    url: "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=1200&q=85&auto=format",
  },
  {
    name: "rooted-in-love.jpg",
    // Beautiful wide floral display
    url: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=1800&q=85&auto=format",
  },
  {
    name: "custom-designs.jpg",
    // Artisan flower arrangement close-up
    url: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=1200&q=85&auto=format",
  },
  {
    name: "delivery.jpg",
    // Flower delivery / logistics
    url: "https://images.unsplash.com/photo-1457089328109-e5d9bd499191?w=1200&q=85&auto=format",
  },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = (reqUrl) => {
      https.get(reqUrl, (res) => {
        // Follow redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          request(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${reqUrl}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      }).on("error", reject);
    };
    request(url);
  });
}

async function main() {
  console.log(`\nDownloading ${images.length} images for About Us page\n`);

  let success = 0;
  for (const img of images) {
    const dest = path.join(OUTPUT_DIR, img.name);
    try {
      await download(img.url, dest);
      const size = fs.statSync(dest).size;
      console.log(`  ✓ ${img.name} (${(size / 1024).toFixed(0)} KB)`);
      success++;
    } catch (err) {
      console.error(`  ✗ ${img.name}: ${err.message}`);
    }
  }

  console.log(`\nDone: ${success}/${images.length} downloaded\n`);
}

main().catch(console.error);
