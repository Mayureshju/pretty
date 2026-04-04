import type { Metadata } from "next";
import CityFlowerPage from "@/components/CityFlowerPage";

export const metadata: Metadata = {
  title: "Flower Delivery Navi Mumbai | Florist in Navi Mumbai - Pretty Petals",
  description:
    "Send flowers to Navi Mumbai from Pretty Petals. Our online flower delivery in Navi Mumbai will send the best quality flowers on the same day.",
};

const naviMumbaiData = {
  city: "Navi Mumbai",
  heroTitle: "Send Flowers to Navi Mumbai",
  heroSubtitle: "Premium flower delivery with same-day service across Navi Mumbai",
  heroImage: "/images/banners/flowers.jpg",
  intro:
    "A bouquet of fresh flowers is all that you need to bring a smile on the face of your loved one. Select from our range of beautiful flower collection and deliver it to Navi Mumbai. Send flowers to Navi Mumbai from Pretty Petals. Our online flower delivery in Navi Mumbai will send the best quality flowers on same day. So, hurry up and place your order for beautiful online flowers right away with Pretty Petals.",
  sections: [
    {
      title: "Flower Delivery in Navi Mumbai",
      content:
        "Flowers are the best creation of mother nature. However, it is getting attached to human nature too. Starting from happiness to expressing sorrow, from expressing love to sympathy, everywhere flowers are playing an important role. Welcoming a new life with flowers is another exceptional human behavior. If you want to send flowers to Navi Mumbai on any special occasion, Pretty Petals will help you with same-day delivery and the freshest arrangements.",
    },
    {
      title: "How to Choose Flowers for Every Occasion",
      content:
        "Choosing the right flowers requires care and thoughtfulness. When selecting flowers for celebrations, we always recommend light and colorful arrangements. The main thing that matters is the sentiment behind the flowers. We offer lily, daisies, sunflowers, roses, and whatever you desire. Our florists in Navi Mumbai will help you make the perfect choice for birthdays, anniversaries, weddings, and all of life's special moments.",
    },
    {
      title: "Best Flowers for Every Celebration",
      content:
        "Whether you're celebrating a birthday, welcoming a new baby, or marking an anniversary, flowers speak a language of their own. Delphinium, irises, and freesias are perfect for boys, while daisies, tulips, roses, and carnations in pink, yellow, and white are ideal for girls. Our flower delivery service in Navi Mumbai ensures fresh blossoms reach your loved ones on time, every time.",
    },
    {
      title: "What to Offer to New Parents",
      content:
        "A bunch of beautiful flowers can heal the soul and bring joy to new parents. Our expert florists create special baby bouquets with roses, snapdragon, foliage, and alstroemerias. If you want to gift chocolates or other items along with flowers, our online shop has everything you need. Pretty Petals offers the best flower delivery in Navi Mumbai for all occasions — birthdays, anniversaries, weddings, and more.",
    },
  ],
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
      text: "There is a wide variety of flowers for every occasion on Pretty Petals. I appreciate that I can place an order and have them sent straight to my loved ones on same day. My first choice for flower delivery — the #1 florist in Navi Mumbai.",
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

export default function SendFlowersNaviMumbai() {
  return <CityFlowerPage data={naviMumbaiData} />;
}
