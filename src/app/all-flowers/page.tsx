import type { Metadata } from "next";
import FlowerListing from "@/components/FlowerListing";

export const metadata: Metadata = {
  title: "Online Flower Delivery | Flowers to India | Free Shipping - FlowerAura",
  description:
    "Send flowers online with same day & midnight delivery across India. Fresh flower bouquets, roses, orchids & more. Free shipping on flower delivery.",
};

export default function AllFlowersPage() {
  return <FlowerListing />;
}
