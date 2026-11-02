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
import { hero, type HeroVariant } from "@/lib/content";
import { DEFAULT_THEME } from "@/lib/theme";

/**
 * `app/page.tsx` ile AYNI düzen. Sayfanın kendisi çizilmez: async sunucu
 * bileşeni ve `searchParams` bekliyor (yalnız geliştirmede `?hero=` okur).
 * Bölümlerin hiçbiri async değil, istemcide doğrudan çizilir. page.tsx'e
 * bölüm eklenir ya da sırası değişirse burası da değişir.
 */
export function LandingPage({ variant = hero.variant }: { variant?: HeroVariant }) {
  return (
    <div className="min-h-dvh bg-page text-body">
      <ScrollProgress />
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
    </div>
  );
}
