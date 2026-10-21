import type { Metadata } from "next";
import { Hero } from "@/components/heroes";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { Faq } from "@/components/sections/Faq";
import { Features } from "@/components/sections/Features";
import { FinalCta } from "@/components/sections/FinalCta";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Logos } from "@/components/sections/Logos";
import { Pricing } from "@/components/sections/Pricing";
import { Testimonials } from "@/components/sections/Testimonials";
import { hero, isHeroVariant, type HeroVariant } from "@/lib/content";
import { OPEN_GRAPH } from "@/lib/site";
import { DEFAULT_THEME } from "@/lib/theme";

/* Kanonik adres SAYFA düzeyinde: kök layout'a yazılsa her alt rota "/"ye
   kanonikleşirdi. Herkese açık her yeni sayfa kendi yolunu verir; og:url
   de öyle. `openGraph` üst düzeyde sığ birleşir, layout'unkini ezer: taban
   (`OPEN_GRAPH`) yayılmazsa site adı, dil ve tür düşer. */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...OPEN_GRAPH, url: "/" },
};

/*
 * `?hero=statement` yalnızca GELİŞTİRMEDE okunur: yedi düzeni aynı sunucuda
 * yan yana denemek için. Üretimde parametre yok sayılır; yoksa aynı sayfa
 * yedi farklı adreste yedi farklı içerikle dizine girebilirdi. Üretimde
 * `searchParams` hiç beklenmediği için sayfa statik kalır (`○`).
 */
async function resolveVariant(searchParams: PageProps<"/">["searchParams"]): Promise<HeroVariant> {
  if (process.env.NODE_ENV !== "development") return hero.variant;
  const requested = (await searchParams).hero;
  return isHeroVariant(requested) ? requested : hero.variant;
}

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const variant = await resolveVariant(searchParams);

  return (
    <>
      <ScrollProgress />
      {/* Sunucu çerezi okumaz (sayfa statik); düğme hidrasyondan hemen sonra
          `<html data-theme>`daki gerçek temaya geçer. */}
      <SiteHeader initialTheme={DEFAULT_THEME} />
      <main id="icerik">
        <Hero variant={variant} />
        <Logos />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
