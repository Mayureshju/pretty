import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { getActiveSales, applyActiveSale } from "@/lib/sale-utils";
import CityFlowerPage from "@/components/CityFlowerPage";

export const metadata: Metadata = {
  title: "Flower Delivery Thane | Florist in Thane - Pretty Petals",
  description:
    "Flower Delivery Thane – Pretty Petals offers fresh flowers with same-day delivery in Thane. Pretty Petals is one of the #1 florists in Thane.",
};

export const revalidate = 3600;

const thaneData = {
  city: "Thane",
  heroTitle: "Online Flower Delivery in Thane",
  heroSubtitle: "Fresh handcrafted bouquets delivered same-day across Thane",
  heroImage: "/images/banners/flowers.jpg",
  intro:
    "Send a flower bouquet online to Thane to greet your loved ones on any special occasion. Booking flowers in Thane gives you satisfaction over its quality, freshness and fragrance. Our florist in Thane displays flowers that will enthrall you. Our online flower shop in Thane excels in offering you an exquisite range of flowers that you will admire and adore. Book for flower delivery in Thane even as you travel abroad. It makes your presence felt even in your absence. A flower bouquet online sent to Thane by you sends flutters of joy and happiness in your family circles. It creates an indelible impression about you. Online flower delivery in Thane is something you cannot afford to miss.",
  sections: [
    {
      title: "Online Best Florist in Thane",
      content:
        "Pretty Petals is the premier online florist serving Thane with the freshest flowers, stunning arrangements, and reliable same-day delivery. Our expert florists handcraft each bouquet with care, ensuring every petal is perfect. Whether you need roses for a romantic gesture, lilies for a celebration, or a mixed bouquet to brighten someone's day, our Thane flower delivery service has you covered.",
    },
    {
      title: "Compensate Your Absence with Flower Bouquet Delivery in Thane",
      content:
        "Is this month studded with parties? It may not be possible to attend all parties. Let bouquet delivery in Thane mark your attendance when you are away from the city. So just click and book. Our online flower shop in Thane has all the varieties you look for. Spread the cloak of happiness all around. Flowers are communication media too. They convey your expressions, feelings and care. Peep into our florist in Thane and you can see for yourself.",
    },
    {
      title: "Gifting Flowers in Thane",
      content:
        "Most moving moments are silent as it can be. Assuage the feelings with online flowers in Thane. Flowers on Earth are God's creation at its best. Pick and choose flowers you like from our florist in Thane. They are feast to your eyes. Online flower delivery in Thane has captured the imagination of one and all. When people wish to celebrate, it is flowers online delivery that they think of and how right they are!",
    },
    {
      title: "Send Roses Online to Thane",
      content:
        "Roses create sweet memories, fragrant thoughts and gentle feelings. Is there anything more exciting than sending roses online? Variety, fragrance and freshness in every bunch and in every flower are guaranteed in online rose delivery in Thane. Don't you want to join that fortunate lot and get the best roses from our online flower shop in Thane? Avail this opportunity with Pretty Petals. A simple click makes a joyous leap, a leap of joy when you send flowers online to Thane.",
    },
  ],
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
    <CityFlowerPage
      data={{
        ...thaneData,
        bestSellers: JSON.parse(JSON.stringify(bestSellers)),
        popularProducts: JSON.parse(JSON.stringify(popularProducts)),
      }}
    />
  );
}
