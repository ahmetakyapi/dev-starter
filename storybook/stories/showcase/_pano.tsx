"use client";

import { useMemo } from "react";
import { MessagesSquare, PackageCheck, Reply, Smile } from "lucide-react";
import { Announcement } from "@/components/ui/announcement";
import { AreaChart } from "@/components/ui/area-chart";
import { BannerAlert } from "@/components/ui/banner-alert";
import { BarList } from "@/components/ui/bar-list";
import { ChartCard, ChartLegend } from "@/components/ui/chart-card";
import { FunnelChart } from "@/components/ui/funnel-chart";
import { GaugeChart } from "@/components/ui/gauge-chart";
import { Heatmap } from "@/components/ui/heatmap";
import { RadarChart } from "@/components/ui/radar-chart";
import { RingChart } from "@/components/ui/ring-chart";
import { SankeyChart } from "@/components/ui/sankey-chart";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sparkline } from "@/components/ui/sparkline";
import { StageBars } from "@/components/ui/stage-bars";
import { Stat, StatGrid } from "@/components/ui/stat";
import { TrackBarChart } from "@/components/ui/track-bar-chart";
import { InfoTip } from "@/components/ui/tooltip";
import {
  CHANNELS,
  CHANNEL_SERIES,
  DELAYED,
  HEATMAP_WEEKS,
  ME,
  OUTCOMES,
  PERIODS,
  RADAR_AXES,
  TODAY,
  customer,
  longDate,
  num,
  orderDays,
  pct,
  periodStats,
  tl,
  type Period,
} from "./_data";
import { PageBar, SectionTitle, href, useApp } from "./_ui";

const TL_COMPACT: Intl.NumberFormatOptions = { style: "currency", currency: "TRY", notation: "compact", maximumFractionDigits: 1 };
const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

