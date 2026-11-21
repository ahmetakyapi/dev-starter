"use client";

import { Children, useEffect, useMemo, useState, type ReactNode } from "react";
import { BarChart3, Building2, CalendarClock, CheckCircle2, CircleAlert, Download, FileText, Gauge, Pause, Play, Plus, Send, Trash2, TriangleAlert, Users, Wallet, Zap } from "lucide-react";
import { AreaChart } from "@/components/ui/area-chart";
import { Badge } from "@/components/ui/badge";
import { BarList } from "@/components/ui/bar-list";
import { Button } from "@/components/ui/Button";
import { CategoryCard, CategoryGrid, type CategoryTone } from "@/components/ui/category-card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { ScheduleList, type ScheduleItem } from "@/components/ui/schedule-list";
import { Select } from "@/components/ui/select";
import { Stat, StatGrid } from "@/components/ui/stat";
import { Tabs } from "@/components/ui/tabs";
import { KIND_LABEL, KINDS, REGIONS, TODAY, daysBetween, num, parseDay, periodStats, type Period } from "./_data";
import {
  CADENCE_LABEL,
  CATEGORIES,
  DIMS,
  FILING_LABEL,
  MEASURES_R,
  NO_FILTER,
  PERIOD_OPTIONS,
  PRESETS,
  SEED_FILINGS,
  SEED_REPORTS,
  aggregate,
  formatValue,
  measureAllowed,
  measureR,
  nextRun,
  periodsFor,
  presetOf,
  reliability,
  type Cadence,
  type CategoryId,
  type DimId,
  type Filing,
  type FilingStatus,
  type Filters,
  type MeasureKey,
  type PeriodKey,
  type SavedReport,
} from "./_data-rapor";
import { IconTile, PageBody, PageHead, Panel, SampleNote, href, useApp, type PageProps } from "./_ui";

type TabId = "hazir" | "olustur" | "kayitli" | "epdk";
const TAB_IDS: readonly TabId[] = ["hazir", "olustur", "kayitli", "epdk"];

const CATEGORY_ICON: Record<CategoryId, ReactNode> = {
  tuketim: <Zap />,
  tahsilat: <Wallet />,
  kayip: <TriangleAlert />,
  okuma: <Gauge />,
  kesinti: <CircleAlert />,
  musteri: <Users />,
  tedarikci: <Building2 />,
};
const CATEGORY_TONE: Record<CategoryId, CategoryTone> = { tuketim: "primary", tahsilat: "success", kayip: "danger", okuma: "chart-2", kesinti: "warning", musteri: "chart-3", tedarikci: "neutral" };

const trNum = (v: number) => v.toLocaleString("tr-TR");
const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
/** `2026-11-01 06:00` → `1 Kas, 06:00`. */
const stamp = (value: string | null) => (value ? `${Number(value.slice(8, 10))} ${MONTHS[Number(value.slice(5, 7)) - 1]}, ${value.slice(11)}` : "—");
const FILING_TONE: Record<FilingStatus, "neutral" | "success" | "danger" | "primary"> = { hazirlaniyor: "neutral", hazir: "primary", gonderildi: "success", gecikti: "danger" };
const FORMAT_LABEL = { pdf: "PDF", xlsx: "Excel", csv: "CSV" } as const;

/** Dört hücreli ölçü şeridi: `MetricStrip` altı hücreye göre kurulu, burada dört. */
function Strip({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-xl bg-overlay shadow-raised ring-1 ring-line md:grid-cols-4">
      {Children.map(children, (child) => (
        <div className="min-w-0 border-line-soft [&:nth-child(even)]:border-l [&:nth-child(n+3)]:border-t md:[&:nth-child(n+3)]:border-t-0 md:[&:not(:first-child)]:border-l">{child}</div>
      ))}
    </div>
  );
}

