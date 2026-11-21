"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpenCheck, Gauge, Receipt, Users, WifiOff, Zap } from "lucide-react";
import { AreaChart } from "@/components/ui/area-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { ChartCard } from "@/components/ui/chart-card";
import { ComboChart } from "@/components/ui/combo-chart";
import { DataTable, type Column } from "@/components/ui/data-table";
import { RegionMap, type MapRegion } from "@/components/ui/region-map";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { ScheduleList, type ScheduleItem } from "@/components/ui/schedule-list";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatusList } from "@/components/ui/status-list";
import {
  CURRENT_PERIOD,
  FLAGGED_READINGS,
  FLAG_LABEL,
  INVOICES,
  KINDS,
  KIND_LABEL,
  PERIODS,
  PERIODS_12,
  READINGS,
  SYSTEMS,
  TODAY,
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
  outageDaily,
  parseDay,
  pct,
  periodLabel,
  regionLoss,
  tl,
  windowPeriods,
  type Period,
} from "./_data";
import { useDerived } from "./_core";
import { activeInvoices, commsLostMeters, flaggedReadings, openOutages, overdueInvoices, openWorkOrders, useLiveStats, activeCustomers } from "./_selectors";
import { effectiveMeters } from "./_ops";
import { WORK_TYPE_LABEL as WORK_LABEL_X, type WorkType } from "./_store";
import { MAP_SHAPES, MAP_VIEWBOX } from "./_harita";
import { useRole } from "./_permissions";
import { COLLECTION_SCOPE, flaggedReadings as flagged, overdueTotal, useBadges } from "./_selectors";
import { BarTarget, PageHero, TodayBand, fmtDec, fmtKwh, fmtNum, fmtPct, fmtTl, fmtTlCompact, type MetricProps } from "./_kit";
import { CARD, IconTile, PageBody, PageHead, href, useApp, type PageProps } from "./_ui";

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

const ROLE_HERO: Record<string, string> = { okuma: "supheli", tahsilat: "tahsilat", musteri: "ariza", denetci: "tahsilat", yonetici: "tahsilat" };

