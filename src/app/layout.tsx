import type { Metadata } from "next";
import { Raleway, Cormorant_Garamond } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-raleway",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
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
    <html lang="en" className={`${raleway.variable} ${cormorant.variable}`}>
      <body>
        <ClerkProvider>
          {children}
          <Toaster position="top-right" />
        </ClerkProvider>
      </body>
    </html>
  );
}
