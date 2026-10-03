import { hero } from "@/lib/content";
import { FrameTilt } from "./FrameTilt";
import { HeroActions, HeroEyebrow, HeroMedia, HeroShell, HeroTitle } from "./shared";

/** Üstte başlık ve eylem, altında kaydırdıkça düzleşen ürün çerçevesi. */
export function ProductFrameHero() {
  return (
    <HeroShell scene={false}>
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-16 lg:pb-24">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <HeroEyebrow>{hero.eyebrow}</HeroEyebrow>
            <HeroTitle lines={hero.title} className="text-display sm:text-hero" />
            <p className="mt-6 max-w-xl text-lead text-soft">{hero.description}</p>
          </div>
          <HeroActions primary={hero.primary} secondary={hero.secondary} className="shrink-0" />
        </div>
        <FrameTilt className="mt-12 sm:mt-16">
          {/* Yüzen tek katman: gölge burada meşru (ton farkı kuralının istisnası). */}
          <HeroMedia image={hero.image} sizes="(min-width: 1152px) 1104px, 100vw" className="aspect-[16/10] w-full shadow-floating" />
        </FrameTilt>
      </div>
    </HeroShell>
  );
}
