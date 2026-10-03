import { hero } from "@/lib/content";
import { HeroActions, HeroShell, HeroTitle } from "./shared";

/**
 * Tüm genişlikte dev tipografi: mesajın kendisi tasarım. Açıklama yok;
 * başlığın altında tek satırlık künye ve eylemler, ince bir çizgiyle ayrılmış.
 */
export function StatementHero() {
  return (
    <HeroShell scene={hero.scene}>
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-16 sm:px-6 sm:pt-20 lg:pt-24 lg:pb-24">
        <HeroTitle lines={hero.title} inkAll className="statement-title" />
        <div className="mt-10 flex flex-col gap-6 border-t border-line pt-6 sm:mt-14 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-small text-muted">{hero.meta}</p>
          <HeroActions primary={hero.primary} secondary={hero.secondary} />
        </div>
      </div>
    </HeroShell>
  );
}
