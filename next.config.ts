import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "export",
  // Dev-only: proxy /v2/* to the production backend so the local dev server can
  // exercise real uploads/logins without CORS. build/export ignores rewrites.
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    return [
      {
        source: "/v2/:path*",
        destination: "https://link.sast.fun/v2/:path*",
      },
    ];
  },
  turbopack: {
    // Explicitly set the workspace root so Turbopack does not get confused
    // by the docs/ package living inside the same repository.
    root: path.resolve("."),
  },
  // Note: This feature is required to use the Next.js Image component in SSG mode.
  // See https://nextjs.org/docs/messages/export-image-api for different workarounds.
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sast-link-1309205610.cos.ap-shanghai.myqcloud.com",
      },
    ],
  },
};

export default nextConfig;
