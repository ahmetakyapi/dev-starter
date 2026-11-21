"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Ban,
  CalendarPlus,
  CheckCircle2,
  CircleDollarSign,
  FileDown,
  Gavel,
  Mail,
  MessageSquare,
  Play,
  Receipt,
  ReceiptText,
  ShieldAlert,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BarList } from "@/components/ui/bar-list";
import { Button } from "@/components/ui/Button";
import { ChartCard } from "@/components/ui/chart-card";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { HoldButton } from "@/components/ui/hold-button";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-field";
import { Pagination } from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { SearchField } from "@/components/ui/search-field";
import { SelectionAction, SelectionBar } from "@/components/ui/selection-bar";
import { Select } from "@/components/ui/select";
import { StackedBarChart } from "@/components/ui/stacked-bar-chart";
import { Tabs } from "@/components/ui/tabs";
import { TickMeter } from "@/components/ui/tick-meter";
import { Textarea } from "@/components/ui/textarea";
import { Timeline } from "@/components/ui/timeline";
import {
  CHANNELS,
  CHANNEL_LABEL,
  CURRENT_PERIOD,
  KINDS,
  KIND_LABEL,
  PERIODS_12,
  READINGS,
  REGIONS,
  SOURCE_LABEL,
  SUPPLIERS,
  TODAY_KEY,
  customer,
  dayLabel,
  fullDate,
  kwh,
  meterOf,
  num,
  num1,
  parseDay,
  periodLabel,
  supplier,
  tl,
  tlShort,
  type PaymentChannel,
} from "./_data";
import {
  allInvoices,
  cancelInvoice,
  draftsFor,
  extendDue,
  fileDispute,
  invoiceEvents,
  invoiceOf,
  invoiceTab,
  isOverdue,
  logSend,
  overdueDays,
  pendingReadings,
  recordPayment,
  resolveDispute,
  runAccrual,
  statusOf,
  useFinance,
  type Draft,
  type EffectiveInvoice,
} from "./_data-finans";
import { CARD, IconTile, InvoiceBadge, MetricStrip, PageBody, PageHead, Panel, SampleNote, href, useApp, type PageProps } from "./_ui";

/* --- Ortak küçük parçalar ------------------------------------------------- */

const PAGE_SIZE = 10;
const LATE_NOTE = "Gecikme zammı aylık %2,5, gün hesabıyla işler.";

function StatusBadge({ inv }: { inv: EffectiveInvoice }) {
  const status = statusOf(inv);
  if (status === "iptal") return <Badge tone="neutral" dot>İptal Edildi</Badge>;
  return <InvoiceBadge status={status} />;
}

/** Ölçü şeridi hücresi: ikon karosu + etiket + değer + alt satır. */
function Cell({ icon, tone = "neutral", label, value, foot }: { icon: ReactNode; tone?: "primary" | "success" | "warning" | "danger" | "neutral"; label: string; value: ReactNode; foot: ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-1 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-small text-muted">
        <IconTile tone={tone}>{icon}</IconTile>
        <span>{label}</span>
      </div>
      <p className="edas-mono mt-1 text-heading font-semibold tracking-tight text-strong">{value}</p>
      <p className="text-small text-muted">{foot}</p>
    </div>
  );
}

const STATUS_TO_TAB: Record<string, string> = { gecikti: "geciken", kesildi: "kesilen", odendi: "odenen", itirazli: "itirazli" };
const TAB_IDS = ["hepsi", "kesilen", "odenen", "geciken", "itirazli", "taslak"] as const;
type TabId = (typeof TAB_IDS)[number];
const TAB_LABEL: Record<TabId, string> = { hepsi: "Hepsi", kesilen: "Kesilen", odenen: "Ödenen", geciken: "Geciken", itirazli: "İtirazlı", taslak: "Taslak" };

const link = (go: PageProps["go"], page: Parameters<PageProps["go"]>[0], params: Record<string, string | undefined>) => ({
  href: href(page, params),
  onClick: (e: { preventDefault: () => void }) => {
    e.preventDefault();
    go(page, params);
  },
});

/* =============================== LİSTE ======================================== */

