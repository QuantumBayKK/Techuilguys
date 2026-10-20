import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  async redirects() {
    // /about became /studio — keep old links and search results working.
    return [{ source: "/about", destination: "/studio", permanent: true }];
  },
};

export default nextConfig;
