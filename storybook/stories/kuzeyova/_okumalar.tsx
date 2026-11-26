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
import { useDerived } from "./_core";
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
  meterById,
  periodLabel,
  region,
  type Meter,
  type Reading,
  type ReadingFlag,
  type ReadingSource,
} from "./_data";
import { READER_NAMES, buildImportRows, buildRoutesLive, downloadCsv, readingDelay, readingUi, type EntryLogItem, type ImportRow, type Route } from "./_data-sayac";
import { PolicyChecks } from "@/components/ui/policy-checks";
import { FactorList } from "@/components/ui/factor-list";
import { OptionCards } from "@/components/ui/option-cards";
import { effectiveReadings, enterReading, resolveReading, useMeterOps, type ReadingDecision } from "./_ops";
import { audit } from "./_audit";
import { useCan } from "./_permissions";
import { Metric, fmtDec, fmtKwh, fmtNum, fmtPct } from "./_kit";
import { IconTile, MetricStrip, PageBody, PageHead, Panel, ReadingBadge, href, useApp, type PageProps } from "./_ui";

/**
 * Okumalar: dönem okumaları. Dört sekme, hepsi adresten okunur (`tab`):
 *   tur (saha tur planı) · giris (elle okuma girişi) · supheli (anomali inceleme) · aktar (toplu içe aktarma).
 * `?id=R-…` bir okumanın ayrıntı çekmecesini açar; `?status=supheli` şüpheli sekmesine gider.
 *
 * VARSAYILAN SEKME: şüpheli okuma varsa "Şüpheli okumalar" (rozetli; sayfanın asıl işi);
 * yoksa "Tur planı".
 *
 * Her işlem DEPOYA yazılır (`_ops.ts`): girilen okuma, onay/düzeltme/tahmini ve
 * toplu içe aktarma okumanın kendisini değiştirir; rozet, Pano ve faturalama
 * denetimi aynı kaynaktan okur. Okuyucu atamaları, gönderilen turlar ve oturum
 * girişleri modül düzeyinde bir dilimde durur: başka sayfaya gidip dönünce
 * kaybolmaz. Onaylanmamış (şüpheli) okuma tahakkuka girmez; onay faturaya serbest bırakır.
 */

type Tab = "tur" | "giris" | "supheli" | "aktar";
const TABS: readonly { id: Tab; label: string }[] = [
  { id: "tur", label: "Tur Planı" },
  { id: "giris", label: "Okuma Girişi" },
  { id: "supheli", label: "Şüpheli Okumalar" },
  { id: "aktar", label: "Toplu İçe Aktarma" },
];
const tabOf = (params: PageProps["params"], suspectOpen: number): Tab => {
  if (TABS.some((t) => t.id === params.tab)) return params.tab as Tab;
  if (params.status === "supheli") return "supheli";
  return suspectOpen > 0 ? "supheli" : "tur";
};

type Resolution = "dogrulandi" | "duzeltildi" | "yeniden" | "tahmini";
const RESOLUTION_LABEL: Record<Resolution, string> = { dogrulandi: "Onaylandı", duzeltildi: "Düzeltildi", yeniden: "Yeniden okuma istendi", tahmini: "Tahmini yazıldı" };
const DECISION: Record<Resolution, ReadingDecision> = { dogrulandi: "onayla", duzeltildi: "duzelt", yeniden: "yeniden", tahmini: "tahmini" };

/** Okumanın son çözüm durumu (depodan): yamalı okumada `duzeltildi`/`dogrulandi`. */
const resolutionOf = (r: Reading, base: Reading | undefined): Resolution | undefined => {
  if (!base || base.status !== "supheli") return undefined;
  if (r.status === "duzeltildi") return "duzeltildi";
  if (r.status === "bekliyor") return "yeniden";
  if (r.status === "dogrulandi") return r.source === "tahmini" ? "tahmini" : "dogrulandi";
  return undefined;
};

const FLAG_HINT: Record<ReadingFlag, string> = {
  "geri-sayim": "Endeks önceki dönemden küçük. Sayaç değişmiş, sıfırlanmış, taşmış ya da yanlış okunmuş olabilir.",
  "ani-sicrama": "Tüketim beklenenin çok üstünde. Kaçak kullanım, yanlış çarpan ya da okuma hatası olabilir.",
  "dusuk-tuketim": "Tüketim beklenenin çok altında. Sayaç durmuş, bypass ya da boş konut olabilir.",
  "kapak-acma": "Klemens kapağı açma kaydı var. Mühür ve bağlantı yerinde kontrol edilmeli.",
  manyetik: "Manyetik alan kaydı var. Sayaca dışarıdan müdahale şüphesi.",
  "faz-kaybi": "Bir fazda gerilim ya da akım yok. Ölçüm eksik kalmış olabilir.",
};
const FLAG_TONE: Record<ReadingFlag, "danger" | "warning"> = { "geri-sayim": "danger", "ani-sicrama": "warning", "dusuk-tuketim": "warning", "kapak-acma": "danger", manyetik: "danger", "faz-kaybi": "warning" };

/** Aynı sayacın o dönemden önceki üç doğrulanmış okumasının ortalaması (kWh). */
function expectedUsage(meterId: string, before?: string) {
  const prior = effectiveReadings().filter((r) => r.meterId === meterId && r.status !== "bekliyor" && !r.flags.length && (!before || r.period < before)).slice(-3);
  return prior.length ? Math.round(prior.reduce((s, r) => s + r.usage.total, 0) / prior.length) : 0;
}
const readingsOf = (meterId: string) => effectiveReadings().filter((r) => r.meterId === meterId);
const currentReadingOf = (meterId: string) => effectiveReadings().find((r) => r.meterId === meterId && r.period === CURRENT_PERIOD);

const Mono = ({ children }: { children: ReactNode }) => <span className="kz-mono">{children}</span>;
const num = { format: (n: number) => fmtNum(n) };
const num1 = { format: (n: number) => fmtDec(n) };
const kwh = fmtKwh;

