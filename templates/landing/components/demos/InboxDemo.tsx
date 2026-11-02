"use client";

import { AnimatePresence, m } from "motion/react";
import { useRef } from "react";
import { useStory } from "@/hooks/useStory";
import type { FeatureDemo } from "@/lib/content";
import { DUR, EASE } from "@/lib/motion";
import { chartBg, initials, TILE } from "./styles";

type Inbox = Extract<FeatureDemo, { kind: "inbox" }>;

/*
 * Hikâye: "Yeni talep en üste düşer, ötekiler bir sıra geri çekilir,
 * sonuncusu çıkar; sağdaki kaynak sayacı bir artar."
 *
 * Satırlar sabit yükseklikte ve mutlak konumda: yer değişimi `layout` değil
 * `y` ile (domAnimation yeter, yerleşim yeniden hesaplanmaz). Her talep bir
 * sıra numarası (`seq`) taşır; anahtar o, böylece aynı talep ikinci turda da
 * yeni bir satır olarak iner.
 */
const VISIBLE = 3;
const ROW = 68;

export function InboxDemo({ demo, startDelay = 0 }: { demo: Inbox; startDelay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const tick = useStory(ref, { interval: 2600, startDelay });
  const total = demo.items.length;
  const topSeq = tick + VISIBLE - 1;

  const rows = Array.from({ length: VISIBLE }, (_, row) => {
    const seq = topSeq - row;
    return { seq, item: demo.items[seq % total] };
  });

  // Dinlenme karesinden sonra düşen her talep kendi kaynağını bir artırır.
  const arrived = new Map<string, number>();
  for (let seq = VISIBLE; seq <= topSeq; seq += 1) {
    const source = demo.items[seq % total].source;
    arrived.set(source, (arrived.get(source) ?? 0) + 1);
  }
  const latest = rows[0].item.source;

  return (
    <div ref={ref} className="grid h-full gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
      <ul className="relative min-w-0" style={{ height: VISIBLE * ROW - 8 }}>
        <AnimatePresence initial={false}>
          {rows.map(({ seq, item }, row) => {
            const sourceIndex = demo.sources.findIndex((source) => source.name === item.source);
            return (
              <m.li
                key={seq}
                className={`absolute inset-x-0 top-0 flex h-15 items-center gap-3 px-3 ${TILE}`}
                initial={{ opacity: 0, y: -20, scale: 0.96 }}
                animate={{ opacity: 1, y: row * ROW, scale: 1 }}
                exit={{ opacity: 0, y: VISIBLE * ROW - 24, scale: 0.96 }}
                transition={{ duration: DUR.slow, ease: EASE }}
                style={{ zIndex: VISIBLE - row }}
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-micro font-semibold text-chart-ink ${chartBg(sourceIndex + 1)}`}
                >
                  {initials(item.from)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-medium text-strong">{item.title}</span>
                  <span className="block truncate text-small text-muted">
                    {item.from} · {item.source}
                  </span>
                </span>
                <span className="shrink-0 text-small text-muted tabular-nums">{demo.ages[row]}</span>
              </m.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <div className={`hidden flex-col p-3 sm:flex ${TILE}`}>
        <p className="text-small text-muted">{demo.sourcesTitle}</p>
        <ul className="mt-2 flex flex-1 flex-col justify-between">
          {demo.sources.map((source, index) => (
            <li key={source.name} className="flex items-center gap-2 text-small">
              <span className={`size-2 shrink-0 rounded-full ${chartBg(index + 1)}`} />
              <span className={source.name === latest && tick > 0 ? "text-strong" : "text-body"}>{source.name}</span>
              <span className="ml-auto font-semibold text-strong tabular-nums">
                {(source.count + (arrived.get(source.name) ?? 0)).toLocaleString("tr-TR")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
