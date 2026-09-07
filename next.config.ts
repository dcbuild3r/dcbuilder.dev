import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    const publicPageHeaders = [
      {
        key: "Cache-Control",
        value: "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
      },
      {
        key: "Vercel-CDN-Cache-Control",
        value: "public, s-maxage=60, stale-while-revalidate=300",
      },
    ];

    return [
      { source: "/news/:path*", headers: publicPageHeaders },
      { source: "/jobs/:path*", headers: publicPageHeaders },
      { source: "/portfolio/:path*", headers: publicPageHeaders },
      { source: "/candidates/:path*", headers: publicPageHeaders },
      { source: "/blog/:path*", headers: publicPageHeaders },
      { source: "/about/:path*", headers: publicPageHeaders },
      { source: "/newsletters/:path*", headers: publicPageHeaders },
    ];
  },
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-a22f31a467534add843b6cf22cf4f443.r2.dev",
      },
      {
        protocol: "https",
        hostname: "substackcdn.com",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
      {
        protocol: "https",
        hostname: "unavatar.io",
      },
      {
        protocol: "https",
        hostname: "**.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
