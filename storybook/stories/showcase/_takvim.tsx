"use client";

import { useMemo, useState } from "react";
import { CalendarCheck2, CalendarPlus, ChevronDown, ChevronLeft, ChevronRight, Handshake, MapPin, Plus, Shirt, Truck, Users, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonGroup } from "@/components/ui/button-group";
import { DateCalendar, type DateRange } from "@/components/ui/date-calendar";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import { TickRuler } from "@/components/ui/tick-ruler";
import { TimeField } from "@/components/ui/time-field";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { WeekCalendar, type CalendarEvent as WeekEvent } from "@/components/ui/week-calendar";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  BOARD,
  CUSTOMERS,
  EVENTS,
  MY_TASKS,
  TEAM,
  TODAY,
  addDays,
  clock,
  customer,
  dayKey,
  longDate,
  member,
  num,
  shortDate,
  type CalendarEvent,
} from "./_data";
import { INK, PageBar, Well, WellTitle, useApp } from "./_ui";
import { useId } from "react";

const KINDS = ["Görüşme", "Teslimat", "Numune", "İç Toplantı"] as const;
const KIND_TONE = { Görüşme: "chart-2", Teslimat: "chart-1", Numune: "chart-3", "İç Toplantı": "chart-4" } as const;
/** Haftalık ızgarada aynı renk: rozetin tonu = bloğun `--chart-N` yıkaması. */
const KIND_SERIES = { Görüşme: 2, Teslimat: 1, Numune: 3, "İç Toplantı": 4 } as const;
/** Kart görünümündeki tür ikonu (emoji değil: ikon ailesi uygulamayla aynı). */
const KIND_ICON = { Görüşme: <Handshake />, Teslimat: <Truck />, Numune: <Shirt />, "İç Toplantı": <Users /> } as const;
type Kind = (typeof KINDS)[number];
const hm = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${dayKey(d)}T${hm(d.getHours())}:${hm(d.getMinutes())}`;
const STEPS = [
  { label: "Müşteri", description: "Kim ve ne için" },
  { label: "Zaman", description: "Gün, saat ve süre" },
  { label: "Onay", description: "Gözden geçir" },
];

/** Pazartesi başlayan hafta. */
const weekOf = (d: Date): DateRange => {
  const start = addDays(d, -((d.getDay() + 6) % 7));
  return { start, end: addDays(start, 6) };
};
const isSunday = (d: Date) => d.getDay() === 0;

export function TakvimPage() {
  const { notify } = useApp();
  const [events, setEvents] = useState<readonly CalendarEvent[]>(EVENTS);
  const [range, setRange] = useState<DateRange>(weekOf(TODAY));
  const [step, setStep] = useState(0);
  const [who, setWho] = useState<string | null>("atlas");
  const [kind, setKind] = useState<string | null>("Görüşme");
  const [owner, setOwner] = useState<string | null>("mert");
  const [day, setDay] = useState<Date | null>(new Date(2026, 10, 5));
  const [time, setTime] = useState<string | null>("14:30");
  const [minutes, setMinutes] = useState<number | null>(45);
  const [confirm, setConfirm] = useState(false);
  const [shown, setShown] = useState<Kind[]>([...KINDS]);

  const end = range.end ?? range.start;
  const inRange = useMemo(
    () => events.filter((e) => e.date >= range.start && e.date < addDays(end, 1)).sort((a, b) => a.date.getTime() - b.date.getTime()),
    [events, range.start, end],
  );
  const days = [...new Set(inRange.map((e) => dayKey(e.date)))];
  const monthEvents = events.filter((e) => e.date.getMonth() === 10);
  const next = [...events].sort((a, b) => a.date.getTime() - b.date.getTime()).find((e) => e.date > TODAY);

  const weekEvents: WeekEvent[] = [
    ...events
      .filter((e) => shown.includes(e.kind))
      .map((e) => ({
        id: e.id,
        title: e.title,
        start: iso(e.date),
        end: iso(new Date(e.date.getTime() + e.minutes * 60_000)),
        location: e.customerId ? `${customer(e.customerId).name} · ${e.place}` : e.place,
        series: KIND_SERIES[e.kind],
        icon: KIND_ICON[e.kind],
        // Katılımcılar: sorumlu + müşteri yetkilisi; iç toplantıda ekip.
        attendees: e.kind === "İç Toplantı" ? TEAM.map((m) => m.name) : [member(e.owner).name, ...(e.customerId ? [customer(e.customerId).contact] : [])],
        action:
          e.place === "Görüntülü Görüşme"
            ? { label: "Görüşmeye Katıl", icon: <Video />, onClick: () => notify({ tone: "info", title: "Görüşme Bağlantısı Açıldı", body: `${e.title} · ${clock.format(e.date)}` }) }
            : undefined,
      })),
    // Tüm gün satırı: ekip panosundaki bitmemiş işlerin son tarihleri (Görevler ile aynı kayıt).
    ...BOARD.filter((c) => !c.done)
      .flatMap((c) => c.cards)
      .filter((c) => c.due)
      .map((c) => ({ id: `son-${c.id}`, title: c.title, start: `${c.due}T00:00`, end: `${c.due}T23:59`, allDay: true, series: 6 as const })),
  ];

  const shift = (weeks: number) => {
    const start = addDays(range.start, weeks * 7);
    setRange({ start, end: addDays(start, 6) });
  };

  const ready0 = Boolean(who && kind && owner);
  const ready1 = Boolean(day && time && minutes);

  const create = () => {
    if (!day || !time || !who || !kind || !owner || !minutes) return;
    const [h, m] = time.split(":").map(Number);
    const date = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
    const title = `${kind}: ${customer(who).name}`;
    setEvents((list) => [
      ...list,
      { id: `yeni-${list.length}`, title, customerId: who, date, minutes, kind: kind as CalendarEvent["kind"], owner, place: "Görüntülü Görüşme" },
    ]);
    setRange(weekOf(date));
    setConfirm(false);
    setStep(0);
    notify({ tone: "success", title: "Randevu Oluşturuldu", body: `${title} · ${longDate.format(date)}, ${clock.format(date)}` });
  };

  return (
    <div className="flex min-h-full flex-col">
      <PageBar
        title="Takvim"
        description={`Kasım 2026 · ${num.format(monthEvents.length)} Etkinlik`}
        actions={
          <Button size="sm" className={INK} onClick={() => document.getElementById("randevu")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
            <CalendarPlus aria-hidden />
            Randevu Oluştur
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 p-4 sm:p-6">
        {/* Referans turu (2026-11): solda "Bugün" paneli (ay takvimi, Yapılacaklar / Etkinlikler),
            sağda ferah haftalık ızgara; ikisi tek kartta, aralarında saç çizgisi. */}
        <section aria-labelledby="takvim-hafta" className="grid grid-cols-1 overflow-hidden rounded-xl bg-overlay shadow-raised ring-1 ring-line lg:grid-cols-[18rem_minmax(0,1fr)]">
          <TodayPanel range={range} setRange={setRange} inRange={inRange} days={days} next={next} />

          <div className="min-w-0 border-t border-line-soft p-3 sm:p-4 lg:border-t-0 lg:border-l">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
              <div>
                <h2 id="takvim-hafta" className="text-title font-semibold tracking-tight text-strong">
                  {shortDate.format(weekOf(range.start).start)} – {shortDate.format(addDays(weekOf(range.start).start, 4))} {weekOf(range.start).start.getFullYear()}
                </h2>
                <p className="mt-0.5 text-small text-muted">
                  {num.format(weekEvents.filter((e) => !e.allDay && e.start.slice(0, 10) >= dayKey(weekOf(range.start).start) && e.start.slice(0, 10) <= dayKey(addDays(weekOf(range.start).start, 4))).length)} etkinlik · iş haftası
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ToggleGroup<Kind>
                  aria-label="Gösterilen Etkinlik Türleri"
                  multiple
                  size="sm"
                  value={shown}
                  onValueChange={setShown}
                  items={KINDS.map((k) => ({ value: k, label: k }))}
                />
                <ButtonGroup aria-label="Hafta Gezinmesi">
                  <Button variant="secondary" size="sm" onClick={() => shift(-1)} aria-label="Önceki Hafta">
                    <ChevronLeft aria-hidden />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setRange(weekOf(TODAY))}>
                    Bu Hafta
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => shift(1)} aria-label="Sonraki Hafta">
                    <ChevronRight aria-hidden />
                  </Button>
                </ButtonGroup>
              </div>
            </div>
            <WeekCalendar
              label="Haftalık Takvim"
              variant="card"
              weekdaysOnly
              timeZone="GMT+3"
              allDayLabel="Son Tarih"
              week={dayKey(range.start)}
              events={weekEvents}
              now={iso(TODAY)}
              startHour={9}
              endHour={17}
              hourHeight={112}
            />
          </div>
        </section>

        <Well labelledBy="randevu" className="scroll-mt-4">
          <WellTitle id="randevu" hint="Üç adım: müşteri, zaman, onay. Pazar günleri kapalı.">
            Randevu Oluştur
          </WellTitle>
          <div className="rounded-lg bg-surface p-4 ring-1 ring-inset ring-line-soft sm:p-6">
            <Stepper steps={STEPS} current={step} aria-label="Randevu Adımları" />
            <div className="mt-6 border-t border-line-soft pt-6">
              {step === 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Select label="Müşteri" value={who} onValueChange={setWho} items={CUSTOMERS.map((c) => ({ value: c.id, label: c.name }))} placeholder="Müşteri seç" />
                  <Select label="Tür" value={kind} onValueChange={setKind} items={KINDS.map((k) => ({ value: k, label: k }))} />
                  <Select label="Sorumlu" value={owner} onValueChange={setOwner} items={TEAM.map((m) => ({ value: m.id, label: m.name }))} />
                </div>
              ) : step === 1 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <DatePicker
                    label="Gün"
                    value={day}
                    onValueChange={setDay}
                    min={TODAY}
                    isDateDisabled={isSunday}
                    defaultMonth={TODAY}
                    hint="Pazar günleri seçilemez."
                  />
                  <TimeField label="Saat" value={time} onValueChange={setTime} minuteStep={15} hint="Mesai 09.00–18.00." />
                  <TickRuler label="Süre" min={15} max={180} step={15} majorEvery={2} unit="dk" value={minutes ?? 45} onValueChange={setMinutes} spacing={18} />
                </div>
              ) : (
                <dl className="grid grid-cols-1 gap-3 text-base sm:grid-cols-3">
                  {[
                    ["Müşteri", who ? `${customer(who).name} · ${customer(who).contact}` : "Seçilmedi"],
                    ["Tür ve Sorumlu", `${kind ?? "Seçilmedi"} · ${owner ? member(owner).name : "Seçilmedi"}`],
                    ["Zaman", day && time ? `${longDate.format(day)}, ${time} · ${minutes ?? 0} dk` : "Seçilmedi"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-surface px-3 py-2.5">
                      <dt className="text-small text-muted">{k}</dt>
                      <dd className="mt-0.5 font-medium text-strong">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            <div className="mt-6 flex flex-wrap justify-between gap-2">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                Geri
              </Button>
              {step < 2 ? (
                <Button disabled={step === 0 ? !ready0 : !ready1} onClick={() => setStep((s) => s + 1)}>
                  Devam
                </Button>
              ) : (
                <Button onClick={() => setConfirm(true)}>Randevuyu Onayla</Button>
              )}
            </div>
          </div>
        </Well>
      </div>

      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        size="sm"
        title="Randevu Oluşturulsun mu?"
        description={
          who && day && time
            ? `${customer(who).contact} (${customer(who).name}) için ${longDate.format(day)}, ${time} saatine ${minutes ?? 0} dakikalık ${kind?.toLocaleLowerCase("tr-TR")} eklenecek ve davet e-postası gidecek.`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" data-autofocus onClick={() => setConfirm(false)}>
              Vazgeç
            </Button>
            <Button onClick={create}>Oluştur ve Davet Gönder</Button>
          </>
        }
      />
    </div>
  );
}

type Todo = { id: string; title: string; done: boolean; due?: string };
type Group = { id: string; label: string; match: (t: Todo) => boolean; due?: string };

/**
 * Sol "Bugün" paneli: ay takvimi (aralık seçer, ızgara onu izler) ve iki
 * sekme. Yapılacaklar Ahmet'in görev listesinden (Görevler ile aynı kayıt),
 * son tarihe göre gruplu; her grup açılıp kapanır ve "+" ile o gruba iş
 * eklenir (Planlanmamış: tarihsiz). Etkinlikler seçili aralığın ajandası.
 */
function TodayPanel({
  range,
  setRange,
  inRange,
  days,
  next,
}: {
  range: DateRange;
  setRange: (r: DateRange) => void;
  inRange: readonly CalendarEvent[];
  days: readonly string[];
  next?: CalendarEvent;
}) {
  const today = dayKey(TODAY);
  const weekEnd = dayKey(weekOf(TODAY).end!);
  const [todos, setTodos] = useState<Todo[]>(() => MY_TASKS.map((t) => ({ id: t.id, title: t.title, done: t.done, due: t.due })));
  const [tab, setTab] = useState("yapilacak");
  const groups: readonly Group[] = [
    { id: "bugun", label: "Bugün", match: (t) => t.due === today, due: today },
    { id: "hafta", label: "Bu Hafta", match: (t) => Boolean(t.due && t.due > today && t.due <= weekEnd), due: dayKey(addDays(TODAY, 1)) },
    { id: "sonra", label: "Daha Sonra", match: (t) => Boolean(t.due && t.due > weekEnd), due: dayKey(addDays(TODAY, 7)) },
    { id: "plansiz", label: "Planlanmamış", match: (t) => !t.due },
  ];
  const open = todos.filter((t) => !t.done).length;

  const yapilacak = (
    <div className="grid gap-1 pt-3">
      {groups.map((g) => (
        <TodoGroup
          key={g.id}
          group={g}
          items={todos.filter(g.match)}
          onToggle={(id) => setTodos((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))}
          onAdd={(title) => setTodos((list) => [...list, { id: `yeni-${list.length}`, title, done: false, due: g.due }])}
        />
      ))}
    </div>
  );

  const etkinlik = (
    <div className="grid gap-3 pt-3">
      {next ? (
        <div className="rounded-lg bg-surface p-3 ring-1 ring-inset ring-line-soft">
          <p className="text-micro text-muted">Sıradaki · {longDate.format(next.date)}</p>
          <p className="mt-1 text-small font-medium text-strong">
            <span className="tabular-nums">{clock.format(next.date)}</span> · {next.title}
          </p>
        </div>
      ) : null}
      {inRange.length === 0 ? (
        <EmptyState className="bg-surface" icon={<CalendarCheck2 />} title="Bu Aralıkta Etkinlik Yok" hint="Takvimden başka bir hafta seç." />
      ) : (
        <ol className="grid gap-3">
          {days.map((key) => {
            const list = inRange.filter((e) => dayKey(e.date) === key);
            return (
              <li key={key}>
                <h3 className="px-1 text-micro font-semibold text-muted">
                  {longDate.format(list[0].date)}
                  {key === today ? <span className="text-primary-ink"> · Bugün</span> : null}
                </h3>
                <ul className="mt-1 grid gap-0.5">
                  {list.map((e) => (
                    <li key={e.id} className="flex items-start gap-2 rounded-md px-1 py-1.5">
                      <time dateTime={e.date.toISOString()} className="w-10 shrink-0 text-small font-semibold text-strong tabular-nums">
                        {clock.format(e.date)}
                      </time>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-small text-strong">{e.title}</span>
                        <span className="flex items-center gap-1 text-micro text-muted">
                          <MapPin aria-hidden className="size-3" />
                          {e.place}
                        </span>
                      </span>
                      <Badge tone={KIND_TONE[e.kind]} shape="rounded" className="shrink-0">
                        {e.kind}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );

  return (
    <aside aria-labelledby="takvim-bugun" className="flex min-w-0 flex-col gap-4 p-3 sm:p-4">
      <div className="px-1">
        <h2 id="takvim-bugun" className="text-title font-semibold tracking-tight text-strong">
          Bugün
        </h2>
        <p className="mt-0.5 text-small text-muted">{longDate.format(TODAY)}</p>
      </div>
      <DateCalendar mode="range" label="Gösterilen Aralık" value={range} onValueChange={(r) => setRange(r)} defaultMonth={TODAY} />
      <Tabs
        aria-label="Bugün Paneli"
        value={tab}
        onValueChange={setTab}
        className="[&>[role=tablist]]:w-full [&>[role=tablist]>*]:flex-1 [&>[role=tablist]>*]:justify-center"
        items={[
          { value: "yapilacak", label: <span className="inline-flex items-center gap-1.5">Yapılacaklar <span className="text-small text-muted tabular-nums">{num.format(open)}</span></span>, panel: yapilacak },
          { value: "etkinlik", label: <span className="inline-flex items-center gap-1.5">Etkinlikler <span className="text-small text-muted tabular-nums">{num.format(inRange.length)}</span></span>, panel: etkinlik },
        ]}
      />
    </aside>
  );
}

function TodoGroup({ group, items, onToggle, onAdd }: { group: Group; items: readonly Todo[]; onToggle: (id: string) => void; onAdd: (title: string) => void }) {
  const id = useId();
  const [open, setOpen] = useState(group.id !== "sonra");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const submit = () => {
    const title = draft.trim();
    if (title) onAdd(title);
    setDraft("");
    setAdding(false);
    setOpen(true);
  };
  return (
    <div className="border-b border-line-soft pb-1 last:border-0">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-10 flex-1 items-center gap-1.5 rounded-md px-1 text-small font-semibold text-strong hover:bg-surface"
        >
          <ChevronDown aria-hidden className={cn("size-4 text-muted transition-transform duration-150", !open && "-rotate-90")} />
          {group.label}
          <span className="font-normal text-muted tabular-nums">{num.format(items.length)}</span>
        </button>
        <button
          type="button"
          aria-label={`${group.label} grubuna iş ekle`}
          onClick={() => {
            setAdding(true);
            setOpen(true);
          }}
          className="inline-grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-surface hover:text-strong [&_svg]:size-4"
        >
          <Plus aria-hidden />
        </button>
      </div>
      <div id={`${id}-list`} hidden={!open}>
        {items.length || adding ? (
          <ul className="grid gap-0.5 pb-1 pl-1">
            {items.map((t) => (
              <li key={t.id}>
                <Checkbox
                  label={<span className={cn("text-small", t.done ? "text-muted line-through" : "text-body")}>{t.title}</span>}
                  checked={t.done}
                  onChange={() => onToggle(t.id)}
                  className="min-h-9 py-1"
                />
              </li>
            ))}
            {adding ? (
              <li>
                <input
                  autoFocus
                  aria-label={`${group.label}: yeni iş`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submit();
                    if (e.key === "Escape") {
                      setDraft("");
                      setAdding(false);
                    }
                  }}
                  onBlur={submit}
                  placeholder="Yeni iş, Enter ile ekle"
                  className="mt-1 h-9 w-full rounded-md bg-surface px-2.5 text-small text-strong ring-1 ring-inset ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-line-focus"
                />
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="pb-2 pl-7 text-micro text-muted">Bu grupta iş yok.</p>
        )}
      </div>
    </div>
  );
}

