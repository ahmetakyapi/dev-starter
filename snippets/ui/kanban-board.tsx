"use client";

import { LazyMotion, domMax, m, useReducedMotion } from "motion/react";
import { AlertTriangle, CalendarDays, GripVertical } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

/**
 * Kanban panosu: işi kolonlar (Yapılacak → Sürüyor → İncelemede → Bitti)
 * arasında taşıyarak yöneten ekip ekranı. Bir listenin sırası yeterliyse
 * (tek kişi, tek durum) `task-list.tsx`.
 *
 * ÜÇ TAŞIMA YOLU, BAĞIMLILIKSIZ:
 *   Fare  → kartın her yerinden tut, 5 piksel sürükleyince kalkar (tık
 *           ile sürüklemeyi ayırmak için eşik).
 *   Dokunma → yalnızca tutamaktan (sağ üstteki altı nokta, `touch-none`).
 *           Kartın gövdesi dikey/yatay kaydırmaya kalır; tüm kart tutulsaydı
 *           telefonda pano kaydırılamazdı.
 *   Klavye → karta odaklan, Boşluk (ya da Enter) ile tut, ↑ ↓ sırayı, ← →
 *           kolonu değiştirir, Boşluk ile bırak, Escape ile vazgeç (kart ilk
 *           yerine döner). Her adım canlı bölgede okunur: "Sürüyor kolonu,
 *           konum 2 / 3". Odak taşınan kartta kalır (kolon değişince öğe
 *           yeniden bağlanır; odak elle geri verilir).
 *
 * SÜRÜKLEME HAYALETİ `document.body`ye portal: ata bir `transform`
 * taşırsa `position: fixed` ona göre hesaplanır, kart parmaktan kayardı.
 * Hayalet 1,5° eğik ve `shadow-floating` ile "elde" durur; yerinde kesik
 * çizgili boş bir yuva açılır. Diğer kartlar yuvaya `layout` animasyonuyla
 * kayar: bu yüzden bileşen kendi ağacında `domMax` açar (segmented-control
 * ile aynı yol; kök `domAnimation` kalır). Hareket azaltmada kayma anında.
 *
 * WIP SINIRI: kolonun `limit`i varsa sayaç "3 / 4" yazar; sınırda uyarı,
 * aşınca tehlike tonu + üçgen + gizli "sınır aşıldı". Varsayılan `limitMode
 * ="warn"`: taşımaya izin verir, uyarır (çoğu ekip böyle çalışır).
 * `"block"`: dolu kolona bırakılamaz, yuva kırmızı çerçeveyle reddeder,
 * klavyede "dolu" duyurulur.
 *
 * Kart: başlık, etiket rozetleri (`badge.tsx`, kategori tonları), sorumlu
 * (`avatar.tsx`), son tarih. Geciken tarih tehlike tonunda ve "Gecikti"
 * diye YAZILIR (renk tek işaret değil). `done` kolonunda gecikme gösterilmez.
 * "Bugün" `today` prop'undan; verilmezse istemcide hesaplanır (sunucu ile
 * istemci saatinin farkı hidrasyon uyarısı üretmesin diye ilk çizimde yok).
 *
 * Durum içeride (kontrolsüz): `defaultColumns` + `onChange(columns)`.
 * Sunucuya yazmak için `onChange`te sunucu eylemini çağır.
 */

type Tone = "neutral" | "primary" | "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5" | "chart-6";

export type KanbanCard = {
  id: string;
  title: string;
  tags?: readonly { label: string; tone?: Tone }[];
  assignee?: { name: string; src?: string | null };
  /** Son tarih, `YYYY-MM-DD`. */
  due?: string;
};

export type KanbanColumn = {
  id: string;
  title: string;
  /** WIP sınırı. */
  limit?: number;
  /** "Bitti" gibi kapanış kolonu: gecikme vurgusu yok. */
  done?: boolean;
  cards: readonly KanbanCard[];
};

