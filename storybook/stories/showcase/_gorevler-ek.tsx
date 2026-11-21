"use client";

import { PathGraph, type PathColumn } from "@/components/ui/path-graph";
import { EVENTS, shortDate } from "./_data";
import { SectionTitle, useApp } from "./_ui";

/**
 * Çıkışa giden yol (Plotline turu): ekip panosundaki bitmemiş işler,
 * Atlas'ın otel açılışı teslimatına (takvimdeki 24 Kasım etkinliği) hangi
 * sırayla bağlanıyor. Kartlar panonun güncel durumundan okunur: bir iş
 * Bitti'ye taşınınca yoldan çıkar. Bağımlılıklar işin doğasından
 * yazılmıştır (teklif → proforma → kargo), kritik yol kalın kırmızıdır.
 */

const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

type Plan = { id: string; after: readonly string[]; critical?: boolean; blocked?: boolean };

/** Panodaki kart kimliği → aşama ve bağımlılık. Kimlik `_data.ts` BOARD ile aynı. */
const PLAN: readonly { column: string; label: string; nodes: readonly Plan[] }[] = [
  { column: "teklif", label: "Teklif", nodes: [{ id: "g1", after: [], critical: true }, { id: "g2", after: [] }, { id: "g4", after: [] }] },
  { column: "fatura", label: "Fatura ve Ödeme", nodes: [{ id: "g6", after: ["g1"], critical: true }, { id: "g7", after: ["g4"], blocked: true }, { id: "g3", after: ["g2"] }] },
  { column: "teslimat", label: "Teslimat", nodes: [{ id: "g5", after: ["g6"], critical: true }, { id: "g8", after: ["g3", "g7"] }] },
];

export function LaunchPath() {
  const { board } = useApp();
  const open = new Map(board.filter((c) => !c.done).flatMap((c) => c.cards.map((card) => [card.id, card] as const)));
  const goalEvent = EVENTS.find((e) => e.id === "e11")!;

  const columns: PathColumn[] = PLAN.map((p) => ({
    id: p.column,
    label: p.label,
    nodes: p.nodes
      .filter((n) => open.has(n.id))
      .map((n) => {
        const card = open.get(n.id)!;
        return {
          id: n.id,
          title: card.title,
          meta: `${card.assignee?.name.split(" ")[0] ?? ""}${card.due ? ` · ${shortDate.format(parse(card.due))}` : ""}`,
          critical: n.critical,
          blocked: n.blocked,
          after: n.after.filter((id) => open.has(id)),
        };
      }),
  })).filter((c) => c.nodes.length > 0);

  const last = columns[columns.length - 1];
  return (
    <section aria-labelledby="gorev-yol" className="grid grid-cols-1 gap-3">
      <SectionTitle id="gorev-yol" title="Çıkışa Giden Yol" note="Atlas'ın otel açılışı teslimatı kayarsa hangi iş kaydırır" />
      <div className="rounded-xl bg-surface p-4 sm:p-5">
        <PathGraph
          label="Açılış Teslimatına Giden Yol"
          start={{ title: "Bugün", meta: shortDate.format(new Date(2026, 10, 2)) }}
          columns={columns}
          goal={{ title: "Açılış Teslimatı", meta: shortDate.format(goalEvent.date), after: last ? last.nodes.map((n) => n.id) : [] }}
        />
      </div>
    </section>
  );
}