/** Kaynak dağılımı: pay HER ZAMAN toplama göre; sıfır olan kaynaklar gizlenir (neden altta yazılı). */
function SourceBars({ sources }: { sources: readonly { label: string; value: number }[] }) {
  const total = sources.reduce((s, x) => s + x.value, 0) || 1;
  const shown = sources.filter((s) => s.value > 0);
  return (
    <ul aria-label="Okuma Kaynağı Dağılımı" className="grid gap-3">
      {shown.map((s) => (
        <li key={s.label} className="grid grid-cols-[7.5rem_1fr_5.5rem] items-center gap-3 text-base">
          <span className="text-body">{s.label}</span>
          <span aria-hidden className="h-2.5 overflow-hidden rounded-full bg-chart-track">
            <span className="block h-full rounded-full bg-chart-1" style={{ width: `${(s.value / total) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums text-strong">
            {fmtNum(s.value)} <span className="text-small text-muted">{s.value / total < 0.01 ? "<%1" : `%${Math.round((s.value / total) * 100)}`}</span>
          </span>
        </li>
      ))}
      {shown.length < sources.length ? <li className="text-small text-muted">Kullanılmayan kaynaklar gizlendi: {sources.filter((s) => s.value === 0).map((s) => s.label).join(", ")}.</li> : null}
    </ul>
  );
}

/* ═══════════════════════════ SAYFA ═══════════════════════════ */

export function OkumalarPage({ params, go }: PageProps) {
  const { notify } = useApp();
  const canApprove = useCan("okuma");
  const ui = readingUi.use();
  const all = useDerived(effectiveReadings);
  const [period, setPeriod] = useState<string>(params.status === "supheli" ? "all" : CURRENT_PERIOD);
  const [prefill, setPrefill] = useState<string | null>(params.meter ?? null);

  const inPeriod = useMemo(() => (period === "all" ? all : all.filter((r) => r.period === period)), [all, period]);
  const doneCount = inPeriod.filter((r) => r.status !== "bekliyor").length;
  const pending = inPeriod.length - doneCount;
  const suspect = inPeriod.filter((r) => r.status === "supheli").length;
  const suspectCurrent = all.filter((r) => r.status === "supheli" && r.period === CURRENT_PERIOD).length;
  const estimated = inPeriod.filter((r) => r.source === "tahmini").length;
  const read = inPeriod.filter((r) => r.status !== "bekliyor");
  const avgDelay = read.length ? read.reduce((s, r) => s + readingDelay(r), 0) / read.length : 0;
  const resolvedCount = useMemo(() => READINGS.filter((b) => b.status === "supheli" && (period === "all" || b.period === period) && all.find((r) => r.id === b.id)?.status !== "supheli").length, [all, period]);

  const tab = tabOf(params, suspectCurrent);
  const sources = (["uzaktan", "saha", "beyan", "tahmini"] as const).map((s) => ({ label: SOURCE_LABEL[s], value: inPeriod.filter((r) => r.source === s).length }));

  const open = params.id ? all.find((r) => r.id === params.id) : undefined;
  const closeSheet = () => go("readings", { tab: params.tab, status: params.status });
  const resolve = (id: string, how: Resolution, note?: string) => {
    if (!canApprove) {
      notify({ title: "Yetki Yok", body: "Okuma onayı ve düzeltme yetkiniz yok.", tone: "info" });
      return;
    }
    resolveReading(id, DECISION[how], note);
    const r = all.find((x) => x.id === id);
    notify({
      title: RESOLUTION_LABEL[how],
      body: `${r ? `${meterById(r.meterId)?.serial ?? r.meterId} · ${periodLabel(r.period)}` : id}${how === "dogrulandi" || how === "duzeltildi" ? " · faturalamaya serbest bırakıldı" : how === "tahmini" ? " · bir sonraki gerçek okumada mahsup edilecek" : " · saha turuna eklendi"}`,
      tone: "success",
    });
  };

  return (
    <>
      <PageHead
        title="Okumalar"
        description="Dönem okumaları, saha turları, endeks girişi ve anomali incelemesi. Onaylanmamış okuma faturalanmaz."
        actions={
          <>
            <Select label="Dönem" hideLabel placeholder="Dönem" value={period} onValueChange={(v) => setPeriod(v ?? CURRENT_PERIOD)} items={[{ value: "all", label: "Bütün Dönemler" }, ...[...PERIODS_12].reverse().map((p) => ({ value: p, label: periodLabel(p) }))]} className="min-w-44" />
            <Button variant="secondary" size="sm" onClick={() => go("rawdata")}>
              Ham Veri
            </Button>
          </>
        }
      />
      <PageBody>
        <MetricStrip>
          <Metric icon={<BookOpenCheck />} label="Okunma Oranı" value={fmtPct(inPeriod.length ? (doneCount / inPeriod.length) * 100 : 0)} foot={`${fmtNum(doneCount)} / ${fmtNum(inPeriod.length)} sayaç okundu`} />
          <Metric icon={<Clock3 />} label="Okuma Bekleyen" value={fmtNum(pending)} foot={period === CURRENT_PERIOD ? "Dönem sonuna dek" : "Seçili dönemde"} to={{ page: "readings", params: { tab: "tur" } }} />
          <Metric icon={<ShieldAlert />} label="Şüpheli Okuma" value={fmtNum(suspect)} foot={`${fmtNum(resolvedCount)} okuma çözüldü`} to={{ page: "readings", params: { tab: "supheli" } }} />
          <Metric icon={<AlertTriangle />} label="Tahmini Okuma" value={fmtNum(estimated)} foot={`${fmtPct(inPeriod.length ? (estimated / inPeriod.length) * 100 : 0)} · mahsup`} />
          <Metric icon={<CalendarClock />} label="Ortalama Gecikme" value={fmtDec(avgDelay)} unit="gün" foot="Plan gününe göre" />
          <Metric icon={<Gauge />} label="Girilen Okuma" value={fmtNum(ui.entries.length)} foot="Giriş sekmesinden" to={{ page: "readings", params: { tab: "giris" } }} />
        </MetricStrip>

        <Panel title="Okuma Kaynakları" note={`${period === "all" ? "Son 12 dönem" : periodLabel(period)}: kayıt başına okuma yolu`} id="kaynaklar">
          <div className="grid gap-5 p-4 sm:p-5 md:grid-cols-2">
            <SourceBars sources={sources} />
            <p className="text-base text-muted">
              Uzaktan okuma ne kadar yüksekse saha maliyeti o kadar düşük. Tahmini okuma bir sonraki turda gerçekle değiştirilmezse fatura yanlış çıkar:
              tahmini kayıtlar <button type="button" className="font-semibold text-primary-ink hover:underline" onClick={() => go("readings", { tab: "tur" })}>tur planına</button> eklenmelidir.
            </p>
          </div>
        </Panel>
        <div className="min-w-0">
          <TabLinks aria-label="Okuma Sayfaları" current={href("readings", { tab })} items={TABS.map((t) => ({ href: href("readings", { tab: t.id }), label: t.id === "supheli" && suspectCurrent ? `${t.label} ${fmtNum(suspectCurrent)}` : t.label }))} />
        </div>

        {tab === "tur" ? <RoutesTab go={go} /> : null}
        {tab === "giris" ? <EntryTab prefill={prefill} setPrefill={setPrefill} /> : null}
        {tab === "supheli" ? <SuspectTab period={period} go={go} tab={tab} /> : null}
        {tab === "aktar" ? <ImportTab /> : null}
      </PageBody>

      <ReadingSheet reading={open} onResolve={resolve} onClose={closeSheet} go={go} />
    </>
  );
}

/* ═══════════════════════════ TUR PLANI ═══════════════════════════ */

function RoutesTab({ go }: { go: PageProps["go"] }) {
  const { notify } = useApp();
  const ui = readingUi.use();
  const ops = useMeterOps();
  const routes = useDerived(() => buildRoutesLive(effectiveReadings(), new Set(Object.entries(ops).filter(([, o]) => o.inRoute).map(([id]) => id))), [ops]);
  const [openId, setOpenId] = useState<string>(routes[0].regionId);
  const route = routes.find((r) => r.regionId === openId) ?? routes[0];

  const stats = (r: Route) => ({ total: r.meters.length, done: r.meters.filter((x) => x.done).length });

  type RouteRow = Route["meters"][number] & { n: number };
  const rows: RouteRow[] = route.meters.map((x, i) => ({ ...x, n: i + 1 }));
  const columns: readonly Column<RouteRow>[] = [
    { key: "n", header: "Sıra", numeric: true, width: "4rem", render: (r) => <Mono>{r.n}</Mono> },
    { key: "meter", header: "Sayaç", render: (r) => <a href={href("meters", { id: r.meter.id })} className="font-semibold text-strong hover:underline"><Mono>{r.meter.serial}</Mono></a> },
    { key: "customer", header: "Abone", render: (r) => r.customerName },
    { key: "district", header: "Mahalle", render: (r) => r.district },
    { key: "day", header: "Plan Günü", numeric: true, render: (r) => <Mono>Ayın {r.meter.readDay}.</Mono> },
    {
      key: "state",
      header: "Durum",
      render: (r) =>
        r.done ? (
          <Badge tone="success" dot>Okundu</Badge>
        ) : r.meter.status === "iletisim-yok" ? (
          <Badge tone="warning" dot>İletişim yok, saha</Badge>
        ) : r.added ? (
          <Badge tone="primary" dot>Elle eklendi</Badge>
        ) : (
          <Badge tone="neutral" dot>Bekliyor</Badge>
        ),
    },
    {
      key: "act",
      header: <span className="sr-only">İşlem</span>,
      render: (r) =>
        r.done ? null : (
          <Button variant="soft" size="sm" onClick={() => go("readings", { tab: "giris", meter: r.meter.id })}>
            Okuma Gir
          </Button>
        ),
    },
  ];
  const items: RecordItem[] = rows.map((r) => ({
    id: r.meter.id,
    title: <Mono>{`${r.n}. ${r.meter.serial}`}</Mono>,
    subtitle: `${r.customerName} · ${r.district}`,
    meta: `Plan: ayın ${r.meter.readDay}. günü`,
    status: r.done ? <Badge tone="success" dot>Okundu</Badge> : <Badge tone="neutral" dot>Bekliyor</Badge>,
    href: href("readings", { tab: "giris", meter: r.meter.id }),
  }));

  return (
    <>
      <section aria-label="Bölge Turları" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {routes.map((r) => {
          const s = stats(r);
          const reader = ui.readers[r.regionId] ?? r.reader;
          const isOpen = r.regionId === openId;
          const isSent = ui.sent.includes(r.regionId);
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
              <Select
                label="Okuyucu"
                value={reader}
                onValueChange={(v) => {
                  const next = v ?? reader;
                  readingUi.set((u) => ({ ...u, readers: { ...u.readers, [r.regionId]: next } }));
                  audit("Okuyucu atadı", `${r.regionName} turu`, reader, next);
                }}
                items={READER_NAMES.map((n) => ({ value: n, label: n }))}
              />
              <div className="mt-auto flex flex-wrap gap-2">
                <Button variant={isOpen ? "primary" : "secondary"} size="sm" onClick={() => setOpenId(r.regionId)} aria-pressed={isOpen}>
                  <ClipboardList aria-hidden /> Rotayı Göster
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isSent}
                  onClick={() => {
                    readingUi.set((u) => ({ ...u, sent: [...u.sent, r.regionId] }));
                    audit("Turu okuyucuya gönderdi", `${r.regionName} turu`, undefined, `${reader} · ${s.total - s.done} sayaç`);
                    notify({ title: "Tur Okuyucuya Gönderildi", body: `${r.regionName}: ${reader}, ${s.total - s.done} sayaç.`, tone: "success", undo: () => readingUi.set((u) => ({ ...u, sent: u.sent.filter((x) => x !== r.regionId) })) });
                  }}
                >
                  {isSent ? <CheckCircle2 aria-hidden /> : <Send aria-hidden />} {isSent ? "Gönderildi" : "Okuyucuya gönder"}
                </Button>
              </div>
            </article>
          );
        })}
      </section>

      <Panel title={`${route.regionName} rotası`} note={`${ui.readers[route.regionId] ?? route.reader} · ${route.meters.length} sayaç, mahalleye göre sıralı`} id="rota" actions={<Button variant="secondary" size="sm" onClick={() => go("field")}>Saha Okuma Ekranı</Button>}>
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
const DIGITS = [{ value: "6", label: "6 Haneli (999.999)" }, { value: "7", label: "7 Haneli" }, { value: "9", label: "9 Haneli" }];

type Check = { tone: "success" | "warning" | "danger"; text: string };

function EntryTab({ prefill, setPrefill }: { prefill: string | null; setPrefill: (id: string | null) => void }) {
  const { notify, navigate: go } = useApp();
  const canApprove = useCan("okuma");
  const ui = readingUi.use();
  const entries = ui.entries;
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
  const [rollover, setRollover] = useState(false);
  const [digits, setDigits] = useState("6");

  const choose = (item: ComboboxItem | null) => {
    setPicked(item);
    setPrefill(null);
    setIdx({ t1: null, t2: null, t3: null });
    setReact(null);
    setCapacitive(null);
    setDemand(null);
    setPhoto(null);
    setOverride(false);
    setRollover(false);
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
    const cap = 10 ** Number(digits);
    const t = (cur: number | null, old: number) => (cur === null ? null : Math.round((rollover && cur < old ? cur + cap - old : cur - old) * meter.multiplier));
    const u1 = t(idx.t1, prev.index.t1);
    const u2 = meter.multiZone ? t(idx.t2, prev.index.t2) : 0;
    const u3 = meter.multiZone ? t(idx.t3, prev.index.t3) : 0;
    if (u1 === null || u2 === null || u3 === null) return null;
    const total = u1 + u2 + u3;
    const checks: Check[] = [];
    const reverse = [u1, u2, u3].some((u) => u < 0);
    if (rollover && idx.t1 !== null && idx.t1 < prev.index.t1) checks.push({ tone: "warning", text: `Sayaç taşması (${digits} haneli) olarak işlendi: tüketim ${digits === "6" ? "999.999" : digits === "7" ? "9.999.999" : "999.999.999"} sınırını aşıp sıfırdan devam etti. Mühür ve sayaç tipi kontrol edilmeli.` });
    if (reverse) checks.push({ tone: "danger", text: "Endeks önceki okumadan küçük (geri sayım). Sayaç değişimi ya da yanlış okuma olabilir." });
    if (!reverse && expected > 0 && total > expected * 2.5) checks.push({ tone: "warning", text: `Tüketim beklenenin ${num1.format(total / expected)} katı: ani sıçrama. Okumayı yeniden doğrulayın.` });
    if (!reverse && expected > 0 && total < expected * 0.25) checks.push({ tone: "warning", text: "Tüketim beklenenin çeyreğinin altında: sayaç durmuş ya da boş konut olabilir." });
    if (!reverse && expected > 0 && total >= expected * 0.7 && total <= expected * 1.3) checks.push({ tone: "success", text: "Tüketim beklenen aralıkta (±%30)." });
    if (!reverse && expected > 0 && total > expected * 1.3 && total <= expected * 2.5) checks.push({ tone: "warning", text: "Tüketim beklenenin üstünde ama makul sınırlarda; mevsim etkisi olabilir." });
    if (!reverse && expected > 0 && total >= expected * 0.25 && total < expected * 0.7) checks.push({ tone: "warning", text: "Tüketim beklenenin altında; abone değişimi ya da uzun süre kapalı kalma olabilir." });
    if (source === "tahmini") checks.push({ tone: "warning", text: "Tahmini okuma: bir sonraki turda gerçek okumayla değiştirilmeli." });
    if (!photo && source === "saha") checks.push({ tone: "warning", text: "Saha okumasında sayaç fotoğrafı yok; denetim için eklenmesi önerilir." });
    return { u1, u2, u3, total, checks, reverse };
  }, [meter, prev, idx, expected, source, photo, rollover, digits]);

  const blocked = !!calc?.reverse && !override;
  const canSave = !!meter && !!calc && !blocked;

  const save = () => {
    if (!meter || !calc || !prev) return;
    if (!canApprove) {
      notify({ title: "Yetki Yok", body: "Okuma girme yetkiniz yok.", tone: "info" });
      return;
    }
    const target = currentReadingOf(meter.id);
    if (!target) {
      notify({ title: "Okuma Kaydı Yok", body: "Bu sayaç için bu dönem planlanmış okuma bulunamadı.", tone: "info" });
      return;
    }
    const flags: ReadingFlag[] = [];
    if (calc.reverse) flags.push("geri-sayim");
    else if (expected > 0 && calc.total > expected * 2.5) flags.push("ani-sicrama");
    else if (expected > 0 && calc.total < expected * 0.25) flags.push("dusuk-tuketim");
    enterReading(target.id, {
      source,
      index: { t1: idx.t1 ?? 0, t2: meter.multiZone ? (idx.t2 ?? 0) : 0, t3: meter.multiZone ? (idx.t3 ?? 0) : 0 },
      usage: { t1: calc.u1, t2: calc.u2, t3: calc.u3, total: calc.total },
      reactive: { inductive: react ?? 0, capacitive: capacitive ?? 0 },
      demandKw: demand ?? 0,
      flags,
    });
    readingUi.set((u) => ({ ...u, entries: [...u.entries, { meterId: meter.id, readingId: target.id, at: date, source, total: calc.total, flags }] }));
    notify({ title: flags.length ? "Okuma kaydedildi, şüpheli listesine düştü" : "Okuma kaydedildi, faturalamaya serbest", body: `${meter.serial}: ${kwh(calc.total)} · ${SOURCE_LABEL[source]}`, tone: "success" });
    choose(null);
  };

  const entryList = [...entries].reverse();
  const entryColumns: readonly Column<EntryLogItem>[] = [
    { key: "m", header: "Sayaç", render: (e) => <a href={href("meters", { id: e.meterId })} className="font-semibold text-strong hover:underline"><Mono>{meterById(e.meterId)?.serial}</Mono></a> },
    { key: "c", header: "Abone", render: (e) => customer(meterById(e.meterId)!.customerId).name },
    { key: "u", header: "Tüketim", numeric: true, render: (e) => <Mono>{kwh(e.total)}</Mono> },
    { key: "s", header: "Kaynak", render: (e) => SOURCE_LABEL[e.source] },
    { key: "f", header: "Sonuç", render: (e) => (e.flags.length ? <Badge tone="danger" dot>{FLAG_LABEL[e.flags[0]]}</Badge> : <Badge tone="success" dot>Doğrulandı</Badge>) },
  ];

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-3">
      <div className="grid min-w-0 content-start gap-5 xl:col-span-2">
        <Panel title="Okuma Girişi" note="Sayacı seçin, endeksi yazın: doğrulama anında çalışır" id="giris">
          <div className="grid gap-5 p-4 sm:p-5">
            <Combobox label="Sayaç" items={METER_ITEMS} value={picked} onValueChange={choose} placeholder="Seri no ya da abone adı yazın" emptyText="Eşleşen sayaç yok" />

            {!meter || !prev ? (
              <EmptyState icon={<Gauge />} variant="inline" title="Önce bir sayaç seçin." hint="Seri numarası, abone adı ya da tesisat numarasıyla arayabilirsiniz." />
            ) : (
              <>
                <MeterBrief meter={meter} prev={prev} expected={expected} go={go} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-read font-semibold text-strong">Yeni Endeksler</h3>
                  <Button variant="soft" size="sm" onClick={fillExpected}>Beklenen Endeksi Doldur</Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <NumberField label="T1 Endeks (kWh)" value={idx.t1} onValueChange={(v) => setIdx((p) => ({ ...p, t1: v }))} min={0} hint={`Önceki: ${num.format(prev.index.t1)}`} />
                  {meter.multiZone ? <NumberField label="T2 Endeks (kWh)" value={idx.t2} onValueChange={(v) => setIdx((p) => ({ ...p, t2: v }))} min={0} hint={`Önceki: ${num.format(prev.index.t2)}`} /> : null}
                  {meter.multiZone ? <NumberField label="T3 Endeks (kWh)" value={idx.t3} onValueChange={(v) => setIdx((p) => ({ ...p, t3: v }))} min={0} hint={`Önceki: ${num.format(prev.index.t3)}`} /> : null}
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <NumberField label="Endüktif Reaktif (kVArh)" value={react} onValueChange={setReact} min={0} />
                  <NumberField label="Kapasitif Reaktif (kVArh)" value={capacitive} onValueChange={setCapacitive} min={0} />
                  <NumberField label="Talep Gücü (kW)" value={demand} onValueChange={setDemand} min={0} step={0.1} format={{ maximumFractionDigits: 1 }} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select label="Okuma Kaynağı" value={source} onValueChange={(v) => setSource((v as ReadingSource) ?? "saha")} items={(["saha", "beyan", "tahmini"] as const).map((s) => ({ value: s, label: SOURCE_LABEL[s] }))} />
                  <Input label="Okuma Tarihi" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <FileDropzone
                  label="Sayaç Fotoğrafı"
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

      <aside aria-label="Doğrulama ve Girilenler" className="grid min-w-0 content-start gap-5">
        <Panel title="Anlık Doğrulama" id="dogrulama">
          <div className="grid gap-4 p-4 sm:p-5">
            {!calc ? (
              <div className="grid gap-3">
                <p className="text-base text-muted">Endeksi yazınca dönem tüketimi ve kontroller burada görünür. Uygulanan kurallar:</p>
                <ul className="grid gap-2 text-small text-body">
                  <li className="flex gap-2"><span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-danger" />Endeks öncekinden küçükse geri sayım (taşma seçeneğiyle meşru döngü işlenir).</li>
                  <li className="flex gap-2"><span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" />Tüketim beklenenin 2,5 katını aşarsa ani sıçrama, çeyreğinin altındaysa düşük tüketim.</li>
                  <li className="flex gap-2"><span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" />Saha okumasında fotoğraf yoksa, tahmini okumada mahsup uyarısı.</li>
                  <li className="flex gap-2"><span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-success" />Beklenen: sayacın son üç doğrulanmış okumasının ortalaması (±%30 uygun).</li>
                </ul>
              </div>
            ) : (
              <>
                <dl className="grid grid-cols-2 gap-3">
                  <div><dt className="text-small text-muted">Dönem tüketimi</dt><dd className="text-heading font-semibold text-strong tabular-nums">{kwh(calc.total)}</dd></div>
                  <div><dt className="text-small text-muted">Beklenen (son 3 ay)</dt><dd className="text-heading font-semibold text-strong tabular-nums">{expected ? kwh(expected) : "—"}</dd></div>
                  <div><dt className="text-small text-muted">T1 Tüketim</dt><dd className="text-base text-body tabular-nums">{kwh(calc.u1)}</dd></div>
                  {meter?.multiZone ? <div><dt className="text-small text-muted">T2 · T3</dt><dd className="text-base text-body tabular-nums">{kwh(calc.u2)} · {kwh(calc.u3)}</dd></div> : <div><dt className="text-small text-muted">Çarpan</dt><dd className="text-base text-body">×{meter?.multiplier}</dd></div>}
                </dl>
                {expected > 0 ? <TickMeter label="Beklenene Göre" value={Math.max(0, Math.round(calc.total))} max={Math.max(expected, 1)} ticks={20} text={`%${Math.round((Math.max(calc.total, 0) / expected) * 100)}`} /> : null}
                <PolicyChecks
                  title="Doğrulama Sonuçları"
                  headingLevel={3}
                  checks={calc.checks.map((c, i) => ({ id: String(i), label: c.text, state: c.tone === "success" ? "pass" : c.tone === "danger" ? "fail" : "warn" }))}
                />
                {calc.reverse ? (
                  <div className="grid gap-3 rounded-lg bg-surface p-3">
                    <label className="flex cursor-pointer items-start gap-3 text-base text-body">
                      <Checkbox aria-label="Sayaç Taştı (Döngü)" checked={rollover} onChange={() => setRollover((v) => !v)} />
                      <span><span className="font-medium text-strong">Sayaç taştı (döngü)</span><span className="block text-small text-muted">Endeks üst sınıra ulaşıp sıfırdan başladıysa meşru bir durumdur; tüketim sınır üzerinden hesaplanır.</span></span>
                    </label>
                    {rollover ? <Select label="Sayaç Hanesi" value={digits} onValueChange={(v) => setDigits(v ?? "6")} items={DIGITS} /> : null}
                    <label className="flex cursor-pointer items-start gap-3 text-base text-body">
                      <Checkbox aria-label="Yine de Kaydet" checked={override} onChange={() => setOverride((v) => !v)} />
                      <span>Yine de kaydet (şüpheli olarak işaretlenir)</span>
                    </label>
                  </div>
                ) : null}
              </>
            )}
            <Button variant="primary" onClick={save} disabled={!canSave}>
              Okumayı Kaydet
            </Button>
          </div>
        </Panel>

        <Panel title="Bu Oturumda Girilenler" note={`${entryList.length} okuma`} id="girilenler">
          {entryList.length === 0 ? (
            <p className="p-4 text-base text-muted sm:p-5">Henüz okuma girilmedi.</p>
          ) : (
            <DataTable<EntryLogItem> caption="Bu oturumda girilen okumalar" columns={entryColumns} rows={entryList} rowKey={(e) => e.readingId} density="compact" on="surface" stickyFirst={false} minWidth="30rem" />
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
        <Button variant="ghost" size="sm" onClick={() => go("meters", { id: meter.id })}>Sayaç Ayrıntısı</Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════ ŞÜPHELİ OKUMALAR ═══════════════════════════ */

function SuspectTab({ period, go, tab }: { period: string; go: PageProps["go"]; tab: Tab }) {
  const { notify } = useApp();
  const canApprove = useCan("okuma");
  const [showResolved, setShowResolved] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const all = useDerived(effectiveReadings);
  const baseList = useMemo(() => READINGS.filter((r) => r.status === "supheli" && (period === "all" || r.period === period)), [period]);
  const eff = useMemo(() => new Map(all.map((r) => [r.id, r])), [all]);
  const base = useMemo(() => baseList.map((b) => eff.get(b.id) ?? b), [baseList, eff]);
  const resolved = useMemo(() => Object.fromEntries(baseList.flatMap((b) => { const how = resolutionOf(eff.get(b.id) ?? b, b); return how ? [[b.id, how] as const] : []; })) as Record<string, Resolution>, [baseList, eff]);
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
      header: <Checkbox aria-label="Bütün Açık Şüpheli Okumaları Seç" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(open.map((r) => r.id)))} />,
      width: "3rem",
      render: (r) => (resolved[r.id] ? null : <Checkbox aria-label={`${r.id} okumasını seç`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} />),
    },
    { key: "r", header: "Okuma", render: (r) => <a href={href("readings", { tab, id: r.id })} className="font-semibold text-strong hover:underline"><Mono>{r.id}</Mono><span className="sr-only">, {periodLabel(r.period)}</span></a> },
    {
      key: "m",
      header: "Sayaç ve Abone",
      render: (r) => (
        <span className="grid">
          <span className="text-body">{customer(r.customerId).name}</span>
          <a href={href("meters", { id: r.meterId })} className="text-small text-muted hover:text-strong hover:underline"><Mono>{meterById(r.meterId)?.serial}</Mono></a>
        </span>
      ),
    },
    { key: "f", header: "Bayrak", render: (r) => <span className="flex flex-wrap gap-1">{r.flags.length ? r.flags.map((f) => <Badge key={f} tone={FLAG_TONE[f]} dot>{FLAG_LABEL[f]}</Badge>) : <Badge tone="warning" dot>Tahmini okuma</Badge>}</span> },
    {
      key: "u",
      header: "Tüketim / Beklenen",
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
        title="Şüpheli Okumalar"
        note={`${num.format(open.length)} açık · ${num.format(base.length - open.length)} çözüldü${period === "all" ? " · bütün dönemler" : ` · ${periodLabel(period)}`}`}
        id="supheli"
        actions={<Checkbox label="Çözülenleri de Göster" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />}
      >
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<CheckCircle2 />} title="Açık Şüpheli Okuma Yok" hint={period === "all" ? "Bütün okumalar incelendi." : "Bu dönemde şüpheli okuma kalmadı; dönem seçiciden başka bir dönem deneyin."} />
          </div>
        ) : (
          <>
            <div className="max-md:hidden">
              <DataTable<Reading> caption="Şüpheli okumalar" columns={columns} rows={rows.slice(0, 40)} rowKey={(r) => r.id} density="compact" on="surface" stickyFirst={false} minWidth="60rem" />
            </div>
            <div className="px-3 pb-3 md:hidden">
              <RecordList label="Şüpheli Okumalar" items={items.slice(0, 40)} />
            </div>
          </>
        )}
      </Panel>

      <SelectionBar count={selected.size} noun="okuma" onClear={() => setSelected(new Set())}>
        <SelectionAction
          icon={<CheckCircle2 />}
          onClick={() => {
            if (!canApprove) return notify({ title: "Yetki Yok", body: "Okuma onayı yetkiniz yok.", tone: "info" });
            selected.forEach((id) => resolveReading(id, "onayla"));
            notify({ title: `${selected.size} okuma onaylandı`, body: "Faturalamaya serbest bırakıldı.", tone: "success" });
            setSelected(new Set());
          }}
        >
          Seçilenleri Onayla
        </SelectionAction>
        <SelectionAction
          icon={<RadioTower />}
          onClick={() => {
            if (!canApprove) return notify({ title: "Yetki Yok", body: "Okuma onayı yetkiniz yok.", tone: "info" });
            selected.forEach((id) => resolveReading(id, "yeniden"));
            notify({ title: `${selected.size} sayaç için yeniden okuma istendi`, body: "Saha turuna eklendi.", tone: "success" });
            setSelected(new Set());
          }}
        >
          Yeniden Okuma İste
        </SelectionAction>
      </SelectionBar>
    </>
  );
}

/* ═══════════════════════════ OKUMA AYRINTISI ═══════════════════════════ */

function ReadingSheet({ reading, onResolve, onClose, go }: { reading: Reading | undefined; onResolve: (id: string, how: Resolution, note?: string) => void; onClose: () => void; go: PageProps["go"] }) {
  const [fixing, setFixing] = useState(false);
  const [fixed, setFixed] = useState<number | null>(null);
  const meter = reading ? meterById(reading.meterId) : undefined;
  const c = reading ? customer(reading.customerId) : undefined;
  const history = reading ? readingsOf(reading.meterId).filter((r) => r.status !== "bekliyor" && r.period <= reading.period).slice(-7) : [];
  const exp = reading ? expectedUsage(reading.meterId, reading.period) : 0;
  const baseReading = reading ? READINGS.find((r) => r.id === reading.id) : undefined;
  const resolved = reading ? resolutionOf(reading, baseReading) : undefined;
  const isSuspect = !!reading && reading.status === "supheli";
  /** Karar verilince çekmece kapanır: liste güncellenmiş haliyle görünür. */
  const decide = (id: string, how: Resolution) => {
    if (how === "duzeltildi" && reading && meter && fixed !== null) {
      const prevIdx = readingsOf(reading.meterId).filter((r) => r.status !== "bekliyor" && r.period < reading.period).at(-1)?.index ?? meter.base;
      const u1 = Math.round((fixed - prevIdx.t1) * meter.multiplier);
      enterReading(id, { source: reading.source, index: { ...reading.index, t1: fixed }, usage: { ...reading.usage, t1: u1, total: u1 + reading.usage.t2 + reading.usage.t3 }, reactive: reading.reactive, demandKw: reading.demandKw, flags: [] });
    }
    onResolve(id, how, how === "duzeltildi" && fixed !== null ? `T1 endeks ${fixed}` : undefined);
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
            <RadioTower aria-hidden /> Yeniden Okuma İste
          </Button>
        ) : undefined
      }
      footer={
        isSuspect && reading ? (
          <>
            <Button variant="secondary" onClick={() => decide(reading.id, "tahmini")}>Tahmini Yaz</Button>
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
            <ul aria-label="Okuma Bayrakları" className="grid gap-2">
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

          {isSuspect ? (
            <FactorList
              title="Neden Şüpheli"
              headingLevel={3}
              severity={reading.flags.length > 1 ? "high" : "medium"}
              factors={[
                { label: "Bu Dönem Tüketim", value: kwh(reading.usage.total), tone: "danger" },
                { label: "Beklenen (Son 3 Dönem)", value: exp ? kwh(exp) : "—" },
                { label: "Sapma", value: exp ? `%${Math.round((reading.usage.total / exp) * 100) - 100}` : "—", tone: "warning", hint: "Önceki üç doğrulanmış okumanın ortalamasına göre" },
                ...reading.flags.map((f) => ({ label: FLAG_LABEL[f], value: "Bayrak", tone: "warning" as const })),
              ]}
            />
          ) : null}

          {isSuspect ? (
            <OptionCards
              legend="Önerilen Eylem"
              name={`okuma-eylem-${reading.id}`}
              defaultValue={reading.flags.includes("ani-sicrama") ? "yeniden" : "dogrulandi"}
              onValueChange={(v) => {
                if (v === "duzeltildi") setFixing(true);
              }}
              options={[
                { value: "dogrulandi", title: "Onayla", description: "Okuma doğru kabul edilir ve faturaya yansır." },
                { value: "duzeltildi", title: "Düzelt", description: "T1 endeksini elle düzeltip yeniden hesapla." },
                { value: "yeniden", title: "Yeniden Okuma İste", description: "Saha ekibine yeni görev açılır.", badge: "Önerilen" },
                { value: "tahmini", title: "Tahmini Yaz", description: "Son üç dönem ortalamasıyla geçici değer yazılır." },
              ]}
            />
          ) : null}

          {fixing && isSuspect ? (
            <div className="grid gap-3 rounded-xl bg-surface p-4">
              <NumberField label="Düzeltilmiş T1 Endeks (kWh)" value={fixed ?? reading.index.t1} onValueChange={setFixed} min={0} />
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={() => decide(reading.id, "duzeltildi")}>Düzeltmeyi Kaydet</Button>
                <Button variant="ghost" size="sm" onClick={() => setFixing(false)}>Vazgeç</Button>
              </div>
            </div>
          ) : null}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            <Fact label="Sayaç"><a href={href("meters", { id: meter.id })} className="font-medium text-primary-ink hover:underline"><Mono>{meter.serial}</Mono></a></Fact>
            <Fact label="Abone"><a href={href("customers", { id: c.id })} className="font-medium text-primary-ink hover:underline">{c.name}</a></Fact>
            <Fact label="Okuma Günü">{dayLabel(reading.date)}</Fact>
            <Fact label="Kaynak">{SOURCE_LABEL[reading.source]}</Fact>
            <Fact label="Çarpan"><Mono>×{meter.multiplier}</Mono></Fact>
            <Fact label="Gecikme">{readingDelay(reading)} gün</Fact>
          </dl>

          <div className="overflow-x-auto rounded-xl ring-1 ring-line-soft">
            <table className="w-full min-w-[26rem] border-collapse text-base">
              <caption className="sr-only">Endeks ve tüketim</caption>
              <thead>
                <tr className="bg-surface text-left text-small text-muted">
                  <th scope="col" className="px-3 py-2 font-medium">Zaman Dilimi</th>
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
                  <th scope="row" className="px-3 py-2 text-left font-medium text-strong">Talep Gücü</th>
                  <td colSpan={2} className="px-3 py-2 text-right tabular-nums">{num1.format(reading.demandKw)} kW</td>
                </tr>
              </tbody>
            </table>
          </div>

          {history.length >= 2 ? (
            <div>
              <h3 className="mb-2 text-read font-semibold text-strong">Önceki Dönemlerle Karşılaştırma</h3>
              <AreaChart
                title={`${meter.serial} dönem tüketimi`}
                labels={history.map((r) => periodLabel(r.period).split(" ")[0].slice(0, 3))}
                series={[{ label: "Tüketim", values: history.map((r) => r.usage.total), series: 1 }]}
                unit="kWh"
                height="h-44"
                bands={reading.status !== "bekliyor" ? [{ from: history.length - 1, label: "Bu Okuma", tone: reading.status === "supheli" ? "danger" : "neutral" }] : []}
              />
              {exp ? <p className="mt-2 text-small text-muted">Önceki üç doğrulanmış okumanın ortalaması {kwh(exp)}; bu okuma {reading.usage.total ? `%${Math.round((reading.usage.total / exp) * 100)}` : "—"} düzeyinde.</p> : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-line-soft pt-4">
            <Button variant="secondary" size="sm" onClick={() => go("meters", { id: meter.id })}>Sayaç Ayrıntısı</Button>
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
  const canApprove = useCan("okuma");
  const [file, setFile] = useState<{ name: string; size: string } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [imported, setImported] = useState<number | null>(null);

  /** Geçerli satırları DEPOYA yazar: her satır sayacın bu dönemki okumasını doldurur. */
  const importGood = (list: readonly ImportRow[]) => {
    let n = 0;
    for (const r of list) {
      const m = METERS.find((x) => x.serial === r.serial);
      const cur = m ? currentReadingOf(m.id) : undefined;
      if (!m || !cur) continue;
      const prev = readingsOf(m.id).filter((x) => x.status !== "bekliyor" && x.period < CURRENT_PERIOD).at(-1);
      const pi = prev?.index ?? m.base;
      const u1 = Math.round((r.t1 - pi.t1) * m.multiplier);
      const u2 = m.multiZone ? Math.round((r.t2 - pi.t2) * m.multiplier) : 0;
      const u3 = m.multiZone ? Math.round((r.t3 - pi.t3) * m.multiplier) : 0;
      const total = u1 + u2 + u3;
      enterReading(cur.id, {
        source: "saha",
        index: { t1: r.t1, t2: m.multiZone ? r.t2 : 0, t3: m.multiZone ? r.t3 : 0 },
        usage: { t1: u1, t2: u2, t3: u3, total },
        reactive: prev?.reactive ?? { inductive: 0, capacitive: 0 },
        demandKw: prev?.demandKw ?? 0,
        flags: total < 0 ? ["geri-sayim"] : [],
      });
      n += 1;
    }
    readingUi.set((u) => ({ ...u, imported: u.imported + n }));
    audit("Toplu okuma içe aktardı", file?.name ?? "CSV", undefined, `${n} okuma`);
    return n;
  };
  const rows = useMemo(() => (file ? buildImportRows() : []), [file]);
  const bad = rows.filter((r) => r.problem);
  const good = rows.filter((r) => !r.problem);

  const badColumns: readonly Column<ImportRow>[] = [
    { key: "line", header: "Satır", numeric: true, width: "4.5rem", render: (r) => <Mono>{r.line}</Mono> },
    { key: "serial", header: "Seri No", render: (r) => <Mono>{r.serial}</Mono> },
    { key: "kind", header: "Sorun", render: (r) => <Badge tone={r.problem!.kind === "tekrar" ? "warning" : "danger"} dot>{PROBLEM_LABEL[r.problem!.kind]}</Badge> },
    { key: "msg", header: "Açıklama", render: (r) => r.problem!.message },
  ];
  const goodColumns: readonly Column<ImportRow>[] = [
    { key: "line", header: "Satır", numeric: true, width: "4.5rem", render: (r) => <Mono>{r.line}</Mono> },
    { key: "serial", header: "Seri No", render: (r) => <Mono>{r.serial}</Mono> },
    { key: "date", header: "Tarih", render: (r) => <Mono>{r.date}</Mono> },
    { key: "t1", header: "T1", numeric: true, render: (r) => <Mono>{num.format(r.t1)}</Mono> },
    { key: "t2", header: "T2", numeric: true, render: (r) => <Mono>{r.t2 ? num.format(r.t2) : "—"}</Mono> },
    { key: "t3", header: "T3", numeric: true, render: (r) => <Mono>{r.t3 ? num.format(r.t3) : "—"}</Mono> },
  ];
  const badItems: RecordItem[] = bad.map((r) => ({ id: String(r.line), title: `Satır ${r.line} · ${r.serial}`, subtitle: r.problem!.message, status: <Badge tone="danger" dot>{PROBLEM_LABEL[r.problem!.kind]}</Badge> }));

  if (imported !== null) {
    return (
      <Panel title="Toplu İçe Aktarma" id="aktar">
        <div className="p-6">
          <EmptyState
            icon={<CheckCircle2 />}
            title={`${num.format(imported)} okuma içe aktarıldı`}
            hint={`${bad.length} hatalı satır aktarılmadı; hata raporu indirilebilir. Aktarılan okumalar sayaçların bu dönemki okuması oldu.`}
            action={<Button variant="secondary" size="sm" onClick={() => { setImported(null); setFile(null); }}>Yeni Dosya Yükle</Button>}
          />
        </div>
      </Panel>
    );
  }

  return (
    <>
      <Panel title="Toplu İçe Aktarma" note="Saha okuma cihazından ya da harici sistemden gelen CSV; önce doğrulanır, sonra aktarılır" id="aktar">
        <div className="grid gap-5 p-4 sm:p-5">
          {!file ? (
            <>
              <FileDropzone
                label="CSV Dosyası Bırakın"
                hint="Sütunlar: seri_no; tarih (YYYY-AA-GG); t1; t2; t3. En çok 5 MB."
                accept={["text/csv", "application/vnd.ms-excel"]}
                onFiles={(ok) => ok[0] && setFile({ name: ok[0].name, size: `${num1.format(ok[0].size / 1024)} KB` })}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => setFile({ name: "saha-okuma-2026-11-21.csv", size: "3,2 KB" })}>
                  <FileSpreadsheet aria-hidden /> Örnek Dosyayı Kullan
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
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Başka Dosya</Button>
              </div>
              <dl className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-surface p-4"><dt className="text-small text-muted">Toplam Satır</dt><dd className="text-heading font-semibold text-strong tabular-nums">{num.format(rows.length)}</dd></div>
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
            title="Hata Raporu"
            note={`${bad.length} satır aktarılmaz`}
            id="hatalar"
            actions={<Button variant="secondary" size="sm" onClick={() => { downloadCsv("hata-raporu-2026-11-21.csv", [["Satır", "Seri no", "Sorun", "Açıklama"], ...bad.map((r) => [r.line, r.serial, PROBLEM_LABEL[r.problem!.kind], r.problem!.message])]); notify({ title: "Hata Raporu İndirildi", body: `${bad.length} satır, hata-raporu-2026-11-21.csv`, tone: "success" }); }}><Upload aria-hidden className="rotate-180" /> Raporu İndir</Button>}
          >
            <div className="max-md:hidden">
              <DataTable<ImportRow> caption="İçe aktarma hata raporu" columns={badColumns} rows={bad} rowKey={(r) => String(r.line)} density="compact" on="surface" stickyFirst={false} minWidth="40rem" />
            </div>
            <div className="px-3 pb-3 md:hidden">
              <RecordList label="İçe Aktarma Hata Raporu" items={badItems} />
            </div>
          </Panel>

          <Panel
            title="Aktarılacak Satırlar"
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
        title="Geçerli Satırları Aktar"
        description={`${good.length} okuma içe aktarılacak, ${bad.length} hatalı satır atlanacak. Aktarılan okumalar doğrulama kuyruğuna girer.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>Vazgeç</Button>
            <Button
              variant="primary"
              onClick={() => {
                setConfirm(false);
                if (!canApprove) return notify({ title: "Yetki Yok", body: "Okuma girme yetkiniz yok.", tone: "info" });
                const n = importGood(good);
                setImported(n);
                notify({ title: `${n} okuma içe aktarıldı`, body: `${bad.length} hatalı satır atlandı; okumalar faturalamaya serbest.`, tone: "success" });
              }}
            >
              Aktar
            </Button>
          </>
        }
      >
        <p className="text-base text-body">Aktarılan okumalar sayacın bu dönemki okuması olarak kaydedilir. Doğrulamadan geçen satırlar faturalamaya serbest kalır; endeksi geriye giden satır “Şüpheli okumalar”a düşer.</p>
      </Dialog>
    </>
  );
}