type Target = { col: string; index: number };
type Drag = {
  id: string;
  pointerId: number;
  sx: number;
  sy: number;
  dx: number;
  dy: number;
  w: number;
  h: number;
  x: number;
  y: number;
  started: boolean;
};

const shortDate = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });
const parse = (iso: string) => {
  const [y, mo, d] = iso.split("-").map(Number);
  return new Date(y, (mo ?? 1) - 1, d ?? 1);
};
const noop = () => () => {};
const isoToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Kartı `toCol` kolonunda `toIndex` konumuna taşır. Saf; test edilebilir. */
export function moveCard(columns: readonly KanbanColumn[], cardId: string, toCol: string, toIndex: number): KanbanColumn[] {
  let card: KanbanCard | undefined;
  const without = columns.map((c) => {
    const found = c.cards.find((k) => k.id === cardId);
    if (!found) return c;
    card = found;
    return { ...c, cards: c.cards.filter((k) => k.id !== cardId) };
  });
  if (!card) return [...columns];
  const moved = card;
  return without.map((c) =>
    c.id === toCol ? { ...c, cards: [...c.cards.slice(0, toIndex), moved, ...c.cards.slice(toIndex)] } : c,
  );
}

function locate(columns: readonly KanbanColumn[], cardId: string) {
  for (let ci = 0; ci < columns.length; ci++) {
    const index = columns[ci].cards.findIndex((k) => k.id === cardId);
    if (index >= 0) return { ci, col: columns[ci], index, card: columns[ci].cards[index] };
  }
  return null;
}

function CardBody({ card, today, done, handle }: { card: KanbanCard; today: string | null; done?: boolean; handle?: ReactNode }) {
  const late = !done && !!card.due && !!today && card.due < today;
  const isToday = !done && !!card.due && card.due === today;
  return (
    <>
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-small font-medium text-pretty text-strong">
          {card.title}
        </p>
        {handle}
      </div>
      <div>
      {card.tags?.length ? (
        <div className="mt-2.5 flex flex-wrap gap-1">
          <span className="sr-only">. Etiketler: </span>
          {card.tags.map((tag, i) => (
            <Badge key={tag.label} tone={tag.tone ?? "neutral"} shape="rounded" className="h-5 px-1.5 text-micro">
              {i > 0 ? <span className="sr-only">, </span> : null}
              {tag.label}
            </Badge>
          ))}
        </div>
      ) : null}
      {card.due || card.assignee ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          {card.due ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-micro font-medium tabular-nums",
                late ? "bg-danger-wash text-danger" : isToday ? "bg-warning-wash text-warning" : "text-muted",
              )}
            >
              {late ? <AlertTriangle aria-hidden className="size-3" /> : <CalendarDays aria-hidden className="size-3" />}
              <span className="sr-only">, Son tarih: </span>
              {late ? "Gecikti · " : isToday ? "Bugün · " : ""}
              {shortDate.format(parse(card.due))}
            </span>
          ) : (
            <span />
          )}
          {card.assignee ? (
            <>
              <span className="sr-only">, Sorumlu: {card.assignee.name}</span>
              <Avatar name={card.assignee.name} src={card.assignee.src} size="sm" className="size-6 text-micro" />
            </>
          ) : null}
        </div>
      ) : null}
      </div>
    </>
  );
}

