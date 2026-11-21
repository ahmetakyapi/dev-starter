"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Download, Gauge, Radio, RefreshCw, Save, Trash2, TriangleAlert } from "lucide-react";
import { AreaChart } from "@/components/ui/area-chart";
import { Badge } from "@/components/ui/badge";
import { BarList } from "@/components/ui/bar-list";
import { Button } from "@/components/ui/Button";
import { ChartCard, ChartLegend } from "@/components/ui/chart-card";
import { Checkbox } from "@/components/ui/checkbox";
import { CodeBlock } from "@/components/ui/code-block";
import { Combobox, type ComboboxItem } from "@/components/ui/combobox";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { InsightCallout } from "@/components/ui/insight-callout";
import { Input } from "@/components/ui/input";
import { LineChart } from "@/components/ui/line-chart";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Stat, StatGrid } from "@/components/ui/stat";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { COMM_LABEL, METERS, customer, dayLabel, meterById, num, num1 } from "./_data";
import { nextId } from "./_core";
import {
  DEFAULT_METER_ID,
  EXPORT_FIELDS,
  MEASURES,
  QUALITY_LABEL,
  RANGES,
  RESOLUTIONS,
  WEEKDAYS,
  ZONE_LABEL,
  apiExamples,
  bestResolution,
  bucketize,
  buildTelegram,
  emptyRuns,
  gapsOf,
  measureOf,
  previousDays,
  qualityOf,
  rangeDays,
  rawRows,
  resolutionAllowed,
  sizeKb,
  toCsv,
  toJson,
  weekdayHourGrid,
  type CompareMode,
  type ExportField,
  type MeasureId,
  type Quality,
  type RangeId,
  type RawRow,
  type Resolution,
  type SavedQuery,
  savedQueries,
  type Zone,
} from "./_data-ham";
import { IconTile, MeterBadge, MetricStrip, PageBody, PageHead, Panel, SampleNote, href, useApp, type PageProps } from "./_ui";

/* --- Küçük yardımcılar ----------------------------------------------------------- */

const PAGE_SIZE = 20;
const f = (digits: number) => ({ minimumFractionDigits: digits, maximumFractionDigits: digits });
const fmt = (value: number, digits = 2) => new Intl.NumberFormat("tr-TR", f(digits)).format(value);

const QUALITY_TONE: Record<Quality, "success" | "neutral" | "danger" | "warning"> = { iyi: "success", tahmin: "neutral", eksik: "danger", dogrulanmamis: "warning" };
function QualityBadge({ quality }: { quality: Quality }) {
  return (
    <Badge tone={QUALITY_TONE[quality]} dot>
      {QUALITY_LABEL[quality]}
    </Badge>
  );
}
const ZONE_TONE: Record<Zone, "chart-1" | "chart-4" | "chart-3"> = { T1: "chart-1", T2: "chart-4", T3: "chart-3" };

const HEAT = ["bg-chart-track", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"] as const;
const heatLevel = (value: number, min: number, max: number) => (value <= 0 ? 0 : Math.min(4, 1 + Math.floor(((value - min) / Math.max(max - min, 0.01)) * 4)));

const meterItems: readonly ComboboxItem[] = METERS.map((m) => ({ value: m.id, label: `${m.serial} · ${customer(m.customerId).name}` }));
const itemOf = (id: string): ComboboxItem => meterItems.find((i) => i.value === id) ?? meterItems[0];

type Status = "bekliyor" | "istendi" | "alindi";

/** Ölçü şeridi hücresi: tek ölçü, bir satır bağlam. */
function Cell({ icon, label, value, unit, foot, tone = "neutral" }: { icon: React.ReactNode; label: string; value: string; unit?: string; foot: string; tone?: "neutral" | "danger" | "warning" | "success" }) {
  return (
    <div className="relative flex h-full flex-col gap-3 p-4 sm:p-5">
      <IconTile tone={tone} className="absolute top-4 right-4 sm:top-5 sm:right-5">
        {icon}
      </IconTile>
      <div className="pr-10">
        <StatGrid className="grid-cols-1 sm:grid-cols-1">
          <Stat label={label} value={value} unit={unit} />
        </StatGrid>
      </div>
      <p className="mt-auto border-t border-dashed border-line pt-3 text-small text-muted">{foot}</p>
    </div>
  );
}

/** İndirmeyi tarayıcıda gerçekten başlatır (CSV ve JSON); sayfa dışına çıkmaz. */
function download(name: string, text: string, type: string) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    // Ortam indirmeye izin vermiyorsa bildirim yine çıkar.
  }
}

