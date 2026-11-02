"use client";

import { Coffee, CreditCard, Repeat, ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";
import { ActivityRings } from "@/components/ui/activity-rings";
import { AreaChart } from "@/components/ui/area-chart";
import { BarList } from "@/components/ui/bar-list";
import { ChartCard, ChartLegend } from "@/components/ui/chart-card";
import { ComboChart } from "@/components/ui/combo-chart";
import { FunnelChart } from "@/components/ui/funnel-chart";
import { GaugeChart } from "@/components/ui/gauge-chart";
import { Heatmap } from "@/components/ui/heatmap";
import { LineChart } from "@/components/ui/line-chart";
import { RadarChart } from "@/components/ui/radar-chart";
import { RingChart } from "@/components/ui/ring-chart";
import { SankeyChart } from "@/components/ui/sankey-chart";
import { ScatterChart } from "@/components/ui/scatter-chart";
import { StageBars } from "@/components/ui/stage-bars";
import { TrackBarChart } from "@/components/ui/track-bar-chart";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  CHANNELS,
  CHANNEL_MONTHLY,
  CHANNEL_REVENUE,
  CONVERSION,
  CONVERSION_GAIN,
  CUPPING,
  CUPPING_AXES,
  DAYS,
  DAYS_TOTAL,
  FLOWS,
  MONTHS,
  OCTOBER_GOALS,
  PLANS,
  PRICE_CATEGORIES,
  PRICE_SCORE,
  REVENUE_BEFORE,
  REVENUE_CHANGE,
  REVENUE_NOW,
  REVENUE_TOTAL,
  ROAST_PREV,
  ROAST_TOTAL,
  ROAST_WEEK,
  SUBSCRIBERS,
  SUB_FUNNEL,
  SUB_GROWTH,
  TOP_PRODUCTS,
  WEB_FUNNEL,
  WEB_MONTHS,
  change,
  cuppingAverage,
  fromK,
  num,
  sum,
} from "./_data";

/** Kartın sağ üstünde dosya adı: panoda hangi bileşenin ne olduğu okunsun. Kapsam dizini buraya bağlanır. */
function FileTag({ file }: { file: string }) {
  return <code className="rounded-full bg-overlay px-2.5 py-1 font-mono text-micro text-muted shadow-raised">{file}</code>;
}

/** Pano hücresi: ChartCard hücreyi doldurur, yan yana kartlar eşit boy. */
function Tile({ file, className, children }: { file: string; className?: string; children: ReactNode }) {
  return (
    <div id={`b-${file}`} className={cn("flex min-w-0 scroll-mt-24 flex-col *:flex-1", className)}>
      {children}
    </div>
  );
}

const SUB_ICONS = [<ShoppingBag key="a" />, <Repeat key="b" />, <CreditCard key="c" />, <Coffee key="d" />];

