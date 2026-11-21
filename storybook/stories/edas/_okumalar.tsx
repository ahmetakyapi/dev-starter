"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarClock,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileSpreadsheet,
  Gauge,
  RadioTower,
  Send,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { AreaChart } from "@/components/ui/area-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox, type ComboboxItem } from "@/components/ui/combobox";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-field";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { SelectionAction, SelectionBar } from "@/components/ui/selection-bar";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { TabLinks } from "@/components/ui/tabs";
import { TickMeter } from "@/components/ui/tick-meter";
import {
  CURRENT_PERIOD,
  FLAG_LABEL,
  METERS,
  PERIODS_12,
  READINGS,
  SOURCE_LABEL,
  TODAY_KEY,
  customer,
  dayLabel,
  kwh,
  meterById,
  num,
  num1,
  periodLabel,
  readingsOf,
  region,
  type Meter,
  type Reading,
  type ReadingFlag,
  type ReadingSource,
} from "./_data";
import { READER_NAMES, buildImportRows, buildRoutes, readingDelay, type ImportRow, type Route } from "./_data-sayac";
import { IconTile, MetricStrip, PageBody, PageHead, Panel, ReadingBadge, SampleNote, href, useApp, type PageProps } from "./_ui";

/**
 * Okumalar: dönem okumaları. Dört sekme, hepsi adresten okunur (`tab`):
 *   tur (saha tur planı) · giris (elle okuma girişi) · supheli (anomali inceleme) · aktar (toplu içe aktarma).
 * `?id=R-…` bir okumanın ayrıntı çekmecesini açar; `?status=supheli` şüpheli sekmesine gider.
 * Girilen okuma, çözülen şüpheli ve içe aktarma sayfanın iç durumudur: veri değişmez,
 * ama tur planı ilerlemesi, KPI'lar ve listeler bu durumla birlikte güncellenir.
 */

type Tab = "tur" | "giris" | "supheli" | "aktar";
const TABS: readonly { id: Tab; label: string }[] = [
  { id: "tur", label: "Tur planı" },
  { id: "giris", label: "Okuma girişi" },
  { id: "supheli", label: "Şüpheli okumalar" },
  { id: "aktar", label: "Toplu içe aktarma" },
];
const tabOf = (params: PageProps["params"]): Tab => {
  if (TABS.some((t) => t.id === params.tab)) return params.tab as Tab;
  if (params.status === "supheli") return "supheli";
  return "tur";
};

type Resolution = "dogrulandi" | "duzeltildi" | "yeniden" | "tahmini";
const RESOLUTION_LABEL: Record<Resolution, string> = { dogrulandi: "Onaylandı", duzeltildi: "Düzeltildi", yeniden: "Yeniden okuma istendi", tahmini: "Tahmini yazıldı" };

type Entry = { meterId: string; at: string; source: ReadingSource; total: number; flags: readonly ReadingFlag[] };

const FLAG_HINT: Record<ReadingFlag, string> = {
  "geri-sayim": "Endeks önceki dönemden küçük. Sayaç değişmiş, sıfırlanmış ya da yanlış okunmuş olabilir.",
  "ani-sicrama": "Tüketim beklenenin çok üstünde. Kaçak kullanım, yanlış çarpan ya da okuma hatası olabilir.",
  "dusuk-tuketim": "Tüketim beklenenin çok altında. Sayaç durmuş, bypass ya da boş konut olabilir.",
  "kapak-acma": "Klemens kapağı açma kaydı var. Mühür ve bağlantı yerinde kontrol edilmeli.",
  manyetik: "Manyetik alan kaydı var. Sayaca dışarıdan müdahale şüphesi.",
  "faz-kaybi": "Bir fazda gerilim ya da akım yok. Ölçüm eksik kalmış olabilir.",
};
const FLAG_TONE: Record<ReadingFlag, "danger" | "warning"> = { "geri-sayim": "danger", "ani-sicrama": "warning", "dusuk-tuketim": "warning", "kapak-acma": "danger", manyetik: "danger", "faz-kaybi": "warning" };

/** Aynı sayacın o dönemden önceki üç doğrulanmış okumasının ortalaması (kWh). */
function expectedUsage(meterId: string, before?: string) {
  const prior = readingsOf(meterId).filter((r) => r.status !== "bekliyor" && !r.flags.length && (!before || r.period < before)).slice(-3);
  return prior.length ? Math.round(prior.reduce((s, r) => s + r.usage.total, 0) / prior.length) : 0;
}

const Mono = ({ children }: { children: ReactNode }) => <span className="edas-mono">{children}</span>;

