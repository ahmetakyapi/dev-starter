"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Ban,
  CalendarPlus,
  CheckCircle2,
  FileDown,
  FilePlus2,
  Gavel,
  Mail,
  MessageSquare,
  PhoneCall,
  Play,
  Printer,
  Receipt,
  ShieldAlert,
  TriangleAlert,
  Undo2,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { ChartCard } from "@/components/ui/chart-card";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { FactorList } from "@/components/ui/factor-list";
import { ImpactBar } from "@/components/ui/impact-bar";
import { InsightCallout } from "@/components/ui/insight-callout";
import { OptionCards } from "@/components/ui/option-cards";
import { PolicyChecks, type PolicyCheck } from "@/components/ui/policy-checks";
import { ValueDiff } from "@/components/ui/value-diff";
import { EmptyState } from "@/components/ui/empty-state";
import type { FilterGroup, FilterValue } from "@/components/ui/filter-sheet";
import { HoldButton } from "@/components/ui/hold-button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { SelectionAction, SelectionBar } from "@/components/ui/selection-bar";
import { Select } from "@/components/ui/select";
import { StackedBarChart } from "@/components/ui/stacked-bar-chart";
import { Textarea } from "@/components/ui/textarea";
import { Timeline } from "@/components/ui/timeline";
import {
  CURRENT_PERIOD,
  KINDS,
  KIND_LABEL,
  PERIODS_12,
  REGIONS,
  SOURCE_LABEL,
  SUPPLIERS,
  TODAY_KEY,
  addDays,
  customer,
  dayKey,
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
} from "./_data";
import {
  AGE_BUCKETS,
  aging,
  allInvoices,
  createPlan,
  debtOf,
  draftsFor,
  fileDispute,
  invoiceEvents,
  invoiceOf,
  invoiceTab,
  isOverdue,
  issueCorrection,
  logSend,
  overdueDays,
  runAccrual,
  statusOf,
  undoAccrual,
  useFinance,
  type Draft,
  type EffectiveInvoice,
} from "./_data-finans";
import {
  CALL_STATE_LABEL,
  EXTEND_DIRECT_MAX_DAYS,
  accrualPreview,
  checkPayment,
  decideExtension,
  deleteViewRow,
  downloadCsv,
  dueNow,
  followUpOf,
  invoiceLines,
  issuerOf,
  linesTotal,
  logFollowUp,
  promiseBroken,
  readingOfInvoice,
  requestExtension,
  saveViewRow,
  smsFor,
  submitPayment,
  useExtensionRequests,
  useFollowUps,
  useSavedViewRows,
  type CallState,
} from "./_data-fatura";
import { useAging } from "./_data-pano";
import { AgingBars, BarTarget, EmptyStateX, FilterBar, PageHero, UnitLegend, fmtNum, fmtPct, fmtTl, fmtTlCompact } from "./_kit";
import { useCan, currentUser } from "./_permissions";
import { COLLECTION_SCOPE, collectionRate } from "./_selectors";
import { requestInvoiceCancel, useStoreVersion } from "./_store";
import { IconTile, InvoiceBadge, PageBody, PageHead, Panel, href, useApp, type PageProps } from "./_ui";

/* ======================================================================== */
/* Ortak                                                                     */
/* ======================================================================== */

const PAGE_SIZE = 12;
const link = (go: PageProps["go"], page: Parameters<PageProps["go"]>[0], params: Record<string, string | undefined>) => ({
  href: href(page, params),
  onClick: (e: { preventDefault: () => void }) => {
    e.preventDefault();
    go(page, params);
  },
});

function StatusBadge({ inv }: { inv: EffectiveInvoice }) {
  const status = statusOf(inv);
  if (status === "iptal") return <Badge tone="neutral" dot>İptal Edildi</Badge>;
  return <InvoiceBadge status={status} />;
}

type View = "kuyruk" | "hepsi" | "geciken" | "vadesi-gelmemis" | "odenen" | "itirazli" | "taslak";
const VIEWS: readonly { id: View; label: string }[] = [
  { id: "kuyruk", label: "Tahsilat Listesi" },
  { id: "hepsi", label: "Tüm Faturalar" },
  { id: "geciken", label: "Geciken" },
  { id: "vadesi-gelmemis", label: "Vadesi Gelmemiş" },
  { id: "odenen", label: "Ödenen" },
  { id: "itirazli", label: "İtirazlı" },
  { id: "taslak", label: "Taslak" },
];
/** Eski bağlantılar (Pano, komut paleti): `?status=gecikti` → kuyruk. */
const ALIAS: Record<string, View> = { gecikti: "kuyruk", geciken: "geciken", kesilen: "vadesi-gelmemis", odenen: "odenen", itirazli: "itirazli", taslak: "taslak", hepsi: "hepsi", kuyruk: "kuyruk", "vadesi-gelmemis": "vadesi-gelmemis" };

type Snapshot = { view: View; q: string; filters: FilterValue; period: string };

const FILTER_GROUPS: readonly FilterGroup[] = [
  { id: "kind", label: "Abone Türü", multiple: true, options: KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] })) },
  { id: "region", label: "Bölge", multiple: true, options: REGIONS.map((r) => ({ value: r.id, label: r.name })) },
  { id: "tariff", label: "Tarife", options: [{ value: "tek-zamanli", label: "Tek Zamanlı" }, { value: "cok-zamanli", label: "Çok Zamanlı" }] },
  { id: "sup", label: "Tedarikçi", multiple: true, options: SUPPLIERS.map((s) => ({ value: s.id, label: s.name })) },
  { id: "amount", label: "Tutar Aralığı", options: [{ value: "0-500", label: "500 ₺ Altı" }, { value: "500-2000", label: "500 - 2.000 ₺" }, { value: "2000-ustu", label: "2.000 ₺ Üstü" }] },
];
const GROUP_LABEL = Object.fromEntries(FILTER_GROUPS.map((g) => [g.id, g.label]));
const OPTION_LABEL: Record<string, string> = Object.fromEntries(FILTER_GROUPS.flatMap((g) => g.options.map((o) => [`${g.id}:${o.value}`, String(o.label)])));

const matchesFilters = (i: EffectiveInvoice, f: FilterValue, q: string) => {
  const c = customer(i.customerId);
  const has = (id: string) => (f[id] ?? []).length > 0;
  if (has("kind") && !f.kind.includes(c.kind)) return false;
  if (has("region") && !f.region.includes(c.regionId)) return false;
  if (has("tariff") && !f.tariff.includes(c.tariff)) return false;
  if (has("sup") && !f.sup.includes(i.supplierId)) return false;
  if (has("amount")) {
    const lira = i.total / 100;
    const a = f.amount[0];
    if (a === "0-500" && lira >= 500) return false;
    if (a === "500-2000" && (lira < 500 || lira >= 2000)) return false;
    if (a === "2000-ustu" && lira < 2000) return false;
  }
  const query = q.trim().toLocaleLowerCase("tr-TR");
  if (query && !`${i.id} ${c.id} ${c.name} ${c.installation}`.toLocaleLowerCase("tr-TR").includes(query)) return false;
  return true;
};

/* ======================================================================== */
/* LİSTE                                                                     */
/* ======================================================================== */

