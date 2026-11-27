"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { Tabs } from "@/components/ui/tabs";
import { KIND_LABEL, KINDS, REGIONS, TODAY, dayLabel, daysBetween, num, parseDay, periodStats, type Period } from "./_data";
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
import { useDerived } from "./_core";
import { audit } from "./_audit";
import { filingRefsSlice, savedReportsSlice } from "./_data-rapor";
import { filingStatus, liveChecks, qualityIndicators, reliabilityBreakdown } from "./_data-raporlive";
import { COLLECTION_SCOPE, disputeSlaBreaches, openDisputes, pendingApprovals, useLiveStats, workOrderSlaBreaches } from "./_selectors";
import { effectiveReadings } from "./_ops";
import { CURRENT_PERIOD, READINGS } from "./_data";
import { Metric, PageHero, fmtDec, fmtDur, fmtNum, fmtPct, fmtTlCompact } from "./_kit";
import { MetricStrip, PageBody, PageHead, Panel, href, useApp, type PageProps } from "./_ui";

type TabId = "ozet" | "hazir" | "olustur" | "kayitli" | "epdk";
const TAB_IDS: readonly TabId[] = ["ozet", "hazir", "olustur", "kayitli", "epdk"];

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

const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
/** `2026-11-01 06:00` → `1 Kas, 06:00`. */
const stamp = (value: string | null) => (value ? `${Number(value.slice(8, 10))} ${MONTHS[Number(value.slice(5, 7)) - 1]}, ${value.slice(11)}` : "—");
const FILING_TONE: Record<FilingStatus, "neutral" | "success" | "danger" | "primary"> = { hazirlaniyor: "neutral", hazir: "primary", gonderildi: "success", gecikti: "danger" };
const FORMAT_LABEL = { pdf: "PDF", xlsx: "Excel", csv: "CSV" } as const;

/** Ölçü şeridi: kit `MetricStrip` + `Metric` (altı eşit kutu değil: sütun sayısı çocuktan türer). */
function Strip({ children }: { children: ReactNode }) {
  return <MetricStrip>{children}</MetricStrip>;
}

