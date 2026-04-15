/**
 * Seed existing hardcoded quotes into MongoDB.
 * Run: node scripts/seed-quotes.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, "..", ".env.local");
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env.local not found, rely on existing env vars
  }
}

loadEnv();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI not found in .env.local");
  process.exit(1);
}

const QuoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    author: { type: String, default: "" },
    category: { type: String, required: true },
    color: { type: String, default: "#737530" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Quote = mongoose.model("Quote", QuoteSchema);

const seedData = [
  {
    category: "Flower Quotes",
    color: "#737530",
    quotes: [
      { text: "Where flowers bloom, so does hope.", author: "Lady Bird Johnson" },
      { text: "Every flower is a soul blossoming in nature.", author: "Gerard De Nerval" },
      { text: "The earth laughs in flowers.", author: "Ralph Waldo Emerson" },
      { text: "A flower does not think of competing with the flower next to it. It just blooms.", author: "Zen Shin" },
      { text: "Flowers are the music of the ground. From earth\u2019s lips spoken without sound.", author: "Edwin Curran" },
      { text: "If we could see the miracle of a single flower clearly, our whole life would change.", author: "Buddha" },
    ],
  },
  {
    category: "Love & Romance",
    color: "#EA1E61",
    quotes: [
      { text: "I\u2019d rather have roses on my table than diamonds on my neck.", author: "Emma Goldman" },
      { text: "Love is the flower you\u2019ve got to let grow.", author: "John Lennon" },
      { text: "A flower cannot blossom without sunshine, and a man cannot live without love.", author: "Max Muller" },
      { text: "Love planted a rose, and the world turned sweet.", author: "Katharine Lee Bates" },
      { text: "The rose speaks of love silently, in a language known only to the heart.", author: "Unknown" },
      { text: "In joy or sadness, flowers are our constant friends.", author: "Kozuko Okakura" },
    ],
  },
  {
    category: "Birthday Wishes",
    color: "#E8A04C",
    quotes: [
      { text: "May your birthday bloom with happiness, just like a garden full of flowers.", author: "" },
      { text: "Wishing you a birthday as beautiful and vibrant as a fresh bouquet of roses.", author: "" },
      { text: "Another year older, another year more wonderful. Happy Birthday!", author: "" },
      { text: "May your special day be surrounded by the fragrance of love and joy.", author: "" },
      { text: "Like flowers that brighten any room, you brighten every life you touch. Happy Birthday!", author: "" },
      { text: "Sending you a bouquet of love and warm wishes on your birthday.", author: "" },
    ],
  },
  {
    category: "Anniversary Messages",
    color: "#C6A869",
    quotes: [
      { text: "Love grows more tremendously full, swift, poignant, as the years multiply.", author: "Zane Grey" },
      { text: "A successful marriage requires falling in love many times, always with the same person.", author: "Mignon McLaughlin" },
      { text: "The best thing to hold onto in life is each other. Happy Anniversary!", author: "Audrey Hepburn" },
      { text: "Together is a wonderful place to be. Cheers to another beautiful year!", author: "" },
      { text: "Your love story is my favorite. Wishing you a blooming anniversary!", author: "" },
      { text: "Like a garden tended with care, your love only grows more beautiful with time.", author: "" },
    ],
  },
  {
    category: "Get Well Soon",
    color: "#009D43",
    quotes: [
      { text: "Sending healing thoughts and a virtual bouquet to brighten your day.", author: "" },
      { text: "Flowers may not cure, but they can certainly make the heart smile. Get well soon!", author: "" },
      { text: "Wishing you a speedy recovery. May these flowers bring warmth and cheer.", author: "" },
      { text: "Rest, heal, and bloom again. We\u2019re rooting for you!", author: "" },
      { text: "A little sunshine and flowers to remind you that brighter days are ahead.", author: "" },
      { text: "Take your time to heal. Sending you love wrapped in petals.", author: "" },
    ],
  },
  {
    category: "Congratulations",
    color: "#006FCF",
    quotes: [
      { text: "Success is a flower that blooms from the seed of hard work. Congratulations!", author: "" },
      { text: "You did it! Celebrating your achievement with the brightest blooms.", author: "" },
      { text: "Every accomplishment starts with the decision to try. Well done!", author: "" },
      { text: "Here\u2019s to new beginnings and beautiful milestones. Congratulations!", author: "" },
      { text: "Your hard work has paid off beautifully. Time to stop and smell the roses!", author: "" },
      { text: "Like a flower reaching for the sun, you\u2019ve risen to the occasion. Bravo!", author: "" },
    ],
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const existingCount = await Quote.countDocuments();
  if (existingCount > 0) {
    console.log(`Already ${existingCount} quotes in the database. Skipping seed.`);
    await mongoose.disconnect();
    return;
  }

  const docs = [];
  for (const cat of seedData) {
    for (let i = 0; i < cat.quotes.length; i++) {
      docs.push({
        text: cat.quotes[i].text,
        author: cat.quotes[i].author,
        category: cat.category,
        color: cat.color,
        order: i,
        isActive: true,
      });
    }
  }

  await Quote.insertMany(docs);
  console.log(`Seeded ${docs.length} quotes across ${seedData.length} categories`);

  await mongoose.disconnect();
  console.log("Done!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
