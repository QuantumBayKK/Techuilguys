import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // avoid double-mount thrash for the imperative GSAP/WebGL timeline
  transpilePackages: ["three"],
};

export default nextConfig;