export function KanbanBoard({
  defaultColumns,
  onChange,
  label = "İş panosu",
  limitMode = "warn",
  today: todayProp,
  className,
}: {
  defaultColumns: readonly KanbanColumn[];
  onChange?: (columns: KanbanColumn[]) => void;
  /** Panonun okunan adı. */
  label?: string;
  limitMode?: "warn" | "block";
  /** `YYYY-MM-DD`; gecikme vurgusu buna göre. Hikâye ve testte sabitle. */
  today?: string;
  className?: string;
}) {
  const uid = useId();
  const reduce = useReducedMotion();
  const [columns, setColumns] = useState<KanbanColumn[]>(() => [...defaultColumns]);
  // Sunucuda "bugün" yok (null): istemci saatiyle hidrasyon farkı çıkmasın.
  const clientToday = useSyncExternalStore(noop, isoToday, () => null);
  const today = todayProp ?? clientToday;
  const [drag, setDrag] = useState<Drag | null>(null);
  const [over, setOver] = useState<Target | null>(null);
  const [grab, setGrab] = useState<{ id: string; snapshot: KanbanColumn[] } | null>(null);
  const [live, setLive] = useState("");
  const dragRef = useRef<Drag | null>(null);
  const overRef = useRef<Target | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const lists = useRef(new Map<string, HTMLOListElement>());
  const cards = useRef(new Map<string, HTMLDivElement>());

  // Klavyeyle kolon değişince kart yeni listede yeniden bağlanır: odağı geri ver.
  useEffect(() => {
    if (grab) cards.current.get(grab.id)?.focus({ preventScroll: false });
  }, [grab, columns]);

  const full = (col: KanbanColumn, ignore?: string) =>
    col.limit !== undefined && col.cards.filter((k) => k.id !== ignore).length >= col.limit;

  function commit(next: KanbanColumn[]) {
    setColumns(next);
    onChange?.(next);
  }

  /* ---------- İşaretçi ile sürükleme ---------- */

  // Pencere dinleyicileri: kimliği SABİT sarmalayıcılar (eklenen ile çıkarılan
  // aynı fonksiyon olmalı), içleri her çizimden sonra en güncel işleyiciyi çağırır.
  const latest = useRef<{ move: (e: PointerEvent) => void; stop: (drop: boolean) => void } | null>(null);
  const [listeners] = useState(() => ({
    move: (e: PointerEvent) => latest.current?.move(e),
    up: () => latest.current?.stop(true),
    cancel: () => latest.current?.stop(false),
    key: (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") latest.current?.stop(false);
    },
  }));
  function detach() {
    window.removeEventListener("pointermove", listeners.move);
    window.removeEventListener("pointerup", listeners.up);
    window.removeEventListener("pointercancel", listeners.cancel);
    window.removeEventListener("keydown", listeners.key);
  }


  function hitTest(x: number, y: number, id: string): Target | null {
    let best: { col: string; dist: number } | null = null;
    for (const [col, el] of lists.current) {
      const box = el.closest("[data-column]")?.getBoundingClientRect() ?? el.getBoundingClientRect();
      const dist = x < box.left ? box.left - x : x > box.right ? x - box.right : 0;
      if (!best || dist < best.dist) best = { col, dist };
    }
    if (!best || best.dist > 80) return null;
    const list = lists.current.get(best.col)!;
    const items = [...list.querySelectorAll<HTMLElement>("[data-card]")].filter((el) => el.dataset.card !== id);
    const index = items.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2 < y;
    }).length;
    return { col: best.col, index };
  }

  function onMove(event: PointerEvent) {
    const d = dragRef.current;
    if (!d || event.pointerId !== d.pointerId) return;
    if (!d.started) {
      if (Math.hypot(event.clientX - d.sx, event.clientY - d.sy) < 5) return;
      d.started = true;
    }
    event.preventDefault();
    d.x = event.clientX;
    d.y = event.clientY;
    setDrag({ ...d });
    const target = hitTest(event.clientX, event.clientY, d.id);
    overRef.current = target;
    setOver(target);
    // Kenara yaklaşınca pano kendiliğinden kayar.
    const sc = scroller.current;
    if (sc) {
      const r = sc.getBoundingClientRect();
      if (event.clientX < r.left + 48) sc.scrollLeft -= 14;
      else if (event.clientX > r.right - 48) sc.scrollLeft += 14;
    }
  }

  function stop(drop: boolean) {
    const d = dragRef.current;
    const target = overRef.current;
    detach();
    dragRef.current = null;
    overRef.current = null;
    setDrag(null);
    setOver(null);
    if (!d?.started || !drop || !target) return;
    const cols = columns;
    const to = cols.find((c) => c.id === target.col)!;
    const from = locate(cols, d.id);
    if (!from) return;
    if (limitMode === "block" && from.col.id !== to.id && full(to, d.id)) {
      setLive(`${to.title} kolonu dolu, kart yerinde kaldı.`);
      return;
    }
    if (from.col.id === to.id && from.index === target.index) return;
    commit(moveCard(cols, d.id, target.col, target.index));
    setLive(`${from.card.title}: ${to.title} kolonuna taşındı, konum ${target.index + 1}.`);
  }
  useLayoutEffect(() => {
    latest.current = { move: onMove, stop };
  });

  function startDrag(event: ReactPointerEvent<HTMLElement>, id: string, immediate: boolean) {
    if (event.button !== 0 || grab) return;
    const el = cards.current.get(id);
    if (!el) return;
    const r = el.getBoundingClientRect();
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      sx: event.clientX,
      sy: event.clientY,
      dx: event.clientX - r.left,
      dy: event.clientY - r.top,
      w: r.width,
      h: r.height,
      x: event.clientX,
      y: event.clientY,
      started: immediate,
    };
    if (immediate) {
      event.preventDefault();
      setDrag({ ...dragRef.current });
      const target = hitTest(event.clientX, event.clientY, id);
      overRef.current = target;
      setOver(target);
    }
    window.addEventListener("pointermove", listeners.move, { passive: false });
    window.addEventListener("pointerup", listeners.up);
    window.addEventListener("pointercancel", listeners.cancel);
    window.addEventListener("keydown", listeners.key);
  }

  // Sürükleme sürerken bileşen ayrılırsa pencere dinleyicisi kalmasın.
  useEffect(
    () => () => {
      window.removeEventListener("pointermove", listeners.move);
      window.removeEventListener("pointerup", listeners.up);
      window.removeEventListener("pointercancel", listeners.cancel);
      window.removeEventListener("keydown", listeners.key);
    },
    [listeners],
  );

  /* ---------- Klavye ile taşıma ---------- */

  const position = (cols: readonly KanbanColumn[], id: string) => {
    const at = locate(cols, id);
    return at ? `${at.col.title} kolonu, konum ${at.index + 1} / ${at.col.cards.length}` : "";
  };

  function onCardKey(event: KeyboardEvent<HTMLDivElement>, id: string) {
    const at = locate(columns, id);
    if (!at) return;
    const key = event.key;
    if (!grab) {
      if (key === " " || key === "Enter") {
        event.preventDefault();
        setGrab({ id, snapshot: columns });
        setLive(`${at.card.title} tutuldu. ${position(columns, id)}. Oklarla taşı, Boşluk ile bırak, Escape ile vazgeç.`);
      }
      return;
    }
    if (grab.id !== id) return;
    if (key === " " || key === "Enter") {
      event.preventDefault();
      setGrab(null);
      onChange?.(columns);
      setLive(`${at.card.title} bırakıldı. ${position(columns, id)}.`);
      return;
    }
    if (key === "Escape") {
      event.preventDefault();
      setColumns(grab.snapshot);
      setGrab(null);
      setLive(`Taşıma iptal edildi. ${at.card.title} ilk yerine döndü: ${position(grab.snapshot, id)}.`);
      return;
    }
    let next: KanbanColumn[] | null = null;
    if (key === "ArrowUp" && at.index > 0) next = moveCard(columns, id, at.col.id, at.index - 1);
    else if (key === "ArrowDown" && at.index < at.col.cards.length - 1) next = moveCard(columns, id, at.col.id, at.index + 1);
    else if (key === "ArrowLeft" || key === "ArrowRight") {
      const to = columns[at.ci + (key === "ArrowLeft" ? -1 : 1)];
      if (to) {
        if (limitMode === "block" && full(to, id)) {
          event.preventDefault();
          setLive(`${to.title} kolonu dolu (sınır ${to.limit}).`);
          return;
        }
        next = moveCard(columns, id, to.id, Math.min(at.index, to.cards.length));
      }
    }
    if (key.startsWith("Arrow")) event.preventDefault();
    if (!next) return;
    setColumns(next);
    setLive(position(next, id));
  }

  /* ---------- Çizim ---------- */

  const dragging = drag?.started ? drag : null;
  const view = dragging ? columns.map((c) => ({ ...c, cards: c.cards.filter((k) => k.id !== dragging.id) })) : columns;
  const dragged = dragging ? locate(columns, dragging.id)?.card : undefined;
  const draggedFrom = dragging ? locate(columns, dragging.id)?.col.id : undefined;
  const layoutT = { duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] as const };
  const help = `${uid}-help`;

  return (
    <LazyMotion features={domMax}>
      <div className={cn("w-full", className)}>
        <p id={help} className="sr-only">
          Taşımak için Boşluk tuşuna bas; yukarı ve aşağı ok sırayı, sol ve sağ ok kolonu değiştirir. Bırakmak için Boşluk, vazgeçmek için Escape.
        </p>
        <div
          ref={scroller}
          role="region"
          aria-label={label}
          // Kart yoksa içeride odaklanacak bir şey yok: kaydırma bölgesi klavyeye kendisi açılır.
          tabIndex={columns.some((c) => c.cards.length) ? undefined : 0}
          // relative: içerideki sr-only (mutlak) metinler kabın kırpmasından kaçıp sayfayı yana taşırmasın.
          className="relative -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3 lg:snap-none"
        >
          {view.map((col, ci) => {
            const real = columns[ci];
            const count = real.cards.length;
            const atLimit = real.limit !== undefined && count === real.limit;
            const overLimit = real.limit !== undefined && count > real.limit;
            const isTarget = over?.col === col.id && !!dragging;
            const rejected = isTarget && limitMode === "block" && draggedFrom !== col.id && full(real, dragging?.id);
            const titleId = `${uid}-${col.id}`;
            return (
              <div
                key={col.id}
                role="group"
                data-column={col.id}
                aria-labelledby={titleId}
                className={cn(
                  "flex w-[min(82vw,18rem)] shrink-0 snap-start flex-col rounded-xl bg-surface p-2 transition-[box-shadow] duration-150 lg:w-auto lg:min-w-60 lg:flex-1",
                  isTarget && !rejected && "ring-2 ring-primary/40",
                  rejected && "ring-2 ring-danger/60",
                )}
              >
                <div className="flex items-center justify-between gap-2 px-2 pt-1.5 pb-2.5">
                  <h3 id={titleId} className="truncate text-small font-semibold text-strong">
                    {col.title}
                  </h3>
                  <span
                    className={cn(
                      "inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-micro font-semibold tabular-nums",
                      overLimit ? "bg-danger-wash text-danger" : atLimit ? "bg-warning-wash text-warning" : "bg-overlay text-body shadow-raised",
                    )}
                  >
                    {overLimit ? <AlertTriangle aria-hidden className="size-3" /> : null}
                    <span aria-hidden>{real.limit !== undefined ? `${count} / ${real.limit}` : count}</span>
                    <span className="sr-only">
                      {count} kart{real.limit !== undefined ? `, sınır ${real.limit}` : ""}
                      {overLimit ? ", sınır aşıldı" : atLimit ? ", sınırda" : ""}
                    </span>
                  </span>
                </div>

                <ol
                  ref={(el) => {
                    if (el) lists.current.set(col.id, el);
                    else lists.current.delete(col.id);
                  }}
                  className="flex min-h-24 flex-1 flex-col gap-1.5"
                >
                  {col.cards.map((card, index) => {
                    const held = grab?.id === card.id;
                    return (
                      <FragmentWithSlot key={card.id} show={isTarget && over?.index === index} h={dragging?.h} rejected={rejected}>
                        <m.li layout="position" transition={layoutT} data-card={card.id} className="list-none">
                          <div
                            ref={(el) => {
                              if (el) cards.current.set(card.id, el);
                              else cards.current.delete(card.id);
                            }}
                            role="button"
                            tabIndex={0}
                            aria-roledescription="taşınabilir kart"
                            // Ad İÇERİKTEN: başlık, etiketler, tarih, sorumlu (görünen sırayla,
                            // ayraçlar sr-only). aria-label verilseydi görünen metinle uyuşmazdı
                            // (WCAG 2.5.3). Kullanım tarifi açıklamada.
                            aria-describedby={help}
                            aria-pressed={held}
                            onKeyDown={(e) => onCardKey(e, card.id)}
                            onPointerDown={(e) => e.pointerType === "mouse" && startDrag(e, card.id, false)}
                            className={cn(
                              "group/card relative cursor-grab rounded-lg bg-overlay p-3 shadow-raised outline-offset-2 transition-[box-shadow,scale] duration-150 select-none active:cursor-grabbing",
                              "hover:shadow-floating",
                              held && "scale-[1.02] shadow-floating ring-2 ring-primary",
                            )}
                          >
                            <CardBody
                              card={card}
                              today={today}
                              done={col.done}
                              handle={
                                <span
                                  aria-hidden
                                  onPointerDown={(e) => {
                                    if (e.pointerType === "mouse") return;
                                    e.stopPropagation();
                                    startDrag(e, card.id, true);
                                  }}
                                  className="-m-2 grid size-10 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted transition-opacity duration-150 pointer-fine:size-8 pointer-fine:opacity-0 pointer-fine:group-hover/card:opacity-100 pointer-fine:group-focus-visible/card:opacity-100"
                                >
                                  <GripVertical className="size-4" />
                                </span>
                              }
                            />
                          </div>
                        </m.li>
                      </FragmentWithSlot>
                    );
                  })}
                  {isTarget && over && over.index >= col.cards.length ? <Slot h={dragging?.h} rejected={rejected} /> : null}
                  {col.cards.length === 0 && !isTarget ? (
                    <li className="grid flex-1 place-items-center rounded-lg border border-dashed border-line-strong px-3 py-6 text-center text-small text-muted">
                      Kart yok
                    </li>
                  ) : null}
                </ol>
              </div>
            );
          })}
        </div>

        <p aria-live="assertive" className="sr-only">
          {live}
        </p>

        {dragging && dragged
          ? createPortal(
              <div
                aria-hidden
                className="pointer-events-none fixed top-0 left-0 z-50 rounded-lg bg-overlay p-3 shadow-floating ring-1 ring-line"
                style={{
                  width: dragging.w,
                  transform: `translate(${dragging.x - dragging.dx}px, ${dragging.y - dragging.dy}px) rotate(${reduce ? 0 : 1.5}deg)`,
                }}
              >
                <CardBody card={dragged} today={today} done={columns.find((c) => c.id === draggedFrom)?.done} />
              </div>,
              document.body,
            )
          : null}
      </div>
    </LazyMotion>
  );
}

/** Bırakma yuvası: kartın boyunda kesik çizgili boşluk. */
function Slot({ h, rejected }: { h?: number; rejected?: boolean }) {
  return (
    <li
      aria-hidden
      className={cn("list-none rounded-lg border-2 border-dashed", rejected ? "border-danger/60 bg-danger-wash" : "border-line-strong bg-overlay/50")}
      style={{ height: h ?? 72 }}
    />
  );
}

function FragmentWithSlot({ show, h, rejected, children }: { show: boolean; h?: number; rejected?: boolean; children: ReactNode }) {
  return (
    <>
      {show ? <Slot h={h} rejected={rejected} /> : null}
      {children}
    </>
  );
}
