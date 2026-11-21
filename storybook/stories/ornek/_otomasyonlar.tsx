"use client";

import { BarChart3, Home, Inbox, Plus, Users, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { RecordList } from "@/components/ui/record-list";
import { ScheduleList, type ScheduleItem } from "@/components/ui/schedule-list";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SegmentedMeter } from "@/components/ui/meter";
import { Sparkline } from "@/components/ui/sparkline";
import { StackedBarChart, type StackedPoint } from "@/components/ui/stacked-bar-chart";
import { TickMeter } from "@/components/ui/tick-meter";
import { Button } from "@/components/ui/Button";
import type { Series } from "@/components/ui/chart-card";
import { cn } from "@/lib/utils";
import { BrandMark, CARD, Dot, Page, PageHead, Panel, SampleStamp, Shell } from "./_panolar";

/**
 * Otomasyonlar panosu (baobun.studio görselinden yapı; metin ve veri kurgusal):
 * ölçü şeridi, gün başına kredi (yığılı sütun), sıradaki çalışmalar, tüm
 * otomasyonların tablosu. Dönem değişince şerit, grafik ve tablo birlikte döner.
 * Telefonda tablo kayıt listesine dönüşür (`record-list`).
 */

type Period = "7" | "30" | "90";
const PERIODS: readonly { value: Period; label: string }[] = [
  { value: "7", label: "7 gün" },
  { value: "30", label: "30 gün" },
  { value: "90", label: "90 gün" },
];

type Automation = {
  id: string;
  name: string;
  desc: string;
  /** Grafik seri rengi; duraklatılmışta yok. */
  color?: Series;
  schedule: string;
  apps: readonly string[];
  last: string;
  /** 7 günlük çalışma ve kredi; öteki dönemler bunlardan türer. */
  runs: number;
  credits: number;
  status: "active" | "paused";
};

const AUTOMATIONS: readonly Automation[] = [
  { id: "triyaj", name: "Destek triyajı", desc: "Yeni konuşmaları etiketler ve yönlendirir", color: 4, schedule: "Hafta içi 08:00–20:00, saatlik", apps: ["Gelen", "Takip"], last: "Bugün 11:00", runs: 56, credits: 112, status: "active" },
  { id: "kayip", name: "Kayıp riski özeti", desc: "Sessizleşen hesapları işaretler", color: 3, schedule: "Her gün 08:00", apps: ["Gelen", "Kanal"], last: "Bugün 08:00", runs: 7, credits: 84, status: "active" },
  { id: "geri-bildirim", name: "Haftalık geri bildirim özeti", desc: "Geri bildirimi konulara ayırır", color: 2, schedule: "Pazartesi 09:00", apps: ["Gelen", "Form", "Kanal"], last: "Pzt 16, 09:00", runs: 1, credits: 38, status: "active" },
  { id: "rakip", name: "Rakip izleme", desc: "6 rakibin fiyat sayfasını okur", color: 6, schedule: "Çarşamba 07:30", apps: ["Web", "Kanal"], last: "Çar 18, 07:30", runs: 1, credits: 24, status: "active" },
  { id: "surum", name: "Sürüm notu taslağı", desc: "Birleşen değişikliklerden taslak çıkarır", color: 5, schedule: "Cuma 16:00", apps: ["Kod", "Not"], last: "Cum 20, 16:04", runs: 1, credits: 18, status: "active" },
  { id: "fatura", name: "Fatura hatırlatıcı", desc: "Gecikmiş faturalar için taslak yazar", schedule: "Duraklatıldı", apps: ["Muhasebe"], last: "3 Kas", runs: 0, credits: 0, status: "paused" },
  { id: "ise-alim", name: "İşe alım özeti", desc: "Başvuruları haftalık özetler", schedule: "Duraklatıldı", apps: ["Form"], last: "27 Eki", runs: 0, credits: 0, status: "paused" },
];

const SERIES = AUTOMATIONS.filter((a) => a.color).map((a) => ({ name: a.name, color: a.color! }));

/** 7 gün sabit; 30 ve 90 günde sütunlar türetilir (tamsayı, belirleyici: sunucuda da aynı çıkar). */
const WEEK: readonly (readonly number[])[] = [
  [26, 12, 8, 0, 0],
  [24, 12, 0, 6, 12],
  [0, 12, 0, 0, 0],
  [0, 12, 0, 0, 0],
  [26, 12, 38, 6, 0],
  [26, 12, 0, 0, 0],
  [10, 12, 6, 8, 8],
];
const WEEK_LABELS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Bugün"];

function chartFor(period: Period): { data: StackedPoint[]; unit: string; scale: number } {
  if (period === "7") return { data: WEEK.map((values, i) => ({ label: WEEK_LABELS[i], values })), unit: "/gün", scale: 1 };
  const count = period === "30" ? 6 : 12;
  const factor = period === "30" ? 5 : 7;
  const data = Array.from({ length: count }, (_, i) => ({
    label: period === "30" ? `${i * 5 + 1}-${i * 5 + 5}` : `H${i + 1}`,
    values: SERIES.map((_, s) => {
      const base = [26, 12, 6, 5, 4][s] * factor;
      return Math.round(base * (0.55 + (((i + 1) * (s + 3) * 7) % 10) / 12));
    }),
  }));
  return { data, unit: period === "30" ? "/5 gün" : "/hafta", scale: period === "30" ? 4 : 12 };
}

