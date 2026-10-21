/**
 * Tema tek kaynaktan: çerez. Sayfa yine STATİK (`○`): sunucu çerezi okumaz,
 * `<html data-theme>` varsayılanla basılır ve `<head>`deki küçük betik
 * (`THEME_SCRIPT`) ilk boyamadan ÖNCE çerezdeki temayı yazar. İçeriği herkese
 * aynı olan bir tanıtım sayfasında kök layout'ta `cookies()` her ziyareti bir
 * fonksiyon çağrısına çevirir ve CDN önbelleğini kapatır; yanlış takas
 * (guides/03-theming.md § 2b, mistakes.md #93). next-themes yine yok.
 *
 * Bu dosya İKİ TARAFTAN okunur (ThemeToggle çerezi istemcide yazar), o yüzden
 * `next/headers` burada duramaz: istemci paketine girdiği an derleme kırılır.
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
 * `themeColor`, onu güncelleyen betik ve ThemeToggle, manifest, paylaşım
 * görseli). Kaynak `app/globals.css` → `--page-bg`; orada değişirse burada
 * da değişir.
 */
export const THEME_COLOR = { dark: "#070d16", light: "#f7f9fb" } as const satisfies Record<Theme, string>;

/** Çerez bir yıl yaşar; tercih her ziyarette yenilenmek zorunda kalmaz. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/**
 * `<head>`de, gövdeden önce çalışır: çerezdeki temayı `<html data-theme>`a
 * yazar; tema varsayılandan farklıysa o temanın zeminiyle KENDİ
 * `meta[name=theme-color]`ını head'in başına ekler. Sunucunun bastığı meta
 * (statik viewport, varsayılan renk) değiştirilmez: içeriği değişirse React
 * hidrasyonda onu tanımaz ve varsayılan renkli bir kopyasını ekler. Tarayıcı
 * belge sırasındaki ilk metayı kullanır; ThemeToggle da ilkini günceller.
 * Tanımsız ya da bilinmeyen çerez varsayılana düşer; bir hata sayfanın geri
 * kalanını durdurmasın diye `try`. Sabitler buradan gömülür: üçüncü bir tema
 * (guides/03 § 5) betiğe de girer.
 */
export const THEME_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(${THEMES.join("|")})(?:;|$)/);var t=m?m[1]:${JSON.stringify(DEFAULT_THEME)};document.documentElement.dataset.theme=t;if(t!==${JSON.stringify(DEFAULT_THEME)}){var e=document.createElement("meta");e.name="theme-color";e.content=${JSON.stringify(THEME_COLOR)}[t];document.head.prepend(e)}}catch(e){}})()`;
