import type { Metadata } from "next";
import CartPage from "@/components/CartPage";

export const metadata: Metadata = {
  title: "Cart | FlowerAura",
  description: "Review your cart and place your order.",
};

export default function Cart() {
  return <CartPage />;
}
