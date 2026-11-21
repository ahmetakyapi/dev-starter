import { ToneText } from "@/components/ui/tone-text";
import { Wallpaper } from "@/components/ui/wallpaper";
import { hero } from "@/lib/content";
import { HeroActions } from "./shared";

/**
 * atmosphere: tam genişlikte görsel zemin, ortada soldan sağa açılan başlık
 * ve eylemler. Logo şeridi burada yok: hemen altındaki `Logos` bölümü zaten
 * taşıyor. Zemin illüstrasyondur (`Wallpaper`, SVG): üçüncü taraf görsel yok,
 * ağ isteği yok.
 *
 * Zemin temayla DÖNMEZ (gece sahnesi iki temada da gece), bu yüzden yazı
 * sabit açık (`text-on-brand`) ve sahnenin üstünde koyu bir örtü (`bg-scrim`)
 * var: kontrast iki temada da aynı. Başlık (LCP) ilk karede görünür:
 * `ToneText` düz metindir, opaklık oynamaz.
 */
export function AtmosphereHero() {
  const title = hero.title.map((line) => line.text).join(" ");
  return (
    <section id="ust" aria-label="Giriş" className="relative isolate overflow-hidden bg-strong">
      <Wallpaper scene="aurora" className="absolute inset-0 -z-10" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-scrim" />
      <div className="mx-auto flex min-h-[min(46rem,100dvh)] max-w-4xl flex-col items-center justify-center px-4 pt-24 pb-32 text-center sm:px-6">
        <ToneText as="h1" tone="media" fade="in" className="text-display sm:text-hero font-semibold text-balance">
          {title}
        </ToneText>
        <p className="mt-6 max-w-xl text-lead text-on-brand/80">{hero.description}</p>
        <HeroActions primary={hero.primary} secondary={hero.secondary} tone="media" className="mt-8 justify-center" />
      </div>
    </section>
  );
}
