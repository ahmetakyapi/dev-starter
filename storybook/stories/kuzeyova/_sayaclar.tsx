"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  Gauge,
  Power,
  PowerOff,
  RadioTower,
  Repeat,
  ShieldAlert,
  Signal,
  TriangleAlert,
  Wifi,
  WifiOff,
  Wrench,
} from "lucide-react";
import { AreaChart } from "@/components/ui/area-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { ChartCard } from "@/components/ui/chart-card";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import type { ActiveFilter } from "@/components/ui/active-filters";
import type { FilterGroup, FilterValue } from "@/components/ui/filter-sheet";
import { HoldButton } from "@/components/ui/hold-button";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-field";
import { RadioGroup } from "@/components/ui/radio-group";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { matchesTr } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { SelectionAction, SelectionBar } from "@/components/ui/selection-bar";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Timeline, type TimelineEvent } from "@/components/ui/timeline";
import { useDerived } from "./_core";
import { audit } from "./_audit";
import {
  COMM_LABEL,
  REGIONS,
  SOURCE_LABEL,
  TODAY,
  addDays,
  clock,
  customer,
  daysBetween,
  dateTime,
  dayKey,
  dayLabel,
  fullDate,
  loadProfile,
  periodLabel,
  region,
  substation,
  type Customer,
  type Meter,
  type MeterComm,
  type MeterStatus,
  METER_STATUS_LABEL,
} from "./_data";
import {
  INSPECTION_YEARS,
  clockDrift,
  downloadCsv,
  inspection,
  meterEvents,
  meterListUi,
  sealNo,
  seenText,
  signal,
  type MeterEvent,
  type MeterFilters,
  type MeterSort,
} from "./_data-sayac";
import { findCustomer, patchOf } from "./_data-musteri";
import { effectiveMeters, effectiveReadings, getMeterOps, patchMeter, useMeterOps } from "./_ops";
import { cutEligibility } from "./_cutpolicy";
import { useCan } from "./_permissions";
import {
  advanceWorkOrder,
  createWorkOrder,
  allocateStock,
  getStock,
  requestCut,
  requestReconnect,
  useStock,
  useWorkOrders,
  WORK_STATUS_LABEL,
  WORK_TYPE_LABEL,
} from "./_store";
import { FilterBar, Metric, fmtDec, fmtKwh, fmtNum, fmtPct, useListKeys } from "./_kit";
import { MetricStrip, MeterBadge, PageBody, PageHead, Panel, ReadingBadge, href, useApp, type PageProps } from "./_ui";

/**
 * Sayaçlar: envanter + ayrıntı. Liste `?view=meters`, ayrıntı `?view=meters&id=M-0042`.
 *
 * LİSTE bir TARAMA aracıdır, katalog değil: varsayılan görünüm "Bugün müdahale
 * gerekenler" (iletişimi kesik, arızalı, müdahale şüphesi, kapak/manyetik alarmı)
 * ve sıralama "sorunlu önce"; sorunsuz sayaçlar "Hepsi"nde. Görünüm, arama,
 * süzgeç ve sıralama modül düzeyinde bir dilimde durur: başka sayfaya gidip
 * dönünce kaybolmaz. Görünüm ve durum adresten de gelir (`?tab=kesik`, `?status=`).
 *
 * İŞLEMLER depoya yazılır, yerel durum değil: röle TEK yoldan (kesme/bağlama
 * emri → iş emri → müşteri durumu), sayaç değişimi ve arıza kaydı gerçek iş
 * emri, saat senkronu ve tur planı sayaç yamasında, hepsi denetim günlüğünde.
 */

type Row = { m: Meter; c: Customer; alarm: boolean; overdue: boolean; score: number; reasons: string[] };

const MODELS = [...new Set(effectiveMeters().map((m) => m.model))];

const STATUS_ITEMS: readonly { value: MeterStatus; label: string }[] = [
  { value: "okunuyor", label: "Okunuyor" },
  { value: "iletisim-yok", label: "İletişim Yok" },
  { value: "arizali", label: "Arızalı" },
  { value: "mudahale", label: "Müdahale Şüphesi" },
];
const COMM_ITEMS: readonly { value: MeterComm; label: string }[] = [
  { value: "ami", label: "AMI" },
  { value: "gsm", label: "GSM / GPRS" },
  { value: "elle", label: "Elle Okuma" },
];

const FILTER_GROUPS: readonly FilterGroup[] = [
  { id: "status", label: "Durum", multiple: true, options: STATUS_ITEMS.map((s) => ({ value: s.value, label: s.label })) },
  { id: "model", label: "Sayaç Tipi", multiple: true, options: MODELS.map((x) => ({ value: x, label: x })) },
  { id: "comm", label: "İletişim", multiple: true, options: COMM_ITEMS.map((s) => ({ value: s.value, label: s.label })) },
  { id: "zone", label: "Tarife", options: [{ value: "tek", label: "Tek Zamanlı" }, { value: "cok", label: "Çok Zamanlı" }] },
  { id: "region", label: "Bölge", multiple: true, options: REGIONS.map((r) => ({ value: r.id, label: r.name })) },
];

type ViewDef = { id: string; label: string; test: (r: Row) => boolean };
const VIEWS: readonly ViewDef[] = [
  { id: "bugun", label: "Bugün Müdahale Gerekenler", test: (r) => r.m.status !== "okunuyor" || r.alarm },
  { id: "hepsi", label: "Hepsi", test: () => true },
  { id: "uzaktan", label: "Uzaktan Okunan", test: (r) => r.m.comm !== "elle" },
  { id: "elle", label: "Elle Okunan", test: (r) => r.m.comm === "elle" },
  { id: "kesik", label: "Haberleşmesi Kesik", test: (r) => r.m.status === "iletisim-yok" },
  { id: "alarmli", label: "Alarmlı", test: (r) => r.alarm },
  { id: "muayene", label: "Muayenesi Geçen", test: (r) => r.overdue },
];
const isView = (id: string | undefined): id is string => !!id && VIEWS.some((v) => v.id === id);

const SORTS: readonly { value: MeterSort; label: string }[] = [
  { value: "sorun", label: "Sorunlular Önce" },
  { value: "serial", label: "Seri No" },
  { value: "seen", label: "Son Okuma (En Eski Önce)" },
  { value: "name", label: "Abone Adı" },
];

const PAGE_SIZE = 20;
const Mono = ({ children }: { children: ReactNode }) => <span className="kz-mono">{children}</span>;

function CommBadge({ comm }: { comm: MeterComm }) {
  return (
    <Badge tone={comm === "elle" ? "neutral" : "primary"} variant="outline">
      {comm === "ami" ? <RadioTower aria-hidden className="size-3" /> : comm === "gsm" ? <Signal aria-hidden className="size-3" /> : <ClipboardList aria-hidden className="size-3" />}
      {COMM_LABEL[comm]}
    </Badge>
  );
}

/** Sorun puanı: ne kadar yüksekse o kadar yukarı. Durum önce, sonra alarm ve muayene. */
function issueScore(m: Meter, alarm: boolean, overdue: boolean): number {
  const base = m.status === "mudahale" ? 100 : m.status === "arizali" ? 90 : m.status === "iletisim-yok" ? 70 : 0;
  const stale = m.status === "iletisim-yok" ? Math.min(20, daysBetween(m.lastSeen, TODAY)) : 0;
  return base + stale + (alarm ? (base ? 10 : 50) : 0) + (overdue ? 20 : 0);
}

