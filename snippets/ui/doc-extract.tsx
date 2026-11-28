"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Belge çıkarma: yapay zekanın yapılandırılmamış bir belgeyi veriye
 * çevirdiği an. Solda soluk belge (başlık, gri satır iskeletleri, iki küçük
 * tablo kutusu, kağıt zemin), sağda koyu çerçeveli "Çıkarılan Alanlar"
 * kartı (Tedarikçi, Fatura No, Tarih, Tutar…) ve dipte durum ("Hazır"),
 * aralarında dirsekli ince bağlantı çizgisi. Tanıtım sayfasında özellik
 * kartı ya da kahraman sahnesi. Manzara turundan (2026-11-28, yalnız
 * davranış ve yapı).
 *
 * NE ZAMAN DEĞİL: gerçek bir kaydın alanlarını göstermek için
 * `key-value-list` (bu bir DEMO; belge iskeleti uydurma). Yükleme ve
 * işleme ilerlemesi için `file-upload` / `progress`.
 *
 * NASIL: `fields` sırası belgedeki satır iskeletlerine eşlenir (i. alan,
 * belgenin i. vurgulu satırı). `animate` verilirse bileşen görünüme ilk
 * girdiğinde (`useInView`, IntersectionObserver, bir kez) belgede bir
 * tarama çizgisi yukarıdan aşağı bir kez geçer; çizgi bir satıra
 * vardığında satır vurgulanır ve sağdaki alanın değeri belirir (alan alan
 * sırayla). Bitince durum `pendingLabel`dan ("Okunuyor") `status`a
 * ("Hazır") döner. Hareket yalnız transform ve opacity; gizleme CSS'te,
 * `@media (scripting: enabled)` içinde (JavaScript yoksa sonuç baştan
 * görünür). Hareketi azaltan kullanıcıda sonuç baştan yerindedir.
 *
 * DÜZEN: geniş kapta belge solda (biraz dar), çizgi ortada, kart sağda;
 * `sm` altında alt alta, çizgi dikey.
 *
 * ERİŞİLEBİLİRLİK: belge iskeleti ve çizgi `aria-hidden`; kaynak belgenin
 * adı gizli metinle okunur. Çıkarılan alanlar `dl` (`dt` + `dd`), başlığı
 * `heading` (varsayılan "Çıkarılan Alanlar", `headingLevel`). Durum satırı
 * `role="status"`: animasyonda "Hazır"a dönüşü kibarca duyurulur; renkli
 * nokta tek işaret değil, durum metinle yazılır.
 *
 *   <DocExtract
 *     title="Fatura Pdf"
 *     fields={[
 *       { label: "Tedarikçi", value: "Yörük Ambalaj Ltd." },
 *       { label: "Tutar", value: "18.420,00 ₺" },
 *     ]}
 *     status={{ label: "Hazır", tone: "success" }}
 *     animate
 *   />
 */

export type DocField = { label: ReactNode; value: ReactNode };

export type DocExtractStatus = {
  label: ReactNode;
  tone?: "success" | "warning" | "danger" | "neutral";
};

export type DocExtractProps = {
  /** Belgenin adı ("Fatura Pdf"). */
  title: ReactNode;
  fields: readonly DocField[];
  status?: DocExtractStatus;
  /** Kartın başlığı. */
  heading?: ReactNode;
  /** Animasyon sürerken durum metni. */
  pendingLabel?: ReactNode;
  /** Görünüme girince belge taranır, alanlar sırayla dolar (bir kez). */
  animate?: boolean;
  headingLevel?: 2 | 3 | 4;
  className?: string;
};

const DOT = { success: "bg-success", warning: "bg-warning", danger: "bg-danger", neutral: "bg-muted" } as const;

/** Tarama süresi ve başlangıç gecikmesi (saniye). */
const SCAN_DUR = 1.8;
const SCAN_DELAY = 0.2;
const FIELD_DUR = 0.4;

const CSS = `
@keyframes ui-dx-scan { 0% { transform: translateY(0); opacity: 0; } 8% { opacity: 1; } 92% { opacity: 1; } 100% { transform: translateY(100%); opacity: 0; } }
.ui-dx-scan { opacity: 0; }
.ui-dx[data-played] .ui-dx-scan { animation: ui-dx-scan ${SCAN_DUR}s linear ${SCAN_DELAY}s 1 both; }
.ui-dx-hl, .ui-dx-val, .ui-dx-ghost { transition: opacity ${FIELD_DUR}s var(--ease-brand, cubic-bezier(0.22, 1, 0.36, 1)), transform ${FIELD_DUR}s var(--ease-brand, cubic-bezier(0.22, 1, 0.36, 1)); transition-delay: var(--dx-t); }
.ui-dx-ghost { opacity: 0; }
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
  .ui-dx[data-animate]:not([data-played]) .ui-dx-hl { opacity: 0; }
  .ui-dx[data-animate]:not([data-played]) .ui-dx-val { opacity: 0; transform: translateX(-0.25rem); }
  .ui-dx[data-animate]:not([data-played]) .ui-dx-ghost { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-dx-scan { display: none; }
  .ui-dx-hl, .ui-dx-val, .ui-dx-ghost { transition: none; }
}`;

/** Belgedeki iskelet satırlarının genişliği: alan satırları arasına dolgu satırları serpiştirilir. */
const FILLER = ["w-11/12", "w-4/5", "w-2/3"] as const;

