import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Author avatars only — post images use local /public/images/
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
    qualities: [75],
  },
};

export default nextConfig;
