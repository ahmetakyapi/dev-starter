/**
 * Site sabitleri: metadataBase, sitemap ve robots üçü de buradan okur.
 * Bu modül istemciden de okunabilir; sunucu sırrı taşımaz.
 */

export const SITE_NAME = "PROJECT_NAME";
export const SITE_DESCRIPTION = "PROJECT_DESCRIPTION";

/**
 * Open Graph tabanı: kök layout bunu basar, `openGraph` veren her sayfa da
 * (`og:url` için) yayar. Metadata üst düzey anahtarları SIĞ birleştirir;
 * sayfa `openGraph`i tabansız verirse site adı, dil ve tür sessizce düşer.
 */
export const OPEN_GRAPH = { type: "website", siteName: SITE_NAME, locale: "tr_TR" } as const;

/** Boş dizgiyi de tanımsız sayar: `new URL("")` bütün build'i düşürür. */
function firstNonEmpty(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

/**
 * Vercel üretim alan adı. İstemci paketine yalnızca `NEXT_PUBLIC_` adları
 * girer: eşi olmasa istemci bileşeni localhost, sunucu üretim adresi görür
 * (hidrasyon uyuşmazlığı, yanlış paylaşım bağlantısı).
 */
const VERCEL_PRODUCTION_HOST = firstNonEmpty(
  process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
);

/**
 * Sıra: açık ayar → Vercel üretim alan adı → yerel. Vercel'de değişken
 * unutulursa site haritası localhost adresleri yaymasın diye ikinci basamak
 * var; o hata sessiz ama pahalıdır.
 */
export const SITE_URL = (
  firstNonEmpty(
    process.env.NEXT_PUBLIC_SITE_URL,
    VERCEL_PRODUCTION_HOST ? `https://${VERCEL_PRODUCTION_HOST}` : undefined,
  ) ?? "http://localhost:3000"
).replace(/\/$/, "");

/**
 * Önizleme dağıtımları dizine girmez: aynı içerik ikinci bir adreste kopya
 * sayılır. Kendi sunucundaki ikinci kopya (staging) `SITE_INDEXABLE=false`
 * ile çıkar (guides/11 § 4). Bayrak yalnızca KAPATIR: önizlemeyi açamaz,
 * tam "false" dışındaki değer varsayılana düşer.
 *
 * Derleme zamanında okunur (robots ve sitemap statik üretilir), yani
 * değişken build'den ÖNCE ortamda olmalı. Sunucuda anlamlı (robots,
 * metadata); istemci paketinde iki değişken de yok, hep `true`.
 */
export const INDEXABLE =
  process.env.VERCEL_ENV !== "preview" && process.env.SITE_INDEXABLE?.trim() !== "false";
