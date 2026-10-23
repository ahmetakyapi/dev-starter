import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { organization } from "@/lib/content";
import { INDEXABLE, OPEN_GRAPH, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { jsonLd } from "@/lib/structured-data";
import { DEFAULT_THEME, PALETTE, THEME_COLOR, THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";
// Landing'e özgü hareket ve yerleşim kuralları; sistem dosyası (globals.css)
// nextjs-fullstack ile birebir aynı kalsın diye ayrı dosyada.
import "./landing.css";

/*
 * TUZAK: next/font `variable` adı @theme'deki adla aynı olursa
 * (`--font-sans: var(--font-sans)`) değişken kendine başvurur ve font
 * sessizce sistem yazı tipine düşer. Bu yüzden `-face` soneki.
 * Manrope değişken bir aile: `weight` verilmez, eksen tek dosyada gelir.
 * IBM Plex Mono değişken değil: her ağırlık alt küme başına ayrı, önceden
 * yüklenen bir dosya. Mono yalnızca künye ve etiketlerde, 400'de; kalın mono
 * gerekirse ağırlığı o gün ekle (guides/09 § 6).
 */
const sans = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-sans-face", display: "swap" });
const mono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-mono-face",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // Kanonik adres ve og:url burada YOK: kök layout'ta her alt rotaya miras
  // kalır ve yeni sayfa kendini ana sayfanın kopyası ilan eder (app/page.tsx).
  openGraph: OPEN_GRAPH,
  twitter: { card: "summary_large_image" },
  robots: INDEXABLE ? { index: true, follow: true } : { index: false, follow: false },
};

/* Tarayıcı çubuğunun rengi işletim sisteminden değil SİTENİN temasından.
   Statik: varsayılan temanın rengi basılır, çerezdeki tema farklıysa
   `THEME_SCRIPT` ilk boyamadan önce, düğme de tıklamada günceller. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: THEME_COLOR[DEFAULT_THEME],
};

/* Organization + WebSite, tek grafikte; `@id` ile birbirine bağlı. */
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: organization.name,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      ...(organization.sameAs.length ? { sameAs: organization.sameAs } : {}),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      inLanguage: "tr-TR",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

/*
 * Layout async DEĞİL ve `cookies()` okumaz: sayfa statik (`○`), CDN'den
 * gelir. Tema varsayılanla basılır; `<head>`deki script ilk boyamadan önce
 * çerezdeki temayı yazar (lib/theme.ts → THEME_SCRIPT, guides/03 § 2b).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="tr"
      data-theme={DEFAULT_THEME}
      data-palette={PALETTE}
      // Script özniteliği hidrasyondan önce, düğme sonra değiştirir; sunucu
      // HTML'iyle aradaki bu farkı React raporlamasın.
      suppressHydrationWarning
      // `iso`: anatomy figür kitinin token kapsamı. Kit `.iso[data-theme="light"]`
      // ile açık temaya geçer; tema bu öğede olduğu için ThemeToggle figürü de
      // çevirir. Kit kurulmadıysa (scripts/add-figure-kit.mjs) sınıfın etkisi yok.
      className={`iso ${sans.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-page font-sans text-body antialiased">
        <a
          href="#icerik"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-base focus:font-semibold focus:text-on-primary"
        >
          İçeriğe Geç
        </a>
        <MotionProvider>{children}</MotionProvider>
        {/* JavaScript yoksa Reveal öğeleri opacity 0'da kalmasın; sahne cümleleri alt alta dizilsin. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}.stage{height:auto!important}.stage-pin{position:static!important;height:auto!important}.stage-lines{gap:.75rem}.stage-line{grid-area:auto!important;opacity:1!important;transform:none!important}.frame-tilt{transform:none!important}`}</style>
        </noscript>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(STRUCTURED_DATA) }} />
      </body>
    </html>
  );
}
