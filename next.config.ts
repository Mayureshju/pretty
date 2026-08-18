import type { NextConfig } from "next";
import { LEGACY_REDIRECTS } from "./src/lib/legacy-redirects";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  trailingSlash: true,
  serverExternalPackages: ["mongoose", "nodemailer"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "uploadthing.com",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "prettypetals.com",
      },
      {
        protocol: "https",
        hostname: "www.prettypetals.com",
      },
      {
        protocol: "https",
        hostname: "floristaindia.com",
      },
      {
        protocol: "http",
        hostname: "floristaindia.com",
      },
      {
        protocol: "https",
        hostname: "**.floristaindia.com",
      },
      {
        protocol: "http",
        hostname: "**.floristaindia.com",
      },
      {
        protocol: "https",
        hostname: "pretty-petals-web.s3.eu-central-1.amazonaws.com",
      },
    ],
  },
  async redirects() {
    return LEGACY_REDIRECTS;
  },
};

export default nextConfig;
