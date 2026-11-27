"use client";

import { CalendarClock, ChevronRight, FileText, Hand, Lock, Pause, Play, Workflow } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { DigitRoll } from "@/components/ui/digit-roll";
import { StatusIcon } from "@/components/ui/status-icon";
import { cn } from "@/lib/utils";

/**
 * Aşamalı kontrol listesi: bağımlılıkla açılan işler (yeni çalışan süreci,
 * müşteri kurulumu, sözleşme adımları). Aşamalar ("İlk Günden Önce", "İlk
 * Hafta") solda düğüm çizelgesiyle bağlı; her aşamanın sayacı "1/3"
 * (ilk sayı koyu, bölü ve toplam soluk). İş üç halde: Kilitli (kilit ikonu,
 * gri rozet, altında "↳ Bekliyor: X" ya da "↳ Açılış: 23 Kas"), Hazır
 * (açık birincil zemin, "Tamamla" butonu), Tamamlandı (tik).
 *
 * Ne zaman: sırası önemli, birbirini bekleyen 4-20 iş; kimin neyi beklediği
 * görünmeli. Ne zaman DEĞİL: serbest yapılacaklar listesi (`task-list`),
 * çok adımlı form (`stepper`), bağımlılık grafiği (`path-graph`).
 *
 * Nasıl çalışır: `groups` başlangıç durumudur; bileşen içeride tutar ve iş
 * tamamlanınca `onComplete(itemId)` çağırır. Varsayılan açılma kuralı
 * sıralı (`sequential`): Hazır iş kalmayınca sıradaki ilk Kilitli iş Hazır
 * olur; aşama bitince düğümü tike döner, aşama katlanır, sıradaki aşama
 * açılır. Gerçek bağımlılık mantığı sunucudaysa `sequential={false}` ver ve
 * yeni `groups` gönder (prop değişince içerik yenilenir). `autoplay`:
 * tanıtım için görünümdeyken 1,6 sn arayla sıradaki Hazır işi tamamlar,
 * sona gelince başa sarar; hareket azaltmada kapalı, açıkken görünür
 * Durdur/Oynat butonu var (WCAG 2.2.2).
 *
 * Erişilebilirlik: aşama başlığı `aria-expanded` buton; işler `role="list"`
 * / `listitem`, durum gizli metinle okunur ("Kilitli", "Hazır"); her
 * tamamlama canlı bölgede ("Ekip daveti tamamlandı, 2/3"). Katlanma CSS
 * ızgara geçişi; hareket azaltmada anında.
 *
 * Kaynak: Sakin Akış turu (kişisel portfolyo dili); yalnız davranış, kod
 * alınmadı.
 *
 *   <PhaseChecklist label="İşe Başlama" groups={GROUPS} onComplete={save} />
 */

export type PhaseKind = "form" | "flow" | "scheduled" | "manual";
export type PhaseState = "locked" | "ready" | "done";

export type PhaseItem = {
  id: string;
  title: string;
  state: PhaseState;
  kind?: PhaseKind;
  /** Kilitliyken: neyi bekliyor ("Bekliyor: Bordro kaydı"). */
  waitingOn?: { label: string; href?: string };
  /** Kilitliyken: hangi gün açılır. */
  unlocksAt?: string | Date;
  /** Sağ uçta kişi yuvası (`<Avatar size="sm" />`). */
  assignee?: ReactNode;
};

export type PhaseGroup = { id: string; title: string; items: readonly PhaseItem[] };

const KIND: Record<PhaseKind, { label: string; icon: typeof FileText }> = {
  form: { label: "Form", icon: FileText },
  flow: { label: "Akış", icon: Workflow },
  scheduled: { label: "Planlı", icon: CalendarClock },
  manual: { label: "Elle", icon: Hand },
};

const STATE_TEXT: Record<PhaseState, string> = { locked: "Kilitli", ready: "Hazır", done: "Tamamlandı" };

const CSS = `
.ui-pc-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 420ms var(--ease-brand); }
.ui-pc-body[data-open] { grid-template-rows: 1fr; }
.ui-pc-row { transition: background-color 280ms ease; }
@media (prefers-reduced-motion: reduce) { .ui-pc-body, .ui-pc-row { transition: none; } }`;

const dayFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });

