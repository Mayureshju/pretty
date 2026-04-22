import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { getActiveSales, applyActiveSale } from "@/lib/sale-utils";
import CityFlowerPage from "@/components/CityFlowerPage";
import type { ContentSection, ContentSlot } from "@/components/CityFlowerPage";
import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("send-flowers-thane", {
    title: "Flower Delivery Thane | Florist in Thane - Pretty Petals",
    description:
      "Flower Delivery Thane \u2013 Pretty Petals offers fresh flowers with same-day delivery in Thane. Pretty Petals is one of the #1 florists in Thane.",
  });
}

export const revalidate = 3600;

const sections: ContentSection[] = [
  {
    type: "occasions",
    title: "Send Flowers in Thane for Every Occasion",
    content: "Flowers make every moment memorable. At Pretty Petals, we design bouquets that match the emotion behind your gesture.",
    listLabel: "Popular Occasions:",
    occasions: [
      "Birthday flower delivery in Thane",
      "Anniversary & romantic flowers",
      "Congratulations & celebration bouquets",
      "Get well soon flowers",
      "Wedding & engagement floral arrangements",
    ],
    closingLine: "Each bouquet is handcrafted to suit your occasion and create a lasting impression.",
  },
  {
    type: "product-highlight",
    title: "Explore Our Premium Flower Collection",
    content: "Choose from a wide variety of fresh and elegant floral arrangements:",
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
    closingLine: "All products are available for same-day flower delivery in Thane.",
  },
  {
    type: "text",
    title: "Flower Delivery in Thane \u2013 Fast & Reliable",
    content: "Need urgent delivery? We\u2019ve got you covered.",
    subHeading: "Our Delivery Options:",
    listItems: [
      "Same-day flower delivery",
      "Express delivery within hours",
    ],
  },
  {
    type: "features",
    title: "Why Choose Pretty Petals \u2013 Best Florist in Thane",
    content: "We go beyond just delivering flowers \u2014 we deliver experiences.",
    features: [
      {
        title: "Fresh Flowers, Every Day",
        description: "We source flowers daily to maintain freshness and quality.",
      },
      {
        title: "Expert Florist Designs",
        description: "Our skilled florists create visually stunning arrangements.",
      },
      {
        title: "Personalized Gifting",
        description: "Customize bouquets as per your needs and preferences.",
      },
      {
        title: "Transparent Pricing",
        description: "No hidden charges \u2014 clear and honest pricing.",
      },
      {
        title: "Local Florist You Can Trust",
        description: "We are a real florist brand, not just a marketplace.",
      },
    ],
  },
  {
    type: "promise",
    title: "Our Commitment to Quality & Customer Satisfaction",
    content: "At Pretty Petals, every order is handled with care because we understand the emotions behind it.",
    ensureLabel: "We ensure:",
    bullets: [
      "Fresh and vibrant flowers",
      "Premium packaging",
      "Timely delivery",
      "Dedicated customer support",
    ],
    closingLine: "Our goal is to create a smooth and delightful gifting experience every time.",
  },
  {
    type: "process",
    title: "How We Deliver Fresh Flowers in Thane",
    qualitySteps: {
      intro: "Our process ensures quality at every step:",
      items: [
        "Daily sourcing of fresh flowers",
        "Handcrafted bouquet design",
        "Quality check before dispatch",
        "Safe and timely delivery",
      ],
      closing: "This helps us maintain high standards for every order.",
    },
    orderingIntro: "Sending flowers with Pretty Petals is simple:",
    steps: [
      { label: "Choose your favorite bouquet", description: "" },
      { label: "Select delivery date & time", description: "" },
      { label: "Add a personalized message", description: "" },
      { label: "Place your order securely", description: "" },
    ],
    closingLine: "Sit back while we deliver your emotions with care.",
  },
  {
    type: "faq",
    title: "FAQs \u2013 Flower Delivery Thane",
    faqs: [
      {
        question: "Do you offer same-day flower delivery in Thane?",
        answer: "Yes, we provide same-day delivery for orders placed before the cut-off time.",
      },
      {
        question: "Is midnight delivery available?",
        answer: "Yes, we offer midnight flower delivery for special occasions.",
      },
      {
        question: "Do you deliver across all areas in Thane?",
        answer: "We cover major areas including Thane West, Ghodbunder Road, Majiwada, and more.",
      },
      {
        question: "Can I customize my bouquet?",
        answer: "Yes, we offer personalized floral arrangements based on your requirements.",
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

const thaneData = {
  city: "Thane",
  heroTitle: "Online Flower Delivery in Thane",
  heroSubtitle: "Order flowers in Thane today for same-day delivery",
  heroImage: "/images/banners/flowers.jpg",
  heroCta: { text: "Same-Day Flower Delivery – Shop Now", href: "/flowers/" },
  intro:
    "Looking for a trusted florist in Thane who can deliver fresh, beautiful flowers on time? Welcome to Pretty Petals \u2014 your go-to destination for online flower delivery in Thane with premium quality, elegant designs, and reliable service. Whether it\u2019s a birthday, anniversary, romantic surprise, or a last-minute celebration, we help you express your emotions with perfectly crafted floral arrangements. Order flowers in Thane today for same-day delivery.",
  sections,
  contentLayout,
  testimonials: [
    {
      name: "Divya Shah",
      text: "I was looking for a special arrangement for a friend's birthday, and Pretty Petals had just what I needed. The ordering procedure was easy, simple, and the flowers delivery on same day in Thane. Extremely pleased!",
      rating: 5,
    },
    {
      name: "Sujal Joshi",
      text: "I recently placed an order from Pretty Petals on my first Anniversary. The flower bouquet was even more stunning & fresh red roses delivery on the same day in Thane. Strongly advised!",
      rating: 5,
    },
    {
      name: "Antony Joseph",
      text: "I've placed several orders from Pretty Petals, and I've never been let down. Flowers always arrive in good condition and last for days. Excellent value for the money.",
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

const faqSection = sections.find((s) => s.type === "faq") as Extract<ContentSection, { type: "faq" }>;
const faqStructuredData = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqSection.faqs.map((faq) => ({
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

export default async function SendFlowersThane() {
  const { bestSellers, popularProducts } = await getProducts();

  return (
    <>
      <script
        type="application/ld+json"
        /* Safe: static developer-authored JSON-LD, no user input */
        dangerouslySetInnerHTML={{ __html: faqStructuredData }}
      />
      <CityFlowerPage
        data={{
          ...thaneData,
          bestSellers: JSON.parse(JSON.stringify(bestSellers)),
          popularProducts: JSON.parse(JSON.stringify(popularProducts)),
        }}
      />
    </>
  );
}
