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

export function Accordion({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("divide-y divide-line-soft border-y border-line-soft", className)}>
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
        className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-read font-semibold text-strong select-none [&::-webkit-details-marker]:hidden [&:focus-visible]:outline-offset-[-2px]"
      >
        {title}
        <ChevronDown aria-hidden className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" strokeWidth={1.75} />
      </summary>
      <div className="pb-4 text-base text-body">{children}</div>
    </details>
  );
}
