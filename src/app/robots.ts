import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/sign-in/", "/sign-up/", "/account/"],
    },
    sitemap: "https://www.prettypetals.com/sitemap.xml",
  };
}
