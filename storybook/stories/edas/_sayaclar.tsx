"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { EmptyState } from "@/components/ui/empty-state";
import { HoldButton } from "@/components/ui/hold-button";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-field";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { SearchField, matchesTr } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { SelectionAction, SelectionBar } from "@/components/ui/selection-bar";
import { Spinner } from "@/components/ui/spinner";
import { TabLinks } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Timeline, type TimelineEvent } from "@/components/ui/timeline";
import {
  COMM_LABEL,
  METERS,
  READINGS,
  REGIONS,
  SOURCE_LABEL,
  TODAY,
  addDays,
  clock,
  customer,
  dateTime,
  dayKey,
  dayLabel,
  fullDate,
  kwh,
  loadProfile,
  num,
  num1,
  periodLabel,
  readingsOf,
  region,
  substation,
  type Customer,
  type Meter,
  type MeterComm,
  type MeterStatus,
} from "./_data";
import { clockDrift, inspection, meterEvents, seenText, sealNo, signal, type MeterEvent } from "./_data-sayac";
import { CARD, IconTile, MetricStrip, MeterBadge, PageBody, PageHead, Panel, ReadingBadge, SampleNote, href, useApp, type PageProps } from "./_ui";

/**
 * Sayaçlar: envanter + ayrıntı. Liste `?view=meters`, ayrıntı `?view=meters&id=M-0042`.
 * Sekme (`tab`) ve durum (`status`) adresten okunur, böylece Pano'dan ve bağlantıdan
 * doğrudan gelinir; arama, süzgeç, sıralama ve seçim sayfanın iç durumudur.
 * Her işlem (anlık okuma, saat senkronu, röle, sayaç değişimi, arıza kaydı) bir
 * simülasyon: veri değişmez, sayfa durumu ve bildirim değişir.
 */

type Row = { m: Meter; c: Customer };
const ROWS: readonly Row[] = METERS.map((m) => ({ m, c: customer(m.customerId) }));

const MODELS = [...new Set(METERS.map((m) => m.model))];
const STATUS_ITEMS: readonly { value: MeterStatus; label: string }[] = [
  { value: "okunuyor", label: "Okunuyor" },
  { value: "iletisim-yok", label: "İletişim yok" },
  { value: "arizali", label: "Arızalı" },
  { value: "mudahale", label: "Müdahale şüphesi" },
];

/** Bu dönemde kapak açma ya da manyetik bayrağı taşıyan sayaçlar (alarm). */
const FLAGGED_METERS = new Set(
  READINGS.filter((r) => r.period >= "2026-10" && r.flags.some((f) => f === "kapak-acma" || f === "manyetik")).map((r) => r.meterId),
);
const alarmed = (m: Meter) => m.status === "arizali" || m.status === "mudahale" || FLAGGED_METERS.has(m.id);

type Tab = "hepsi" | "uzaktan" | "elle" | "kesik" | "alarmli";
const TABS: readonly { id: Tab; label: string; test: (m: Meter) => boolean }[] = [
  { id: "hepsi", label: "Hepsi", test: () => true },
  { id: "uzaktan", label: "Uzaktan okunan", test: (m) => m.comm !== "elle" },
  { id: "elle", label: "Elle okunan", test: (m) => m.comm === "elle" },
  { id: "kesik", label: "Haberleşmesi kesik", test: (m) => m.status === "iletisim-yok" },
  { id: "alarmli", label: "Alarmlı", test: alarmed },
];
const tabOf = (value: string | undefined): Tab => (TABS.some((t) => t.id === value) ? (value as Tab) : "hepsi");

const SORTS = [
  { value: "serial", label: "Seri no" },
  { value: "seen", label: "Son okuma (en eski önce)" },
  { value: "name", label: "Abone adı" },
  { value: "status", label: "Durum (sorunlular önce)" },
] as const;
type SortKey = (typeof SORTS)[number]["value"];
const STATUS_RANK: Record<MeterStatus, number> = { mudahale: 0, arizali: 1, "iletisim-yok": 2, okunuyor: 3 };

const PAGE_SIZE = 20;

const Mono = ({ children }: { children: ReactNode }) => <span className="edas-mono">{children}</span>;

function CommBadge({ comm }: { comm: MeterComm }) {
  return (
    <Badge tone={comm === "elle" ? "neutral" : "primary"} variant="outline">
      {comm === "ami" ? <RadioTower aria-hidden className="size-3" /> : comm === "gsm" ? <Signal aria-hidden className="size-3" /> : <ClipboardList aria-hidden className="size-3" />}
      {COMM_LABEL[comm]}
    </Badge>
  );
}