function InvoiceList({ params, go }: PageProps) {
  const { notify } = useApp();
  const fin = useFinance();
  const all = useMemo(() => allInvoices(fin), [fin]);

  const status = STATUS_TO_TAB[params.status ?? ""] ?? (TAB_IDS.includes((params.status ?? "") as TabId) ? params.status! : "hepsi");
  const tab = status as TabId;
  const page = Math.max(1, Number(params.page) || 1);

  const [period, setPeriod] = useState<string>(PERIODS_12[10]);
  const [q, setQ] = useState(params.customer ?? "");
  const [kind, setKind] = useState("hepsi");
  const [region, setRegion] = useState("hepsi");
  const [tariff, setTariff] = useState("hepsi");
  const [sup, setSup] = useState("hepsi");
  const [amount, setAmount] = useState("hepsi");
  const [picked, setPicked] = useState<readonly string[]>([]);
  const [accrual, setAccrual] = useState(false);
  const [extend, setExtend] = useState(false);
  const [extendDays, setExtendDays] = useState("14");

  const inPeriod = useMemo(() => all.filter((i) => period === "tum" || i.period === period), [all, period]);

  const kpi = useMemo(() => {
    const live = inPeriod.filter((i) => !i.cancelled);
    const total = live.reduce((s, i) => s + i.total, 0);
    const paid = live.reduce((s, i) => s + i.paid, 0);
    const late = live.filter(isOverdue);
    return {
      total,
      count: live.length,
      paid,
      open: total - paid,
      late: late.length,
      lateBalance: late.reduce((s, i) => s + (i.total - i.paid), 0),
      disputed: live.filter((i) => i.status === "itirazli").length,
    };
  }, [inPeriod]);

  const counts = useMemo(() => {
    const c: Record<TabId, number> = { hepsi: inPeriod.length, kesilen: 0, odenen: 0, geciken: 0, itirazli: 0, taslak: draftsFor(CURRENT_PERIOD, fin).length };
    for (const i of inPeriod) {
      const t = invoiceTab(i);
      if (t !== "iptal") c[t]++;
    }
    return c;
  }, [inPeriod, fin]);

  const filtered = useMemo(() => {
    const query = q.trim().toLocaleLowerCase("tr-TR");
    return inPeriod
      .filter((i) => tab === "hepsi" || invoiceTab(i) === tab)
      .filter((i) => {
        const c = customer(i.customerId);
        if (kind !== "hepsi" && c.kind !== kind) return false;
        if (region !== "hepsi" && c.regionId !== region) return false;
        if (tariff !== "hepsi" && c.tariff !== tariff) return false;
        if (sup !== "hepsi" && i.supplierId !== sup) return false;
        const lira = i.total / 100;
        if (amount === "0-500" && lira >= 500) return false;
        if (amount === "500-2000" && (lira < 500 || lira >= 2000)) return false;
        if (amount === "2000-ustu" && lira < 2000) return false;
        if (query && !`${i.id} ${c.id} ${c.name} ${c.installation}`.toLocaleLowerCase("tr-TR").includes(query)) return false;
        return true;
      })
      .sort((a, b) => (a.issued === b.issued ? b.total - a.total : a.issued < b.issued ? 1 : -1));
  }, [inPeriod, tab, q, kind, region, tariff, sup, amount]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const drafts = useMemo(() => (tab === "taslak" ? draftsFor(CURRENT_PERIOD, fin) : []), [tab, fin]);

  /* Dönem tahakkuku grafiği: son altı tamamlanan dönem. */
  const chartPeriods = PERIODS_12.slice(5, 11);
  const stacked = chartPeriods.map((p) => {
    const rows = all.filter((i) => i.period === p && !i.cancelled);
    const late = rows.filter(isOverdue).reduce((s, i) => s + (i.total - i.paid), 0);
    const paid = rows.reduce((s, i) => s + i.paid, 0);
    const open = rows.reduce((s, i) => s + (i.total - i.paid), 0) - late;
    return { label: new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(parseDay(p)).replace(".", ""), values: [Math.round(paid / 100_000), Math.round(open / 100_000), Math.round(late / 100_000)] };
  });
  const byKind = KINDS.map((k) => ({ label: KIND_LABEL[k], value: Math.round(inPeriod.filter((i) => !i.cancelled && customer(i.customerId).kind === k).reduce((s, i) => s + i.total, 0) / 100_000) }));

  const resetPage = () => params.page && go("invoices", { ...params, page: undefined });
  const filterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPicked([]);
    resetPage();
  };
  const setTab = (next: string) => {
    setPicked([]);
    go("invoices", { status: next === "hepsi" ? undefined : next });
  };
  const hrefFor = (n: number) => href("invoices", { ...params, page: n > 1 ? String(n) : undefined });

  const columns: readonly Column<EffectiveInvoice>[] = [
    {
      key: "pick",
      header: (
        <Checkbox
          aria-label="Bu sayfadaki bütün faturaları seç"
          checked={rows.length > 0 && rows.every((r) => picked.includes(r.id))}
          onChange={(e) => setPicked(e.target.checked ? [...new Set([...picked, ...rows.map((r) => r.id)])] : picked.filter((id) => !rows.some((r) => r.id === id)))}
        />
      ),
      width: "3rem",
      render: (r) => (
        <Checkbox aria-label={`${r.id} faturasını seç`} checked={picked.includes(r.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, r.id] : picked.filter((id) => id !== r.id))} />
      ),
    },
    {
      key: "id",
      header: "Fatura No",
      render: (r) => (
        <a {...link(go, "invoices", { id: r.id })} className="edas-mono font-semibold text-primary-ink hover:underline">
          {r.id}
        </a>
      ),
    },
    {
      key: "customer",
      header: "Abone",
      render: (r) => (
        <span className="block min-w-0">
          <span className="block truncate font-medium text-strong">{customer(r.customerId).name}</span>
          <span className="edas-mono text-micro text-muted">{customer(r.customerId).installation}</span>
        </span>
      ),
    },
    { key: "period", header: "Dönem", render: (r) => periodLabel(r.period) },
    { key: "usage", header: "Tüketim", numeric: true, render: (r) => <span className="edas-mono">{kwh(r.usageKwh)}</span> },
    { key: "total", header: "Tutar", numeric: true, render: (r) => <span className="edas-mono font-medium text-strong">{tl(r.total)}</span> },
    {
      key: "balance",
      header: "Bakiye",
      numeric: true,
      render: (r) => <span className={r.total - r.paid > 0 && !r.cancelled ? "edas-mono text-strong" : "edas-mono text-muted"}>{r.cancelled ? "-" : tl(r.total - r.paid)}</span>,
    },
    {
      key: "due",
      header: "Vade",
      render: (r) => (
        <span className={isOverdue(r) ? "font-medium text-danger" : undefined}>
          {dayLabel(r.due)}
          {isOverdue(r) ? <span className="sr-only"> ({overdueDays(r)} gün gecikmiş)</span> : null}
        </span>
      ),
    },
    { key: "status", header: "Durum", render: (r) => <StatusBadge inv={r} /> },
  ];

  const items: RecordItem[] = rows.map((r) => ({
    id: r.id,
    title: customer(r.customerId).name,
    subtitle: `${r.id} · ${periodLabel(r.period)}`,
    leading: <IconTile tone={r.cancelled ? "neutral" : isOverdue(r) ? "danger" : r.status === "odendi" ? "success" : "primary"}><Receipt /></IconTile>,
    value: tl(r.total),
    meta: `Vade ${dayLabel(r.due)} · ${kwh(r.usageKwh)}`,
    status: <StatusBadge inv={r} />,
    href: href("invoices", { id: r.id }),
    onSelect: () => go("invoices", { id: r.id }),
  }));

  const draftColumns: readonly Column<Draft>[] = [
    { key: "id", header: "Taslak No", render: (r) => <span className="edas-mono font-semibold text-strong">{r.id}</span> },
    { key: "c", header: "Abone", render: (r) => customer(r.customerId).name },
    { key: "u", header: "Tüketim", numeric: true, render: (r) => <span className="edas-mono">{kwh(r.usageKwh)}</span> },
    { key: "t", header: "Tutar", numeric: true, render: (r) => <span className="edas-mono font-medium text-strong">{tl(r.total)}</span> },
    { key: "d", header: "Vade", render: (r) => dayLabel(r.due) },
    {
      key: "w",
      header: "Uyarı",
      render: (r) => (r.warnings.length ? <Badge tone="warning" dot>{r.warnings[0]}</Badge> : <Badge tone="success" dot>Hazır</Badge>),
    },
  ];
  const draftItems: RecordItem[] = drafts.map((d) => ({
    id: d.id,
    title: customer(d.customerId).name,
    subtitle: `${d.id} · ${kwh(d.usageKwh)}`,
    value: tl(d.total),
    meta: `Vade ${dayLabel(d.due)}`,
    status: d.warnings.length ? <Badge tone="warning" dot>{d.warnings[0]}</Badge> : <Badge tone="success" dot>Hazır</Badge>,
  }));

  const filtersActive = kind !== "hepsi" || region !== "hepsi" || tariff !== "hepsi" || sup !== "hepsi" || amount !== "hepsi" || q !== "";
  const clearFilters = () => {
    setKind("hepsi");
    setRegion("hepsi");
    setTariff("hepsi");
    setSup("hepsi");
    setAmount("hepsi");
    setQ("");
    resetPage();
  };

  const bulk = {
    sms: () => {
      const targets = all.filter((i) => picked.includes(i.id));
      targets.forEach((i) => logSend(i.id, "sms"));
      notify({ title: `${targets.length} aboneye hatırlatma SMS'i gönderildi`, body: "Gönderim kaydı fatura geçmişine işlendi.", tone: "success" });
      setPicked([]);
    },
    pdf: () => {
      notify({ title: `${picked.length} fatura PDF olarak hazırlanıyor`, body: "Arşiv bağlantısı e-postanıza gönderilecek.", tone: "info" });
      picked.forEach((id) => logSend(id, "pdf"));
      setPicked([]);
    },
    extend: () => {
      picked.forEach((id) => extendDue(id, Number(extendDays)));
      notify({ title: `${picked.length} faturanın vadesi ${extendDays} gün uzatıldı`, tone: "success" });
      setPicked([]);
      setExtend(false);
    },
  };

  const listContent =
    tab === "taslak" ? (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-4 py-3 sm:px-5">
          <p className="text-small text-muted">
            {periodLabel(CURRENT_PERIOD)} için okuması hazır {num.format(drafts.length)} abone. {num.format(pendingReadings(CURRENT_PERIOD))} okuma hâlâ bekliyor: bunlar faturalanmaz.
          </p>
          <Button variant="primary" size="sm" disabled={drafts.length === 0} onClick={() => setAccrual(true)}>
            <Play aria-hidden /> Tahakkuk Çalıştır
          </Button>
        </div>
        {drafts.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={<CheckCircle2 />} title="Bekleyen Taslak Yok" hint={`${periodLabel(CURRENT_PERIOD)} tahakkuku tamamlandı. Yeni okumalar geldikçe taslaklar burada belirir.`} />
          </div>
        ) : (
          <>
            <div className="max-md:hidden">
              <DataTable<Draft> caption="Taslak faturalar" columns={draftColumns} rows={drafts.slice(0, 15)} rowKey={(r) => r.id} density="comfortable" on="surface" />
            </div>
            <div className="px-3 pb-3 md:hidden">
              <RecordList label="Taslak faturalar" items={draftItems.slice(0, 15)} />
            </div>
            {drafts.length > 15 ? <p className="px-5 pb-4 text-small text-muted">İlk 15 taslak gösteriliyor; tahakkuk {num.format(drafts.length)} taslağın hepsini keser.</p> : null}
          </>
        )}
      </div>
    ) : (
      <div>
        <div className="grid grid-cols-2 gap-3 border-b border-line-soft p-4 sm:px-5 lg:grid-cols-6">
          <SearchField
            className="col-span-2 lg:col-span-2"
            label="Fatura, abone ya da tesisat ara"
            placeholder="Fatura no, abone adı, tesisat no"
            value={q}
            onValueChange={filterChange(setQ)}
            resultCount={filtered.length}
            shortcut="/"
            size="sm"
          />
          <Select label="Abone Türü" hideLabel items={[{ value: "hepsi", label: "Bütün Türler" }, ...KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] }))]} value={kind} onValueChange={(v) => filterChange(setKind)(v ?? "hepsi")} />
          <Select label="Bölge" hideLabel items={[{ value: "hepsi", label: "Bütün Bölgeler" }, ...REGIONS.map((r) => ({ value: r.id, label: r.name }))]} value={region} onValueChange={(v) => filterChange(setRegion)(v ?? "hepsi")} />
          <Select label="Tarife" hideLabel items={[{ value: "hepsi", label: "Bütün Tarifeler" }, { value: "tek-zamanli", label: "Tek Zamanlı" }, { value: "cok-zamanli", label: "Çok Zamanlı" }]} value={tariff} onValueChange={(v) => filterChange(setTariff)(v ?? "hepsi")} />
          <Select label="Tedarikçi" hideLabel items={[{ value: "hepsi", label: "Bütün Tedarikçiler" }, ...SUPPLIERS.map((s) => ({ value: s.id, label: s.name }))]} value={sup} onValueChange={(v) => filterChange(setSup)(v ?? "hepsi")} />
          <Select label="Tutar Aralığı" hideLabel items={[{ value: "hepsi", label: "Her Tutar" }, { value: "0-500", label: "500 ₺ altı" }, { value: "500-2000", label: "500 - 2.000 ₺" }, { value: "2000-ustu", label: "2.000 ₺ üstü" }]} value={amount} onValueChange={(v) => filterChange(setAmount)(v ?? "hepsi")} />
        </div>
        {filtersActive ? (
          <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-2 sm:px-5">
            <p className="text-small text-muted">{num.format(filtered.length)} fatura süzüldü</p>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Süzgeçleri Temizle
            </Button>
          </div>
        ) : null}
        {filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<ReceiptText />}
              title="Eşleşen Fatura Yok"
              hint="Süzgeçleri gevşetin ya da başka bir dönem seçin."
              action={
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Süzgeçleri Temizle
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="max-md:hidden">
              <DataTable<EffectiveInvoice> caption="Faturalar" columns={columns} rows={rows} rowKey={(r) => r.id} density="comfortable" on="surface" minWidth="60rem" />
            </div>
            <div className="px-3 pb-3 md:hidden">
              <RecordList label="Faturalar" items={items} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-4 py-3 sm:px-5">
              <p className="text-small text-muted">
                {num.format(filtered.length)} faturadan {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filtered.length)} arası
              </p>
              {pageCount > 1 ? <Pagination page={safePage} pageCount={pageCount} hrefFor={hrefFor} scroll={false} /> : null}
            </div>
          </>
        )}
      </div>
    );

  const tabs = TAB_IDS.map((id) => ({
    value: id,
    label: (
      <span className="inline-flex items-center gap-1.5">
        {TAB_LABEL[id]}
        <span className="edas-mono text-micro text-muted">{num.format(counts[id])}</span>
      </span>
    ),
    panel: id === tab ? listContent : null,
  }));

  return (
    <>
      <PageHead
        title="Faturalar"
        description={`${period === "tum" ? "Bütün dönemler" : periodLabel(period)} · ${num.format(kpi.count)} fatura, ${tlShort(kpi.total)} tahakkuk`}
        actions={
          <>
            <Select
              label="Dönem"
              hideLabel
              items={[{ value: "tum", label: "Tüm Dönemler" }, ...[...PERIODS_12].reverse().map((p) => ({ value: p, label: periodLabel(p) }))]}
              value={period}
              onValueChange={(v) => {
                setPeriod(v ?? "tum");
                setPicked([]);
                resetPage();
              }}
            />
            <Button variant="primary" size="sm" onClick={() => setAccrual(true)}>
              <Play aria-hidden /> Tahakkuk Çalıştır
            </Button>
          </>
        }
      />
      <PageBody>
        <MetricStrip>
          <Cell icon={<CircleDollarSign />} tone="primary" label="Tahakkuk Toplamı" value={tlShort(kpi.total)} foot={`${num.format(kpi.count)} fatura`} />
          <Cell icon={<Receipt />} label="Kesilen Fatura" value={num.format(kpi.count)} foot={`${num.format(counts.taslak)} taslak bekliyor`} />
          <Cell icon={<CheckCircle2 />} tone="success" label="Ödenen" value={tlShort(kpi.paid)} foot={`Tahakkukun %${num1.format(kpi.total ? (kpi.paid / kpi.total) * 100 : 0)}'i`} />
          <Cell icon={<Wallet />} tone="warning" label="Açık Bakiye" value={tlShort(kpi.open)} foot="Ödenmemiş toplam" />
          <Cell icon={<TriangleAlert />} tone="danger" label="Geciken" value={num.format(kpi.late)} foot={`${tlShort(kpi.lateBalance)} bakiye`} />
          <Cell icon={<Gavel />} tone="primary" label="İtirazlı" value={num.format(kpi.disputed)} foot="İnceleme bekliyor" />
        </MetricStrip>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <ChartCard
            id="fat-donem"
            className={`${CARD} xl:col-span-2`}
            label="Dönem Tahakkuku"
            value={`${tlShort(all.filter((i) => !i.cancelled && chartPeriods.includes(i.period)).reduce((s, i) => s + i.total, 0))}`}
            change={null}
            changeLabel="son altı dönem"
          >
            <StackedBarChart
              title="Dönemlere Göre Ödenen, Açık ve Geciken Tutar"
              data={stacked}
              series={[
                { name: "Ödenen", color: 5 },
                { name: "Açık", color: 1 },
                { name: "Geciken", color: 6 },
              ]}
              highlight={stacked.length - 1}
              unit=" bin ₺"
            />
          </ChartCard>
          <ChartCard id="fat-tur" className={CARD} label="Türe Göre Tahakkuk" value={`${num.format(inPeriod.filter((i) => !i.cancelled).length)} fatura`} change={null}>
            <BarList title="Abone Türüne Göre Tahakkuk" columns={["Tür", "Bin ₺"]} items={byKind} valueFormat={{ maximumFractionDigits: 0 }} series={1} />
          </ChartCard>
        </div>

        <Panel title="Fatura Listesi" note="Satıra basınca fatura belgesi, geçmiş ve işlemler açılır.">
          <div className="p-3 sm:p-4">
            <Tabs aria-label="Fatura durumu" variant="underline" value={tab} onValueChange={setTab} items={tabs} />
          </div>
        </Panel>
        <SampleNote />
      </PageBody>

      {picked.length > 0 ? (
        <SelectionBar count={picked.length} noun="fatura" onClear={() => setPicked([])}>
          <SelectionAction icon={<MessageSquare />} onClick={bulk.sms}>
            Hatırlatma SMS'i
          </SelectionAction>
          <SelectionAction icon={<FileDown />} onClick={bulk.pdf}>
            PDF İndir
          </SelectionAction>
          <SelectionAction icon={<CalendarPlus />} onClick={() => setExtend(true)}>
            Vadeyi Uzat
          </SelectionAction>
        </SelectionBar>
      ) : null}

      <Dialog
        open={extend}
        onOpenChange={setExtend}
        title="Vadeyi Uzat"
        description={`${picked.length} faturanın son ödeme tarihi uzatılacak. Gecikmiş olanlar bugünden itibaren sayılır.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setExtend(false)}>
              Vazgeç
            </Button>
            <Button variant="primary" onClick={bulk.extend}>
              Vadeyi Uzat
            </Button>
          </>
        }
      >
        <Select label="Uzatma Süresi" items={[{ value: "7", label: "7 gün" }, { value: "14", label: "14 gün" }, { value: "30", label: "30 gün" }]} value={extendDays} onValueChange={(v) => setExtendDays(v ?? "14")} />
        <p className="mt-3 text-small text-muted">Bu işlem fatura geçmişine yazılır ve gecikme zammını durdurur.</p>
      </Dialog>

      <AccrualDialog open={accrual} onOpenChange={setAccrual} go={go} />
    </>
  );
}

/* ============================ TAHAKKUK AKIŞI ================================= */

function AccrualDialog({ open, onOpenChange, go }: { open: boolean; onOpenChange: (open: boolean) => void; go: PageProps["go"] }) {
  const { notify } = useApp();
  const fin = useFinance();
  const [period, setPeriod] = useState(CURRENT_PERIOD);
  const [step, setStep] = useState<"onizleme" | "calisiyor" | "bitti">("onizleme");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ count: number; total: number } | null>(null);

  const drafts = useMemo(() => draftsFor(period, fin), [period, fin]);
  const waiting = pendingReadings(period);
  const warned = drafts.filter((d) => d.warnings.length > 0).length;
  const total = drafts.reduce((s, d) => s + d.total, 0);

  useEffect(() => {
    if (!open) {
      const reset = setTimeout(() => {
        setStep("onizleme");
        setProgress(0);
        setResult(null);
      }, 250);
      return () => clearTimeout(reset);
    }
  }, [open]);

  useEffect(() => {
    if (step !== "calisiyor") return;
    if (progress >= 100) {
      const done = runAccrual(period);
      setResult(done);
      setStep("bitti");
      notify({ title: `${num.format(done.count)} fatura kesildi`, body: `${periodLabel(period)} tahakkuku ${tl(done.total)} tutarında tamamlandı.`, tone: "success" });
      return;
    }
    const id = setTimeout(() => setProgress((p) => Math.min(100, p + 12 + (p > 60 ? 6 : 0))), 160);
    return () => clearTimeout(id);
  }, [step, progress, period, notify]);

  const already = period !== CURRENT_PERIOD && drafts.length === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (step === "calisiyor" ? undefined : onOpenChange(next))}
      dismissible={step !== "calisiyor"}
      title="Tahakkuk Çalıştır"
      description="Okuması doğrulanmış abonelerin dönem faturalarını keser. Geri alınamaz: yanlış kesileni düzeltme faturasıyla kapatırsınız."
      size="md"
      footer={
        step === "onizleme" ? (
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <HoldButton tone="neutral" disabled={drafts.length === 0} hint="Başlatmak için basılı tutun" onConfirm={() => setStep("calisiyor")} doneLabel="Başladı">
              Tahakkuku Başlat
            </HoldButton>
          </>
        ) : step === "bitti" ? (
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Kapat
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onOpenChange(false);
                go("invoices", { status: "kesilen" });
              }}
            >
              Faturaları Gör
            </Button>
          </>
        ) : undefined
      }
    >
      {step === "onizleme" ? (
        <div className="grid gap-4">
          <Select label="Dönem" items={PERIODS_12.slice(-3).map((p) => ({ value: p, label: periodLabel(p) }))} value={period} onValueChange={(v) => setPeriod(v ?? CURRENT_PERIOD)} />
          {already ? (
            <p role="status" className="rounded-lg bg-surface p-3 text-small text-body">
              {periodLabel(period)} tahakkuku daha önce tamamlandı; kesilecek fatura yok.
            </p>
          ) : (
            <dl className="grid grid-cols-2 gap-3 rounded-lg bg-surface p-3 text-small">
              <div>
                <dt className="text-muted">Kesilecek fatura</dt>
                <dd className="edas-mono mt-0.5 text-read font-semibold text-strong">{num.format(drafts.length)}</dd>
              </div>
              <div>
                <dt className="text-muted">Toplam tutar</dt>
                <dd className="edas-mono mt-0.5 text-read font-semibold text-strong">{tl(total)}</dd>
              </div>
              <div>
                <dt className="text-muted">Ortalama fatura</dt>
                <dd className="edas-mono mt-0.5 text-body">{drafts.length ? tl(Math.round(total / drafts.length)) : "-"}</dd>
              </div>
              <div>
                <dt className="text-muted">Vade</dt>
                <dd className="mt-0.5 text-body">{fullDate.format(parseDay(drafts[0]?.due ?? TODAY_KEY))}</dd>
              </div>
            </dl>
          )}
          {waiting > 0 ? (
            <p className="flex items-start gap-2 rounded-lg bg-warning-wash p-3 text-small text-warning">
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>
                <strong className="font-semibold">{num.format(waiting)} okuma hâlâ bekliyor.</strong> Bu aboneler faturalanmaz; okuma gelince bir sonraki tahakkukta kesilir.
              </span>
            </p>
          ) : null}
          {warned > 0 ? (
            <p className="flex items-start gap-2 rounded-lg bg-surface p-3 text-small text-body">
              <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
              <span>{num.format(warned)} faturada uyarı var (şüpheli ya da tahmini endeks). Kesildikten sonra itiraz yoluyla düzeltilir.</span>
            </p>
          ) : null}
        </div>
      ) : step === "calisiyor" ? (
        <div className="grid gap-3 py-2">
          <Progress label="Faturalar Kesiliyor" value={progress} valueText={`%${Math.round(progress)}`} hint={`${num.format(Math.round((drafts.length * progress) / 100))} / ${num.format(drafts.length)} fatura`} />
          <p className="text-small text-muted">Pencereyi kapatmayın; işlem birkaç saniye sürer.</p>
        </div>
      ) : (
        <div className="grid gap-3 py-2">
          <p role="status" className="flex items-start gap-2 rounded-lg bg-success-wash p-3 text-small text-success">
            <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              <strong className="font-semibold">{num.format(result?.count ?? 0)} fatura kesildi</strong>, toplam {tl(result?.total ?? 0)}. Müşterilere e-posta ve SMS bildirimi sıraya alındı.
            </span>
          </p>
        </div>
      )}
    </Dialog>
  );
}

/* ============================== AYRINTI ====================================== */

function InvoiceDetail({ id, go }: { id: string; go: PageProps["go"] }) {
  const { notify } = useApp();
  const fin = useFinance();
  const inv = invoiceOf(id, fin);
  const [dialog, setDialog] = useState<null | "ode" | "vade" | "itiraz" | "iptal">(null);

  if (!inv) {
    return (
      <>
        <PageHead title="Faturalar" description="Fatura bulunamadı." />
        <PageBody>
          <EmptyState
            icon={<Receipt />}
            title="Fatura Bulunamadı"
            hint={`${id} numaralı bir fatura yok ya da iptal sonrası arşive alındı.`}
            action={
              <Button variant="secondary" size="sm" onClick={() => go("invoices")}>
                Faturalara Dön
              </Button>
            }
          />
        </PageBody>
      </>
    );
  }

  const c = customer(inv.customerId);
  const meter = meterOf(c.id);
  const sup = supplier(inv.supplierId);
  const reading = READINGS.find((r) => r.customerId === c.id && r.period === inv.period);
  const balance = inv.total - inv.paid;
  const late = overdueDays(inv);
  const lateFee = isOverdue(inv) ? Math.round(balance * 0.025 * (late / 30)) : 0;
  const events = invoiceEvents(inv, fin);
  const closed = inv.cancelled || inv.status === "odendi";

  type Related = { label: string; to: { page: "customers" | "meters" | "readings" | "payments"; params: Record<string, string> } };
  const related: Related[] = [
    { label: `Abone: ${c.name}`, to: { page: "customers", params: { id: c.id } } },
    { label: `Sayaç: ${meter.serial}`, to: { page: "meters", params: { id: meter.id } } },
    ...(reading ? [{ label: `Okuma: ${periodLabel(reading.period)}`, to: { page: "readings", params: { id: reading.id } } } as Related] : []),
    { label: "Bu faturanın ödemeleri", to: { page: "payments", params: { invoice: inv.id } } },
  ];

  const lines = [
    { label: `Enerji bedeli (${num1.format(inv.usageKwh)} kWh × ${sup.unitPrice.toFixed(2)} ₺)`, amount: inv.energy },
    { label: "Dağıtım bedeli", amount: inv.distribution },
    { label: "YEKDEM bedeli", amount: inv.yekdem },
    { label: "Fonlar (enerji fonu ve TRT payı)", amount: inv.funds },
    { label: "Belediye tüketim vergisi", amount: inv.btv },
    { label: c.kind === "tarim" ? "KDV (%10)" : "KDV (%20)", amount: inv.vat },
  ];

  return (
    <>
      <PageHead
        title="Faturalar"
        crumb={`${inv.id} · ${c.name}`}
        description={`${periodLabel(inv.period)} dönemi · ${c.name} · tesisat ${c.installation}`}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => go("invoices")}>
              <ArrowLeft aria-hidden /> Listeye Dön
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                logSend(inv.id, "pdf");
                notify({ title: `${inv.id} PDF olarak indirildi`, tone: "success" });
              }}
            >
              <FileDown aria-hidden /> PDF İndir
            </Button>
            <Button variant="primary" size="sm" disabled={closed} onClick={() => setDialog("ode")}>
              <Wallet aria-hidden /> Ödeme Ekle
            </Button>
          </>
        }
      />
      <PageBody className="xl:grid-cols-5">
        <div className="grid min-w-0 grid-cols-1 content-start gap-5 xl:col-span-3">
          {/* Fatura belgesi: kağıt görünümü, bütün tutarlar kalemlerden hesaplanır. */}
          <article aria-label={`${inv.id} fatura belgesi`} className={`${CARD}`}>
            <div className="rounded-lg bg-overlay p-5 sm:p-7">
              <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line-soft pb-5">
                <div>
                  <p className="text-small font-semibold text-strong">Kuzeyova Elektrik Dağıtım A.Ş.</p>
                  <p className="text-micro text-muted">e-Arşiv fatura · ÖRNEK VERİ</p>
                </div>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-small">
                  <dt className="text-muted">Fatura no</dt>
                  <dd className="edas-mono text-right font-medium text-strong">{inv.id}</dd>
                  <dt className="text-muted">Düzenleme</dt>
                  <dd className="text-right text-body">{fullDate.format(parseDay(inv.issued))}</dd>
                  <dt className="text-muted">Son ödeme</dt>
                  <dd className={isOverdue(inv) ? "text-right font-medium text-danger" : "text-right text-body"}>{fullDate.format(parseDay(inv.due))}</dd>
                </dl>
              </header>

              <div className="grid gap-5 py-5 sm:grid-cols-2">
                <section aria-labelledby="fd-abone">
                  <h2 id="fd-abone" className="text-micro font-semibold tracking-wide text-muted">
                    ABONE
                  </h2>
                  <p className="mt-1.5 font-semibold text-strong">{c.name}</p>
                  <p className="text-small text-body">{c.address}, {c.district}</p>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-small">
                    <dt className="text-muted">Tesisat no</dt>
                    <dd className="edas-mono text-body">{c.installation}</dd>
                    <dt className="text-muted">Tür / gerilim</dt>
                    <dd className="text-body">{KIND_LABEL[c.kind]} · {c.voltage}</dd>
                    <dt className="text-muted">Tarife</dt>
                    <dd className="text-body">{c.tariff === "cok-zamanli" ? "Çok zamanlı" : "Tek zamanlı"}</dd>
                    <dt className="text-muted">Vergi no</dt>
                    <dd className="edas-mono text-body">{c.taxMasked}</dd>
                  </dl>
                </section>
                <section aria-labelledby="fd-tedarik">
                  <h2 id="fd-tedarik" className="text-micro font-semibold tracking-wide text-muted">
                    TEDARİKÇİ VE SAYAÇ
                  </h2>
                  <p className="mt-1.5 font-semibold text-strong">{sup.name}</p>
                  <p className="text-small text-body">{sup.kind === "gorevli" ? "Görevli tedarik şirketi" : "Perakende satış şirketi"} · {sup.license}</p>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-small">
                    <dt className="text-muted">Sayaç no</dt>
                    <dd className="edas-mono text-body">{meter.serial}</dd>
                    <dt className="text-muted">Çarpan</dt>
                    <dd className="edas-mono text-body">{meter.multiplier}</dd>
                    <dt className="text-muted">Okuma</dt>
                    <dd className="text-body">{reading ? `${fullDate.format(parseDay(reading.date))} · ${SOURCE_LABEL[reading.source]}` : "-"}</dd>
                  </dl>
                </section>
              </div>

              {reading ? (
                <section aria-labelledby="fd-tuketim" className="border-t border-line-soft py-5">
                  <h2 id="fd-tuketim" className="text-micro font-semibold tracking-wide text-muted">
                    TÜKETİM
                  </h2>
                  <div className="mt-2 overflow-x-auto" tabIndex={0} role="region" aria-label="Endeks ve tüketim tablosu">
                    <table className="edas-mono w-full min-w-[26rem] text-small">
                      <caption className="sr-only">Zaman dilimine göre önceki endeks, son endeks ve tüketim</caption>
                      <thead>
                        <tr className="text-muted">
                          <th scope="col" className="py-1 text-left font-medium">Zaman dilimi</th>
                          <th scope="col" className="py-1 text-right font-medium">Önceki endeks</th>
                          <th scope="col" className="py-1 text-right font-medium">Son endeks</th>
                          <th scope="col" className="py-1 text-right font-medium">Tüketim</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(c.tariff === "cok-zamanli" ? (["t1", "t2", "t3"] as const) : (["t1"] as const)).map((t) => {
                          const used = reading.usage[t];
                          const rawUsed = used / (meter.multiplier || 1);
                          const last = reading.index[t];
                          return (
                            <tr key={t} className="border-t border-line-soft">
                              <th scope="row" className="py-1.5 text-left font-medium text-strong">{t === "t1" ? (c.tariff === "cok-zamanli" ? "T1 Gündüz" : "Tek zaman") : t === "t2" ? "T2 Puant" : "T3 Gece"}</th>
                              <td className="py-1.5 text-right text-body">{num.format(Math.round(last - rawUsed))}</td>
                              <td className="py-1.5 text-right text-body">{num.format(Math.round(last))}</td>
                              <td className="py-1.5 text-right font-medium text-strong">{kwh(c.tariff === "cok-zamanli" ? used : reading.usage.total)}</td>
                            </tr>
                          );
                        })}
                        <tr className="border-t border-line">
                          <th scope="row" className="py-1.5 text-left font-semibold text-strong">Toplam</th>
                          <td colSpan={2} />
                          <td className="py-1.5 text-right font-semibold text-strong">{kwh(inv.usageKwh)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-micro text-muted">
                    Reaktif: endüktif {num.format(Math.round(reading.reactive.inductive))} kVArh, kapasitif {num.format(Math.round(reading.reactive.capacitive))} kVArh · En yüksek talep {num1.format(reading.demandKw)} kW
                  </p>
                </section>
              ) : null}

              <section aria-labelledby="fd-kalem" className="border-t border-line-soft pt-5">
                <h2 id="fd-kalem" className="text-micro font-semibold tracking-wide text-muted">
                  FATURA KALEMLERİ
                </h2>
                <table className="edas-mono mt-2 w-full text-small">
                  <caption className="sr-only">Fatura kalemleri ve tutarları</caption>
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.label} className="border-t border-line-soft first:border-t-0">
                        <th scope="row" className="py-1.5 pr-4 text-left font-normal text-body">{l.label}</th>
                        <td className="py-1.5 text-right text-strong">{tl(l.amount)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-line">
                      <th scope="row" className="py-2 text-left text-read font-semibold text-strong">Ödenecek tutar</th>
                      <td className="py-2 text-right text-read font-semibold text-strong">{tl(inv.total)}</td>
                    </tr>
                    {inv.paid > 0 ? (
                      <tr className="border-t border-line-soft">
                        <th scope="row" className="py-1.5 text-left font-normal text-body">Ödenen</th>
                        <td className="py-1.5 text-right text-success">-{tl(inv.paid)}</td>
                      </tr>
                    ) : null}
                    {lateFee > 0 ? (
                      <tr className="border-t border-line-soft">
                        <th scope="row" className="py-1.5 text-left font-normal text-body">Gecikme zammı ({late} gün)</th>
                        <td className="py-1.5 text-right text-danger">{tl(lateFee)}</td>
                      </tr>
                    ) : null}
                    <tr className="border-t border-line">
                      <th scope="row" className="py-1.5 text-left font-semibold text-strong">Kalan bakiye</th>
                      <td className="py-1.5 text-right font-semibold text-strong">{inv.cancelled ? tl(0) : tl(balance + lateFee)}</td>
                    </tr>
                  </tbody>
                </table>
                {lateFee > 0 ? <p className="mt-2 text-micro text-muted">{LATE_NOTE}</p> : null}
              </section>
            </div>
          </article>
        </div>

        <div className="grid min-w-0 grid-cols-1 content-start gap-5 xl:col-span-2">
          <Panel title="Durum ve Bakiye" actions={<StatusBadge inv={inv} />}>
            <div className="grid gap-4 p-4 sm:p-5">
              <div>
                <p className="text-small text-muted">Kalan bakiye</p>
                <p className="edas-mono text-display font-semibold tracking-tight text-strong">{inv.cancelled ? tl(0) : tl(balance)}</p>
              </div>
              <TickMeter label="Ödeme ilerlemesi" value={Math.round((inv.paid / inv.total) * 20)} max={20} text={`%${num1.format((inv.paid / inv.total) * 100)}`} valueText={`${tl(inv.paid)} / ${tl(inv.total)} ödendi`} />
              {isOverdue(inv) ? (
                <p className="flex items-start gap-2 rounded-lg bg-danger-wash p-3 text-small text-danger">
                  <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                  <span>
                    Vadesi {late} gün önce geçti. {LATE_NOTE}
                  </span>
                </p>
              ) : null}
              {inv.status === "itirazli" && !inv.cancelled ? (
                <div className="grid gap-2 rounded-lg bg-primary-wash p-3 text-small text-primary-ink">
                  <p className="flex items-start gap-2">
                    <Gavel aria-hidden className="mt-0.5 size-4 shrink-0" />
                    <span>
                      <strong className="font-semibold">İtiraz açık:</strong> {inv.dispute}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        resolveDispute(inv.id, "kabul");
                        notify({ title: "İtiraz kabul edildi", body: "Düzeltme faturası için iş emri açıldı.", tone: "success" });
                      }}
                    >
                      Kabul Et
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        resolveDispute(inv.id, "red");
                        notify({ title: "İtiraz reddedildi", body: "Fatura geçerli; tahsilat sürüyor.", tone: "info" });
                      }}
                    >
                      Reddet
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </Panel>

          <Panel title="İşlemler" note={closed ? "Bu fatura kapalı; yalnız gönderim ve indirme açık." : "Her işlem fatura geçmişine yazılır."}>
            <ul className="grid gap-1 p-2">
              {[
                { icon: <Mail />, label: "E-posta Gönder", hint: c.email, disabled: false, run: () => { logSend(inv.id, "e-posta"); notify({ title: "Fatura e-postası gönderildi", body: c.email, tone: "success" }); } },
                { icon: <MessageSquare />, label: "SMS Gönder", hint: c.phone, disabled: false, run: () => { logSend(inv.id, "sms"); notify({ title: "Hatırlatma SMS'i gönderildi", body: c.phone, tone: "success" }); } },
                { icon: <CalendarPlus />, label: "Vadeyi Uzat", hint: "7, 14 ya da 30 gün", disabled: closed, run: () => setDialog("vade") },
                { icon: <Gavel />, label: "İtiraz Kaydı Aç", hint: "Neden ve belge ekle", disabled: closed || inv.status === "itirazli", run: () => setDialog("itiraz") },
                { icon: <Ban />, label: "İptal / Düzeltme Faturası", hint: "Yıkıcı işlem, onay ister", disabled: inv.cancelled, run: () => setDialog("iptal") },
              ].map((a) => (
                <li key={a.label}>
                  <button
                    type="button"
                    disabled={a.disabled}
                    onClick={a.run}
                    className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left transition-colors hover:bg-surface disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <IconTile tone={a.label.startsWith("İptal") ? "danger" : "neutral"}>{a.icon}</IconTile>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-medium text-strong">{a.label}</span>
                      <span className="block truncate text-small text-muted">{a.hint}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Fatura Geçmişi" note={`${events.length} olay`}>
            <div className="p-4 sm:p-5">
              <Timeline events={events.map((e) => ({ id: e.id, at: e.at, when: e.when, title: e.title, description: e.detail, tone: e.tone }))} />
            </div>
          </Panel>

          <Panel title="İlgili Kayıtlar">
            <ul className="grid gap-0.5 p-2 text-base">
              {related
                .map((l) => (
                  <li key={l.label}>
                    <a {...link(go, l.to.page, l.to.params)} className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 text-body hover:bg-surface hover:text-strong">
                      <span className="truncate">{l.label}</span>
                      <span aria-hidden className="text-muted">→</span>
                    </a>
                  </li>
                ))}
            </ul>
          </Panel>
        </div>
      </PageBody>

      <PayDialog open={dialog === "ode"} onOpenChange={(o) => !o && setDialog(null)} inv={inv} onDone={() => setDialog(null)} />
      <ExtendDialog open={dialog === "vade"} onOpenChange={(o) => !o && setDialog(null)} id={inv.id} onDone={() => setDialog(null)} />
      <DisputeDialog open={dialog === "itiraz"} onOpenChange={(o) => !o && setDialog(null)} id={inv.id} onDone={() => setDialog(null)} />
      <CancelDialog open={dialog === "iptal"} onOpenChange={(o) => !o && setDialog(null)} id={inv.id} onDone={() => setDialog(null)} />
      <SampleNote className="px-4 pb-6 sm:px-6" />
    </>
  );
}

/* --- Ayrıntı diyalogları ------------------------------------------------------ */

function PayDialog({ open, onOpenChange, inv, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; inv: EffectiveInvoice; onDone: () => void }) {
  const { notify } = useApp();
  const balance = inv.total - inv.paid;
  const [channel, setChannel] = useState<PaymentChannel>("banka");
  const [amount, setAmount] = useState<number | null>(null);
  const [reference, setReference] = useState("");
  const value = amount ?? balance / 100;
  const invalid = !(value > 0) || Math.round(value * 100) > balance;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Elle Tahsilat Gir"
      description={`${inv.id} için kasa, şube ya da banka dekontuyla alınan ödeme. Kalan bakiye ${tl(balance)}.`}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            disabled={invalid}
            onClick={() => {
              recordPayment(inv.id, { channel, amount: Math.round(value * 100), reference: reference.trim() });
              notify({ title: `${tl(Math.round(value * 100))} tahsilat işlendi`, body: Math.round(value * 100) >= balance ? "Fatura ödendi olarak kapandı." : "Kısmi ödeme kaydedildi.", tone: "success" });
              setAmount(null);
              setReference("");
              onDone();
            }}
          >
            Ödemeyi Kaydet
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Select label="Ödeme Kanalı" items={CHANNELS.map((k) => ({ value: k, label: CHANNEL_LABEL[k] }))} value={channel} onValueChange={(v) => setChannel((v as PaymentChannel) ?? "banka")} />
        <NumberField label="Tutar (₺)" value={Number(value.toFixed(2))} onValueChange={setAmount} min={0} max={balance / 100} step={10} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} error={invalid ? "Tutar 0'dan büyük, bakiyeyi aşmayan bir değer olmalı." : undefined} />
        <Input label="Dekont / Referans No" hint="Boş bırakırsanız sistem bir referans üretir." value={reference} onChange={(e) => setReference(e.target.value)} />
      </div>
    </Dialog>
  );
}

function ExtendDialog({ open, onOpenChange, id, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; id: string; onDone: () => void }) {
  const { notify } = useApp();
  const [days, setDays] = useState("14");
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Vadeyi Uzat"
      description="Yeni son ödeme tarihi, gecikmişse bugünden itibaren sayılır. Gecikme zammı durur."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              extendDue(id, Number(days));
              notify({ title: `Vade ${days} gün uzatıldı`, tone: "success" });
              onDone();
            }}
          >
            Vadeyi Uzat
          </Button>
        </>
      }
    >
      <Select label="Uzatma Süresi" items={[{ value: "7", label: "7 gün" }, { value: "14", label: "14 gün" }, { value: "30", label: "30 gün" }]} value={days} onValueChange={(v) => setDays(v ?? "14")} />
    </Dialog>
  );
}

const DISPUTE_REASONS = ["Tüketim beklenenden yüksek", "Sayaç endeksi hatalı", "Tarife yanlış uygulanmış", "Çift fatura", "Taşınma sonrası adres hatası"];

function DisputeDialog({ open, onOpenChange, id, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; id: string; onDone: () => void }) {
  const { notify } = useApp();
  const [reason, setReason] = useState(DISPUTE_REASONS[0]);
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      dismissible={false}
      title="İtiraz Kaydı Aç"
      description="İtirazlı fatura tahsilat listelerinden ve kesme adaylarından çıkar; inceleme sonucuna göre kapanır."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              fileDispute(id, reason, note);
              notify({ title: "İtiraz kaydı açıldı", body: `${files.length} belge eklendi. Fatura itirazlı durumuna geçti.`, tone: "success" });
              setNote("");
              setFiles([]);
              onDone();
            }}
          >
            İtirazı Kaydet
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Select label="İtiraz Nedeni" items={DISPUTE_REASONS.map((r) => ({ value: r, label: r }))} value={reason} onValueChange={(v) => setReason(v ?? DISPUTE_REASONS[0])} />
        <Textarea label="Açıklama" hint="Abonenin ifadesi ve varsa saha bulgusu." value={note} onChange={(e) => setNote(e.target.value)} minRows={3} />
        <FileDropzone label="Belge Ekle" hint="PDF ya da görsel, en çok 5 MB" accept={["application/pdf", "image/*"]} maxBytes={5 * 1024 * 1024} multiple onFiles={(ok) => setFiles(ok.map((f) => f.name))} />
        {files.length ? <p className="text-small text-muted">Eklendi: {files.join(", ")}</p> : null}
      </div>
    </Dialog>
  );
}

function CancelDialog({ open, onOpenChange, id, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; id: string; onDone: () => void }) {
  const { notify } = useApp();
  const [rebill, setRebill] = useState("duzeltme");
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Faturayı İptal Et"
      description="İptal edilen fatura geri açılmaz. Yanlış tutar varsa iptal faturasıyla kapatılır ve yenisi kesilir."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Vazgeç
          </Button>
          <HoldButton
            tone="danger"
            hint="Onaylamak için basılı tutun"
            doneLabel="İptal Edildi"
            onConfirm={() => {
              cancelInvoice(id, rebill === "duzeltme");
              notify({ title: `${id} iptal edildi`, body: rebill === "duzeltme" ? "Düzeltme faturası için iş emri açıldı." : "İptal faturası işlendi.", tone: "info" });
              onDone();
            }}
          >
            Faturayı İptal Et
          </HoldButton>
        </>
      }
    >
      <Select label="İptal Sonrası" items={[{ value: "duzeltme", label: "Düzeltme faturası kes" }, { value: "sadece", label: "Yalnız iptal et" }]} value={rebill} onValueChange={(v) => setRebill(v ?? "duzeltme")} />
    </Dialog>
  );
}

/* ================================ SAYFA ====================================== */

export function FaturalarPage(props: PageProps) {
  return props.params.id ? <InvoiceDetail id={props.params.id} go={props.go} /> : <InvoiceList {...props} />;
}