const SPARK: Record<string, readonly number[]> = {
  runs: [4, 9, 6, 11, 8, 12, 7, 14],
  credits: [30, 44, 28, 52, 40, 66, 38, 44],
  tagged: [20, 28, 24, 36, 30, 44, 32, 50],
};

const SCHEDULE: readonly ScheduleItem[] = [
  { id: "s1", at: "2026-11-23T08:00", time: "08:00", day: "Pzt 23", title: "Destek triyajı", detail: "Sonra saatlik, 20:00'ye kadar", color: 4, apps: <AppChips names={["Gelen"]} /> },
  { id: "s2", at: "2026-11-23T08:00", time: "08:00", day: "Pzt 23", title: "Kayıp riski özeti", detail: "#basari kanalına gönderir", color: 3, apps: <AppChips names={["Kanal"]} /> },
  { id: "s3", at: "2026-11-23T09:00", time: "09:00", day: "Pzt 23", title: "Haftalık geri bildirim özeti", detail: "#urun kanalına gönderir", color: 2, apps: <AppChips names={["Gelen", "Kanal"]} /> },
  { id: "s4", at: "2026-11-25T07:30", time: "07:30", day: "Çar 25", title: "Rakip izleme", detail: "#urun kanalına gönderir", color: 6, apps: <AppChips names={["Kanal"]} /> },
  { id: "s5", at: "2026-11-27T16:00", time: "16:00", day: "Cum 27", title: "Sürüm notu taslağı", detail: "Birleşen değişikliklerden Not'a taslak", color: 5, apps: <AppChips names={["Kod", "Not"]} /> },
];

function AppChips({ names }: { names: readonly string[] }) {
  return (
    <span className="inline-flex -space-x-1.5">
      {names.map((name) => (
        <span key={name} title={name} aria-hidden className="inline-grid size-6 place-items-center rounded-md bg-overlay text-micro font-semibold text-body shadow-raised ring-1 ring-line">
          {name[0]}
        </span>
      ))}
    </span>
  );
}

const nf = new Intl.NumberFormat("tr-TR");

function Metric({ label, value, note, spark, title }: { label: string; value: string; note: string; spark?: readonly number[]; title?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 p-4 sm:p-5">
      <span className="text-small text-muted">{label}</span>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <span className="text-heading font-semibold tracking-tight text-strong tabular-nums">{value}</span>
          <span className="ml-2 text-small text-muted">{note}</span>
        </div>
        {spark ? <Sparkline values={spark} title={title ?? label} width={64} height={28} /> : null}
      </div>
    </div>
  );
}

const NAV = [
  {
    items: [
      { href: "#ana", label: "Ana sayfa", icon: <Home /> },
      { href: "#gelen", label: "Gelen kutusu", icon: <Inbox />, badge: "1" },
      { href: "#otomasyonlar", label: "Otomasyonlar", icon: <Zap /> },
      { href: "#icgoruler", label: "İçgörüler", icon: <BarChart3 /> },
      { href: "#musteriler", label: "Müşteriler", icon: <Users /> },
    ],
  },
  {
    label: "Otomasyonlarım",
    items: AUTOMATIONS.map((a) => ({
      href: `#${a.id}`,
      label: a.name,
      icon: <Dot className={a.color ? `bg-chart-${a.color}` : "bg-line-strong"} />,
    })),
  },
] as const;

