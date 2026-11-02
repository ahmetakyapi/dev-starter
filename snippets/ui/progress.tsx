"use client";

import { Progress as Base } from "@base-ui/react/progress";
import { Check } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Doğrusal ilerleme: bir İŞİN ne kadarının bittiği (yükleme, dışa aktarma,
 * kurulum adımı). Bir KAPASİTENİN doluluğu (depolama, kota) ilerleme değil
 * ölçüdür: `meter.tsx`. İkisi ekran okuyucuda farklı okunur
 * (`progressbar` / `meter`), birinin yerine öteki kullanılmaz.
 *
 * Base UI Progress: `role="progressbar"`, `aria-valuenow/min/max`, etiket
 * bağı (`aria-labelledby`) ve `tr-TR` biçimli `aria-valuetext` ondan.
 * `value={null}` BELİRSİZ: süre bilinmiyorsa uydurma yüzde gösterme.
 *
 * DOLGU GENİŞLİKLE DEĞİL `translateX` İLE: Base UI'nin göstergesi
 * `width: %` yazar; genişliği animasyonla değiştirmek her karede düzen
 * hesaplatır (slop listesi). Kendi dolgumuz iz kadar geniş bir hap, sola
 * kaydırılıp izin `overflow-hidden`ı ile kırpılır. `scaleX` de olurdu ama
 * hapın yuvarlak ucunu ezer (küçük değerde uç kareleşir); kaydırmada uç hep
 * tam yuvarlak. Sağdan sola dilde `-` işaretini çevir.
 *
 * BİTİNCE: dolgu `bg-success`e döner ve yüzdenin yerine ✓ + "Tamamlandı"
 * gelir. Renk tek işaret değil, metin de değişir.
 *
 * BELİRSİZDE: kısa bir hap izin içinde soldan sağa kayar (1,4 sn, imza
 * eğrisi). Hareketi azaltan kullanıcıda kayma yok; hap ortada durur ve
 * yanında "Hazırlanıyor" yazar.
 */

const percent = new Intl.NumberFormat("tr-TR", { style: "percent", maximumFractionDigits: 0 });

type ProgressProps = {
  /** 0–max arası; `null` belirsiz. */
  value: number | null;
  max?: number;
  /** Görünen Title Case etiket: "Rapor Dışa Aktarılıyor". */
  label: ReactNode;
  /** Sağdaki yüzde ya da kendi metnin ("12 / 40 dosya"). `false` gizler. */
  valueText?: ReactNode | false;
  /** Altta küçük açıklama: "Yaklaşık 2 dakika kaldı". */
  hint?: ReactNode;
  size?: "sm" | "md";
  className?: string;
};

export function Progress({ value, max = 100, label, valueText, hint, size = "md", className }: ProgressProps) {
  const reduce = useReducedMotion();
  const hintId = useId();
  const ratio = value === null ? null : Math.min(1, Math.max(0, value / max));
  const complete = ratio === 1;

  return (
    <Base.Root
      value={value}
      max={max}
      locale="tr-TR"
      aria-describedby={hint ? hintId : undefined}
      className={cn("grid gap-2", className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <Base.Label className="min-w-0 truncate text-base font-medium text-strong">{label}</Base.Label>
        {valueText === false ? null : complete ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-small font-semibold text-success">
            <Check aria-hidden className="size-3.5" strokeWidth={2.5} />
            Tamamlandı
          </span>
        ) : (
          <span aria-hidden className="shrink-0 text-small font-medium text-muted tabular-nums">
            {valueText ?? (ratio === null ? "Hazırlanıyor" : percent.format(ratio))}
          </span>
        )}
      </div>

      <Base.Track
        className={cn(
          "relative overflow-hidden rounded-full bg-chart-track",
          size === "sm" ? "h-1.5" : "h-2",
        )}
      >
        {ratio === null ? (
          reduce ? (
            <span className="absolute inset-y-0 left-[30%] w-2/5 rounded-full bg-primary" />
          ) : (
            <m.span
              className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-primary"
              initial={{ x: "-100%" }}
              animate={{ x: "250%" }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], repeat: Infinity, repeatDelay: 0.15 }}
            />
          )
        ) : (
          <span
            className={cn(
              "absolute inset-0 rounded-full transition-[transform,background-color] duration-300 motion-reduce:transition-none",
              complete ? "bg-success" : "bg-primary",
            )}
            style={{ transform: `translateX(-${(1 - ratio) * 100}%)` }}
          />
        )}
      </Base.Track>

      {hint ? (
        <p id={hintId} className="text-small text-muted">
          {hint}
        </p>
      ) : null}
    </Base.Root>
  );
}