function reasonsOf(m: Meter, alarm: boolean, overdue: boolean): string[] {
  const out: string[] = [];
  if (m.status === "iletisim-yok") out.push(`İletişim kesik · ${daysBetween(m.lastSeen, TODAY)} gün`);
  if (m.status === "arizali") out.push("Ölçüm arızası");
  if (m.status === "mudahale") out.push("Müdahale şüphesi");
  if (alarm && m.status !== "mudahale" && m.status !== "arizali") out.push("Kapak / manyetik kaydı");
  if (overdue) out.push("Muayenesi geçti");
  return out;
}

/** Bütün sayaçlar + sorun bilgisi; depo her değişince yeniden hesaplanır. */
function useRows(): readonly Row[] {
  return useDerived(() => {
    const flagged = new Set(
      effectiveReadings()
        .filter((r) => r.period >= "2026-10" && r.flags.some((f) => f === "kapak-acma" || f === "manyetik"))
        .map((r) => r.meterId),
    );
    return effectiveMeters().map((m): Row => {
      const c = findCustomer(m.customerId) ?? customer(m.customerId);
      const alarm = m.status === "arizali" || m.status === "mudahale" || flagged.has(m.id);
      const overdue = inspection(m).overdue;
      return { m, c, alarm, overdue, score: issueScore(m, alarm, overdue), reasons: reasonsOf(m, alarm, overdue) };
    });
  });
}

const sel = (f: MeterFilters, id: string) => f[id] ?? [];

function applyFilters(rows: readonly Row[], f: MeterFilters, query: string, view: ViewDef | undefined): Row[] {
  const status = sel(f, "status");
  const model = sel(f, "model");
  const comm = sel(f, "comm");
  const zone = sel(f, "zone")[0];
  const reg = sel(f, "region");
  return rows.filter((r) => {
    if (view && !view.test(r)) return false;
    if (status.length && !status.includes(r.m.status)) return false;
    if (model.length && !model.includes(r.m.model)) return false;
    if (comm.length && !comm.includes(r.m.comm)) return false;
    if (zone && (zone === "cok" ? !r.m.multiZone : r.m.multiZone)) return false;
    if (reg.length && !reg.includes(r.c.regionId)) return false;
    if (query.trim() && !matchesTr(`${r.m.serial} ${r.m.id} ${r.c.name} ${r.c.installation} ${r.c.district}`, query, { fold: true })) return false;
    return true;
  });
}

/* ═══════════════════════════════ LİSTE ═══════════════════════════════ */

