"use client";

import { useState } from "react";
import { Keyboard } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CloseButton } from "@/components/ui/close-button";
import { KanbanBoard, type KanbanColumn } from "@/components/ui/kanban-board";
import { MorphIcon } from "@/components/ui/morph-icon";
import { TaskList } from "@/components/ui/task-list";
import { BOARD, ME, MY_TASKS, TODAY, dayKey, num, shortDate } from "./_data";
import { PageBar, SectionTitle, Well, WellTitle, useApp } from "./_ui";

const TODAY_KEY = dayKey(TODAY);
/** Yaklaşan son tarihlerde kapalıyken görünen iş sayısı. */
const UPCOMING_LIMIT = 5;
const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Bitmemiş kartlar, son tarihe göre: panoyla aynı durumdan okunur. */
function upcoming(columns: readonly KanbanColumn[]) {
  return columns
    .filter((c) => !c.done)
    .flatMap((c) => c.cards.map((card) => ({ card, column: c.title })))
    .filter((x) => x.card.due)
    .sort((a, b) => a.card.due!.localeCompare(b.card.due!));
}

export function GorevlerPage() {
  const { notify } = useApp();
  const [columns, setColumns] = useState<readonly KanbanColumn[]>(BOARD);
  const [tip, setTip] = useState(true);
  const [allUpcoming, setAllUpcoming] = useState(false);
  const open = columns.filter((c) => !c.done).reduce((n, c) => n + c.cards.length, 0);
  const due = upcoming(columns);
  const dueToday = due.filter((x) => x.card.due! <= TODAY_KEY).length;

  const onChange = (next: KanbanColumn[]) => {
    // Kolonu değişen kart: sonucu bildirim olarak söyle (sıra değişimi sessiz).
    for (const col of next) {
      for (const card of col.cards) {
        const before = columns.find((c) => c.cards.some((k) => k.id === card.id));
        if (before && before.id !== col.id) {
          notify({ tone: col.done ? "success" : "info", title: col.done ? "İş Tamamlandı" : `${col.title} Kolonuna Taşındı`, body: card.title });
        }
      }
    }
    setColumns(next);
  };

  return (
    <div className="flex min-h-full flex-col">
      <PageBar title="Görevler" description={`${num.format(open)} Açık İş · ${num.format(dueToday)} İşin Son Tarihi Geldi`} />
      <div className="grid grid-cols-1 gap-6 p-4 sm:p-6">
        {tip ? (
          <div className="flex items-start gap-3 rounded-xl bg-surface p-4">
            <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-overlay text-strong shadow-raised [&_svg]:size-4">
              <Keyboard strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-strong">Kartlar Klavyeyle de Taşınır</p>
              <p className="mt-0.5 text-small text-muted">Karta odaklan, Boşluk ile tut, oklarla taşı, yeniden Boşluk ile bırak. Escape vazgeçer.</p>
            </div>
            <CloseButton aria-label="İpucunu Kapat" size="sm" onClick={() => setTip(false)} />
          </div>
        ) : null}

        <section aria-labelledby="gorev-pano" className="grid grid-cols-1 gap-3">
          <SectionTitle id="gorev-pano" title="Ekip Panosu" note="Sürüyor kolonu en fazla 4 iş alır" />
          <KanbanBoard label="Ekip İşleri" defaultColumns={BOARD} onChange={onChange} today={TODAY_KEY} />
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TaskList title={`${ME.name.split(" ")[0]} · Bugün`} defaultTasks={MY_TASKS} today={TODAY_KEY} className="h-full p-3" />

          <Well labelledBy="gorev-yakin">
            <WellTitle id="gorev-yakin" hint="Panodaki bitmemiş işler, son tarihe göre.">
              Yaklaşan Son Tarihler
            </WellTitle>
            <ol id="gorev-yakin-liste" className="grid grid-cols-1 gap-1.5">
              {due
                .slice(0, allUpcoming ? due.length : UPCOMING_LIMIT)
                .map(({ card, column }) => {
                  const late = card.due! < TODAY_KEY;
                  return (
                    <li key={card.id} className="flex items-center gap-3 rounded-lg bg-overlay px-3 py-2.5 shadow-raised">
                      {card.assignee ? <Avatar name={card.assignee.name} size="sm" /> : null}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-medium text-strong">{card.title}</span>
                        <span className="block truncate text-small text-muted">
                          {card.assignee?.name} · {column}
                        </span>
                      </span>
                      <Badge tone={late ? "danger" : card.due === TODAY_KEY ? "warning" : "neutral"} className="shrink-0">
                        {late ? `Gecikti · ${shortDate.format(parse(card.due!))}` : card.due === TODAY_KEY ? "Bugün" : shortDate.format(parse(card.due!))}
                      </Badge>
                    </li>
                  );
                })}
            </ol>
            {due.length > UPCOMING_LIMIT ? (
              <button
                type="button"
                aria-expanded={allUpcoming}
                aria-controls="gorev-yakin-liste"
                onClick={() => setAllUpcoming((v) => !v)}
                className="mt-2 inline-flex min-h-11 items-center gap-2 self-start rounded-md px-2 text-small font-medium text-primary-ink hover:bg-surface-raised"
              >
                <MorphIcon icon={allUpcoming ? "chevron-up" : "chevron-down"} size={18} />
                {allUpcoming ? "Daha Az Göster" : `Tümünü Göster (${num.format(due.length)})`}
              </button>
            ) : null}
          </Well>
        </div>
      </div>
    </div>
  );
}