/** Ölçü şeridi hücresi: ikon + etiket + sayı + alt satır. */
function Cell({ icon, label, value, foot, tone = "neutral" }: { icon: ReactNode; label: string; value: ReactNode; foot: ReactNode; tone?: "neutral" | "danger" | "warning" | "success" | "primary" }) {
  return (
    <div className="relative flex h-full flex-col gap-3 p-4 sm:p-5">
      <IconTile tone={tone} className="absolute top-4 right-4 sm:top-5 sm:right-5">
        {icon}
      </IconTile>
      <p className="min-h-10 pr-10 text-small font-medium text-muted">{label}</p>
      <p className="text-heading font-semibold tracking-tight text-strong tabular-nums">{value}</p>
      <p className="mt-auto text-small text-muted">{foot}</p>
    </div>
  );
}

/* ═══════════════════════════════ LİSTE ═══════════════════════════════ */

function MeterList({ params, go }: PageProps) {
  const { notify } = useApp();
  const tab = tabOf(params.tab);
  const status = (params.status as MeterStatus | undefined) ?? "all";
  const [query, setQuery] = useState("");
  const [model, setModel] = useState("all");
  const [comm, setComm] = useState("all");
  const [zone, setZone] = useState("all");
  const [regionId, setRegionId] = useState("all");
  const [sort, setSort] = useState<SortKey>("serial");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.id, METERS.filter(t.test).length])) as Record<Tab, number>, []);
  const remote = METERS.filter((m) => m.comm !== "elle");
  const offline = METERS.filter((m) => m.status === "iletisim-yok").length;
  const faulty = METERS.filter((m) => m.status === "arizali").length;
  const suspect = METERS.filter((m) => m.status === "mudahale").length;
  const replaceDue = METERS.filter((m) => inspection(m).overdue).length;
  const cover = FLAGGED_METERS.size;

  const rows = useMemo(() => {
    const test = TABS.find((t) => t.id === tab)!.test;
    const filtered = ROWS.filter(({ m, c }) => {
      if (!test(m)) return false;
      if (status !== "all" && m.status !== status) return false;
      if (model !== "all" && m.model !== model) return false;
      if (comm !== "all" && m.comm !== comm) return false;
      if (zone !== "all" && (zone === "cok" ? !m.multiZone : m.multiZone)) return false;
      if (regionId !== "all" && c.regionId !== regionId) return false;
      if (query.trim() && !matchesTr(`${m.serial} ${m.id} ${c.name} ${c.installation} ${c.district}`, query, { fold: true })) return false;
      return true;
    });
    const sorters: Record<SortKey, (a: Row, b: Row) => number> = {
      serial: (a, b) => a.m.serial.localeCompare(b.m.serial),
      seen: (a, b) => a.m.lastSeen.getTime() - b.m.lastSeen.getTime() || a.m.serial.localeCompare(b.m.serial),
      name: (a, b) => a.c.name.localeCompare(b.c.name, "tr"),
      status: (a, b) => STATUS_RANK[a.m.status] - STATUS_RANK[b.m.status] || a.m.serial.localeCompare(b.m.serial),
    };
    return [...filtered].sort(sorters[sort]);
  }, [tab, status, model, comm, zone, regionId, query, sort]);

  const visible = rows.slice(0, shown);
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
  const clearFilters = () => {
    setQuery("");
    setModel("all");
    setComm("all");
    setZone("all");
    setRegionId("all");
    go("meters", { tab: tab === "hepsi" ? undefined : tab });
  };
  const filtering = status !== "all" || model !== "all" || comm !== "all" || zone !== "all" || regionId !== "all" || query.trim() !== "";
  const first = [...selected][0];
  const selectedLabel = selected.size === 1 && first ? ROWS.find((r) => r.m.id === first)?.m.serial : `${selected.size} sayaç`;

  const columns: readonly Column<Row>[] = [
    {
      key: "select",
      header: <Checkbox aria-label="Görünen bütün sayaçları seç" checked={allVisible} onChange={toggleAll} />,
      width: "3rem",
      render: ({ m }) => <Checkbox aria-label={`${m.serial} sayacını seç`} checked={selected.has(m.id)} onChange={() => toggle(m.id)} />,
    },
    {
      key: "serial",
      header: "Seri no",
      render: ({ m }) => (
        <a href={href("meters", { id: m.id })} className="font-semibold text-strong hover:underline">
          <Mono>{m.serial}</Mono>
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
      key: "model",
      header: "Tip",
      render: ({ m }) => (
        <span className="grid">
          <span className="text-body">{m.model}</span>
          <span className="text-small text-muted">{m.multiZone ? "Çok zamanlı (T1·T2·T3)" : "Tek zamanlı"}{m.multiplier > 1 ? ` · ×${m.multiplier}` : ""}</span>
        </span>
      ),
    },
    { key: "comm", header: "İletişim", render: ({ m }) => <CommBadge comm={m.comm} /> },
    {
      key: "seen",
      header: "Son okuma",
      render: ({ m }) => <span className={m.status === "iletisim-yok" ? "text-danger" : "text-body"}>{seenText(m.lastSeen)}</span>,
    },
    { key: "status", header: "Durum", render: ({ m }) => <MeterBadge status={m.status} /> },
    { key: "fw", header: "Yazılım", render: ({ m }) => <Mono>{m.firmware}</Mono> },
  ];

  const items: RecordItem[] = visible.map(({ m, c }) => ({
    id: m.id,
    title: <Mono>{m.serial}</Mono>,
    subtitle: `${c.name} · ${c.district}`,
    value: <CommBadge comm={m.comm} />,
    meta: `Son okuma: ${seenText(m.lastSeen)}`,
    status: <MeterBadge status={m.status} />,
    actions: <Checkbox aria-label={`${m.serial} sayacını seç`} checked={selected.has(m.id)} onChange={() => toggle(m.id)} />,
    href: href("meters", { id: m.id }),
  }));

  return (
    <>
      <PageHead
        title="Sayaçlar"
        description={`${num.format(METERS.length)} sayaç: ${num.format(remote.length)} uzaktan, ${num.format(METERS.length - remote.length)} elle okunuyor.`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => notify({ title: "Dışa aktarma hazırlandı", body: `${num.format(rows.length)} sayaç, sayaclar-2026-11.csv`, tone: "success" })}>
              <Download aria-hidden /> Dışa aktar
            </Button>
            <Button variant="primary" size="sm" onClick={() => go("readings", { tab: "tur" })}>
              <ClipboardList aria-hidden /> Okuma turları
            </Button>
          </>
        }
      />
      <PageBody>
        <MetricStrip>
          <Cell icon={<Gauge />} label="Toplam sayaç" value={num.format(METERS.length)} foot={`${num.format(METERS.filter((m) => m.multiplier > 1).length)} OG çarpanlı sayaç`} />
          <Cell icon={<Wifi />} label="Uzaktan okunan" value={`%${num1.format((remote.length / METERS.length) * 100)}`} foot={`AMI ${num.format(METERS.filter((m) => m.comm === "ami").length)} · GSM ${num.format(METERS.filter((m) => m.comm === "gsm").length)}`} tone="success" />
          <Cell icon={<WifiOff />} label="Haberleşmesi kesik" value={num.format(offline)} foot="Saha okuma turuna eklenmeli" tone={offline ? "warning" : "neutral"} />
          <Cell icon={<Wrench />} label="Arızalı ya da şüpheli" value={num.format(faulty + suspect)} foot={`${faulty} arızalı · ${suspect} müdahale şüphesi`} tone="danger" />
          <Cell icon={<Repeat />} label="Muayenesi geçen" value={num.format(replaceDue)} foot="Sekiz yıllık muayene süresi dolan" tone={replaceDue ? "warning" : "neutral"} />
          <Cell icon={<ShieldAlert />} label="Kapak açma alarmı" value={num.format(cover)} foot="Son üç dönemde kapak ya da manyetik kaydı" tone={cover ? "danger" : "neutral"} />
        </MetricStrip>

        <Panel title="Sayaç envanteri" note={`${num.format(rows.length)} sonuç${filtering ? " (süzgeçli)" : ""}`} id="sayac-liste">
          <div className="grid gap-3 border-b border-line-soft p-3 sm:p-4">
            <div className="min-w-0">
              <TabLinks
                aria-label="Sayaç görünümleri"
                current={href("meters", { tab })}
                items={TABS.map((t) => ({ href: href("meters", { tab: t.id }), label: `${t.label} ${num.format(counts[t.id])}` }))}
                className="max-w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
              <SearchField
                label="Sayaç ara"
                placeholder="Seri no, abone, tesisat"
                value={query}
                onValueChange={(v) => {
                  setQuery(v);
                  setShown(PAGE_SIZE);
                }}
                resultCount={rows.length}
                shortcut="/"
                className="col-span-2 md:col-span-2"
              />
              <Select label="Durum" hideLabel placeholder="Durum" value={status} onValueChange={(v) => go("meters", { tab: tab === "hepsi" ? undefined : tab, status: v && v !== "all" ? v : undefined })} items={[{ value: "all", label: "Bütün durumlar" }, ...STATUS_ITEMS]} />
              <Select label="Sayaç tipi" hideLabel placeholder="Tip" value={model} onValueChange={(v) => setModel(v ?? "all")} items={[{ value: "all", label: "Bütün tipler" }, ...MODELS.map((x) => ({ value: x, label: x }))]} />
              <Select label="İletişim" hideLabel placeholder="İletişim" value={comm} onValueChange={(v) => setComm(v ?? "all")} items={[{ value: "all", label: "Bütün iletişim" }, { value: "ami", label: "AMI" }, { value: "gsm", label: "GSM / GPRS" }, { value: "elle", label: "Elle okuma" }]} />
              <Select label="Tarife" hideLabel placeholder="Tarife" value={zone} onValueChange={(v) => setZone(v ?? "all")} items={[{ value: "all", label: "Tek ve çok zamanlı" }, { value: "tek", label: "Tek zamanlı" }, { value: "cok", label: "Çok zamanlı" }]} />
              <Select label="Bölge" hideLabel placeholder="Bölge" value={regionId} onValueChange={(v) => setRegionId(v ?? "all")} items={[{ value: "all", label: "Bütün bölgeler" }, ...REGIONS.map((r) => ({ value: r.id, label: r.name }))]} />
              <Select label="Sırala" hideLabel placeholder="Sırala" value={sort} onValueChange={(v) => setSort((v as SortKey) ?? "serial")} items={SORTS.map((s) => ({ value: s.value, label: s.label }))} />
              {filtering ? (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Süzgeçleri temizle
                </Button>
              ) : null}
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<Gauge />} title="Bu süzgeçle sayaç bulunamadı" hint="Arama ya da süzgeçleri gevşetin." action={<Button variant="secondary" size="sm" onClick={clearFilters}>Süzgeçleri temizle</Button>} />
            </div>
          ) : (
            <>
              <div className="max-md:hidden">
                <DataTable<Row> caption="Sayaçlar" columns={columns} rows={visible} rowKey={(r) => r.m.id} density="comfortable" on="surface" stickyFirst={false} minWidth="56rem" />
              </div>
              <div className="px-3 pb-3 md:hidden">
                <RecordList label="Sayaçlar" items={items} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-4 py-3">
                <p className="text-small text-muted" aria-live="polite">
                  {num.format(visible.length)} / {num.format(rows.length)} sayaç gösteriliyor
                </p>
                {rows.length > shown ? (
                  <Button variant="secondary" size="sm" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                    Daha fazla göster ({num.format(Math.min(PAGE_SIZE, rows.length - shown))})
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </Panel>
        <SampleNote />
      </PageBody>

      <SelectionBar count={selected.size} noun="sayaç" onClear={() => setSelected(new Set())}>
        <SelectionAction
          icon={<RadioTower />}
          onClick={() => {
            notify({ title: "Okuma talebi gönderildi", body: `${selectedLabel}: yanıt birkaç dakika içinde gelir.`, tone: "success" });
            setSelected(new Set());
          }}
        >
          Okuma talebi gönder
        </SelectionAction>
        <SelectionAction
          icon={<CalendarClock />}
          onClick={() => {
            notify({ title: "Tur planına eklendi", body: `${selectedLabel}: Saha Okuma Turu, 24 Kasım.`, tone: "success" });
            setSelected(new Set());
          }}
        >
          Tur planına ekle
        </SelectionAction>
        <SelectionAction
          icon={<Download />}
          onClick={() => {
            notify({ title: "Dışa aktarma hazırlandı", body: `${selectedLabel}, secili-sayaclar.csv`, tone: "success" });
            setSelected(new Set());
          }}
        >
          Dışa aktar
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
  const m = METERS.find((x) => x.id === id);
  if (!m) {
    return (
      <>
        <PageHead title="Sayaçlar" description="Sayaç bulunamadı." />
        <PageBody>
          <EmptyState icon={<Gauge />} title={`${id} kimlikli sayaç yok`} action={<Button variant="secondary" size="sm" onClick={() => go("meters")}>Sayaçlara dön</Button>} />
        </PageBody>
      </>
    );
  }
  return <MeterDetailBody m={m} go={go} />;
}

function MeterDetailBody({ m, go }: { m: Meter; go: PageProps["go"] }) {
  const { notify } = useApp();

  const [live, setLive] = useState<Live>({ state: "idle", at: null });
  const [relay, setRelay] = useState<"closed" | "open">(() => (customer(m.customerId).status === "kesik" ? "open" : "closed"));
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [drift, setDrift] = useState(() => clockDrift(m));
  const [extra, setExtra] = useState<MeterEvent[]>([]);
  const [queued, setQueued] = useState(false);
  const [day, setDay] = useState("1");

  useEffect(() => {
    if (live.state !== "reading") return;
    const timer = window.setTimeout(() => setLive({ state: "done", at: new Date(2026, 10, 21, 10, 41, 12) }), 1400);
    return () => window.clearTimeout(timer);
  }, [live.state]);

  const c = customer(m.customerId);
  const sub = substation(m.substationId);
  const sig = signal(m);
  const insp = inspection(m);
  const readings = readingsOf(m.id);
  const done = readings.filter((r) => r.status !== "bekliyor");
  const last = done.at(-1) ?? readings.at(-1)!;
  const current = readings.at(-1)!;
  const events = [...extra, ...meterEvents(m)].sort((a, b) => b.at.getTime() - a.at.getTime());
  const addEvent = (e: Omit<MeterEvent, "id">) => setExtra((list) => [{ ...e, id: `x-${list.length}` }, ...list]);
  const NOW = new Date(2026, 10, 21, 10, 40);

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
      value: r.status === "bekliyor" ? "Bekliyor" : kwh(r.usage.total),
      status: <ReadingBadge status={r.status} />,
      href: href("readings", { id: r.id }),
    }));

  const SHORT_SOURCE = { uzaktan: "Uzaktan", saha: "Saha", tahmini: "Tahmini", beyan: "Beyan", yok: "Bekliyor" } as const;
  const readingColumns: readonly Column<(typeof readings)[number]>[] = [
    { key: "period", header: "Dönem", render: (r) => <a href={href("readings", { id: r.id })} className="font-semibold text-strong hover:underline">{periodLabel(r.period)}</a> },
    { key: "date", header: "Okuma günü", render: (r) => dayLabel(r.date) },
    { key: "source", header: "Kaynak", render: (r) => SHORT_SOURCE[r.source] },
    {
      key: "index",
      header: m.multiZone ? "Endeks T1 · T2 · T3" : "Endeks",
      numeric: true,
      render: (r) => (
        <Mono>{r.status === "bekliyor" ? "—" : m.multiZone ? `${num.format(r.index.t1)} · ${num.format(r.index.t2)} · ${num.format(r.index.t3)}` : num.format(r.index.t1)}</Mono>
      ),
    },
    { key: "use", header: "Tüketim", numeric: true, render: (r) => <Mono>{r.status === "bekliyor" ? "—" : kwh(r.usage.total)}</Mono> },
    { key: "status", header: "Durum", render: (r) => <ReadingBadge status={r.status} /> },
  ];

  const startLive = () => {
    setLive({ state: "reading", at: null });
    notify({ title: "Okuma talebi gönderildi", body: `${m.serial}: sayaçtan anlık endeks isteniyor.`, tone: "success" });
  };
  const syncClock = () => {
    setDrift(0);
    addEvent({ kind: "saat", at: NOW, title: "Saat senkronu", detail: `Sayaç saati sunucuya ayarlandı (sapma ${Math.abs(drift)} sn).`, tone: "neutral" });
    notify({ title: "Saat senkronlandı", body: `${m.serial}: sapma sıfırlandı.`, tone: "success" });
  };
  const addToRoute = () => {
    setQueued(true);
    addEvent({ kind: "is-emri", at: NOW, title: "Saha okuma turuna eklendi", detail: `${region(c.regionId).name} bölgesi turu, 24 Kasım.`, tone: "primary" });
    notify({ title: "Tur planına eklendi", body: `${m.serial}: Saha Okuma Turu, 24 Kasım.`, tone: "success" });
  };

  const driftLabel = drift === 0 ? "Sapma yok" : `${drift > 0 ? "+" : "−"}${Math.abs(drift)} sn`;
  const liveIndex = { t1: current.index.t1 + 14, t2: current.index.t2 + (m.multiZone ? 6 : 0), t3: current.index.t3 + (m.multiZone ? 4 : 0) };

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

          {live.state !== "idle" ? (
            <Panel title="Anlık okuma" note={live.state === "reading" ? "Sayaçtan endeks isteniyor…" : `Alındı: ${live.at ? dateTime(live.at) : ""}`} id="anlik">
              {live.state === "reading" ? (
                <div className="flex items-center gap-3 p-5 text-base text-muted" role="status">
                  <Spinner label="Sayaç okunuyor" /> Sayaç yanıtı bekleniyor (baş uç sistemi → {COMM_LABEL[m.comm]})
                </div>
              ) : (
                <dl className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:p-5">
                  <Fact label="T1 endeks"><Mono>{num.format(liveIndex.t1)}</Mono> kWh</Fact>
                  <Fact label="T2 endeks"><Mono>{m.multiZone ? num.format(liveIndex.t2) : "—"}</Mono></Fact>
                  <Fact label="T3 endeks"><Mono>{m.multiZone ? num.format(liveIndex.t3) : "—"}</Mono></Fact>
                  <Fact label="Anlık güç"><Mono>{num1.format(peak.kw)}</Mono> kW</Fact>
                </dl>
              )}
            </Panel>
          ) : null}

          <section aria-label="Tüketim ve yük" className="grid gap-5 lg:grid-cols-2">
            <ChartCard label="Aylık tüketim" value={kwh(last.usage.total)} changeLabel={`${periodLabel(last.period)}`} id="tuketim-grafik" className={CARD}>
              <AreaChart
                title={`${m.serial} aylık tüketim`}
                labels={usagePeriods.map((r) => periodLabel(r.period).split(" ")[0].slice(0, 3))}
                series={[{ label: "Tüketim", values: usagePeriods.map((r) => r.usage.total), series: 1 }]}
                unit="kWh"
                height="h-44"
              />
            </ChartCard>
            <ChartCard
              label="Günlük yük profili"
              value={`${num1.format(peak.kw)} kW`}
              changeLabel={`en yüksek talep, ${peak.time}`}
              id="yuk-grafik"
              className={CARD}
              action={<SegmentedControl aria-label="Gün" size="sm" value={day} onValueChange={setDay} options={[{ value: "1", label: "Dün" }, { value: "2", label: "2 gün" }, { value: "7", label: "7 gün" }]} />}
            >
              <AreaChart title={`${m.serial} ${dayLabel(profileDay)} saatlik talep`} labels={hourly.map((_, h) => String(h).padStart(2, "0"))} series={[{ label: "Talep", values: hourly, series: 3 }]} unit="kW" valueFormat={{ maximumFractionDigits: 2 }} height="h-44" />
            </ChartCard>
          </section>

          <Panel title="Yük profili özeti" note={`${dayLabel(profileDay)} · 96 aralık (15 dakika)`} id="profil">
            <dl className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:p-5">
              <Fact label="Gün tüketimi"><Mono>{kwh(total)}</Mono></Fact>
              <Fact label="En yüksek talep"><Mono>{num1.format(peak.kw)}</Mono> kW · {peak.time}</Fact>
              <Fact label="Ortalama güç faktörü"><Mono>{avgPf.toFixed(2).replace(".", ",")}</Mono></Fact>
              <Fact label="Eksik paket">
                <span className={missing ? "font-semibold text-warning" : undefined}>
                  {missing ? `${missing} / 96 aralık` : "Eksik yok"}
                </span>
              </Fact>
            </dl>
            <p className="border-t border-line-soft px-4 py-3 text-small text-muted">
              Ham aralık verisi için <a href={href("rawdata", { meter: m.id })} className="font-medium text-primary-ink hover:underline">Ham Veri sayfasını</a> açın.
            </p>
          </Panel>

          <Panel title="Son okumalar" note="Son altı dönem; satıra basınca okuma ayrıntısı açılır" id="son-okumalar">
            <div className="max-md:hidden">
              <DataTable caption="Sayacın son okumaları" columns={readingColumns} rows={readings.slice(-6).reverse()} rowKey={(r) => r.id} density="compact" on="surface" stickyFirst={false} minWidth="40rem" />
            </div>
            <div className="px-3 pb-3 md:hidden">
              <RecordList label="Sayacın son okumaları" items={readingItems} />
            </div>
          </Panel>
        </div>

        <aside aria-label="Sayaç bilgileri ve işlemler" className="grid min-w-0 content-start gap-5">
          <Panel title="Künye" id="kunye">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 p-4 sm:p-5">
              <Fact label="Seri no"><Mono>{m.serial}</Mono></Fact>
              <Fact label="Kimlik"><Mono>{m.id}</Mono></Fact>
              <Fact label="Model">{m.model}</Fact>
              <Fact label="Tarife">{m.multiZone ? "Çok zamanlı" : "Tek zamanlı"}</Fact>
              <Fact label="Çarpan"><Mono>×{m.multiplier}</Mono></Fact>
              <Fact label="Akım / gerilim trafosu"><Mono>{m.ct}</Mono>{m.vt !== "—" ? <> · <Mono>{m.vt}</Mono></> : null}</Fact>
              <Fact label="Mühür no"><Mono>{sealNo(m)}</Mono></Fact>
              <Fact label="Kurulum">{fullDate.format(new Date(m.installed))}</Fact>
              <Fact label="Muayene">
                <span className={insp.overdue ? "font-semibold text-warning" : undefined}>{insp.text}{insp.overdue ? " (süresi geçti)" : ""}</span>
              </Fact>
              <Fact label="Yazılım"><Mono>{m.firmware}</Mono></Fact>
              <Fact label="İletişim">{COMM_LABEL[m.comm]}</Fact>
              <Fact label="Sinyal gücü">
                {sig ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Signal aria-hidden className="size-4 text-muted" />
                    <Mono>{sig.dbm} dBm</Mono> · {sig.label}
                  </span>
                ) : (
                  "Modül yok"
                )}
              </Fact>
              <Fact label="Saat sapması"><span className={Math.abs(drift) > 30 ? "font-semibold text-warning" : undefined}>{driftLabel}</span></Fact>
              <Fact label="Trafo merkezi">{sub.name}</Fact>
            </dl>
          </Panel>

          <Panel title="Bağlı abone" id="abone">
            <div className="grid gap-3 p-4 sm:p-5">
              <div>
                <a href={href("customers", { id: c.id })} className="text-read font-semibold text-strong hover:underline">{c.name}</a>
                <p className="mt-0.5 text-small text-muted">{c.id} · {region(c.regionId).name} · {c.district}</p>
              </div>
              <p className="text-base text-body">
                Tesisat <Mono>{c.installation}</Mono> · {c.voltage} · {c.tariff === "cok-zamanli" ? "çok zamanlı" : "tek zamanlı"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => go("customers", { id: c.id })}>Müşteri kartı</Button>
                <Button variant="secondary" size="sm" onClick={() => go("invoices", { customer: c.id })}>Faturaları</Button>
              </div>
            </div>
          </Panel>

          <Panel title="İşlemler" note="Hepsi simülasyon: sayaca gerçek komut gitmez" id="islemler">
            <div className="grid gap-2 p-3 sm:p-4">
              <Button variant="secondary" size="sm" className="justify-start" onClick={startLive} disabled={live.state === "reading" || m.status === "iletisim-yok"}>
                <RadioTower aria-hidden /> Anlık okuma iste
              </Button>
              <Button variant="secondary" size="sm" className="justify-start" onClick={syncClock} disabled={drift === 0 || m.comm === "elle"}>
                <Clock3 aria-hidden /> Saati senkronla {drift !== 0 ? `(${driftLabel})` : ""}
              </Button>
              <Button variant="secondary" size="sm" className="justify-start" onClick={() => setDialog("relay")} disabled={m.comm === "elle"}>
                {relay === "closed" ? <PowerOff aria-hidden /> : <Power aria-hidden />} {relay === "closed" ? "Uzaktan enerjiyi kes" : "Enerjiyi yeniden bağla"}
              </Button>
              <Button variant="secondary" size="sm" className="justify-start" onClick={() => setDialog("replace")}>
                <Repeat aria-hidden /> Sayaç değişimi iş emri
              </Button>
              <Button variant="secondary" size="sm" className="justify-start" onClick={() => setDialog("fault")}>
                <Wrench aria-hidden /> Arıza kaydı aç
              </Button>
              <Button variant="secondary" size="sm" className="justify-start" onClick={addToRoute} disabled={queued}>
                {queued ? <CheckCircle2 aria-hidden /> : <CalendarClock aria-hidden />} {queued ? "Tur planına eklendi" : "Tur planına ekle"}
              </Button>
            </div>
            <p className="border-t border-line-soft px-4 py-3 text-small text-muted" role="status">
              Röle şu an <strong className="font-semibold text-strong">{relay === "closed" ? "kapalı (enerji var)" : "açık (enerji kesik)"}</strong>
              {m.comm === "elle" ? " · elle okunan sayaçta uzaktan röle komutu yok." : "."}
            </p>
          </Panel>

          <Panel title="Olay günlüğü" note="Son 90 gün" id="olaylar">
            <div className="p-4 sm:p-5">
              <Timeline events={timeline} />
            </div>
          </Panel>
        </aside>
      </PageBody>
      <SampleNote className="px-4 pb-6 sm:px-6" />

      <RelayDialog
        open={dialog === "relay"}
        onClose={() => setDialog(null)}
        relay={relay}
        serial={m.serial}
        onConfirm={(reason) => {
          const next = relay === "closed" ? "open" : "closed";
          setRelay(next);
          setDialog(null);
          addEvent({ kind: "role", at: NOW, title: next === "open" ? "Röle açıldı (enerji kesildi)" : "Röle kapatıldı (enerji bağlandı)", detail: `Gerekçe: ${reason}. Uzaktan komut, baş uç sistemi.`, tone: next === "open" ? "warning" : "success" });
          notify({ title: next === "open" ? "Enerji kesildi" : "Enerji yeniden bağlandı", body: `${m.serial}: röle ${next === "open" ? "açıldı" : "kapandı"}.`, tone: "success" });
        }}
      />
      <ReplaceDialog
        open={dialog === "replace"}
        onClose={() => setDialog(null)}
        meter={m}
        lastIndex={last.index}
        onCreate={(orderNo, newSerial) => {
          setDialog(null);
          addEvent({ kind: "is-emri", at: NOW, title: "Sayaç değişimi iş emri açıldı", detail: `${orderNo}: ${m.serial} yerine ${newSerial}.`, tone: "primary" });
          notify({ title: "Sayaç değişimi iş emri açıldı", body: `${orderNo}: ${m.serial} → ${newSerial}`, tone: "success" });
        }}
      />
      <FaultDialog
        open={dialog === "fault"}
        onClose={() => setDialog(null)}
        serial={m.serial}
        onCreate={(code, kind) => {
          setDialog(null);
          addEvent({ kind: "is-emri", at: NOW, title: "Arıza kaydı açıldı", detail: `${code}: ${kind}.`, tone: "warning" });
          notify({ title: "Arıza kaydı açıldı", body: `${code}: ${kind}`, tone: "success" });
        }}
      />
    </>
  );
}

