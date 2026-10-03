import { hero } from "@/lib/content";
import { HeroActions, HeroEyebrow, HeroShell, HeroTitle } from "./shared";

/** Küçük, sola hizalı, bol boşluklu: içeriğin kendisi önde olan sayfalar için. Sahne yok. */
export function MinimalHero() {
  return (
    <HeroShell scene={false}>
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-14 sm:px-6 sm:pt-24 sm:pb-20">
        <div className="max-w-2xl">
          <HeroEyebrow>{hero.eyebrow}</HeroEyebrow>
          <HeroTitle lines={hero.title} className="text-display" />
          <p className="mt-5 text-lead text-soft">{hero.description}</p>
          <HeroActions primary={hero.primary} secondary={hero.secondary} className="mt-8" />
        </div>
      </div>
    </HeroShell>
  );
}
