import { ToneText } from "@/components/ui/tone-text";
import { Wallpaper } from "@/components/ui/wallpaper";
import { hero } from "@/lib/content";
import { HeroActions } from "./shared";

/**
 * atmosphere: tam genişlikte koyu görsel zemin ("ipek": ışık saçan tek bir
 * dalga), ortada başlık ve eylemler. Karakteri başlıktan gelir: ink'li
 * (çözüm) satır serif italik, ilk satır sade beyaz; tek vurgu, süs yok.
 * Logo şeridi burada yok: hemen altındaki `Logos` bölümü zaten taşıyor.
 *
 * Zemin illüstrasyondur (`Wallpaper`, SVG): üçüncü taraf görsel yok, ağ isteği
 * yok. Zemin temayla DÖNMEZ (koyu sahne iki temada da koyu), bu yüzden yazı
 * sabit açık (`text-on-brand`) ve sahnenin üstünde hafif bir örtü (`bg-scrim`)
 * var: kontrast iki temada da aynı ve yüksek. Başlık (LCP) ilk karede görünür:
 * `ToneText` düz metindir, opaklık oynamaz. İkincil eylem dolgulu cam: yarı
 * saydam yüzey + ince çerçeve, sahne üstünde kaybolmaz.
 */
export function AtmosphereHero() {
  return (
    <section id="ust" aria-label="Giriş" className="relative isolate overflow-hidden bg-strong">
      <Wallpaper scene="silk" className="absolute inset-0 -z-10" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-scrim" />
      <div className="mx-auto flex min-h-[min(44rem,100dvh)] max-w-4xl flex-col items-center justify-center px-4 pt-24 pb-24 text-center sm:px-6">
        <ToneText as="h1" tone="media" className="text-display font-semibold sm:text-hero">
          {hero.title.map((line) =>
            line.ink ? (
              <em key={line.text} className="block">
                {line.text}
              </em>
            ) : (
              <span key={line.text} className="block">
                {line.text}
              </span>
            ),
          )}
        </ToneText>
        <p className="mt-6 max-w-xl text-lead text-on-brand/85">{hero.description}</p>
        <HeroActions primary={hero.primary} secondary={hero.secondary} tone="media" className="mt-8 justify-center" />
      </div>
    </section>
  );
}
