import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pretty Petals - Premium Flower Delivery, Cakes & Gifts in Mumbai",
  description:
    "Order premium flowers, cakes, plants & gifts online with same day delivery in Mumbai. Handcrafted bouquets for birthdays, anniversaries & all occasions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ClerkProvider>
          {children}
          <Toaster position="top-right" />
        </ClerkProvider>
      </body>
    </html>
  );
}