/** Dönem seçici: panonun bütün karolarını ve grafiklerini birlikte değiştirir. */
export function PeriodControl({ size = "md" }: { size?: "sm" | "md" }) {
  const { period, setPeriod } = useApp();
  return (
    <SegmentedControl<Period>
      aria-label="Dönem"
      size={size}
      value={period}
      onValueChange={setPeriod}
      options={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
    />
  );
}

function StatTile({
  label,
  value,
  change,
  changeLabel,
  series,
  positiveIsGood,
  trend,
}: {
  label: string;
  value: string;
  change: number | null;
  changeLabel: string;
  series: readonly number[];
  positiveIsGood?: boolean;
  trend: string;
}) {
  return (
    <div className="flex h-full flex-col justify-between gap-3 rounded-xl bg-surface p-4">
      <StatGrid className="grid-cols-1 sm:grid-cols-1">
        <Stat label={label} value={value} change={change} changeLabel={changeLabel} positiveIsGood={positiveIsGood} />
      </StatGrid>
      <Sparkline title={trend} values={series} width={240} height={36} className="w-full" />
    </div>
  );
}

export function PanoPage() {
  const { period } = useApp();
  const s = useMemo(() => periodStats(period), [period]);
  const w = s.window;
  const conversion = pct(s.funnel.orders, s.funnel.visits);
  const q = s.quality;
  const avgScore = Math.round(q.scores.reduce((a, b) => a + b, 0) / q.scores.length);
  const prevAvg = Math.round(s.prevQuality.scores.reduce((a, b) => a + b, 0) / s.prevQuality.scores.length);
  const heatWeeks = HEATMAP_WEEKS[period];
  const days = useMemo(() => orderDays(heatWeeks), [heatWeeks]);
  const heatTotal = days.reduce((a, d) => a + d.value, 0);
  // Haftanın gününe göre talep: dönemdeki talepler Pazartesi'den Pazar'a.
  const byWeekday = WEEKDAYS.map((label, i) => ({
    label,
    value: s.tickets.filter((t) => (t.date.getDay() + 6) % 7 === i).length,
  }));
  const delayedNames = DELAYED.map((o) => customer(o.customerId).name);

  return (
    <div className="flex min-h-full flex-col">
      <PageBar
        title="Pano"
        description={`Günaydın ${ME.name.split(" ")[0]} · ${longDate.format(TODAY)}`}
        actions={<PeriodControl />}
      />
      <div className="grid grid-cols-1 gap-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-3">
          <Announcement href={href("asistan")} tag="Yeni">
            Asistan geciken siparişler için müşteri e-postası yazıyor
          </Announcement>
          {DELAYED.length ? (
            <BannerAlert
              tone="warning"
              title={`${DELAYED.length} sipariş teslim tarihini geçti`}
              description={`${delayedNames.join(", ")} siparişleri kargo aktarma merkezinde bekliyor. İlgili talepler gelen kutusunda.`}
              actions={
                <a
                  href={href("gelen", { etiket: "Gecikme" })}
                  className="inline-flex min-h-11 items-center rounded-md border border-line bg-overlay px-3.5 text-base font-medium text-strong shadow-raised transition-[border-color] hover:border-line-strong pointer-fine:min-h-9"
                >
                  Talepleri Gör
                </a>
              }
            />
          ) : null}
        </div>

        <section aria-labelledby="pano-ozet" className="grid grid-cols-1 gap-3">
          <SectionTitle id="pano-ozet" title="Özet" note={`${w.label} · ${w.caption}`} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Ciro" value={tl.format(s.revenue)} change={s.revenueChange} changeLabel={s.window.prevLabel} series={s.revenueSeries} trend={`${w.label} ciro eğilimi`} />
            <StatTile label="Sipariş" value={num.format(s.orderCount)} change={s.orderChange} changeLabel={s.window.prevLabel} series={s.orderSeries} trend={`${w.label} sipariş eğilimi`} />
            <StatTile label="Ortalama Sepet" value={tl.format(s.basket)} change={s.basketChange} changeLabel={s.window.prevLabel} series={s.basketSeries.filter((v) => v > 0)} trend={`${w.label} ortalama sepet eğilimi`} />
            <StatTile label="Gelen Talep" value={num.format(s.ticketCount)} change={s.ticketChange} changeLabel={s.window.prevLabel} series={s.ticketSeries} positiveIsGood={false} trend={`${w.label} talep eğilimi`} />
          </div>
        </section>

        <section aria-labelledby="pano-satis" className="grid grid-cols-1 gap-3">
          <SectionTitle id="pano-satis" title="Satış" note="Ciro, kanal ve müşteri kırılımları aynı sipariş listesinden" />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <ChartCard
              id="pano-ciro"
              className="lg:col-span-2"
              label="Ciro"
              value={tl.format(s.revenue)}
              change={s.revenueChange}
              changeLabel={w.prevLabel}
              action={
                <InfoTip label="Ciro nasıl hesaplanır">
                  Dönemdeki bütün siparişlerin KDV dahil toplamı. Müşteriye göre listenin toplamı da budur.
                </InfoTip>
              }
              footer={
                <ChartLegend
                  className="px-1 pb-1"
                  items={[
                    { label: `Bu Dönem · ${w.label}`, value: s.revenue, series: 1, unit: "TL" },
                    { label: "Önceki Dönem", value: s.prevRevenue, series: 2, unit: "TL" },
                  ]}
                />
              }
            >
              <AreaChart
                title="Ciro"
                labels={w.buckets.map((b) => b.label)}
                valueFormat={TL_COMPACT}
                series={[
                  { label: "Bu Dönem", values: s.revenueSeries, series: 1 },
                  { label: "Önceki Dönem", values: s.prevRevenueSeries, series: 2 },
                ]}
              />
            </ChartCard>

            <ChartCard
              id="pano-kanal"
              label="Kanala Göre Sipariş"
              value={num.format(s.orderCount)}
              change={s.orderChange}
              changeLabel={w.prevLabel}
              footer={
                <ChartLegend
                  columns={3}
                  className="px-1 pb-1"
                  items={s.channels.map((c) => ({ label: c.channel, value: c.orders, series: c.series }))}
                />
              }
            >
              <GaugeChart title="Kanala Göre Sipariş" parts={s.channels.map((c) => ({ label: c.channel, value: c.orders, series: c.series }))} />
            </ChartCard>

            <ChartCard
              id="pano-akis"
              className="lg:col-span-2"
              label="Kanaldan Sonuca Sipariş"
              value={num.format(s.orderCount)}
              change={s.orderChange}
              changeLabel={w.prevLabel}
            >
              <SankeyChart
                title="Kanaldan Sonuca Sipariş"
                unit="sipariş"
                sources={CHANNELS.filter((c) => s.flows.some((f) => f.source === c)).map((c) => ({ id: c, label: c, series: CHANNEL_SERIES[c] }))}
                targets={OUTCOMES.filter((o) => s.flows.some((f) => f.target === o)).map((o) => ({ id: o, label: o }))}
                links={s.flows}
              />
            </ChartCard>

            <ChartCard id="pano-musteri" label="Müşteriye Göre Ciro" value={tl.format(s.revenue)} change={s.revenueChange} changeLabel={w.prevLabel}>
              <BarList
                title="Müşteriye Göre Ciro"
                columns={["Müşteri", "Ciro"]}
                valueFormat={TL_COMPACT}
                items={s.byCustomer.map((r) => ({ label: r.customer.name, value: r.revenue }))}
              />
            </ChartCard>

            <ChartCard
              id="pano-huni"
              label="Mağaza Dönüşümü"
              value={`%${conversion.toLocaleString("tr-TR")}`}
              change={Math.round((conversion - pct(s.prevFunnel.orders, s.prevFunnel.visits)) * 10) / 10}
              changeLabel={`puan, ${w.prevLabel}`}
            >
              <FunnelChart
                title="Mağaza Dönüşümü"
                stages={[
                  { label: "Ziyaret", value: s.funnel.visits },
                  { label: "Ürün İnceleme", value: s.funnel.views },
                  { label: "Sepet", value: s.funnel.carts },
                  { label: "Sipariş", value: s.funnel.orders },
                ]}
              />
            </ChartCard>

            <ChartCard
              id="pano-ritim"
              className="lg:col-span-2"
              label={`Günlük Sipariş · Son ${heatWeeks} Hafta`}
              value={num.format(heatTotal)}
              action={
                <span className="rounded-full bg-overlay px-2.5 py-1 text-small font-medium text-body shadow-raised">
                  {heatWeeks} hafta
                </span>
              }
            >
              <Heatmap title={`Günlük Sipariş, Son ${heatWeeks} Hafta`} data={days} weeks={heatWeeks} unit="sipariş" levels={[2, 4, 6]} />
            </ChartCard>
          </div>
        </section>

        <section aria-labelledby="pano-destek" className="grid grid-cols-1 gap-3">
          <SectionTitle id="pano-destek" title="Destek" note={`${num.format(s.ticketCount)} talep · ${w.caption}`} />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <ChartCard
              id="pano-talep-kanal"
              label="Talep Kanalları"
              value={num.format(s.ticketCount)}
              change={s.ticketChange}
              changeLabel={w.prevLabel}
              footer={<ChartLegend className="px-1 pb-1" items={s.ticketChannels.map((c) => ({ label: c.channel, value: c.count, series: c.series }))} />}
            >
              <RingChart title="Talep Kanalları" rings={s.ticketChannels.map((c) => ({ label: c.channel, value: c.count, series: c.series }))} className="max-w-52">
                <div>
                  <p className="text-heading font-semibold text-strong tabular-nums">{num.format(s.ticketCount)}</p>
                  <p className="text-small text-muted">talep</p>
                </div>
              </RingChart>
            </ChartCard>

            <ChartCard
              id="pano-kalite"
              label="Destek Kalitesi"
              value={`${avgScore} puan`}
              change={pct(avgScore - prevAvg, prevAvg)}
              changeLabel={w.prevLabel}
              footer={
                <ChartLegend
                  className="px-1 pb-1"
                  items={[
                    { label: "Bu Dönem", value: avgScore, series: 2, unit: "ort." },
                    { label: "Önceki Dönem", value: prevAvg, series: 4, unit: "ort." },
                  ]}
                />
              }
            >
              <RadarChart
                title="Destek Kalitesi"
                unit="puan"
                axes={RADAR_AXES}
                series={[
                  { label: "Bu Dönem", values: q.scores, series: 2 },
                  { label: "Önceki Dönem", values: s.prevQuality.scores, series: 4 },
                ]}
              />
            </ChartCard>

            <ChartCard
              id="pano-gun"
              label="Haftanın Gününe Göre Talep"
              value={`${byWeekday.reduce((a, d) => (d.value > a.value ? d : a)).label} en yoğun`}
            >
              <TrackBarChart title="Haftanın Gününe Göre Talep" data={byWeekday} series={3} height="h-44" />
            </ChartCard>

            <ChartCard
              id="pano-asama"
              className="lg:col-span-3"
              label="Talep Akışı"
              value={`%${pct(q.resolved, s.ticketCount).toLocaleString("tr-TR")} çözüldü`}
              change={pct(q.resolved, s.ticketCount) - pct(s.prevQuality.resolved, s.prevQuality.total)}
              changeLabel={`puan, ${w.prevLabel}`}
            >
              <StageBars
                title="Talep Akışı"
                stages={[
                  { label: "Gelen", value: s.ticketCount, icon: <MessagesSquare />, note: "Bütün kanallardan" },
                  { label: "Yanıtlanan", value: q.answered, icon: <Reply />, note: `Ortalama ilk yanıt ${q.avgFirst} dakika` },
                  { label: "Çözülen", value: q.resolved, icon: <PackageCheck />, note: "Kapatılan ya da müşterinin onayladığı" },
                  { label: "Memnun Kalan", value: q.satisfied, icon: <Smile />, note: "Kapanış anketinde 4 ya da 5 yıldız" },
                ]}
              />
            </ChartCard>
          </div>
        </section>

      </div>
    </div>
  );
}