function InvoiceList({ params, go }: PageProps) {
  const { notify } = useApp();
  useStoreVersion();
  const fin = useFinance();
  const follow = useFollowUps();
  const canPay = useCan("odeme");
  const canInvoice = useCan("fatura");
  const saved = useSavedViewRows<Snapshot>("invoices");
  const requests = useExtensionRequests();
  const all = useMemo(() => allInvoices(fin), [fin]);

  const [view, setView] = useState<string>(ALIAS[params.status ?? ""] ?? "kuyruk");
  useEffect(() => {
    const next = ALIAS[params.status ?? ""];
    if (next) setView(next);
  }, [params.status]);
  const [period, setPeriod] = useState<string>(PERIODS_12[10]);
  const [q, setQ] = useState(params.customer ?? "");
  const [filters, setFilters] = useState<FilterValue>({});
  const [bucket, setBucket] = useState<string>("hepsi");
  const [picked, setPicked] = useState<readonly string[]>([]);
  const [accrual, setAccrual] = useState(false);
  const [extend, setExtend] = useState(false);
  const [callFor, setCallFor] = useState<EffectiveInvoice | null>(null);
  const [planFor, setPlanFor] = useState<string | null>(null);
  const page = Math.max(1, Number(params.page) || 1);

  const savedRow = saved.find((s) => `saved:${s.id}` === view);
  const baseView: View = savedRow ? savedRow.snapshot.view : (view as View);

  const inPeriod = useMemo(() => all.filter((i) => period === "tum" || i.period === period), [all, period]);
  const overdueAll = useMemo(() => all.filter(isOverdue), [all]);

  const drafts = useMemo(() => (baseView === "taslak" ? draftsFor(CURRENT_PERIOD, fin) : []), [baseView, fin]);
  const draftCount = useMemo(() => draftsFor(CURRENT_PERIOD, fin).length, [fin]);

  const source = useMemo(() => {
    if (baseView === "kuyruk") return overdueAll;
    if (baseView === "hepsi") return inPeriod;
    if (baseView === "geciken") return inPeriod.filter((i) => invoiceTab(i) === "geciken");
    if (baseView === "vadesi-gelmemis") return inPeriod.filter((i) => invoiceTab(i) === "kesilen");
    if (baseView === "odenen") return inPeriod.filter((i) => invoiceTab(i) === "odenen");
    if (baseView === "itirazli") return inPeriod.filter((i) => invoiceTab(i) === "itirazli");
    return [];
  }, [baseView, inPeriod, overdueAll]);

  const filtered = useMemo(() => {
    const rows = source
      .filter((i) => matchesFilters(i, filters, q))
      .filter((i) => baseView !== "kuyruk" || bucket === "hepsi" || (() => {
        const b = AGE_BUCKETS.find((x) => x.id === bucket);
        const d = overdueDays(i);
        return !!b && d >= b.min && d <= b.max;
      })());
    if (baseView === "kuyruk") return [...rows].sort((a, b) => overdueDays(b) - overdueDays(a) || b.total - b.paid - (a.total - a.paid));
    return [...rows].sort((a, b) => (a.issued === b.issued ? b.total - a.total : a.issued < b.issued ? 1 : -1));
  }, [source, filters, q, baseView, bucket]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /* Görünüm sayıları: sekme adı ile ölçü aynı kelimeyi iki anlamda KULLANMAZ. */
  const counts: Record<View, number> = useMemo(() => {
    const live = inPeriod.filter((i) => !i.cancelled);
    return {
      kuyruk: overdueAll.length,
      hepsi: live.length,
      geciken: live.filter((i) => invoiceTab(i) === "geciken").length,
      "vadesi-gelmemis": live.filter((i) => invoiceTab(i) === "kesilen").length,
      odenen: live.filter((i) => invoiceTab(i) === "odenen").length,
      itirazli: live.filter((i) => invoiceTab(i) === "itirazli").length,
      taslak: draftCount,
    };
  }, [inPeriod, overdueAll, draftCount]);

  /* Ölçüler */
  const live = inPeriod.filter((i) => !i.cancelled);
  const billed = live.reduce((s, i) => s + i.total, 0);
  const paid = live.reduce((s, i) => s + i.paid, 0);
  const openNotDue = live.filter((i) => invoiceTab(i) === "kesilen").reduce((s, i) => s + (i.total - i.paid), 0);
  const agingNow = useAging();
  const overdueBalance = overdueAll.reduce((s, i) => s + dueNow(i).total, 0);
  const debtors = new Set(overdueAll.map((i) => i.customerId)).size;
  const rate = collectionRate(period === "tum" ? PERIODS_12[10] : period);
  const toCall = useMemo(
    () =>
      [...new Set(overdueAll.map((i) => i.customerId))].filter((cid) => {
        const f = follow[cid] ?? { state: "aranmadi" as const, by: "", at: "" };
        return f.state === "aranmadi" || promiseBroken(f);
      }),
    [overdueAll, follow],
  );

  /* Yaş dağılımı (kuyruk başlığı) */
  const buckets = useMemo(() => aging(fin), [fin]);

  /* Dönem grafiği: ödenen NÖTR, geciken `danger` ve baskın. */
  const chartPeriods = PERIODS_12.slice(5, 11);
  const stacked = chartPeriods.map((p) => {
    const rs = all.filter((i) => i.period === p && !i.cancelled);
    const late = rs.filter(isOverdue).reduce((s, i) => s + (i.total - i.paid), 0);
    const paidSum = rs.reduce((s, i) => s + i.paid, 0);
    const open = rs.reduce((s, i) => s + (i.total - i.paid), 0) - late;
    return { label: new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(parseDay(p)).replace(".", ""), values: [Math.round(paidSum / 100_000), Math.round(open / 100_000), Math.round(late / 100_000)] };
  });
  const sumSeries = (k: number) => stacked.reduce((s, d) => s + d.values[k], 0);
  const byKind = KINDS.map((k) => ({
    id: k,
    label: KIND_LABEL[k],
    value: inPeriod.filter((i) => !i.cancelled && customer(i.customerId).kind === k).reduce((s, i) => s + i.total, 0),
  })).sort((a, b) => b.value - a.value);
  const lateByKind = KINDS.map((k) => ({
    id: k,
    label: KIND_LABEL[k],
    value: overdueAll.filter((i) => customer(i.customerId).kind === k).reduce((s, i) => s + (i.total - i.paid), 0),
  })).sort((a, b) => b.value - a.value);

  /* Etkin süzgeç çipleri */
  const chips = Object.entries(filters).flatMap(([g, vals]) => vals.map((v) => ({ id: `${g}:${v}`, label: GROUP_LABEL[g], value: OPTION_LABEL[`${g}:${v}`] ?? v })));
  const removeChip = (id: string) => {
    const [g, ...rest] = id.split(":");
    const v = rest.join(":");
    setFilters((f) => ({ ...f, [g]: (f[g] ?? []).filter((x) => x !== v) }));
    setPicked([]);
  };
  const clearFilters = () => {
    setFilters({});
    setQ("");
    setBucket("hepsi");
    setPicked([]);
  };

  const changeView = (id: string) => {
    setView(id);
    setPicked([]);
    setBucket("hepsi");
    const row = saved.find((s) => `saved:${s.id}` === id);
    if (row) {
      setQ(row.snapshot.q);
      setFilters(row.snapshot.filters);
      setPeriod(row.snapshot.period);
    }
    go("invoices", { status: row ? undefined : id === "kuyruk" ? undefined : id });
  };

  const hrefFor = (n: number) => href("invoices", { ...params, page: n > 1 ? String(n) : undefined });

  /* Toplu işlemler */
  const bulk = {
    sms: () => {
      const targets = all.filter((i) => picked.includes(i.id));
      targets.forEach((i) => logSend(i.id, "sms"));
      notify({ title: `${targets.length} Aboneye Hatırlatma SMS'i Gönderildi`, body: `Şablon: Vade Hatırlatma. Örnek: “${targets[0] ? smsFor(targets[0]).slice(0, 90) : ""}…”`, tone: "success" });
      setPicked([]);
    },
    csv: () => {
      const targets = all.filter((i) => picked.includes(i.id));
      downloadCsv(`faturalar-${TODAY_KEY}.csv`, ["Fatura no", "Abone", "Tesisat no", "Dönem", "Tutar (TL)", "Bakiye (TL)", "Vade", "Durum"], targets.map((i) => [i.id, customer(i.customerId).name, customer(i.customerId).installation, periodLabel(i.period), (i.total / 100).toFixed(2), (dueNow(i).total / 100).toFixed(2), i.due, statusOf(i)]));
      notify({ title: `${targets.length} Fatura CSV Olarak İndirildi`, tone: "success" });
    },
  };

  const exportAll = () => {
    downloadCsv(`faturalar-${baseView}-${TODAY_KEY}.csv`, ["Fatura no", "Abone", "Tesisat no", "Dönem", "Tutar (TL)", "Bakiye (TL)", "Vade", "Gecikme (gün)", "Durum"], filtered.map((i) => [i.id, customer(i.customerId).name, customer(i.customerId).installation, periodLabel(i.period), (i.total / 100).toFixed(2), (dueNow(i).total / 100).toFixed(2), i.due, overdueDays(i), statusOf(i)]));
    notify({ title: `${num.format(filtered.length)} Satır CSV Olarak İndirildi`, body: "Geçerli süzgeç ve görünüm uygulandı.", tone: "success" });
  };

  /* Kuyruk satırları: aranma + söz tarihi */
  const callBadge = (customerId: string) => {
    const f = followUpOf(customerId);
    const broken = promiseBroken(f);
    return (
      <span className="grid gap-0.5">
        <Badge tone={broken ? "danger" : f.state === "soz-verdi" ? "primary" : f.state === "aranmadi" ? "neutral" : "warning"} dot>
          {broken ? "Söz tutulmadı" : CALL_STATE_LABEL[f.state]}
        </Badge>
        {f.promiseDate ? <span className="text-micro text-muted">Söz: {dayLabel(f.promiseDate)}</span> : null}
      </span>
    );
  };

  const pickCol: Column<EffectiveInvoice> = {
    key: "pick",
    header: (
      <Checkbox
        aria-label="Bu Sayfadaki Bütün Faturaları Seç"
        checked={rows.length > 0 && rows.every((r) => picked.includes(r.id))}
        onChange={(e) => setPicked(e.target.checked ? [...new Set([...picked, ...rows.map((r) => r.id)])] : picked.filter((id) => !rows.some((r) => r.id === id)))}
      />
    ),
    width: "3rem",
    render: (r) => <Checkbox aria-label={`${r.id} faturasını seç`} checked={picked.includes(r.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, r.id] : picked.filter((id) => id !== r.id))} />,
  };
  const idCol: Column<EffectiveInvoice> = {
    key: "id",
    header: "Fatura No",
    render: (r) => (
      <a {...link(go, "invoices", { id: r.id })} className="kz-mono font-semibold text-primary-ink hover:underline">
        {r.id}
      </a>
    ),
  };
  const custCol: Column<EffectiveInvoice> = {
    key: "customer",
    header: "Abone",
    render: (r) => (
      <span className="block min-w-0">
        <span className="block truncate font-medium text-strong">{customer(r.customerId).name}</span>
        <span className="kz-mono text-micro text-muted">{customer(r.customerId).installation}</span>
      </span>
    ),
  };

  const queueColumns: readonly Column<EffectiveInvoice>[] = [
    pickCol,
    custCol,
    idCol,
    {
      key: "age",
      header: "Gecikme",
      numeric: true,
      render: (r) => (
        <span className={overdueDays(r) > 60 ? "kz-mono font-semibold text-danger" : "kz-mono text-strong"}>
          {overdueDays(r)} gün
        </span>
      ),
    },
    { key: "balance", header: "Ödenecek (Zam Dahil)", numeric: true, render: (r) => <span className="kz-mono font-medium text-strong">{tl(dueNow(r).total)}</span> },
    { key: "call", header: "Görüşme", render: (r) => callBadge(r.customerId) },
    {
      key: "act",
      header: <span className="sr-only">İşlemler</span>,
      render: (r) => (
        <span className="flex items-center justify-end gap-1.5">
          <Button variant="secondary" size="sm" disabled={!canPay} onClick={() => setCallFor(r)}>
            <PhoneCall aria-hidden /> Ara
          </Button>
          <Button variant="ghost" size="sm" disabled={!canPay} onClick={() => setPlanFor(r.customerId)}>
            Plan
          </Button>
        </span>
      ),
    },
  ];

  const listColumns: readonly Column<EffectiveInvoice>[] = [
    pickCol,
    idCol,
    custCol,
    { key: "period", header: "Dönem", render: (r) => periodLabel(r.period) },
    { key: "usage", header: "Tüketim", numeric: true, render: (r) => <span className="kz-mono">{kwh(r.usageKwh)}</span> },
    { key: "total", header: "Tutar", numeric: true, render: (r) => <span className="kz-mono font-medium text-strong">{tl(r.total)}</span> },
    { key: "balance", header: "Bakiye", numeric: true, render: (r) => <span className={dueNow(r).total > 0 && !r.cancelled ? "kz-mono text-strong" : "kz-mono text-muted"}>{r.cancelled ? "-" : tl(dueNow(r).total)}</span> },
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
    value: tl(dueNow(r).total || r.total),
    meta: isOverdue(r) ? `${overdueDays(r)} gün gecikmiş · ${CALL_STATE_LABEL[followUpOf(r.customerId).state]}` : `Vade ${dayLabel(r.due)} · ${kwh(r.usageKwh)}`,
    status: <StatusBadge inv={r} />,
    href: href("invoices", { id: r.id }),
    onSelect: () => go("invoices", { id: r.id }),
  }));

  const draftColumns: readonly Column<Draft>[] = [
    { key: "id", header: "Taslak No", render: (r) => <span className="kz-mono font-semibold text-strong">{r.id}</span> },
    { key: "c", header: "Abone", render: (r) => customer(r.customerId).name },
    { key: "u", header: "Tüketim", numeric: true, render: (r) => <span className="kz-mono">{kwh(r.usageKwh)}</span> },
    { key: "t", header: "Tutar", numeric: true, render: (r) => <span className="kz-mono font-medium text-strong">{tl(r.total)}</span> },
    { key: "d", header: "Vade", render: (r) => dayLabel(r.due) },
    { key: "w", header: "Uyarı", render: (r) => (r.warnings.length ? <Badge tone="warning" dot>{r.warnings[0]}</Badge> : <Badge tone="success" dot>Hazır</Badge>) },
  ];
  const draftItems: RecordItem[] = drafts.map((d) => ({
    id: d.id,
    title: customer(d.customerId).name,
    subtitle: `${d.id} · ${kwh(d.usageKwh)}`,
    value: tl(d.total),
    meta: `Vade ${dayLabel(d.due)}`,
    status: d.warnings.length ? <Badge tone="warning" dot>{d.warnings[0]}</Badge> : <Badge tone="success" dot>Hazır</Badge>,
  }));

  /* Bugün aranacaklar (kuyruk başlığı) */
  const today5 = useMemo(
    () =>
      toCall
        .map((cid) => ({ cid, total: overdueAll.filter((i) => i.customerId === cid).reduce((s, i) => s + dueNow(i).total, 0), oldest: Math.max(...overdueAll.filter((i) => i.customerId === cid).map(overdueDays)) }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5),
    [toCall, overdueAll],
  );

  const viewItems = [
    ...VIEWS.map((v) => ({ id: v.id, label: v.label, count: counts[v.id], builtin: true })),
    ...saved.map((s) => ({ id: `saved:${s.id}`, label: s.label })),
  ];

  const pending = requests.filter((r) => r.status === "bekliyor");

  const body =
    baseView === "taslak" ? (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-4 py-3 sm:px-5">
          <p className="text-small text-muted">
            {periodLabel(CURRENT_PERIOD)} için okuması hazır {num.format(drafts.length)} abone. Şüpheli okumalar tahakkuktan hariç tutulur; bekleyen okumalar sonraki tahakkukta kesilir.
          </p>
          <Button variant="primary" size="sm" disabled={drafts.length === 0 || !canInvoice} onClick={() => setAccrual(true)}>
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
              <RecordList label="Taslak Faturalar" items={draftItems.slice(0, 15)} />
            </div>
            {drafts.length > 15 ? <p className="px-5 pb-4 text-small text-muted">İlk 15 taslak gösteriliyor; tahakkuk {num.format(drafts.length)} taslağın hepsini keser.</p> : null}
          </>
        )}
      </div>
    ) : (
      <div>
        {baseView === "kuyruk" ? (
          <div className="grid gap-4 border-b border-line-soft p-4 sm:px-5">
            <div role="group" aria-label="Gecikme Yaşına Göre Süz" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <button
                type="button"
                aria-pressed={bucket === "hepsi"}
                onClick={() => setBucket("hepsi")}
                className="cursor-pointer rounded-lg border border-line bg-overlay p-3 text-left shadow-raised hover:border-line-strong aria-pressed:border-primary aria-pressed:bg-primary-wash"
              >
                <span className="block text-small text-muted">Hepsi</span>
                <span className="kz-mono text-heading font-semibold text-strong">{num.format(overdueAll.length)}</span>
              </button>
              {buckets.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={bucket === b.id}
                  onClick={() => setBucket(b.id)}
                  className="cursor-pointer rounded-lg border border-line bg-overlay p-3 text-left shadow-raised hover:border-line-strong aria-pressed:border-primary aria-pressed:bg-primary-wash"
                >
                  <span className="block text-small text-muted">{b.label}</span>
                  <span className="kz-mono text-heading font-semibold text-strong">{num.format(b.count)}</span>
                  <span className="kz-mono block text-micro text-muted">{fmtTlCompact(b.balance)}</span>
                </button>
              ))}
            </div>
            {today5.length ? (
              <div className="rounded-lg bg-warning-wash p-3">
                <h3 className="text-small font-semibold text-warning">Bugün aranacaklar ({num.format(toCall.length)} abone)</h3>
                <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {today5.map((t) => (
                    <li key={t.cid} className="flex items-center justify-between gap-2 text-small">
                      <a {...link(go, "customers", { id: t.cid })} className="min-w-0 truncate font-medium text-strong hover:underline">
                        {customer(t.cid).name}
                      </a>
                      <span className="kz-mono shrink-0 text-body">{fmtTl(t.total, 0)} · {t.oldest} gün</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
        {filtered.length === 0 ? (
          <div className="p-4">
            <EmptyStateX
              title="Eşleşen Fatura Yok"
              hint="Süzgeçleri gevşetin, başka bir görünüm ya da dönem seçin."
              action={<Button variant="secondary" size="sm" onClick={clearFilters}>Süzgeçleri Temizle</Button>}
            />
          </div>
        ) : (
          <>
            <div className="max-md:hidden">
              <DataTable<EffectiveInvoice> caption={VIEWS.find((v) => v.id === baseView)?.label ?? "Faturalar"} columns={baseView === "kuyruk" ? queueColumns : listColumns} rows={rows} rowKey={(r) => r.id} density="comfortable" on="surface" minWidth="60rem" />
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

  return (
    <>
      <PageHead
        title="Faturalar"
        description={`${period === "tum" ? "Bütün dönemler" : periodLabel(period)} · ${num.format(live.length)} fatura, ${fmtTlCompact(billed)} tahakkuk`}
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
              }}
            />
            <Button variant="secondary" size="sm" onClick={exportAll}>
              <FileDown aria-hidden /> CSV
            </Button>
            <Button variant="primary" size="sm" disabled={!canInvoice} onClick={() => setAccrual(true)}>
              <Play aria-hidden /> Tahakkuk Çalıştır
            </Button>
          </>
        }
      />
      <PageBody>
        <PageHero
          primary={{ label: "Vadesi Geçmiş Alacak", value: fmtTlCompact(overdueBalance), foot: `${num.format(overdueAll.length)} fatura · ${num.format(debtors)} abone · gecikme zammı dahil`, goodWhen: "down", visual: <AgingBars buckets={agingNow} format={fmtTlCompact} />, to: { page: "invoices", params: { status: "kuyruk" } } }}
          secondary={[
            { label: "Tahakkuk", value: fmtTlCompact(billed), foot: `${num.format(live.length)} fatura` },
            { label: "Tahsilat Oranı", value: fmtPct(rate), foot: COLLECTION_SCOPE, goodWhen: "up" },
            { label: "Bugün Aranacak", value: fmtNum(toCall.length), foot: "Aranmayan ya da sözünü tutmayan abone", to: { page: "invoices", params: { status: "kuyruk" } } },
            { label: "Vadesi Gelmemiş Açık", value: fmtTlCompact(openNotDue), foot: `Ödenen ${fmtTlCompact(paid)}` },
            { label: "İtirazlı Fatura", value: fmtNum(counts.itirazli), foot: "Tahsilat durur, kesme engellenir", to: { page: "invoices", params: { status: "itirazli" } } },
            { label: "Taslak (Tahakkuk)", value: fmtNum(counts.taslak), foot: `${periodLabel(CURRENT_PERIOD)} okuması hazır`, to: { page: "invoices", params: { status: "taslak" } } },
          ]}
        />

        {pending.length ? (
          <Panel title="Onay Bekleyen Vade Uzatmaları" note="30 günü aşan uzatmalar ikinci bir yetkilinin onayını ister; isteyen kendi isteğini onaylayamaz.">
            <ul className="grid gap-2 p-3 sm:p-4">
              {pending.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface p-3">
                  <div className="min-w-0">
                    <p className="text-small font-semibold text-strong">{r.invoiceIds.length} fatura · {r.days} gün</p>
                    <p className="text-small text-muted">İsteyen {r.requestedBy} · “{r.reason}”</p>
                  </div>
                  <span className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const res = decideExtension(r.id, true);
                        notify(res.ok ? { title: `${r.invoiceIds.length} Faturanın Vadesi ${r.days} Gün Uzatıldı`, tone: "success" } : { title: res.error, tone: "info" });
                      }}
                    >
                      Onayla
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const res = decideExtension(r.id, false);
                        notify(res.ok ? { title: "Vade Uzatma Reddedildi", tone: "info" } : { title: res.error, tone: "info" });
                      }}
                    >
                      Reddet
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <ChartCard id="fat-donem" className="xl:col-span-2" label="Dönem Tahakkuku" value={fmtTlCompact(all.filter((i) => !i.cancelled && chartPeriods.includes(i.period)).reduce((s, i) => s + i.total, 0))} change={null} changeLabel="son altı dönem">
            <StackedBarChart
              title="Dönemlere Göre Tutar Durumu"
              data={stacked}
              series={[{ name: "Ödenen", color: 3 }, { name: "Vadesi gelmemiş", color: 2 }, { name: "Geciken", color: 6 }]}
              highlight={stacked.length - 1}
              unit=" bin ₺"
              showLegend={false}
            />
            <UnitLegend items={[{ label: "Ödenen", series: 3, value: `${num.format(sumSeries(0))} bin ₺` }, { label: "Vadesi Gelmemiş", series: 2, value: `${num.format(sumSeries(1))} bin ₺` }, { label: "Geciken", series: 6, value: `${num.format(sumSeries(2))} bin ₺` }]} className="mt-3" />
          </ChartCard>
          <ChartCard id="fat-tur" label="Türe Göre Tahakkuk" value={`${num.format(live.length)} fatura`} change={null}>
            <BarTarget rows={byKind} format={(v) => fmtTlCompact(v)} aria-label="Abone Türüne Göre Tahakkuk" />
            <div className="mt-5 border-t border-line-soft pt-4">
              <p className="mb-1 text-small font-medium text-strong">Türe Göre Geciken Alacak</p>
              <BarTarget rows={lateByKind} format={(v) => fmtTlCompact(v)} aria-label="Abone Türüne Göre Geciken Alacak" />
            </div>
          </ChartCard>
        </div>

        <Panel title="Fatura Listesi" note="Fatura numarasına basınca belge, geçmiş ve işlemler açılır.">
          <div className="grid gap-3 p-3 sm:p-4">
            <FilterBar
              search={{ value: q, onChange: (v) => { setQ(v); setPicked([]); }, placeholder: "Fatura no, abone adı, tesisat no", label: "Fatura, abone ya da tesisat ara" }}
              filters={chips}
              onRemoveFilter={removeChip}
              onClearFilters={clearFilters}
              summary={`${num.format(filtered.length)} fatura`}
              views={{
                items: viewItems,
                value: view,
                onChange: changeView,
                onSave: (name) => {
                  const row = saveViewRow<Snapshot>("invoices", name, { view: baseView, q, filters, period });
                  setView(`saved:${row.id}`);
                  notify({ title: `“${name}” Görünümü Kaydedildi`, tone: "success" });
                },
                onDelete: (id) => {
                  deleteViewRow("invoices", id.replace("saved:", ""));
                  if (view === id) changeView("kuyruk");
                },
              }}
              drawer={{ groups: FILTER_GROUPS, value: filters, onChange: (v) => { setFilters(v); setPicked([]); }, resultCount: filtered.length, resultLabel: (n) => `${num.format(n)} faturayı göster` }}
            />
          </div>
          {body}
        </Panel>
      </PageBody>

      {picked.length > 0 ? (
        <SelectionBar count={picked.length} noun="fatura" onClear={() => setPicked([])}>
          <SelectionAction icon={<MessageSquare />} onClick={bulk.sms}>
            Hatırlatma SMS'i
          </SelectionAction>
          <SelectionAction icon={<FileDown />} onClick={bulk.csv}>
            CSV İndir
          </SelectionAction>
          <SelectionAction icon={<CalendarPlus />} onClick={() => setExtend(true)}>
            Vadeyi Uzat
          </SelectionAction>
        </SelectionBar>
      ) : null}

      <ExtendDialog open={extend} onOpenChange={setExtend} ids={picked} onDone={() => setPicked([])} />
      <AccrualDialog open={accrual} onOpenChange={setAccrual} go={go} />
      <CallDialog invoice={callFor} onClose={() => setCallFor(null)} />
      <PlanDialog customerId={planFor} onClose={() => setPlanFor(null)} go={go} />
    </>
  );
}

/* ======================================================================== */
/* Diyaloglar                                                                */
/* ======================================================================== */

function ExtendDialog({ open, onOpenChange, ids, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; ids: readonly string[]; onDone: () => void }) {
  const { notify } = useApp();
  const [days, setDays] = useState("14");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const needsApproval = Number(days) > EXTEND_DIRECT_MAX_DAYS;
  const extendChecks: PolicyCheck[] = [
    { id: "adet", label: "Tek İşlemde Fatura Sayısı", detail: `${ids.length} / 50`, state: ids.length > 0 && ids.length <= 50 ? "pass" : "fail" },
    needsApproval
      ? { id: "sinir", label: "Doğrudan Uygulama Sınırı", detail: `${EXTEND_DIRECT_MAX_DAYS} günü aşıyor: ikinci yetkilinin onayı gerekir (ÖRNEK kural)`, state: "warn" }
      : { id: "sinir", label: "Doğrudan Uygulama Sınırı", detail: `${EXTEND_DIRECT_MAX_DAYS} gün içinde, hemen uygulanır ve geri alınabilir`, state: "pass" },
    reason.trim().length >= 5
      ? { id: "gerekce", label: "Gerekçe", detail: "Denetim izine yazılacak", state: "pass" }
      : { id: "gerekce", label: "Gerekçe", detail: "En az 5 karakter yazın", state: "warn" },
  ];
  useEffect(() => {
    if (!open) {
      setReason("");
      setError("");
    }
  }, [open]);
  const submit = () => {
    const r = requestExtension(ids, Number(days), reason);
    if (!r.ok) return setError(r.error);
    if (r.status === "uygulandi") notify({ title: `${r.count} Faturanın Vadesi ${days} Gün Uzatıldı`, body: "Gecikme zammı bu tarihe kadar durur.", tone: "success", undo: () => { r.undo(); } });
    else notify({ title: "Vade Uzatma Onaya Gönderildi", body: `${days} gün, ikinci yetkilinin kararını bekliyor.`, tone: "info" });
    onDone();
    onOpenChange(false);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Vadeyi Uzat"
      description={`${ids.length} faturanın son ödeme tarihi uzatılacak. Gecikmiş olanlar bugünden itibaren sayılır.`}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Vazgeç</Button>
          <Button variant="primary" onClick={submit}>{needsApproval ? "Onaya Gönder" : "Vadeyi Uzat"}</Button>
        </>
      }
    >
      <div className="grid gap-3">
        <OptionCards
          legend="Uzatma Süresi"
          value={days}
          onValueChange={setDays}
          options={[
            { value: "7", title: "7 Gün", description: "Kısa ödeme sözü; zam bu tarihe kadar durur." },
            { value: "14", title: "14 Gün", description: "Standart süre, doğrudan uygulanır.", badge: "Önerilen" },
            { value: "30", title: "30 Gün", description: "Doğrudan uygulanabilen en uzun süre." },
            { value: "45", title: "45 Gün", description: "İkinci yetkilinin onayına gider.", badge: "Onay Gerekir" },
            { value: "60", title: "60 Gün", description: "İkinci yetkilinin onayına gider.", badge: "Onay Gerekir" },
          ]}
        />
        <Textarea label="Gerekçe" value={reason} onChange={(e) => setReason(e.target.value)} minRows={2} maxLength={200} error={error || undefined} hint="Denetim izine yazılır." />
        <PolicyChecks
          title="Ön Kontroller"
          headingLevel={3}
          checks={extendChecks}
        />
      </div>
    </Dialog>
  );
}

function CallDialog({ invoice, onClose }: { invoice: EffectiveInvoice | null; onClose: () => void }) {
  const { notify } = useApp();
  const [state, setState] = useState<CallState>("ulasilamadi");
  const [date, setDate] = useState(dayKey(addDays(parseDay(TODAY_KEY), 3)));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (invoice) {
      setState("ulasilamadi");
      setNote("");
      setError("");
    }
  }, [invoice]);
  if (!invoice) return null;
  const c = customer(invoice.customerId);
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Tahsilat Görüşmesi"
      description={`${c.name} · ${num.format(overdueDays(invoice))} gün gecikmiş · ${tl(dueNow(invoice).total)}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button
            variant="primary"
            onClick={() => {
              const r = logFollowUp(invoice.customerId, state, { promiseDate: state === "soz-verdi" ? date : undefined, note });
              if (!r.ok) return setError(r.error);
              notify({ title: `${c.name}: ${CALL_STATE_LABEL[state]}`, body: state === "soz-verdi" ? `Söz tarihi ${dayLabel(date)}; tutulmazsa listede yeniden görünür.` : "Görüşme kaydedildi.", tone: "success" });
              onClose();
            }}
          >
            Kaydet
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <FactorList
          title="Neden Önce Aranmalı"
          headingLevel={3}
          severity={overdueDays(invoice) > 90 ? "critical" : overdueDays(invoice) > 60 ? "high" : overdueDays(invoice) > 30 ? "medium" : "low"}
          factors={[
            { label: "Gecikme Yaşı", value: `${num.format(overdueDays(invoice))} gün`, tone: overdueDays(invoice) > 60 ? "danger" : "warning" },
            { label: "Kalan Tutar", value: tl(dueNow(invoice).total), hint: dueNow(invoice).fee > 0 ? `${tl(dueNow(invoice).fee)} gecikme zammı dahil` : undefined },
            { label: "Söz Tarihi", value: followUpOf(invoice.customerId).promiseDate ? dayLabel(followUpOf(invoice.customerId).promiseDate!) : "Yok", tone: promiseBroken(followUpOf(invoice.customerId)) ? "danger" : "neutral", hint: promiseBroken(followUpOf(invoice.customerId)) ? "Söz tutulmadı" : undefined },
            { label: "İtiraz", value: invoice.status === "itirazli" ? "Açık itiraz var" : "Yok", tone: invoice.status === "itirazli" ? "warning" : "neutral" },
          ]}
        />
        <Select label="Görüşme Sonucu" items={(["ulasilamadi", "soz-verdi", "plan-onerildi"] as const).map((s) => ({ value: s, label: CALL_STATE_LABEL[s] }))} value={state} onValueChange={(v) => setState((v as CallState) ?? "ulasilamadi")} />
        {state === "soz-verdi" ? <Input label="Söz Verilen Tarih" type="date" min={dayKey(addDays(parseDay(TODAY_KEY), 1))} value={date} onChange={(e) => setDate(e.target.value)} error={error || undefined} /> : null}
        <Textarea label="Not" value={note} onChange={(e) => setNote(e.target.value)} minRows={2} maxLength={200} error={state === "soz-verdi" ? undefined : error || undefined} />
      </div>
    </Dialog>
  );
}

function PlanDialog({ customerId, onClose, go }: { customerId: string | null; onClose: () => void; go: PageProps["go"] }) {
  const { notify } = useApp();
  const fin = useFinance();
  const [installments, setInstallments] = useState("6");
  if (!customerId) return null;
  const c = customer(customerId);
  const debt = debtOf(customerId, fin);
  const has = fin.plans.some((p) => p.customerId === customerId && p.status === "devam");
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Ödeme Planı Öner"
      description={`${c.name} · vadesi geçmiş borç ${tl(debt)}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button
            variant="primary"
            disabled={has || debt <= 0}
            onClick={() => {
              const p = createPlan(customerId, Number(installments), 1.5);
              notify({ title: `${p.id} Ödeme Planı Kuruldu`, body: `${installments} taksit · plan sürerken kesme engellenir.`, tone: "success" });
              onClose();
              go("payments", { tab: "planlar" });
            }}
          >
            Planı Kur
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        {has ? <p className="rounded-lg bg-warning-wash p-3 text-small text-warning">Bu abonenin devam eden bir ödeme planı var.</p> : null}
        <Select label="Taksit Sayısı" items={["3", "6", "9", "12"].map((n) => ({ value: n, label: `${n} Taksit` }))} value={installments} onValueChange={(v) => setInstallments(v ?? "6")} />
        <p className="text-small text-muted">Aylık %1,5 vade farkı ile (ÖRNEK parametre). Plan, abonenin geciken faturalarına bağlanır.</p>
      </div>
    </Dialog>
  );
}

