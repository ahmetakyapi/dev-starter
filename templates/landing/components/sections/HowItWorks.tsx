import { steps } from "@/lib/content";
import { HowItWorksStage } from "./HowItWorksStage";
import { SectionHeading } from "./SectionHeading";

/*
 * Nasıl çalışır: sayfanın TON VURGUSU. Bölüm tam genişlikte gri kuyu
 * (`bg-surface`) üstünde; koyu zeminli bir "vurgu bölümü" yerine tek tema
 * içinde ton farkı: beyaz sayfada ritim kırılır, panel beyaz karo olarak öne
 * çıkar. Kaydırmaya bağlı sahne `HowItWorksStage`te.
 */
export function HowItWorks() {
  return (
    <section aria-labelledby="nasil-baslik" id="nasil" className="bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <SectionHeading id="nasil-baslik" title={steps.title} description={steps.description} />
        <HowItWorksStage />
      </div>
    </section>
  );
}
