"use client";

import { useMemo, useState } from "react";
import { CalendarCheck2, CalendarPlus, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonGroup } from "@/components/ui/button-group";
import { DateCalendar, type DateRange } from "@/components/ui/date-calendar";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { NumberField } from "@/components/ui/number-field";
import { Select } from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import { TimeField } from "@/components/ui/time-field";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { WeekCalendar } from "@/components/ui/week-calendar";
import { Button } from "@/components/ui/Button";
import {
  CUSTOMERS,
  EVENTS,
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
import { PageBar, Well, WellTitle, useApp } from "./_ui";

const KINDS = ["Görüşme", "Teslimat", "Numune", "İç Toplantı"] as const;
const KIND_TONE = { Görüşme: "chart-2", Teslimat: "chart-1", Numune: "chart-3", "İç Toplantı": "chart-4" } as const;
/** Haftalık ızgarada aynı renk: rozetin tonu = bloğun `--chart-N` yıkaması. */
const KIND_SERIES = { Görüşme: 2, Teslimat: 1, Numune: 3, "İç Toplantı": 4 } as const;
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

  const weekEvents = events
    .filter((e) => shown.includes(e.kind))
    .map((e) => ({
      id: e.id,
      title: e.title,
      start: iso(e.date),
      end: iso(new Date(e.date.getTime() + e.minutes * 60_000)),
      location: e.customerId ? `${customer(e.customerId).name} · ${e.place}` : e.place,
      series: KIND_SERIES[e.kind],
    }));

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
          <Button size="sm" onClick={() => document.getElementById("randevu")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
            <CalendarPlus aria-hidden />
            Randevu Oluştur
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <Well labelledBy="takvim-ay">
            <WellTitle id="takvim-ay" hint="Bir gün ya da iki uç seçerek aralık belirle.">
              Aralık
            </WellTitle>
            <div className="rounded-lg bg-overlay p-3 shadow-raised">
              <DateCalendar
                mode="range"
                label="Gösterilen Aralık"
                value={range}
                onValueChange={(r) => setRange(r)}
                defaultMonth={TODAY}
              />
            </div>
            {next ? (
              <div className="mt-4 rounded-lg bg-overlay p-3 shadow-raised">
                <p className="text-small text-muted">Sıradaki · {longDate.format(next.date)}</p>
                <p className="mt-1 flex items-baseline gap-2 text-base">
                  <span className="font-semibold text-strong tabular-nums">{clock.format(next.date)}</span>
                  <span className="min-w-0 truncate font-medium text-strong">{next.title}</span>
                </p>
                <p className="mt-0.5 text-small text-muted">
                  {member(next.owner).name} · {next.place}
                </p>
              </div>
            ) : null}
            <div className="mt-auto pt-4">
            <p className="px-1 text-small font-semibold text-muted">Kasım'da</p>
            <dl className="grid grid-cols-2 gap-1.5 pt-2">
              {KINDS.map((k) => (
                <div key={k} className="rounded-lg bg-overlay px-3 py-2 shadow-raised">
                  <dt className="text-small text-muted">{k}</dt>
                  <dd className="text-base font-semibold text-strong tabular-nums">
                    {num.format(monthEvents.filter((e) => e.kind === k).length)}
                    <span className="font-medium text-muted"> etkinlik</span>
                  </dd>
                </div>
              ))}
            </dl>
            </div>
          </Well>

          <Well labelledBy="takvim-ajanda">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="takvim-ajanda" className="text-base font-semibold text-strong">
                  Ajanda
                </h2>
                <p className="mt-0.5 text-small text-muted">
                  {shortDate.format(range.start)}
                  {range.end && dayKey(range.end) !== dayKey(range.start) ? ` – ${shortDate.format(range.end)}` : ""} · {num.format(inRange.length)} etkinlik
                </p>
              </div>
              <ButtonGroup aria-label="Hafta Gezinmesi">
                <Button variant="secondary" size="sm" onClick={() => shift(-1)}>
                  <ChevronLeft aria-hidden />
                  Önceki
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setRange(weekOf(TODAY))}>
                  Bu Hafta
                </Button>
                <Button variant="secondary" size="sm" onClick={() => shift(1)}>
                  Sonraki
                  <ChevronRight aria-hidden />
                </Button>
              </ButtonGroup>
            </div>

            {inRange.length === 0 ? (
              <EmptyState
                className="flex-1 justify-center bg-overlay shadow-raised"
                icon={<CalendarCheck2 />}
                title="Bu Aralıkta Etkinlik Yok"
                hint="Takvimden başka bir hafta seç ya da yeni randevu oluştur."
              />
            ) : (
              <ol className="grid grid-cols-1 gap-4">
                {days.map((key) => {
                  const list = inRange.filter((e) => dayKey(e.date) === key);
                  const d = list[0].date;
                  return (
                    <li key={key} className="grid grid-cols-1 gap-1.5">
                      <h3 className="px-1 text-small font-semibold text-muted">
                        {longDate.format(d)}
                        {key === dayKey(TODAY) ? <span className="ml-1.5 text-primary-ink">· Bugün</span> : null}
                      </h3>
                      <ul className="grid grid-cols-1 gap-1.5">
                        {list.map((e) => (
                          <li key={e.id} className="flex items-start gap-3 rounded-lg bg-overlay p-3 shadow-raised">
                            <time dateTime={e.date.toISOString()} className="w-12 shrink-0 pt-0.5 text-base font-semibold text-strong tabular-nums">
                              {clock.format(e.date)}
                            </time>
                            <div className="min-w-0 flex-1">
                              <p className="text-base font-medium text-strong">{e.title}</p>
                              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-small text-muted">
                                {e.customerId ? <span>{customer(e.customerId).name}</span> : null}
                                <span className="inline-flex items-center gap-1">
                                  <MapPin aria-hidden className="size-3.5" />
                                  {e.place}
                                </span>
                                <span>{e.minutes} dk</span>
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <Badge tone={KIND_TONE[e.kind]} shape="rounded" className="max-sm:hidden">
                                {e.kind}
                              </Badge>
                              <Avatar name={member(e.owner).name} size="sm" />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ol>
            )}
          </Well>
        </div>

        <Well labelledBy="takvim-hafta">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="takvim-hafta" className="text-base font-semibold text-strong">
                Haftalık Görünüm
              </h2>
              <p className="mt-0.5 text-small text-muted">
                {shortDate.format(weekOf(range.start).start)} – {shortDate.format(weekOf(range.start).end!)} · Çakışan etkinlikler yan yana.
              </p>
            </div>
            <ToggleGroup<Kind>
              aria-label="Gösterilen Etkinlik Türleri"
              multiple
              size="sm"
              value={shown}
              onValueChange={setShown}
              items={KINDS.map((k) => ({ value: k, label: k }))}
            />
          </div>
          <div className="rounded-lg bg-overlay p-2 shadow-raised">
            <WeekCalendar label="Haftalık Takvim" week={dayKey(range.start)} events={weekEvents} now={iso(TODAY)} startHour={8} endHour={18} hourHeight={60} />
          </div>
        </Well>

        <Well labelledBy="randevu" className="scroll-mt-4">
          <WellTitle id="randevu" hint="Üç adım: müşteri, zaman, onay. Pazar günleri kapalı.">
            Randevu Oluştur
          </WellTitle>
          <div className="rounded-lg bg-overlay p-4 shadow-raised sm:p-6">
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
                  <NumberField label="Süre" value={minutes} onValueChange={setMinutes} min={15} max={180} step={15} hint="Dakika, 15'er artar." />
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
