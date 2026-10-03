import {
  Bricolage_Grotesque,
  Geist,
  Geist_Mono,
  IBM_Plex_Mono,
  Instrument_Sans,
  Instrument_Serif,
  JetBrains_Mono,
  Manrope,
  Newsreader,
  Onest,
  Plus_Jakarta_Sans,
  Schibsted_Grotesk,
  Space_Grotesk,
} from "next/font/google";

/**
 * Font eşleşmeleri (preset). Kataloğun tamamı, seçim tablosu ve gerekçeler
 * `guides/09-typography.md`te.
 *
 * KULLANIM: bu dosyayı `app/fonts.ts` olarak kopyala, KULLANMADIĞIN
 * presetlerin yükleyicilerini sil (ölçüm aşağıda), kök layout'ta:
 *
 *   import { fontClass } from "./fonts";
 *   <html className={fontClass("signature")} …>
 *
 * ve `theme-fonts.css`teki `@theme inline` satırlarını globals.css'e ekle.
 *
 * KURALLAR (hepsi bir hatadan geldi):
 * - `subsets: ["latin", "latin-ext"]`: Türkçenin ğ, ş, İ, ı harfleri
 *   `latin-ext` alt kümesinde. Yalnızca `latin` istenirse bu harfler yedek
 *   sistem fontuyla çizilir ve kelimenin ortasında yazı tipi değişir.
 * - Değişken fontta `weight` VERİLMEZ: tek dosya bütün ağırlık eksenini
 *   taşır. Ağırlık dizisi vermek her ağırlık için ayrı dosya indirtir.
 *   Değişken olmayanlarda (Instrument Serif, IBM Plex Mono) zorunlu.
 * - `display: "swap"`: font gelene kadar metin yedek fontla görünür, boş
 *   kalmaz. Next `adjustFontFallback` ile yedeğin ölçülerini ayarlar; geçişte
 *   satırlar zıplamaz.
 * - Değişken adları `--font-*-face` SONEKLİ. `@theme inline`daki
 *   `--font-sans: var(--font-sans)` kendine başvurur ve sessizce sistem
 *   fontuna düşer (Açılış Zili'nde yaşandı). Köprü `theme-fonts.css`te.
 *
 * TÜRKÇE GLİF TESTİ (Ekim 2026, woff2 dosyalarının cmap'i okunarak ve
 * "Ğğ Şş İı Öö Çç Üü: Işık, Gölge, Ağaç" çizilerek): on üç ailenin hepsinde
 * ğ ş İ ı var, noktalar ve kancalar yerinde. Fark ₺ işaretinde (U+20BA):
 *   - YOK, sistem fontuna düşer: Geist, Geist Mono, Instrument Sans,
 *     Instrument Serif, JetBrains Mono. Tutar bu fontlarla yazılırsa ₺
 *     komşu rakamlardan farklı bir yazı tipiyle çizilir.
 *   - VAR: Manrope, Plus Jakarta Sans, Onest, Space Grotesk, Bricolage,
 *     Newsreader, IBM Plex Mono, Schibsted Grotesk. Schibsted'in ₺'si
 *     alışılmış çapa biçimi değil, iki çizgili bir "L"; ₤ gibi okunabilir.
 *   TL tutarı yoğun bir üründe (finans, e-ticaret) ya ₺ taşıyan bir preset
 *   seç ya da birimi "TL" diye yaz.
 *
 * ROLLER: `sans` arayüz ve gövde, `display` başlık (yoksa sans kullanılır),
 * `mono` kod, künye ve sayı tabloları. Bir aile iki rolde geçiyorsa iki ayrı
 * yükleyici çağrısı var (değişken adı rolü taşır). Next onları AYRI dosya
 * kümesi olarak üretir (ölçüldü: Schibsted iki rolde iki kez indi); tek
 * preset tuttuğunda aile zaten bir kez kalır.
 *
 * ÖLÇÜLDÜ (Next 16.3, üretim derlemesi): next/font, modülde TANIMLI her
 * yükleyiciyi sayfaya bağlar; hangi `variable`ın kullanıldığına bakmaz. Bu
 * dosyayı olduğu gibi içe aktarıp yalnızca `signature`ı kullanan bir sayfa
 * 32 woff2 ön yüklemesi (`Link` başlığı) ve 80 `@font-face` kuralı aldı;
 * yalnızca iki aile yükleyen şablon sayfası 6 ön yükleme. Kopyaladıktan
 * sonra seçtiğin presetin yükleyicileri dışındakileri SİL.
 */

