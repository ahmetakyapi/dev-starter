import { cookies } from "next/headers";

/**
 * Tema tek kaynaktan: çerez. Sunucu `<html data-theme>` özniteliğini ilk
 * yanıtta basar; satır içi betik yok, ilk boyamada yanlış tema (FOUC) yok.
 * next-themes bu yüzden kullanılmıyor: o, temayı istemcide sonradan yazar.
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
 * `themeColor`, manifest, paylaşım görseli). Kaynak `app/globals.css` →
 * `--page-bg`; orada değişirse burada da değişir.
 */
export const THEME_COLOR = { dark: "#070d16", light: "#f7f9fb" } as const satisfies Record<Theme, string>;

/** Çerez bir yıl yaşar; tercih her ziyarette yenilenmek zorunda kalmaz. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/** Yalnızca sunucuda: bileşen, layout ya da server action içinden. */
export async function getTheme(): Promise<Theme> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : DEFAULT_THEME;
}
