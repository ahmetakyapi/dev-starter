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
import { getTheme } from "@/lib/theme";

/*
 * `?hero=statement` yalnızca GELİŞTİRMEDE okunur: yedi düzeni aynı sunucuda
 * yan yana denemek için. Üretimde parametre yok sayılır; yoksa aynı sayfa
 * yedi farklı adreste yedi farklı içerikle dizine girebilirdi.
 */
async function resolveVariant(searchParams: PageProps<"/">["searchParams"]): Promise<HeroVariant> {
  if (process.env.NODE_ENV !== "development") return hero.variant;
  const requested = (await searchParams).hero;
  return isHeroVariant(requested) ? requested : hero.variant;
}

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const [theme, variant] = await Promise.all([getTheme(), resolveVariant(searchParams)]);

  return (
    <>
      <ScrollProgress />
      <SiteHeader initialTheme={theme} />
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