function Cell({ icon, label, value, foot }: { icon: ReactNode; label: string; value: string; foot: string; tone?: "neutral" | "danger" | "warning" | "success" }) {
  return <Metric icon={icon} label={label} value={value} foot={foot} />;
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
  const tab: TabId = TAB_IDS.includes(params.tab as TabId) ? (params.tab as TabId) : "ozet";
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
  const saved = savedReportsSlice.use();
  const setSaved = savedReportsSlice.set;
  const refs = filingRefsSlice.use();
  /* Bildirim durumu ve doğrulama kutuları CANLI: depodan hesaplanır, elle "tamam" yok. */
  const filings: readonly Filing[] = useDerived(() => SEED_FILINGS.map((f) => ({ ...f, status: filingStatus(f, refs), reference: refs[f.id] ?? f.reference, checks: liveChecks(f) })), [refs]);

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
      notify({ title: "CSV İndirildi", body: `${result.rows.length} satır`, tone: "success" });
      audit("Raporu dışa aktardı", `${m.label} · ${dimLabel}`, undefined, "CSV");
    } else if (kind === "pdf") {
      /* PDF: tarayıcının yazdırma penceresi (PDF olarak kaydet). Yalnız önizleme paneli basılır. */
      document.body.dataset.printing = "rapor";
      const clear = () => {
        delete document.body.dataset.printing;
        window.removeEventListener("afterprint", clear);
      };
      window.addEventListener("afterprint", clear);
      try {
        window.print();
      } catch {
        clear();
      }
      audit("Raporu yazdırdı", `${m.label} · ${dimLabel}`, undefined, "PDF");
    } else {
      notify({ title: "Excel Dosyası Hazırlandı (Örnek)", body: "Örnek ortamda Excel üretilmez; CSV gerçekten iner, PDF için yazdırma açılır", tone: "info" });
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
    audit("Rapor kaydetti", name, undefined, cadence === "yok" ? "Zamanlanmadı" : CADENCE_LABEL[cadence]);
    setSaveOpen(false);
    setSaveName("");
    notify({ title: cadence === "yok" ? "Rapor kaydedildi" : "Rapor zamanlandı", body: cadence === "yok" ? name : `${name} · ${CADENCE_LABEL[cadence]}`, tone: "success" });
    go("reports", { tab: "kayitli" });
  };

  const runNow = (id: string) => {
    setSaved((list) => list.map((r) => (r.id === id ? { ...r, lastRun: "2026-11-21 10:40", status: "basarili" } : r)));
    audit("Raporu çalıştırdı", saved.find((r) => r.id === id)?.name ?? id);
    notify({ title: "Rapor Çalıştırıldı", body: saved.find((r) => r.id === id)?.name, tone: "success" });
  };
  const removeReport = (r: SavedReport) => {
    setSaved((list) => list.filter((x) => x.id !== r.id));
    audit("Raporu sildi", r.name);
    notify({ title: "Rapor Silindi", body: r.name, tone: "info", undo: () => setSaved((list) => (list.some((x) => x.id === r.id) ? list : [r, ...list])) });
  };
  const togglePause = (id: string) => setSaved((list) => list.map((r) => (r.id === id ? { ...r, paused: !r.paused } : r)));

  const sendFiling = () => {
    if (!sending) return;
    const ref = `BLD-2026-${110490 + Object.keys(refs).length}`;
    filingRefsSlice.set((r) => ({ ...r, [sending.id]: ref }));
    audit("Düzenleyici bildirimi gönderdi", sending.title, undefined, ref);
    notify({ title: "Bildirim Gönderildi", body: `${sending.title} · ${ref}`, tone: "success" });
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
  const previews = useMemo(() => Object.fromEntries(PRESETS.map((p) => [p.id, formatValue(p.measure, aggregate(p.dim, p.measure, periodsFor(p.period), NO_FILTER).total)])), []);
  const cat = CATEGORIES.find((c) => c.id === category)!;

  const ready = (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <nav aria-label="Rapor Kategorileri" className="rounded-xl bg-overlay p-2 shadow-raised ring-1 ring-line lg:self-start">
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
            <Cell icon={<Zap />} label="SAIFI · 30 Gün" value={fmtDec(rel30.saifi, 2)} foot={`Abone başına kesinti sayısı · ${rel30.count} olay`} />
            <Cell icon={<Zap />} label="SAIDI · 30 Gün" value={`${fmtDec(rel30.saidi, 1)} dk`} foot="Abone başına kesinti süresi" />
            <Cell icon={<Zap />} label="SAIFI · 90 Gün" value={fmtDec(rel90.saifi, 2)} foot={`${rel90.count} uzun kesinti`} />
            <Cell icon={<Zap />} label="SAIDI · 90 Gün" value={`${fmtDec(rel90.saidi, 1)} dk`} foot="Planlı kesintiler hariç" />
          </Strip>
        ) : null}
        <CategoryGrid className="lg:grid-cols-2 2xl:grid-cols-3">
          {presets.map((p) => (
            <CategoryCard
              key={p.id}
              href={p.category === "kesinti" ? href("reports", { tab: "epdk" }) : href("reports", { tab: "olustur", preset: p.id })}
              title={p.title}
              description={p.description}
              meta={`Önizleme ${previews[p.id]} · ${p.cadence} · ${p.formats}`}
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
    { key: "value", header: m.label, numeric: true, render: (r) => <span className="kz-mono">{formatValue(measure, r.value)}</span>, bar: { value: (r) => r.value } },
    ...(m.kind === "sum" ? [{ key: "share", header: "Pay", numeric: true, render: (r: (typeof result.rows)[number]) => <span className="kz-mono text-muted">%{num.format(Math.round(r.share * 10) / 10)}</span> } satisfies Column<(typeof result.rows)[number]>] : []),
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
              label="Abone Tipi"
              disabled={measure === "loss"}
              items={[{ value: "hepsi", label: "Bütün Tipler" }, ...KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] }))]}
              value={filters.kind}
              onValueChange={(v) => setFilters((f) => ({ ...f, kind: v ?? "hepsi" }))}
            />
            <Select
              label="Gerilim Seviyesi"
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
            <div>
              <p className="text-small font-medium text-muted">{m.kind === "ratio" ? "Genel oran" : "Toplam"}</p>
              <p className="text-heading font-semibold tracking-tight text-strong tabular-nums">{formatValue(measure, result.total)}</p>
            </div>
            {dashboardTotal !== null ? (
              <Badge tone={matchesDashboard ? "success" : "warning"} dot>
                {matchesDashboard ? "Pano toplamıyla aynı" : "Pano toplamından farklı"}
              </Badge>
            ) : null}
          </div>

          {result.rows.length === 0 ? (
            <EmptyState variant="inline" title="Bu Tanımda Veri Yok" hint="Süzgeci gevşet ya da dönemi uzat." />
          ) : dim === "month" ? (
            <AreaChart
              title={`${m.label} (Aylık)`}
              labels={result.rows.map((r) => r.label.split(" ")[0].slice(0, 3))}
              series={[{ label: m.label, values: result.rows.map((r) => r.value), series: 1 }]}
              valueFormat={m.unit === "TL" ? { notation: "compact", maximumFractionDigits: 1 } : { maximumFractionDigits: m.unit === "%" ? 1 : 0 }}
              unit={m.unit === "%" ? "%" : m.unit === "TL" ? "TL" : m.unit}
            />
          ) : (
            <BarList
              title={`${m.label} (${dimLabel})`}
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
                <DataTable caption={`${m.label} (${dimLabel})`} columns={columns} rows={result.rows} rowKey={(r) => r.label} density="compact" on="surface" stickyFirst={false} minWidth="30rem" />
              </div>
              <div className="md:hidden">
                <RecordList label={`${m.label} (${dimLabel})`} items={items} />
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
            <EmptyState variant="inline" title="Kayıtlı Rapor Yok" hint="Rapor Oluşturucu'da bir tanım hazırlayıp kaydet." />
          </div>
        ) : (
          <>
            <div className="max-md:hidden">
              <DataTable<SavedReport> caption="Kayıtlı raporlar" columns={savedColumns} rows={saved} rowKey={(r) => r.id} density="comfortable" on="surface" stickyFirst={false} minWidth="40rem" />
            </div>
            <div className="px-3 py-3 md:hidden">
              <RecordList label="Kayıtlı Raporlar" items={savedItems} />
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
        <div className="px-4 py-2 sm:px-5">{upcoming.length ? <ScheduleList label="Sıradaki Rapor Çalışmaları" items={upcoming} /> : <EmptyState variant="inline" title="Zamanlama Yok" hint="Bir rapora sıklık verince burada görünür." />}</div>
      </Panel>
    </div>
  );

  /* --- EPDK bildirimleri ------------------------------------------------------------------------ */
  const epdk = (
    <div className="grid gap-5">
      <Strip>
        <Cell icon={<Send />} label="Bekleyen Bildirim" value={num.format(pendingFilings.length)} foot="Gönderilmeyi bekleyen" tone={pendingFilings.length ? "warning" : "success"} />
        <Cell icon={<CircleAlert />} label="Süresi Geçen" value={num.format(late)} foot={filings.find((f) => f.status === "gecikti")?.checks.find((c) => !c.ok)?.label ?? "Hepsi süresinde"} tone={late ? "danger" : "success"} />
        <Cell icon={<Zap />} label="SAIFI (30 Gün)" value={fmtDec(rel30.saifi, 2)} foot="Abone başına kesinti sayısı" />
        <Cell icon={<Zap />} label="SAIDI (30 Gün)" value={`${fmtDec(rel30.saidi, 1)} dk`} foot={`${rel30.count} uzun kesinti`} />
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
                      {f.period} · son tarih {dayLabel(f.deadline)}
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

  /* --- Yönetici özeti ------------------------------------------------------------------------- */
  const live = useLiveStats("1");
  const nowReadings = useDerived(() => effectiveReadings().filter((r) => r.period === CURRENT_PERIOD), []);
  const readRate = nowReadings.length ? (nowReadings.filter((r) => r.status !== "bekliyor").length / nowReadings.length) * 100 : 0;
  const brk = useMemo(() => reliabilityBreakdown(30), []);
  const quality = useDerived(qualityIndicators);
  const openDisp = useDerived(() => openDisputes().length);
  const lateDisp = useDerived(() => disputeSlaBreaches().length);
  const slaOver = useDerived(() => workOrderSlaBreaches().length);
  const approvalsOpen = useDerived(() => pendingApprovals().length);
  const dueSoon = filings.filter((f) => f.status !== "gonderildi").sort((a, b) => a.deadline.localeCompare(b.deadline));
  const pct1 = (now: number, before: number) => (before ? Math.round(((now - before) / before) * 1000) / 10 : undefined);
  void READINGS;

  const summary = (
    <div className="grid gap-5">
      <PageHero
        primary={{ label: "Kayıp / Kaçak · Bu Ay", value: fmtPct(live.lossPct), delta: Math.round((live.lossPct - live.lossBefore) * 10) / 10, goodWhen: "down", deltaLabel: "önceki aya göre", foot: "Giriş enerjisine oranla · bölge dökümü Pano'da", to: { page: "dashboard", params: { focus: "kayip" } }, icon: <TriangleAlert /> }}
        secondary={[
          { label: "Tahakkuk", value: fmtTlCompact(live.billed), delta: pct1(live.billed, live.billedBefore), goodWhen: "up", deltaLabel: "önceki aya göre", foot: "Kesilen faturalar" },
          { label: "Tahsilat Oranı", value: fmtPct(live.collectionRate), delta: Math.round((live.collectionRate - live.collectionBefore) * 10) / 10, goodWhen: "up", deltaLabel: "önceki aya göre", foot: COLLECTION_SCOPE },
          { label: "SAIDI · 30 Gün", value: `${fmtDec(rel30.saidi, 1)} dk`, foot: `SAIFI ${fmtDec(rel30.saifi, 2)} · ${rel30.count} uzun kesinti` },
          { label: "Okuma Oranı", value: fmtPct(readRate), foot: `${fmtNum(nowReadings.filter((r) => r.status === "bekliyor").length)} sayaç bekliyor` },
          { label: "Açık İtiraz", value: fmtNum(openDisp), foot: lateDisp ? `${lateDisp} tanesi süresini aştı` : "Hepsi süresinde", to: { page: "disputes" } },
          { label: "İş Emri / Onay", value: `${fmtNum(slaOver)} / ${fmtNum(approvalsOpen)}`, foot: "SLA aşan iş emri / bekleyen onay", to: { page: "workorders" } },
        ]}
      />

      <Panel id="ozet-epdk" title="Düzenleyici Bildirim Takvimi" note="Süre ve doğrulama durumu depodan canlı hesaplanır; gönderim için bütün kutular yeşil olmalı." actions={<Button size="sm" variant="secondary" onClick={() => setTab("epdk")}>Bildirimlere Git</Button>}>
        <ul role="list" aria-label="Yaklaşan Bildirimler" className="divide-y divide-line-soft">
          {dueSoon.map((f) => {
            const left = daysBetween(TODAY, parseDay(f.deadline));
            const missing = f.checks.filter((c) => !c.ok);
            return (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <span className="min-w-0">
                  <span className="block truncate text-base font-medium text-strong">{f.title}</span>
                  <span className="block text-small text-muted">{f.period} · son tarih {dayLabel(f.deadline)} · {left < 0 ? `${-left} gün geçti` : `${left} gün kaldı`}{missing.length ? ` · ${missing.length} doğrulama eksik` : ""}</span>
                </span>
                <span className="flex items-center gap-2">
                  <Badge tone={FILING_TONE[f.status]} dot>{FILING_LABEL[f.status]}</Badge>
                  <Button size="sm" variant="secondary" onClick={() => { setOpen(f.id); setTab("epdk"); }}>Doğrulama</Button>
                </span>
              </li>
            );
          })}
          {dueSoon.length === 0 ? <li className="p-6 text-center text-base text-muted">Bekleyen bildirim yok.</li> : null}
        </ul>
      </Panel>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel id="ozet-saidi" title="SAIDI / SAIFI Hesap Dökümü · Son 30 Gün" note="Yalnız plansız ve 3 dakikayı aşan (uzun) kesintiler sayılır; payda aktif abone sayısıdır. ÖRNEK kural: yürürlükteki tanım doğrulanmalı.">
          <dl className="grid h-full auto-rows-fr gap-px bg-line-soft sm:grid-cols-2">
            {[
              ["Payda: aktif abone", fmtNum(brk.denominator)],
              ["Uzun kesinti (sayılan)", fmtNum(brk.longCount)],
              ["Kısa kesinti (sayılmayan)", fmtNum(brk.shortCount)],
              ["Etkilenen abone (toplam)", fmtNum(brk.interruptions)],
              ["Abone × dakika", fmtNum(brk.customerMinutes)],
              ["SAIFI = etkilenen ÷ payda", fmtDec(rel30.saifi, 2)],
              ["SAIDI = abone·dk ÷ payda", `${fmtDec(rel30.saidi, 1)} dk`],
              ["Ortalama onarım (MTTR)", fmtDur(rel30.mttr)],
            ].map(([k, v]) => (
              <div key={k} className="bg-overlay p-3.5">
                <dt className="text-small text-muted">{k}</dt>
                <dd className="mt-0.5 text-base font-semibold text-strong tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel id="ozet-kalite" title="Ticari Kalite Göstergeleri" note="Süreler depodaki başvuru, çağrı ve itiraz kayıtlarından hesaplanır; hedefler ÖRNEK.">
          <dl className="grid flex-1 auto-rows-fr gap-px bg-line-soft sm:grid-cols-2">
            {[
              ["Başvurudan enerjilendirmeye", quality.appFinished ? `${fmtDec(quality.appDays, 1)} gün` : "Veri yok", `${quality.appFinished} tamamlanan başvuru`],
              ["Açık başvuru yaşı (ort.)", quality.openApps ? `${fmtDec(quality.openAppAge, 1)} gün` : "—", `${quality.openApps} açık başvuru`],
              ["Açık çağrı bekleme (ort.)", quality.callOpen ? fmtDur(Math.round(quality.callWait)) : "—", `${quality.callOpen} açık çağrı`],
              ["SLA aşan çağrı", fmtNum(quality.callSlaOver), "Çözüm hedefini geçen açık çağrı"],
              ["Açık itiraz", fmtNum(quality.disputeOpen), "Yanıt süresi 15 gün (ÖRNEK)"],
              ["Süresi aşan itiraz", fmtNum(quality.disputeLate), quality.disputeLate ? "Öncelikle yanıtlanmalı" : "Gecikme yok"],
            ].map(([k, v, f]) => (
              <div key={k} className="bg-overlay p-3.5">
                <dt className="text-small text-muted">{k}</dt>
                <dd className="mt-0.5 text-base font-semibold text-strong tabular-nums">{v}</dd>
                <dd className="text-small text-muted">{f}</dd>
              </div>
            ))}
          </dl>
          <div className="border-t border-line-soft p-3 text-small text-muted">Ayrıntı için Başvurular, Çağrı Merkezi ve İtirazlar sayfaları.</div>
        </Panel>
      </div>

      <Panel id="ozet-kesinti" title="En Çok Etkileyen Kesintiler" note="Son 30 günde etkilenen abone sayısına göre ilk altı plansız kesinti.">
          <ul role="list" aria-label="En Çok Etkileyen Kesintiler" className="grid divide-y divide-line-soft md:grid-cols-2 md:divide-y-0 md:[&>li]:border-b md:[&>li]:border-line-soft">
            {brk.top.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                <span className="min-w-0 truncate text-base text-body"><span className="kz-mono text-strong">{o.id}</span> · {o.cause}</span>
                <span className="shrink-0 text-small text-muted tabular-nums">{fmtNum(o.affected)} abone · {fmtDur(Math.round((o.end ? o.end.getTime() : TODAY.getTime()) / 60000 - o.start.getTime() / 60000))}</span>
              </li>
            ))}
          </ul>
      </Panel>
    </div>
  );

  return (
    <>
      <PageHead
        title="Raporlar"
        description="Bu ayın özeti, hazır raporlar, rapor oluşturucu ve düzenleyici bildirimler."
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
      <style href="kz-rapor-print" precedence="default">{`@media print { body[data-printing="rapor"] * { visibility: hidden !important; } body[data-printing="rapor"] #olustur-onizleme, body[data-printing="rapor"] #olustur-onizleme * { visibility: visible !important; } body[data-printing="rapor"] #olustur-onizleme { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; } }`}</style>
      <PageBody>
        <Tabs
          aria-label="Rapor Bölümleri"
          value={tab}
          onValueChange={setTab}
          items={[
            { value: "ozet", label: "Yönetici Özeti", panel: summary },
            { value: "hazir", label: `Hazır Raporlar (${PRESETS.length})`, panel: ready },
            { value: "olustur", label: "Rapor Oluşturucu", panel: builder },
            { value: "kayitli", label: `Kayıtlı ve Zamanlanmış (${saved.length})`, panel: savedTab },
            { value: "epdk", label: `EPDK Bildirimleri (${pendingFilings.length})`, panel: epdk },
          ]}
        />
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
          <Input label="Rapor Adı" value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder={`${m.label} · ${dimLabel}`} data-autofocus />
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
