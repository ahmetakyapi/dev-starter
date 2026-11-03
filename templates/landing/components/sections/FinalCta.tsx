import { ArrowRight } from "lucide-react";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { Phrases } from "@/components/text/Phrases";
import { buttonClass } from "@/components/ui/Button";
import { finalCta, hero } from "@/lib/content";

/*
 * Kapanış: sayfanın son eylemi. Hero ile aynı etiket ve aynı adres (tek
 * kayıt niyeti, tek etiket). Degradeli `brand` düğme burada ikinci kez
 * görünür ama hero ile aynı ekrana hiç düşmez: kural "ekranda bir kez".
 *
 * Büyük gri kuyu, başlık hero ölçeğinde ve sıkı: sayfa açıldığı sesle
 * kapanır. Altındaki künye hero'nunkiyle aynı (kurulum süresi, kart yok).
 */
export function FinalCta() {
  return (
    <section aria-labelledby="kapanis-baslik" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 sm:pb-28">
      <Reveal>
        <div className="edge-lit rounded-2xl bg-surface px-6 py-16 text-center sm:px-12 sm:py-24">
          <h2 id="kapanis-baslik" className="hero-display mx-auto max-w-4xl font-semibold">
            <Phrases text={finalCta.title} heading />
          </h2>
          <p className="mx-auto mt-5 max-w-md text-lead text-soft">{finalCta.description}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Magnetic>
              <a href={finalCta.primary.href} className={buttonClass({ variant: "brand", size: "lg" })}>
                {finalCta.primary.label}
                <ArrowRight aria-hidden />
              </a>
            </Magnetic>
            <a href={finalCta.secondary.href} className={buttonClass({ variant: "secondary", size: "lg" })}>
              {finalCta.secondary.label}
            </a>
          </div>
          {hero.meta ? <p className="mt-5 text-small text-muted">{hero.meta}</p> : null}
        </div>
      </Reveal>
    </section>
  );
}
