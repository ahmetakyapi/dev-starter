import { ArrowRight } from "lucide-react";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { buttonClass } from "@/components/ui/Button";
import { finalCta } from "@/lib/content";

/*
 * Kapanış: sayfanın son eylemi. Hero ile aynı etiket ve aynı adres (tek
 * kayıt niyeti, tek etiket). Degradeli `brand` düğme burada ikinci kez
 * görünür ama hero ile aynı ekrana hiç düşmez: kural "ekranda bir kez".
 */
export function FinalCta() {
  return (
    <section aria-labelledby="kapanis-baslik" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-24">
      <Reveal>
        <div className="rounded-xl border border-line bg-surface-raised px-6 py-14 text-center sm:px-12 sm:py-20">
          <h2 id="kapanis-baslik" className="text-heading font-bold sm:text-display">
            {finalCta.title}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lead text-soft">{finalCta.description}</p>
          <div className="mt-8 flex justify-center">
            <Magnetic>
              <a href={finalCta.primary.href} className={buttonClass({ variant: "brand", size: "lg" })}>
                {finalCta.primary.label}
                <ArrowRight aria-hidden />
              </a>
            </Magnetic>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
