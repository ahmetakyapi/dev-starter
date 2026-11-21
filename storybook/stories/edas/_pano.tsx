"use client";

import { useMemo, type ReactNode } from "react";
import { ArrowRight, BookOpenCheck, Gauge, Receipt, Users, WifiOff, Zap } from "lucide-react";
import { AreaChart } from "@/components/ui/area-chart";
import { Badge } from "@/components/ui/badge";
import { BarList } from "@/components/ui/bar-list";
import { Button } from "@/components/ui/Button";
import { ChartCard } from "@/components/ui/chart-card";
import { ComboChart } from "@/components/ui/combo-chart";
import { DataTable, type Column } from "@/components/ui/data-table";
import { DigitRoll } from "@/components/ui/digit-roll";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { ScheduleList, type ScheduleItem } from "@/components/ui/schedule-list";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sparkline } from "@/components/ui/sparkline";
import { Stat, StatGrid } from "@/components/ui/stat";
import { StatusList } from "@/components/ui/status-list";
import {
  CUSTOMERS,
  CURRENT_PERIOD,
  FLAGGED_READINGS,
  FLAG_LABEL,
  INVOICES,
  KINDS,
  KIND_LABEL,
  METERS,
  OPEN_OUTAGES,
  OVERDUE_INVOICES,
  PERIODS,
  PERIODS_12,
  READINGS,
  SYSTEMS,
  TODAY,
  UPCOMING_WORK,
  WORK_TYPE_LABEL,
  balanceOf,
  clock,
  collectionIn,
  type Invoice,
  customer,
  daysBetween,
  loadCurve,
  meterById,
  monthShort,
  num,
  num1,
  outageDaily,
  parseDay,
  pct,
  periodLabel,
  periodStats,
  regionLoss,
  tl,
  windowPeriods,
  type Period,
  type WorkOrderType,
} from "./_data";
import { useDerived } from "./_core";
import { activeInvoices, commsLostMeters, flaggedReadings, openOutages, overdueInvoices, openWorkOrders, useLiveStats, activeCustomers } from "./_selectors";
import { effectiveMeters } from "./_ops";
import { WORK_TYPE_LABEL as WORK_LABEL_X, type WorkType } from "./_store";
import { CARD, IconTile, MetricStrip, PageBody, PageHead, SampleNote, href, useApp, type PageProps } from "./_ui";

/** Enerji miktarı, okunur birimle: ≥ 1 milyon kWh → GWh, değilse MWh. */
const energy = (kwh: number) => (kwh >= 1_000_000 ? `${num1.format(kwh / 1_000_000)} GWh` : `${num1.format(kwh / 1000)} MWh`);
const energyNumber = (kwh: number) => (kwh >= 1_000_000 ? num1.format(kwh / 1_000_000) : num1.format(kwh / 1000));
const energyUnit = (kwh: number) => (kwh >= 1_000_000 ? "GWh" : "MWh");

/** Dönem seçici: panonun bütün ölçülerini ve grafiklerini birlikte değiştirir. */
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

/** Ölçü şeridi hücresi: sayı + değişim + dönem eğilimi (kıl çizgili tek kart içinde). */
function StatCell({
  icon,
  label,
  value,
  unit,
  change,
  changeLabel,
  series,
  positiveIsGood,
  trend,
  foot,
  tone = "neutral",
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  unit?: string;
  change: number | null;
  changeLabel: string;
  series?: readonly number[];
  positiveIsGood?: boolean;
  trend?: string;
  foot: string;
  tone?: "neutral" | "danger" | "warning";
}) {
  return (
    <div className="relative flex h-full flex-col gap-4 p-4 sm:p-5">
      <IconTile tone={tone} className="absolute top-4 right-4 sm:top-5 sm:right-5">
        {icon}
      </IconTile>
      <div className="pr-10">
        <StatGrid className="grid-cols-1 sm:grid-cols-1">
          <Stat label={label} value={value} unit={unit} change={change} changeLabel={changeLabel} positiveIsGood={positiveIsGood} />
        </StatGrid>
      </div>
      <div className="mt-auto border-t border-dashed border-line pt-3">
        {series && trend ? <Sparkline title={trend} values={series} width={240} height={32} className="w-full" /> : null}
        <p className={series ? "mt-1.5 text-small text-muted" : "text-small text-muted"}>{foot}</p>
      </div>
    </div>
  );
}

