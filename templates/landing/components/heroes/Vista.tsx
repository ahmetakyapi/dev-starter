import { ArrowRight } from "lucide-react";
import { Wallpaper } from "@/components/ui/wallpaper";
import { hero, heroScenes } from "@/lib/content";
import { HeroActions } from "./shared";

/**
 * vista: tam ekran manzara (Zirvede Akşam), sol üstte dev SERİF başlık,
 * altında tek eylem; iki alt köşede cam künye kartı (biri bağlantılı).
 * Marka havası ürün ekranından önde ve mesaj iki cümleye sığıyorsa.
 * Manzara turu (2026-11-28): ürün değil yer anlatılır, ürün aşağıdaki
 * bölümlerde.
 *
 * NEDEN BÖYLE: başlık gökyüzünde (sahnenin en sakin yeri), cam kartlar ön
 * plandaki koyu tepenin üstünde: ikisi de illüstrasyonun boş alanına oturur,
 * özneyle (zirve, güneş) çakışmaz. Kartlar `md` altında alt alta, başlığın
 * akışında; görsel üstüne mutlak konumla binmez, taşma olmaz.
 *
 * Zemin temayla DÖNMEZ (akşam iki temada da akşam): yazı sabit açık
 * (`text-on-brand`), sol üstte ve altta yumuşak örtü (`bg-scrim` maskeyle)
 * kontrastı iki temada aynı tutar. Başlık (LCP) düz metin, ilk karede görünür;
 * serif yüz `.hero-serif` (landing.css), yüklenmezse display yüzüne düşer.
 */
export function VistaHero() {
  const { captions } = heroScenes.vista;
  return (
    <section id="ust" aria-label="Giriş" className="relative isolate overflow-hidden bg-strong">
      <Wallpaper scene="summit" className="absolute inset-0 -z-10" />
      <div aria-hidden className="vista-scrim absolute inset-0 -z-10 bg-scrim" />
      <div className="mx-auto flex min-h-[min(48rem,100dvh)] max-w-7xl flex-col px-4 pt-20 pb-6 sm:px-6 sm:pt-28 sm:pb-10">
        <h1 className="hero-serif hero-serif-xl max-w-4xl text-balance text-on-brand">
          {hero.title.map((line) => (
            <span key={line.text} className="block">
              {line.text}
            </span>
          ))}
        </h1>
        <p className="mt-6 max-w-lg text-lead text-on-brand/85">{hero.description}</p>
        <HeroActions primary={hero.primary} secondary={null} tone="media" className="mt-8" />

        <div className="mt-14 grid gap-3 md:mt-auto md:grid-cols-2 md:items-end md:gap-6 md:pt-16">
          {captions.map((caption, index) => (
            <div
              key={caption.text}
              className={
                "rounded-xl bg-on-brand/10 p-5 text-on-brand ring-1 ring-on-brand/20 backdrop-blur-md ring-inset sm:p-6 md:max-w-md" +
                (index === 1 ? " md:justify-self-end" : "")
              }
            >
              <p className="text-lead text-pretty text-on-brand/90">{caption.text}</p>
              {caption.link ? (
                <a
                  href={caption.link.href}
                  className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-read font-medium text-on-brand underline decoration-on-brand/40 underline-offset-4 hover:decoration-on-brand"
                >
                  {caption.link.label}
                  <ArrowRight aria-hidden className="size-4" />
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