export function Dashboard() {
  const total = sum(CHANNEL_REVENUE.map((c) => c.value));
  const topTotal = sum(TOP_PRODUCTS.map((p) => p.value));
  const [first, second] = CUPPING;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      <Tile file="area-chart" className="md:col-span-2 lg:col-span-8">
        <ChartCard
          id="g-ciro"
          label="Ciro · Son 12 Ay"
          value={fromK(REVENUE_TOTAL)}
          change={REVENUE_CHANGE}
          changeLabel="önceki 12 aya göre"
          action={<FileTag file="area-chart" />}
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
            title="Aylık Ciro"
            labels={MONTHS}
            unit="bin ₺"
            series={[
              { label: "Son 12 Ay", values: REVENUE_NOW, series: 2 },
              { label: "Önceki 12 Ay", values: REVENUE_BEFORE, series: 4 },
            ]}
          />
        </ChartCard>
      </Tile>

      <Tile file="gauge-chart" className="lg:col-span-4">
        <ChartCard
          id="g-kanal"
          label="Kanal Payı"
          value={fromK(total)}
          action={<FileTag file="gauge-chart" />}
          footer={<ChartLegend columns={3} className="px-1 pb-1" items={CHANNEL_REVENUE.map((c) => ({ label: c.label, value: c.value, series: c.series }))} />}
        >
          <GaugeChart title="Kanala Göre Ciro" parts={CHANNEL_REVENUE.map((c) => ({ label: c.label, value: c.value, series: c.series }))} />
        </ChartCard>
      </Tile>

      <Tile file="sankey-chart" className="lg:col-span-7">
        <ChartCard id="g-akis" label="Kanaldan Ürün Grubuna" value={fromK(total)} action={<FileTag file="sankey-chart" />}>
          <SankeyChart
            title="Kanaldan Ürün Grubuna Ciro"
            unit="bin ₺"
            sources={CHANNELS.map((c) => ({ id: c.id, label: c.label, series: c.series }))}
            targets={CATEGORIES.map((c) => ({ id: c.id, label: c.label }))}
            links={FLOWS}
          />
        </ChartCard>
      </Tile>

      <Tile file="bar-list" className="lg:col-span-5">
        <ChartCard id="g-urun" label="En Çok Satanlar · 30 Gün" value={`${num.format(topTotal)} paket`} change={8.2} changeLabel="önceki 30 güne göre" action={<FileTag file="bar-list" />}>
          <BarList title="En Çok Satan Ürünler" columns={["Ürün", "Paket"]} items={TOP_PRODUCTS} />
        </ChartCard>
      </Tile>

      <Tile file="funnel-chart" className="lg:col-span-4">
        <ChartCard id="g-huni" label="Web Hunisi · Ekim" value={`%${CONVERSION.toLocaleString("tr-TR")}`} change={CONVERSION_GAIN} changeLabel="puan, Eylül'e göre" action={<FileTag file="funnel-chart" />}>
          <FunnelChart title="Web Mağaza Hunisi" stages={WEB_FUNNEL} />
        </ChartCard>
      </Tile>

      <Tile file="stage-bars" className="lg:col-span-4">
        <ChartCard id="g-abone" label="Abonelik Hunisi" value={`${num.format(SUBSCRIBERS)} abone`} change={SUB_GROWTH} changeLabel="Eylül'e göre" action={<FileTag file="stage-bars" />}>
          <StageBars title="Abonelik Hunisi" stages={SUB_FUNNEL.map((s, i) => ({ label: s.label, value: s.value, icon: SUB_ICONS[i] }))} />
        </ChartCard>
      </Tile>

      <Tile file="ring-chart" className="lg:col-span-4">
        <ChartCard
          id="g-plan"
          label="Abonelik Planları"
          value={`${num.format(SUBSCRIBERS)} abone`}
          action={<FileTag file="ring-chart" />}
          footer={<ChartLegend columns={3} className="px-1 pb-1" items={PLANS.map((p) => ({ label: p.label, value: p.value, series: p.series }))} />}
        >
          <RingChart title="Abonelik Planları" rings={PLANS} className="max-w-52">
            <div>
              <p className="text-heading font-semibold text-strong tabular-nums">{num.format(SUBSCRIBERS)}</p>
              <p className="text-small text-muted">aktif abone</p>
            </div>
          </RingChart>
        </ChartCard>
      </Tile>

      <Tile file="heatmap" className="md:col-span-2 lg:col-span-6">
        <ChartCard id="g-ritim" label="Web Siparişi · 26 Hafta" value={`${num.format(DAYS_TOTAL)} sipariş`} action={<FileTag file="heatmap" />}>
          <Heatmap title="Günlük Web Siparişi" data={DAYS} levels={[26, 38, 48]} />
        </ChartCard>
      </Tile>

      <Tile file="radar-chart" className="lg:col-span-3">
        <ChartCard
          id="g-tadim"
          label="Tadım Profili"
          value={`${cuppingAverage(first.values)} puan`}
          action={<FileTag file="radar-chart" />}
          footer={
            <ChartLegend
              className="px-1 pb-1"
              items={[
                { label: "Yirgacheffe", value: cuppingAverage(first.values), series: first.series, unit: "ort." },
                { label: "Cerrado", value: cuppingAverage(second.values), series: second.series, unit: "ort." },
              ]}
            />
          }
        >
          <RadarChart title="Tadım Profili" unit="puan" axes={CUPPING_AXES} series={CUPPING} />
        </ChartCard>
      </Tile>

      <Tile file="track-bar-chart" className="lg:col-span-3">
        <ChartCard id="g-kavurma" label="Haftalık Kavurma" value={`${num.format(ROAST_TOTAL)} kg`} change={change(ROAST_TOTAL, ROAST_PREV)} changeLabel="önceki haftaya göre" action={<FileTag file="track-bar-chart" />}>
          <TrackBarChart title="Geçen Hafta Kavrulan Kahve" data={ROAST_WEEK} series={3} format={(v) => `${num.format(v)} kg`} height="h-40" />
        </ChartCard>
      </Tile>

      <Tile file="line-chart" className="md:col-span-2 lg:col-span-8">
        <ChartCard
          id="g-kanal-ay"
          label="Kanala Göre Ciro · Son 12 Ay"
          value={fromK(REVENUE_TOTAL)}
          change={change(sum(CHANNEL_MONTHLY[2].slice(-3)), sum(CHANNEL_MONTHLY[2].slice(-6, -3)))}
          changeLabel="abonelik, önceki çeyreğe göre"
          action={<FileTag file="line-chart" />}
        >
          <LineChart
            title="Kanala Göre Aylık Ciro"
            labels={MONTHS}
            unit="bin ₺"
            markers
            series={CHANNELS.map((c, i) => ({ label: c.label, values: CHANNEL_MONTHLY[i], series: c.series }))}
          />
        </ChartCard>
      </Tile>

      <Tile file="activity-rings" className="md:col-span-2 lg:col-span-4">
        <ChartCard
          id="g-hedef"
          label="Ekim Hedefleri"
          value={`${OCTOBER_GOALS.filter((g) => g.value >= g.goal).length} / ${OCTOBER_GOALS.length} tuttu`}
          action={<FileTag file="activity-rings" />}
        >
          <ActivityRings title="Ekim Hedefleri" rings={OCTOBER_GOALS} layout="stack" thickness={13} />
        </ChartCard>
      </Tile>

      <Tile file="combo-chart" className="md:col-span-2 lg:col-span-6">
        <ChartCard
          id="g-web-ay"
          label="Web Siparişi ve Dönüşüm · 5 Ay"
          value={`${num.format(sum(WEB_MONTHS.map((m) => m.orders)))} sipariş`}
          change={change(WEB_MONTHS[4].orders, WEB_MONTHS[3].orders)}
          changeLabel="Ekim, Eylül'e göre"
          action={<FileTag file="combo-chart" />}
        >
          <ComboChart
            title="Aylık Web Siparişi ve Dönüşüm Oranı"
            labels={WEB_MONTHS.map((m) => m.label)}
            bars={{ label: "Web Siparişi", values: WEB_MONTHS.map((m) => m.orders), series: 2, unit: "sipariş" }}
            line={{ label: "Dönüşüm", values: WEB_MONTHS.map((m) => m.rate), series: 4, format: { style: "percent", maximumFractionDigits: 1 } }}
          />
        </ChartCard>
      </Tile>

      <Tile file="scatter-chart" className="md:col-span-2 lg:col-span-6">
        <ChartCard
          id="g-fiyat"
          label="Fiyat ve Tadım Puanı · 30 Gün"
          value={`${PRICE_SCORE.length} kahve`}
          action={<FileTag file="scatter-chart" />}
        >
          <ScatterChart
            title="Kilo Fiyatına Göre Tadım Puanı"
            points={PRICE_SCORE}
            categories={PRICE_CATEGORIES}
            x={{ label: "Kilo Fiyatı", format: { style: "currency", currency: "TRY", maximumFractionDigits: 0 } }}
            y={{ label: "Tadım Puanı", unit: "puan" }}
            size={{ label: "Satılan Paket", unit: "paket" }}
            zero={false}
            height="h-56"
          />
        </ChartCard>
      </Tile>
    </div>
  );
}

/** chart-card'ın kendisi: bütün kartların kabı. Kapsam dizini bu kimliğe bağlanır. */
export const CHART_CARD_ANCHOR = "b-chart-card";