type Attention = {
  id: string;
  kind: "okuma" | "fatura" | "sayac" | "ariza";
  /** Ne olduğu: tek cümle. */
  what: string;
  /** Kime/neye ait. */
  who: string;
  /** Ne kadar süredir / tutar. */
  detail: string;
  to: { page: "readings" | "invoices" | "meters" | "outages"; params: Record<string, string> };
  sort: number;
};

/** Dikkat gerektirenler: aynı listelerden süzülen dört kaynak, tek tabloda. */
function buildAttention(): Attention[] {
  const rows: Attention[] = [];
  flaggedReadings(CURRENT_PERIOD)
    .slice(0, 4)
    .forEach((r) =>
      rows.push({
        id: r.id,
        kind: "okuma",
        what: r.flags[0] ? FLAG_LABEL[r.flags[0]] : "Şüpheli okuma",
        who: customer(r.customerId).name,
        detail: `${meterById(r.meterId)?.serial ?? r.meterId}`,
        to: { page: "readings", params: { id: r.id } },
        sort: 3,
      }),
    );
  overdueInvoices()
    .sort((a, b) => balanceOf(b) - balanceOf(a))
    .slice(0, 4)
    .forEach((i) =>
      rows.push({
        id: i.id,
        kind: "fatura",
        what: `${daysBetween(parseDay(i.due), TODAY)} gün gecikmiş fatura`,
        who: customer(i.customerId).name,
        detail: tl(balanceOf(i)),
        to: { page: "invoices", params: { id: i.id } },
        sort: 2,
      }),
    );
  commsLostMeters()
    .sort((a, b) => a.lastSeen.getTime() - b.lastSeen.getTime())
    .slice(0, 3)
    .forEach((m) =>
      rows.push({
        id: m.id,
        kind: "sayac",
        what: `${daysBetween(m.lastSeen, TODAY)} gündür iletişim yok`,
        who: customer(m.customerId).name,
        detail: m.serial,
        to: { page: "meters", params: { id: m.id } },
        sort: 1,
      }),
    );
  openOutages().slice(0, 2).forEach((o) =>
    rows.push({
      id: o.id,
      kind: "ariza",
      what: `Açık arıza · ${o.cause}`,
      who: `${o.substationId} trafo merkezi`,
      detail: `${num.format(o.affected)} abone etkileniyor`,
      to: { page: "outages", params: { id: o.id } },
      sort: 4,
    }),
  );
  return rows.sort((a, b) => b.sort - a.sort);
}

const KIND = {
  okuma: { label: "Okuma", icon: <BookOpenCheck />, tone: "danger" as const },
  fatura: { label: "Fatura", icon: <Receipt />, tone: "warning" as const },
  sayac: { label: "Sayaç", icon: <WifiOff />, tone: "warning" as const },
  ariza: { label: "Arıza", icon: <Zap />, tone: "danger" as const },
};

const WORK_COLOR: Record<WorkType, 1 | 2 | 3 | 4 | 5 | 6> = { kesme: 6, baglama: 5, "sayac-degisim": 3, "okuma-turu": 1, kontrol: 4, sokum: 3, kesif: 2, montaj: 2, ariza: 6 };

function ModeLink({ attention, go }: { attention: Attention; go: PageProps["go"] }) {
  return (
    <a
      href={href(attention.to.page, attention.to.params)}
      onClick={(e) => {
        e.preventDefault();
        go(attention.to.page, attention.to.params);
      }}
      className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-small font-semibold text-primary-ink hover:bg-primary-wash"
    >
      İncele <ArrowRight aria-hidden className="size-3.5" />
    </a>
  );
}

