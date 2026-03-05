import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "onedrive.live.com" },
      { protocol: "https", hostname: "api.onedrive.com" },
      { protocol: "https", hostname: "1drv.ms" },
      { protocol: "https", hostname: "**.files.1drv.com" },
    ],
  },
};

export default nextConfig;
