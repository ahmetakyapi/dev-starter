import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Tek sayfalık landing; yeni sayfa eklendikçe buraya. Bölüm çapaları (#) site haritasına girmez. */
const ROUTES = ["/"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({ url: `${SITE_URL}${path}`, changeFrequency: "monthly", priority: 1 }));
}