/* Sıralı açılma: Hazır iş yoksa sıradaki ilk Kilitli iş Hazır olur. */
function advance(groups: readonly PhaseGroup[]): PhaseGroup[] {
  const all = groups.flatMap((g) => g.items);
  if (all.some((i) => i.state === "ready")) return groups as PhaseGroup[];
  const next = all.find((i) => i.state === "locked");
  if (!next) return groups as PhaseGroup[];
  return groups.map((g) => ({ ...g, items: g.items.map((i) => (i.id === next.id ? { ...i, state: "ready" as const } : i)) }));
}

const isDone = (g: PhaseGroup) => g.items.every((i) => i.state === "done");

type PhaseChecklistProps = {
  groups: readonly PhaseGroup[];
  /** Listenin adı ("İşe Başlama"). */
  label: string;
  onComplete?: (itemId: string) => void;
  /** Sıralı açılma (varsayılan). `false`: açma kuralı çağıranda. */
  sequential?: boolean;
  /** Tanıtım: görünümdeyken kendiliğinden ilerler. */
  autoplay?: boolean;
  interval?: number;
  completeLabel?: string;
  className?: string;
};

export function PhaseChecklist({
  groups,
  label,
  onComplete,
  sequential = true,
  autoplay = false,
  interval = 1600,
  completeLabel = "Tamamla",
  className,
}: PhaseChecklistProps) {
  const [source, setSource] = useState(groups);
  const [state, setState] = useState<PhaseGroup[]>(() => (sequential ? advance(groups) : [...groups]));
  // Prop değişince içerik yenilenir (render sırasında; efektte eşitleme yok).
  if (source !== groups) {
    setSource(groups);
    setState(sequential ? advance(groups) : [...groups]);
  }
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const playing = autoplay && !reduce && !paused && visible;

  function complete(itemId: string) {
    const group = state.find((g) => g.items.some((i) => i.id === itemId));
    const item = group?.items.find((i) => i.id === itemId);
    if (!group || !item || item.state !== "ready") return;
    let next: PhaseGroup[] = state.map((g) => ({ ...g, items: g.items.map((i) => (i.id === itemId ? { ...i, state: "done" as const } : i)) }));
    if (sequential) next = advance(next);
    const g2 = next.find((g) => g.id === group.id)!;
    const done = g2.items.filter((i) => i.state === "done").length;
    setState(next);
    // Biten aşamanın elle açılma kaydı silinir: kendiliğinden katlansın.
    if (isDone(g2))
      setToggled((t) => {
        const rest = { ...t };
        delete rest[group.id];
        return rest;
      });
    setMessage(`${item.title} tamamlandı, ${done}/${g2.items.length}`);
    onComplete?.(itemId);
  }

  useEffect(() => {
    if (!autoplay) return;
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [autoplay]);

  // Zamanlayıcının işi her render'da tazelenen ref'te: süre yalnız durum değişince yeniden kurulur.
  const tick = useRef<() => void>(() => {});
  useEffect(() => {
    tick.current = () => {
      const ready = state.flatMap((g) => g.items).find((i) => i.state === "ready");
      if (ready) complete(ready.id);
      else {
        setState(sequential ? advance(groups) : [...groups]);
        setToggled({});
      }
    };
  });

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => tick.current(), interval);
    return () => clearTimeout(t);
  }, [playing, state, interval]);

  const firstOpen = state.findIndex((g) => !isDone(g));

  return (
    <div ref={root} className={cn("relative grid gap-1", className)}>
      <style href="ui-phase-checklist" precedence="default">
        {CSS}
      </style>
      <p className="sr-only" role="status">
        {message}
      </p>
      {autoplay && !reduce && (
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
          className="absolute -top-1 right-0 z-10 inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-micro text-muted hover:bg-surface hover:text-strong pointer-coarse:h-11"
        >
          {paused ? <Play aria-hidden className="size-3" /> : <Pause aria-hidden className="size-3" />}
          {paused ? "Oynat" : "Durdur"}
        </button>
      )}
      {/* Düğümleri bağlayan dikey kıl çizgi. */}
      <span aria-hidden className="absolute top-4 bottom-4 left-[9px] w-px bg-line" />
      <h3 className="sr-only">{label}</h3>
      {state.map((group, gi) => {
        const done = group.items.filter((i) => i.state === "done").length;
        const finished = done === group.items.length;
        const active = group.items.some((i) => i.state === "ready");
        const open = toggled[group.id] ?? (!finished && (active || gi === firstOpen));
        const bodyId = `${id}-${group.id}`;
        return (
          <section key={group.id} aria-label={group.title} className="relative grid grid-cols-[20px_minmax(0,1fr)] gap-x-3">
            <span className="relative z-[1] mt-1.5 grid size-5 place-items-center rounded-full bg-page">
              <StatusIcon status={finished ? "done" : active ? "progress" : "todo"} size={16} className={!finished && !active ? "text-soft" : undefined} />
            </span>
            <div className="min-w-0">
              <button
                type="button"
                aria-expanded={open}
                aria-controls={bodyId}
                onClick={() => setToggled((t) => ({ ...t, [group.id]: !open }))}
                className="flex min-h-8 items-center gap-1.5 rounded-lg px-1 text-small font-medium text-strong hover:bg-surface pointer-coarse:min-h-11"
              >
                <ChevronRight aria-hidden className={cn("size-3.5 text-soft transition-transform duration-200", open && "rotate-90")} />
                {group.title}
                <span className="ml-1 inline-flex items-center rounded-md bg-surface px-1.5 text-micro font-normal tabular-nums">
                  <DigitRoll value={done} className="text-strong" />
                  <span className="text-soft">&nbsp;/&nbsp;{group.items.length}</span>
                </span>
              </button>
              <div id={bodyId} className="ui-pc-body" data-open={open || undefined} inert={!open}>
                <div className="overflow-hidden">
                  <ul role="list" className="mt-1 mb-2 grid overflow-hidden rounded-xl bg-overlay ring-1 ring-line">
                    {group.items.map((item) => (
                      <Row key={item.id} item={item} onComplete={() => complete(item.id)} completeLabel={completeLabel} />
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Row({ item, onComplete, completeLabel }: { item: PhaseItem; onComplete: () => void; completeLabel: string }) {
  const kind = item.kind ? KIND[item.kind] : null;
  const unlock = item.unlocksAt ? dayFmt.format(typeof item.unlocksAt === "string" ? new Date(item.unlocksAt) : item.unlocksAt) : null;
  return (
    <li role="listitem" className={cn("ui-pc-row grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-x-2.5 px-3 py-2", item.state === "ready" && "bg-primary-wash")}>
      {item.state === "locked" ? (
        <Lock aria-hidden className="size-3.5 text-soft" strokeWidth={1.8} />
      ) : (
        <StatusIcon status={item.state === "done" ? "done" : "progress"} size={15} />
      )}
      <div className="min-w-0">
        <p className={cn("truncate text-small", item.state === "locked" ? "text-muted" : "text-strong")}>
          {item.title}
          <span className="sr-only">, {STATE_TEXT[item.state]}</span>
        </p>
        {item.state === "locked" && (item.waitingOn || unlock) && (
          <p className="truncate text-micro text-soft">
            <span aria-hidden>↳ </span>
            {item.waitingOn ? (
              <>
                Bekliyor:{" "}
                {item.waitingOn.href ? (
                  <a href={item.waitingOn.href} className="underline decoration-line-strong underline-offset-2 hover:text-strong">
                    {item.waitingOn.label}
                  </a>
                ) : (
                  <span className="underline decoration-line-strong underline-offset-2">{item.waitingOn.label}</span>
                )}
              </>
            ) : (
              <>Açılış: {unlock}</>
            )}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        {kind && (
          <span className="hidden items-center gap-1 text-micro text-soft sm:inline-flex">
            <kind.icon aria-hidden className="size-3" strokeWidth={1.8} />
            {kind.label}
          </span>
        )}
        {item.state === "ready" ? (
          <button
            type="button"
            onClick={onComplete}
            aria-label={`${completeLabel}: ${item.title}`}
            className="inline-flex h-6 items-center rounded-full bg-strong px-2.5 text-micro text-page transition-transform duration-150 active:scale-[0.97] pointer-coarse:h-11"
          >
            {completeLabel}
          </button>
        ) : (
          <span aria-hidden className={cn("rounded-md px-1.5 py-0.5 text-micro", item.state === "locked" ? "bg-surface text-muted" : "text-success")}>
            {STATE_TEXT[item.state]}
          </span>
        )}
        {item.assignee}
      </div>
    </li>
  );
}
