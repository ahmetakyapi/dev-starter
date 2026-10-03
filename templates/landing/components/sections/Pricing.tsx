import { Check } from "lucide-react";
import { Reveal, RevealItem } from "@/components/motion/Reveal";
import { buttonClass } from "@/components/ui/Button";
import { pricing } from "@/lib/content";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

/*
 * Fiyatlar: iki plan yan yana, kurumsal teklif altta tek satır. Üç eşit
 * kart yerine 2 + 1: kurumsal bir "plan" değil, bir görüşme.
 * Öne çıkan plan degrade değil vurgu çizgisi ve yükseltilmiş tonla ayrılır;
 * düğmesi `primary` (sayfanın degradeli `brand` düğmeleri hero'da ve kapanışta).
 */
export function Pricing() {
  return (
    <section aria-labelledby="fiyatlar-baslik" id="fiyatlar" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <SectionHeading id="fiyatlar-baslik" title={pricing.title} description={pricing.description} />
      <ul className="mt-12 grid gap-4 md:grid-cols-2">
        {pricing.plans.map((plan, index) => {
          const highlighted = "highlight" in plan && Boolean(plan.highlight);
          return (
            <RevealItem
              key={plan.name}
              as="li"
              index={index}
              className={cn(
                "flex min-w-0 flex-col rounded-lg border p-6 sm:p-8",
                highlighted ? "border-primary bg-surface-raised" : "border-line bg-surface",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-title font-semibold">{plan.name}</h3>
                {highlighted ? (
                  <span className="rounded-full bg-primary-wash px-3 py-1 text-small font-semibold text-primary-ink">
                    {plan.highlight}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-base text-soft">{plan.description}</p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="text-display font-bold tracking-tight text-strong">{plan.price}</span>
                <span className="text-small text-muted">/ {plan.period}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((item) => (
                  <li key={item} className="flex gap-3 text-base text-body">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary-ink" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href={plan.cta.href}
                className={buttonClass({ variant: highlighted ? "primary" : "secondary", size: "lg", className: "mt-8 w-full" })}
              >
                {plan.cta.label}
              </a>
            </RevealItem>
          );
        })}
      </ul>
      <Reveal className="mt-4">
        <div className="surface flex flex-col gap-4 rounded-lg p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
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
