/**
 * Tema tek kaynaktan: çerez. Sunucu `<html data-theme>` özniteliğini ilk
 * yanıtta basar; satır içi betik yok, ilk boyamada yanlış tema (FOUC) yok.
 * next-themes bu yüzden kullanılmıyor: o, temayı istemcide sonradan yazar.
 *
 * Bu dosya İKİ TARAFTAN okunur (ThemeToggle çerezi istemcide yazar), o yüzden
 * `next/headers` burada duramaz: istemci paketine girdiği an derleme kırılır.
 * Çerezi okuyan `getTheme()` ayrı dosyada: `lib/theme.server.ts`.
 */
export const THEME_COOKIE = "theme";
export const THEMES = ["dark", "light"] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = "light";

/**
 * Renk paleti: `<html data-palette>`. Kimlik (token adları, degrade
 * disiplini, hareket, ölçekler) her projede aynı; palet projeye göre seçilir.
 * Şablonda yalnızca `signature` tanımlı (app/globals.css). Başka palet için
 * oradaki iki bloğu ez ve bu sabiti değiştir.
 */
export const PALETTE = "signature" as const;

/**
 * Her temanın sayfa zemini, CSS'in okunamadığı yerler için (viewport
 * `themeColor` ve onu tıklamada güncelleyen ThemeToggle, manifest, paylaşım
 * görseli). Kaynak `app/globals.css` → `--page-bg`; orada değişirse burada
 * da değişir.
 */
export const THEME_COLOR = { dark: "#070d16", light: "#f7f9fb" } as const satisfies Record<Theme, string>;

/** Çerez bir yıl yaşar; tercih her ziyarette yenilenmek zorunda kalmaz. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}