/* Seçenekler DEĞİŞMEZ yazılır: next/font onları derleme anında okur, bir
   sabitten yayılan dizi ("...LATIN") derlemeyi kırar. */

/* --- Gövde / arayüz (--font-sans-face) ----------------------------------- */
const schibstedSans = Schibsted_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-sans-face", display: "swap" });
const manrope = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-sans-face", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-sans-face", display: "swap" });
const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-sans-face", display: "swap" });
const instrumentSans = Instrument_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-sans-face", display: "swap" });
const onest = Onest({ subsets: ["latin", "latin-ext"], variable: "--font-sans-face", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-sans-face", display: "swap" });

/* --- Başlık (--font-display-face) ---------------------------------------- */
const schibstedDisplay = Schibsted_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-display-face", display: "swap" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display-face",
  display: "swap",
});
const newsreader = Newsreader({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--font-display-face",
  display: "swap",
});
const bricolage = Bricolage_Grotesque({ subsets: ["latin", "latin-ext"], axes: ["opsz"], variable: "--font-display-face", display: "swap" });

/* --- Mono (--font-mono-face) --------------------------------------------- */
const plexMono = IBM_Plex_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "500"], variable: "--font-mono-face", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-mono-face", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-mono-face", display: "swap" });

type Loaded = { variable: string };
type Preset = {
  sans: Loaded;
  display?: Loaded;
  mono: Loaded;
  /** Karakter ve uygun olduğu yer; guides/09'daki tablonun kısası. */
  note: string;
};

export const FONT_PRESETS = {
  /** Varsayılan. Açılış Zili. Sıkı, gazeteci bir grotesk; rakamları dar. */
  signature: {
    sans: schibstedSans,
    mono: plexMono,
    note: "Finans, araç, editoryal arayüz. signature paleti. tnum virgülü genişletir: theme-fonts.css son blok.",
  },
  /** ahmetakyapi.com. Yuvarlak hatlı, geniş, sıcak. */
  studio: {
    sans: manrope,
    mono: plexMono,
    note: "Portfolyo, kişisel site, tanıtım. signature ya da iris.",
  },
  /** Mimio. Grotesk başlık, yumuşak gövde. */
  calm: {
    sans: jakarta,
    display: schibstedDisplay,
    mono: plexMono,
    note: "Sağlık, terapi, eğitim; sakin ürün arayüzü. verdant.",
  },
  /** Nötr, dar, yoğun arayüz için. */
  product: {
    sans: geist,
    mono: geistMono,
    note: "SaaS, geliştirici aracı, pano. signature ya da iris. ₺ yok.",
  },
  /** Serif başlık + temiz gövde: dergi kapağı hissi. */
  editorial: {
    sans: instrumentSans,
    display: instrumentSerif,
    mono: jetbrains,
    note: "Tanıtım sayfası, ajans, kültür. Başlık yalnızca büyük puntoda. ₺ yok.",
  },
  /** Uzun okuma: optik boyutlu serif başlık. */
  longform: {
    sans: instrumentSans,
    display: newsreader,
    mono: plexMono,
    note: "Blog, bülten, rehber yazısı. signature. Gövdede ₺ yok.",
  },
  /** Karakterli başlık, sade gövde. */
  playful: {
    sans: onest,
    display: bricolage,
    mono: jetbrains,
    note: "Oyun, topluluk, etkinlik. ember.",
  },
  /** Geometrik, teknik. */
  technical: {
    sans: spaceGrotesk,
    mono: jetbrains,
    note: "Yapay zekâ, geliştirici ürünü, teknik tanıtım. iris.",
  },
  /** Yuvarlak, cana yakın tüketici uygulaması. */
  friendly: {
    sans: jakarta,
    mono: geistMono,
    note: "Tüketici uygulaması, kayıt akışı, mobil ağırlıklı ürün. verdant ya da ember.",
  },
  /** Dar ve okunaklı; küçük puntoda yoğun tablo. */
  dense: {
    sans: onest,
    mono: jetbrains,
    note: "Yönetim paneli, veri tablosu, iç araç. signature.",
  },
} as const satisfies Record<string, Preset>;

export type FontPreset = keyof typeof FONT_PRESETS;

/** `<html className>` için: presetin bütün değişkenleri. */
export function fontClass(name: FontPreset): string {
  const preset: Preset = FONT_PRESETS[name];
  return [preset.sans.variable, preset.display?.variable, preset.mono.variable].filter(Boolean).join(" ");
}