/** Kaynak dağılımı: pay HER ZAMAN toplama göre (ilk satıra göre değil); sayı ve yüzde metinde. */
function SourceBars({ sources }: { sources: readonly { label: string; value: number }[] }) {
  const total = sources.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <ul aria-label="Okuma kaynağı dağılımı" className="grid gap-3">
      {sources.map((s) => (
        <li key={s.label} className="grid grid-cols-[7.5rem_1fr_5.5rem] items-center gap-3 text-base">
          <span className="text-body">{s.label}</span>
          <span aria-hidden className="h-2.5 overflow-hidden rounded-full bg-chart-track">
            <span className="block h-full rounded-full bg-chart-1" style={{ width: `${(s.value / total) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums text-strong">
            {num.format(s.value)} <span className="text-small text-muted">%{Math.round((s.value / total) * 100)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

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

/* ═══════════════════════════ SAYFA ═══════════════════════════ */

export function OkumalarPage({ params, go }: PageProps) {
  const { notify } = useApp();
  const tab = tabOf(params);
  const [period, setPeriod] = useState<string>(params.status === "supheli" ? "all" : CURRENT_PERIOD);
  const [readers, setReaders] = useState<Record<string, string>>({});
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [resolved, setResolved] = useState<Record<string, Resolution>>({});
  const [prefill, setPrefill] = useState<string | null>(params.meter ?? null);

  const inPeriod = useMemo(() => (period === "all" ? READINGS : READINGS.filter((r) => r.period === period)), [period]);
  const doneCount = inPeriod.filter((r) => r.status !== "bekliyor" || entries[r.meterId]).length;
  const pending = inPeriod.length - doneCount;
  const suspect = inPeriod.filter((r) => r.status === "supheli" && !resolved[r.id]).length;
  const estimated = inPeriod.filter((r) => r.source === "tahmini").length;
  const read = inPeriod.filter((r) => r.status !== "bekliyor");
  const avgDelay = read.length ? read.reduce((s, r) => s + readingDelay(r), 0) / read.length : 0;

  const sources = (["uzaktan", "saha", "beyan", "tahmini"] as const).map((s) => ({ label: SOURCE_LABEL[s], value: inPeriod.filter((r) => r.source === s).length }));

  const open = params.id ? READINGS.find((r) => r.id === params.id) : undefined;
  const closeSheet = () => go("readings", { tab: tab === "tur" && !params.tab ? undefined : tab, status: params.status });
  const resolve = (id: string, how: Resolution) => {
    setResolved((p) => ({ ...p, [id]: how }));
    const r = READINGS.find((x) => x.id === id);
    notify({ title: RESOLUTION_LABEL[how], body: r ? `${meterById(r.meterId)?.serial ?? r.meterId} · ${periodLabel(r.period)}` : id, tone: "success" });
  };

  return (
    <>
      <PageHead
        title="Okumalar"
        description="Dönem okumaları, saha turları, endeks girişi ve anomali incelemesi."
        actions={
          <>
            <Select label="Dönem" hideLabel placeholder="Dönem" value={period} onValueChange={(v) => setPeriod(v ?? CURRENT_PERIOD)} items={[{ value: "all", label: "Bütün dönemler" }, ...[...PERIODS_12].reverse().map((p) => ({ value: p, label: periodLabel(p) }))]} className="min-w-44" />
            <Button variant="secondary" size="sm" onClick={() => go("rawdata")}>
              Ham veri
            </Button>
          </>
        }
      />
      <PageBody>
        <MetricStrip>
          <Cell icon={<BookOpenCheck />} label="Okunma oranı" value={`%${num1.format(inPeriod.length ? (doneCount / inPeriod.length) * 100 : 0)}`} foot={`${num.format(doneCount)} / ${num.format(inPeriod.length)} sayaç okundu`} tone="success" />
          <Cell icon={<Clock3 />} label="Okuma bekleyen" value={num.format(pending)} foot={period === CURRENT_PERIOD ? "Dönem sonuna kadar planlı" : "Seçili dönemde"} tone={pending ? "warning" : "neutral"} />
          <Cell icon={<ShieldAlert />} label="Şüpheli okuma" value={num.format(suspect)} foot={`${num.format(Object.keys(resolved).length)} okuma bu oturumda çözüldü`} tone={suspect ? "danger" : "neutral"} />
          <Cell icon={<AlertTriangle />} label="Tahmini okuma" value={num.format(estimated)} foot={`%${num1.format(inPeriod.length ? (estimated / inPeriod.length) * 100 : 0)} · saha turuna kaldı`} tone={estimated ? "warning" : "neutral"} />
          <Cell icon={<CalendarClock />} label="Ortalama gecikme" value={`${num1.format(avgDelay)} gün`} foot="Planlanan okuma gününe göre" />
          <Cell icon={<Gauge />} label="Bu oturumda girilen" value={num.format(Object.keys(entries).length)} foot="Okuma girişi sekmesinden" tone="primary" />
        </MetricStrip>

        <Panel title="Okuma kaynakları" note={`${period === "all" ? "Son 12 dönem" : periodLabel(period)}: kayıt başına okuma yolu`} id="kaynaklar">
          <div className="grid gap-5 p-4 sm:p-5 md:grid-cols-2">
            <SourceBars sources={sources} />
            <p className="text-base text-muted">
              Uzaktan okuma ne kadar yüksekse saha maliyeti o kadar düşük. Tahmini okuma bir sonraki turda gerçekle değiştirilmezse fatura yanlış çıkar:
              tahmini kayıtlar <button type="button" className="font-semibold text-primary-ink hover:underline" onClick={() => go("readings", { tab: "tur" })}>tur planına</button> eklenmelidir.
            </p>
          </div>
        </Panel>

        <div className="min-w-0">
          <TabLinks aria-label="Okuma sayfaları" current={href("readings", { tab })} items={TABS.map((t) => ({ href: href("readings", { tab: t.id }), label: t.id === "supheli" && suspect ? `${t.label} ${num.format(suspect)}` : t.label }))} />
        </div>

        {tab === "tur" ? <RoutesTab readers={readers} setReaders={setReaders} entries={entries} go={go} /> : null}
        {tab === "giris" ? <EntryTab entries={entries} setEntries={setEntries} prefill={prefill} setPrefill={setPrefill} go={go} /> : null}
        {tab === "supheli" ? <SuspectTab period={period} resolved={resolved} resolve={resolve} go={go} tab={tab} /> : null}
        {tab === "aktar" ? <ImportTab /> : null}
        <SampleNote />
      </PageBody>

      <ReadingSheet reading={open} resolved={open ? resolved[open.id] : undefined} onResolve={resolve} onClose={closeSheet} go={go} />
    </>
  );
}

/* ═══════════════════════════ TUR PLANI ═══════════════════════════ */

function RoutesTab({ readers, setReaders, entries, go }: { readers: Record<string, string>; setReaders: (fn: (p: Record<string, string>) => Record<string, string>) => void; entries: Record<string, Entry>; go: PageProps["go"] }) {
  const { notify } = useApp();
  const routes = useMemo(() => buildRoutes(), []);
  const [openId, setOpenId] = useState<string>(routes[0].regionId);
  const [sent, setSent] = useState<ReadonlySet<string>>(new Set());
  const route = routes.find((r) => r.regionId === openId) ?? routes[0];

  const stats = (r: Route) => {
    const total = r.meters.length;
    const done = r.meters.filter((x) => x.done || entries[x.meter.id]).length;
    return { total, done };
  };

  type RouteRow = Route["meters"][number] & { n: number };
  const rows: RouteRow[] = route.meters.map((x, i) => ({ ...x, n: i + 1 }));
  const columns: readonly Column<RouteRow>[] = [
    { key: "n", header: "Sıra", numeric: true, width: "4rem", render: (r) => <Mono>{r.n}</Mono> },
    { key: "meter", header: "Sayaç", render: (r) => <a href={href("meters", { id: r.meter.id })} className="font-semibold text-strong hover:underline"><Mono>{r.meter.serial}</Mono></a> },
    { key: "customer", header: "Abone", render: (r) => r.customerName },
    { key: "district", header: "Mahalle", render: (r) => r.district },
    { key: "day", header: "Plan günü", numeric: true, render: (r) => <Mono>Ayın {r.meter.readDay}.</Mono> },
    {
      key: "state",
      header: "Durum",
      render: (r) =>
        r.done || entries[r.meter.id] ? (
          <Badge tone="success" dot>Okundu</Badge>
        ) : r.meter.status === "iletisim-yok" ? (
          <Badge tone="warning" dot>İletişim yok, saha</Badge>
        ) : (
          <Badge tone="neutral" dot>Bekliyor</Badge>
        ),
    },
    {
      key: "act",
      header: <span className="sr-only">İşlem</span>,
      render: (r) =>
        r.done || entries[r.meter.id] ? null : (
          <Button variant="soft" size="sm" onClick={() => go("readings", { tab: "giris", meter: r.meter.id })}>
            Okuma gir
          </Button>
        ),
    },
  ];
  const items: RecordItem[] = rows.map((r) => ({
    id: r.meter.id,
    title: <Mono>{`${r.n}. ${r.meter.serial}`}</Mono>,
    subtitle: `${r.customerName} · ${r.district}`,
    meta: `Plan: ayın ${r.meter.readDay}. günü`,
    status: r.done || entries[r.meter.id] ? <Badge tone="success" dot>Okundu</Badge> : <Badge tone="neutral" dot>Bekliyor</Badge>,
    href: href("readings", { tab: "giris", meter: r.meter.id }),
  }));

  return (
    <>
      <section aria-label="Bölge turları" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {routes.map((r) => {
          const s = stats(r);
          const reader = readers[r.regionId] ?? r.reader;
          const isOpen = r.regionId === openId;
          const isSent = sent.has(r.regionId);
          return (
            <article key={r.regionId} className={`flex flex-col gap-4 rounded-xl bg-overlay p-4 shadow-raised ring-1 ${isOpen ? "ring-primary" : "ring-line"}`}>
              <header className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-read font-semibold text-strong">{r.regionName} bölgesi</h3>
                  <p className="text-small text-muted">{region(r.regionId).districts.join(" · ")}</p>
                </div>
                <Badge tone={s.done === s.total ? "success" : "neutral"} variant="outline">{s.done} / {s.total}</Badge>
              </header>
              <TickMeter label={`${r.regionName} turu ilerlemesi`} value={s.done} max={Math.max(s.total, 1)} ticks={Math.min(Math.max(s.total, 1), 36)} text={`%${Math.round((s.done / Math.max(s.total, 1)) * 100)}`} />
              <Select label="Okuyucu" value={reader} onValueChange={(v) => setReaders((p) => ({ ...p, [r.regionId]: v ?? reader }))} items={READER_NAMES.map((n) => ({ value: n, label: n }))} />
              <div className="mt-auto flex flex-wrap gap-2">
                <Button variant={isOpen ? "primary" : "secondary"} size="sm" onClick={() => setOpenId(r.regionId)} aria-pressed={isOpen}>
                  <ClipboardList aria-hidden /> Rotayı göster
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isSent}
                  onClick={() => {
                    setSent((p) => new Set(p).add(r.regionId));
                    notify({ title: "Tur okuyucuya gönderildi", body: `${r.regionName}: ${reader}, ${s.total - s.done} sayaç.`, tone: "success" });
                  }}
                >
                  {isSent ? <CheckCircle2 aria-hidden /> : <Send aria-hidden />} {isSent ? "Gönderildi" : "Okuyucuya gönder"}
                </Button>
              </div>
            </article>
          );
        })}
      </section>

      <Panel title={`${route.regionName} rotası`} note={`${readers[route.regionId] ?? route.reader} · ${route.meters.length} sayaç, mahalleye göre sıralı`} id="rota">
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<ClipboardList />} title="Bu bölgede saha okuması gereken sayaç yok" hint="Bütün sayaçlar uzaktan okunuyor." />
          </div>
        ) : (
          <>
            <div className="max-md:hidden">
              <DataTable<RouteRow> caption={`${route.regionName} saha okuma rotası`} columns={columns} rows={rows.slice(0, 30)} rowKey={(r) => r.meter.id} density="compact" on="surface" stickyFirst={false} minWidth="44rem" />
            </div>
            <div className="px-3 pb-3 md:hidden">
              <RecordList label={`${route.regionName} saha okuma rotası`} items={items.slice(0, 30)} />
            </div>
            {rows.length > 30 ? <p className="border-t border-line-soft px-4 py-3 text-small text-muted">İlk 30 durak gösteriliyor; kalan {rows.length - 30} durak okuyucunun cihazındaki rotada.</p> : null}
          </>
        )}
      </Panel>
    </>
  );
}

/* ═══════════════════════════ OKUMA GİRİŞİ ═══════════════════════════ */

const METER_ITEMS: readonly ComboboxItem[] = METERS.map((m) => ({ value: m.id, label: `${m.serial} · ${customer(m.customerId).name}` }));

type Check = { tone: "success" | "warning" | "danger"; text: string };

function EntryTab({ entries, setEntries, prefill, setPrefill, go }: { entries: Record<string, Entry>; setEntries: (fn: (p: Record<string, Entry>) => Record<string, Entry>) => void; prefill: string | null; setPrefill: (id: string | null) => void; go: PageProps["go"] }) {
  const { notify } = useApp();
  const [picked, setPicked] = useState<ComboboxItem | null>(() => (prefill ? (METER_ITEMS.find((i) => i.value === prefill) ?? null) : null));
  const meter = picked ? meterById(picked.value) : undefined;
  const [idx, setIdx] = useState<{ t1: number | null; t2: number | null; t3: number | null }>({ t1: null, t2: null, t3: null });
  const [react, setReact] = useState<number | null>(null);
  const [capacitive, setCapacitive] = useState<number | null>(null);
  const [demand, setDemand] = useState<number | null>(null);
  const [source, setSource] = useState<ReadingSource>("saha");
  const [date, setDate] = useState(TODAY_KEY);
  const [photo, setPhoto] = useState<string | null>(null);
  const [override, setOverride] = useState(false);

  const choose = (item: ComboboxItem | null) => {
    setPicked(item);
    setPrefill(null);
    setIdx({ t1: null, t2: null, t3: null });
    setReact(null);
    setCapacitive(null);
    setDemand(null);
    setPhoto(null);
    setOverride(false);
  };

  const prev = useMemo(() => {
    if (!meter) return null;
    const last = readingsOf(meter.id).filter((r) => r.status !== "bekliyor").at(-1);
    return last ? { index: last.index, period: last.period, usage: last.usage.total } : { index: meter.base, period: "", usage: 0 };
  }, [meter]);
  const expected = meter ? expectedUsage(meter.id) : 0;

  const fillExpected = () => {
    if (!meter || !prev) return;
    const per = expected / Math.max(meter.multiplier, 1);
    setIdx({ t1: Math.round(prev.index.t1 + per * (meter.multiZone ? 0.46 : 1)), t2: meter.multiZone ? Math.round(prev.index.t2 + per * 0.3) : 0, t3: meter.multiZone ? Math.round(prev.index.t3 + per * 0.24) : 0 });
    setReact(Math.round(expected * 0.24));
    setCapacitive(Math.round(expected * 0.02));
    setDemand(Math.round((expected / 720) * 3.4 * 10) / 10);
  };

  // Anlık doğrulama: girilen endeksten dönem tüketimi, beklenenle karşılaştırma.
  const calc = useMemo(() => {
    if (!meter || !prev || idx.t1 === null) return null;
    const t = (cur: number | null, old: number) => (cur === null ? null : Math.round((cur - old) * meter.multiplier));
    const u1 = t(idx.t1, prev.index.t1);
    const u2 = meter.multiZone ? t(idx.t2, prev.index.t2) : 0;
    const u3 = meter.multiZone ? t(idx.t3, prev.index.t3) : 0;
    if (u1 === null || u2 === null || u3 === null) return null;
    const total = u1 + u2 + u3;
    const checks: Check[] = [];
    const reverse = [u1, u2, u3].some((u) => u < 0);
    if (reverse) checks.push({ tone: "danger", text: "Endeks önceki okumadan küçük (geri sayım). Sayaç değişimi ya da yanlış okuma olabilir." });
    if (!reverse && expected > 0 && total > expected * 2.5) checks.push({ tone: "warning", text: `Tüketim beklenenin ${num1.format(total / expected)} katı: ani sıçrama. Okumayı yeniden doğrulayın.` });
    if (!reverse && expected > 0 && total < expected * 0.25) checks.push({ tone: "warning", text: "Tüketim beklenenin çeyreğinin altında: sayaç durmuş ya da boş konut olabilir." });
    if (!reverse && expected > 0 && total >= expected * 0.7 && total <= expected * 1.3) checks.push({ tone: "success", text: "Tüketim beklenen aralıkta (±%30)." });
    if (!reverse && expected > 0 && total > expected * 1.3 && total <= expected * 2.5) checks.push({ tone: "warning", text: "Tüketim beklenenin üstünde ama makul sınırlarda; mevsim etkisi olabilir." });
    if (!reverse && expected > 0 && total >= expected * 0.25 && total < expected * 0.7) checks.push({ tone: "warning", text: "Tüketim beklenenin altında; abone değişimi ya da uzun süre kapalı kalma olabilir." });
    if (source === "tahmini") checks.push({ tone: "warning", text: "Tahmini okuma: bir sonraki turda gerçek okumayla değiştirilmeli." });
    if (!photo && source === "saha") checks.push({ tone: "warning", text: "Saha okumasında sayaç fotoğrafı yok; denetim için eklenmesi önerilir." });
    return { u1, u2, u3, total, checks, reverse };
  }, [meter, prev, idx, expected, source, photo]);

  const blocked = !!calc?.reverse && !override;
  const canSave = !!meter && !!calc && !blocked;

  const save = () => {
    if (!meter || !calc) return;
    const flags: ReadingFlag[] = [];
    if (calc.reverse) flags.push("geri-sayim");
    else if (expected > 0 && calc.total > expected * 2.5) flags.push("ani-sicrama");
    else if (expected > 0 && calc.total < expected * 0.25) flags.push("dusuk-tuketim");
    setEntries((p) => ({ ...p, [meter.id]: { meterId: meter.id, at: date, source, total: calc.total, flags } }));
    notify({ title: flags.length ? "Okuma kaydedildi, şüpheli listesine düştü" : "Okuma kaydedildi", body: `${meter.serial}: ${kwh(calc.total)} · ${SOURCE_LABEL[source]}`, tone: "success" });
    choose(null);
  };

  const entryList = Object.values(entries).reverse();
  const entryColumns: readonly Column<Entry>[] = [
    { key: "m", header: "Sayaç", render: (e) => <a href={href("meters", { id: e.meterId })} className="font-semibold text-strong hover:underline"><Mono>{meterById(e.meterId)?.serial}</Mono></a> },
    { key: "c", header: "Abone", render: (e) => customer(meterById(e.meterId)!.customerId).name },
    { key: "u", header: "Tüketim", numeric: true, render: (e) => <Mono>{kwh(e.total)}</Mono> },
    { key: "s", header: "Kaynak", render: (e) => SOURCE_LABEL[e.source] },
    { key: "f", header: "Sonuç", render: (e) => (e.flags.length ? <Badge tone="danger" dot>{FLAG_LABEL[e.flags[0]]}</Badge> : <Badge tone="success" dot>Doğrulandı</Badge>) },
  ];

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-3">
      <div className="grid min-w-0 content-start gap-5 xl:col-span-2">
        <Panel title="Okuma girişi" note="Sayacı seçin, endeksi yazın: doğrulama anında çalışır" id="giris">
          <div className="grid gap-5 p-4 sm:p-5">
            <Combobox label="Sayaç" items={METER_ITEMS} value={picked} onValueChange={choose} placeholder="Seri no ya da abone adı yazın" emptyText="Eşleşen sayaç yok" />

            {!meter || !prev ? (
              <EmptyState icon={<Gauge />} variant="inline" title="Önce bir sayaç seçin." hint="Seri numarası, abone adı ya da tesisat numarasıyla arayabilirsiniz." />
            ) : (
              <>
                <MeterBrief meter={meter} prev={prev} expected={expected} go={go} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-read font-semibold text-strong">Yeni endeksler</h3>
                  <Button variant="soft" size="sm" onClick={fillExpected}>Beklenen endeksi doldur</Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <NumberField label="T1 endeks (kWh)" value={idx.t1} onValueChange={(v) => setIdx((p) => ({ ...p, t1: v }))} min={0} hint={`Önceki: ${num.format(prev.index.t1)}`} />
                  {meter.multiZone ? <NumberField label="T2 endeks (kWh)" value={idx.t2} onValueChange={(v) => setIdx((p) => ({ ...p, t2: v }))} min={0} hint={`Önceki: ${num.format(prev.index.t2)}`} /> : null}
                  {meter.multiZone ? <NumberField label="T3 endeks (kWh)" value={idx.t3} onValueChange={(v) => setIdx((p) => ({ ...p, t3: v }))} min={0} hint={`Önceki: ${num.format(prev.index.t3)}`} /> : null}
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <NumberField label="Endüktif reaktif (kVArh)" value={react} onValueChange={setReact} min={0} />
                  <NumberField label="Kapasitif reaktif (kVArh)" value={capacitive} onValueChange={setCapacitive} min={0} />
                  <NumberField label="Talep gücü (kW)" value={demand} onValueChange={setDemand} min={0} step={0.1} format={{ maximumFractionDigits: 1 }} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select label="Okuma kaynağı" value={source} onValueChange={(v) => setSource((v as ReadingSource) ?? "saha")} items={(["saha", "beyan", "tahmini"] as const).map((s) => ({ value: s, label: SOURCE_LABEL[s] }))} />
                  <Input label="Okuma tarihi" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <FileDropzone
                  label="Sayaç fotoğrafı"
                  hint={photo ? `Eklendi: ${photo}` : "PNG ya da JPEG, en çok 5 MB. Endeks ekranı net görünmeli."}
                  accept={["image/png", "image/jpeg"]}
                  onFiles={(ok) => ok[0] && setPhoto(ok[0].name)}
                />
                <div className="flex items-center gap-2 text-small text-muted"><Camera aria-hidden className="size-4" /> Fotoğraf denetim izine eklenir; abone itirazında kanıt olur.</div>
              </>
            )}
          </div>
        </Panel>
      </div>

      <aside aria-label="Doğrulama ve girilenler" className="grid min-w-0 content-start gap-5">
        <Panel title="Anlık doğrulama" id="dogrulama">
          <div className="grid gap-4 p-4 sm:p-5">
            {!calc ? (
              <p className="text-base text-muted">Endeksi yazınca dönem tüketimi ve kontroller burada görünür.</p>
            ) : (
              <>
                <dl className="grid grid-cols-2 gap-3">
                  <div><dt className="text-small text-muted">Dönem tüketimi</dt><dd className="text-heading font-semibold text-strong tabular-nums">{kwh(calc.total)}</dd></div>
                  <div><dt className="text-small text-muted">Beklenen (son 3 ay)</dt><dd className="text-heading font-semibold text-strong tabular-nums">{expected ? kwh(expected) : "—"}</dd></div>
                  <div><dt className="text-small text-muted">T1 tüketim</dt><dd className="text-base text-body tabular-nums">{kwh(calc.u1)}</dd></div>
                  {meter?.multiZone ? <div><dt className="text-small text-muted">T2 · T3</dt><dd className="text-base text-body tabular-nums">{kwh(calc.u2)} · {kwh(calc.u3)}</dd></div> : <div><dt className="text-small text-muted">Çarpan</dt><dd className="text-base text-body">×{meter?.multiplier}</dd></div>}
                </dl>
                {expected > 0 ? <TickMeter label="Beklenene göre" value={Math.max(0, Math.round(calc.total))} max={Math.max(expected, 1)} ticks={20} text={`%${Math.round((Math.max(calc.total, 0) / expected) * 100)}`} /> : null}
                <ul aria-label="Doğrulama sonuçları" className="grid gap-2">
                  {calc.checks.map((c, i) => (
                    <li key={i} className={`flex items-start gap-2 rounded-lg p-3 text-base ${c.tone === "success" ? "bg-success-wash text-strong" : c.tone === "danger" ? "bg-danger-wash text-strong" : "bg-warning-wash text-strong"}`}>
                      {c.tone === "success" ? <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-success" /> : <AlertTriangle aria-hidden className={`mt-0.5 size-4 shrink-0 ${c.tone === "danger" ? "text-danger" : "text-warning"}`} />}
                      <span><span className="sr-only">{c.tone === "success" ? "Uygun: " : c.tone === "danger" ? "Hata: " : "Uyarı: "}</span>{c.text}</span>
                    </li>
                  ))}
                </ul>
                {calc.reverse ? <Checkbox label="Yine de kaydet (şüpheli olarak işaretlenir)" checked={override} onChange={(e) => setOverride(e.target.checked)} /> : null}
              </>
            )}
            <Button variant="primary" onClick={save} disabled={!canSave}>
              Okumayı kaydet
            </Button>
          </div>
        </Panel>

        <Panel title="Bu oturumda girilenler" note={`${entryList.length} okuma`} id="girilenler">
          {entryList.length === 0 ? (
            <p className="p-4 text-base text-muted sm:p-5">Henüz okuma girilmedi.</p>
          ) : (
            <DataTable<Entry> caption="Bu oturumda girilen okumalar" columns={entryColumns} rows={entryList} rowKey={(e) => e.meterId} density="compact" on="surface" stickyFirst={false} minWidth="30rem" />
          )}
        </Panel>
      </aside>
    </div>
  );
}

function MeterBrief({ meter, prev, expected, go }: { meter: Meter; prev: { index: { t1: number; t2: number; t3: number }; period: string; usage: number }; expected: number; go: PageProps["go"] }) {
  const c = customer(meter.customerId);
  return (
    <div className="grid gap-3 rounded-xl bg-surface p-4 sm:grid-cols-3">
      <div className="min-w-0">
        <p className="text-small text-muted">Abone</p>
        <a href={href("customers", { id: c.id })} className="font-semibold text-strong hover:underline">{c.name}</a>
        <p className="text-small text-muted">Tesisat <Mono>{c.installation}</Mono> · {c.district}</p>
      </div>
      <div>
        <p className="text-small text-muted">Önceki okuma{prev.period ? ` (${periodLabel(prev.period)})` : ""}</p>
        <p className="text-base font-semibold text-strong tabular-nums">T1 {num.format(prev.index.t1)}{meter.multiZone ? <> · T2 {num.format(prev.index.t2)} · T3 {num.format(prev.index.t3)}</> : null}</p>
        <p className="text-small text-muted">Çarpan ×{meter.multiplier} · beklenen {expected ? kwh(expected) : "bilinmiyor"}</p>
      </div>
      <div className="flex items-end sm:justify-end">
        <Button variant="ghost" size="sm" onClick={() => go("meters", { id: meter.id })}>Sayaç ayrıntısı</Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════ ŞÜPHELİ OKUMALAR ═══════════════════════════ */

function SuspectTab({ period, resolved, resolve, go, tab }: { period: string; resolved: Record<string, Resolution>; resolve: (id: string, how: Resolution) => void; go: PageProps["go"]; tab: Tab }) {
  const { notify } = useApp();
  const [showResolved, setShowResolved] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const base = useMemo(() => READINGS.filter((r) => r.status === "supheli" && (period === "all" || r.period === period)), [period]);
  const rows = base.filter((r) => showResolved || !resolved[r.id]);
  const open = rows.filter((r) => !resolved[r.id]);
  const allSelected = open.length > 0 && open.every((r) => selected.has(r.id));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const columns: readonly Column<Reading>[] = [
    {
      key: "sel",
      header: <Checkbox aria-label="Bütün açık şüpheli okumaları seç" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(open.map((r) => r.id)))} />,
      width: "3rem",
      render: (r) => (resolved[r.id] ? null : <Checkbox aria-label={`${r.id} okumasını seç`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} />),
    },
    { key: "r", header: "Okuma", render: (r) => <a href={href("readings", { tab, id: r.id })} className="font-semibold text-strong hover:underline"><Mono>{r.id}</Mono></a> },
    { key: "p", header: "Dönem", render: (r) => periodLabel(r.period) },
    {
      key: "m",
      header: "Sayaç ve abone",
      render: (r) => (
        <span className="grid">
          <a href={href("meters", { id: r.meterId })} className="text-body hover:text-strong hover:underline"><Mono>{meterById(r.meterId)?.serial}</Mono></a>
          <span className="text-small text-muted">{customer(r.customerId).name}</span>
        </span>
      ),
    },
    { key: "f", header: "Bayrak", render: (r) => <span className="flex flex-wrap gap-1">{r.flags.length ? r.flags.map((f) => <Badge key={f} tone={FLAG_TONE[f]} dot>{FLAG_LABEL[f]}</Badge>) : <Badge tone="warning" dot>Tahmini okuma</Badge>}</span> },
    {
      key: "u",
      header: "Tüketim / beklenen",
      numeric: true,
      render: (r) => {
        const exp = expectedUsage(r.meterId, r.period);
        return <Mono>{kwh(r.usage.total)}{exp ? ` / ${kwh(exp)}` : ""}</Mono>;
      },
    },
    { key: "s", header: "Durum", render: (r) => (resolved[r.id] ? <Badge tone="success" dot>{RESOLUTION_LABEL[resolved[r.id]]}</Badge> : <ReadingBadge status={r.status} />) },
    { key: "a", header: <span className="sr-only">İşlem</span>, render: (r) => <Button variant="soft" size="sm" onClick={() => go("readings", { tab, id: r.id })}>İncele</Button> },
  ];
  const items: RecordItem[] = rows.map((r) => ({
    id: r.id,
    title: <Mono>{meterById(r.meterId)?.serial}</Mono>,
    subtitle: `${customer(r.customerId).name} · ${periodLabel(r.period)}`,
    value: kwh(r.usage.total),
    meta: r.flags.length ? FLAG_LABEL[r.flags[0]] : "Tahmini okuma",
    status: resolved[r.id] ? <Badge tone="success" dot>{RESOLUTION_LABEL[resolved[r.id]]}</Badge> : <ReadingBadge status={r.status} />,
    href: href("readings", { tab, id: r.id }),
  }));

  return (
    <>
      <Panel
        title="Şüpheli okumalar"
        note={`${num.format(open.length)} açık · ${num.format(base.length - open.length)} çözüldü${period === "all" ? " · bütün dönemler" : ` · ${periodLabel(period)}`}`}
        id="supheli"
        actions={<Checkbox label="Çözülenleri de göster" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />}
      >
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<CheckCircle2 />} title="Açık şüpheli okuma yok" hint={period === "all" ? "Bütün okumalar incelendi." : "Bu dönemde şüpheli okuma kalmadı; dönem seçiciden başka bir dönem deneyin."} />
          </div>
        ) : (
          <>
            <div className="max-md:hidden">
              <DataTable<Reading> caption="Şüpheli okumalar" columns={columns} rows={rows.slice(0, 40)} rowKey={(r) => r.id} density="compact" on="surface" stickyFirst={false} minWidth="60rem" />
            </div>
            <div className="px-3 pb-3 md:hidden">
              <RecordList label="Şüpheli okumalar" items={items.slice(0, 40)} />
            </div>
          </>
        )}
      </Panel>

      <SelectionBar count={selected.size} noun="okuma" onClear={() => setSelected(new Set())}>
        <SelectionAction
          icon={<CheckCircle2 />}
          onClick={() => {
            selected.forEach((id) => resolve(id, "dogrulandi"));
            notify({ title: `${selected.size} okuma onaylandı`, body: "Faturalama için serbest bırakıldı.", tone: "success" });
            setSelected(new Set());
          }}
        >
          Seçilenleri onayla
        </SelectionAction>
        <SelectionAction
          icon={<RadioTower />}
          onClick={() => {
            selected.forEach((id) => resolve(id, "yeniden"));
            setSelected(new Set());
          }}
        >
          Yeniden okuma iste
        </SelectionAction>
      </SelectionBar>
    </>
  );
}

/* ═══════════════════════════ OKUMA AYRINTISI ═══════════════════════════ */

function ReadingSheet({ reading, resolved, onResolve, onClose, go }: { reading: Reading | undefined; resolved: Resolution | undefined; onResolve: (id: string, how: Resolution) => void; onClose: () => void; go: PageProps["go"] }) {
  const [fixing, setFixing] = useState(false);
  const [fixed, setFixed] = useState<number | null>(null);
  const meter = reading ? meterById(reading.meterId) : undefined;
  const c = reading ? customer(reading.customerId) : undefined;
  const history = reading ? readingsOf(reading.meterId).filter((r) => r.status !== "bekliyor" && r.period <= reading.period).slice(-7) : [];
  const exp = reading ? expectedUsage(reading.meterId, reading.period) : 0;
  const isSuspect = !!reading && reading.status === "supheli" && !resolved;
  /** Karar verilince çekmece kapanır: liste güncellenmiş haliyle görünür. */
  const decide = (id: string, how: Resolution) => {
    onResolve(id, how);
    setFixing(false);
    setFixed(null);
    onClose();
  };

  return (
    <Sheet
      open={!!reading}
      onOpenChange={(o) => {
        if (!o) {
          setFixing(false);
          setFixed(null);
          onClose();
        }
      }}
      side="right"
      size="lg"
      title={reading ? `Okuma ${reading.id}` : "Okuma"}
      description={reading && meter && c ? `${meter.serial} · ${c.name} · ${periodLabel(reading.period)}` : undefined}
      icon={<BookOpenCheck />}
      status={reading ? (resolved ? <Badge tone="success" dot>{RESOLUTION_LABEL[resolved]}</Badge> : <ReadingBadge status={reading.status} />) : undefined}
      footerStart={
        isSuspect && reading ? (
          <Button variant="ghost" onClick={() => decide(reading.id, "yeniden")}>
            <RadioTower aria-hidden /> Yeniden okuma iste
          </Button>
        ) : undefined
      }
      footer={
        isSuspect && reading ? (
          <>
            <Button variant="secondary" onClick={() => decide(reading.id, "tahmini")}>Tahmini yaz</Button>
            <Button variant="secondary" onClick={() => setFixing((v) => !v)} aria-expanded={fixing}>Düzelt</Button>
            <Button variant="primary" onClick={() => decide(reading.id, "dogrulandi")}>Onayla</Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>Kapat</Button>
        )
      }
    >
      {reading && meter && c ? (
        <div className="grid gap-5">
          {reading.flags.length ? (
            <ul aria-label="Okuma bayrakları" className="grid gap-2">
              {reading.flags.map((f) => (
                <li key={f} className="flex items-start gap-2 rounded-lg bg-warning-wash p-3 text-base text-strong">
                  <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
                  <span><strong className="font-semibold">{FLAG_LABEL[f]}.</strong> {FLAG_HINT[f]}</span>
                </li>
              ))}
            </ul>
          ) : reading.status === "bekliyor" ? (
            <p className="rounded-lg bg-surface p-3 text-base text-muted">Bu okuma henüz yapılmadı; planlanan gün {dayLabel(reading.date)}.</p>
          ) : null}

          {fixing && isSuspect ? (
            <div className="grid gap-3 rounded-xl bg-surface p-4">
              <NumberField label="Düzeltilmiş T1 endeks (kWh)" value={fixed ?? reading.index.t1} onValueChange={setFixed} min={0} />
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={() => decide(reading.id, "duzeltildi")}>Düzeltmeyi kaydet</Button>
                <Button variant="ghost" size="sm" onClick={() => setFixing(false)}>Vazgeç</Button>
              </div>
            </div>
          ) : null}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            <Fact label="Sayaç"><a href={href("meters", { id: meter.id })} className="font-medium text-primary-ink hover:underline"><Mono>{meter.serial}</Mono></a></Fact>
            <Fact label="Abone"><a href={href("customers", { id: c.id })} className="font-medium text-primary-ink hover:underline">{c.name}</a></Fact>
            <Fact label="Okuma günü">{dayLabel(reading.date)}</Fact>
            <Fact label="Kaynak">{SOURCE_LABEL[reading.source]}</Fact>
            <Fact label="Çarpan"><Mono>×{meter.multiplier}</Mono></Fact>
            <Fact label="Gecikme">{readingDelay(reading)} gün</Fact>
          </dl>

          <div className="overflow-x-auto rounded-xl ring-1 ring-line-soft">
            <table className="w-full min-w-[26rem] border-collapse text-base">
              <caption className="sr-only">Endeks ve tüketim</caption>
              <thead>
                <tr className="bg-surface text-left text-small text-muted">
                  <th scope="col" className="px-3 py-2 font-medium">Zaman dilimi</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Endeks (kWh)</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Tüketim (kWh)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {(meter.multiZone ? ([["T1 · Gündüz", "t1"], ["T2 · Puant", "t2"], ["T3 · Gece", "t3"]] as const) : ([["Tek zaman", "t1"]] as const)).map(([label, key]) => (
                  <tr key={key}>
                    <th scope="row" className="px-3 py-2 text-left font-medium text-strong">{label}</th>
                    <td className="px-3 py-2 text-right tabular-nums">{reading.status === "bekliyor" ? "—" : num.format(reading.index[key])}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{reading.status === "bekliyor" ? "—" : num.format(reading.usage[key])}</td>
                  </tr>
                ))}
                <tr className="bg-surface font-semibold text-strong">
                  <th scope="row" className="px-3 py-2 text-left">Toplam</th>
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2 text-right tabular-nums">{reading.status === "bekliyor" ? "—" : num.format(reading.usage.total)}</td>
                </tr>
                <tr>
                  <th scope="row" className="px-3 py-2 text-left font-medium text-strong">Reaktif (endüktif · kapasitif)</th>
                  <td colSpan={2} className="px-3 py-2 text-right tabular-nums">{num.format(reading.reactive.inductive)} · {num.format(reading.reactive.capacitive)} kVArh</td>
                </tr>
                <tr>
                  <th scope="row" className="px-3 py-2 text-left font-medium text-strong">Talep gücü</th>
                  <td colSpan={2} className="px-3 py-2 text-right tabular-nums">{num1.format(reading.demandKw)} kW</td>
                </tr>
              </tbody>
            </table>
          </div>

          {history.length >= 2 ? (
            <div>
              <h3 className="mb-2 text-read font-semibold text-strong">Önceki dönemlerle karşılaştırma</h3>
              <AreaChart
                title={`${meter.serial} dönem tüketimi`}
                labels={history.map((r) => periodLabel(r.period).split(" ")[0].slice(0, 3))}
                series={[{ label: "Tüketim", values: history.map((r) => r.usage.total), series: 1 }]}
                unit="kWh"
                height="h-44"
                bands={reading.status !== "bekliyor" ? [{ from: history.length - 1, label: "Bu okuma", tone: reading.status === "supheli" ? "danger" : "neutral" }] : []}
              />
              {exp ? <p className="mt-2 text-small text-muted">Önceki üç doğrulanmış okumanın ortalaması {kwh(exp)}; bu okuma {reading.usage.total ? `%${Math.round((reading.usage.total / exp) * 100)}` : "—"} düzeyinde.</p> : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-line-soft pt-4">
            <Button variant="secondary" size="sm" onClick={() => go("meters", { id: meter.id })}>Sayaç ayrıntısı</Button>
            <Button variant="secondary" size="sm" onClick={() => go("invoices", { customer: c.id })}>Faturalar</Button>
          </div>
        </div>
      ) : null}
    </Sheet>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-small text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-base text-strong">{children}</dd>
    </div>
  );
}

/* ═══════════════════════════ TOPLU İÇE AKTARMA ═══════════════════════════ */

const PROBLEM_LABEL: Record<NonNullable<ImportRow["problem"]>["kind"], string> = { eslesmeyen: "Eşleşmeyen sayaç", tarih: "Tarih biçimi", tekrar: "Tekrarlanan satır", geri: "Endeks geriye gidiyor" };

function ImportTab() {
  const { notify } = useApp();
  const [file, setFile] = useState<{ name: string; size: string } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [imported, setImported] = useState<number | null>(null);
  const rows = useMemo(() => (file ? buildImportRows() : []), [file]);
  const bad = rows.filter((r) => r.problem);
  const good = rows.filter((r) => !r.problem);

  const badColumns: readonly Column<ImportRow>[] = [
    { key: "line", header: "Satır", numeric: true, width: "4.5rem", render: (r) => <Mono>{r.line}</Mono> },
    { key: "serial", header: "Seri no", render: (r) => <Mono>{r.serial}</Mono> },
    { key: "kind", header: "Sorun", render: (r) => <Badge tone={r.problem!.kind === "tekrar" ? "warning" : "danger"} dot>{PROBLEM_LABEL[r.problem!.kind]}</Badge> },
    { key: "msg", header: "Açıklama", render: (r) => r.problem!.message },
  ];
  const goodColumns: readonly Column<ImportRow>[] = [
    { key: "line", header: "Satır", numeric: true, width: "4.5rem", render: (r) => <Mono>{r.line}</Mono> },
    { key: "serial", header: "Seri no", render: (r) => <Mono>{r.serial}</Mono> },
    { key: "date", header: "Tarih", render: (r) => <Mono>{r.date}</Mono> },
    { key: "t1", header: "T1", numeric: true, render: (r) => <Mono>{num.format(r.t1)}</Mono> },
    { key: "t2", header: "T2", numeric: true, render: (r) => <Mono>{r.t2 ? num.format(r.t2) : "—"}</Mono> },
    { key: "t3", header: "T3", numeric: true, render: (r) => <Mono>{r.t3 ? num.format(r.t3) : "—"}</Mono> },
  ];
  const badItems: RecordItem[] = bad.map((r) => ({ id: String(r.line), title: `Satır ${r.line} · ${r.serial}`, subtitle: r.problem!.message, status: <Badge tone="danger" dot>{PROBLEM_LABEL[r.problem!.kind]}</Badge> }));

  if (imported !== null) {
    return (
      <Panel title="Toplu içe aktarma" id="aktar">
        <div className="p-6">
          <EmptyState
            icon={<CheckCircle2 />}
            title={`${num.format(imported)} okuma içe aktarıldı`}
            hint={`${bad.length} hatalı satır aktarılmadı; hata raporu indirilebilir. Aktarılan okumalar doğrulama kuyruğuna düştü.`}
            action={<Button variant="secondary" size="sm" onClick={() => { setImported(null); setFile(null); }}>Yeni dosya yükle</Button>}
          />
        </div>
      </Panel>
    );
  }

  return (
    <>
      <Panel title="Toplu içe aktarma" note="Saha okuma cihazından ya da harici sistemden gelen CSV; önce doğrulanır, sonra aktarılır" id="aktar">
        <div className="grid gap-5 p-4 sm:p-5">
          {!file ? (
            <>
              <FileDropzone
                label="CSV dosyası bırakın"
                hint="Sütunlar: seri_no; tarih (YYYY-AA-GG); t1; t2; t3. En çok 5 MB."
                accept={["text/csv", "application/vnd.ms-excel"]}
                onFiles={(ok) => ok[0] && setFile({ name: ok[0].name, size: `${num1.format(ok[0].size / 1024)} KB` })}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => setFile({ name: "saha-okuma-2026-11-21.csv", size: "3,2 KB" })}>
                  <FileSpreadsheet aria-hidden /> Örnek dosyayı kullan
                </Button>
                <span className="text-small text-muted">Demoda dosya içeriği okunmaz; örnek bir dosya gösterilir.</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface p-4">
                <div className="flex items-center gap-3">
                  <IconTile tone="primary"><FileSpreadsheet /></IconTile>
                  <div>
                    <p className="font-semibold text-strong">{file.name}</p>
                    <p className="text-small text-muted">{file.size} · {num.format(rows.length)} satır okundu</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Başka dosya</Button>
              </div>
              <dl className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-surface p-4"><dt className="text-small text-muted">Toplam satır</dt><dd className="text-heading font-semibold text-strong tabular-nums">{num.format(rows.length)}</dd></div>
                <div className="rounded-xl bg-success-wash p-4"><dt className="text-small text-muted">Geçerli</dt><dd className="text-heading font-semibold text-strong tabular-nums">{num.format(good.length)}</dd></div>
                <div className="rounded-xl bg-danger-wash p-4"><dt className="text-small text-muted">Hatalı</dt><dd className="text-heading font-semibold text-strong tabular-nums">{num.format(bad.length)}</dd></div>
              </dl>
            </>
          )}
        </div>
      </Panel>

      {file ? (
        <>
          <Panel
            title="Hata raporu"
            note={`${bad.length} satır aktarılmaz`}
            id="hatalar"
            actions={<Button variant="secondary" size="sm" onClick={() => notify({ title: "Hata raporu hazırlandı", body: "hata-raporu-2026-11-21.csv", tone: "success" })}><Upload aria-hidden className="rotate-180" /> Raporu indir</Button>}
          >
            <div className="max-md:hidden">
              <DataTable<ImportRow> caption="İçe aktarma hata raporu" columns={badColumns} rows={bad} rowKey={(r) => String(r.line)} density="compact" on="surface" stickyFirst={false} minWidth="40rem" />
            </div>
            <div className="px-3 pb-3 md:hidden">
              <RecordList label="İçe aktarma hata raporu" items={badItems} />
            </div>
          </Panel>

          <Panel
            title="Aktarılacak satırlar"
            note={`${good.length} geçerli satırın ilk 8'i`}
            id="gecerli"
            actions={
              <Button variant="primary" size="sm" onClick={() => setConfirm(true)} disabled={good.length === 0}>
                Geçerli satırları aktar ({good.length})
              </Button>
            }
          >
            <DataTable<ImportRow> caption="Aktarılacak geçerli satırlar" columns={goodColumns} rows={good.slice(0, 8)} rowKey={(r) => String(r.line)} density="compact" on="surface" stickyFirst={false} minWidth="30rem" />
          </Panel>
        </>
      ) : null}

      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Geçerli satırları aktar"
        description={`${good.length} okuma içe aktarılacak, ${bad.length} hatalı satır atlanacak. Aktarılan okumalar doğrulama kuyruğuna girer.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>Vazgeç</Button>
            <Button
              variant="primary"
              onClick={() => {
                setConfirm(false);
                setImported(good.length);
                notify({ title: `${good.length} okuma içe aktarıldı`, body: `${bad.length} hatalı satır atlandı.`, tone: "success" });
              }}
            >
              Aktar
            </Button>
          </>
        }
      >
        <p className="text-base text-body">Bu işlem geri alınabilir: içe aktarılan okumalar doğrulanana kadar faturalamaya girmez.</p>
      </Dialog>
    </>
  );
}
