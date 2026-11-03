import { Reveal } from "@/components/motion/Reveal";
import { buttonClass } from "@/components/ui/Button";
import { pricing } from "@/lib/content";
import { PricingPlans } from "./PricingPlans";
import { SectionHeading } from "./SectionHeading";

/*
 * Fiyatlar: YOĞUN bölüm. İki plan yan yana, kurumsal teklif altta tek satır.
 * Üç eşit kart yerine 2 + 1: kurumsal bir "plan" değil, bir görüşme.
 * Dönem seçici ve kartlar `PricingPlans`ta (istemci); bölüm kabı sunucuda.
 */
export function Pricing() {
  return (
    <section aria-labelledby="fiyatlar-baslik" id="fiyatlar" className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-28">
      <SectionHeading id="fiyatlar-baslik" title={pricing.title} description={pricing.description} />
      <Reveal>
        <PricingPlans plans={pricing.plans} billing={pricing.billing} />
      </Reveal>
      <Reveal className="mt-4">
        <div className="flex flex-col gap-4 rounded-2xl bg-surface edge-lit p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="min-w-0">
            <h3 className="text-title font-semibold">{pricing.enterprise.name}</h3>
            <p className="mt-1 text-base text-soft">{pricing.enterprise.description}</p>
          </div>
          <a href={pricing.enterprise.cta.href} className={buttonClass({ variant: "secondary", size: "lg" })}>
            {pricing.enterprise.cta.label}
          </a>
        </div>
      </Reveal>
    </section>
  );
}
