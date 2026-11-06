// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { MapPin } from "lucide-react";
import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Haftalık takvim (ajanda): bir haftanın randevu ve toplantılarını saat
 * ızgarasında göstermek için. Tarih SEÇMEK için değil (o `date-calendar.tsx`);
 * zaman içinde ne nerede, kime çakışıyor sorusu için.
 *
 * ÇAKIŞANLAR YAN YANA: zaman aralığı kesişen etkinlikler bir "küme"
 * oluşturur; küme içinde her etkinlik boş ilk şeride yerleşir ve kümenin
 * şerit sayısı kadar daralır (`layoutDay`, saf, test edilebilir). Üst üste
 * bindirip saydamlaştırmak yerine yan yana: başlıkların hepsi okunur.
 *
 * Blok rengi kategori (`--chart-N`) PASTEL YIKAMA (%22) ve yazı
 * `text-strong`: grafik rengi metin rengi olmaz (açık zeminde AA tutmaz).
 * Tek kenarda renkli şerit YOK (AI-slop imzası); kategoriyi küçük nokta ve
 * zemin tonu taşır. 30 dakikadan kısa blokta yalnız başlık.
 *
 * ŞU AN ÇİZGİSİ: bugünün kolonunda tehlike tonunda ince çizgi + nokta,
 * dakikada bir güncellenir. "Şu an" istemcide bilinir: sunucu çiziminde yok
 * (`useSyncExternalStore` sunucu anlık görüntüsü `null`), hidrasyon farkı
 * çıkmaz. Hikâye ve testte `now` ile sabitle.
 *
 * TELEFONDA (md altı) ızgara yerine GÜN GÜN LİSTE: yedi dar kolonda başlık
 * okunmaz. Üstte günler hap düğmeleri (`aria-pressed`, gün adı + tarih +
 * etkinlik sayısı), altında seçili günün saat sıralı listesi. Varsayılan
 * gün bugün (haftadaysa), değilse haftanın ilk günü.
 *
 * Erişilebilirlik: her gün `role="group"` + gizli başlık ("4 Kasım
 * Çarşamba"; `section` değil: yedi gün yedi landmark olup sayfa haritasını
 * boğardı), etkinlikler `ol` içinde. `onSelect` verilirse bloklar düğme
 * olur ve adı GÖRÜNEN metinle aynı sırada (başlık, saat, yer; WCAG 2.5.3):
 * kısa blokta saat görünmese de `sr-only` olarak adda. Saat sütunu
 * `aria-hidden`. Gün adları ve tarihler `tr-TR`;
 * hafta pazartesi başlar.
 */

export type CalendarEvent = {
  id: string;
  title: string;
  /** Yerel saat, ISO: "2026-11-03T09:30". */
  start: string;
  end: string;
  location?: string;
  /** Kategori rengi 1-6. */
  series?: 1 | 2 | 3 | 4 | 5 | 6;
};

const WASH = ["bg-chart-1/22", "bg-chart-2/22", "bg-chart-3/22", "bg-chart-4/22", "bg-chart-5/22", "bg-chart-6/22"] as const;
const DOT = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5", "bg-chart-6"] as const;

const dayShort = new Intl.DateTimeFormat("tr-TR", { weekday: "short" });
const dayLong = new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long" });
const time = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" });

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const minutes = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** Pazartesi başlayan haftanın 7 günü. */
export function weekDays(anyDay: Date): Date[] {
  const start = new Date(anyDay.getFullYear(), anyDay.getMonth(), anyDay.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

/** Bir günün etkinliklerini şeritlere yerleştirir: `lane` / `lanes` (küme genişliği). Saf. */
export function layoutDay<T extends { start: string; end: string }>(events: readonly T[]) {
  const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start) || b.end.localeCompare(a.end));
  const out: { event: T; lane: number; lanes: number }[] = [];
  let cluster: { event: T; lane: number; lanes: number }[] = [];
  let laneEnds: string[] = [];
  let clusterEnd = "";
  const flush = () => {
    for (const item of cluster) item.lanes = laneEnds.length;
    out.push(...cluster);
    cluster = [];
    laneEnds = [];
  };
  for (const event of sorted) {
    if (cluster.length && event.start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= event.start);
    if (lane < 0) lane = laneEnds.push(event.end) - 1;
    else laneEnds[lane] = event.end;
    cluster.push({ event, lane, lanes: 1 });
    clusterEnd = cluster.length === 1 || event.end > clusterEnd ? event.end : clusterEnd;
  }
  flush();
  return out;
}

const subscribeMinute = (cb: () => void) => {
  const t = setInterval(cb, 60_000);
  return () => clearInterval(t);
};
// Anlık görüntü dakika hassasiyetinde: aynı dakikada aynı değer (sonsuz döngü olmaz).
const nowSnapshot = () => Math.floor(Date.now() / 60_000) * 60_000;

