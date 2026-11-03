"use client";

import { m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Sayfanın ortak parçaları. Izgara hücresi ALT IZGARA (subgrid) kullanır:
 * yan yana kuyular aynı boyda, altlarındaki ad + cümle satırı da aynı
 * hizada başlar (başlık iki satıra kırılsa bile kuyu kısalmaz).
 */

/** Hücrenin genişliği, 6 sütunlu ızgarada. Telefonda hepsi tek sütun. */
export type Span = 1 | 2 | 3 | 4 | 6;
const SPAN: Record<Span, string> = {
  1: "",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "md:col-span-2 lg:col-span-4",
  6: "md:col-span-2 lg:col-span-6",
};

/** Bir grubun ızgarası: 1 → 2 → 6 sütun; hücreler `Cell`. */
export function CellGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-x-4 gap-y-10 md:grid-cols-2 lg:grid-cols-6", className)}>{children}</div>;
}

/** Bileşen kuyusu: büyük yuvarlak gri kuyu, altında Türkçe ad + tek cümle + dosya adı. */
export function Cell({
  file,
  name,
  note,
  span = 2,
  size = "md",
  align = "center",
  children,
  className,
}: {
  /** `snippets/ui` dosya adı; kapsam dizini buraya bağlanır (`#b-<dosya>`). */
  file: string;
  name: string;
  note: string;
  span?: Span;
  /** Kuyunun en küçük boyu: grubun ritmi (yoğun / ferah). */
  size?: "sm" | "md" | "lg";
  align?: "center" | "start" | "stretch";
  children: ReactNode;
  className?: string;
}) {
  const min = { sm: "min-h-44", md: "min-h-60", lg: "min-h-80" }[size];
  const place = { center: "items-center justify-center", start: "items-start justify-center", stretch: "items-stretch" }[align];
  return (
    <figure id={`b-${file}`} className={cn("row-span-2 grid min-w-0 scroll-mt-24 grid-rows-subgrid gap-y-3", SPAN[span])}>
      <div className={cn("edge-lit flex min-w-0 rounded-2xl bg-surface p-5 sm:p-7", min, place, className)}>
        <div className="w-full min-w-0">{children}</div>
      </div>
      <figcaption className="flex items-start justify-between gap-3 px-1">
        <span className="min-w-0">
          <span className="block text-base font-semibold text-strong">{name}</span>
          <span className="mt-0.5 block text-small text-muted">{note}</span>
        </span>
        <code className="mt-0.5 shrink-0 font-mono text-micro text-muted">{file}</code>
      </figcaption>
    </figure>
  );
}

/** Bölüm başı: künye numarası, büyük sıkı başlık, bir iki cümle. */
export function SectionHead({
  id,
  index,
  eyebrow,
  title,
  lead,
  aside,
}: {
  id: string;
  index: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-3xl">
        <p className="flex items-center gap-2 font-mono text-small text-muted">
          <span className="tabular-nums">{index}</span>
          <span aria-hidden className="h-px w-6 bg-line-strong" />
          {eyebrow}
        </p>
        <h2 id={id} className="mt-4 text-[clamp(2rem,4.6vw,3.25rem)] leading-[1.04] font-semibold tracking-[-0.035em] text-strong">
          {title}
        </h2>
        {lead ? <p className="mt-4 max-w-2xl text-lead text-body">{lead}</p> : null}
      </div>
      {aside}
    </div>
  );
}

/** Grup başı (bileşen galerisi içinde): ad, sayı, tek cümle. */
export function GroupHead({ id, title, count, note }: { id: string; title: string; count: number; note: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-line pt-5">
      <h3 id={id} className="flex items-baseline gap-3 text-heading font-semibold tracking-[-0.025em] text-strong">
        {title}
        <span className="font-mono text-small font-normal text-muted tabular-nums">{count} bileşen</span>
      </h3>
      <p className="max-w-md text-base text-body">{note}</p>
    </div>
  );
}

/** Görünür olunca yumuşakça gelir; hareket azaltmada (ve ekran görüntüsünde) doğrudan son hal. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </m.div>
  );
}