export function DocExtract({
  title,
  fields,
  status = { label: "Hazır", tone: "success" },
  heading = "Çıkarılan Alanlar",
  pendingLabel = "Okunuyor",
  animate = false,
  headingLevel = 3,
  className,
}: DocExtractProps) {
  const H = `h${headingLevel}` as ElementType;
  const headingId = useId();
  const root = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const seen = useInView(root, { once: true, amount: 0.4 });
  const played = animate && (seen || reduce === true);

  const [finished, setFinished] = useState(false);
  const totalMs = Math.round((SCAN_DELAY + SCAN_DUR + FIELD_DUR) * 1000);
  useEffect(() => {
    if (!animate || !played || finished) return;
    const t = window.setTimeout(() => setFinished(true), reduce ? 0 : totalMs);
    return () => window.clearTimeout(t);
  }, [animate, played, finished, reduce, totalMs]);
  const ready = !animate || finished;

  // i. alan, belgenin (i + 0.5) / n konumunda: tarama oraya vardığında belirir.
  const at = (i: number) => `${(SCAN_DELAY + ((i + 0.5) / Math.max(1, fields.length)) * SCAN_DUR * 0.8).toFixed(2)}s`;
  const tone = DOT[status.tone ?? "success"];

  return (
    <section
      ref={root}
      aria-labelledby={headingId}
      data-animate={animate || undefined}
      data-played={played || undefined}
      className={cn(
        "ui-dx grid w-full items-center gap-0 sm:grid-cols-[minmax(0,0.85fr)_2.5rem_minmax(0,1fr)]",
        className,
      )}
    >
      <style href="ui-doc-extract" precedence="default">
        {CSS}
      </style>
      <p className="sr-only">Kaynak belge: {title}</p>

      {/* Belge: soluk kağıt, iskelet satırlar. Tamamen süs. */}
      <div
        aria-hidden
        className="relative mx-auto w-full max-w-xs overflow-hidden rounded-lg bg-overlay p-4 shadow-raised ring-1 ring-line-soft ring-inset sm:max-w-none"
      >
        <p className="text-small font-semibold text-strong">{title}</p>
        <span className="mt-1 block h-1.5 w-1/3 rounded-full bg-line-soft" />
        <div className="mt-4 grid gap-2.5">
          {fields.map((_, i) => (
            <div key={i} className="grid gap-1.5" style={{ "--dx-t": at(i) } as CSSProperties}>
              <span className="relative block h-2.5 rounded-sm">
                <span className="absolute inset-y-0 left-0 w-full rounded-sm bg-line-soft" />
                <span className="ui-dx-hl absolute -inset-x-1 -inset-y-0.5 rounded-sm bg-primary-wash ring-1 ring-primary-soft ring-inset" />
                <span className={cn("absolute inset-y-0 left-0 rounded-sm bg-line", i % 2 ? "w-1/2" : "w-3/5")} />
              </span>
              {i % 2 === 1 ? <span className={cn("block h-1.5 rounded-full bg-line-soft", FILLER[i % FILLER.length])} /> : null}
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[0, 1].map((box) => (
            <span key={box} className="grid gap-1.5 rounded-sm p-2 ring-1 ring-line-soft ring-inset">
              <span className="h-1.5 w-3/4 rounded-full bg-line" />
              <span className="h-1.5 w-full rounded-full bg-line-soft" />
              <span className="h-1.5 w-2/3 rounded-full bg-line-soft" />
            </span>
          ))}
        </div>
        {/* Tarama: kap kadar yüksek katman 0 → %100 kayar; üst kenarındaki çizgi belgeyi süpürür. */}
        <span className="ui-dx-scan pointer-events-none absolute inset-0">
          <span className="absolute inset-x-0 top-0 h-px bg-primary" />
          <span className="absolute inset-x-0 top-0 h-6 -translate-y-full bg-[linear-gradient(to_top,color-mix(in_oklab,var(--color-primary)_14%,transparent),transparent)]" />
        </span>
      </div>

      {/* Bağlantı: geniş kapta dirsekli yatay, telefonda dikey kısa çizgi. */}
      <svg aria-hidden viewBox="0 0 40 40" fill="none" className="mx-auto hidden h-10 w-10 text-line-strong sm:block">
        <path d="M0 12 H16 Q20 12 20 16 V24 Q20 28 24 28 H40" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <circle cx="1.5" cy="12" r="1.5" fill="currentColor" />
        <circle cx="38.5" cy="28" r="1.5" fill="currentColor" />
      </svg>
      <span aria-hidden className="mx-auto block h-6 w-px bg-line-strong sm:hidden" />

      {/* Çıkarılan alanlar: koyu çerçeve, içinde açık karo. */}
      <div className="w-full rounded-xl bg-strong p-1 shadow-floating">
        <H id={headingId} className="px-3 pt-2 pb-2 text-small font-medium text-page">
          {heading}
        </H>
        <dl className="divide-y divide-line-soft rounded-lg bg-overlay px-3">
          {fields.map((field, i) => (
            <div
              key={i}
              style={{ "--dx-t": at(i) } as CSSProperties}
              className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-baseline gap-x-4 py-2"
            >
              <dt className="text-small text-muted">{field.label}</dt>
              <dd className="relative min-w-0 text-right text-small font-medium text-strong tabular-nums">
                <span aria-hidden className="ui-dx-ghost absolute top-1/2 right-0 h-2 w-16 -translate-y-1/2 rounded-full bg-line-soft" />
                <span className="ui-dx-val block truncate">{field.value}</span>
              </dd>
            </div>
          ))}
        </dl>
        <p role="status" aria-live={animate ? "polite" : "off"} className="flex items-center gap-2 px-3 pt-2 pb-1.5 text-small text-page">
          <span aria-hidden className={cn("size-2 rounded-full", ready ? tone : "bg-line-strong")} />
          {ready ? status.label : pendingLabel}
        </p>
      </div>
    </section>
  );
}
