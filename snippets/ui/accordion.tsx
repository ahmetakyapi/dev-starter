"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Akordeon: `<details>` / `<summary>`. JavaScript'siz açılıp kapanır,
 * sayfa içi aramada (Ctrl+F) kapalı içerik bulunur ve kendiliğinden açılır,
 * ekran okuyucu "genişletilmiş / daraltılmış" der. `exclusive` verilirse
 * yerel `name` özniteliği aynı gruptan yalnızca birini açık tutar.
 *
 * AÇILAN İÇERİK BASTIĞIN YERDE UZAR. Kaydırma çapalaması (scroll
 * anchoring) ekrandaki bir öğeyi "çapa" seçip içerik değişince onu yerinde
 * tutmak için sayfayı kaydırır; çapa açılan bölümün altındaki bir öğeye
 * düşerse okuyucu açtığı metnin sonuna fırlatılır (Safari 27 bunu bir bülten
 * kartında yaptı). Özete basıldığı an çapalama kısa süre kapanır, içerik
 * aşağı doğru uzar, sonra çapalama geri gelir. "use client" yalnızca bu
 * korumanın tıklama dinleyicisi için; katlama JS'siz de çalışır.
 *
 * İKİ GÖRÜNÜŞ (`variant`, "board" dili 2026-11):
 *   `line` (varsayılan): kıl çizgisiyle ayrılmış satırlar; SSS gibi uzun
 *     metin listeleri.
 *   `well`: gri kuyu (`bg-surface rounded-xl p-1.5`) içinde her öğe beyaz
 *     karo (`bg-overlay shadow-raised rounded-lg`); ayar ya da özellik
 *     panelleri. Kuyu → karo tek seviye: karo içine kart konmaz.
 * Chevron küçük yuvarlak bir düğme gibi durur, açılınca döner; özete
 * gelince arka planı yumuşak griye döner (tıklanabilir olduğunu söyler).
 *
 * Açılış animasyonu `::details-content` + `interpolate-size` (yalnızca
 * destekleyen tarayıcıda; desteklemeyen anında açar). Hareketi azaltan
 * kullanıcıda süre sıfıra iner (globals.css genel kuralı).
 */

/** Çapalamanın kapalı kaldığı süre: açılış geçişinin (280 ms) üstünde. */
const HOLD_MS = 450;

const STYLES = `
.ui-accordion { interpolate-size: allow-keywords; }
.ui-accordion::details-content {
  block-size: 0;
  overflow-y: clip;
  transition: block-size 280ms var(--ease-brand), content-visibility 280ms allow-discrete;
}
.ui-accordion[open]::details-content { block-size: auto; }
`;

let releaseTimer: number | undefined;

function holdAnchor() {
  // Kök VE gövde: tarayıcılar görünüm alanının değerini ikisinden birinden okuyor.
  const root = document.documentElement;
  root.style.setProperty("overflow-anchor", "none");
  document.body.style.setProperty("overflow-anchor", "none");
  window.clearTimeout(releaseTimer);
  releaseTimer = window.setTimeout(() => {
    root.style.removeProperty("overflow-anchor");
    document.body.style.removeProperty("overflow-anchor");
  }, HOLD_MS);
}

const VARIANTS = {
  line: "divide-y divide-line-soft border-y border-line-soft",
  well: "space-y-1.5 rounded-xl bg-surface p-1.5 [&>details]:rounded-lg [&>details]:bg-overlay [&>details]:px-4 [&>details]:shadow-raised",
} as const;

export function Accordion({
  children,
  variant = "line",
  className,
}: {
  children: ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  return (
    <div className={cn(VARIANTS[variant], className)}>
      <style href="ui-accordion" precedence="default">
        {STYLES}
      </style>
      {children}
    </div>
  );
}

type AccordionItemProps = {
  /** Title Case başlık. */
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Aynı ada sahip öğelerden yalnızca biri açık kalır (yerel `name`). */
  exclusive?: string;
  className?: string;
};

export function AccordionItem({ title, children, defaultOpen, exclusive, className }: AccordionItemProps) {
  return (
    <details name={exclusive} open={defaultOpen} className={cn("ui-accordion group", className)}>
      <summary
        onClick={holdAnchor}
        className="group/summary flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-read font-semibold text-strong select-none [&::-webkit-details-marker]:hidden [&:focus-visible]:outline-offset-[-2px]"
      >
        {title}
        <span
          aria-hidden
          className="grid size-7 shrink-0 place-items-center rounded-full text-muted transition-colors group-hover/summary:bg-surface-raised group-hover/summary:text-strong"
        >
          <ChevronDown className="size-4 transition-transform duration-300 group-open:rotate-180" strokeWidth={1.75} />
        </span>
      </summary>
      <div className="pb-4 text-base text-body">{children}</div>
    </details>
  );
}
