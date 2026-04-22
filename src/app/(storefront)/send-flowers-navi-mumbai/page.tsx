import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { getActiveSales, applyActiveSale } from "@/lib/sale-utils";
import CityFlowerPage from "@/components/CityFlowerPage";
import type { ContentSection, ContentSlot } from "@/components/CityFlowerPage";
import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("send-flowers-navi-mumbai", {
    title: "Flower Delivery Navi Mumbai | Florist in Navi Mumbai - Pretty Petals",
    description:
      "Send flowers to Navi Mumbai from Pretty Petals. Our online flower delivery in Navi Mumbai will send the best quality flowers on the same day.",
  });
}

export const revalidate = 3600;

const sections: ContentSection[] = [
  {
    type: "text",
    title: "Online Flower Delivery in Navi Mumbai",
    content:
      "Flowers are one of nature\u2019s most beautiful creations, and over time, they have become an essential part of human emotions. From celebrating happiness to expressing love, offering sympathy, or sharing support \u2014 flowers help convey feelings in the most meaningful way. They are especially cherished during life\u2019s most special moments, like welcoming a new baby into the world. If someone close to you has recently been blessed with a newborn, a thoughtful gesture can bring immense joy and comfort. Sending fresh blooms is a beautiful way to share your love, blessings, and support during this precious time. At Pretty Petals, we make it easy to send flowers in Navi Mumbai for such heartfelt occasions. Our expertly crafted bouquets are designed to celebrate new beginnings and create lasting impressions. With our reliable online flower delivery in Navi Mumbai, you can surprise your loved ones with fresh, elegant flowers delivered right to their doorstep \u2014 on time and with care. Order now for same-day flower delivery in Navi Mumbai.",
  },
  {
    type: "occasions",
    title: "Send Flowers in Navi Mumbai for Every Occasion",
    content: "Flowers speak when words fall short \u2014 and at Pretty Petals, we help you express every emotion effortlessly.",
    listLabel: "Popular Occasions We Cover:",
    occasions: [
      "Birthday flower delivery in Navi Mumbai",
      "Anniversary flowers & romantic bouquets",
      "Congratulations & celebration flowers",
      "Get well soon flowers",
      "Wedding & engagement floral arrangements",
    ],
    closingLine: "Our expert florists design each bouquet with attention to detail, ensuring it perfectly matches your occasion.",
  },
  {
    type: "product-highlight",
    title: "Our Best-Selling Flower Arrangements",
    highlights: [
      {
        name: "Fresh Flower Bouquets",
        description: "Hand-tied bouquets crafted with the freshest seasonal blooms, perfect for any occasion.",
      },
      {
        name: "Flower & Gift Combos",
        description: "Pair stunning flowers with chocolates, cakes, or personalized gifts for the perfect surprise.",
      },
      {
        name: "Luxury Floral Designs",
        description: "Premium arrangements featuring exotic flowers and elegant presentation for those extra-special moments.",
      },
    ],
  },
  {
    type: "features",
    title: "Why Choose Pretty Petals in Navi Mumbai?",
    content: "Unlike generic flower delivery platforms, we focus on quality, personalization, and trust.",
    features: [
      {
        title: "Fresh Flowers Sourced Daily",
        description: "We procure flowers directly from trusted markets to maintain freshness.",
      },
      {
        title: "Expert Florist Craftsmanship",
        description: "Every bouquet is designed by skilled florists with a keen eye for aesthetics.",
      },
      {
        title: "Personalized Gifting Options",
        description: "Customize your bouquet based on your style, budget, and occasion.",
      },
      {
        title: "Transparent Pricing",
        description: "No hidden charges \u2014 what you see is what you pay.",
      },
      {
        title: "Reliable Local Delivery",
        description: "We are a real florist brand, not just an aggregator.",
      },
    ],
  },
  {
    type: "promise",
    title: "Our Promise \u2013 Freshness, Quality & Care",
    content: "At Pretty Petals, we understand that every order carries emotions.",
    ensureLabel: "That\u2019s why we ensure:",
    bullets: [
      "Fresh and vibrant flowers",
      "Premium packaging",
      "Timely delivery commitment",
      "Responsive customer support",
    ],
    closingLine: "We aim to create not just deliveries \u2014 but memorable experiences.",
    stepsIntro: "Our process is simple but effective:",
    steps: [
      { label: "Daily Flower Sourcing", description: "From trusted vendors" },
      { label: "Handcrafted Arrangements", description: "By expert florists" },
      { label: "Quality Check", description: "Before dispatch" },
      { label: "Safe & Same Day Delivery", description: "Across Navi Mumbai" },
    ],
    stepsClosing: "This ensures every bouquet looks as fresh as it was designed.",
  },
  {
    type: "process",
    title: "Send Flowers in Navi Mumbai \u2013 Easy Ordering Process",
    content: "Ordering from Pretty Petals is quick and hassle-free:",
    steps: [
      { label: "Browse your favorite bouquet", description: "" },
      { label: "Select delivery date & time", description: "" },
      { label: "Add a personalized message", description: "" },
      { label: "Place your order securely", description: "" },
    ],
    closingLine: "Choose Pretty Petals for the most reliable and elegant flower delivery in Navi Mumbai.",
  },
  {
    type: "faq",
    title: "FAQs \u2013 Flower Delivery Navi Mumbai",
    faqs: [
      {
        question: "Do you offer same-day flower delivery in Navi Mumbai?",
        answer: "Yes, we provide same-day delivery for orders placed before the cut-off time.",
      },
      {
        question: "Can I schedule midnight delivery?",
        answer: "Absolutely! We offer midnight flower delivery for special occasions.",
      },
      {
        question: "Do you deliver across all areas in Navi Mumbai?",
        answer: "Yes, we cover major areas including Vashi, Nerul, Kharghar, Belapur, and more.",
      },
      {
        question: "Can I customize my bouquet?",
        answer: "Yes, we specialize in personalized floral arrangements.",
      },
    ],
  },
];

