import type { Metadata } from "next";
import WishlistContent from "@/components/WishlistContent";

export const metadata: Metadata = {
  title: "Wishlist | Pretty Petals",
  description: "Your saved favorite flowers, cakes, and gifts",
};

export default function WishlistPage() {
  return <WishlistContent />;
}