/* ============================ TAHAKKUK AKIŞI ================================= */

function AccrualDialog({ open, onOpenChange, go }: { open: boolean; onOpenChange: (open: boolean) => void; go: PageProps["go"] }) {
  const { notify } = useApp();
  const fin = useFinance();
  const [period, setPeriod] = useState(CURRENT_PERIOD);
  const [step, setStep] = useState<"onizleme" | "calisiyor" | "bitti">("onizleme");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ count: number; total: number; period: string } | null>(null);

  const drafts = useMemo(() => draftsFor(period, fin), [period, fin]);
  const preview = accrualPreview(period);
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
      setResult({ ...done, period });
      setStep("bitti");
      notify({
        title: `${num.format(done.count)} Fatura Kesildi`,
        body: `${periodLabel(period)} tahakkuku ${tl(done.total)} tutarında tamamlandı.`,
        tone: "success",
        undo: () => {
          undoAccrual(period);
        },
      });
      return;
    }
    const id = setTimeout(() => setProgress((p) => Math.min(100, p + 12 + (p > 60 ? 6 : 0))), 160);
    return () => clearTimeout(id);
  }, [step, progress, period, notify]);

  const already = drafts.length === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (step === "calisiyor" ? undefined : onOpenChange(next))}
      dismissible={step !== "calisiyor"}
      title="Tahakkuk Çalıştır"
      description="Önce kuru çalıştırma: neyin kesileceğini görün. Kesildikten sonra bu oturumda “Geri Al” ile döndürebilirsiniz."
      size="md"
      footer={
        step === "onizleme" ? (
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Vazgeç</Button>
            <HoldButton tone="neutral" disabled={already} hint="Başlatmak için basılı tutun" onConfirm={() => setStep("calisiyor")} doneLabel="Başladı">
              Tahakkuku Başlat
            </HoldButton>
          </>
        ) : step === "bitti" ? (
          <>
            <Button
              variant="ghost"
              onClick={() => {
                const n = undoAccrual(result?.period ?? period);
                notify({ title: `${num.format(n)} Fatura Geri Alındı`, body: "Okumalar taslak olarak geri döndü.", tone: "info" });
                onOpenChange(false);
              }}
            >
              <Undo2 aria-hidden /> Geri Al
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onOpenChange(false);
                go("invoices", { status: "vadesi-gelmemis" });
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
            <p role="status" className="rounded-lg bg-surface p-3 text-small text-body">{periodLabel(period)} için kesilecek taslak yok: tahakkuk tamamlandı ya da okumalar bekliyor.</p>
          ) : (
            <dl className="grid grid-cols-2 gap-3 rounded-lg bg-surface p-3 text-small">
              <div><dt className="text-muted">Kesilecek Fatura</dt><dd className="kz-mono mt-0.5 text-read font-semibold text-strong">{num.format(drafts.length)}</dd></div>
              <div><dt className="text-muted">Toplam Tutar</dt><dd className="kz-mono mt-0.5 text-read font-semibold text-strong">{tl(total)}</dd></div>
              <div><dt className="text-muted">Ortalama Fatura</dt><dd className="kz-mono mt-0.5 text-body">{drafts.length ? tl(Math.round(total / drafts.length)) : "-"}</dd></div>
              <div><dt className="text-muted">Vade</dt><dd className="mt-0.5 text-body">{fullDate.format(parseDay(drafts[0]?.due ?? TODAY_KEY))}</dd></div>
            </dl>
          )}
          {already ? null : (
            <ImpactBar
              label="Okuma Kapsamı"
              current={Math.max(0, preview.eligible - drafts.length)}
              added={drafts.length}
              limit={Math.max(1, preview.eligible + preview.flaggedExcluded + preview.pending)}
              format={(n) => `${num.format(n)} okuma`}
            />
          )}
          <PolicyChecks
            title="Ön Kontroller"
            headingLevel={3}
            checks={[
              preview.flaggedExcluded > 0
                ? { id: "supheli", label: "Şüpheli Okuma Hariç", detail: `${num.format(preview.flaggedExcluded)} okuma Okumalar sayfasında onaylanınca sonraki tahakkukta kesilir`, state: "pass" }
                : { id: "supheli", label: "Şüpheli Okuma", detail: "Hariç tutulacak okuma yok", state: "pass" },
              preview.pending > 0
                ? { id: "bekleyen", label: "Bekleyen Okuma", detail: `${num.format(preview.pending)} abone bu turda faturalanmaz`, state: "warn" }
                : { id: "bekleyen", label: "Bekleyen Okuma", detail: "Tüm okumalar alındı", state: "pass" },
              preview.estimated > 0
                ? { id: "tahmini", label: "Tahmini Endeks", detail: `${num.format(preview.estimated)} faturada: gerçek okuma gelince fark mahsup edilir`, state: "warn" }
                : { id: "tahmini", label: "Tahmini Endeks", detail: "Mahsup bekleyen yok", state: "pass" },
              { id: "cift", label: "Çift Tahakkuk", detail: already ? "Bu dönem zaten kesilmiş" : "Dönem için kesilmiş fatura yok, kapı açık", state: already ? "fail" : "pass" },
            ]}
          />
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
            <span><strong className="font-semibold">{num.format(result?.count ?? 0)} fatura kesildi</strong>, toplam {tl(result?.total ?? 0)}. Abonelere bildirim sıraya alındı.</span>
          </p>
        </div>
      )}
    </Dialog>
  );
}

