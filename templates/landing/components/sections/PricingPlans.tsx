"use client";

import { Check } from "lucide-react";
import { m } from "motion/react";
import { useId, useState } from "react";
import { RollingNumber } from "@/components/motion/RollingNumber";
import { buttonClass } from "@/components/ui/Button";
import type { Billing, Plan } from "@/lib/content";
import { DUR, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/*
 * Plan kartları + aylık/yıllık seçici.
 *
 * Seçici yerel radyo düğmeleri (`fieldset` + gizli `input`): ok tuşları,
 * ekran okuyucu ve form davranışı tarayıcıdan. Görünen hap göstergesi eşit
 * iki sütunda `x: 0 | 100%` ile kayar (dönüşüm, ölçüm yok).
 *
 * Fiyat `RollingNumber`la YENİDEN YUVARLANIR: anahtar dönem olduğu için
 * seçim değişince sayı yeniden bağlanır ve CSS animasyonu baştan oynar
 * (JavaScript sayaç yok, genişlik sıçramaz). Hareketi azaltan okuyucu yeni
 * fiyatı doğrudan görür.
 *
 * Öne çıkan plan beyaz karo + yüzen gölge, ötekiler gri kuyu: ayrım degrade
 * ya da renkli kenar değil, ton ve yükseklik. Düğmesi `primary`: degradeli
 * `brand` ekranda bir kez (hero ve kapanış).
 */
export function PricingPlans({
  plans,
  billing,
}: {
  plans: readonly Plan[];
  billing: { label: string; monthly: string; yearly: string; saving: string };
}) {
  const [period, setPeriod] = useState<Billing>("monthly");
  const name = useId();
  const options = [
    { value: "monthly", label: billing.monthly },
    { value: "yearly", label: billing.yearly },
  ] as const;

  return (
    <>
      <fieldset className="mt-10 flex flex-wrap items-center gap-3">
        <legend className="sr-only">{billing.label}</legend>
        <div className="relative grid grid-cols-2 rounded-full bg-surface-raised p-1">
          <m.span
            aria-hidden
            className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-overlay shadow-raised"
            initial={false}
            animate={{ x: period === "monthly" ? "0%" : "100%" }}
            transition={{ duration: DUR.base, ease: EASE }}
          />
          {options.map((option) => (
            <label
              key={option.value}
              className={cn(
                "relative flex min-h-11 cursor-pointer items-center justify-center rounded-full px-5 text-base font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-line-focus pointer-fine:min-h-9",
                period === option.value ? "text-strong" : "text-muted hover:text-strong",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={period === option.value}
                onChange={() => setPeriod(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
        <span className="rounded-full bg-success-wash px-2.5 py-1 text-small font-semibold text-success">{billing.saving}</span>
      </fieldset>

      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {plans.map((plan) => {
          const highlighted = Boolean(plan.highlight);
          return (
            <li
              key={plan.name}
              className={cn(
                "flex min-w-0 flex-col rounded-2xl p-6 sm:p-8",
                highlighted ? "border border-line bg-overlay shadow-floating" : "bg-surface",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-title font-semibold">{plan.name}</h3>
                {highlighted ? (
                  // Dolgu düz `primary`: wash iki kat tonla AA altına iniyordu
                  // (tests/palette.test.ts iki temada ölçer).
                  <span className="rounded-full bg-primary px-3 py-1 text-small font-semibold text-on-primary">{plan.highlight}</span>
                ) : null}
              </div>
              <p className="mt-2 text-base text-soft">{plan.description}</p>
              <p className="mt-8 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="price-figure font-semibold text-strong tabular-nums">
                  <RollingNumber key={period} value={plan.price[period]} />
                </span>
                <span className="text-small text-muted">/ {plan.period[period]}</span>
              </p>
              <ul className="mt-8 flex-1 space-y-3 border-t border-line-soft pt-6">
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
            </li>
          );
        })}
      </ul>
    </>
  );
}
