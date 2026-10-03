"use client";

import { LazyMotion, domMax, m } from "motion/react";
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Bölümlü denetim: 2-5 seçenekten biri ("Gün / Hafta / Ay"). Anlamı bir
 * RADYO GRUBU: ok tuşları seçimi taşır, Tab grubun içine bir kez girer
 * (gezici tabindex). Seçim bir içerik bölümünü değiştiriyorsa `tabs.tsx`.
 *
 * GÖSTERGE `layoutId` İLE KAYAR ve bunun bir bedeli var: düzen animasyonu
 * `domAnimation`da YOK, `domMax` ister. Şablonun MotionProvider'ı
 * `domAnimation` yükler; bu bileşen kendi ağacı için `domMax`ı açar
 * (iç içe LazyMotion; ek paket yalnızca bu denetim görününce iner). Sayfada çok
 * sayıda düzen animasyonu varsa kök sağlayıcıyı `domMax`a çevirmek daha
 * ucuz olur; tek denetim için bu yerel yükleme yeter.
 *
 * `layoutId` SAYFADA TEKİL OLMALI: aynı adı taşıyan iki gösterge birbirine
 * uçar. Ad `useId`den türüyor; iki denetim yan yana durabilir.
 *
 * Hareketi azaltan kullanıcıda gösterge kaymaz, yerinde belirir
 * (`MotionConfig reducedMotion="user"` düzen animasyonunu kapatır).
 */

export type SegmentOption<T extends string> = { value: T; label: ReactNode; disabled?: boolean };

type SegmentedControlProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** Grubun adı: "Zaman Aralığı". */
  "aria-label": string;
  size?: "sm" | "md";
  className?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  size = "md",
  className,
  ...props
}: SegmentedControlProps<T>) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.filter((option) => !option.disabled);

  function move(event: KeyboardEvent, current: T) {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const index = enabled.findIndex((option) => option.value === current);
    const last = enabled.length - 1;
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? last
          : event.key === "ArrowRight" || event.key === "ArrowDown"
            ? (index + 1) % enabled.length
            : (index - 1 + enabled.length) % enabled.length;
    const target = enabled[next];
    onValueChange(target.value);
    refs.current[options.indexOf(target)]?.focus();
  }

  return (
    <LazyMotion features={domMax}>
      <div
        role="radiogroup"
        aria-label={props["aria-label"]}
        className={cn("inline-flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-md bg-surface-sunken p-0.5", className)}
      >
        {options.map((option, index) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={option.disabled}
              tabIndex={selected ? 0 : -1}
              onClick={() => onValueChange(option.value)}
              onKeyDown={(event) => move(event, value)}
              className={cn(
                "relative min-h-11 shrink-0 rounded-sm px-3.5 font-semibold whitespace-nowrap transition-colors disabled:opacity-50 [&:focus-visible]:outline-offset-[-2px]",
                size === "sm" ? "text-small pointer-fine:min-h-8" : "text-base pointer-fine:min-h-9",
                selected ? "text-strong" : "text-muted hover:text-strong",
              )}
            >
              {selected ? (
                <m.span
                  layoutId={`${id}-thumb`}
                  transition={SPRING.snappy}
                  aria-hidden
                  className="absolute inset-0 rounded-sm border border-line bg-page shadow-raised"
                />
              ) : null}
              <span className="relative">{option.label}</span>
            </button>
          );
        })}
      </div>
    </LazyMotion>
  );
}
