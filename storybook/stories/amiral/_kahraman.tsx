"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { AreaChart } from "@/components/ui/area-chart";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChartCard, ChartLegend } from "@/components/ui/chart-card";
import { ChatComposer } from "@/components/ui/chat-composer";
import { DateCalendar } from "@/components/ui/date-calendar";
import { EASE } from "@/lib/motion";
import { MONTHS, NOTIFICATIONS, REVENUE_BEFORE, REVENUE_CHANGE, REVENUE_NOW, REVENUE_TOTAL, TODAY, fromK, sum } from "./_data";

const since = (at: Date) => {
  const min = Math.round((TODAY.getTime() - at.getTime()) / 60_000);
  return min < 60 ? `${min} dk` : min < 60 * 24 ? `${Math.round(min / 60)} sa` : `${Math.round(min / 1440)} g`;
};

/** Kahramanın altındaki canlı ürün kompozisyonu: hepsi gerçek bileşen, kaydırınca sütunlar farklı hızda akar. */
function Composition() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const slow = useTransform(scrollY, [0, 900], [0, -24]);
  const fast = useTransform(scrollY, [0, 900], [0, -72]);
  const [day, setDay] = useState<Date | null>(new Date(2026, 10, 12));
  const [sent, setSent] = useState<string | null>(null);

  return (
    <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-12">
      <m.div style={reduce ? undefined : { y: slow }} className="grid min-w-0 grid-cols-1 content-start gap-4 lg:col-span-7">
        <ChartCard
          id="k-ciro"
          label="Kıyı Kahve · Ciro"
          value={fromK(REVENUE_TOTAL)}
          change={REVENUE_CHANGE}
          changeLabel="önceki 12 aya göre"
          action={<Badge tone="success" dot>Canlı</Badge>}
          footer={
            <ChartLegend
              className="px-1 pb-1"
              items={[
                { label: "Son 12 Ay", value: REVENUE_TOTAL, series: 2, unit: "bin ₺" },
                { label: "Önceki 12 Ay", value: sum(REVENUE_BEFORE), series: 4, unit: "bin ₺" },
              ]}
            />
          }
        >
          <AreaChart
            title="Aylık Ciro, Kahraman"
            labels={MONTHS}
            unit="bin ₺"
            height="h-44 sm:h-52"
            series={[
              { label: "Son 12 Ay", values: REVENUE_NOW, series: 2 },
              { label: "Önceki 12 Ay", values: REVENUE_BEFORE, series: 4 },
            ]}
          />
        </ChartCard>
        <div className="rounded-2xl bg-surface p-2">
          <div className="flex items-start gap-3 px-3 pt-2 pb-3">
            <span aria-hidden className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-brand text-on-brand">
              <Sparkles className="size-3.5" />
            </span>
            <p className="text-base text-body" aria-live="polite">
              {sent ? (
                <>
                  <span className="font-medium text-strong">“{sent}”</span> için Ekim kayıtlarına bakıyorum.
                </>
              ) : (
                <>
                  Ekim'de ciro <span className="font-semibold text-strong">%{REVENUE_CHANGE.toLocaleString("tr-TR")}</span> arttı; en hızlı büyüyen kanal abonelik.
                </>
              )}
            </p>
          </div>
          <ChatComposer onSend={setSent} status="idle" model="Fable 5" placeholder="Asistana sor" label="Asistana Sor" />
        </div>
      </m.div>

      <m.div style={reduce ? undefined : { y: fast }} className="grid min-w-0 grid-cols-1 content-start gap-4 lg:col-span-5">
        <section aria-labelledby="k-bugun" className="rounded-2xl bg-surface p-2">
          <div className="flex items-center justify-between px-3 pt-2 pb-3">
            <h3 id="k-bugun" className="text-small font-medium text-muted">
              Bugün, Atölyede
            </h3>
            <Badge tone="primary">{NOTIFICATIONS.filter((n) => !n.read).length} yeni</Badge>
          </div>
          <ul className="grid grid-cols-1 gap-1.5">
            {NOTIFICATIONS.slice(0, 3).map((n) => (
              <li key={n.id} className="flex items-center gap-3 rounded-xl bg-overlay px-3 py-2.5 shadow-raised">
                <Avatar name={n.actor} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base text-strong">{n.title}</span>
                  {"body" in n && n.body ? <span className="block truncate text-small text-muted">{n.body}</span> : null}
                </span>
                <time dateTime={n.at.toISOString()} className="shrink-0 text-small text-muted tabular-nums">
                  {since(n.at)}
                </time>
              </li>
            ))}
          </ul>
        </section>
        <div className="rounded-2xl bg-surface p-2">
          <div className="flex items-baseline justify-between px-3 pt-2 pb-3">
            <p className="text-small font-medium text-muted">Tadım Günü</p>
            <p className="text-small font-semibold text-strong tabular-nums">
              {day ? day.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" }) : "Gün seçin"}
            </p>
          </div>
          <div className="rounded-xl bg-overlay p-3 shadow-raised">
            <DateCalendar label="Tadım Günü" value={day} onValueChange={setDay} defaultMonth={new Date(2026, 10, 1)} min={TODAY} />
          </div>
        </div>
      </m.div>
    </div>
  );
}

export function Hero({ covered, total, pusulaHref }: { covered: number; total: number; pusulaHref: string }) {
  const reduce = useReducedMotion();
  const enter = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, ease: EASE, delay } };
  return (
    <header className="relative">
      <div className="max-w-4xl">
        <m.a
          {...enter(0)}
          href="#kapsam"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-overlay py-1 pr-3 pl-1 text-small shadow-raised transition-[border-color] hover:border-line-strong"
        >
          <span className="rounded-full bg-success-wash px-2 py-0.5 font-semibold text-success tabular-nums">
            {covered}/{total}
          </span>
          <span className="text-strong">Bu sayfada {covered}/{total} bileşen</span>
          <ArrowRight aria-hidden className="size-3.5 text-muted" />
        </m.a>
        <m.h1 {...enter(0.05)} className="mt-7 text-[clamp(2.75rem,8.4vw,6.25rem)] leading-[0.95] font-semibold tracking-[-0.05em] text-strong">
          Arayüz susar,
          <br />
          <span className="display-ink">veri konuşur.</span>
        </m.h1>
        <m.p {...enter(0.12)} className="mt-7 max-w-2xl text-lead text-body">
          Kataloğun bütün parçaları tek sayfada, tek bir kurgunun verisiyle: İzmir'de kahve kavuran küçük bir atölye. Gri kuyu, beyaz karo, pastel
          grafik; renk yalnızca veride ve tek bir eylemde.
        </m.p>
        <m.div {...enter(0.18)} className="mt-9 flex flex-wrap gap-2">
          <a href="#bilesenler" className={buttonClass({ variant: "brand", size: "lg" })}>
            Bileşenleri Gez <ArrowRight />
          </a>
          <a href={pusulaHref} target="_top" className={buttonClass({ variant: "secondary", size: "lg" })}>
            Pusula Paneli'ni Aç
          </a>
        </m.div>
      </div>
      <section aria-labelledby="kompozisyon" className="mt-14 sm:mt-20">
        <h2 id="kompozisyon" className="sr-only">
          Canlı Kompozisyon
        </h2>
        <Composition />
      </section>
    </header>
  );
}
