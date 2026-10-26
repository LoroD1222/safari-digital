import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://www.safaridigital.co.tz", lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
