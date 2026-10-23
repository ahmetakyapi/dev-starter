import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { INDEXABLE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { jsonLd } from "@/lib/structured-data";
import { PALETTE, THEME_COLOR } from "@/lib/theme";
import { getTheme } from "@/lib/theme.server";
import "./globals.css";

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
  // Başlık ve açıklama burada YOK: Next onları her sayfanın kendisinden türetir.
  openGraph: { type: "website", siteName: SITE_NAME, locale: "tr_TR" },
  twitter: { card: "summary_large_image" },
  robots: INDEXABLE ? { index: true, follow: true } : { index: false, follow: false },
};

/* Tarayıcı çubuğunun rengi işletim sisteminden değil SİTENİN temasından:
   koyu temayı seçmiş biri açık sistemde beyaz bir çubuk görmesin. */
export async function generateViewport(): Promise<Viewport> {
  const theme = await getTheme();
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: THEME_COLOR[theme],
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Tema sunucuda, çerezden: ilk HTML doğru temayla gelir, satır içi script yok.
  const theme = await getTheme();

  return (
    <html
      lang="tr"
      data-theme={theme}
      data-palette={PALETTE}
      // Tema düğmesi özniteliği istemcide değiştirir; sonraki sunucu çizimi
      // aynı değeri basar ama araya giren kısa farkı React raporlamasın.
      suppressHydrationWarning
      // `iso`: anatomy figür kitinin token kapsamı. Kit `.iso[data-theme="light"]`
      // ile açık temaya geçer; tema bu öğede olduğu için ThemeToggle figürü de
      // çevirir. Kit kurulmadıysa (scripts/add-figure-kit.mjs) sınıfın etkisi yok.
      className={`iso ${sans.variable} ${mono.variable}`}
    >
      <body className="min-h-dvh bg-page font-sans text-body antialiased">
        <a
          href="#icerik"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-base focus:font-semibold focus:text-on-primary"
        >
          İçeriğe Geç
        </a>
        <MotionProvider>{children}</MotionProvider>
        {/* JavaScript yoksa Reveal öğeleri opacity 0'da kalmasın. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
              description: SITE_DESCRIPTION,
              url: SITE_URL,
            }),
          }}
        />
      </body>
    </html>
  );
}
