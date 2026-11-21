"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2, Keyboard, ListTodo, MoveRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { CloseButton } from "@/components/ui/close-button";
import { KanbanBoard, type KanbanCard, type KanbanColumn } from "@/components/ui/kanban-board";
import { MorphIcon } from "@/components/ui/morph-icon";
import { QuickPoll } from "@/components/ui/quick-poll";
import { Sheet } from "@/components/ui/sheet";
import { TaskList } from "@/components/ui/task-list";
import { ME, MY_TASKS, TODAY, dayKey, num, shortDate } from "./_data";
import { LaunchPath } from "./_gorevler-ek";
import { TaskViewsWell } from "./_ek-l";
import { PriceListWell } from "./_ek-n";
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
  // Pano durumu uygulamada: kenar çubuğundaki "Görevler" rozeti ve başlık aynı sayıyı okur.
  const { notify, board: columns, setBoard: setColumns } = useApp();
  const [tip, setTip] = useState(true);
  const [allUpcoming, setAllUpcoming] = useState(false);
  const [vote, setVote] = useState<string | null>(null);
  // Açık kart: kimliği tutulur, ayrıntı her zaman panonun güncel durumundan okunur.
  const [openId, setOpenId] = useState<string | null>(null);
  // Pano kontrolsüz: dışarıdan (ayrıntı panelinden) taşıyınca yeniden kurulur.
  const [boardKey, setBoardKey] = useState(0);
  const openAt = openId ? columns.flatMap((c, ci) => c.cards.map((card) => ({ card, col: c, ci }))).find((x) => x.card.id === openId) : undefined;
  const nextCol = openAt ? columns[openAt.ci + 1] : undefined;

  const moveTo = (card: KanbanCard, targetId: string) => {
    const target = columns.find((c) => c.id === targetId)!;
    const next = columns.map((c) => ({
      ...c,
      cards: c.id === targetId ? [...c.cards.filter((k) => k.id !== card.id), card] : c.cards.filter((k) => k.id !== card.id),
    }));
    setColumns(next);
    setBoardKey((k) => k + 1);
    notify({ tone: target.done ? "success" : "info", title: target.done ? "İş Tamamlandı" : `${target.title} Kolonuna Taşındı`, body: card.title });
  };
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
              <p className="mt-0.5 text-small text-muted">Karta bas ya da Enter: ayrıntı açılır. Boşluk ile tut, oklarla taşı, yeniden Boşluk ile bırak; Escape vazgeçer.</p>
            </div>
            <CloseButton aria-label="İpucunu Kapat" size="sm" onClick={() => setTip(false)} />
          </div>
        ) : null}

        <section aria-labelledby="gorev-pano" className="grid grid-cols-1 gap-3">
          <SectionTitle id="gorev-pano" title="Ekip Panosu" note="Sürüyor kolonu en fazla 4 iş alır" />
          <KanbanBoard key={boardKey} label="Ekip İşleri" defaultColumns={columns} onChange={onChange} onCardOpen={(c) => setOpenId(c.id)} today={TODAY_KEY} />
        </section>

        <LaunchPath />

        <TaskViewsWell />

        <PriceListWell />

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
                    <li key={card.id}>
                      <button
                        type="button"
                        onClick={() => setOpenId(card.id)}
                        className="flex w-full items-center gap-3 rounded-lg bg-surface px-3 py-2.5 text-start ring-1 ring-inset ring-line-soft transition-colors duration-150 hover:bg-surface-raised"
                      >
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
                      </button>
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

          {/* Ekip kararı: panodaki "Kış sezonu fiyat listesi taslağı" (son tarih 6 Kas) için; seçenekler Ayarlar'daki %12 indirim sınırıyla tutarlı. */}
          <Well labelledBy="gorev-karar" className="lg:col-span-2">
            <WellTitle id="gorev-karar" hint="Panodaki işe bağlı küçük kararlar; sonuç oy verince görünür.">
              Ekip Kararı
            </WellTitle>
            <QuickPoll
              question="Kış sezonu fiyat listesinde bayi indirimi kaç olsun?"
              meta="Mert Aksoy soruyor · Kış sezonu fiyat listesi taslağı · 6 Kas'a kadar"
              options={[
                { id: "8", label: "%8 · geçen yılla aynı" },
                { id: "10", label: "%10 · hacim artışı için" },
                { id: "12", label: "%12 · satış kuralının sınırı" },
              ]}
              counts={{ "8": 1, "10": 3, "12": 1 }}
              value={vote}
              onValueChange={setVote}
              className="max-w-2xl"
            />
          </Well>
        </div>
      </div>

      <Sheet
        open={!!openAt}
        onOpenChange={(o) => !o && setOpenId(null)}
        side="right"
        icon={<ListTodo />}
        title={openAt?.card.title ?? ""}
        description={openAt ? `${openAt.col.title} kolonunda · Ekip Panosu` : undefined}
        status={openAt ? <Badge tone={openAt.col.done ? "success" : "neutral"}>{openAt.col.title}</Badge> : undefined}
        footerStart={
          openAt && nextCol && !nextCol.done ? (
            <Button variant="ghost" className="text-primary-ink" onClick={() => moveTo(openAt.card, nextCol.id)}>
              <MoveRight aria-hidden />
              {nextCol.title} Kolonuna Taşı
            </Button>
          ) : undefined
        }
        footer={
          openAt ? (
            <>
              <Button variant="secondary" onClick={() => setOpenId(null)}>
                Kapat
              </Button>
              {!openAt.col.done ? (
                <Button
                  onClick={() => {
                    const done = columns.find((c) => c.done);
                    if (done) moveTo(openAt.card, done.id);
                    setOpenId(null);
                  }}
                >
                  <CheckCircle2 aria-hidden />
                  Tamamlandı
                </Button>
              ) : null}
            </>
          ) : undefined
        }
      >
        {openAt ? (
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-6 gap-y-4 text-base">
            <dt className="text-muted">Sorumlu</dt>
            <dd className="flex min-w-0 items-center gap-2 text-strong">
              {openAt.card.assignee ? (
                <>
                  <Avatar name={openAt.card.assignee.name} size="sm" />
                  <span className="truncate">{openAt.card.assignee.name}</span>
                </>
              ) : (
                "Atanmadı"
              )}
            </dd>
            <dt className="text-muted">Son Tarih</dt>
            <dd className="flex items-center gap-2 text-strong">
              <CalendarDays aria-hidden className="size-4 text-muted" />
              {openAt.card.due ? shortDate.format(parse(openAt.card.due)) : "Yok"}
              {openAt.card.due && !openAt.col.done && openAt.card.due < TODAY_KEY ? <Badge tone="danger">Gecikti</Badge> : null}
              {openAt.card.due === TODAY_KEY && !openAt.col.done ? <Badge tone="warning">Bugün</Badge> : null}
            </dd>
            <dt className="text-muted">Etiketler</dt>
            <dd className="flex flex-wrap gap-1.5">
              {openAt.card.tags?.length ? openAt.card.tags.map((t) => <Badge key={t.label}>{t.label}</Badge>) : <span className="text-muted">Yok</span>}
            </dd>
          </dl>
        ) : null}
      </Sheet>
    </div>
  );
}
