import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The whole experience is one imperative GSAP/Lenis scroll timeline; avoid the
  // dev double-mount that would re-fire intro animations.
  reactStrictMode: false,
};

export default nextConfig;