export function PanoPage({ go, params }: PageProps) {
  const { period } = useApp();
  const role = useRole();
  const stats = useLiveStats(period);
  const badges = useBadges();
  const activeNow = useDerived(activeCustomers);
  const meters = useDerived(effectiveMeters);
  const outagesNow = useDerived(openOutages);
  const owed = useDerived(overdueTotal);
  const flaggedNow = useDerived(() => flagged(CURRENT_PERIOD).length);
  const upcoming = useDerived(() =>
    openWorkOrders()
      .filter((w) => w.status !== "tamamlandi" && w.scheduled >= new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate()))
      .sort((a, b) => a.scheduled.getTime() - b.scheduled.getTime()),
  );
  const label = PERIODS.find((p) => p.value === period)!.label;
  const prevLabel = period === "1" ? "önceki aya göre" : `önceki ${period} aya göre`;
  const [selected, setSelected] = useState<string | null>(null);

  /* Eğilim çizgileri: tamamlanan on bir dönemin her biri (aynı listelerden). */
  const done = PERIODS_12.slice(0, 11);
  const usageTrend = done.map((p) => READINGS.filter((r) => r.period === p && r.status !== "bekliyor").reduce((s, r) => s + r.usage.total, 0));
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
  const overRegions = losses.filter((l) => l.lossPct > l.target);
  const mapRegions: MapRegion[] = MAP_SHAPES.map((s) => {
    const l = losses.find((x) => x.region.id === s.id)!;
    return { id: s.id, label: l.region.name.split(" ")[0], path: s.path, at: s.at, value: l.lossPct, tone: l.lossPct > l.target ? ("danger" as const) : ("success" as const), note: `hedef %${l.target}` };
  });
  const picked = losses.find((l) => l.region.id === selected);

  /* "Haritayı aç" (Bugün bandı) bu bölüme kaydırır. */
  useEffect(() => {
    if (params.focus === "kayip") document.getElementById("pano-kayip")?.scrollIntoView({ block: "start" });
  }, [params.focus]);

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
  const commsLost = meters.filter((m) => m.status === "iletisim-yok").length;
  const faulty = meters.filter((m) => m.status === "arizali").length;
  const pctChange = (now: number, before: number) => (before ? Math.round(((now - before) / before) * 1000) / 10 : undefined);

  /* Kahraman: rolün bugünkü en önemli sayısı; ikincil ölçüler her rolde aynı beş-altı ölçü, kahraman olan hariç. */
  const metrics: Record<string, MetricProps> = {
    supheli: { label: "Onay bekleyen şüpheli okuma", value: fmtNum(flaggedNow), foot: `${fmtNum(badges.readings)} bu dönemde · önce bunları onayla ya da düzelt`, spark: flaggedTrend, to: { page: "readings", params: { status: "supheli" } }, icon: <BookOpenCheck /> },
    tahsilat: { label: "Vadesi geçmiş alacak", value: fmtTlCompact(owed), foot: `${fmtNum(badges.invoices)} fatura · tahsilat kuyruğunu aç`, to: { page: "invoices", params: { status: "gecikti" } }, icon: <Receipt /> },
    ariza: { label: "Açık arızada etkilenen abone", value: fmtNum(openOutageSub), foot: `${fmtNum(stats.openOutages)} açık arıza · arıza listesini aç`, spark: outageTrend, to: { page: "outages", params: { status: "acik" } }, icon: <Zap /> },
    abone: { label: "Aktif abone", value: fmtNum(stats.active), foot: KINDS.map((k) => `${KIND_LABEL[k]} ${fmtNum(activeNow.filter((c) => c.kind === k).length)}`).join(" · "), to: { page: "customers" }, icon: <Users /> },
    tuketim: { label: `Tüketim · ${label}`, value: fmtKwh(stats.usage), delta: pctChange(stats.usage, stats.usageBefore), goodWhen: "neutral", deltaLabel: prevLabel, spark: usageTrend, foot: "Okunan sayaçların toplamı", icon: <Zap /> },
    oran: { label: "Tahsilat oranı", value: fmtPct(stats.collectionRate), delta: Math.round((stats.collectionRate - stats.collectionBefore) * 10) / 10, goodWhen: "up", deltaLabel: prevLabel, spark: rateTrend, foot: COLLECTION_SCOPE, to: { page: "payments" }, icon: <Receipt /> },
    kayip: { label: "Kayıp / kaçak", value: fmtPct(stats.lossPct), delta: Math.round((stats.lossPct - stats.lossBefore) * 10) / 10, goodWhen: "down", deltaLabel: prevLabel, spark: lossTrend, foot: `${overRegions.length} bölge hedefin üstünde`, to: { page: "dashboard", params: { focus: "kayip" } }, icon: <Gauge /> },
    ariza2: { label: "Açık arıza", value: fmtNum(stats.openOutages), foot: `${fmtNum(openOutageSub)} abone etkileniyor`, spark: outageTrend, to: { page: "outages", params: { status: "acik" } }, icon: <Zap /> },
    okunamayan: { label: "Okunamayan sayaç", value: fmtNum(stats.unreadable), foot: `${commsLost} iletişim yok · ${faulty} arızalı`, spark: flaggedTrend, to: { page: "meters", params: { tab: "kesik" } }, icon: <WifiOff /> },
  };
  const heroKey = ROLE_HERO[role] ?? "tahsilat";
  const order = ["abone", "tuketim", "oran", "kayip", "ariza2", "okunamayan"].filter((k) => !(heroKey === "ariza" && k === "ariza2") && !(heroKey === "tahsilat" && k === "oran" && false));

  return (
    <>
      <PageHead
        title="Pano"
        description={`Pilot bölge · ${fmtNum(stats.active)} aktif abone, ${fmtNum(meters.length)} sayaç · ${periodLabel(CURRENT_PERIOD)} okumaları sürüyor`}
        actions={
          <>
            <PeriodControl />
            <Button variant="secondary" size="sm" onClick={() => go("reports")}>
              Raporlar
            </Button>
            <Button variant="primary" size="sm" onClick={() => go("register")}>
              Yeni Müşteri
            </Button>
          </>
        }
      />
      <PageBody>
        <TodayBand />

        <PageHero primary={metrics[heroKey]} secondary={order.slice(0, 6).map((k) => metrics[k])} />

        <section aria-labelledby="pano-dikkat" className={CARD}>
          <div className="rounded-lg bg-overlay">
            <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
              <div>
                <h2 id="pano-dikkat" className="text-read font-semibold text-strong">
                  Dikkat Gerektirenler
                </h2>
                <p className="text-small text-muted">Şüpheli okuma, geciken fatura, iletişimi kopan sayaç ve açık arıza: en acil olan üstte.</p>
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

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <ChartCard
            id="pano-yuk"
            className={`${CARD} xl:col-span-3`}
            label="Günlük Yük Eğrisi"
            value={`${fmtDec(peak(yesterday), 2)} MW`}
            change={Math.round(((peak(yesterday) - peak(lastWeek)) / peak(lastWeek)) * 1000) / 10}
            changeLabel="geçen haftaya göre (dünün tepe yükü)"
            action={<Badge tone="neutral">Saatlik, MW</Badge>}
          >
            <AreaChart
              title="Günlük Yük Eğrisi, Dün ve Geçen Hafta Aynı Gün"
              labels={yesterday.map((_, h) => String(h).padStart(2, "0"))}
              series={[
                { label: "Dün", values: yesterday, series: 1 },
                { label: "Geçen hafta aynı gün", values: lastWeek, series: 3 },
              ]}
              unit="MW"
              valueFormat={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            />
          </ChartCard>

          <ChartCard
            id="pano-tahsilat"
            className={`${CARD} xl:col-span-2`}
            label="Tahakkuk ve Tahsilat"
            value={fmtTl(stats.billed, 0)}
            change={pctChange(stats.billed, stats.billedBefore) ?? null}
            changeLabel={prevLabel}
          >
            <ComboChart
              title="Aylık Tahakkuk (sütun, TL) ve Tahsilat Oranı (çizgi, %)"
              labels={monthLabels}
              bars={{ label: "Tahakkuk", values: billedBars, series: 1, unit: "₺", format: { notation: "compact", maximumFractionDigits: 1 } }}
              line={{ label: "Tahsilat oranı", values: rateLine, series: 2, format: { style: "percent", maximumFractionDigits: 1 } }}
            />
            <p className="px-2 pt-2 text-small text-muted">{COLLECTION_SCOPE}.</p>
          </ChartCard>
        </div>

        <div id="pano-kayip" className="grid scroll-mt-4 grid-cols-1 gap-5 xl:grid-cols-5">
          <ChartCard id="pano-harita" className={`${CARD} xl:col-span-3`} label="Bölge Haritası · Kayıp / Kaçak" value={fmtPct(stats.lossPct)} change={null} action={<Badge tone={overRegions.length ? "danger" : "success"} dot>{overRegions.length ? `${overRegions.length} bölge hedefin üstünde` : "Bütün bölgeler hedefte"}</Badge>}>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem] md:items-center">
              <RegionMap title="Bölgeye Göre Kayıp ve Kaçak Oranı" regions={mapRegions} viewBox={MAP_VIEWBOX} format={(v) => fmtPct(v)} selectedId={selected} onSelect={(id) => setSelected((cur) => (cur === id ? null : id))} legend={["Hedefte", "Hedef üstü"]} />
              <div className="rounded-lg bg-surface p-3 text-base">
                {picked ? (
                  <>
                    <p className="font-semibold text-strong">{picked.region.name}</p>
                    <p className="mt-1 text-body">Kayıp / kaçak {fmtPct(picked.lossPct)} · hedef {fmtPct(picked.target, 0)}</p>
                    <p className="text-small text-muted">{fmtKwh(picked.lossKwh)} kayıp enerji ({label.toLocaleLowerCase("tr-TR")})</p>
                    <Button className="mt-2" size="sm" variant="secondary" onClick={() => go("reports")}>Bölge raporu</Button>
                  </>
                ) : (
                  <p className="text-small text-muted">Bir bölgeye dokun: kayıp oranı, hedef ve kayıp enerji burada açılır. Kırmızı bölgeler hedefi aşıyor.</p>
                )}
              </div>
            </div>
          </ChartCard>

          <ChartCard id="pano-kayip-liste" className={`${CARD} xl:col-span-2`} label="Hedefe Göre Sıralama" value={`${overRegions.length} / ${losses.length} bölge hedef üstünde`} change={null} action={<Badge tone="neutral">{label}</Badge>}>
            <BarTarget
              aria-label="Bölgeye göre kayıp ve kaçak oranı"
              rows={[...losses].sort((a, b) => b.lossPct - b.target - (a.lossPct - a.target)).map((l) => ({ id: l.region.id, label: l.region.name, value: l.lossPct, target: l.target }))}
              format={(v) => fmtPct(v)}
            />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <section aria-labelledby="pano-sirada" className={`${CARD} xl:col-span-3`}>
            <div className="flex h-full flex-col rounded-lg bg-surface p-2">
              <header className="px-3 pt-3 pb-2">
                <h2 id="pano-sirada" className="text-small font-medium text-muted">
                  Sıradaki İşler
                </h2>
                <p className="mt-1 text-heading font-semibold tracking-tight text-strong">{fmtNum(upcoming.length)} planlı iş</p>
              </header>
              <div className="px-3 pb-3">
                <ScheduleList label="Planlı iş emirleri" items={schedule} />
              </div>
            </div>
          </section>
          <div className={`${CARD} xl:col-span-2`}>
            <div className="rounded-lg bg-surface p-3">
              <StatusList title="Sistem Durumu" items={SYSTEMS.map((s) => ({ id: s.id, label: s.label, status: s.status }))} incident="Son olay: 20 Kas, GSM ağ geçidi yavaşlığı" headingLevel={2} />
            </div>
          </div>
        </div>
      </PageBody>
    </>
  );
}
