import type { MetadataRoute } from "next";
import { SITE } from "@/content/site-copy";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/workspace", "/api"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
