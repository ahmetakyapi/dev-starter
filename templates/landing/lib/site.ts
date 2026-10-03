/**
 * Site sabitleri: metadataBase, sitemap ve robots üçü de buradan okur.
 * Bu modül istemciden de okunabilir; sunucu sırrı taşımaz.
 */

export const SITE_NAME = "PROJECT_NAME";
export const SITE_DESCRIPTION = "PROJECT_DESCRIPTION";

/** Boş dizgiyi de tanımsız sayar: `new URL("")` bütün build'i düşürür. */
function firstNonEmpty(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

/**
 * Sıra: açık ayar → Vercel üretim alan adı → yerel. Vercel'de değişken
 * unutulursa site haritası localhost adresleri yaymasın diye ikinci basamak
 * var; o hata sessiz ama pahalıdır.
 */
export const SITE_URL = (
  firstNonEmpty(
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
  ) ?? "http://localhost:3000"
).replace(/\/$/, "");

/**
 * Önizleme dağıtımları dizine girmez: aynı içerik ikinci bir adreste kopya
 * sayılır. Derleme zamanında okunur (robots ve sitemap statik üretilir),
 * yani değişken build'den ÖNCE ortamda olmalı.
 */
export const INDEXABLE = process.env.VERCEL_ENV !== "preview";