function Cell({ icon, label, value, foot, tone = "neutral" }: { icon: ReactNode; label: string; value: string; foot: string; tone?: "neutral" | "danger" | "warning" | "success" }) {
  return (
    <div className="relative flex h-full flex-col gap-3 p-4 sm:p-5">
      <IconTile tone={tone} className="absolute top-4 right-4 sm:top-5 sm:right-5">
        {icon}
      </IconTile>
      <div className="pr-10">
        <StatGrid className="grid-cols-1 sm:grid-cols-1">
          <Stat label={label} value={value} />
        </StatGrid>
      </div>
      <p className="mt-auto border-t border-dashed border-line pt-3 text-small text-muted">{foot}</p>
    </div>
  );
}

/** İndirmeyi tarayıcıda gerçekten başlatır (yalnız CSV). */
function download(name: string, text: string) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    // Ortam indirmeye izin vermiyorsa bildirim yine çıkar.
  }
}

export function RaporlarPage({ params, go }: PageProps) {
  const { notify } = useApp();
  const tab: TabId = TAB_IDS.includes(params.tab as TabId) ? (params.tab as TabId) : "hazir";
  const setTab = (next: string) => go("reports", { tab: next });

  /* Oluşturucu durumu: hazır rapordan ya da kayıtlı rapordan derin bağlantıyla gelir. */
  const fromParams = () => {
    const p = presetOf(params.preset);
    return {
      dim: (params.dim as DimId) || p?.dim || "region",
      measure: (params.measure as MeasureKey) || p?.measure || "kwh",
      period: (params.period as PeriodKey) || p?.period || "1",
    };
  };
  const start = fromParams();
  const [dim, setDim] = useState<DimId>(start.dim);
  const [measure, setMeasure] = useState<MeasureKey>(start.measure);
  const [period, setPeriod] = useState<PeriodKey>(start.period);
  const [filters, setFilters] = useState<Filters>(NO_FILTER);
  useEffect(() => {
    if (!params.preset && !params.dim) return;
    const next = fromParams();
    setDim(next.dim);
    setMeasure(next.measure);
    setPeriod(next.period);
    setFilters(NO_FILTER);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.preset, params.dim, params.measure, params.period]);

  const [category, setCategory] = useState<CategoryId>("tuketim");
  const [saved, setSaved] = useState<readonly SavedReport[]>(SEED_REPORTS);
  const [filings, setFilings] = useState<readonly Filing[]>(SEED_FILINGS);

  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [cadence, setCadence] = useState<Cadence>("aylik");
  const [format, setFormat] = useState<"pdf" | "xlsx" | "csv">("pdf");
  const [recipients, setRecipients] = useState("yonetim@kuzeyova-dagitim.example");

  const [sending, setSending] = useState<Filing | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const m = measureR(measure);
  const periods = useMemo(() => periodsFor(period), [period]);
  const result = useMemo(() => aggregate(dim, measure, periods, filters), [dim, measure, periods, filters]);
  const dimLabel = DIMS.find((d) => d.value === dim)!.label;
  const periodText = PERIOD_OPTIONS.find((p) => p.value === period)!.label;
  const filtered = filters.region !== "hepsi" || filters.kind !== "hepsi" || filters.voltage !== "hepsi";

  /* Pano ile tutarlılık: aynı kaynak, aynı toplam. */
  const dashboardTotal = measure === "kwh" && !filtered && (period === "1" || period === "3" || period === "6") ? periodStats(period as Period).usage : null;
  const matchesDashboard = dashboardTotal !== null && dim !== "month" ? Math.round(result.total) === Math.round(dashboardTotal) : dashboardTotal !== null && Math.round(result.total) === Math.round(dashboardTotal);

  const pickDim = (next: DimId) => {
    setDim(next);
    if (!measureAllowed(measure, next)) setMeasure("kwh");
  };
  const pickMeasure = (next: MeasureKey) => {
    setMeasure(next);
    if (!measureAllowed(next, dim)) setDim("region");
  };
  const reset = () => {
    setFilters(NO_FILTER);
    setDim("region");
    setMeasure("kwh");
    setPeriod("1");
  };

  const openBuilder = (next: Record<string, string>) => go("reports", { tab: "olustur", ...next });

  const exportAs = (kind: "pdf" | "xlsx" | "csv") => {
    if (kind === "csv") {
      const head = `${dimLabel};${m.label}`;
      const body = result.rows.map((r) => `${r.label};${String(r.value).replace(".", ",")}`);
      download(`rapor_${dim}_${measure}.csv`, [head, ...body, `Toplam;${String(result.total).replace(".", ",")}`].join("\r\n"));
      notify({ title: "CSV indirildi", body: `${result.rows.length} satır`, tone: "success" });
    } else {
      notify({ title: `${FORMAT_LABEL[kind]} dosyası hazırlandı (örnek)`, body: "Örnek ortamda dosya üretilmez; CSV gerçekten iner", tone: "info" });
    }
  };

  const saveReport = () => {
    const name = saveName.trim() || `${m.label} · ${dimLabel}`;
    const report: SavedReport = {
      id: `sr-${saved.length + 100}`,
      name,
      owner: "Aylin Yıldırım",
      presetId: PRESETS.find((p) => p.dim === dim && p.measure === measure)?.id ?? "",
      dim,
      measure,
      period,
      cadence,
      format,
      recipients: cadence === "yok" ? "" : recipients,
      lastRun: null,
      status: "bekliyor",
      paused: false,
    };
    setSaved((list) => [report, ...list]);
    setSaveOpen(false);
    setSaveName("");
    notify({ title: cadence === "yok" ? "Rapor kaydedildi" : "Rapor zamanlandı", body: cadence === "yok" ? name : `${name} · ${CADENCE_LABEL[cadence]}`, tone: "success" });
    go("reports", { tab: "kayitli" });
  };

  const runNow = (id: string) => {
    setSaved((list) => list.map((r) => (r.id === id ? { ...r, lastRun: "2026-11-21 10:40", status: "basarili" } : r)));
    notify({ title: "Rapor çalıştırıldı", body: saved.find((r) => r.id === id)?.name, tone: "success" });
  };
  const removeReport = (r: SavedReport) => {
    setSaved((list) => list.filter((x) => x.id !== r.id));
    notify({ title: "Rapor silindi", body: r.name, tone: "info", undo: () => setSaved((list) => (list.some((x) => x.id === r.id) ? list : [r, ...list])) });
  };
  const togglePause = (id: string) => setSaved((list) => list.map((r) => (r.id === id ? { ...r, paused: !r.paused } : r)));

  const sendFiling = () => {
    if (!sending) return;
    const ref = `BLD-2026-${110490 + filings.filter((f) => f.status === "gonderildi").length}`;
    setFilings((list) => list.map((f) => (f.id === sending.id ? { ...f, status: "gonderildi", reference: ref } : f)));
    notify({ title: "Bildirim gönderildi", body: `${sending.title} · ${ref}`, tone: "success" });
    setSending(null);
  };

  const scheduled = saved.filter((r) => r.cadence !== "yok" && !r.paused);
  const upcoming: ScheduleItem[] = scheduled
    .map((r, i) => ({ r, next: nextRun(r.cadence)! , i }))
    .sort((a, b) => a.next.at.localeCompare(b.next.at))
    .map(({ r, next }, k) => ({ id: r.id, at: next.at, time: next.time, day: next.day, title: r.name, detail: `${CADENCE_LABEL[r.cadence]} · ${FORMAT_LABEL[r.format]}`, color: ((k % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6 }));
  const pendingFilings = filings.filter((f) => f.status !== "gonderildi");
  const late = filings.filter((f) => f.status === "gecikti").length;

  /* --- Hazır raporlar ------------------------------------------------------------------ */
  const rel30 = reliability(30);
  const rel90 = reliability(90);
  const presets = PRESETS.filter((p) => p.category === category);
  const cat = CATEGORIES.find((c) => c.id === category)!;

  const ready = (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <nav aria-label="Rapor kategorileri" className="rounded-xl bg-overlay p-2 shadow-raised ring-1 ring-line lg:self-start">
        <ul role="list" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {CATEGORIES.map((c) => {
            const count = PRESETS.filter((p) => p.category === c.id).length;
            const on = c.id === category;
            return (
              <li key={c.id} className="shrink-0">
                <button
                  type="button"
                  aria-current={on ? "true" : undefined}
                  onClick={() => setCategory(c.id)}
                  className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-start text-base transition-colors ${on ? "bg-primary-wash font-semibold text-primary-ink" : "text-body hover:bg-surface hover:text-strong"}`}
                >
                  <span aria-hidden className="[&_svg]:size-4">
                    {CATEGORY_ICON[c.id]}
                  </span>
                  <span className="flex-1 whitespace-nowrap">{c.label}</span>
                  <span className="text-small text-muted">{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="min-w-0 grid gap-4">
        <div>
          <h2 className="text-read font-semibold text-strong">{cat.label}</h2>
          <p className="text-small text-muted">{cat.hint}</p>
        </div>
        {category === "kesinti" ? (
          <Strip>
            <Cell icon={<Zap />} label="SAIFI · 30 Gün" value={trNum(rel30.saifi)} foot={`Abone başına kesinti sayısı · ${rel30.events} olay`} />
            <Cell icon={<Zap />} label="SAIDI · 30 Gün" value={`${trNum(rel30.saidi)} dk`} foot="Abone başına kesinti süresi" />
            <Cell icon={<Zap />} label="SAIFI · 90 Gün" value={trNum(rel90.saifi)} foot={`${rel90.events} plansız olay`} />
            <Cell icon={<Zap />} label="SAIDI · 90 Gün" value={`${trNum(rel90.saidi)} dk`} foot="Planlı kesintiler hariç" />
          </Strip>
        ) : null}
        <CategoryGrid className="lg:grid-cols-2 2xl:grid-cols-3">
          {presets.map((p) => (
            <CategoryCard
              key={p.id}
              href={p.category === "kesinti" ? href("reports", { tab: "epdk" }) : href("reports", { tab: "olustur", preset: p.id })}
              title={p.title}
              description={p.description}
              meta={`${p.cadence} · ${p.formats}`}
              icon={CATEGORY_ICON[p.category]}
              tone={CATEGORY_TONE[p.category]}
              headingLevel={3}
            />
          ))}
        </CategoryGrid>
      </div>
    </div>
  );

  /* --- Oluşturucu ------------------------------------------------------------------------ */
  const barFormat: Intl.NumberFormatOptions | undefined = m.unit === "TL" ? { style: "currency", currency: "TRY", maximumFractionDigits: 0 } : m.unit === "%" ? { minimumFractionDigits: 1, maximumFractionDigits: 1 } : { maximumFractionDigits: 0 };
  const columns: readonly Column<(typeof result.rows)[number]>[] = [
    { key: "label", header: dimLabel, render: (r) => <span className="font-medium text-strong">{r.label}</span> },
    { key: "value", header: m.label, numeric: true, render: (r) => <span className="edas-mono">{formatValue(measure, r.value)}</span>, bar: { value: (r) => r.value } },
    ...(m.kind === "sum" ? [{ key: "share", header: "Pay", numeric: true, render: (r: (typeof result.rows)[number]) => <span className="edas-mono text-muted">%{num.format(Math.round(r.share * 10) / 10)}</span> } satisfies Column<(typeof result.rows)[number]>] : []),
  ];
  const items: RecordItem[] = result.rows.map((r) => ({
    id: r.label,
    title: r.label,
    value: formatValue(measure, r.value),
    meta: m.kind === "sum" ? `Pay %${num.format(Math.round(r.share * 10) / 10)}` : undefined,
  }));

  const builder = (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
      <Panel id="olustur-ayar" title="Rapor Tanımı" note="Değişiklik önizlemeye anında yansır" className="xl:col-span-2 xl:self-start">
        <div className="grid gap-4 p-4 sm:p-5">
          <Select label="Boyut" items={DIMS.map((d) => ({ value: d.value, label: d.label }))} value={dim} onValueChange={(v) => v && pickDim(v as DimId)} />
          <Select label="Ölçü" items={MEASURES_R.map((x) => ({ value: x.value, label: x.label, disabled: !measureAllowed(x.value, dim) }))} value={measure} onValueChange={(v) => v && pickMeasure(v as MeasureKey)} />
          <Select label="Dönem" items={PERIOD_OPTIONS.map((p) => ({ value: p.value, label: p.label }))} value={period} onValueChange={(v) => v && setPeriod(v as PeriodKey)} />
          <fieldset className="grid gap-3 rounded-lg bg-surface p-3">
            <legend className="px-1 text-small font-semibold text-strong">Süzgeç</legend>
            <Select
              label="Bölge"
              items={[{ value: "hepsi", label: "Bütün Bölgeler" }, ...REGIONS.map((r) => ({ value: r.id, label: r.name }))]}
              value={filters.region}
              onValueChange={(v) => setFilters((f) => ({ ...f, region: v ?? "hepsi" }))}
            />
            <Select
              label="Abone tipi"
              disabled={measure === "loss"}
              items={[{ value: "hepsi", label: "Bütün Tipler" }, ...KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] }))]}
              value={filters.kind}
              onValueChange={(v) => setFilters((f) => ({ ...f, kind: v ?? "hepsi" }))}
            />
            <Select
              label="Gerilim seviyesi"
              disabled={measure === "loss"}
              items={[
                { value: "hepsi", label: "AG ve OG" },
                { value: "AG", label: "Alçak Gerilim (AG)" },
                { value: "OG", label: "Orta Gerilim (OG)" },
              ]}
              value={filters.voltage}
              onValueChange={(v) => setFilters((f) => ({ ...f, voltage: v ?? "hepsi" }))}
            />
            {measure === "loss" ? <p className="text-small text-muted">Kayıp oranı şebeke girişinden hesaplanır; yalnız bölge süzgeci geçerli.</p> : null}
          </fieldset>
          <Button variant="ghost" size="sm" onClick={reset} className="justify-self-start">
            Tanımı Sıfırla
          </Button>
        </div>
      </Panel>

      <Panel
        id="olustur-onizleme"
        title={`${m.label} · ${dimLabel}`}
        note={`${periodText}${filtered ? " · süzgeçli" : ""}`}
        className="xl:col-span-3"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => exportAs("pdf")}>
              <FileText /> PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={() => exportAs("xlsx")}>
              <Download /> Excel
            </Button>
            <Button variant="secondary" size="sm" onClick={() => exportAs("csv")}>
              <Download /> CSV
            </Button>
            <Button variant="primary" size="sm" onClick={() => setSaveOpen(true)}>
              <CalendarClock /> Kaydet ve Zamanla
            </Button>
          </>
        }
      >
        <div className="grid gap-5 p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
            <StatGrid className="grid-cols-1 sm:grid-cols-1">
              <Stat label={m.kind === "ratio" ? "Genel Oran" : "Toplam"} value={formatValue(measure, result.total)} />
            </StatGrid>
            {dashboardTotal !== null ? (
              <Badge tone={matchesDashboard ? "success" : "warning"} dot>
                {matchesDashboard ? "Pano toplamıyla aynı" : "Pano toplamından farklı"}
              </Badge>
            ) : null}
          </div>

          {result.rows.length === 0 ? (
            <EmptyState variant="inline" title="Bu tanımda veri yok" hint="Süzgeci gevşet ya da dönemi uzat." />
          ) : dim === "month" ? (
            <AreaChart
              title={`${m.label}, aylık`}
              labels={result.rows.map((r) => r.label.split(" ")[0].slice(0, 3))}
              series={[{ label: m.label, values: result.rows.map((r) => r.value), series: 1 }]}
              valueFormat={m.unit === "TL" ? { notation: "compact", maximumFractionDigits: 1 } : { maximumFractionDigits: m.unit === "%" ? 1 : 0 }}
              unit={m.unit === "%" ? "%" : m.unit === "TL" ? "TL" : m.unit}
            />
          ) : (
            <BarList
              title={`${m.label}, ${dimLabel}`}
              columns={[dimLabel, m.label]}
              items={result.rows.map((r) => ({ label: r.label, value: m.unit === "%" ? r.value : r.value }))}
              sort={false}
              valueFormat={barFormat}
              series={1}
            />
          )}

          {result.rows.length ? (
            <>
              <div className="max-md:hidden">
                <DataTable caption={`${m.label}, ${dimLabel}`} columns={columns} rows={result.rows} rowKey={(r) => r.label} density="compact" on="surface" stickyFirst={false} minWidth="30rem" />
              </div>
              <div className="md:hidden">
                <RecordList label={`${m.label}, ${dimLabel}`} items={items} />
              </div>
            </>
          ) : null}
        </div>
      </Panel>
    </div>
  );

  /* --- Kayıtlı raporlar ---------------------------------------------------------------------- */
  const statusBadge = (r: SavedReport) =>
    r.paused ? (
      <Badge tone="warning" dot>
        Duraklatıldı
      </Badge>
    ) : r.status === "basarili" ? (
      <Badge tone="success" dot>
        Başarılı
      </Badge>
    ) : r.status === "hata" ? (
      <Badge tone="danger" dot>
        Hata
      </Badge>
    ) : (
      <Badge tone="neutral" dot>
        Bekliyor
      </Badge>
    );
  const openSaved = (r: SavedReport) => openBuilder({ dim: r.dim, measure: r.measure, period: r.period });
  const savedColumns: readonly Column<SavedReport>[] = [
    {
      key: "name",
      header: "Rapor",
      render: (r) => (
        <div className="min-w-0">
          <button type="button" onClick={() => openSaved(r)} className="text-start font-medium text-strong underline-offset-2 hover:underline">
            {r.name}
          </button>
          <p className="text-small text-muted">
            {r.owner} · {FORMAT_LABEL[r.format]}
          </p>
        </div>
      ),
    },
    { key: "cadence", header: "Sıklık", render: (r) => <span className="text-small">{CADENCE_LABEL[r.cadence]}</span> },
    { key: "last", header: "Son Çalışma", render: (r) => <span className="text-small whitespace-nowrap text-muted">{stamp(r.lastRun)}</span> },
    { key: "status", header: "Durum", render: statusBadge },
    {
      key: "actions",
      header: <span className="sr-only">İşlemler</span>,
      render: (r) => (
        <div className="flex items-center justify-end gap-0.5">
          <IconButton aria-label={`${r.name} raporunu şimdi çalıştır`} icon={Play} variant="ghost" size="sm" onClick={() => runNow(r.id)} />
          {r.cadence !== "yok" ? <IconButton aria-label={r.paused ? `${r.name} zamanlamasını sürdür` : `${r.name} zamanlamasını duraklat`} icon={r.paused ? Play : Pause} variant="ghost" size="sm" aria-pressed={r.paused} onClick={() => togglePause(r.id)} /> : null}
          <IconButton aria-label={`${r.name} raporunu sil`} icon={Trash2} variant="danger" size="sm" onClick={() => removeReport(r)} />
        </div>
      ),
    },
  ];
  const savedItems: RecordItem[] = saved.map((r) => ({
    id: r.id,
    title: r.name,
    subtitle: `${r.owner} · ${CADENCE_LABEL[r.cadence]}`,
    meta: `Son: ${stamp(r.lastRun)}`,
    status: statusBadge(r),
    onSelect: () => openSaved(r),
  }));

  const savedTab = (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <section aria-labelledby="kayitli-baslik" className="min-w-0 rounded-xl bg-overlay shadow-raised ring-1 ring-line xl:col-span-2">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-4 py-3 sm:px-5">
          <div>
            <h2 id="kayitli-baslik" className="text-read font-semibold text-strong">
              Kayıtlı Raporlar
            </h2>
            <p className="text-small text-muted">{saved.length} rapor · {scheduled.length} zamanlanmış</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setTab("olustur")}>
            <Plus /> Yeni Rapor
          </Button>
        </header>
        {saved.length === 0 ? (
          <div className="p-6">
            <EmptyState variant="inline" title="Kayıtlı rapor yok" hint="Rapor Oluşturucu'da bir tanım hazırlayıp kaydet." />
          </div>
        ) : (
          <>
            <div className="max-md:hidden">
              <DataTable<SavedReport> caption="Kayıtlı raporlar" columns={savedColumns} rows={saved} rowKey={(r) => r.id} density="comfortable" on="surface" stickyFirst={false} minWidth="40rem" />
            </div>
            <div className="px-3 py-3 md:hidden">
              <RecordList label="Kayıtlı raporlar" items={savedItems} />
              <div className="mt-3 grid gap-2">
                {saved.slice(0, 3).map((r) => (
                  <Button key={r.id} variant="secondary" size="sm" onClick={() => runNow(r.id)}>
                    {r.name}: Çalıştır
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
      <Panel id="siradaki" title="Sıradaki Çalışmalar" note={upcoming.length ? "Zamanlanmış raporların bir sonraki çalışması" : "Zamanlanmış rapor yok"}>
        <div className="px-4 py-2 sm:px-5">{upcoming.length ? <ScheduleList label="Sıradaki rapor çalışmaları" items={upcoming} /> : <EmptyState variant="inline" title="Zamanlama yok" hint="Bir rapora sıklık verince burada görünür." />}</div>
      </Panel>
    </div>
  );

  /* --- EPDK bildirimleri ------------------------------------------------------------------------ */
  const epdk = (
    <div className="grid gap-5">
      <Strip>
        <Cell icon={<Send />} label="Bekleyen Bildirim" value={num.format(pendingFilings.length)} foot="Gönderilmeyi bekleyen" tone={pendingFilings.length ? "warning" : "success"} />
        <Cell icon={<CircleAlert />} label="Süresi Geçen" value={num.format(late)} foot="Tahsilat mutabakatı eksik" tone={late ? "danger" : "success"} />
        <Cell icon={<Zap />} label="SAIFI (30 Gün)" value={trNum(rel30.saifi)} foot="Abone başına kesinti sayısı" />
        <Cell icon={<Zap />} label="SAIDI (30 Gün)" value={`${trNum(rel30.saidi)} dk`} foot={`${rel30.events} plansız olay`} />
      </Strip>

      <section aria-labelledby="epdk-baslik" className="rounded-xl bg-overlay shadow-raised ring-1 ring-line">
        <header className="border-b border-line-soft px-4 py-3 sm:px-5">
          <h2 id="epdk-baslik" className="text-read font-semibold text-strong">
            Düzenleyici Kuruma Bildirimler
          </h2>
          <p className="text-small text-muted">Gönderim öncesi doğrulamalar tamamlanmadan gönder butonu açılmaz.</p>
        </header>
        <ul role="list" aria-label="Bildirimler" className="divide-y divide-line-soft">
          {filings.map((f) => {
            const left = daysBetween(TODAY, parseDay(f.deadline));
            const ok = f.checks.every((c) => c.ok);
            const expanded = open === f.id;
            return (
              <li key={f.id} className="px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  <div className="min-w-[min(100%,16rem)] flex-1">
                    <p className="text-base font-semibold text-strong">{f.title}</p>
                    <p className="text-small text-muted">
                      {f.period} · son tarih {f.deadline}
                      {f.status === "gonderildi" ? ` · ${f.reference}` : left < 0 ? ` · ${-left} gün geçti` : ` · ${left} gün kaldı`}
                    </p>
                  </div>
                  <Badge tone={FILING_TONE[f.status]} dot>
                    {FILING_LABEL[f.status]}
                  </Badge>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => (presetOf(f.presetId)?.category === "kesinti" ? setOpen(f.id) : openBuilder({ preset: f.presetId }))}>
                      <BarChart3 /> Önizle
                    </Button>
                    <Button variant="ghost" size="sm" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : f.id)}>
                      {expanded ? "Doğrulamayı Gizle" : "Doğrulama"}
                    </Button>
                    {f.status !== "gonderildi" ? (
                      <Button variant="primary" size="sm" disabled={!ok} onClick={() => setSending(f)} title={ok ? undefined : "Eksik doğrulamalar var"}>
                        <Send /> Gönder
                      </Button>
                    ) : null}
                  </div>
                </div>
                {expanded ? (
                  <ul role="list" aria-label={`${f.title} doğrulamaları`} className="mt-3 grid gap-1.5 rounded-lg bg-surface p-3">
                    {f.checks.map((c) => (
                      <li key={c.label} className="flex items-start gap-2 text-small">
                        {c.ok ? <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-success" /> : <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />}
                        <span className="text-body">
                          {c.label} <span className="text-muted">· {c.ok ? "tamam" : "eksik"}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );

  return (
    <>
      <PageHead
        title="Raporlar"
        description="Hazır raporlar, kendi raporunu kur, zamanla ve düzenleyici kuruma gönder."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setTab("epdk")}>
              <Send /> EPDK Bildirimleri
            </Button>
            <Button variant="primary" size="sm" onClick={() => setTab("olustur")}>
              <Plus /> Rapor Oluştur
            </Button>
          </>
        }
      />
      <PageBody>
        <Strip>
          <Cell icon={<FileText />} label="Hazır Rapor" value={num.format(PRESETS.length)} foot={`${CATEGORIES.length} kategoride`} />
          <Cell icon={<CalendarClock />} label="Kayıtlı Rapor" value={num.format(saved.length)} foot={`${saved.filter((r) => r.status === "hata").length} son çalışması hatalı`} tone={saved.some((r) => r.status === "hata") ? "warning" : "neutral"} />
          <Cell icon={<CalendarClock />} label="Zamanlanmış" value={num.format(scheduled.length)} foot={`${saved.filter((r) => r.paused).length} duraklatıldı`} />
          <Cell icon={<Send />} label="Bekleyen Bildirim" value={num.format(pendingFilings.length)} foot={late ? `${late} süresi geçti` : "Süreler içinde"} tone={late ? "danger" : "neutral"} />
        </Strip>

        <Tabs
          aria-label="Rapor bölümleri"
          value={tab}
          onValueChange={setTab}
          items={[
            { value: "hazir", label: "Hazır Raporlar", panel: ready },
            { value: "olustur", label: "Rapor Oluşturucu", panel: builder },
            { value: "kayitli", label: `Kayıtlı ve Zamanlanmış (${saved.length})`, panel: savedTab },
            { value: "epdk", label: `EPDK Bildirimleri (${pendingFilings.length})`, panel: epdk },
          ]}
        />
        <SampleNote />
      </PageBody>

      <Dialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        title="Kaydet ve Zamanla"
        description={`${m.label} · ${dimLabel} · ${periodText}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              Vazgeç
            </Button>
            <Button variant="primary" onClick={saveReport}>
              {cadence === "yok" ? "Kaydet" : "Kaydet ve Zamanla"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Input label="Rapor adı" value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder={`${m.label} · ${dimLabel}`} data-autofocus />
          <Select
            label="Sıklık"
            value={cadence}
            onValueChange={(v) => v && setCadence(v as Cadence)}
            items={(Object.keys(CADENCE_LABEL) as Cadence[]).map((c) => ({ value: c, label: CADENCE_LABEL[c] }))}
          />
          <Select label="Biçim" value={format} onValueChange={(v) => v && setFormat(v as "pdf" | "xlsx" | "csv")} items={[{ value: "pdf", label: "PDF" }, { value: "xlsx", label: "Excel" }, { value: "csv", label: "CSV" }]} />
          {cadence !== "yok" ? <Input label="Alıcılar" type="email" value={recipients} onChange={(e) => setRecipients(e.target.value)} hint="Birden çok adres için virgül kullan" /> : null}
          {cadence !== "yok" ? <p className="text-small text-muted">İlk çalışma: {(() => { const n = nextRun(cadence); return n ? `${n.day} ${n.time}` : "—"; })()}</p> : null}
        </div>
      </Dialog>

      <Dialog
        open={sending !== null}
        onOpenChange={(o) => !o && setSending(null)}
        title="Bildirimi Gönder"
        description={sending ? `${sending.title} · ${sending.period}` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSending(null)}>
              Vazgeç
            </Button>
            <Button variant="primary" onClick={sendFiling}>
              <Send /> Gönder
            </Button>
          </>
        }
      >
        <p className="text-base text-body">Gönderim geri alınamaz; kurumdan bir referans numarası alırsın ve bildirim "Gönderildi" olur.</p>
        {sending ? (
          <ul role="list" className="mt-3 grid gap-1.5 text-small text-muted">
            {sending.checks.map((c) => (
              <li key={c.label} className="flex items-start gap-2">
                <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                {c.label}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-3 text-micro text-muted">Örnek ortam: hiçbir kuruma gerçek gönderim yapılmaz.</p>
      </Dialog>
    </>
  );
}