export function WeekCalendar({
  week,
  events,
  startHour = 8,
  endHour = 19,
  now: nowProp,
  hourHeight = 52,
  onSelect,
  label = "Haftalık takvim",
  className,
}: {
  /** Haftanın herhangi bir günü, `YYYY-MM-DD`. */
  week: string;
  events: readonly CalendarEvent[];
  startHour?: number;
  endHour?: number;
  /** Şu an, ISO; verilmezse istemci saati. */
  now?: string;
  /** Bir saatin piksel yüksekliği (ızgara). */
  hourHeight?: number;
  onSelect?: (event: CalendarEvent) => void;
  label?: string;
  className?: string;
}) {
  const uid = useId();
  const clientNow = useSyncExternalStore(subscribeMinute, nowSnapshot, () => null);
  const now = nowProp ? new Date(nowProp) : clientNow !== null ? new Date(clientNow) : null;
  const [y, mo, d] = week.split("-").map(Number);
  const days = weekDays(new Date(y, mo - 1, d));
  const keys = days.map(ymd);
  const todayKey = now ? ymd(now) : null;
  const [picked, setPicked] = useState<string | null>(null);
  const selected = picked ?? (todayKey && keys.includes(todayKey) ? todayKey : keys[0]);

  // Hafta değişince telefon seçimi sıfırlanır.
  const [shownWeek, setShownWeek] = useState(week);
  if (shownWeek !== week) {
    setShownWeek(week);
    setPicked(null);
  }

  const byDay = new Map(keys.map((k) => [k, [] as CalendarEvent[]]));
  for (const e of events) byDay.get(e.start.slice(0, 10))?.push(e);
  for (const list of byDay.values()) list.sort((a, b) => a.start.localeCompare(b.start));

  const span = (endHour - startHour) * 60;
  const top = (m: number) => ((Math.min(Math.max(m - startHour * 60, 0), span)) / span) * 100;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const range = (e: CalendarEvent) => `${time.format(new Date(e.start))}–${time.format(new Date(e.end))}`;
  const spoken = (e: CalendarEvent) => [range(e), e.title, e.location].filter(Boolean).join(", ");

  return (
    <div className={cn("w-full", className)}>
      {/* ---------- Telefon: gün gün liste ---------- */}
      <div className="md:hidden">
        <div role="group" aria-label="Gün seç" className="flex gap-0.5">
          {days.map((day, i) => {
            const key = keys[i];
            const on = key === selected;
            const count = byDay.get(key)?.length ?? 0;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => setPicked(key)}
                className={cn(
                  "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 transition-[background-color,box-shadow,color] duration-150",
                  on ? "bg-overlay text-strong shadow-raised" : "text-muted hover:text-body",
                )}
              >
                <span className="sr-only">
                  {dayLong.format(day)}, {count ? `${count} etkinlik` : "etkinlik yok"}
                </span>
                <span aria-hidden className="text-micro">
                  {dayShort.format(day)}
                </span>
                <span aria-hidden className={cn("grid size-7 place-items-center rounded-full text-small font-semibold tabular-nums", key === todayKey && "bg-cta text-on-brand")}>
                  {day.getDate()}
                </span>
                <span aria-hidden className={cn("size-1 rounded-full", count ? "bg-line-strong" : "bg-transparent")} />
              </button>
            );
          })}
        </div>
        {days.map((day, i) => {
          const key = keys[i];
          if (key !== selected) return null;
          const list = byDay.get(key) ?? [];
          return (
            <div key={key} role="group" aria-labelledby={`${uid}-m-${key}`} className="mt-3">
              <h3 id={`${uid}-m-${key}`} className="px-1 text-small font-semibold text-strong first-letter:uppercase">
                {dayLong.format(day)}
              </h3>
              {list.length ? (
                <ol className="mt-2 grid gap-1.5">
                  {list.map((e) => (
                    <li key={e.id}>
                      <EventShell event={e} onSelect={onSelect} spoken={spoken(e)} className="flex gap-3 rounded-lg bg-overlay px-3 py-2.5 text-left shadow-raised">
                        <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", DOT[(e.series ?? 1) - 1])} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-micro text-muted tabular-nums">{range(e)}</span>
                          <span className="block text-small font-medium text-strong">{e.title}</span>
                          {e.location ? (
                            <span className="mt-0.5 flex items-center gap-1 text-micro text-muted">
                              <MapPin aria-hidden className="size-3" />
                              {e.location}
                            </span>
                          ) : null}
                        </span>
                      </EventShell>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 rounded-lg border border-dashed border-line-strong px-3 py-6 text-center text-small text-muted">Bu gün boş</p>
              )}
            </div>
          );
        })}
      </div>

      {/* ---------- Geniş ekran: saat ızgarası ---------- */}
      <div role="region" aria-label={label} className="max-md:hidden">
        <div className="grid grid-cols-[3rem_repeat(7,minmax(0,1fr))]">
          <span aria-hidden />
          {days.map((day, i) => {
            const isToday = keys[i] === todayKey;
            return (
              <p key={keys[i]} aria-hidden className="flex flex-col items-center gap-0.5 pb-2 text-center">
                <span className={cn("text-micro", isToday ? "font-semibold text-strong" : "text-muted")}>{dayShort.format(day)}</span>
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full text-small font-semibold tabular-nums",
                    isToday ? "bg-cta text-on-brand shadow-cta" : "text-strong",
                  )}
                >
                  {day.getDate()}
                </span>
              </p>
            );
          })}
        </div>

        <div className="grid grid-cols-[3rem_repeat(7,minmax(0,1fr))]" style={{ height: (endHour - startHour) * hourHeight }}>
          {/* Saat sütunu */}
          <div aria-hidden className="relative text-micro text-muted tabular-nums">
            {hours.map((h, i) => (
              <span key={h} className={cn("absolute right-2", i === 0 ? "top-0" : "-translate-y-1/2")} style={i === 0 ? undefined : { top: `${(i / (hours.length - 1)) * 100}%` }}>
                {i === hours.length - 1 ? "" : `${pad(h)}:00`}
              </span>
            ))}
          </div>

          {days.map((day, i) => {
            const key = keys[i];
            const placed = layoutDay(byDay.get(key) ?? []);
            const isToday = key === todayKey;
            const nowTop = now && isToday ? top(minutes(now)) : null;
            const nowVisible = now && isToday && minutes(now) >= startHour * 60 && minutes(now) <= endHour * 60;
            return (
              <div
                key={key}
                role="group"
                aria-labelledby={`${uid}-g-${key}`}
                className={cn("relative border-l border-line-soft", isToday && "bg-primary-wash/40")}
              >
                <h3 id={`${uid}-g-${key}`} className="sr-only">
                  {dayLong.format(day)}
                  {placed.length ? "" : ", etkinlik yok"}
                </h3>
                {/* Saat çizgileri */}
                <div aria-hidden className="pointer-events-none absolute inset-0">
                  {hours.slice(1, -1).map((h, hi) => (
                    <span key={h} className="absolute inset-x-0 border-t border-line-soft" style={{ top: `${((hi + 1) / (hours.length - 1)) * 100}%` }} />
                  ))}
                </div>

                {placed.length ? (
                  <ol className="absolute inset-0">
                    {placed.map(({ event: e, lane, lanes }) => {
                      const s = minutes(new Date(e.start));
                      const en = minutes(new Date(e.end));
                      const short = en - s < 45;
                      return (
                        <li
                          key={e.id}
                          className="absolute px-0.5"
                          style={{
                            top: `${top(s)}%`,
                            height: `${Math.max(top(en) - top(s), 2.5)}%`,
                            left: `${(lane / lanes) * 100}%`,
                            width: `${100 / lanes}%`,
                          }}
                        >
                          <EventShell
                            event={e}
                            onSelect={onSelect}
                            spoken={spoken(e)}
                            className={cn(
                              "flex size-full flex-col overflow-hidden rounded-md px-1.5 py-1 text-left ring-1 ring-overlay ring-inset",
                              WASH[(e.series ?? 1) - 1],
                              short && "justify-center py-0",
                            )}
                          >
                            <span className="flex min-w-0 items-center gap-1">
                              <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", DOT[(e.series ?? 1) - 1])} />
                              <span className="truncate text-micro font-semibold text-strong">{e.title}</span>
                            </span>
                            <span className={cn("truncate text-micro text-strong tabular-nums", short && "sr-only")}>{range(e)}</span>
                            {!short && e.location && en - s >= 75 ? <span className="truncate text-micro text-strong">{e.location}</span> : null}
                          </EventShell>
                        </li>
                      );
                    })}
                  </ol>
                ) : null}

                {nowVisible && nowTop !== null ? (
                  <div aria-hidden className="pointer-events-none absolute inset-x-0 z-10" style={{ top: `${nowTop}%` }}>
                    <span className="absolute inset-x-0 h-0.5 -translate-y-1/2 bg-danger" />
                    <span className="absolute left-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-danger ring-2 ring-overlay" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Blok kabı: `onSelect` varsa düğme, yoksa düz öğe; okunan metin saatle başlar. */
function EventShell({
  event,
  onSelect,
  spoken,
  className,
  children,
}: {
  event: CalendarEvent;
  onSelect?: (event: CalendarEvent) => void;
  spoken: string;
  className?: string;
  children: ReactNode;
}) {
  if (onSelect)
    return (
      // Ad içerikten: görünen metinle aynı sırada (WCAG 2.5.3), saat gizliyse sr-only.
      <button type="button" onClick={() => onSelect(event)} className={cn("w-full transition-[box-shadow] duration-150 hover:shadow-raised", className)}>
        {children}
      </button>
    );
  return (
    <div className={className}>
      <span className="sr-only">{spoken}</span>
      <span aria-hidden className="contents">
        {children}
      </span>
    </div>
  );
}
