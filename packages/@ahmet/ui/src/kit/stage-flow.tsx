// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { ReactNode } from "react";
import { cn } from "../utils";

/**
 * Aşama akışı: bir sürecin aşamaları (başvuru → evrak → keşif → … → tamam)
 * YAN YANA sütunlar halinde. Her sütunda alttan dolan kısa çubuk, büyük
 * sayı, aşama adı ve ilk aşamaya göre pay; iki sütun arasında bir sonraki
 * aşamaya GEÇEMEYEN sayı ("−5"). En büyük kayıp uyarı tonunda ve "En çok
 * burada takılıyor" notuyla işaretlenir.
 *
 * `stage-bars` ile FARKI: o, satır satır tam genişlik çubuklar; hunide
 * kesin uzunluk karşılaştırması için. Bu, aynı veriyi ~180 px yüksekliğe
 * sığdırır ve asıl soruyu cevaplar: "nerede takılıyor?". Sayfanın üstünde
 * özet, listenin yanında bağlam olarak; satır başına göz yormaz.
 * Sahibinin geri bildirimi (26 Kasım 2026): tam genişlik huni "göz yoruyor,
 * gereksiz" (Portal → Başvurular).
 *
 * Erişilebilirlik: bir `ol`; her adım "Keşif: 16, ilk aşamanın yüzde 67'si,
 * önceki aşamadan 5 eksik" diye okunur. Çubuklar `aria-hidden`. Renk tek
 * işaret değil: en büyük kayıp ayrıca yazıyla ("En çok burada takılıyor").
 * Sunucu bileşeni, JavaScript inmez. 3-8 aşama; fazlası okunmaz.
 */

export type FlowStage = { label: ReactNode; value: number; note?: ReactNode };

const num = new Intl.NumberFormat("tr-TR");
const pctFmt = new Intl.NumberFormat("tr-TR", { style: "percent", maximumFractionDigits: 0 });

export function StageFlow({ stages, title, className }: { stages: readonly FlowStage[]; title: string; className?: string }) {
  const first = Math.max(1, stages[0]?.value ?? 1);
  const drops = stages.map((s, i) => (i === 0 ? 0 : Math.max(0, stages[i - 1].value - s.value)));
  const worst = drops.reduce((best, d, i) => (d > drops[best] ? i : best), 0);
  return (
    <ol aria-label={title} className={cn("grid grid-flow-col auto-cols-[minmax(6.5rem,1fr)] overflow-x-auto [scrollbar-width:thin]", className)}>
      {stages.map((s, i) => {
        const share = s.value / first;
        const hot = i === worst && drops[i] > 0;
        return (
          <li key={i} className="relative grid min-w-0 content-start gap-3 px-3 first:pl-0 last:pr-0">
            {/* Aşamalar arası kayıp: sütunların arasındaki ince çizginin üstünde. */}
            {i > 0 ? (
              <span aria-hidden className="absolute top-0 bottom-0 -left-px w-px bg-line-soft">
                {drops[i] > 0 ? (
                  <span className={cn("absolute top-3 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-0.5 font-mono text-micro tabular-nums whitespace-nowrap", hot ? "bg-warning-wash text-warning" : "bg-page text-muted ring-1 ring-line-soft")}>
                    −{num.format(drops[i])}
                  </span>
                ) : null}
              </span>
            ) : null}
            <span aria-hidden className="relative mt-10 block h-20 overflow-hidden rounded-lg bg-surface">
              <span className={cn("absolute inset-x-0 bottom-0 rounded-lg", hot ? "bg-warning" : "bg-primary")} style={{ height: `${Math.max(4, share * 100)}%`, opacity: hot ? 0.8 : 0.35 + share * 0.65 }} />
            </span>
            <span className="grid gap-0.5">
              <span className="text-title font-semibold tracking-tight text-strong tabular-nums">{num.format(s.value)}</span>
              <span className="truncate text-small font-medium text-body">{s.label}</span>
              <span className="text-micro text-muted tabular-nums">
                {pctFmt.format(share)}
                {hot ? <span className="font-medium text-warning"> · En çok burada takılıyor</span> : null}
              </span>
              <span className="sr-only">
                {`, ilk aşamanın yüzde ${Math.round(share * 100)}'i${i > 0 ? `, önceki aşamadan ${drops[i]} eksik` : ""}`}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