export function OtomasyonlarPage({ initialPeriod = "7" }: { initialPeriod?: Period }) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");

  const chart = useMemo(() => chartFor(period), [period]);
  const top = Math.max(20, Math.ceil(Math.max(...chart.data.map((p) => p.values.reduce((a, b) => a + b, 0))) / 20) * 20);
  const rows = AUTOMATIONS.filter((a) => filter === "all" || a.status === filter).map((a) => ({
    ...a,
    runs: Math.round(a.runs * chart.scale),
    credits: Math.round(a.credits * chart.scale),
  }));
  const max = Math.max(...AUTOMATIONS.map((a) => Math.round(a.credits * chart.scale)), 1);
  const total = (key: "runs" | "credits") => AUTOMATIONS.reduce((n, a) => n + Math.round(a[key] * chart.scale), 0);
  const active = AUTOMATIONS.filter((a) => a.status === "active").length;
  const paused = AUTOMATIONS.length - active;

  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: "name",
      header: "Otomasyon",
      render: (a) => (
        <div className="flex items-stretch gap-3">
          <span aria-hidden className={cn("w-1 shrink-0 rounded-full", a.color ? `bg-chart-${a.color}` : "bg-line-strong")} />
          <div className="min-w-0">
            <p className="font-medium text-strong">{a.name}</p>
            <p className="text-small text-muted">{a.desc}</p>
          </div>
        </div>
      ),
    },
    { key: "schedule", header: "Zamanlama", render: (a) => a.schedule },
    { key: "apps", header: "Uygulamalar", render: (a) => <AppChips names={a.apps} /> },
    { key: "last", header: "Son çalışma", render: (a) => a.last },
    { key: "runs", header: "Çalışma", numeric: true, render: (a) => nf.format(a.runs) },
    {
      key: "credits",
      header: "Kredi",
      width: "11rem",
      render: (a) => <TickMeter label={`${a.name} kredisi`} value={a.credits} max={max} ticks={14} text={nf.format(a.credits)} size="sm" />,
    },
    {
      key: "status",
      header: "Durum",
      render: (a) => (
        <Badge tone={a.status === "active" ? "success" : "neutral"} dot>
          {a.status === "active" ? "Etkin" : "Duraklatıldı"}
        </Badge>
      ),
    },
  ];

  return (
    <Shell brand={{ name: "Kalfa", href: "#ana", logo: <BrandMark><Zap /></BrandMark> }} groups={NAV} current="#otomasyonlar" user={{ name: "Deniz Aksoy", detail: "Sahip" }}>
      <Page>
        <PageHead
          title="Otomasyonlar"
          badge={<SampleStamp />}
          description={`${active} etkin, ${paused} duraklatılmış`}
          actions={
            <>
              <SegmentedControl<Period> aria-label="Dönem" options={PERIODS} value={period} onValueChange={setPeriod} size="sm" />
              <Button variant="primary" size="sm">
                <Plus aria-hidden /> Yeni otomasyon
              </Button>
            </>
          }
        />

        <section aria-label="Özet ölçüler" className={cn(CARD, "grid grid-cols-2 lg:grid-cols-4 [&>*]:border-line-soft max-lg:[&>*:nth-child(n+3)]:border-t max-lg:[&>*:nth-child(2n)]:border-l lg:[&>*+*]:border-l")}>
          <Metric label="Çalışma" value={nf.format(total("runs"))} note="1 başarısız, yeniden çalıştı" spark={SPARK.runs} />
          <Metric label="Kullanılan kredi" value={nf.format(total("credits"))} note="bu ay 788 / 2.000" spark={SPARK.credits} />
          <Metric label="Etiketlenen konuşma" value={nf.format(Math.round(294 * chart.scale))} note="Destek triyajı" spark={SPARK.tagged} />
          <div className="flex min-w-0 flex-col gap-1 p-4 sm:p-5">
            <span className="text-small text-muted">Sana ihtiyaç var</span>
            <p className="flex items-baseline gap-2">
              <span className="text-heading font-semibold tracking-tight text-strong tabular-nums">1</span>
              <span className="text-small text-muted">Sürüm notu, Cum 16:04'ten beri</span>
            </p>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Panel id="kredi-gun" title="Gün başına kredi" note={`Son ${period} gün, otomasyona göre`}>
            <StackedBarChart title="Gün başına kredi" series={SERIES} data={chart.data} ticks={[0, top / 2, top]} highlight={chart.data.length - 1} unit={chart.unit} />
          </Panel>
          <div className="flex min-w-0 flex-col gap-5">
            <Panel id="kredi-ay" title="Kredi" note="Bu ay, otomasyona göre">
              <SegmentedMeter
                label="Aylık kredi"
                max={2000}
                format={(n) => nf.format(n)}
                segments={[
                  { label: "Destek triyajı", value: 312, series: 4 },
                  { label: "Kayıp riski", value: 214, series: 3 },
                  { label: "Geri bildirim", value: 108, series: 2 },
                  { label: "Rakip izleme", value: 92, series: 6 },
                  { label: "Sürüm notu", value: 62, series: 5 },
                ]}
              />
            </Panel>
            <Panel id="siradakiler" title="Sıradakiler" note="Önümüzdeki 7 gün" className="flex-1">
              <ScheduleList label="Sıradaki çalışmalar" items={SCHEDULE} />
            </Panel>
          </div>
        </div>

        <Panel
          id="tum-otomasyonlar"
          title="Bütün otomasyonlar"
          actions={
            <SegmentedControl<"all" | "active" | "paused">
              aria-label="Duruma göre süz"
              size="sm"
              value={filter}
              onValueChange={setFilter}
              options={[
                { value: "all", label: "Hepsi" },
                { value: "active", label: "Etkin" },
                { value: "paused", label: "Duraklatılmış" },
              ]}
            />
          }
          bodyClassName="px-0 sm:px-0 pt-2 pb-0"
        >
          <DataTable caption="Bütün otomasyonlar" columns={columns} rows={rows} rowKey={(a) => a.id} on="page" stickyFirst={false} minWidth="60rem" className="max-md:hidden" />
          <RecordList
            className="md:hidden"
            label="Bütün otomasyonlar"
            items={rows.map((a) => ({
              id: a.id,
              title: a.name,
              subtitle: a.schedule,
              value: `${nf.format(a.credits)} kredi`,
              meta: a.last,
              status: (
                <Badge tone={a.status === "active" ? "success" : "neutral"} dot>
                  {a.status === "active" ? "Etkin" : "Duraklatıldı"}
                </Badge>
              ),
            }))}
          />
        </Panel>
      </Page>
    </Shell>
  );
}
