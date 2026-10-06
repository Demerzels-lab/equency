import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Provider calls run server-side only; keys never reach the client bundle.
};

export default nextConfig;