/* --- Sayfa ------------------------------------------------------------------------- */

export function HamVeriPage({ params, go }: PageProps) {
  const { notify } = useApp();
  const meter = meterById(params.id ?? params.meter ?? "") ?? meterById(DEFAULT_METER_ID)!;
  const owner = customer(meter.customerId);

  const [range, setRange] = useState<RangeId>("7");
  const [res, setRes] = useState<Resolution>("60");
  const [measureId, setMeasureId] = useState<MeasureId>("kwh");
  const [compare, setCompare] = useState<CompareMode>("onceki");
  const [otherId, setOtherId] = useState<string>(() => METERS.find((m) => m.id !== meter.id && customer(m.customerId).kind === owner.kind && m.status === "okunuyor")?.id ?? METERS[1].id);

  /** Boşluk kimliği → durum; "alindi" olanlar artık veri sayılır. */
  const [gapState, setGapState] = useState<Readonly<Record<string, Status>>>({});
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const [quality, setQuality] = useState<"hepsi" | Quality>("hepsi");
  const [packetQuery, setPacketQuery] = useState("");
  const [page, setPage] = useState(1);

  const saved = savedQueries.use();
  const setSaved = savedQueries.set;
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  const [exportOpen, setExportOpen] = useState(false);
  const [format, setFormat] = useState<"csv" | "json" | "xlsx">("csv");
  const [scope, setScope] = useState<"aralik" | "eksik">("aralik");
  const [fields, setFields] = useState<readonly ExportField[]>(["ts", "index", "kwh", "kw", "quality"]);

  const measure = measureOf(measureId);
  const days = useMemo(() => rangeDays(range), [range]);
  const recovered = useMemo(() => new Set(Object.entries(gapState).filter(([, s]) => s === "alindi").map(([id]) => id)), [gapState]);

  const rows = useMemo(() => rawRows(meter.id, days, recovered), [meter.id, days, recovered]);
  const gaps = useMemo(() => gapsOf(meter.id, days), [meter.id, days]);
  const stats = useMemo(() => qualityOf(rows), [rows]);

  const multiDay = days.length > 1;
  const buckets = useMemo(() => bucketize(rows, res, measure, multiDay), [rows, res, measure, multiDay]);

  const compareRows = useMemo(() => {
    if (compare === "onceki") return rawRows(meter.id, previousDays(days), new Set());
    if (compare === "sayac") return rawRows(otherId, days, new Set());
    return null;
  }, [compare, meter.id, otherId, days]);
  const compareBuckets = useMemo(() => (compareRows ? bucketize(compareRows, res, measure, multiDay).slice(0, buckets.length) : null), [compareRows, res, measure, multiDay, buckets.length]);

  const labels = buckets.map((b) => b.label);
  const values = buckets.map((b) => b.value);
  const compareLabel = compare === "onceki" ? "Önceki dönem" : `${meterById(otherId)?.serial ?? "Diğer sayaç"}`;
  const series = [
    { label: meter.serial, values, series: 1 as const },
    ...(compareBuckets && compareBuckets.length === buckets.length ? [{ label: compareLabel, values: compareBuckets.map((b) => b.value), series: 3 as const }] : []),
  ];
  const bands = emptyRuns(buckets, 2).map((r) => ({ from: r.from, to: r.to, label: "Veri Yok", tone: "danger" as const }));

  const total = rows.reduce((s, r) => s + r.kwh, 0);
  const peak = rows.reduce((m, r) => (r.kw > m.kw ? r : m), rows[0] ?? ({ kw: 0, time: "--:--", day: days[0] } as RawRow));
  const live = rows.filter((r) => r.quality !== "eksik");
  const avgPf = live.length ? live.reduce((s, r) => s + r.pf, 0) / live.length : 0;
  const inductive = rows.reduce((s, r) => s + r.kvarhInd, 0);
  const ratio = total ? (inductive / total) * 100 : 0;
  const zoneTotals = (["T1", "T2", "T3"] as const).map((z) => ({ zone: z, kwh: rows.filter((r) => r.zone === z).reduce((s, r) => s + r.kwh, 0) }));

  const summarize = (list: readonly number[]) => (measure.kind === "sum" ? Math.round(list.reduce((s, v) => s + v, 0) * 10) / 10 : measure.kind === "max" ? Math.max(...list, 0) : list.length ? Math.round((list.reduce((s, v) => s + v, 0) / list.length) * 1000) / 1000 : 0);
  const headline = measure.kind === "sum" ? `${fmt(buckets.reduce((s, b) => s + b.value, 0), 1)} ${measure.unit}` : measure.kind === "max" ? `${fmt(Math.max(...values, 0))} ${measure.unit}` : `${fmt(values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0, measure.digits)}${measure.unit ? ` ${measure.unit}` : ""}`;
  const headlineNote = measure.kind === "sum" ? "aralık toplamı" : measure.kind === "max" ? "aralıktaki en yüksek" : "aralık ortalaması";

  /* Ham kayıt tablosu: yeniden eskiye, süzgeçli, sayfalı. */
  const filtered = useMemo(() => {
    const q = packetQuery.trim().toLowerCase();
    return rows
      .filter((r) => (quality === "hepsi" || r.quality === quality) && (!q || r.packet.toLowerCase().includes(q) || r.ts.includes(q)))
      .reverse();
  }, [rows, quality, packetQuery]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const heat = useMemo(() => weekdayHourGrid(meter.id), [meter.id]);
  const telegram = useMemo(() => buildTelegram(meter, rows), [meter, rows]);
  const api = useMemo(() => apiExamples(meter, days, res), [meter, days, res]);

  /* Değişiklikler */
  const pickMeter = (id: string | undefined) => {
    if (!id) return;
    setPage(1);
    setGapState({});
    go("rawdata", { id });
  };
  const pickRange = (next: RangeId) => {
    const nextDays = rangeDays(next);
    setRange(next);
    setPage(1);
    if (!resolutionAllowed(res, nextDays.length)) setRes(bestResolution(nextDays.length));
  };
  const request = (ids: readonly string[]) => {
    const fresh = ids.filter((id) => (gapState[id] ?? "bekliyor") === "bekliyor");
    if (!fresh.length) return;
    setGapState((s) => ({ ...s, ...Object.fromEntries(fresh.map((id) => [id, "istendi" as Status])) }));
    notify({ title: `${fresh.length} aralık için yeniden istek gönderildi`, body: `${meter.serial} sayacından kayıp paketler isteniyor`, tone: "info" });
    timers.current.push(
      window.setTimeout(() => {
        setGapState((s) => ({ ...s, ...Object.fromEntries(fresh.map((id) => [id, "alindi" as Status])) }));
        notify({ title: "Kayıp Paketler Alındı", body: `${fresh.length} aralık tamamlandı, tamlık güncellendi`, tone: "success" });
      }, 1400),
    );
  };
  const loadQuery = (q: SavedQuery) => {
    setRange(q.range);
    setRes(q.res);
    setMeasureId(q.measure);
    setCompare(q.compare);
    setPage(1);
    setGapState({});
    go("rawdata", { id: q.meterId });
    notify({ title: `"${q.name}" yüklendi`, tone: "info" });
  };
  const saveQuery = () => {
    const name = saveName.trim() || `Sorgu ${saved.length + 1}`;
    setSaved((list) => [...list, { id: nextId("q-", 10), name, meterId: meter.id, range, res, measure: measureId, compare }]);
    setSaveOpen(false);
    setSaveName("");
    notify({ title: "Sorgu Kaydedildi", body: name, tone: "success" });
  };

  const runExport = () => {
    const source = scope === "eksik" ? rows.filter((r) => r.wasMissing) : rows;
    const list = fields.length ? fields : (["ts", "kwh"] as const);
    if (!source.length) {
      notify({ title: "Dışa Aktarılacak Satır Yok", body: "Bu kapsamda kayıt bulunamadı", tone: "info" });
      return;
    }
    const base = `${meter.serial}_${days[0]}_${days[days.length - 1]}`;
    if (format === "csv") {
      const text = toCsv(source, list);
      download(`${base}.csv`, text, "text/csv;charset=utf-8");
      notify({ title: "CSV İndirildi", body: `${num.format(source.length)} satır, yaklaşık ${sizeKb(text)} KB`, tone: "success" });
    } else if (format === "json") {
      const text = toJson(source, list);
      download(`${base}.json`, text, "application/json");
      notify({ title: "JSON İndirildi", body: `${num.format(source.length)} kayıt, yaklaşık ${sizeKb(text)} KB`, tone: "success" });
    } else {
      notify({ title: "Excel Dosyası Hazırlandı (Örnek)", body: `${num.format(source.length)} satır; örnek ortamda dosya üretilmez`, tone: "info" });
    }
    setExportOpen(false);
  };

  const toggleField = (id: ExportField, on: boolean) => setFields((list) => (on ? [...list, id] : list.filter((x) => x !== id)));

  /* Tablo kolonları ve telefon listesi */
  const columns: readonly Column<RawRow>[] = [
    { key: "ts", header: "Zaman Damgası (UTC+3)", render: (r) => <span className="kz-mono font-mono text-small">{r.ts.replace(" +03:00", "")}</span> },
    { key: "zone", header: "Tarife", render: (r) => <Badge tone={ZONE_TONE[r.zone]}>{ZONE_LABEL[r.zone]}</Badge> },
    { key: "index", header: "Endeks (kWh)", numeric: true, render: (r) => <span className="kz-mono">{fmt(r.index, 3)}</span> },
    { key: "kwh", header: "Tüketim (kWh)", numeric: true, render: (r) => <span className="kz-mono">{r.quality === "eksik" ? "—" : fmt(r.kwh, 3)}</span> },
    { key: "kw", header: "Talep (kW)", numeric: true, render: (r) => <span className="kz-mono">{r.quality === "eksik" ? "—" : fmt(r.kw)}</span> },
    { key: "pf", header: "cos φ", numeric: true, render: (r) => <span className="kz-mono">{r.quality === "eksik" ? "—" : fmt(r.pf)}</span> },
    { key: "quality", header: "Kalite", render: (r) => <QualityBadge quality={r.quality} /> },
    { key: "packet", header: "Paket No", render: (r) => <span className="kz-mono font-mono text-small text-muted">{r.packet}</span> },
  ];
  const items: RecordItem[] = slice.map((r) => ({
    id: r.key,
    title: <span className="kz-mono font-mono text-small">{r.ts.replace(" +03:00", "")}</span>,
    subtitle: `${ZONE_LABEL[r.zone]} · ${r.packet}`,
    value: r.quality === "eksik" ? "—" : `${fmt(r.kwh, 3)} kWh`,
    meta: `Endeks ${fmt(r.index, 1)}`,
    status: <QualityBadge quality={r.quality} />,
  }));

  const pending = gaps.filter((g) => (gapState[g.id] ?? "bekliyor") === "bekliyor");

  const multiLine = measure.chart === "line";
  const chartTitle = `${measure.label}, ${meter.serial}`;
  // Eksen ve ipucu aynı biçimi paylaşır: en az 2 hane, yoksa 0,75 → "0,8" yuvarlanır.
  const valueFormat: Intl.NumberFormatOptions = { minimumFractionDigits: 0, maximumFractionDigits: Math.min(3, Math.max(measure.digits, 2)) };

  return (
    <>
      <PageHead
        title="Ham Veri"
        description="15 dakikalık yük profili ve haberleşme paketleri: sayaca göre keşfet, karşılaştır, dışa aktar."
        crumb={meter.serial}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setSaveOpen(true)}>
              <Save /> Sorguyu Kaydet
            </Button>
            <Button variant="primary" size="sm" onClick={() => setExportOpen(true)}>
              <Download /> Dışa Aktar
            </Button>
          </>
        }
      />
      <PageBody>
        {/* Sayaç künyesi */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-surface px-4 py-3 text-small ring-1 ring-line sm:px-5">
          <a href={href("customers", { id: owner.id })} className="inline-flex items-center gap-1.5 font-semibold text-strong underline-offset-2 hover:underline">
            {owner.name} <ArrowRight className="size-3.5" aria-hidden />
          </a>
          <span className="text-muted">Tesisat {owner.installation}</span>
          <span className="text-muted">
            {meter.model} · {COMM_LABEL[meter.comm]}
          </span>
          <span className="text-muted">Çarpan ×{meter.multiplier}</span>
          <span className="text-muted">{meter.multiZone ? "Çok zamanlı (T1/T2/T3)" : "Tek zamanlı"}</span>
          <MeterBadge status={meter.status} />
          <span className="ml-auto flex gap-3">
            <a href={href("meters", { id: meter.id })} className="font-medium text-primary-ink underline-offset-2 hover:underline">
              Sayaç Ayrıntısı
            </a>
            <a href={href("readings", { meter: meter.id })} className="font-medium text-primary-ink underline-offset-2 hover:underline">
              Okumalar
            </a>
          </span>
        </div>

        {/* Sorgu çubuğu */}
        <section aria-label="Sorgu" className="rounded-xl bg-overlay p-4 shadow-raised ring-1 ring-line sm:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Combobox label="Sayaç" items={meterItems} value={itemOf(meter.id)} onValueChange={(v) => pickMeter(v?.value)} placeholder="Seri no ya da abone adı" className="xl:col-span-2" />
            <Select label="Dönem" items={RANGES.map((r) => ({ value: r.value, label: r.label }))} value={range} onValueChange={(v) => v && pickRange(v as RangeId)} />
            <Select label="Ölçü" items={MEASURES.map((m) => ({ value: m.id, label: m.label }))} value={measureId} onValueChange={(v) => v && setMeasureId(v as MeasureId)} />
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-4">
            <div className="grid gap-1.5">
              <span className="text-small font-semibold text-strong" id="ham-res">
                Çözünürlük
              </span>
              <SegmentedControl<Resolution>
                aria-label="Çözünürlük"
                value={res}
                onValueChange={setRes}
                options={RESOLUTIONS.map((r) => ({ value: r.value, label: r.label, disabled: !resolutionAllowed(r.value, days.length) }))}
              />
            </div>
            <div className="grid gap-1.5">
              <span className="text-small font-semibold text-strong">Karşılaştır</span>
              <SegmentedControl<CompareMode>
                aria-label="Karşılaştırma"
                value={compare}
                onValueChange={setCompare}
                options={[
                  { value: "yok", label: "Yok" },
                  { value: "onceki", label: "Önceki Dönem" },
                  { value: "sayac", label: "Başka Sayaç" },
                ]}
              />
            </div>
            {compare === "sayac" ? (
              <Combobox label="Karşılaştırılan Sayaç" items={meterItems} value={itemOf(otherId)} onValueChange={(v) => v && setOtherId(v.value)} className="min-w-[min(100%,18rem)] flex-1" />
            ) : null}
          </div>
        </section>

        {/* Kalite özeti */}
        <MetricStrip>
          <Cell icon={<Radio />} label="Veri Tamlığı" value={`%${fmt(stats.completeness, 1)}`} foot={`${num.format(stats.total - stats.missing)} / ${num.format(stats.total)} aralık geldi`} tone={stats.completeness >= 98 ? "success" : stats.completeness >= 92 ? "warning" : "danger"} />
          <Cell icon={<TriangleAlert />} label="Kayıp Aralık" value={num.format(stats.gaps)} unit="boşluk" foot={`${num.format(stats.missing)} paket eksik (${num.format(stats.missing * 15)} dk)`} tone={stats.gaps ? "warning" : "success"} />
          <Cell icon={<Gauge />} label="Toplam Tüketim" value={fmt(total, 1)} unit="kWh" foot={meter.multiplier > 1 ? `Çarpan dahil ${num.format(Math.round(total * meter.multiplier))} kWh` : "Çarpan 1: ham değer"} />
          <Cell icon={<Gauge />} label="Tepe Talep" value={fmt(peak.kw)} unit="kW" foot={`${dayLabel(peak.day)}, ${peak.time}`} />
          <Cell icon={<Gauge />} label="Ortalama cos φ" value={fmt(avgPf)} foot={`Endüktif oran %${num1.format(ratio)} (sınır %20)`} tone={ratio > 20 ? "warning" : "neutral"} />
          <Cell icon={<Radio />} label="Kalite Bayrağı" value={`${num.format(stats.unverified)} / ${num.format(stats.estimated)}`} unit="satır" foot="Doğrulanmamış / tahmin edilen kayıtlar" />
        </MetricStrip>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <ChartCard
            id="ham-grafik"
            className="min-w-0 rounded-xl bg-overlay p-1.5 shadow-raised ring-1 ring-line xl:col-span-3"
            label={measure.label}
            value={headline}
            change={null}
            action={<Badge tone="neutral">{`${RESOLUTIONS.find((r) => r.value === res)?.label} · ${days.length === 1 ? dayLabel(days[0]) : `${dayLabel(days[0])} – ${dayLabel(days[days.length - 1])}`}`}</Badge>}
            footer={
              <div className="grid gap-2 px-3 pb-3">
                <ChartLegend
                  items={series.map((s, i) => ({ label: s.label, value: summarize(s.values), series: s.series ?? ((i + 1) as 1 | 3), unit: measure.unit }))}
                />
                <p className="px-1 text-small text-muted">
                  {headlineNote[0].toUpperCase() + headlineNote.slice(1)}.{" "}
                  {stats.gaps
                    ? `${stats.gaps} kayıp aralık, ${num.format(stats.missing)} paket eksik${bands.length ? "; kırmızı bantlar tamamen veri gelmeyen saatler" : ""}. Ayrıntı: Kayıp Paketler.`
                    : "Bu aralıkta veri kesintisi yok."}
                </p>
              </div>
            }
          >
            {buckets.length === 0 ? (
              <EmptyState variant="inline" title="Bu Aralıkta Kayıt Yok" hint="Dönemi ya da sayacı değiştir." />
            ) : multiLine ? (
              <LineChart
                title={chartTitle}
                labels={labels}
                series={series.length > 1 ? series : [...series, { label: "Referans", values: values.map(() => (measure.id === "pf" ? 0.98 : 0)), series: 3 as const, dashed: true }]}
                valueFormat={valueFormat}
                unit={measure.unit}
                target={measure.id === "pf" ? { value: 0.98, label: "Reaktif Sınır ≈ 0,98" } : undefined}
                showToggles={false}
              />
            ) : (
              <AreaChart title={chartTitle} labels={labels} series={series} valueFormat={valueFormat} unit={measure.unit} bands={bands} height="h-64" />
            )}
          </ChartCard>

          <div className="grid min-w-0 content-start gap-5 xl:col-span-2">
            <Panel
              id="ham-kayip"
              title="Kayıp Paketler"
              note={gaps.length ? `${gaps.length} boşluk · ${pending.length} bekliyor` : "Bu aralıkta kayıp paket yok"}
              actions={
                pending.length ? (
                  <Button variant="secondary" size="sm" onClick={() => request(pending.map((g) => g.id))}>
                    <RefreshCw /> Tümünü Yeniden İste
                  </Button>
                ) : null
              }
            >
              {gaps.length === 0 ? (
                <div className="px-4 py-6">
                  <EmptyState variant="inline" title="Boşluk Yok" hint="Bütün 15 dakikalık paketler geldi." />
                </div>
              ) : (
                <>
                {pending.length ? (
                  <div className="px-4 pt-4 sm:px-5">
                    <InsightCallout
                      kind="warning"
                      title="Eksik Paketleri Toplu İste"
                      headingLevel={3}
                      actions={<Button variant="secondary" size="sm" onClick={() => request(pending.map((g) => g.id))}>Tümünü İste</Button>}
                    >
                      {pending.length} aralıkta {num.format(pending.reduce((s, g) => s + g.packets, 0))} paket eksik. Tek seferde istemek, fatura dönemi kapanmadan faturalanabilir tüketimi korur.
                    </InsightCallout>
                  </div>
                ) : null}
                <ul role="list" aria-label="Kayıp Paket Aralıkları" className="max-h-72 divide-y divide-line-soft overflow-y-auto">
                  {gaps.map((g) => {
                    const state = gapState[g.id] ?? "bekliyor";
                    return (
                      <li key={g.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5">
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-medium text-strong">
                            {dayLabel(g.day)} · <span className="kz-mono">{g.from}–{g.to}</span>
                          </p>
                          <p className="text-small text-muted">
                            {g.packets} paket · {g.minutes} dk
                          </p>
                        </div>
                        {state === "alindi" ? (
                          <Badge tone="success" dot>
                            Alındı
                          </Badge>
                        ) : state === "istendi" ? (
                          <Badge tone="primary" dot>
                            İstek Gönderildi
                          </Badge>
                        ) : (
                          <Button variant="secondary" size="sm" onClick={() => request([g.id])} aria-label={`Yeniden İste: ${dayLabel(g.day)} ${g.from}–${g.to} aralığı`}>
                            Yeniden İste
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                </>
              )}
            </Panel>

            <Panel id="ham-sorgu" title="Kayıtlı Sorgular" note={`${saved.length} sorgu`}>
              <ul role="list" aria-label="Kayıtlı Sorgular" className="divide-y divide-line-soft">
                {saved.map((q) => (
                  <li key={q.id} className="flex items-center gap-2 px-4 py-3 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-medium text-strong">{q.name}</p>
                      <p className="truncate text-small text-muted">
                        {meterById(q.meterId)?.serial} · {RANGES.find((r) => r.value === q.range)?.label} · {measureOf(q.measure).label}
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => loadQuery(q)}>
                      Yükle
                    </Button>
                    <IconButton
                      aria-label={`${q.name} sorgusunu sil`}
                      icon={Trash2}
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setSaved((list) => list.filter((x) => x.id !== q.id));
                        notify({ title: "Sorgu Silindi", body: q.name, tone: "info", undo: () => setSaved((list) => (list.some((x) => x.id === q.id) ? list : [...list, q])) });
                      }}
                    />
                  </li>
                ))}
                {saved.length === 0 ? (
                  <li className="px-4 py-6">
                    <EmptyState variant="inline" title="Kayıtlı Sorgu Yok" hint="Mevcut filtreleri 'Sorguyu Kaydet' ile sakla." />
                  </li>
                ) : null}
              </ul>
            </Panel>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <Panel id="ham-isi" title="Haftalık Yük Deseni" note="Son 28 günün ortalama talebi (kW): saat × gün" className="xl:col-span-3">
            <div className="p-4 sm:p-5">
              <div className="relative overflow-x-auto" tabIndex={0} role="region" aria-label="Haftalık Yük Deseni Tablosu">
                <table className="w-full min-w-[34rem] table-fixed border-separate border-spacing-0.5 text-micro">
                  <caption className="sr-only">Gün ve saate göre ortalama talep, kilovat</caption>
                  <colgroup>
                    <col className="w-9" />
                  </colgroup>
                  <thead>
                    <tr>
                      <td />
                      {Array.from({ length: 24 }, (_, h) => (
                        <th key={h} scope="col" className="font-normal text-muted">
                          {h % 3 === 0 ? String(h).padStart(2, "0") : <span className="sr-only">{String(h).padStart(2, "0")}</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heat.grid.map((row, d) => (
                      <tr key={WEEKDAYS[d]}>
                        <th scope="row" className="pr-2 text-start font-normal text-muted">
                          {WEEKDAYS[d]}
                        </th>
                        {row.map((v, h) => (
                          <td key={h} className="p-0">
                            <span
                              title={`${WEEKDAYS[d]} ${String(h).padStart(2, "0")}:00, ${fmt(v)} kW`}
                              className={`block h-5 rounded-[3px] ${HEAT[heatLevel(v, heat.min, heat.max)]}`}
                            >
                              <span className="sr-only">{fmt(v)} kW</span>
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-muted" aria-label="Isı Haritası Ölçeği">
                <span>{fmt(heat.min)} kW</span>
                <span aria-hidden className="flex items-center gap-1">
                  {HEAT.map((c) => (
                    <span key={c} className={`h-3.5 w-7 rounded-[3px] ${c}`} />
                  ))}
                </span>
                <span>{fmt(heat.max)} kW</span>
                <span className="text-micro">· ortalama saatlik talep, gün × saat</span>
              </div>
            </div>
          </Panel>

          <Panel id="ham-dilim" title="Tarife Dilimine Göre" note="Seçili aralıkta aktif tüketim payı" className="xl:col-span-2">
            <div className="p-4 sm:p-5">
              <BarList
                title="Tarife Dilimine Göre Aktif Tüketim"
                columns={["Dilim", "kWh"]}
                items={zoneTotals.map((z) => ({ label: ZONE_LABEL[z.zone], value: Math.round(z.kwh * 10) / 10 }))}
                sort={false}
                valueFormat={f(1)}
                series={1}
              />
              <p className="mt-4 text-small text-muted">{meter.multiZone ? "Çok zamanlı abonede dilimler faturaya ayrı yansır." : "Tek zamanlı abonede dilim yalnız bilgi amaçlı; fatura toplam tüketimden kesilir."}</p>
            </div>
          </Panel>
        </div>

        {/* Ham kayıtlar */}
        <section aria-labelledby="ham-kayit" className="rounded-xl bg-overlay shadow-raised ring-1 ring-line">
          <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b border-line-soft px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <h2 id="ham-kayit" className="text-read font-semibold text-strong">
                Ham Kayıtlar
              </h2>
              <p className="text-small text-muted">{num.format(filtered.length)} satır · zaman damgaları UTC+3 · yeniden eskiye</p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <Select
                label="Kalite"
                hideLabel
                value={quality}
                onValueChange={(v) => {
                  setQuality((v as "hepsi" | Quality) ?? "hepsi");
                  setPage(1);
                }}
                items={[{ value: "hepsi", label: "Bütün Kalite Bayrakları" }, ...(Object.keys(QUALITY_LABEL) as Quality[]).map((q) => ({ value: q, label: QUALITY_LABEL[q] }))]}
              />
              <Input
                label="Paket No ya da Zaman Ara"
                hideLabel
                placeholder="Paket no ya da zaman ara"
                value={packetQuery}
                onChange={(e) => {
                  setPacketQuery(e.target.value);
                  setPage(1);
                }}
                className="min-w-48"
              />
            </div>
          </header>
          <div className="max-md:hidden">
            <DataTable<RawRow> caption="Ham kayıtlar" columns={columns} rows={slice} rowKey={(r) => r.key} density="compact" on="surface" stickyFirst={false} minWidth="56rem" empty="Bu süzgeçle eşleşen kayıt yok." />
          </div>
          <div className="px-3 py-3 md:hidden">{items.length ? <RecordList label="Ham Kayıtlar" items={items} /> : <EmptyState variant="inline" title="Eşleşen Kayıt Yok" hint="Süzgeci değiştir." />}</div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-4 py-3 sm:px-5">
            <p className="text-small text-muted" aria-live="polite">
              Sayfa {current} / {pageCount}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
                Önceki
              </Button>
              <Button variant="secondary" size="sm" disabled={current >= pageCount} onClick={() => setPage(current + 1)}>
                Sonraki
              </Button>
            </div>
          </footer>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Panel id="ham-telegram" title="Ham Telegram" note="IEC 62056-21 · aralığın son kaydından türetilen kurgusal örnek">
            <div className="p-4 sm:p-5">
              <CodeBlock
                persist="kz-telegram"
                aria-label="Ham Telegram"
                tabs={[
                  { label: "OBIS", code: telegram.obis },
                  { label: "HEX", code: telegram.hex },
                  { label: "JSON", code: telegram.json },
                ]}
              />
            </div>
          </Panel>
          <Panel id="ham-api" title="Programatik Erişim" note="Aynı sorguyu API ile al (kurgusal adres ve anahtar)">
            <div className="p-4 sm:p-5">
              <CodeBlock
                persist="kz-api"
                aria-label="API Örneği"
                tabs={[
                  { label: "cURL", code: api.curl },
                  { label: "JavaScript", code: api.js },
                  { label: "Yanıt", code: api.response },
                ]}
              />
            </div>
          </Panel>
        </div>

        <SampleNote />
      </PageBody>

      <Dialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        title="Sorguyu Kaydet"
        description="Sayaç, dönem, ölçü, çözünürlük ve karşılaştırma birlikte saklanır."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              Vazgeç
            </Button>
            <Button variant="primary" onClick={saveQuery}>
              Kaydet
            </Button>
          </>
        }
      >
        <Input label="Sorgu Adı" value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder={`${meter.serial} · ${measure.label}`} data-autofocus />
        <p className="mt-3 text-small text-muted">
          {meter.serial} · {RANGES.find((r) => r.value === range)?.label} · {measure.label}
        </p>
      </Dialog>

      <Dialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Dışa Aktar"
        description={`${meter.serial}, ${days.length === 1 ? dayLabel(days[0]) : `${dayLabel(days[0])} – ${dayLabel(days[days.length - 1])}`}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setExportOpen(false)}>
              Vazgeç
            </Button>
            <Button variant="primary" onClick={runExport}>
              <Download /> Dışa Aktar
            </Button>
          </>
        }
      >
        <div className="grid gap-5">
          <div className="grid gap-1.5">
            <span className="text-small font-semibold text-strong">Biçim</span>
            <ToggleGroup<"csv" | "json" | "xlsx">
              aria-label="Dosya Biçimi"
              value={[format]}
              onValueChange={(v) => v[0] && setFormat(v[0])}
              items={[
                { value: "csv", label: "CSV" },
                { value: "json", label: "JSON" },
                { value: "xlsx", label: "Excel" },
              ]}
            />
            {format === "xlsx" ? <p className="text-small text-muted">Örnek ortamda Excel dosyası üretilmez; CSV ve JSON gerçekten iner.</p> : null}
          </div>
          <Select
            label="Kapsam"
            value={scope}
            onValueChange={(v) => v && setScope(v as "aralik" | "eksik")}
            items={[
              { value: "aralik", label: `Seçili aralığın tamamı (${num.format(rows.length)} satır)` },
              { value: "eksik", label: `Yalnız eksik paketler (${num.format(rows.filter((r) => r.wasMissing).length)} satır)` },
            ]}
          />
          <fieldset className="grid gap-1">
            <legend className="mb-1 text-small font-semibold text-strong">Alanlar</legend>
            <div className="grid gap-x-4 sm:grid-cols-2">
              {EXPORT_FIELDS.map((field) => (
                <Checkbox key={field.id} label={field.label} checked={fields.includes(field.id)} onChange={(e) => toggleField(field.id, e.target.checked)} />
              ))}
            </div>
          </fieldset>
        </div>
      </Dialog>
    </>
  );
}
