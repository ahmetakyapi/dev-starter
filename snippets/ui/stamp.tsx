"use client";

import { m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Damga: bir kaydın KARAR anını (Onaylandı, Reddedildi, Ödendi, İptal) kâğıt
 * damgası gibi, hafif eğik ve çift çerçeveli gösterir. Teklif onayı,
 * fatura ödemesi, başvuru sonucu: "bu iş bitti, kim ne zaman karar verdi"
 * bir bakışta okunur. Brick proje kartındaki "Teklif Onaylandı · 27 Eylül"
 * damgasından alındı (yapı; kod, ad, tarih alınmadı).
 *
 * BİLGİ DAMGANIN METNİNDE: renk ve eğim süs. `label` ("Onaylandı") ve
 * `date` düz metindir, ekran okuyucu "Onaylandı, 27 Eylül 2026" okur;
 * eğim (`rotate`) ve çift çerçeve `aria-hidden` katmanlarda. Renk tek
 * işaret değil (`tone` metinle çelişirse metin kazanır). Damga bir
 * DURUM ROZETİ yerine geçmez: listede yüzlerce satır için `badge.tsx`;
 * damga tek bir kaydın ayrıntı ekranında, kararın kendisi öne çıkacaksa.
 *
 * HAREKET: açılışta damga "vurur": 1,35 ölçekten oturur, az titreyerek
 * sönük başlar (`slam`, varsayılan açık). Hareketi azaltan kullanıcıda
 * hiç animasyon yok, damga yerinde çizilir. Süre 260 ms, tek seferlik;
 * yeniden çizimde tekrarlanmaz (`key` değişmedikçe).
 *
 * Mürekkep gibi: çerçeve ve yazı aynı ton, zemin saydam. Koyu temada
 * ton açılır (token'lar iki temada AA ölçülü). Yazı mono ve büyük harf:
 * Türkçe için CSS `uppercase` yerine `toLocaleUpperCase("tr-TR")` ("ödendi"
 * → "ÖDENDİ", "iptal" → "İPTAL"); metin düğümü değilse (ReactNode) olduğu gibi.
 *
 *   <Stamp tone="success" label="Teklif Onaylandı" date="27 Eylül 2026" />
 */

const TONE = {
  success: "border-success text-success",
  danger: "border-danger text-danger",
  warning: "border-warning text-warning",
  primary: "border-primary-ink text-primary-ink",
  neutral: "border-line-strong text-body",
} as const;

export function Stamp({
  label,
  date,
  tone = "success",
  rotate = -4,
  size = "md",
  slam = true,
  className,
}: {
  label: ReactNode;
  /** İkinci satır: karar tarihi. Biçimi çağıran verir. */
  date?: ReactNode;
  tone?: keyof typeof TONE;
  /** Derece: -4 hafif sola eğik. Okunurluk için ±8'i aşma. */
  rotate?: number;
  size?: "sm" | "md";
  slam?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const tilt = Math.max(-8, Math.min(8, Number.isFinite(rotate) ? rotate : 0));
  const text = typeof label === "string" ? label.toLocaleUpperCase("tr-TR") : label;
  const animate = slam && !reduce;

  return (
    <m.span
      initial={animate ? { opacity: 0, scale: 1.35, rotate: tilt - 6 } : false}
      animate={{ opacity: 1, scale: 1, rotate: tilt }}
      transition={{ duration: animate ? 0.26 : 0, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative inline-flex flex-col items-center justify-center rounded-md border-2 bg-transparent font-mono font-semibold tracking-[0.12em] select-none",
        size === "sm" ? "px-2.5 py-1 text-micro" : "px-4 py-2 text-small",
        TONE[tone],
        className,
      )}
    >
      {/* İç çerçeve: damga kalıbının çift çizgisi; süs. */}
      <span aria-hidden className="pointer-events-none absolute inset-[3px] rounded-[3px] border border-current opacity-60" />
      <span className="relative">{text}</span>
      {date ? <span className="relative mt-0.5 font-normal tracking-[0.08em]">{date}</span> : null}
    </m.span>
  );
}
