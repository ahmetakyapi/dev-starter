import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Statik rotalar burada; veritabanından gelen sayfalar eklenirken sorgu buraya. */
const ROUTES = ["/"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({ url: `${SITE_URL}${path}`, changeFrequency: "weekly" }));
}