function MeterList({ params, go }: PageProps) {
  const { notify } = useApp();
  const ui = meterListUi.use();
  const rows = useRows();
  const list = useRef<HTMLDivElement>(null);
  useListKeys(list);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  // Adresten gelen görünüm ve durum (Pano kutuları, bağlantılar) bir kez uygulanır.
  useEffect(() => {
    if (!params.tab && !params.status) return;
    meterListUi.set((s) => ({
      ...s,
      view: isView(params.tab) ? params.tab : s.view,
      filters: params.status ? { ...s.filters, status: [params.status] } : isView(params.tab) ? {} : s.filters,
      shown: PAGE_SIZE,
    }));
  }, [params.tab, params.status]);

  const customView = ui.custom.find((v) => v.id === ui.view);
  const viewDef = customView ? VIEWS.find((v) => v.id === "hepsi") : VIEWS.find((v) => v.id === ui.view) ?? VIEWS[0];

  const counts = useMemo(() => Object.fromEntries(VIEWS.map((v) => [v.id, rows.filter(v.test).length])) as Record<string, number>, [rows]);
  const filtered = useMemo(() => applyFilters(rows, ui.filters, ui.query, viewDef), [rows, ui.filters, ui.query, viewDef]);
  const sorted = useMemo(() => {
    const by: Record<MeterSort, (a: Row, b: Row) => number> = {
      sorun: (a, b) => b.score - a.score || a.m.serial.localeCompare(b.m.serial),
      serial: (a, b) => a.m.serial.localeCompare(b.m.serial),
      seen: (a, b) => a.m.lastSeen.getTime() - b.m.lastSeen.getTime() || a.m.serial.localeCompare(b.m.serial),
      name: (a, b) => a.c.name.localeCompare(b.c.name, "tr"),
    };
    return [...filtered].sort(by[ui.sort]);
  }, [filtered, ui.sort]);
  const visible = sorted.slice(0, ui.shown);

  const set = (patch: Partial<typeof ui>) => meterListUi.set((s) => ({ ...s, shown: PAGE_SIZE, ...patch }));
  const setView = (id: string) => {
    const custom = ui.custom.find((v) => v.id === id);
    if (custom) {
      set({ view: id, filters: custom.filters, query: custom.query });
      go("meters", {});
    } else {
      set({ view: id, filters: {}, query: "" });
      go("meters", { tab: id });
    }
  };
  const clearFilters = () => set({ filters: {}, query: "" });
  const removeFilter = (id: string) => {
    if (id === "query") return set({ query: "" });
    const [group, value] = id.split("::");
    const next = { ...ui.filters, [group]: sel(ui.filters, group).filter((x) => x !== value) };
    set({ filters: next });
  };

  const optionLabel = (g: string, v: string) => FILTER_GROUPS.find((x) => x.id === g)?.options.find((o) => o.value === v)?.label ?? v;
  const active: ActiveFilter[] = [
    ...(ui.query.trim() ? [{ id: "query", label: "Arama", value: `“${ui.query.trim()}”`, valueText: ui.query.trim() }] : []),
    ...FILTER_GROUPS.flatMap((g) => sel(ui.filters, g.id).map((v) => ({ id: `${g.id}::${v}`, label: g.label, value: String(optionLabel(g.id, v)), valueText: String(optionLabel(g.id, v)) }))),
  ];

  const views = [
    ...VIEWS.map((v) => ({ id: v.id, label: v.label, count: counts[v.id], builtin: true })),
    ...ui.custom.map((v) => ({ id: v.id, label: v.label, count: applyFilters(rows, v.filters, v.query, VIEWS[1]).length })),
  ];

  const allVisible = visible.length > 0 && visible.every((r) => selected.has(r.m.id));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisible) visible.forEach((r) => next.delete(r.m.id));
      else visible.forEach((r) => next.add(r.m.id));
      return next;
    });
  const pickedRows = rows.filter((r) => selected.has(r.m.id));

  const exportRows = (list: readonly Row[], name: string) => {
    downloadCsv(name, [
      ["Seri no", "Kimlik", "Abone", "Tesisat", "Tip", "İletişim", "Durum", "Son okuma", "Yazılım", "Sorun"],
      ...list.map((r) => [r.m.serial, r.m.id, r.c.name, r.c.installation, r.m.model, COMM_LABEL[r.m.comm], r.m.status, dayKey(r.m.lastSeen), r.m.firmware, r.reasons.join(" / ")]),
    ]);
    notify({ title: "CSV İndirildi", body: `${fmtNum(list.length)} sayaç, ${name}`, tone: "success" });
  };

  const remote = rows.filter((r) => r.m.comm !== "elle");
  const offline = counts.kesik;
  const faulty = rows.filter((r) => r.m.status === "arizali").length;
  const suspect = rows.filter((r) => r.m.status === "mudahale").length;
  const inRoute = Object.values(useMeterOps()).filter((o) => o.inRoute).length;

  const columns: readonly Column<Row>[] = [
    {
      key: "select",
      header: <Checkbox aria-label="Görünen Bütün Sayaçları Seç" checked={allVisible} onChange={toggleAll} />,
      width: "3rem",
      render: ({ m }) => <Checkbox aria-label={`${m.serial} sayacını seç`} checked={selected.has(m.id)} onChange={() => toggle(m.id)} />,
    },
    {
      key: "serial",
      header: "Seri No",
      render: ({ m }) => (
        <a data-row href={href("meters", { id: m.id })} className="font-semibold text-strong hover:underline">
          <span className="whitespace-nowrap"><Mono>{m.serial}</Mono></span>
        </a>
      ),
    },
    {
      key: "customer",
      header: "Abone",
      render: ({ m, c }) => (
        <span className="grid">
          <a href={href("customers", { id: c.id })} className="font-medium text-body hover:text-strong hover:underline">
            {c.name}
          </a>
          <span className="text-small text-muted">
            Tesisat <Mono>{c.installation}</Mono> · {c.district}
          </span>
          <span className="sr-only">{m.id}</span>
        </span>
      ),
    },
    {
      key: "issue",
      header: "Sorun",
      render: ({ m, reasons: all }) => {
        // Durum rozeti zaten söylüyorsa aynı cümleyi ikinci kez yazma.
        const reasons = all.filter((r) => r.toLocaleLowerCase("tr") !== METER_STATUS_LABEL[m.status].toLocaleLowerCase("tr"));
        return reasons.length ? (
          <span className="grid gap-1">
            {reasons.slice(0, 2).map((r) => (
              <span key={r} className="text-small font-medium text-warning">
                {r}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-small text-muted">{all.length ? <><span aria-hidden>—</span><span className="sr-only">Durum sütununda belirtildi</span></> : "Sorun yok"}</span>
        );
      },
    },
    {
      key: "model",
      header: "Tip",
      render: ({ m }) => (
        <span className="grid">
          <span className="text-body">{m.model}</span>
          <span className="text-small text-muted">
            {m.multiZone ? "Çok zamanlı" : "Tek zamanlı"}
            {m.multiplier > 1 ? ` · ×${m.multiplier}` : ""}
          </span>
        </span>
      ),
    },
    { key: "comm", header: "İletişim", render: ({ m }) => <CommBadge comm={m.comm} /> },
    { key: "seen", header: "Son Okuma", render: ({ m }) => <span className={m.status === "iletisim-yok" ? "text-danger" : "text-body"}>{seenText(m.lastSeen)}</span> },
    { key: "status", header: "Durum", render: ({ m }) => <MeterBadge status={m.status} /> },
  ];

  const items: RecordItem[] = visible.map(({ m, c, reasons }) => ({
    id: m.id,
    title: <Mono>{m.serial}</Mono>,
    subtitle: `${c.name} · ${c.district}`,
    value: <CommBadge comm={m.comm} />,
    meta: reasons[0] ?? `Son okuma: ${seenText(m.lastSeen)}`,
    status: <MeterBadge status={m.status} />,
    actions: <Checkbox aria-label={`${m.serial} sayacını seç`} checked={selected.has(m.id)} onChange={() => toggle(m.id)} />,
    href: href("meters", { id: m.id }),
  }));

  const filterValue: FilterValue = ui.filters;

  return (
    <>
      <PageHead
        title="Sayaçlar"
        description={`${fmtNum(rows.length)} sayaç: ${fmtNum(remote.length)} uzaktan, ${fmtNum(rows.length - remote.length)} elle okunuyor. ${fmtNum(counts.bugun)} sayaç bugün ilgi bekliyor.`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => exportRows(sorted, "sayaclar-2026-11.csv")}>
              <Download aria-hidden /> CSV indir
            </Button>
            <Button variant="primary" size="sm" onClick={() => go("readings", { tab: "tur" })}>
              <ClipboardList aria-hidden /> Okuma turları{inRoute ? ` (${inRoute} sayaç eklendi)` : ""}
            </Button>
          </>
        }
      />
      <PageBody>
        <MetricStrip>
          <Metric icon={<Gauge />} label="Toplam Sayaç" value={fmtNum(rows.length)} foot={`${fmtNum(rows.filter((r) => r.m.multiplier > 1).length)} OG çarpanlı`} to={{ page: "meters", params: { tab: "hepsi" } }} />
          <Metric icon={<Wifi />} label="Uzaktan Okunan" value={fmtPct((remote.length / rows.length) * 100)} foot={`AMI ${fmtNum(rows.filter((r) => r.m.comm === "ami").length)} · GSM ${fmtNum(rows.filter((r) => r.m.comm === "gsm").length)}`} to={{ page: "meters", params: { tab: "uzaktan" } }} />
          <Metric icon={<WifiOff />} label="İletişim Kesik" value={fmtNum(offline)} foot="Saha turuna ekle" to={{ page: "meters", params: { tab: "kesik" } }} />
          <Metric icon={<Wrench />} label="Arızalı / Şüpheli" value={fmtNum(faulty + suspect)} foot={`${faulty} arızalı · ${suspect} şüphe`} to={{ page: "meters", params: { tab: "bugun" } }} />
          <Metric icon={<Repeat />} label="Muayenesi Geçen" value={fmtNum(counts.muayene)} foot="Süresi dolan" to={{ page: "meters", params: { tab: "muayene" } }} />
          <Metric icon={<ShieldAlert />} label="Kapak / Manyetik Alarm" value={fmtNum(counts.alarmli)} foot="Son 3 dönem" to={{ page: "meters", params: { tab: "alarmli" } }} />
        </MetricStrip>

        <Panel title="Sayaç Envanteri" note={`${fmtNum(sorted.length)} sonuç · ${SORTS.find((s) => s.value === ui.sort)?.label.toLowerCase()}`} id="sayac-liste">
          <div className="grid gap-3 border-b border-line-soft p-3 sm:p-4" ref={list}>
            <FilterBar
              search={{ value: ui.query, onChange: (v) => set({ query: v }), placeholder: "Seri no, abone, tesisat", label: "Sayaç Ara" }}
              filters={active}
              onRemoveFilter={removeFilter}
              onClearFilters={clearFilters}
              summary={`${fmtNum(sorted.length)} sayaç`}
              views={{
                items: views,
                value: ui.view,
                onChange: setView,
                onSave: (name) => {
                  const id = `u-${ui.custom.length + 1}`;
                  meterListUi.set((s) => ({ ...s, custom: [...s.custom, { id, label: name, filters: s.filters, query: s.query }], view: id }));
                  audit("Sayaç görünümü kaydetti", name);
                  notify({ title: "Görünüm Kaydedildi", body: name, tone: "success" });
                },
                onDelete: (id) => {
                  meterListUi.set((s) => ({ ...s, custom: s.custom.filter((v) => v.id !== id), view: s.view === id ? "bugun" : s.view }));
                },
              }}
              drawer={{ groups: FILTER_GROUPS, value: filterValue, onChange: (v) => set({ filters: v }), resultCount: sorted.length, resultLabel: (n) => `${n} Sayacı Göster` }}
              actions={
                <div className="w-full min-w-44 sm:w-56">
                  <Select label="Sırala" hideLabel placeholder="Sırala" value={ui.sort} onValueChange={(v) => set({ sort: (v as MeterSort) ?? "sorun" })} items={SORTS.map((s) => ({ value: s.value, label: s.label }))} />
                </div>
              }
            />
          </div>

          {sorted.length === 0 ? (
            <div className="grid justify-items-center gap-3 p-8 text-center">
              <p className="text-read font-semibold text-strong">{ui.view === "bugun" && active.length === 0 ? "Bugün müdahale gerektiren sayaç yok." : "Bu görünümde sayaç bulunamadı."}</p>
              <p className="max-w-md text-base text-muted">Arama ya da süzgeçleri gevşetin; bütün sayaçları görmek için “Hepsi” görünümüne geçin.</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Süzgeçleri Temizle
                </Button>
                <Button variant="primary" size="sm" onClick={() => setView("hepsi")}>
                  Hepsini Göster
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="max-md:hidden">
                <DataTable<Row> caption="Sayaçlar" columns={columns} rows={visible} rowKey={(r) => r.m.id} density="comfortable" on="surface" stickyFirst={false} minWidth="60rem" />
              </div>
              <div className="px-3 pb-3 md:hidden">
                <RecordList label="Sayaçlar" items={items} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-4 py-3">
                <p className="text-small text-muted" aria-live="polite">
                  {fmtNum(visible.length)} / {fmtNum(sorted.length)} sayaç gösteriliyor · j/k ile satır gez
                </p>
                {sorted.length > ui.shown ? (
                  <Button variant="secondary" size="sm" onClick={() => meterListUi.set((s) => ({ ...s, shown: s.shown + PAGE_SIZE }))}>
                    Daha fazla göster ({fmtNum(Math.min(PAGE_SIZE, sorted.length - ui.shown))})
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </Panel>
      </PageBody>

      <SelectionBar count={selected.size} noun="sayaç" onClear={() => setSelected(new Set())}>
        <SelectionAction
          icon={<RadioTower />}
          onClick={() => {
            const targets = pickedRows.filter((r) => r.m.status !== "iletisim-yok" && r.m.comm !== "elle");
            targets.forEach((r) => patchMeter(r.m.id, {}, "Okuma talebi gönderdi", r.m.serial));
            notify({
              title: "Okuma Talebi Gönderildi",
              body: targets.length === pickedRows.length ? `${fmtNum(targets.length)} sayaç: yanıt birkaç dakika içinde gelir.` : `${fmtNum(targets.length)} sayaca gitti; ${fmtNum(pickedRows.length - targets.length)} sayaç uzaktan okunamıyor (elle ya da iletişim kesik), tur planına ekleyin.`,
              tone: "success",
            });
            setSelected(new Set());
          }}
        >
          Okuma Talebi Gönder
        </SelectionAction>
        <SelectionAction
          icon={<CalendarClock />}
          onClick={() => {
            const ids = pickedRows.map((r) => r.m.id);
            ids.forEach((id) => patchMeter(id, { inRoute: true }, "Tur planına ekledi", id));
            notify({ title: "Tur Planına Eklendi", body: `${fmtNum(ids.length)} sayaç: Okumalar → Tur Planı.`, tone: "success", undo: () => ids.forEach((id) => patchMeter(id, { inRoute: false }, "Tur planından çıkardı", id)) });
            setSelected(new Set());
          }}
        >
          Tur Planına Ekle
        </SelectionAction>
        <SelectionAction
          icon={<Download />}
          onClick={() => {
            exportRows(pickedRows, "secili-sayaclar.csv");
            setSelected(new Set());
          }}
        >
          CSV İndir
        </SelectionAction>
      </SelectionBar>
    </>
  );
}

/* ═══════════════════════════════ AYRINTI ═══════════════════════════════ */

type Live = { state: "idle" | "reading" | "done"; at: Date | null };
type DialogKind = null | "relay" | "replace" | "fault";

const TONE_OF_EVENT: Record<MeterEvent["tone"], TimelineEvent["tone"]> = { neutral: "neutral", primary: "primary", success: "success", warning: "warning", danger: "danger" };

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-small text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-base text-strong">{children}</dd>
    </div>
  );
}

function MeterDetail({ id, go }: { id: string; go: PageProps["go"] }) {
  const m = useDerived(() => effectiveMeters().find((x) => x.id === id), [id]);
  if (!m) {
    return (
      <>
        <PageHead title="Sayaçlar" description="Sayaç bulunamadı." />
        <PageBody>
          <div className="grid justify-items-center gap-3 p-8 text-center">
            <p className="text-read font-semibold text-strong">{id} kimlikli sayaç yok</p>
            <p className="max-w-md text-base text-muted">Yeni açılan abonelerin sayaçları bu listede görünür; adres yanlış olabilir.</p>
            <Button variant="secondary" size="sm" onClick={() => go("meters")}>
              Sayaçlara Dön
            </Button>
          </div>
        </PageBody>
      </>
    );
  }
  return <MeterDetailBody m={m} go={go} />;
}

function MeterDetailBody({ m, go }: { m: Meter; go: PageProps["go"] }) {
  const { notify } = useApp();
  const canCut = useCan("kesme");
  const canMeter = useCan("sayac");
  const ops = useMeterOps()[m.id] ?? {};
  const workOrders = useWorkOrders();
  const [live, setLive] = useState<Live>({ state: "idle", at: null });
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [day, setDay] = useState("1");

  useEffect(() => {
    if (live.state !== "reading") return;
    const timer = window.setTimeout(() => setLive({ state: "done", at: new Date(2026, 10, 21, 10, 41, 12) }), 1400);
    return () => window.clearTimeout(timer);
  }, [live.state]);

  const c = useDerived(() => findCustomer(m.customerId) ?? customer(m.customerId), [m.customerId]);
  const pending = useDerived(() => patchOf(c.id)?.pendingWork ?? null, [c.id]);
  const sub = substation(m.substationId);
  const sig = signal(m);
  const insp = inspection(m);
  const readings = useDerived(() => effectiveReadings().filter((r) => r.meterId === m.id), [m.id]);
  const done = readings.filter((r) => r.status !== "bekliyor");
  const last = done.at(-1) ?? readings.at(-1)!;
  const current = readings.at(-1)!;
  const drift = ops.clockSyncedAt ? 0 : clockDrift(m);
  const cutOff = c.status === "kesik";
  const related = workOrders.filter((w) => w.meterId === m.id || (w.customerId === m.customerId && w.type !== "okuma-turu"));
  const NOW = new Date(2026, 10, 21, 10, 40);

  const events: MeterEvent[] = useMemo(() => {
    const extra: MeterEvent[] = [];
    if (ops.clockSyncedAt) extra.push({ id: "x-clock", kind: "saat", at: NOW, title: "Saat Senkronu (Portal)", detail: "Sayaç saati sunucuya ayarlandı.", tone: "neutral" });
    if (ops.inRoute) extra.push({ id: "x-route", kind: "is-emri", at: NOW, title: "Saha Okuma Turuna Eklendi", detail: `${region(c.regionId).name} bölgesi turu.`, tone: "primary" });
    for (const w of related) extra.push({ id: `wo-${w.id}`, kind: "is-emri", at: w.createdAt, title: `${WORK_TYPE_LABEL[w.type]} · ${w.id}`, detail: `${WORK_STATUS_LABEL[w.status]} · ${w.reason}`, tone: w.status === "tamamlandi" ? "success" : w.status === "iptal" ? "neutral" : "primary" });
    return [...extra, ...meterEvents(m)].sort((a, b) => b.at.getTime() - a.at.getTime());
  }, [m, ops.clockSyncedAt, ops.inRoute, related.length, workOrders]);

  const profileDay = dayKey(addDays(TODAY, -Number(day)));
  const profile = useMemo(() => loadProfile(m.id, profileDay), [m.id, profileDay]);
  const hourly = Array.from({ length: 24 }, (_, h) => {
    const slice = profile.slice(h * 4, h * 4 + 4).filter((p) => !p.missing);
    return slice.length ? Math.round((slice.reduce((s, p) => s + p.kw, 0) / slice.length) * 100) / 100 : 0;
  });
  const peak = profile.reduce((best, p) => (p.kw > best.kw && !p.missing ? p : best), profile[0]);
  const pf = profile.filter((p) => !p.missing);
  const avgPf = pf.length ? pf.reduce((s, p) => s + p.pf, 0) / pf.length : 0;
  const missing = profile.filter((p) => p.missing).length;
  const total = profile.reduce((s, p) => s + p.kwh, 0);
  const usagePeriods = done.slice(-12);

  const timeline: TimelineEvent[] = events.slice(0, 8).map((e) => ({
    id: e.id,
    at: e.at.toISOString(),
    when: `${dayLabel(dayKey(e.at))}, ${clock.format(e.at)}`,
    title: e.title,
    description: e.detail,
    tone: TONE_OF_EVENT[e.tone],
  }));

  const readingItems: RecordItem[] = readings
    .slice(-6)
    .reverse()
    .map((r) => ({
      id: r.id,
      title: periodLabel(r.period),
      subtitle: `${SOURCE_LABEL[r.source]} · ${dayLabel(r.date)}`,
      value: r.status === "bekliyor" ? "Bekliyor" : fmtKwh(r.usage.total),
      status: <ReadingBadge status={r.status} />,
      href: href("readings", { id: r.id }),
    }));

  const SHORT_SOURCE = { uzaktan: "Uzaktan", saha: "Saha", tahmini: "Tahmini", beyan: "Beyan", yok: "Bekliyor" } as const;
  const readingColumns: readonly Column<(typeof readings)[number]>[] = [
    { key: "period", header: "Dönem", render: (r) => <a href={href("readings", { id: r.id })} className="font-semibold text-strong hover:underline">{periodLabel(r.period)}</a> },
    { key: "date", header: "Okuma Günü", render: (r) => dayLabel(r.date) },
    { key: "source", header: "Kaynak", render: (r) => SHORT_SOURCE[r.source] },
    {
      key: "index",
      header: m.multiZone ? "Endeks T1 · T2 · T3" : "Endeks",
      numeric: true,
      render: (r) => <Mono>{r.status === "bekliyor" ? "—" : m.multiZone ? `${fmtNum(r.index.t1)} · ${fmtNum(r.index.t2)} · ${fmtNum(r.index.t3)}` : fmtNum(r.index.t1)}</Mono>,
    },
    { key: "use", header: "Tüketim", numeric: true, render: (r) => <Mono>{r.status === "bekliyor" ? "—" : fmtKwh(r.usage.total)}</Mono> },
    { key: "status", header: "Durum", render: (r) => <ReadingBadge status={r.status} /> },
  ];

  const startLive = () => {
    setLive({ state: "reading", at: null });
    audit("Anlık okuma istedi", m.serial);
    notify({ title: "Okuma Talebi Gönderildi", body: `${m.serial}: sayaçtan anlık endeks isteniyor.`, tone: "success" });
  };
  const syncClock = () => {
    patchMeter(m.id, { clockSyncedAt: "2026-11-21T10:40" }, "Saat senkronladı", `${m.serial} · sapma ${Math.abs(drift)} sn`);
    notify({ title: "Saat Senkronlandı", body: `${m.serial}: sapma sıfırlandı.`, tone: "success" });
  };
  const addToRoute = () => {
    patchMeter(m.id, { inRoute: true }, "Tur planına ekledi", m.serial);
    notify({ title: "Tur Planına Eklendi", body: `${m.serial}: Okumalar → Tur Planı.`, tone: "success", undo: () => patchMeter(m.id, { inRoute: false }, "Tur planından çıkardı", m.serial) });
  };

  const driftLabel = drift === 0 ? "Sapma yok" : `${drift > 0 ? "+" : "−"}${Math.abs(drift)} sn`;
  const liveIndex = { t1: current.index.t1 + 14, t2: current.index.t2 + (m.multiZone ? 6 : 0), t3: current.index.t3 + (m.multiZone ? 4 : 0) };
  const relayText = pending ? `${pending.kind === "kesme" ? "Kesme" : "Bağlama"} emri bekliyor (${pending.id}, ${pending.date})` : cutOff ? "açık (enerji kesik)" : "kapalı (enerji var)";

  return (
    <>
      <PageHead
        title="Sayaçlar"
        crumb={m.serial}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Mono>{m.serial}</Mono> · {c.name} · Tesisat <Mono>{c.installation}</Mono>
            <MeterBadge status={m.status} />
          </span>
        }
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => go("meters")}>
              <ArrowLeft aria-hidden /> Sayaçlara dön
            </Button>
            <Button variant="primary" size="sm" onClick={startLive} disabled={live.state === "reading" || m.status === "iletisim-yok"}>
              {live.state === "reading" ? <Spinner size="sm" label="Okunuyor" /> : <RadioTower aria-hidden />} Anlık okuma iste
            </Button>
          </>
        }
      />
      <PageBody className="xl:grid-cols-3">
        <div className="grid min-w-0 content-start gap-5 xl:col-span-2">
          {m.status !== "okunuyor" ? (
            <div role="status" className="flex items-start gap-3 rounded-xl bg-warning-wash p-4 text-base text-strong ring-1 ring-warning/20">
              <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-warning" />
              <p>
                <span className="font-semibold">{m.status === "iletisim-yok" ? "Sayaçla iletişim yok." : m.status === "arizali" ? "Sayaç arızalı görünüyor." : "Müdahale şüphesi var."}</span>{" "}
                {m.status === "iletisim-yok"
                  ? `Son paket ${seenText(m.lastSeen).toLowerCase()} alındı; anlık okuma istenemez, saha okuma turuna ekleyin.`
                  : m.status === "arizali"
                    ? "Ölçüm devresi tutarsız; sayaç değişimi iş emri açmanız önerilir."
                    : "Kapak açma ve manyetik alan kayıtları var; mühür ve kablo bağlantısı yerinde kontrol edilmeli."}
              </p>
            </div>
          ) : null}
          {insp.overdue ? (
            <div role="status" className="flex items-start gap-3 rounded-xl bg-surface p-4 text-base text-body ring-1 ring-line">
              <Repeat aria-hidden className="mt-0.5 size-5 shrink-0 text-muted" />
              <p>
                <span className="font-semibold text-strong">Muayene süresi geçti ({insp.text}).</span> {INSPECTION_YEARS} yıllık süre örnek bir parametredir; sayaç değişimi ya da muayene için iş emri açın.
              </p>
            </div>
          ) : null}

          {live.state !== "idle" ? (
            <Panel title="Anlık Okuma" note={live.state === "reading" ? "Sayaçtan endeks isteniyor…" : `Alındı: ${live.at ? dateTime(live.at) : ""}`} id="anlik">
              {live.state === "reading" ? (
                <div className="flex items-center gap-3 p-5 text-base text-muted" role="status">
                  <Spinner label="Sayaç Okunuyor" /> Sayaç yanıtı bekleniyor (baş uç sistemi → {COMM_LABEL[m.comm]})
                </div>
              ) : (
                <dl className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:p-5">
                  <Fact label="T1 Endeks"><Mono>{fmtNum(liveIndex.t1)}</Mono> kWh</Fact>
                  <Fact label="T2 Endeks"><Mono>{m.multiZone ? fmtNum(liveIndex.t2) : "—"}</Mono></Fact>
                  <Fact label="T3 Endeks"><Mono>{m.multiZone ? fmtNum(liveIndex.t3) : "—"}</Mono></Fact>
                  <Fact label="Anlık Güç"><Mono>{fmtDec(peak.kw)}</Mono> kW</Fact>
                </dl>
              )}
            </Panel>
          ) : null}

          <section aria-label="Tüketim ve Yük" className="grid gap-5 lg:grid-cols-2">
            <ChartCard label="Aylık Tüketim" value={fmtKwh(last.usage.total)} changeLabel={periodLabel(last.period)} id="tuketim-grafik" className="rounded-xl bg-overlay p-1.5 shadow-raised ring-1 ring-line">
              <AreaChart
                title={`${m.serial} aylık tüketim`}
                labels={usagePeriods.map((r) => periodLabel(r.period).split(" ")[0].slice(0, 3))}
                series={[{ label: "Tüketim", values: usagePeriods.map((r) => r.usage.total), series: 1 }]}
                unit="kWh"
                height="h-44"
              />
            </ChartCard>
            <ChartCard
              label="Günlük Yük Profili"
              value={`${fmtDec(peak.kw)} kW`}
              changeLabel={`en yüksek talep, ${peak.time}`}
              id="yuk-grafik"
              className="rounded-xl bg-overlay p-1.5 shadow-raised ring-1 ring-line"
              action={<SegmentedControl aria-label="Gün" size="sm" value={day} onValueChange={setDay} options={[{ value: "1", label: "Dün" }, { value: "2", label: "2 Gün" }, { value: "7", label: "7 Gün" }]} />}
            >
              <AreaChart title={`${m.serial} ${dayLabel(profileDay)} saatlik talep`} labels={hourly.map((_, h) => String(h).padStart(2, "0"))} series={[{ label: "Talep", values: hourly, series: 3 }]} unit="kW" valueFormat={{ maximumFractionDigits: 2 }} height="h-44" />
            </ChartCard>
          </section>

          <Panel title="Yük Profili Özeti" note={`${dayLabel(profileDay)} · 96 aralık (15 dakika)`} id="profil">
            <dl className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:p-5">
              <Fact label="Gün Tüketimi"><Mono>{fmtKwh(total)}</Mono></Fact>
              <Fact label="En Yüksek Talep"><Mono>{fmtDec(peak.kw)}</Mono> kW · {peak.time}</Fact>
              <Fact label="Ortalama Güç Faktörü"><Mono>{fmtDec(avgPf, 2)}</Mono></Fact>
              <Fact label="Eksik Paket">
                <span className={missing ? "font-semibold text-warning" : undefined}>{missing ? `${missing} / 96 aralık` : "Eksik yok"}</span>
              </Fact>
            </dl>
            <p className="border-t border-line-soft px-4 py-3 text-small text-muted">
              Ham aralık verisi için <a href={href("rawdata", { meter: m.id })} className="font-medium text-primary-ink hover:underline">Ham Veri sayfasını</a> açın.
            </p>
          </Panel>

          <Panel title="Son Okumalar" note="Son altı dönem" id="son-okumalar">
            <div className="max-md:hidden">
              <DataTable caption="Sayacın son okumaları" columns={readingColumns} rows={readings.slice(-6).reverse()} rowKey={(r) => r.id} density="compact" on="surface" stickyFirst={false} minWidth="40rem" />
            </div>
            <div className="px-3 pb-3 md:hidden">
              <RecordList label="Sayacın Son Okumaları" items={readingItems} />
            </div>
          </Panel>
        </div>

        <aside aria-label="Sayaç Bilgileri ve İşlemler" className="grid min-w-0 content-start gap-5">
          <Panel title="Künye" id="kunye">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 p-4 sm:p-5">
              <Fact label="Seri No"><Mono>{m.serial}</Mono></Fact>
              <Fact label="Kimlik"><Mono>{m.id}</Mono></Fact>
              <Fact label="Model">{m.model}</Fact>
              <Fact label="Tarife">{m.multiZone ? "Çok zamanlı" : "Tek zamanlı"}</Fact>
              <Fact label="Çarpan (CT × VT)">
                <Mono>×{fmtNum(m.multiplier)}</Mono>
                <span className="block text-small text-muted">{m.ctRatio ?? 1} × {m.vtRatio ?? 1}, hesaplanır</span>
              </Fact>
              <Fact label="Akım / Gerilim Trafosu"><Mono>{m.ct}</Mono>{m.vt !== "—" ? <> · <Mono>{m.vt}</Mono></> : null}</Fact>
              <Fact label="Mühür No"><Mono>{sealNo(m)}</Mono></Fact>
              <Fact label="Kurulum">{fullDate.format(new Date(m.installed))}</Fact>
              <Fact label="Muayene">
                <span className={insp.overdue ? "font-semibold text-warning" : undefined}>{insp.text}{insp.overdue ? " (süresi geçti)" : ""}</span>
              </Fact>
              <Fact label="Yazılım"><Mono>{m.firmware}</Mono></Fact>
              <Fact label="İletişim">{COMM_LABEL[m.comm]}</Fact>
              <Fact label="Sinyal Gücü">
                {sig ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Signal aria-hidden className="size-4 text-muted" />
                    <Mono>{sig.dbm} dBm</Mono> · {sig.label}
                  </span>
                ) : (
                  "Modül yok"
                )}
              </Fact>
              <Fact label="Saat Sapması"><span className={Math.abs(drift) > 30 ? "font-semibold text-warning" : undefined}>{driftLabel}</span></Fact>
              <Fact label="Trafo Merkezi">{sub.name}</Fact>
              <Fact label="Tur Planı">{ops.inRoute ? "Eklendi" : "Yok"}</Fact>
            </dl>
          </Panel>

          <Panel title="Bağlı Abone" id="abone">
            <div className="grid gap-3 p-4 sm:p-5">
              <div>
                <a href={href("customers", { id: c.id })} className="text-read font-semibold text-strong hover:underline">{c.name}</a>
                <p className="mt-0.5 text-small text-muted">{c.id} · {region(c.regionId).name} · {c.district}</p>
              </div>
              <p className="text-base text-body">
                Tesisat <Mono>{c.installation}</Mono> · {c.voltage} · {c.tariff === "cok-zamanli" ? "çok zamanlı" : "tek zamanlı"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => go("customers", { id: c.id })}>Müşteri Kartı</Button>
                <Button variant="secondary" size="sm" onClick={() => go("invoices", { customer: c.id })}>Faturaları</Button>
              </div>
            </div>
          </Panel>

          <Panel title="İşlemler" note="Hepsi denetim günlüğüne yazılır" id="islemler">
            <div className="grid gap-2 p-3 sm:p-4">
              <Button variant="secondary" size="sm" className="justify-start" onClick={startLive} disabled={live.state === "reading" || m.status === "iletisim-yok"}>
                <RadioTower aria-hidden /> Anlık okuma iste
              </Button>
              <Button variant="secondary" size="sm" className="justify-start" onClick={syncClock} disabled={drift === 0 || m.comm === "elle"}>
                <Clock3 aria-hidden /> Saati senkronla {drift !== 0 ? `(${driftLabel})` : ""}
              </Button>
              <Button variant="secondary" size="sm" className="justify-start" onClick={() => setDialog("relay")} disabled={m.comm === "elle" || !canCut || !!pending} title={!canCut ? "Kesme/Bağlama Yetkiniz Yok" : undefined}>
                {cutOff ? <Power aria-hidden /> : <PowerOff aria-hidden />} {cutOff ? "Enerjiyi yeniden bağla" : "Enerji kesme emri ver"}
              </Button>
              <Button variant="secondary" size="sm" className="justify-start" onClick={() => setDialog("replace")} disabled={!canMeter} title={!canMeter ? "Sayaç Değişim Yetkiniz Yok" : undefined}>
                <Repeat aria-hidden /> Sayaç değişimi iş emri
              </Button>
              <Button variant="secondary" size="sm" className="justify-start" onClick={() => setDialog("fault")}>
                <Wrench aria-hidden /> Arıza kaydı aç
              </Button>
              <Button variant="secondary" size="sm" className="justify-start" onClick={addToRoute} disabled={!!ops.inRoute}>
                {ops.inRoute ? <CheckCircle2 aria-hidden /> : <CalendarClock aria-hidden />} {ops.inRoute ? "Tur planına eklendi" : "Tur planına ekle"}
              </Button>
            </div>
            <p className="border-t border-line-soft px-4 py-3 text-small text-muted" role="status">
              Röle şu an <strong className="font-semibold text-strong">{relayText}</strong>
              {m.comm === "elle" ? " · elle okunan sayaçta uzaktan röle komutu yok." : "."}
            </p>
          </Panel>

          {related.length ? (
            <Panel title="İş Emirleri" note="Bu sayaç ve abonesi" id="is-emirleri">
              <ul className="divide-y divide-line-soft">
                {related.slice(0, 5).map((w) => (
                  <li key={w.id} className="flex items-center justify-between gap-3 px-4 py-3 text-base">
                    <a href={href("workorders", { id: w.id })} className="min-w-0 font-medium text-strong hover:underline">
                      <Mono>{w.id}</Mono> · {WORK_TYPE_LABEL[w.type]}
                    </a>
                    <Badge tone={w.status === "tamamlandi" ? "success" : w.status === "iptal" ? "neutral" : "primary"} dot>
                      {WORK_STATUS_LABEL[w.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel title="Olay Günlüğü" note="Son 90 gün" id="olaylar">
            <div className="p-4 sm:p-5">
              <Timeline events={timeline} />
            </div>
          </Panel>
        </aside>
      </PageBody>

      <RelayDialog open={dialog === "relay"} onClose={() => setDialog(null)} cutting={!cutOff} meter={m} customerId={c.id} go={go} />
      <ReplaceDialog open={dialog === "replace"} onClose={() => setDialog(null)} meter={m} customerId={c.id} lastIndex={last.index} go={go} />
      <FaultDialog open={dialog === "fault"} onClose={() => setDialog(null)} meter={m} customerId={c.id} />
    </>
  );
}

function RelayDialog({ open, onClose, cutting, meter, customerId, go }: { open: boolean; onClose: () => void; cutting: boolean; meter: Meter; customerId: string; go: PageProps["go"] }) {
  const { notify } = useApp();
  const [reason, setReason] = useState("borc");
  const [blockers, setBlockers] = useState<string[]>([]);
  const REASONS = [
    { value: "borc", label: "Borç Nedeniyle Kesme" },
    { value: "talep", label: "Abone Talebi" },
    { value: "guvenlik", label: "Güvenlik / Müdahale Şüphesi" },
    { value: "bakim", label: "Bakım Çalışması" },
  ];
  const label = REASONS.find((r) => r.value === reason)?.label ?? "";
  const elig = useDerived(() => (open && cutting ? cutEligibility(customerId) : null), [open, cutting, customerId]);
  const cannot = cutting && elig && !elig.eligible;
  const close = () => {
    setBlockers([]);
    onClose();
  };

  const confirmCut = () => {
    const r = requestCut(customerId, label);
    if (!r.ok) {
      setBlockers(r.blockers);
      return;
    }
    close();
    if (r.status === "onay-bekliyor") notify({ title: "İki Göz Onayı Bekleniyor", body: `${meter.serial}: kesme emri onaylanınca iş emri açılır.`, tone: "info" });
    else notify({ title: "Kesme İş Emri Açıldı", body: `${r.workOrder.id}: ${meter.serial}. İş Emirleri sayfasında izlenir; tamamlanınca müşteri durumu ve röle güncellenir.`, tone: "success" });
  };
  const confirmReconnect = () => {
    const wo = requestReconnect(customerId, label);
    close();
    if (!wo) notify({ title: "Yetki Yok", body: "Bağlama emri verme yetkiniz yok.", tone: "info" });
    else notify({ title: "Bağlama İş Emri Açıldı", body: `${wo.id}: ${meter.serial}. Bağlama süre sayacı başladı.`, tone: "success" });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && close()}
      title={cutting ? "Enerji Kesme Emri" : "Enerjiyi Yeniden Bağla"}
      description={cutting ? `${meter.serial} abonesi için kesme iş emri açılır. Röle iş emri tamamlanınca açılır; kesme tek yoldan gider (Ödemeler ve Müşteriler aynı kaydı görür).` : `${meter.serial} abonesi için bağlama iş emri açılır; süre sayacı başlar.`}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Vazgeç</Button>
          {cutting ? (
            cannot ? (
              <Button variant="primary" disabled>Politika Engeli Var</Button>
            ) : (
              <HoldButton tone="danger" onConfirm={confirmCut} doneLabel="Emir verildi" hint="Onaylamak için basılı tut">
                Basılı Tutarak Kesme Emri Ver
              </HoldButton>
            )
          ) : (
            <Button variant="primary" onClick={confirmReconnect}>Bağlama Emri Ver</Button>
          )}
        </>
      }
    >
      <div className="grid gap-4">
        <RadioGroup name="relay-reason" legend="Gerekçe" value={reason} onChange={setReason} options={REASONS} />
        {cutting && elig ? (
          elig.eligible ? (
            <p className="rounded-lg bg-success-wash p-3 text-small text-strong ring-1 ring-success/20">Kesme politikası uygun: ihtar, bekleme süresi ve itiraz/plan denetimleri geçti.</p>
          ) : (
            <div role="alert" className="rounded-lg bg-warning-wash p-3 text-small text-strong ring-1 ring-warning/20">
              <p className="font-semibold">Kesme şu an verilemez:</p>
              <ul className="mt-1 list-disc pl-5">
                {elig.blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => { close(); go("payments", { tab: "kesme" }); }}>
                Gecikme ve Kesme Sayfasına Git
              </Button>
            </div>
          )
        ) : null}
        {blockers.length ? (
          <div role="alert" className="rounded-lg bg-danger-wash p-3 text-small text-strong ring-1 ring-danger/20">
            <ul className="list-disc pl-5">
              {blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="text-small text-muted">Süreler ve kurallar “örnek parametre”dir; gerçek mevzuata göre doğrulanmalıdır.</p>
      </div>
    </Dialog>
  );
}

function ReplaceDialog({ open, onClose, meter, customerId, lastIndex, go }: { open: boolean; onClose: () => void; meter: Meter; customerId: string; lastIndex: { t1: number; t2: number; t3: number }; go: PageProps["go"] }) {
  const { notify } = useApp();
  const stock = useStock();
  const free = stock.filter((s) => s.status === "stokta");
  const [stockId, setStockId] = useState("");
  const [t1, setT1] = useState<number | null>(lastIndex.t1);
  const [t2, setT2] = useState<number | null>(lastIndex.t2);
  const [t3, setT3] = useState<number | null>(lastIndex.t3);
  const [reason, setReason] = useState("muayene");
  const [finish, setFinish] = useState(false);
  const [touched, setTouched] = useState(false);
  const error = touched && !stockId ? "Stoktan yeni sayacı seçin." : undefined;
  const REASONS = [
    { value: "muayene", label: "Muayene Süresi Doldu" },
    { value: "ariza", label: "Sayaç Arızası" },
    { value: "mudahale", label: "Müdahale Tespiti" },
    { value: "donusum", label: "Akıllı Sayaca Dönüşüm" },
  ];

  const create = () => {
    setTouched(true);
    const pick = free.find((s) => s.id === stockId);
    if (!pick) return;
    if (!allocateStock(pick.id, { customerId })) return;
    const seal = getStock().find((s) => s.id === pick.id)?.seal ?? undefined;
    const wo = createWorkOrder({ type: "sayac-degisim", customerId, meterId: meter.id, reason: `${REASONS.find((r) => r.value === reason)?.label}: ${meter.serial} → ${pick.serial}` });
    if (finish) {
      const result = { oldSerial: meter.serial, oldIndex: t1 ?? lastIndex.t1, newSerial: pick.serial, newIndex: 0, seal, note: meter.multiZone ? `T2 ${t2 ?? 0} · T3 ${t3 ?? 0}` : undefined };
      for (let i = 0; i < 3; i += 1) advanceWorkOrder(wo.id);
      advanceWorkOrder(wo.id, result);
    }
    onClose();
    notify({ title: finish ? "Sayaç değişti" : "Sayaç değişimi iş emri açıldı", body: `${wo.id}: ${meter.serial} → ${pick.serial}${finish ? ". Eski sayaç söküldü, yeni sayaç tahsisli." : ". Yeni sayaç stoktan ayrıldı."}`, tone: "success" });
    if (finish) go("meters", { id: meter.id });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Sayaç Değişimi İş Emri"
      description={`${meter.serial} yerine stoktan yeni sayaç takılacak. Eski sayacın son endeksi iş emrinin sonucunda saklanır.`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button variant="primary" onClick={create}>İş Emri Oluştur</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Eski Sayaç" value={meter.serial} readOnly hint="Değiştirilemez" />
        <div className="sm:col-span-2">
          <RadioGroup
            name="replace-stock"
            legend="Yeni Sayaç (Stoktan)"
            value={stockId}
            onChange={setStockId}
            className="max-h-44 overflow-y-auto rounded-lg bg-surface p-3"
            options={free.length ? free.map((s) => ({ value: s.id, label: s.serial, hint: `${s.model} · ${s.depot}` })) : [{ value: "", label: "Stokta Sayaç Yok", disabled: true }]}
          />
          {error ? (
            <p role="alert" className="mt-2 text-small text-danger">
              {error}
            </p>
          ) : null}
        </div>
        <NumberField label="Eski Sayaç Son Endeks T1 (kWh)" value={t1} onValueChange={setT1} min={0} />
        <NumberField label="Yeni Sayaç Başlangıç Endeksi (kWh)" value={0} onValueChange={() => undefined} min={0} hint="Yeni sayaç sıfırdan başlar" />
        {meter.multiZone ? <NumberField label="Son Endeks T2 (kWh)" value={t2} onValueChange={setT2} min={0} /> : null}
        {meter.multiZone ? <NumberField label="Son Endeks T3 (kWh)" value={t3} onValueChange={setT3} min={0} /> : null}
        <div className="sm:col-span-2">
          <RadioGroup name="replace-reason" legend="Değişim Nedeni" orientation="horizontal" value={reason} onChange={setReason} options={REASONS} />
        </div>
        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-start gap-3 text-base text-body">
            <Checkbox aria-label="Saha Formunu Şimdi Gir ve Değişimi Tamamla" checked={finish} onChange={() => setFinish((v) => !v)} />
            <span>
              <span className="font-medium text-strong">Saha formunu şimdi gir ve değişimi tamamla</span>
              <span className="block text-small text-muted">İşaretlenirse iş emri bütün aşamalardan geçer: eski sayaç söküldü, yeni sayaç tahsisli olur. Boş bırakılırsa iş emri açık kalır ve İş Emirleri'nde ilerler.</span>
            </span>
          </label>
        </div>
      </div>
    </Dialog>
  );
}

function FaultDialog({ open, onClose, meter, customerId }: { open: boolean; onClose: () => void; meter: Meter; customerId: string }) {
  const { notify } = useApp();
  const [kind, setKind] = useState("iletisim");
  const [note, setNote] = useState("");
  const KINDS = [
    { value: "iletisim", label: "İletişim Modülü Arızası" },
    { value: "olcum", label: "Ölçüm Devresi Arızası" },
    { value: "ekran", label: "Ekran / Gösterge Arızası" },
    { value: "mudahale", label: "Müdahale Şüphesi" },
  ];
  const label = KINDS.find((k) => k.value === kind)?.label ?? "";
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Arıza Kaydı Aç"
      description={`${meter.serial} için saha ekibine arıza iş emri açılır.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button
            variant="primary"
            onClick={() => {
              const wo = createWorkOrder({ type: "ariza", customerId, meterId: meter.id, reason: `${label}${note.trim() ? `: ${note.trim()}` : ""}` });
              onClose();
              setNote("");
              notify({ title: "Arıza İş Emri Açıldı", body: `${wo.id}: ${label}. Hedef süre ${wo.slaHours} saat.`, tone: "success" });
            }}
          >
            Kaydı Aç
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <RadioGroup name="fault-kind" legend="Arıza Türü" value={kind} onChange={setKind} options={KINDS} />
        <Textarea label="Açıklama" value={note} onChange={(e) => setNote(e.target.value)} minRows={3} hint="Örnek: sayaç ekranı kapalı, abone bildirdi." />
      </div>
    </Dialog>
  );
}

/* ═══════════════════════════════ SAYFA ═══════════════════════════════ */

export function SayaclarPage(props: PageProps) {
  getMeterOps(); // sürüm: depo değişince sayfa yeniden çizilsin
  if (props.params.id) return <MeterDetail id={props.params.id} go={props.go} />;
  return <MeterList {...props} />;
}
