import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { organization } from "@/lib/content";
import { INDEXABLE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { jsonLd } from "@/lib/structured-data";
import { PALETTE, THEME_COLOR, getTheme } from "@/lib/theme";
import "./globals.css";
// Landing'e özgü hareket ve yerleşim kuralları; sistem dosyası (globals.css)
// nextjs-fullstack ile birebir aynı kalsın diye ayrı dosyada.
import "./landing.css";

/*
 * TUZAK: next/font `variable` adı @theme'deki adla aynı olursa
 * (`--font-sans: var(--font-sans)`) değişken kendine başvurur ve font
 * sessizce sistem yazı tipine düşer. Bu yüzden `-face` soneki.
 * Manrope değişken bir aile: `weight` verilmez, eksen tek dosyada gelir.
 */
const sans = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-sans-face", display: "swap" });
const mono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-mono-face",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "tr_TR", url: "/" },
  twitter: { card: "summary_large_image" },
  robots: INDEXABLE ? { index: true, follow: true } : { index: false, follow: false },
};

/* Tarayıcı çubuğunun rengi işletim sisteminden değil SİTENİN temasından. */
export async function generateViewport(): Promise<Viewport> {
  const theme = await getTheme();
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: THEME_COLOR[theme],
  };
}

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

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Tema sunucuda, çerezden: ilk HTML doğru temayla gelir, satır içi betik yok.
  const theme = await getTheme();

  return (
    <html
      lang="tr"
      data-theme={theme}
      data-palette={PALETTE}
      // Tema düğmesi özniteliği istemcide değiştirir; sonraki sunucu çizimi
      // aynı değeri basar ama araya giren kısa farkı React raporlamasın.
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable}`}
    >
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
