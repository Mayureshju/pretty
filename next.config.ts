import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    return [
      {
        source: "/p/flower/:slug",
        destination: "/product/:slug/",
        permanent: true,
      },
      {
        source: "/category/:slug",
        destination: "/:slug/",
        permanent: true,
      },
      {
        source: "/all-flowers",
        destination: "/flowers/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