function RelayDialog({ open, onClose, relay, serial, onConfirm }: { open: boolean; onClose: () => void; relay: "closed" | "open"; serial: string; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("borc");
  const REASONS = [
    { value: "borc", label: "Borç nedeniyle kesme" },
    { value: "talep", label: "Abone talebi" },
    { value: "guvenlik", label: "Güvenlik / müdahale şüphesi" },
    { value: "bakim", label: "Bakım çalışması" },
  ];
  const label = REASONS.find((r) => r.value === reason)?.label ?? "";
  const cutting = relay === "closed";
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={cutting ? "Uzaktan enerji kesme" : "Enerjiyi yeniden bağla"}
      description={`${serial} sayacının rölesi ${cutting ? "açılacak ve abonenin enerjisi kesilecek" : "kapatılacak ve enerji yeniden bağlanacak"}.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          {cutting ? (
            <HoldButton tone="danger" onConfirm={() => onConfirm(label)} doneLabel="Kesildi" hint="Onaylamak için basılı tut">
              Basılı tutarak enerjiyi kes
            </HoldButton>
          ) : (
            <Button variant="primary" onClick={() => onConfirm(label)}>
              Enerjiyi bağla
            </Button>
          )}
        </>
      }
    >
      <div className="grid gap-4">
        <Select label="Gerekçe" value={reason} onValueChange={(v) => setReason(v ?? "borc")} items={REASONS} />
        <p className="text-small text-muted">Kesme işlemi hukuki bildirim süresi dolmadan yapılamaz; yasal bekleme kontrolü demo verisinde atlanmıştır.</p>
      </div>
    </Dialog>
  );
}

function ReplaceDialog({ open, onClose, meter, lastIndex, onCreate }: { open: boolean; onClose: () => void; meter: Meter; lastIndex: { t1: number; t2: number; t3: number }; onCreate: (orderNo: string, newSerial: string) => void }) {
  const [serial, setSerial] = useState("");
  const [seal, setSeal] = useState("");
  const [t1, setT1] = useState<number | null>(lastIndex.t1);
  const [t2, setT2] = useState<number | null>(lastIndex.t2);
  const [t3, setT3] = useState<number | null>(lastIndex.t3);
  const [reason, setReason] = useState("muayene");
  const [touched, setTouched] = useState(false);
  const error = touched && serial.trim().length < 6 ? "Yeni sayacın seri numarasını girin (en az 6 karakter)." : undefined;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Sayaç değişimi iş emri"
      description={`${meter.serial} yerine yeni sayaç takılacak. Eski sayacın son endeksi kapanış okuması olarak kaydedilir.`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button
            variant="primary"
            onClick={() => {
              setTouched(true);
              if (serial.trim().length < 6) return;
              onCreate("IE-48217", serial.trim().toUpperCase());
            }}
          >
            İş emri oluştur
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Eski sayaç" value={meter.serial} readOnly hint="Değiştirilemez" />
        <Input label="Yeni sayaç seri no" value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="KZA-26-123456" error={error} />
        <NumberField label="Eski sayaç son endeks T1 (kWh)" value={t1} onValueChange={setT1} min={0} />
        <NumberField label="Yeni sayaç başlangıç endeksi (kWh)" value={0} onValueChange={() => undefined} min={0} hint="Yeni sayaç sıfırdan başlar" />
        {meter.multiZone ? <NumberField label="Son endeks T2 (kWh)" value={t2} onValueChange={setT2} min={0} /> : null}
        {meter.multiZone ? <NumberField label="Son endeks T3 (kWh)" value={t3} onValueChange={setT3} min={0} /> : null}
        <Input label="Yeni mühür no" value={seal} onChange={(e) => setSeal(e.target.value)} placeholder="MH-000000" />
        <Select label="Değişim nedeni" value={reason} onValueChange={(v) => setReason(v ?? "muayene")} items={[{ value: "muayene", label: "Muayene süresi doldu" }, { value: "ariza", label: "Sayaç arızası" }, { value: "mudahale", label: "Müdahale tespiti" }, { value: "donusum", label: "Akıllı sayaca dönüşüm" }]} />
      </div>
    </Dialog>
  );
}

function FaultDialog({ open, onClose, serial, onCreate }: { open: boolean; onClose: () => void; serial: string; onCreate: (code: string, kind: string) => void }) {
  const [kind, setKind] = useState("iletisim");
  const [note, setNote] = useState("");
  const KINDS = [
    { value: "iletisim", label: "İletişim modülü arızası" },
    { value: "olcum", label: "Ölçüm devresi arızası" },
    { value: "ekran", label: "Ekran / gösterge arızası" },
    { value: "mudahale", label: "Müdahale şüphesi" },
  ];
  const label = KINDS.find((k) => k.value === kind)?.label ?? "";
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Arıza kaydı aç"
      description={`${serial} için saha ekibine iş emri üretilir.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button variant="primary" onClick={() => onCreate("AK-30942", label)}>Kaydı aç</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Select label="Arıza türü" value={kind} onValueChange={(v) => setKind(v ?? "iletisim")} items={KINDS} />
        <Textarea label="Açıklama" value={note} onChange={(e) => setNote(e.target.value)} minRows={3} hint="Örnek: sayaç ekranı kapalı, abone bildirdi." />
      </div>
    </Dialog>
  );
}

/* ═══════════════════════════════ SAYFA ═══════════════════════════════ */

export function SayaclarPage(props: PageProps) {
  if (props.params.id) return <MeterDetail id={props.params.id} go={props.go} />;
  return <MeterList {...props} />;
}