/* ======================================================================== */
/* AYRINTI                                                                   */
/* ======================================================================== */

function InvoiceDetail({ id, go }: { id: string; go: PageProps["go"] }) {
  const { notify } = useApp();
  useStoreVersion();
  const fin = useFinance();
  const canPay = useCan("odeme");
  const canInvoice = useCan("fatura");
  const inv = invoiceOf(id, fin);
  const [dialog, setDialog] = useState<null | "ode" | "vade" | "itiraz" | "iptal">(null);

  if (!inv) {
    return (
      <>
        <PageHead title="Faturalar" description="Fatura bulunamadı." />
        <PageBody>
          <EmptyState icon={<Receipt />} title="Fatura Bulunamadı" hint={`${id} numaralı bir fatura yok ya da iptal sonrası arşive alındı.`} action={<Button variant="secondary" size="sm" onClick={() => go("invoices")}>Faturalara Dön</Button>} />
        </PageBody>
      </>
    );
  }

  const c = customer(inv.customerId);
  const meter = meterOf(c.id);
  const sup = supplier(inv.supplierId);
  const issuer = issuerOf(inv);
  const reading = readingOfInvoice(inv);
  const lines = invoiceLines(inv);
  const due = dueNow(inv);
  const late = overdueDays(inv);
  const events = invoiceEvents(inv, fin);
  const closed = inv.cancelled || (inv.status === "odendi" && due.fee === 0);
  const sumOk = linesTotal(lines) === inv.total;

  const related = [
    { label: `Abone: ${c.name}`, page: "customers" as const, params: { id: c.id } },
    { label: `Sayaç: ${meter.serial}`, page: "meters" as const, params: { id: meter.id } },
    ...(reading ? [{ label: `Okuma: ${periodLabel(reading.period)}`, page: "readings" as const, params: { id: reading.id } }] : []),
    { label: "Bu Faturanın Ödemeleri", page: "payments" as const, params: { invoice: inv.id } },
    ...(inv.corrects ? [{ label: `Düzelttiği Fatura: ${inv.corrects}`, page: "invoices" as const, params: { id: inv.corrects } }] : []),
  ];

  return (
    <>
      <PageHead
        title="Faturalar"
        crumb={`${inv.id} · ${c.name}`}
        description={`${periodLabel(inv.period)} dönemi · ${c.name} · tesisat ${c.installation}`}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => go("invoices")}><ArrowLeft aria-hidden /> Listeye Dön</Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                logSend(inv.id, "pdf");
                window.print();
              }}
            >
              <Printer aria-hidden /> Yazdır / PDF
            </Button>
            <Button variant="primary" size="sm" disabled={closed || !canPay} onClick={() => setDialog("ode")}><Wallet aria-hidden /> Ödeme Ekle</Button>
          </>
        }
      />
      <style href="kz-print" precedence="default">{`@media print{body *{visibility:hidden!important}[data-print-area],[data-print-area] *{visibility:visible!important}[data-print-area]{position:absolute;left:0;top:0;width:100%;box-shadow:none!important}}`}</style>
      <PageBody className="xl:grid-cols-5">
        <div className="grid min-w-0 grid-cols-1 content-start gap-5 xl:col-span-3">
          <article aria-label={`${inv.id} fatura belgesi`} data-print-area className="rounded-xl bg-overlay p-1.5 shadow-raised ring-1 ring-line">
            <div className="rounded-lg bg-overlay p-5 sm:p-7">
              <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line-soft pb-5">
                <div>
                  <p className="text-small font-semibold text-strong">{issuer.name}</p>
                  <p className="text-micro text-muted">{issuer.role} · {inv.corrects ? "Düzeltme faturası" : "e-Arşiv fatura"}</p>
                </div>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-small">
                  <dt className="text-muted">Fatura No</dt>
                  <dd className="kz-mono text-right font-medium text-strong">{inv.id}</dd>
                  <dt className="text-muted">Düzenleme</dt>
                  <dd className="text-right text-body">{fullDate.format(parseDay(inv.issued))}</dd>
                  <dt className="text-muted">Son Ödeme</dt>
                  <dd className={isOverdue(inv) ? "text-right font-medium text-danger" : "text-right text-body"}>{fullDate.format(parseDay(inv.due))}</dd>
                </dl>
              </header>

              <div className="grid gap-5 py-5 sm:grid-cols-2">
                <section aria-labelledby="fd-abone">
                  <h2 id="fd-abone" className="text-micro font-semibold tracking-wide text-muted">ABONE</h2>
                  <p className="mt-1.5 font-semibold text-strong">{c.name}</p>
                  <p className="text-small text-body">{c.address}, {c.district}</p>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-small">
                    <dt className="text-muted">Tesisat No</dt><dd className="kz-mono text-body">{c.installation}</dd>
                    <dt className="text-muted">Tür / Gerilim</dt><dd className="text-body">{KIND_LABEL[c.kind]} · {c.voltage}</dd>
                    <dt className="text-muted">Tarife</dt><dd className="text-body">{c.tariff === "cok-zamanli" ? "Çok zamanlı" : "Tek zamanlı"}</dd>
                    <dt className="text-muted">Vergi No</dt><dd className="kz-mono text-body">{c.taxMasked}</dd>
                  </dl>
                </section>
                <section aria-labelledby="fd-tedarik">
                  <h2 id="fd-tedarik" className="text-micro font-semibold tracking-wide text-muted">TEDARİKÇİ VE SAYAÇ</h2>
                  <p className="mt-1.5 font-semibold text-strong">{sup.name}</p>
                  <p className="text-small text-body">{sup.kind === "gorevli" ? "Görevli tedarik şirketi" : "Perakende satış şirketi"} · {sup.license}</p>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-small">
                    <dt className="text-muted">Sayaç No</dt><dd className="kz-mono text-body">{meter.serial}</dd>
                    <dt className="text-muted">Çarpan</dt><dd className="kz-mono text-body">{meter.multiplier}</dd>
                    <dt className="text-muted">Okuma</dt><dd className="text-body">{reading ? `${fullDate.format(parseDay(reading.date))} · ${SOURCE_LABEL[reading.source]}` : "-"}</dd>
                  </dl>
                </section>
              </div>

              {reading ? (
                <section aria-labelledby="fd-tuketim" className="border-t border-line-soft py-5">
                  <h2 id="fd-tuketim" className="text-micro font-semibold tracking-wide text-muted">TÜKETİM</h2>
                  <div className="mt-2 overflow-x-auto" tabIndex={0} role="region" aria-label="Endeks ve Tüketim Tablosu">
                    <table className="kz-mono w-full min-w-[26rem] text-small">
                      <caption className="sr-only">Zaman dilimine göre önceki endeks, son endeks ve tüketim</caption>
                      <thead>
                        <tr className="text-muted">
                          <th scope="col" className="py-1 text-left font-medium">Zaman Dilimi</th>
                          <th scope="col" className="py-1 text-right font-medium">Önceki Endeks</th>
                          <th scope="col" className="py-1 text-right font-medium">Son Endeks</th>
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
                <h2 id="fd-kalem" className="text-micro font-semibold tracking-wide text-muted">FATURA KALEMLERİ</h2>
                <table className="kz-mono mt-2 w-full text-small">
                  <caption className="sr-only">Fatura kalemleri ve tutarları</caption>
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.id} className="border-t border-line-soft first:border-t-0">
                        <th scope="row" className="py-1.5 pr-4 text-left font-normal text-body">
                          <span className={l.tone === "warning" ? "font-medium text-warning" : undefined}>{l.label}</span>
                          {l.detail ? <span className="block text-micro text-muted">{l.detail}</span> : null}
                        </th>
                        <td className="py-1.5 text-right align-top text-strong">{tl(l.amount)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-line">
                      <th scope="row" className="py-2 text-left text-read font-semibold text-strong">Fatura Tutarı</th>
                      <td className="py-2 text-right text-read font-semibold text-strong">{tl(inv.total)}</td>
                    </tr>
                    {inv.paid > 0 ? (
                      <tr className="border-t border-line-soft">
                        <th scope="row" className="py-1.5 text-left font-normal text-body">Ödenen Anapara</th>
                        <td className="py-1.5 text-right text-success">-{tl(inv.paid)}</td>
                      </tr>
                    ) : null}
                    {due.fee > 0 || inv.lateFee > 0 ? (
                      <tr className="border-t border-line-soft">
                        <th scope="row" className="py-1.5 text-left font-normal text-body">
                          Gecikme zammı{late > 0 ? ` (${late} gün)` : ""}
                          <span className="block text-micro text-muted">Fatura tutarına dahil değil, ayrı alacak</span>
                        </th>
                        <td className="py-1.5 text-right align-top text-danger">{tl(Math.max(inv.lateFee, due.fee + inv.lateFeePaid))}</td>
                      </tr>
                    ) : null}
                    {inv.lateFeePaid > 0 ? (
                      <tr className="border-t border-line-soft">
                        <th scope="row" className="py-1.5 text-left font-normal text-body">Ödenen Gecikme Zammı</th>
                        <td className="py-1.5 text-right text-success">-{tl(inv.lateFeePaid)}</td>
                      </tr>
                    ) : null}
                    <tr className="border-t border-line">
                      <th scope="row" className="py-2 text-left text-read font-semibold text-strong">Kalan Toplam</th>
                      <td className="py-2 text-right text-read font-semibold text-strong">{tl(due.total)}</td>
                    </tr>
                  </tbody>
                </table>
                {!sumOk ? <p role="alert" className="mt-3 rounded-lg bg-danger-wash p-3 text-small text-danger">Kalem toplamı fatura tutarıyla uyuşmuyor.</p> : null}
                <p className="mt-3 text-micro text-muted">{issuer.note}</p>
              </section>
            </div>
          </article>
        </div>

        <div className="grid min-w-0 content-start gap-5 xl:col-span-2">
          <Panel title="Durum ve Bakiye">
            <div className="grid gap-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <StatusBadge inv={inv} />
                {isOverdue(inv) ? <span className="text-small font-medium text-danger">{late} gün gecikmiş</span> : null}
              </div>
              <dl className="grid grid-cols-2 gap-3 rounded-lg bg-surface p-3 text-small">
                <div><dt className="text-muted">Kalan Anapara</dt><dd className="kz-mono mt-0.5 font-semibold text-strong">{tl(due.principal)}</dd></div>
                <div><dt className="text-muted">Gecikme Zammı</dt><dd className="kz-mono mt-0.5 font-semibold text-strong">{tl(due.fee)}</dd></div>
                <div className="col-span-2 border-t border-line-soft pt-2"><dt className="text-muted">Kalan Toplam</dt><dd className="kz-mono mt-0.5 text-read font-semibold text-strong">{tl(due.total)}</dd></div>
              </dl>
              {inv.status === "odendi" && due.fee > 0 ? (
                <InsightCallout kind="warning" title="Gecikme Zammı Tahsil Edilmedi" headingLevel={3} label="Dikkat">
                  Anapara ödendi ama {tl(due.fee)} gecikme zammı bekliyor: fatura zam ödenene kadar kapanmaz.
                </InsightCallout>
              ) : null}
              {inv.status === "itirazli" ? (
                <InsightCallout kind="warning" title="Tahsilat İtiraz Nedeniyle Durdu" headingLevel={3} label="Dikkat">
                  İtiraz karara bağlanana dek tahsilat ve kesme işlemi yapılmaz. Karar İtirazlar ve Mahsup sayfasında verilir.
                </InsightCallout>
              ) : null}
              {isOverdue(inv) && inv.status !== "itirazli" && due.fee > 0 && inv.status !== "odendi" ? (
                <InsightCallout title="Gecikme Zammı Doğuyor" headingLevel={3} label="Öneri">
                  {late} gündür gecikmiş: günlük zam işliyor. Vade uzatma ya da ödeme planıyla zammı durdurabilirsiniz.
                </InsightCallout>
              ) : null}
              {inv.cancelled ? <p className="text-small text-muted">Bu fatura iptal edildi.</p> : null}
            </div>
          </Panel>

          <Panel title="İşlemler">
            <div className="grid gap-2 p-4 sm:grid-cols-2">
              <Button variant="secondary" size="sm" disabled={closed || !canInvoice} onClick={() => setDialog("vade")}><CalendarPlus aria-hidden /> Vade Uzat</Button>
              <Button variant="secondary" size="sm" disabled={closed || inv.status === "itirazli" || !canInvoice} onClick={() => setDialog("itiraz")}><Gavel aria-hidden /> İtiraz Aç</Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  logSend(inv.id, "e-posta");
                  notify({ title: "Fatura E-Postası Gönderildi", body: `${c.name} adresine PDF eklendi.`, tone: "success" });
                }}
              >
                <Mail aria-hidden /> E-posta Gönder
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  logSend(inv.id, "sms");
                  notify({ title: "SMS Gönderildi", body: smsFor(inv, isOverdue(inv) ? "vade" : "fatura"), tone: "success" });
                }}
              >
                <MessageSquare aria-hidden /> SMS Gönder
              </Button>
              <Button variant="ghost" size="sm" disabled={inv.cancelled || !canInvoice} className="sm:col-span-2 text-danger" onClick={() => setDialog("iptal")}><Ban aria-hidden /> Faturayı İptal Et</Button>
            </div>
          </Panel>

          <Panel title="Fatura Geçmişi">
            <div className="p-4">
              <Timeline events={events.map((e) => ({ id: e.id, at: e.at, when: e.when, title: e.title, description: e.detail, tone: e.tone }))} />
            </div>
          </Panel>

          <Panel title="İlgili Kayıtlar">
            <ul className="grid gap-1 p-3">
              {related.map((r) => (
                <li key={r.label}>
                  <a {...link(go, r.page, r.params)} className="flex min-h-11 items-center rounded-md px-2 text-small font-medium text-primary-ink hover:bg-surface hover:underline">{r.label}</a>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </PageBody>

      <PaymentDialog open={dialog === "ode"} onOpenChange={(o) => setDialog(o ? "ode" : null)} inv={inv} />
      <ExtendDialog open={dialog === "vade"} onOpenChange={(o) => setDialog(o ? "vade" : null)} ids={[inv.id]} onDone={() => undefined} />
      <DisputeDialog open={dialog === "itiraz"} onOpenChange={(o) => setDialog(o ? "itiraz" : null)} inv={inv} />
      <CancelDialog open={dialog === "iptal"} onOpenChange={(o) => setDialog(o ? "iptal" : null)} inv={inv} go={go} />
    </>
  );
}

function PaymentDialog({ open, onOpenChange, inv }: { open: boolean; onOpenChange: (o: boolean) => void; inv: EffectiveInvoice }) {
  const { notify } = useApp();
  const [channel, setChannel] = useState<"banka" | "ptt" | "online" | "otomatik">("banka");
  const [date, setDate] = useState(TODAY_KEY);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const due = dueNow(inv, date);
  useEffect(() => {
    if (open) {
      setAmount((due.total / 100).toFixed(2).replace(".", ","));
      setSubmitted(false);
      setReference("");
      setDate(TODAY_KEY);
    }
    // yalnız açılışta varsayılan tutar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const parsed = Math.round(Number(amount.replace(/\./g, "").replace(",", ".")) * 100) || 0;
  const check = checkPayment(inv, { amount: parsed, reference, date });
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ödeme Ekle"
      description={`${inv.id} · kalan ${tl(due.total)} (anapara ${tl(due.principal)}${due.fee ? ` + zam ${tl(due.fee)}` : ""})`}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Vazgeç</Button>
          <Button
            variant="primary"
            onClick={() => {
              setSubmitted(true);
              const r = submitPayment(inv, { amount: parsed, channel, reference, date });
              if (!r.ok) return;
              notify({
                title: `${tl(parsed)} Tahsilat Girildi`,
                body: r.check.excess > 0 ? `${tl(r.check.excess)} fazla ödeme avans alacağına yazıldı.` : "Bakiye, abone kartı, Pano ve Ödemeler güncellendi.",
                tone: "success",
              });
              onOpenChange(false);
            }}
          >
            Tahsilatı Kaydet
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Select label="Kanal" items={[{ value: "banka", label: "Banka / Şube" }, { value: "ptt", label: "PTT" }, { value: "online", label: "Online / Kart" }, { value: "otomatik", label: "Otomatik Ödeme" }]} value={channel} onValueChange={(v) => setChannel((v as typeof channel) ?? "banka")} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Tutar" inputMode="decimal" prefix="₺" value={amount} onChange={(e) => setAmount(e.target.value)} error={submitted && check.errors[0] ? check.errors[0] : undefined} />
          <Input label="Ödeme Tarihi" type="date" max={TODAY_KEY} min={inv.issued} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Input label="Referans No" hint="Boş bırakılırsa kanal önekiyle üretilir." value={reference} onChange={(e) => setReference(e.target.value)} />
        {check.warnings.map((w) => (
          <p key={w} className="rounded-lg bg-warning-wash p-3 text-small text-warning">{w}</p>
        ))}
        {!submitted && check.errors.length ? <p className="text-small text-danger" role="status">{check.errors[0]}</p> : null}
        <p className="text-small text-muted">Ödeme önce gecikme zammına, sonra anaparaya işlenir. Zam tahsil edilmeden fatura “Ödendi” olmaz.</p>
      </div>
    </Dialog>
  );
}

function DisputeDialog({ open, onOpenChange, inv }: { open: boolean; onOpenChange: (o: boolean) => void; inv: EffectiveInvoice }) {
  const { notify } = useApp();
  const [reason, setReason] = useState("Tüketim yüksek");
  const [note, setNote] = useState("");
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="İtiraz Kaydı Aç"
      description="İtiraz açılınca tahsilat ve kesme durur; inceleme kuyruğuna düşer."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Vazgeç</Button>
          <Button
            variant="primary"
            onClick={() => {
              fileDispute(inv.id, reason, note);
              notify({ title: `${inv.id} için İtiraz Açıldı`, body: "İtirazlar ve Mahsup sayfasında karara bağlanır.", tone: "success" });
              onOpenChange(false);
            }}
          >
            İtirazı Kaydet
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <OptionCards
          legend="İtiraz Nedeni"
          value={reason}
          onValueChange={setReason}
          options={[
            { value: "Tüketim yüksek", title: "Tüketim Yüksek", description: "Önceki dönemlere göre beklenmedik sıçrama." },
            { value: "Sayaç doğruluğu", title: "Sayaç Doğruluğu", description: "Sayaç testi talep edilir; sonuç gelene dek tahsilat durur." },
            { value: "Yanlış tarife", title: "Yanlış Tarife", description: "Abone türü ya da tarife kaydı hatalı." },
            { value: "Mükerrer fatura", title: "Mükerrer Fatura", description: "Aynı dönem için iki fatura kesilmiş." },
            { value: "Diğer", title: "Diğer", description: "Açıklama alanına nedeni yazın." },
          ]}
        />
        <Textarea label="Açıklama" value={note} onChange={(e) => setNote(e.target.value)} minRows={2} maxLength={240} />
      </div>
    </Dialog>
  );
}

function CancelDialog({ open, onOpenChange, inv, go }: { open: boolean; onOpenChange: (o: boolean) => void; inv: EffectiveInvoice; go: PageProps["go"] }) {
  const { notify } = useApp();
  const fin = useFinance();
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Faturayı İptal Et"
      description={`${inv.id} iptal edilir ve istenirse okumadan yeniden hesaplanan düzeltme faturası kesilir.`}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Vazgeç</Button>
          <HoldButton
            tone="danger"
            hint="Basılı tutun"
            doneLabel="İşlendi"
            onConfirm={() => {
              const r = requestInvoiceCancel(inv.id, true);
              onOpenChange(false);
              if (!r.ok) return notify({ title: "Fatura İptal Yetkiniz Yok", tone: "info" });
              if (r.status === "onay-bekliyor") return notify({ title: "İptal İkinci Göz Onayına Gönderildi", body: `${r.approval.id} · isteyen ${currentUser().name}`, tone: "info" });
              const fix = issueCorrection(inv.id);
              notify({ title: "Fatura İptal Edildi", body: fix ? `${fix.id} düzeltme faturası kesildi.` : "Okuma bulunamadığı için düzeltme kesilemedi.", tone: "success" });
              if (fix) go("invoices", { id: fix.id });
            }}
          >
            İptal Et
          </HoldButton>
        </>
      }
    >
      <div className="mb-3">
        <ValueDiff
          rows={[
            { label: "İptal Edilecek Fatura", groups: inv.id.split("-"), tone: "bad", note: `${tl(inv.total)} · ${inv.period}` },
            { label: "Kesilecek Düzeltme", groups: `${inv.id.split("-D")[0]}-D${allInvoices(fin).filter((x) => x.corrects === inv.id).length + 1}`.split("-"), tone: "good", note: "Aynı okumadan yeniden hesaplanır" },
          ]}
        />
      </div>
      <p className="flex items-start gap-2 rounded-lg bg-danger-wash p-3 text-small text-danger">
        <FilePlus2 aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span>Fatura iptali iki göz kuralına bağlı olabilir. Onay gerekiyorsa işlem, ikinci yetkili onaylayınca uygulanır; düzeltme faturası o zaman elle kesilir.</span>
      </p>
    </Dialog>
  );
}

/* ======================================================================== */
/* Sayfa                                                                     */
/* ======================================================================== */

export function FaturalarPage(props: PageProps) {
  return props.params.id ? <InvoiceDetail id={props.params.id} go={props.go} /> : <InvoiceList {...props} />;
}
