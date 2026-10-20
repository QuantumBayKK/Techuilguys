import type { MetadataRoute } from "next";
import { SITE } from "@/content/site-copy";
import { WORK } from "@/content/work";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/work", "/services", "/studio", "/contact", "/privacy"];
  return [
    ...pages.map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: "monthly" as const, priority: p === "" ? 1 : 0.8 })),
    ...WORK.map((w) => ({ url: `${SITE.url}/work/${w.slug}`, changeFrequency: "yearly" as const, priority: 0.6 })),
  ];
}
