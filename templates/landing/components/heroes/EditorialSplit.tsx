import { hero } from "@/lib/content";
import { HeroActions, HeroEyebrow, HeroMedia, HeroShell, HeroTitle } from "./shared";

/** Solda başlık ve eylem, sağda gerçek ürün görseli. Telefonda görsel alta iner. */
export function EditorialSplitHero() {
  return (
    <HeroShell scene={hero.scene}>
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-16 sm:px-6 sm:pt-16 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-12 lg:gap-12 lg:py-16">
        <div className="min-w-0 lg:col-span-7">
          <HeroEyebrow>{hero.eyebrow}</HeroEyebrow>
          <HeroTitle lines={hero.title} className="text-display sm:text-hero" />
          <p className="mt-6 max-w-xl text-lead text-soft">{hero.description}</p>
          <HeroActions primary={hero.primary} secondary={hero.secondary} className="mt-8" />
        </div>
        <HeroMedia
          image={hero.image}
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="aspect-[4/3] w-full lg:col-span-5 lg:aspect-[4/5]"
        />
      </div>
    </HeroShell>
  );
}
