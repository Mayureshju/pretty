export type LegacyRedirect = {
  source: string;
  destination: string;
  permanent: true;
};

function pair(source: string, destination: string): LegacyRedirect[] {
  const noSlash = source.replace(/\/+$/, "");
  return [
    { source: noSlash, destination, permanent: true },
    { source: `${noSlash}/`, destination, permanent: true },
  ];
}

/**
 * Permanent (308) map for Woo/Ahrefs dead paths and the existing storefront
 * URL migrations. Destinations always use the trailing-slash canonical form.
 */
export const LEGACY_REDIRECTS: LegacyRedirect[] = [
  { source: "/p/flower/:slug", destination: "/product/:slug/", permanent: true },
  { source: "/category/:slug", destination: "/:slug/", permanent: true },
  ...pair("/all-flowers", "/flowers/"),

  // Photo cake: indexed at /photo-cake/; nested Woo path 308s here.
  ...pair("/cakes/photo-cake", "/photo-cake/"),

  // Ahrefs 404s (internal links + blog)
  ...pair("/birthday/flowers", "/flowers/birthday/"),
  ...pair("/gifts/fruits", "/fruits/"),
  ...pair("/gifts/corporate", "/corporate/"),
  ...pair("/hampers/same-day-delivery", "/combos-gifts/"),
  ...pair("/flowers/in-box", "/flowers/"),
  ...pair("/plants/premium", "/plants/"),
  ...pair("/flowers/mothers-day", "/flowers/mother-flower/"),

  // Hardcoded storefront leftovers
  ...pair("/gift-hampers", "/combos-gifts/"),
  ...pair("/personalised-gifts", "/combos-gifts/personalized-gifts/"),
  ...pair("/trackorder", "/account/orders/"),
  ...pair("/hampers", "/combos-gifts/"),

  // WordPress media → S3 (same mapping as scripts/migrate-image-urls.mjs)
  {
    source: "/wp-content/uploads/:path*",
    destination:
      "https://pretty-petals-web.s3.eu-central-1.amazonaws.com/uploads/:path*",
    permanent: true,
  },
];
