"use client";

import { Avatar } from "@/components/ui/avatar";
import { ChartCard } from "@/components/ui/chart-card";
import { ScheduleList, type ScheduleItem } from "@/components/ui/schedule-list";
import { StackedBarChart } from "@/components/ui/stacked-bar-chart";
import { TickMeter } from "@/components/ui/tick-meter";
import { cn } from "@/lib/utils";
import {
  EVENTS,
  FIRST_REPLY_GOAL,
  TICKET_CHANNELS,
  TODAY,
  clock,
  dayKey,
  member,
  num,
  pct,
  type CalendarEvent,
  type PeriodStats,
} from "./_data";
import { CARD } from "./_ui";

/**
 * Pano eki (Plotline, baobun ve Axon turları): talepleri haftanın gününe ve
 * kanala göre yığan sütun grafiği, takvimden "Sıradakiler" listesi ve
 * hedeflerin çentikli gidişatı. Hepsi `periodStats` ve takvim verisinden
 * türer; elle yazılmış sayı yok.
 */

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;
const DAY = new Intl.DateTimeFormat("tr-TR", { weekday: "short", day: "numeric" });
const KIND_SERIES: Record<CalendarEvent["kind"], 1 | 2 | 3 | 4> = { Teslimat: 1, Görüşme: 2, Numune: 3, "İç Toplantı": 4 };

/** Haftanın gününe göre talep, kanallara yığılı; bugün doygun. */
export function TicketStackCard({ s, className }: { s: PeriodStats; className?: string }) {
  const data = WEEKDAYS.map((label, i) => ({
    label,
    values: TICKET_CHANNELS.map((ch) => s.tickets.filter((t) => (t.date.getDay() + 6) % 7 === i && t.channel === ch).length),
  }));
  const busiest = data.reduce((best, d, i) => (d.values.reduce((a, b) => a + b, 0) > data[best].values.reduce((a, b) => a + b, 0) ? i : best), 0);
  return (
    <ChartCard className={cn(CARD, className)} id="pano-gun-kanal" label="Gün ve Kanala Göre Talep" value={`${WEEKDAYS[busiest]} en yoğun`}>
      <StackedBarChart
        title="Haftanın Gününe ve Kanala Göre Talep"
        data={data}
        series={s.ticketChannels.map((c) => ({ name: c.channel, color: c.series }))}
        highlight={(TODAY.getDay() + 6) % 7}
        unit=" talep"
        height="h-48"
      />
    </ChartCard>
  );
}

/** Takvimden bugünden sonraki ilk beş etkinlik. */
export function UpcomingCard({ className }: { className?: string }) {
  const items: ScheduleItem[] = EVENTS.filter((e) => e.date >= TODAY)
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      at: `${dayKey(e.date)}T${clock.format(e.date)}`,
      time: clock.format(e.date),
      day: DAY.format(e.date),
      title: e.title,
      detail: `${e.kind} · ${e.place}`,
      color: KIND_SERIES[e.kind],
      apps: <Avatar name={member(e.owner).name} size="sm" />,
    }));
  return (
    <ChartCard className={cn(CARD, className)} id="pano-siradakiler" label="Sıradakiler" value={`${num.format(items.length)} etkinlik`}>
      <ScheduleList label="Takvimdeki sıradaki etkinlikler" items={items} />
    </ChartCard>
  );
}

/**
 * Kanala göre "30 dakikada yanıt": panodaki "Dönem Hedefleri" halkasının
 * kanal kırılımı (aynı ölçü, başka kesit; halka toplamı gösterir, çentik hangi
 * kanalın hedefin altında kaldığını). Her kanal kendi talepleri içinde ölçülür,
 * işaretçi hedef oranıdır.
 */
export function GoalTicksCard({ s, className }: { s: PeriodStats; className?: string }) {
  const rows = TICKET_CHANNELS.map((channel) => {
    const own = s.tickets.filter((t) => t.channel === channel);
    const fast = own.filter((t) => (t.firstResponseMin ?? 999) <= 30).length;
    return { label: channel, value: fast, max: Math.max(own.length, 1), detail: `${num.format(fast)} / ${num.format(own.length)}` };
  });
  const onTarget = rows.filter((r) => r.value >= r.max * FIRST_REPLY_GOAL).length;
  return (
    <ChartCard className={cn(CARD, className)} id="pano-hedef-cenik" label="Kanala Göre 30 Dakikada Yanıt" value={`${onTarget} / ${rows.length} kanal hedefte`}>
      <ul className="grid gap-5 px-1 pb-2 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((r) => {
          const ratio = pct(r.value, r.max, 0);
          return (
            <li key={r.label} className="grid gap-2">
              <p className="flex items-baseline justify-between gap-2 text-small">
                <span className="font-medium text-strong">{r.label}</span>
                <span className="text-muted tabular-nums">{r.detail}</span>
              </p>
              <TickMeter label={r.label} value={r.value} max={r.max} ticks={20} marker={FIRST_REPLY_GOAL} text={`%${ratio}`} valueText={`${r.label}: ${r.detail}, %${ratio}, hedef %${FIRST_REPLY_GOAL * 100}`} size="md" />
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}
