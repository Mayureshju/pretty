import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import {
  GA_MEASUREMENT_ID,
  GOOGLE_ADS_ID,
  GOOGLE_ADS_PURCHASE_CONVERSION,
} from "@/lib/gtag";
import {
  GoogleTagManagerHead,
  GoogleTagManagerBody,
} from "@/components/GoogleTagManager";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.prettypetals.com"),
  title: {
    default: "Pretty Petals - Premium Flower Delivery, Cakes & Gifts in Mumbai",
    template: "%s",
  },
  description:
    "Order premium flowers, cakes, plants & gifts online with same day delivery in Mumbai. Handcrafted bouquets for birthdays, anniversaries & all occasions.",
  verification: {
    google: "ILAk3vsXifAAHMlJNHHlViEMODsULgAJreyknIJ5X0E",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <GoogleTagManagerHead />
      </head>
      <body>
        <GoogleTagManagerBody />
        <ClerkProvider>
          {children}
          <Toaster position="top-right" />
        </ClerkProvider>

        {/* Google Analytics + Google Ads (gtag.js) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
            gtag('config', '${GOOGLE_ADS_ID}');
          `}
        </Script>
        <Script id="google-ads-conversion" strategy="afterInteractive">
          {`
            window.gtag_report_conversion = function(url) {
              var callback = function () {
                if (typeof(url) != 'undefined') {
                  window.location = url;
                }
              };
              gtag('event', 'conversion', {
                'send_to': '${GOOGLE_ADS_PURCHASE_CONVERSION}',
                'value': 100.0,
                'currency': 'INR',
                'transaction_id': '',
                'event_callback': callback
              });
              return false;
            };
          `}
        </Script>
      </body>
    </html>
  );
}
