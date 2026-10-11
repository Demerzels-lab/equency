import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Provider calls run server-side only; keys never reach the client bundle.
  // The three.js ecosystem ships untranspiled ESM; transpile it so `next build` is happy.
  transpilePackages: [
    "three",
    "@react-three/fiber",
    "@react-three/drei",
    "@react-three/postprocessing",
    "postprocessing",
  ],
  // The roadmap is now Project ORION: keep old links (and search results) working.
  async redirects() {
    return [{ source: "/roadmap", destination: "/orion", permanent: true }];
  },
};

export default nextConfig;
