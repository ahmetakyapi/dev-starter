import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { DEFAULT_THEME, THEME_COLOR } from "@/lib/theme";

/**
 * "Ana ekrana ekle" künyesi. Chrome kurulum istemi için 192 ve 512 piksellik
 * PNG ikonları da ister; marka hazır olunca `public/` altına ekleyip
 * listeye yaz.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: THEME_COLOR[DEFAULT_THEME],
    theme_color: THEME_COLOR[DEFAULT_THEME],
    lang: "tr",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