const contentLayout: ContentSlot[] = [
  { slot: "best-sellers" },
  { slot: "section", index: 0 },
  { slot: "collections" },
  { slot: "section", index: 1 },
  { slot: "popular-products" },
  { slot: "section", index: 2 },
  { slot: "section", index: 3 },
  { slot: "section", index: 4 },
  { slot: "section", index: 5 },
  { slot: "section", index: 6 },
];

const naviMumbaiData = {
  city: "Navi Mumbai",
  heroTitle: "Flower Delivery in Navi Mumbai",
  heroSubtitle: "Order now for same-day flower delivery in Navi Mumbai.",
  heroImage: "/images/banners/flowers.jpg",
  heroCta: { text: "Same-Day Flower Delivery – Order Now", href: "/flowers/" },
  intro:
    "Looking for online flower delivery in Navi Mumbai that is fast, reliable, and beautifully curated? Welcome to Pretty Petals \u2014 your trusted local florist delivering fresh, handcrafted bouquets across Navi Mumbai. Whether it\u2019s a birthday, anniversary, romantic surprise, or last-minute celebration, we make sure your emotions are delivered on time and in perfect condition.",
  sections,
  contentLayout,
  testimonials: [
    {
      name: "Divya Shah",
      text: "I was looking for a special arrangement for a friend's wedding, Pretty Petals had just what I needed. The ordering procedure was simple, user friendly. Flower delivery for wedding was on time with same day delivery in Navi Mumbai. Extremely pleased!",
      rating: 5,
    },
    {
      name: "Sujal Joshi",
      text: "I recently placed an order from Pretty Petals. The flower bouquet was awesome, it was the perfect gift for a birthday. I'm surprised by the quick delivery in Navi Mumbai. Strongly advised!",
      rating: 5,
    },
    {
      name: "Charvi Lodaya",
      text: "There is a wide variety of flowers for every occasion on Pretty Petals. I appreciate that I can place an order and have them sent straight to my loved ones on same day. My first choice for flower delivery \u2014 the #1 florist in Navi Mumbai.",
      rating: 5,
    },
  ],
  categories: [
    { name: "Flowers", count: 471, href: "/flowers/" },
    { name: "Birthday", count: 467, href: "/birthday" },
    { name: "Anniversary", count: 395, href: "/anniversary" },
    { name: "Fruits", count: 10, href: "/gifts/fruits" },
    { name: "Corporate", count: 310, href: "/gifts/corporate" },
  ],
};

const faqStructuredData = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: (sections.find((s) => s.type === "faq") as Extract<ContentSection, { type: "faq" }>).faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
});

async function getProducts() {
  await connectDB();
  const [bestSellers, popular, activeSales] = await Promise.all([
    Product.find({ isActive: true })
      .select("name slug pricing images metrics isFeatured categories")
      .sort({ "metrics.totalSales": -1 })
      .limit(8)
      .lean(),
    Product.find({ isActive: true })
      .select("name slug pricing images metrics isFeatured categories")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    getActiveSales(),
  ]);

  const addSaleInfo = (p: (typeof bestSellers)[number]) => {
    const sale = applyActiveSale(
      { pricing: p.pricing, categories: p.categories?.map((c: unknown) => String(c)) },
      activeSales as Parameters<typeof applyActiveSale>[1]
    );
    return {
      ...p,
      _saleInfo: sale.hasSale
        ? { effectivePrice: sale.effectivePrice, discountPercent: sale.discountPercent, saleLabel: sale.saleLabel }
        : null,
    };
  };

  return {
    bestSellers: bestSellers.map(addSaleInfo),
    popularProducts: popular.map(addSaleInfo),
  };
}

export default async function SendFlowersNaviMumbai() {
  const { bestSellers, popularProducts } = await getProducts();

  return (
    <>
      <script
        type="application/ld+json"
        // Static hardcoded JSON-LD for FAQ structured data - no user input involved
        dangerouslySetInnerHTML={{ __html: faqStructuredData }}
      />
      <CityFlowerPage
        data={{
          ...naviMumbaiData,
          bestSellers: JSON.parse(JSON.stringify(bestSellers)),
          popularProducts: JSON.parse(JSON.stringify(popularProducts)),
        }}
      />
    </>
  );
}
