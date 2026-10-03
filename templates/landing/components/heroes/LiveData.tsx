import { hero } from "@/lib/content";
import { HeroActions, HeroEyebrow, HeroShell, HeroStats, HeroTitle, asOfLabel } from "./shared";

/**
 * Başlığın yanında yuvarlanarak gelen sayılar ve hangi güne ait oldukları.
 * Damga saat değil TARİH yazar: veri günlük, dakika uydurmak sahte kesinlik olur.
 */
export function LiveDataHero() {
  return (
    <HeroShell scene={hero.scene}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 pb-16 sm:px-6 sm:pt-16 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-16">
        <div className="min-w-0 lg:col-span-7">
          <HeroEyebrow>{hero.eyebrow}</HeroEyebrow>
          <HeroTitle lines={hero.title} className="text-display sm:text-hero" />
          <p className="mt-6 max-w-xl text-lead text-soft">{hero.description}</p>
          <HeroActions primary={hero.primary} secondary={hero.secondary} className="mt-8" />
        </div>
        <div className="surface min-w-0 rounded-xl p-5 sm:p-6 lg:col-span-5">
          <HeroStats
            items={hero.stats.items}
            className="grid grid-cols-3 gap-4 lg:grid-cols-1 lg:gap-0 lg:divide-y lg:divide-line-soft lg:[&>div]:py-5 lg:[&>div:first-child]:pt-0"
            figureClassName="text-heading sm:text-display"
          />
          <p className="mt-5 border-t border-line-soft pt-4 font-mono text-micro text-muted lg:mt-0">
            <time dateTime={hero.stats.asOf}>{asOfLabel(hero.stats.asOf)}</time>
          </p>
        </div>
      </div>
    </HeroShell>
  );
}