export function PanoPage({ go }: PageProps) {
  const { period } = useApp();
  const stats = useLiveStats(period);
  const activeNow = useDerived(activeCustomers);
  const meters = useDerived(effectiveMeters);
  const outagesNow = useDerived(openOutages);
  const upcoming = useDerived(() => openWorkOrders().filter((w) => w.status !== "tamamlandi" && w.scheduled >= new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate())).sort((a, b) => a.scheduled.getTime() - b.scheduled.getTime()));
  const label = PERIODS.find((p) => p.value === period)!.label;
  const prevLabel = period === "1" ? "önceki aya göre" : `önceki ${period} aya göre`;

  /* Eğilim çizgileri: tamamlanan on bir dönemin her biri (aynı listelerden). */
  const done = PERIODS_12.slice(0, 11);
  const usageTrend = done.map((p) => READINGS.filter((r) => r.period === p && r.status !== "bekliyor").reduce((s, r) => s + r.usage.total, 0));
  const billedTrend = done.map((p) => INVOICES.filter((i) => i.period === p).reduce((s, i) => s + i.total, 0));
  const liveInv = useDerived(activeInvoices);
  const rateTrend = done.map((p) => collectionIn(p, liveInv as Invoice[]));
  const lossTrend = done.map((p) => {
    const rows = regionLoss(p);
    return pct(rows.reduce((s, x) => s + x.lossKwh, 0), rows.reduce((s, x) => s + x.input, 0));
  });
  const flaggedTrend = done.map((p) => FLAGGED_READINGS.filter((r) => r.period === p).length);
  const outageTrend = outageDaily(10);

  /* Grafik dönemi: seçili pencere, en az üç ay. */
  const chartPeriods = useMemo(() => {
    const w = windowPeriods(period);
    return w.length >= 3 ? w : PERIODS_12.slice(8, 11);
  }, [period]);
  const monthLabels = chartPeriods.map((p) => monthShort.format(parseDay(p)).replace(".", ""));
  const billedBars = chartPeriods.map((p) => Math.round(INVOICES.filter((i) => i.period === p).reduce((s, i) => s + i.total, 0) / 100));
  const rateLine = chartPeriods.map((p) => collectionIn(p, liveInv as Invoice[]) / 100);

  /* Bölge kayıp/kaçak: pencere ortalaması, giriş enerjisi ağırlıklı. */
  const losses = useMemo(() => {
    const rows = stats.periods.flatMap((p) => regionLoss(p));
    return [...new Set(rows.map((r) => r.region.id))].map((id) => {
      const mine = rows.filter((r) => r.region.id === id);
      const input = mine.reduce((s, r) => s + r.input, 0);
      const lossKwh = mine.reduce((s, r) => s + r.lossKwh, 0);
      return { region: mine[0].region, lossPct: pct(lossKwh, input), target: mine[0].region.lossTarget, lossKwh };
    });
  }, [stats.periods]);

  const peak = (curve: number[]) => Math.max(...curve);
  const yesterday = loadCurve(1);
  const lastWeek = loadCurve(7);

  const attention = useDerived(buildAttention);
  const attentionColumns: readonly Column<Attention>[] = [
    {
      key: "kind",
      header: "Tür",
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <IconTile tone={KIND[r.kind].tone}>{KIND[r.kind].icon}</IconTile>
          <span className="text-body">{KIND[r.kind].label}</span>
        </span>
      ),
    },
    { key: "what", header: "Durum", render: (r) => <span className="font-medium text-strong">{r.what}</span> },
    { key: "who", header: "Abone / Konum", render: (r) => r.who },
    { key: "detail", header: "Ayrıntı", render: (r) => <span className="edas-mono text-body">{r.detail}</span> },
    { key: "act", header: <span className="sr-only">İşlem</span>, render: (r) => <ModeLink attention={r} go={go} /> },
  ];
  const attentionItems: RecordItem[] = attention.map((r) => ({
    id: r.id,
    title: r.who,
    subtitle: r.what,
    leading: <IconTile tone={KIND[r.kind].tone}>{KIND[r.kind].icon}</IconTile>,
    value: r.detail,
    status: <Badge tone={KIND[r.kind].tone}>{KIND[r.kind].label}</Badge>,
    onSelect: () => go(r.to.page, r.to.params),
    href: href(r.to.page, r.to.params),
  }));

  const schedule: ScheduleItem[] = upcoming.slice(0, 7).map((w) => {
    const days = daysBetween(TODAY, w.scheduled);
    return {
      id: w.id,
      at: `${w.scheduled.getFullYear()}-${String(w.scheduled.getMonth() + 1).padStart(2, "0")}-${String(w.scheduled.getDate()).padStart(2, "0")}T${clock.format(w.scheduled)}`,
      time: clock.format(w.scheduled),
      day: days === 0 ? "Bugün" : days === 1 ? "Yarın" : new Intl.DateTimeFormat("tr-TR", { weekday: "short", day: "numeric" }).format(w.scheduled),
      title: WORK_LABEL_X[w.type],
      detail: w.customerId ? `${customer(w.customerId).name} · ${w.reason}` : w.reason,
      color: WORK_COLOR[w.type],
    };
  });

  const openOutageSub = outagesNow.reduce((s, o) => s + o.affected, 0);

  return (
    <>
      <PageHead
        title="Pano"
        description={`Pilot bölge · ${num.format(stats.active)} aktif abone, ${num.format(meters.length)} sayaç · ${periodLabel(CURRENT_PERIOD)} okumaları sürüyor`}
        actions={
          <>
            <PeriodControl />
            <Button variant="secondary" size="sm" onClick={() => go("reports")}>
              Rapor Al
            </Button>
            <Button variant="primary" size="sm" onClick={() => go("register")}>
              Yeni Müşteri
            </Button>
          </>
        }
      />
      <PageBody>
        <MetricStrip>
          <StatCell
            icon={<Users />}
            label="Aktif Abone"
            value={<DigitRoll value={num.format(stats.active)} />}
            change={null}
            changeLabel=""
            foot={KINDS.map((k) => `${KIND_LABEL[k]} ${num.format(activeNow.filter((c) => c.kind === k).length)}`).join(" · ")}
          />
          <StatCell
            icon={<Zap />}
            label={`Tüketim · ${label}`}
            value={<DigitRoll value={energyNumber(stats.usage)} />}
            unit={energyUnit(stats.usage)}
            change={stats.usageBefore ? Math.round(((stats.usage - stats.usageBefore) / stats.usageBefore) * 1000) / 10 : null}
            changeLabel={prevLabel}
            series={usageTrend}
            trend="Aylık tüketim eğilimi"
            foot="Okunan sayaçların toplamı"
          />
          <StatCell
            icon={<Receipt />}
            label="Tahsilat Oranı"
            value={<DigitRoll value={`%${num1.format(stats.collectionRate)}`} />}
            change={Math.round((stats.collectionRate - stats.collectionBefore) * 10) / 10}
            changeLabel={prevLabel}
            series={rateTrend}
            trend="Tahsilat oranı eğilimi"
            foot="Vadesi gelen faturalarda"
          />
          <StatCell
            icon={<Gauge />}
            label="Kayıp / Kaçak"
            value={<DigitRoll value={`%${num1.format(stats.lossPct)}`} />}
            change={Math.round((stats.lossPct - stats.lossBefore) * 10) / 10}
            changeLabel={prevLabel}
            positiveIsGood={false}
            series={lossTrend}
            trend="Kayıp kaçak eğilimi"
            foot="Giriş enerjisine oranla"
          />
          <StatCell
            icon={<Zap />}
            label="Açık Arıza"
            value={<DigitRoll value={num.format(stats.openOutages)} />}
            change={null}
            changeLabel=""
            series={outageTrend}
            trend="Son on günün günlük arıza sayısı"
            tone={stats.openOutages ? "danger" : "neutral"}
            foot={`${num.format(openOutageSub)} abone etkileniyor`}
          />
          <StatCell
            icon={<WifiOff />}
            label="Okunamayan"
            value={<DigitRoll value={num.format(stats.unreadable)} />}
            change={null}
            changeLabel=""
            series={flaggedTrend}
            trend="Aylık şüpheli okuma sayısı"
            tone="warning"
            foot={`${meters.filter((m) => m.status === "iletisim-yok").length} iletişim yok, ${meters.filter((m) => m.status === "arizali").length} arızalı sayaç`}
          />
        </MetricStrip>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <ChartCard
            id="pano-yuk"
            className={`${CARD} xl:col-span-3`}
            label="Günlük Yük Eğrisi"
            value={`${num1.format(peak(yesterday))} MW`}
            change={Math.round(((peak(yesterday) - peak(lastWeek)) / peak(lastWeek)) * 1000) / 10}
            changeLabel="geçen haftaya göre (dünün tepe yükü)"
            action={<Badge tone="neutral">Saatlik, MW</Badge>}
          >
            <AreaChart
              title="Günlük Yük Eğrisi, Dün ve Geçen Hafta Aynı Gün"
              labels={yesterday.map((_, h) => String(h).padStart(2, "0"))}
              series={[
                { label: "Dün", values: yesterday, series: 1 },
                { label: "Geçen hafta", values: lastWeek, series: 3 },
              ]}
              unit="MW"
              valueFormat={{ maximumFractionDigits: 2 }}
            />
          </ChartCard>

          <ChartCard
            id="pano-tahsilat"
            className={`${CARD} xl:col-span-2`}
            label="Tahakkuk ve Tahsilat"
            value={tl(stats.billed)}
            change={stats.billedBefore ? Math.round(((stats.billed - stats.billedBefore) / stats.billedBefore) * 1000) / 10 : null}
            changeLabel={prevLabel}
          >
            <ComboChart
              title="Aylık Tahakkuk ve Tahsilat Oranı"
              labels={monthLabels}
              bars={{ label: "Tahakkuk", values: billedBars, series: 1, unit: "₺", format: { notation: "compact", maximumFractionDigits: 1 } }}
              line={{ label: "Tahsilat", values: rateLine, series: 5, format: { style: "percent", maximumFractionDigits: 1 } }}
            />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <div className="grid grid-cols-1 content-start gap-5 xl:col-span-2">
            <ChartCard id="pano-kayip" className={CARD} label="Bölgeye Göre Kayıp / Kaçak" value={`%${num1.format(stats.lossPct)}`} change={null} action={<Badge tone="neutral">{label}</Badge>}>
              <BarList
                title="Bölgeye Göre Kayıp ve Kaçak Oranı"
                columns={["Bölge", "Oran"]}
                items={losses.map((l) => ({ label: `${l.region.name} · hedef %${l.target}`, value: l.lossPct }))}
                valueFormat={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                series={1}
              />
            </ChartCard>
            <div className={CARD}>
              <div className="rounded-lg bg-surface p-3">
                <StatusList title="Sistem Durumu" items={SYSTEMS.map((s) => ({ id: s.id, label: s.label, status: s.status }))} incident="Son olay: 20 Kas, GSM ağ geçidi yavaşlığı" headingLevel={2} />
              </div>
            </div>
          </div>

          <section aria-labelledby="pano-sirada" className={`${CARD} xl:col-span-3`}>
            <div className="flex h-full flex-col rounded-lg bg-surface p-2">
              <header className="px-3 pt-3 pb-2">
                <h2 id="pano-sirada" className="text-small font-medium text-muted">
                  Sıradaki İşler
                </h2>
                <p className="mt-1 text-heading font-semibold tracking-tight text-strong">{num.format(upcoming.length)} planlı iş</p>
              </header>
              <div className="px-3 pb-3">
                <ScheduleList label="Planlı iş emirleri" items={schedule} />
              </div>
            </div>
          </section>
        </div>

        <section aria-labelledby="pano-dikkat" className={`${CARD}`}>
          <div className="rounded-lg bg-overlay">
            <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
              <div>
                <h2 id="pano-dikkat" className="text-read font-semibold text-strong">
                  Dikkat Gerektirenler
                </h2>
                <p className="text-small text-muted">Şüpheli okuma, geciken fatura, iletişimi kopan sayaç ve açık arıza: önce en acil olan.</p>
              </div>
              <Badge tone="danger" dot>
                {attention.length} kayıt
              </Badge>
            </header>
            <div className="max-md:hidden">
              <DataTable<Attention> caption="Dikkat gerektirenler" columns={attentionColumns} rows={attention} rowKey={(r) => r.id} density="comfortable" on="surface" stickyFirst={false} />
            </div>
            <div className="px-3 pb-3 md:hidden">
              <RecordList label="Dikkat gerektirenler" items={attentionItems} />
            </div>
          </div>
        </section>

        <SampleNote />
      </PageBody>
    </>
  );
}
