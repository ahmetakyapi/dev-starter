"use client";

import { useMemo, useState, type ReactNode } from "react";
import { BellRing, CheckCircle2, FileSpreadsheet, Plus, Scissors, ShieldCheck, TriangleAlert, Wallet, XCircle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BarList } from "@/components/ui/bar-list";
import { Button } from "@/components/ui/Button";
import { ChartCard } from "@/components/ui/chart-card";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, type Column } from "@/components/ui/data-table";
import { DateRangePresets, rangeOf, type DateRangeValue, type RangePreset } from "@/components/ui/date-range-presets";
import { Dialog } from "@/components/ui/dialog";
import { ImpactBar } from "@/components/ui/impact-bar";
import { InsightCallout } from "@/components/ui/insight-callout";
import { OptionCards } from "@/components/ui/option-cards";
import { PolicyChecks } from "@/components/ui/policy-checks";
import { EmptyState } from "@/components/ui/empty-state";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { HoldButton } from "@/components/ui/hold-button";
import { NumberField } from "@/components/ui/number-field";
import { Pagination } from "@/components/ui/pagination";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { SearchField } from "@/components/ui/search-field";
import { Select } from "@/components/ui/select";
import { StackedBarChart } from "@/components/ui/stacked-bar-chart";
import { Tabs } from "@/components/ui/tabs";
import { TickMeter } from "@/components/ui/tick-meter";
import {
  CHANNELS,
  CHANNEL_LABEL,
  PERIODS_12,
  RECON_LABEL,
  TODAY,
  TODAY_KEY,
  addDays,
  customer,
  dayKey,
  dayLabel,
  fullDate,
  num,
  num1,
  parseDay,
  tl,
  tlShort,
  type Reconciliation,
} from "./_data";
import {
  aging,
  allInvoices,
  allPayments,
  autoPayRows,
  cancelPlan,
  approveMatched,
  closeReconciliation,
  createPlan,
  debtOf,
  isOverdue,
  olderDiffs,
  overdueDays,
  payInstallment,
  planInstallment,
  retryAutoPay,
  schedule,
  unmatchedLines,
  useFinance,
  type AutoPayRow,
  type BankLine,
  type EffectivePayment,
} from "./_data-finans";
import { cutEligibility, reconnectSla, scheduleSlot, useNotices } from "./_cutpolicy";
import { allCustomers } from "./_data-musteri";
import { resolveBankLine, dueNow } from "./_data-fatura";
import { PageHero, fmtNum, fmtPct, fmtTl, fmtTlCompact } from "./_kit";
import { can, useCan } from "./_permissions";
import { COLLECTION_SCOPE, collectionRate } from "./_selectors";
import { cancelWorkOrder, getWorkOrders, requestCut, requestReconnect, sendNotice, useStoreVersion, useWorkOrders } from "./_store";
import { CARD, IconTile, PageBody, PageHead, Panel, ReconBadge, href, useApp, type PageProps } from "./_ui";

const PAGE_SIZE = 10;

const TAB_IDS = ["tahsilat", "mutabakat", "planlar", "otomatik", "kesme"] as const;
type TabId = (typeof TAB_IDS)[number];
const TAB_LABEL: Record<TabId, string> = { tahsilat: "Tahsilatlar", mutabakat: "Mutabakat", planlar: "Ödeme Planları", otomatik: "Otomatik Ödeme", kesme: "Gecikme ve Kesme" };

const RANGES: readonly RangePreset[] = [
  { id: "7", label: "Son 7 Gün", days: 7 },
  { id: "30", label: "Son 30 Gün", days: 30 },
  { id: "90", label: "Son 90 Gün", days: 90 },
  { id: "tum", label: "Tümü", days: null },
];

const link = (go: PageProps["go"], page: Parameters<PageProps["go"]>[0], params: Record<string, string | undefined>) => ({
  href: href(page, params),
  onClick: (e: { preventDefault: () => void }) => {
    e.preventDefault();
    go(page, params);
  },
});

const planBadge = (status: "devam" | "tamamlandi" | "bozuldu") =>
  status === "devam" ? <Badge tone="primary" dot>Devam Ediyor</Badge> : status === "tamamlandi" ? <Badge tone="success" dot>Tamamlandı</Badge> : <Badge tone="danger" dot>Bozuldu</Badge>;

/* ============================== TAHSİLATLAR ================================== */

function Collections({ params, go }: PageProps) {
  const fin = useFinance();
  const all = useMemo(() => allPayments(fin), [fin]);
  const [q, setQ] = useState("");
  const [channel, setChannel] = useState("hepsi");
  const [recon, setRecon] = useState("hepsi");
  const [range, setRange] = useState<DateRangeValue>({ kind: "preset", id: "30" });
  const page = Math.max(1, Number(params.page) || 1);
  const invoiceFilter = params.invoice;

  const days = Array.from({ length: 7 }, (_, i) => dayKey(addDays(TODAY, i - 6)));
  const dayLabels = days.map((d) => new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(parseDay(d)).replace(".", ""));
  const stacked = days.map((d, i) => ({
    label: dayLabels[i],
    values: CHANNELS.map((ch) => Math.round(all.filter((p) => p.date === d && p.channel === ch).reduce((s, p) => s + p.amount, 0) / 100_000)),
  }));
  const monthKey = TODAY_KEY.slice(0, 7);
  const share = CHANNELS.map((ch) => ({ label: CHANNEL_LABEL[ch], value: Math.round(all.filter((p) => p.date.startsWith(monthKey) && p.channel === ch).reduce((s, p) => s + p.amount, 0) / 100_000) }));
  const pendingByChannel = CHANNELS.map((ch) => ({ label: CHANNEL_LABEL[ch], value: all.filter((p) => p.channel === ch && p.recon !== "mutabik").length }));

  const window = rangeOf(range, RANGES, TODAY);
  const filtered = useMemo(() => {
    const query = q.trim().toLocaleLowerCase("tr-TR");
    return all
      .filter((p) => !invoiceFilter || p.invoiceId === invoiceFilter)
      .filter((p) => channel === "hepsi" || p.channel === channel)
      .filter((p) => recon === "hepsi" || p.recon === recon)
      .filter((p) => !window || (parseDay(p.date) >= window.start && parseDay(p.date) <= window.end))
      .filter((p) => !query || `${p.reference} ${p.invoiceId} ${customer(p.customerId).name}`.toLocaleLowerCase("tr-TR").includes(query));
  }, [all, q, channel, recon, window, invoiceFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const sum = filtered.reduce((s, p) => s + p.amount, 0);
  const resetPage = () => params.page && go("payments", { ...params, page: undefined });

  const columns: readonly Column<EffectivePayment>[] = [
    { key: "ref", header: "Referans", render: (r) => <span className="kz-mono font-medium text-strong">{r.reference}</span> },
    {
      key: "c",
      header: "Abone",
      render: (r) => (
        <a {...link(go, "customers", { id: r.customerId })} className="font-medium text-primary-ink hover:underline">
          {customer(r.customerId).name}
        </a>
      ),
    },
    {
      key: "inv",
      header: "Fatura",
      render: (r) => (
        <a {...link(go, "invoices", { id: r.invoiceId })} className="kz-mono text-body hover:text-strong hover:underline">
          {r.invoiceId}
        </a>
      ),
    },
    { key: "date", header: "Tarih", render: (r) => dayLabel(r.date) },
    { key: "ch", header: "Kanal", render: (r) => <span>{CHANNEL_LABEL[r.channel]}{r.manual ? <span className="ml-1 text-micro text-muted">(elle)</span> : null}</span> },
    { key: "amt", header: "Tutar", numeric: true, render: (r) => <span className="kz-mono font-medium text-strong">{tl(r.amount)}</span> },
    { key: "fee", header: "Gecikme Zammı", numeric: true, render: (r) => <span className={r.lateFee ? "kz-mono text-danger" : "kz-mono text-muted"}>{r.lateFee ? tl(r.lateFee) : "-"}</span> },
    { key: "recon", header: "Mutabakat", render: (r) => <ReconBadge status={r.recon} /> },
  ];
  const items: RecordItem[] = rows.map((p) => ({
    id: p.id,
    title: customer(p.customerId).name,
    subtitle: `${p.invoiceId} · ${CHANNEL_LABEL[p.channel]}`,
    leading: <IconTile tone="success"><Wallet /></IconTile>,
    value: tl(p.amount),
    meta: `${dayLabel(p.date)} · ${p.reference}`,
    status: <ReconBadge status={p.recon} />,
    href: href("invoices", { id: p.invoiceId }),
    onSelect: () => go("invoices", { id: p.invoiceId }),
  }));

  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <ChartCard id="od-kanal" className={`${CARD} xl:col-span-2`} label="Son Yedi Gün Tahsilatı" value={tlShort(days.reduce((s, d) => s + all.filter((p) => p.date === d).reduce((x, p) => x + p.amount, 0), 0))} change={null} changeLabel="kanala göre">
          <StackedBarChart
            title="Günlere ve Kanallara Göre Tahsilat (bin ₺)"
            data={stacked}
            series={CHANNELS.map((ch, i) => ({ name: CHANNEL_LABEL[ch], color: ([1, 3, 2, 5] as const)[i] }))}
            highlight={stacked.length - 1}
            unit=" bin ₺"
          />
        </ChartCard>
        <ChartCard id="od-pay" className={CARD} label="Bu Ay Kanal Payı" value={tlShort(all.filter((p) => p.date.startsWith(monthKey)).reduce((s, p) => s + p.amount, 0))} change={null}>
          <BarList title="Kanala Göre Aylık Tahsilat" columns={["Kanal", "Bin ₺"]} items={share} valueFormat={{ maximumFractionDigits: 0 }} series={1} />
          <div className="mt-5 border-t border-line-soft pt-4">
            <BarList title="Kanala Göre Mutabakat Bekleyen" columns={["Kanal", "Ödeme"]} items={pendingByChannel} valueFormat={{ maximumFractionDigits: 0 }} series={3} />
          </div>
        </ChartCard>
      </div>

      <Panel title="Tahsilat Listesi" note={`${num.format(filtered.length)} kayıt · ${tl(sum)}`} actions={invoiceFilter ? (
        <Button variant="soft" size="sm" onClick={() => go("payments", { tab: params.tab })}>
          Fatura {invoiceFilter} ✕
        </Button>
      ) : undefined}>
        <div className="grid grid-cols-2 gap-3 border-b border-line-soft p-4 sm:px-5 lg:grid-cols-5">
          <SearchField className="col-span-2" label="Referans, fatura ya da abone ara" placeholder="Referans, fatura no, abone adı" value={q} onValueChange={(v) => { setQ(v); resetPage(); }} resultCount={filtered.length} shortcut="/" size="sm" />
          <Select label="Kanal" hideLabel items={[{ value: "hepsi", label: "Bütün Kanallar" }, ...CHANNELS.map((c) => ({ value: c, label: CHANNEL_LABEL[c] }))]} value={channel} onValueChange={(v) => { setChannel(v ?? "hepsi"); resetPage(); }} />
          <Select label="Mutabakat" hideLabel items={[{ value: "hepsi", label: "Her Durum" }, ...(["mutabik", "bekliyor", "farkli"] as Reconciliation[]).map((r) => ({ value: r, label: RECON_LABEL[r] }))]} value={recon} onValueChange={(v) => { setRecon(v ?? "hepsi"); resetPage(); }} />
          <DateRangePresets label="Tarih" presets={RANGES} value={range} onValueChange={(v) => { setRange(v); resetPage(); }} today={TODAY} max={TODAY} size="sm" />
        </div>
        {filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={<Wallet />} title="Eşleşen Tahsilat Yok" hint="Süzgeçleri gevşetin ya da tarih aralığını genişletin." />
          </div>
        ) : (
          <>
            <div className="max-md:hidden">
              <DataTable<EffectivePayment> caption="Tahsilatlar" columns={columns} rows={rows} rowKey={(r) => r.id} density="comfortable" on="surface" minWidth="62rem" />
            </div>
            <div className="px-3 pb-3 md:hidden">
              <RecordList label="Tahsilatlar" items={items} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-4 py-3 sm:px-5">
              <p className="text-small text-muted">
                {num.format(filtered.length)} kayıttan {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filtered.length)} arası
              </p>
              {pageCount > 1 ? <Pagination page={safePage} pageCount={pageCount} hrefFor={(n) => href("payments", { ...params, page: n > 1 ? String(n) : undefined })} scroll={false} /> : null}
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}

/* ============================== MUTABAKAT ==================================== */

function Reconcile() {
  const { notify } = useApp();
  const fin = useFinance();
  const all = useMemo(() => allPayments(fin), [fin]);
  const [file, setFile] = useState<string | null>(null);
  const [lineDialog, setLineDialog] = useState<BankLine | null>(null);
  const [how, setHow] = useState<"faturaya" | "avans" | "iade">("faturaya");

  const lines = useMemo(() => unmatchedLines(fin), [fin]);
  const recentDays = Array.from({ length: 4 }, (_, i) => dayKey(addDays(TODAY, -i)));
  const waitingDays = recentDays.filter((d) => all.some((p) => p.date === d && p.recon === "bekliyor"));
  const pending = all.filter((p) => p.recon === "bekliyor" && recentDays.includes(p.date));
  const matched = file ? all.filter((p) => recentDays.includes(p.date)).length - lines.length : 0;
  const canPay = useCan("odeme");
  const lineIds = lines.map((l) => l.paymentId);
  const autoMatchable = file ? all.filter((p) => p.recon === "bekliyor" && recentDays.includes(p.date) && !lineIds.includes(p.id)).length : 0;

  const byChannel = CHANNELS.map((ch) => {
    const mine = all.filter((p) => p.channel === ch && recentDays.includes(p.date));
    return {
      ch,
      total: mine.length,
      ok: mine.filter((p) => p.recon === "mutabik").length,
      wait: mine.filter((p) => p.recon === "bekliyor").length,
      diff: mine.filter((p) => p.recon === "farkli").length,
      amount: mine.reduce((s, p) => s + p.amount, 0),
    };
  });

  const lineColumns: readonly Column<BankLine>[] = [
    { key: "ref", header: "Referans", render: (l) => <span className="kz-mono font-medium text-strong">{l.reference}</span> },
    { key: "c", header: "Abone", render: (l) => customer(l.customerId).name },
    { key: "inv", header: "Fatura", render: (l) => <span className="kz-mono">{l.invoiceId}</span> },
    { key: "sys", header: "Sistem", numeric: true, render: (l) => <span className="kz-mono">{tl(l.systemAmount)}</span> },
    { key: "bank", header: "Banka", numeric: true, render: (l) => <span className="kz-mono">{tl(l.bankAmount)}</span> },
    {
      key: "kind",
      header: "Fark",
      render: (l) =>
        l.kind === "mukerrer" ? <Badge tone="warning" dot>Mükerrer</Badge> : l.kind === "fazla" ? <Badge tone="primary" dot>Fazla Ödeme {tl(l.bankAmount - l.systemAmount)}</Badge> : <Badge tone="danger" dot>Eksik {tl(l.systemAmount - l.bankAmount)}</Badge>,
    },
    {
      key: "act",
      header: <span className="sr-only">İşlem</span>,
      render: (l) => (
        <Button variant="secondary" size="sm" onClick={() => { setHow("faturaya"); setLineDialog(l); }}>
          Elle Eşleştir
        </Button>
      ),
    },
  ];
  const lineItems: RecordItem[] = lines.map((l) => ({
    id: l.id,
    title: customer(l.customerId).name,
    subtitle: `${l.reference} · ${l.invoiceId}`,
    value: tl(l.bankAmount),
    meta: `Sistem ${tl(l.systemAmount)}`,
    status: l.kind === "mukerrer" ? <Badge tone="warning" dot>Mükerrer</Badge> : l.kind === "fazla" ? <Badge tone="primary" dot>Fazla</Badge> : <Badge tone="danger" dot>Eksik</Badge>,
    actions: (
      <Button variant="secondary" size="sm" onClick={() => { setHow("faturaya"); setLineDialog(l); }}>
        Eşleştir
      </Button>
    ),
  }));

  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <Panel title="Banka Gün Sonu Dosyası" note="Dosyadaki her satır sistemdeki ödemeyle referans ve tutardan eşleştirilir." className="xl:col-span-2">
          <div className="grid gap-4 p-4 sm:p-5">
            <FileDropzone label="Dosya Yükle" hint="CSV, TXT ya da XLSX, en çok 10 MB" accept={["text/csv", "text/plain", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]} maxBytes={10 * 1024 * 1024} onFiles={(ok) => { if (ok[0]) { setFile(ok[0].name); notify({ title: `${ok[0].name} Okundu`, body: "Satırlar sistemdeki ödemelerle eşleştirildi.", tone: "success" }); } }} />
            <Button variant="secondary" size="sm" onClick={() => { setFile("BNK_20261121.csv"); notify({ title: "Örnek Dosya Okundu", body: "BNK_20261121.csv · satırlar eşleştirildi.", tone: "info" }); }}>
              <FileSpreadsheet aria-hidden /> Örnek Dosyayla Dene
            </Button>
            {file ? (
              <p role="status" className="flex items-start gap-2 rounded-lg bg-success-wash p-3 text-small text-success">
                <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span>
                  <strong className="font-semibold">{file}</strong> işlendi: {num.format(matched)} satır eşleşti, {num.format(lines.length)} satır elle bakılmayı bekliyor.
                </span>
              </p>
            ) : (
              <p className="text-small text-muted">Dosya yüklenmeden mutabakat kapatılamaz.</p>
            )}
            {file ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={autoMatchable === 0 || !canPay}
                onClick={() => {
                  const n = approveMatched(lineIds, recentDays);
                  notify({ title: `${num.format(n)} Eşleşen Ödeme Onaylandı`, body: lines.length ? `${num.format(lines.length)} satır elle çözülmeyi bekliyor.` : "Mutabakatı kapatabilirsiniz.", tone: "success" });
                }}
              >
                <CheckCircle2 aria-hidden /> Eşleşenleri Onayla ({num.format(autoMatchable)})
              </Button>
            ) : null}
          </div>
        </Panel>

        <Panel title="Son Dört Gün, Kanallara Göre" note="Sistemdeki ödemelerin mutabakat durumu." className="xl:col-span-3">
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Kanal Mutabakat Özeti">
            <table className="kz-mono w-full min-w-[34rem] text-small">
              <caption className="sr-only">Kanallara göre mutabık, bekleyen ve tutar farklı ödeme sayıları</caption>
              <thead>
                <tr className="text-muted">
                  <th scope="col" className="px-5 py-2.5 text-left font-medium">Kanal</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Ödeme</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Mutabık</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Bekleyen</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Tutar Farkı</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {byChannel.map((r) => (
                  <tr key={r.ch} className="border-t border-line-soft">
                    <th scope="row" className="px-5 py-2.5 text-left font-medium text-strong">{CHANNEL_LABEL[r.ch]}</th>
                    <td className="px-3 py-2.5 text-right">{num.format(r.total)}</td>
                    <td className="px-3 py-2.5 text-right text-success">{num.format(r.ok)}</td>
                    <td className="px-3 py-2.5 text-right">{num.format(r.wait)}</td>
                    <td className={r.diff ? "px-3 py-2.5 text-right text-danger" : "px-3 py-2.5 text-right text-muted"}>{num.format(r.diff)}</td>
                    <td className="px-5 py-2.5 text-right text-strong">{tl(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel
        title="Eşleşmeyen Satırlar"
        note={`${lines.length ? "Her satır faturaya atanır, avansa alınır ya da iade edilir." : "Bütün satırlar eşleşti."} Eski dönemlerden ${num.format(olderDiffs(fin))} tutar farkı ayrıca bekliyor.`}
        actions={
          <HoldButton
            tone="neutral"
            disabled={!file || lines.length > 0 || waitingDays.length === 0 || !canPay}
            hint={!file ? "Önce dosya yükleyin" : lines.length ? "Önce eşleşmeyenleri çözün" : waitingDays.length === 0 ? "Kapatılacak gün yok" : "Kapatmak için basılı tutun"}
            doneLabel="Mutabakat Kapandı"
            onConfirm={() => {
              const n = closeReconciliation(recentDays);
              notify({ title: "Mutabakat Kapatıldı", body: `${num.format(n)} ödeme mutabık duruma geçti.`, tone: "success" });
              setFile(null);
            }}
          >
            Mutabakatı Kapat
          </HoldButton>
        }
      >
        {lines.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={<ShieldCheck />} title="Çözülecek Satır Yok" hint={pending.length ? `${num.format(pending.length)} ödeme mutabakatı kapatmayı bekliyor.` : "Bütün ödemeler mutabık."} />
          </div>
        ) : (
          <>
            <div className="max-md:hidden">
              <DataTable<BankLine> caption="Eşleşmeyen banka satırları" columns={lineColumns} rows={lines} rowKey={(l) => l.id} density="comfortable" on="surface" minWidth="56rem" />
            </div>
            <div className="px-3 pb-3 md:hidden">
              <RecordList label="Eşleşmeyen Banka Satırları" items={lineItems} />
            </div>
          </>
        )}
      </Panel>

      <Dialog
        open={lineDialog !== null}
        onOpenChange={(o) => !o && setLineDialog(null)}
        title="Elle Eşleştir"
        description={lineDialog ? `${lineDialog.reference} · ${customer(lineDialog.customerId).name}. Bankadaki ve sistemdeki tutar farklı ya da satır mükerrer.` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setLineDialog(null)}>
              Vazgeç
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!lineDialog) return;
                const r = resolveBankLine(lineDialog, how);
                notify({ title: how === "faturaya" ? "Faturaya atandı" : how === "avans" ? "Avansa alındı" : "İade talimatı verildi", body: r.note, tone: "success" });
                setLineDialog(null);
              }}
            >
              Eşleştir
            </Button>
          </>
        }
      >
        {lineDialog ? (
          <div className="grid gap-4">
            <dl className="grid grid-cols-3 gap-3 rounded-lg bg-surface p-3 text-small">
              <div>
                <dt className="text-muted">Sistem</dt>
                <dd className="kz-mono mt-0.5 font-semibold text-strong">{tl(lineDialog.systemAmount)}</dd>
              </div>
              <div>
                <dt className="text-muted">Banka</dt>
                <dd className="kz-mono mt-0.5 font-semibold text-strong">{tl(lineDialog.bankAmount)}</dd>
              </div>
              <div>
                <dt className="text-muted">Fark</dt>
                <dd className="kz-mono mt-0.5 font-semibold text-danger">{tl(Math.abs(lineDialog.bankAmount - lineDialog.systemAmount))}</dd>
              </div>
            </dl>
            <InsightCallout
              title={lineDialog.kind === "mukerrer" ? "Aynı Tutar İki Kez Gelmiş" : lineDialog.kind === "fazla" ? "Banka Sistemden Fazla Tahsil Etmiş" : "Banka Sistemden Az Tahsil Etmiş"}
              headingLevel={3}
              label="Öneri"
            >
              {lineDialog.kind === "mukerrer"
                ? "Mükerrer satırı aboneye iade etmek ya da avans yazmak doğrudur; faturaya atamak borcu iki kez düşürür."
                : lineDialog.kind === "fazla"
                  ? "Fazla tutarı sonraki faturaya sayılacak avans olarak almak en az sürtünmeyle kapanır."
                  : "Eksik tutarı faturaya atayın; fatura kısmi ödenmiş kalır ve kalan bakiye tahsilat kuyruğunda görünür."}
            </InsightCallout>
            <OptionCards
              legend="Nasıl Kapansın"
              value={how}
              onValueChange={(v) => setHow(v as typeof how)}
              options={[
                { value: "faturaya", title: `Faturaya Ata`, description: `${lineDialog.invoiceId} faturasının bakiyesinden düşer.`, badge: lineDialog.kind === "eksik" ? "Önerilen" : undefined },
                { value: "avans", title: "Avans Olarak Al", description: "Tutar sonraki faturaya sayılmak üzere alacak yazılır.", badge: lineDialog.kind === "fazla" ? "Önerilen" : undefined },
                { value: "iade", title: "Aboneye İade Et", description: "IBAN'a iade talimatı verilir.", badge: lineDialog.kind === "mukerrer" ? "Önerilen" : undefined },
              ]}
            />
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

/* ============================ ÖDEME PLANLARI ================================= */

function Plans() {
  const { notify } = useApp();
  const fin = useFinance();
  const [open, setOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [custId, setCustId] = useState<string | null>(null);
  const [installments, setInstallments] = useState("6");
  const [rate, setRate] = useState<number | null>(1.5);

  const debtors = useMemo(() => {
    const inPlan = new Set(fin.plans.filter((p) => p.status === "devam").map((p) => p.customerId));
    const ids = [...new Set(allInvoices(fin).filter(isOverdue).map((i) => i.customerId))].filter((id) => !inPlan.has(id));
    return ids
      .map((id) => ({ id, debt: debtOf(id, fin) }))
      .filter((d) => d.debt > 0)
      .sort((a, b) => b.debt - a.debt)
      .slice(0, 40);
  }, [fin]);

  const chosen = debtors.find((d) => d.id === custId) ?? debtors[0];
  const n = Number(installments);
  const principal = chosen?.debt ?? 0;
  const total = Math.round(principal * (1 + ((rate ?? 0) / 100) * n * 0.5));
  const preview = chosen ? schedule(total, n, dayKey(addDays(TODAY, 30))) : [];

  const active = fin.plans.filter((p) => p.status === "devam");
  const columns: readonly Column<(typeof fin.plans)[number]>[] = [
    { key: "id", header: "Plan No", render: (p) => <span className="kz-mono font-medium text-strong">{p.id}</span> },
    { key: "c", header: "Abone", render: (p) => customer(p.customerId).name },
    { key: "t", header: "Toplam", numeric: true, render: (p) => <span className="kz-mono">{tl(p.total)}</span> },
    {
      key: "p",
      header: "İlerleme",
      render: (p) => (
        <div className="w-40">
          <TickMeter label={`${p.id} taksit ilerlemesi`} value={p.paid} max={p.installments} size="sm" text={`${p.paid}/${p.installments}`} valueText={`${p.installments} taksitin ${p.paid} tanesi ödendi`} />
        </div>
      ),
    },
    { key: "n", header: "Sonraki Taksit", render: (p) => (p.status === "devam" ? `${dayLabel(p.next)} · ${tl(planInstallment(p))}` : "-") },
    { key: "s", header: "Durum", render: (p) => planBadge(p.status) },
    {
      key: "a",
      header: <span className="sr-only">İşlem</span>,
      render: (p) =>
        p.status === "devam" ? (
          <span className="inline-flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => { payInstallment(p.id); notify({ title: "Taksit Tahsil Edildi", body: `${p.id} · ${tl(planInstallment(p))}`, tone: "success" }); }}>
              Taksit Al
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCancelId(p.id)}>
              İptal
            </Button>
          </span>
        ) : null,
    },
  ];
  const items: RecordItem[] = fin.plans.map((p) => ({
    id: p.id,
    title: customer(p.customerId).name,
    subtitle: `${p.id} · ${tl(p.total)} · ${p.paid}/${p.installments} taksit`,
    value: p.status === "devam" ? tl(planInstallment(p)) : undefined,
    meta: p.status === "devam" ? `Sonraki ${dayLabel(p.next)}` : undefined,
    status: planBadge(p.status),
    actions:
      p.status === "devam" ? (
        <Button variant="secondary" size="sm" onClick={() => { payInstallment(p.id); notify({ title: "Taksit Tahsil Edildi", tone: "success" }); }}>
          Taksit Al
        </Button>
      ) : undefined,
  }));

  return (
    <div className="grid grid-cols-1 gap-5">
      <Panel
        title="Ödeme Planları"
        note={`${active.length} plan devam ediyor · ${fin.plans.length} plan toplam`}
        actions={
          <Button variant="primary" size="sm" disabled={debtors.length === 0} onClick={() => setOpen(true)}>
            <Plus aria-hidden /> Yeni Plan
          </Button>
        }
      >
        <div className="max-md:hidden">
          <DataTable columns={columns} rows={fin.plans} rowKey={(p) => p.id} caption="Ödeme planları" density="comfortable" on="surface" minWidth="56rem" />
        </div>
        <div className="px-3 pb-3 md:hidden">
          <RecordList label="Ödeme Planları" items={items} />
        </div>
      </Panel>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Yeni Ödeme Planı"
        description="Vadesi geçmiş borcu taksitlere bölün. Plan boyunca kesme emri verilmez; bozulursa borç yeniden muaccel olur."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Vazgeç
            </Button>
            <Button
              variant="primary"
              disabled={!chosen}
              onClick={() => {
                if (!chosen) return;
                const plan = createPlan(chosen.id, n, rate ?? 0);
                notify({ title: `${plan.id} Oluşturuldu`, body: `${customer(chosen.id).name} · ${n} taksit, ilk taksit ${dayLabel(plan.next)}.`, tone: "success" });
                setOpen(false);
                setCustId(null);
              }}
            >
              Planı Onayla
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <Select
                label="Borçlu Abone"
                items={debtors.map((d) => ({ value: d.id, label: `${customer(d.id).name} · ${tl(d.debt)}` }))}
                value={chosen?.id ?? null}
                onValueChange={(v) => setCustId(v)}
              />
            </div>
            <Select label="Taksit Sayısı" items={[3, 6, 9, 12].map((x) => ({ value: String(x), label: `${x} Taksit` }))} value={installments} onValueChange={(v) => setInstallments(v ?? "6")} />
            <NumberField label="Aylık Faiz (%)" value={rate} onValueChange={setRate} min={0} max={5} step={0.1} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
            <dl className="rounded-lg bg-surface p-3 text-small">
              <dt className="text-muted">Plan Toplamı</dt>
              <dd className="kz-mono mt-0.5 text-read font-semibold text-strong">{tl(total)}</dd>
              <dd className="text-micro text-muted">Anapara {tl(principal)}</dd>
            </dl>
          </div>
          {chosen && preview.length > 0 ? (
            <div className="grid gap-3 rounded-lg bg-surface p-3">
              <ImpactBar label="İlk Taksit, Plan Toplamının" current={0} added={preview[0].amount} limit={total} format={(v) => tl(v)} />
              <PolicyChecks
                title="Ön Kontroller"
                headingLevel={3}
                checks={[
                  { id: "borc", label: "Vadesi Geçmiş Borç", detail: `${tl(principal)} anapara, plan toplamı ${tl(total)}`, state: "pass" },
                  { id: "plan", label: "Mevcut Ödeme Planı", detail: "Abonenin devam eden planı yok", state: "pass" },
                  { id: "faiz", label: "Aylık Faiz", detail: `%${(rate ?? 0).toLocaleString("tr-TR")}; en çok %5 (ÖRNEK sınır)`, state: (rate ?? 0) > 5 ? "fail" : (rate ?? 0) > 3 ? "warn" : "pass" },
                  { id: "kesme", label: "Kesme Emri", detail: "Plan boyunca verilmez, taksit bozulursa borç yeniden muaccel olur", state: "pass" },
                ]}
              />
            </div>
          ) : null}
          <div className="max-h-56 overflow-auto rounded-lg border border-line-soft" tabIndex={0} role="region" aria-label="Taksit Takvimi Önizlemesi">
            <table className="kz-mono w-full text-small">
              <caption className="sr-only">Taksit takvimi</caption>
              <thead className="sticky top-0 bg-surface text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium">Taksit</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium">Vade</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r) => (
                  <tr key={r.no} className="border-t border-line-soft">
                    <td className="px-3 py-1.5">{r.no}</td>
                    <td className="px-3 py-1.5">{fullDate.format(parseDay(r.due))}</td>
                    <td className="px-3 py-1.5 text-right text-strong">{tl(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={cancelId !== null}
        onOpenChange={(o) => !o && setCancelId(null)}
        title="Planı İptal Et"
        description="İptal edilen planın kalan borcu yeniden muaccel olur ve kesme sürecine girer."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelId(null)}>
              Vazgeç
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!cancelId) return;
                cancelPlan(cancelId);
                notify({ title: `${cancelId} İptal Edildi`, body: "Kalan borç yeniden vadesi geçmiş sayılıyor.", tone: "info" });
                setCancelId(null);
              }}
            >
              Planı İptal Et
            </Button>
          </>
        }
      >
        <p className="text-small text-body">Bu işlem geri alınamaz; yeni bir plan açabilirsiniz.</p>
      </Dialog>
    </div>
  );
}

/* ============================ OTOMATİK ÖDEME ================================= */

const autoBadge = (state: AutoPayRow["state"]) =>
  state === "aktif" ? <Badge tone="success" dot>Aktif</Badge> : state === "onay-bekliyor" ? <Badge tone="warning" dot>Banka Onayı Bekliyor</Badge> : <Badge tone="danger" dot>Çekim Başarısız</Badge>;

function AutoPay({ params, go }: PageProps) {
  const { notify } = useApp();
  const fin = useFinance();
  const rows = useMemo(() => autoPayRows(fin), [fin]);
  const [filter, setFilter] = useState("hepsi");
  const filtered = rows.filter((r) => filter === "hepsi" || r.state === filter);
  const page = Math.max(1, Number(params.page) || 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const shown = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const count = (s: AutoPayRow["state"]) => rows.filter((r) => r.state === s).length;

  const act = (r: AutoPayRow) =>
    r.state === "basarisiz" ? (
      <Button variant="secondary" size="sm" onClick={() => { retryAutoPay(r.customerId); notify({ title: "Çekim Yeniden Denendi", body: `${customer(r.customerId).name} · talimat aktif.`, tone: "success" }); }}>
        Yeniden Dene
      </Button>
    ) : r.state === "onay-bekliyor" ? (
      <Button variant="ghost" size="sm" onClick={() => notify({ title: "Onay Hatırlatması Gönderildi", body: `${customer(r.customerId).name} · ${r.bank}`, tone: "info" })}>
        Hatırlat
      </Button>
    ) : null;

  const columns: readonly Column<AutoPayRow>[] = [
    {
      key: "c",
      header: "Abone",
      render: (r) => (
        <a {...link(go, "customers", { id: r.customerId })} className="font-medium text-primary-ink hover:underline">
          {customer(r.customerId).name}
        </a>
      ),
    },
    { key: "b", header: "Banka", render: (r) => r.bank },
    { key: "s", header: "Talimat", render: (r) => autoBadge(r.state) },
    { key: "l", header: "Son Çekim", render: (r) => (r.last ? dayLabel(r.last) : "-") },
    { key: "a", header: "Tutar", numeric: true, render: (r) => <span className="kz-mono">{r.lastAmount ? tl(r.lastAmount) : "-"}</span> },
    { key: "act", header: <span className="sr-only">İşlem</span>, render: act },
  ];
  const items: RecordItem[] = shown.map((r) => ({
    id: r.customerId,
    title: customer(r.customerId).name,
    subtitle: `${r.bank} · son çekim ${r.last ? dayLabel(r.last) : "yok"}`,
    value: r.lastAmount ? tl(r.lastAmount) : undefined,
    status: autoBadge(r.state),
    actions: act(r),
  }));

  return (
    <Panel
      title="Otomatik Ödeme Talimatları"
      note={`${num.format(rows.length)} talimat · ${count("aktif")} aktif, ${count("onay-bekliyor")} onay bekliyor, ${count("basarisiz")} başarısız`}
      actions={<Select label="Durum" hideLabel items={[{ value: "hepsi", label: "Bütün Talimatlar" }, { value: "aktif", label: "Aktif" }, { value: "onay-bekliyor", label: "Onay Bekliyor" }, { value: "basarisiz", label: "Başarısız" }]} value={filter} onValueChange={(v) => { setFilter(v ?? "hepsi"); if (params.page) go("payments", { ...params, page: undefined }); }} />}
    >
      <div className="max-md:hidden">
        <DataTable<AutoPayRow> caption="Otomatik ödeme talimatları" columns={columns} rows={shown} rowKey={(r) => r.customerId} density="comfortable" on="surface" minWidth="48rem" />
      </div>
      <div className="px-3 pb-3 md:hidden">
        <RecordList label="Otomatik Ödeme Talimatları" items={items} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-4 py-3 sm:px-5">
        <p className="text-small text-muted">{num.format(filtered.length)} talimat</p>
        {pageCount > 1 ? <Pagination page={safePage} pageCount={pageCount} hrefFor={(n) => href("payments", { ...params, page: n > 1 ? String(n) : undefined })} scroll={false} /> : null}
      </div>
    </Panel>
  );
}

/* ============================ GECİKME VE KESME ================================ */

type Candidate = { customerId: string; debt: number; days: number; invoices: number };

const slotText = (d: Date) => new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(d);

function Cuts({ go }: { go: PageProps["go"] }) {
  const { notify } = useApp();
  useStoreVersion();
  const fin = useFinance();
  const canCut = useCan("kesme");
  const notices = useNotices();
  const workOrders = useWorkOrders();
  const buckets = useMemo(() => aging(fin), [fin]);
  const [picked, setPicked] = useState<readonly string[]>([]);
  const [confirm, setConfirm] = useState(false);

  /* Aday: vadesi geçmiş borcu olan; ihtar, bekleme, hassas abone, plan ve itiraz kuralları `cutEligibility`den. */
  const candidates: (Candidate & { e: ReturnType<typeof cutEligibility> })[] = useMemo(() => {
    const map = new Map<string, Candidate>();
    for (const i of allInvoices(fin).filter(isOverdue)) {
      const days = overdueDays(i);
      const cur = map.get(i.customerId);
      map.set(i.customerId, { customerId: i.customerId, debt: (cur?.debt ?? 0) + dueNow(i).total, days: Math.max(cur?.days ?? 0, days), invoices: (cur?.invoices ?? 0) + 1 });
    }
    return [...map.values()]
      .map((c) => ({ ...c, e: cutEligibility(c.customerId) }))
      // eslint-disable-next-line react-hooks/exhaustive-deps
      .sort((a, b) => Number(b.e.eligible) - Number(a.e.eligible) || Number(!!b.e.noticeAt) - Number(!!a.e.noticeAt) || b.days - a.days || b.debt - a.debt)
      .slice(0, 20);
    // notices değişince ihtar durumu yeniden hesaplanır
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fin, notices]);

  const activeCuts = workOrders.filter((w) => w.type === "kesme" && w.status !== "tamamlandi" && w.status !== "iptal");

  const reconnect = useMemo(
    () =>
      allCustomers()
        .filter((c) => c.status === "kesik")
        .map((c) => ({
          id: c.id,
          debt: debtOf(c.id, fin),
          plan: fin.plans.some((p) => p.customerId === c.id && p.status === "devam"),
          order: getWorkOrders().find((w) => w.type === "baglama" && w.customerId === c.id && w.status !== "tamamlandi" && w.status !== "iptal"),
        }))
        .slice(0, 14),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fin, workOrders],
  );

  const slot = scheduleSlot();
  const eligible = candidates.filter((c) => c.e.eligible);
  const selected = candidates.filter((c) => picked.includes(c.customerId));
  const selectedEligible = selected.filter((c) => c.e.eligible);
  const needNotice = selected.filter((c) => !c.e.noticeAt && c.e.overdueDays >= 15);

  const state = (c: (typeof candidates)[number]) => {
    if (c.e.eligible) return <Badge tone="danger" dot>Kesilebilir</Badge>;
    if (!c.e.noticeAt) return <Badge tone={c.e.overdueDays >= 15 ? "warning" : "neutral"} dot>{c.e.overdueDays >= 15 ? "İhtar gerekli" : "Hatırlatma"}</Badge>;
    return <Badge tone="warning" dot>İhtar bekleme</Badge>;
  };
  const reason = (c: (typeof candidates)[number]) => (c.e.eligible ? `Emir: ${slotText(slot)}` : c.e.blockers[0] ?? "");

  const allPicked = candidates.length > 0 && candidates.every((c) => picked.includes(c.customerId));
  const columns: readonly Column<(typeof candidates)[number]>[] = [
    {
      key: "pick",
      header: <Checkbox aria-label="Bütün Adayları Seç" checked={allPicked} onChange={(e) => setPicked(e.target.checked ? candidates.map((c) => c.customerId) : [])} />,
      width: "3rem",
      render: (c) => <Checkbox aria-label={`${customer(c.customerId).name} seç`} checked={picked.includes(c.customerId)} onChange={(e) => setPicked(e.target.checked ? [...picked, c.customerId] : picked.filter((x) => x !== c.customerId))} />,
    },
    {
      key: "c",
      header: "Abone",
      render: (c) => (
        <span className="block min-w-0">
          <a {...{ href: href("customers", { id: c.customerId }), onClick: (e: { preventDefault: () => void }) => { e.preventDefault(); go("customers", { id: c.customerId }); } }} className="block truncate font-medium text-primary-ink hover:underline">{customer(c.customerId).name}</a>
          <span className="text-micro text-muted">{c.invoices} fatura</span>
        </span>
      ),
    },
    { key: "d", header: "Gecikme", numeric: true, render: (c) => <span className="kz-mono">{c.days} gün</span> },
    { key: "b", header: "Borç (Zam Dahil)", numeric: true, render: (c) => <span className="kz-mono font-medium text-strong">{tl(c.debt)}</span> },
    { key: "s", header: "Durum", render: (c) => <span className="grid gap-0.5">{state(c)}<span className="text-micro text-muted">{reason(c)}</span></span> },
  ];
  const items: RecordItem[] = candidates.map((c) => ({
    id: c.customerId,
    title: customer(c.customerId).name,
    subtitle: `${c.invoices} fatura · ${c.days} gün gecikme`,
    value: tl(c.debt),
    meta: reason(c),
    status: state(c),
    actions: <Checkbox aria-label={`${customer(c.customerId).name} seç`} checked={picked.includes(c.customerId)} onChange={(e) => setPicked(e.target.checked ? [...picked, c.customerId] : picked.filter((x) => x !== c.customerId))} />,
  }));

  const totalDebt = buckets.reduce((s, b) => s + b.balance, 0);

  const runCuts = () => {
    let created = 0;
    let pending = 0;
    const blocked: string[] = [];
    for (const c of selectedEligible) {
      const r = requestCut(c.customerId, "Vadesi geçmiş borç");
      if (r.ok && r.status === "olusturuldu") created++;
      else if (r.ok) pending++;
      else blocked.push(`${customer(c.customerId).name}: ${r.blockers[0]}`);
    }
    notify({
      title: created ? `${created} kesme emri oluşturuldu` : pending ? `${pending} kesme emri ikinci göz onayında` : "Kesme emri verilemedi",
      body: [created ? `Planlı zaman: ${slotText(slot)}.` : "", pending ? `${pending} emir ikinci yetkilinin onayını bekliyor (Ayarlar → Uyum Merkezi).` : "", blocked.length ? `${blocked.length} abone politika nedeniyle atlandı.` : ""].filter(Boolean).join(" "),
      tone: created ? "success" : "info",
    });
    setPicked([]);
    setConfirm(false);
  };

  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <ChartCard id="od-yas" className={`${CARD} self-start xl:col-span-2`} label="Vadesi Geçen Bakiye" value={tlShort(totalDebt)} change={null} changeLabel="yaşa göre">
          <BarList
            title="Gecikme Yaşına Göre Bakiye (bin ₺)"
            columns={["Gecikme yaşı", "Bin ₺"]}
            sort={false}
            series={6}
            items={buckets.map((b) => ({ label: `${b.label} · ${num.format(b.count)} fatura`, value: Math.round(b.balance / 100_000) }))}
            valueFormat={{ maximumFractionDigits: 0 }}
          />
          <p className="mt-3 rounded-lg bg-surface p-3 text-small text-body">
            Kesme emri iş günü ve mesai içine planlanır: şu an en erken <strong className="font-semibold text-strong">{slotText(slot)}</strong>. Hafta sonu ve resmî tatilde emir verilmez.
          </p>
        </ChartCard>
        <Panel
          title="Kesme Aday Listesi"
          note={`${num.format(eligible.length)} abone kesilebilir. Yazılı ihtar, bekleme süresi, hassas abone, itiraz ve ödeme planı kuralları uygulanır (ÖRNEK parametre).`}
          className="self-start xl:col-span-3"
          actions={
            <>
              <Button
                variant="secondary"
                size="sm"
                disabled={!canCut || needNotice.length === 0}
                onClick={() => {
                  needNotice.forEach((c) => sendNotice(c.customerId));
                  notify({ title: `${needNotice.length} Aboneye Yazılı İhtar Gönderildi`, body: "Bekleme süresi başladı; süre dolunca kesme emri verilebilir.", tone: "success" });
                  setPicked([]);
                }}
              >
                <BellRing aria-hidden /> İhtar Gönder
              </Button>
              <Button variant="danger" size="sm" disabled={!canCut || selectedEligible.length === 0} onClick={() => setConfirm(true)}>
                <Scissors aria-hidden /> Kesme Emri Oluştur
              </Button>
            </>
          }
        >
          {!canCut ? <p className="border-b border-line-soft bg-warning-wash px-4 py-2 text-small text-warning sm:px-5">Kesme ve bağlama emri yetkiniz yok: liste yalnız izleme amaçlı.</p> : null}
          {candidates.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={<CheckCircle2 />} title="Kesme Adayı Yok" hint="Vadesi geçen bakiyesi olan abone kalmadı." />
            </div>
          ) : (
            <>
              <div className="max-md:hidden">
                <DataTable<(typeof candidates)[number]> caption="Kesme adayları" columns={columns} rows={candidates} rowKey={(c) => c.customerId} density="comfortable" on="surface" minWidth="36rem" />
              </div>
              <div className="px-3 pb-3 md:hidden">
                <RecordList label="Kesme Adayları" items={items} />
              </div>
            </>
          )}
        </Panel>
      </div>

      {activeCuts.length > 0 ? (
        <Panel title="Açık Kesme Emirleri" note="Ödeme gelirse emir iptal edilir; iptal denetim izine yazılır.">
          <ul className="grid divide-y divide-line-soft">
            {activeCuts.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                <IconTile tone="danger"><Scissors /></IconTile>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-strong">{w.customerId ? customer(w.customerId).name : w.id}</p>
                  <p className="text-small text-muted">{w.id} · {slotText(w.scheduled)}</p>
                </div>
                <Button variant="ghost" size="sm" disabled={!canCut} onClick={() => { cancelWorkOrder(w.id, "Ödeme alındı"); notify({ title: `${w.id} İptal Edildi`, tone: "info" }); }}>
                  <XCircle aria-hidden /> İptal
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel title="Yeniden Bağlama Bekleyenler" note="Enerjisi kesik aboneler. Borç kapanınca ya da plan kurulunca bağlama emri açılır; hedef süre sayaçla izlenir.">
        {reconnect.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={<Zap />} title="Bağlama Bekleyen Yok" hint="Enerjisi kesik abone bulunmuyor." />
          </div>
        ) : (
          <ul className="grid divide-y divide-line-soft">
            {reconnect.map((r) => {
              const ok = r.debt === 0 || r.plan;
              const sla = r.order ? reconnectSla(r.order.createdAt) : null;
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                  <IconTile tone={r.order ? "success" : "danger"}><Zap /></IconTile>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-strong">{customer(r.id).name}</p>
                    <p className="text-small text-muted">{r.debt > 0 ? `${tl(r.debt)} borç${r.plan ? " · ödeme planı var" : ""}` : "Borç yok"}</p>
                  </div>
                  {r.order && sla ? (
                    <Badge tone={sla.breached ? "danger" : "success"} dot>
                      Bağlama emri · {num1.format(sla.hours)} sa / {sla.targetHours} sa{sla.breached ? " (süre aşıldı)" : ""}
                    </Badge>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!ok || !canCut}
                      onClick={() => {
                        const wo = requestReconnect(r.id, r.debt === 0 ? "Borç kapandı" : "Ödeme planı kuruldu");
                        notify(wo ? { title: "Bağlama Emri Oluşturuldu", body: `${customer(r.id).name} · ${slotText(wo.scheduled)}; hedef 24 saat.`, tone: "success" } : { title: "Bağlama Yetkiniz Yok", tone: "info" });
                      }}
                    >
                      Bağlama Emri
                    </Button>
                  )}
                  {!ok && !r.order ? <p className="basis-full text-micro text-muted">Borç kapanmadan ya da ödeme planı kurulmadan bağlanamaz.</p> : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Kesme Emri Oluştur"
        description={`${selectedEligible.length} abone için enerji kesme iş emri açılır. İlk uygun zaman: ${slotText(slot)}.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>Vazgeç</Button>
            <HoldButton tone="danger" hint="Onaylamak için basılı tutun" doneLabel="Emir Verildi" onConfirm={runCuts}>
              Kesme Emrini Ver
            </HoldButton>
          </>
        }
      >
        <div className="grid gap-3">
          <PolicyChecks
            title="Ön Kontroller"
            headingLevel={3}
            checks={[
              selected.length === selectedEligible.length
                ? { id: "ihtar", label: "İhtar ve Bekleme Süresi", detail: `${selectedEligible.length} abonenin tamamı uygun`, state: "pass" }
                : { id: "ihtar", label: "İhtar ve Bekleme Süresi", detail: `${selected.length - selectedEligible.length} abone atlanır: ihtar ya da bekleme sürüyor`, state: "warn" },
              { id: "muaf", label: "Muafiyetler", detail: "Hassas abone, açık itiraz ve ödeme planı olanlar otomatik atlanır", state: "pass" },
              { id: "zaman", label: "İş Günü ve Mesai", detail: `İlk uygun zaman: ${slotText(slot)}`, state: "pass" },
              { id: "onay", label: "İkinci Göz Onayı", detail: "İstenirse emir onaylanınca açılır", state: "warn" },
              can("kesme") ? { id: "yetki", label: "Yetkiniz", detail: "Kesme emri verebilirsiniz", state: "pass" } : { id: "yetki", label: "Yetkiniz", detail: "Kesme emri verme yetkiniz yok", state: "fail" },
            ]}
          />
        </div>
      </Dialog>
    </div>
  );
}

/* ================================ SAYFA ====================================== */

export function OdemelerPage({ params, go }: PageProps) {
  useStoreVersion();
  const fin = useFinance();
  const all = useMemo(() => allPayments(fin), [fin]);
  const tab: TabId = (TAB_IDS as readonly string[]).includes(params.tab ?? "") ? (params.tab as TabId) : "tahsilat";

  const monthKey = TODAY_KEY.slice(0, 7);
  const today = all.filter((p) => p.date === TODAY_KEY);
  const month = all.filter((p) => p.date.startsWith(monthKey));
  const rate = collectionRate(PERIODS_12[10]);
  const waiting = all.filter((p) => p.recon !== "mutabik").length;
  /* Gecikme zammı: DOĞAN (ödenmemiş, hesaplanan) ile TAHSİL EDİLEN (bu ay ödemeyle gelen) ayrı. */
  const collectedFees = month.reduce((s, p) => s + p.lateFee, 0);
  const accruedFees = allInvoices(fin).filter(isOverdue).reduce((s, i) => s + dueNow(i).fee, 0);
  const activePlans = fin.plans.filter((p) => p.status === "devam");

  const counts: Record<TabId, number | null> = { tahsilat: null, mutabakat: waiting, planlar: activePlans.length, otomatik: autoPayRows(fin).filter((r) => r.state !== "aktif").length, kesme: null };
  const content: Record<TabId, ReactNode> = {
    tahsilat: <Collections params={params} go={go} />,
    mutabakat: <Reconcile />,
    planlar: <Plans />,
    otomatik: <AutoPay params={params} go={go} />,
    kesme: <Cuts go={go} />,
  };

  return (
    <>
      <PageHead
        title="Ödemeler"
        description={`${num.format(all.length)} tahsilat kaydı · ${num.format(waiting)} mutabakat bekliyor`}
        actions={
          <Button variant="secondary" size="sm" onClick={() => go("invoices", { status: "kuyruk" })}>
            Tahsilat Kuyruğu
          </Button>
        }
      />
      <PageBody>
        <PageHero
          primary={{ label: "Bu Ay Tahsilat", value: fmtTlCompact(month.reduce((s, p) => s + p.amount + p.lateFee, 0)), foot: `${fmtNum(month.length)} ödeme · bugün ${fmtTlCompact(today.reduce((s, p) => s + p.amount + p.lateFee, 0))}`, goodWhen: "up" }}
          secondary={[
            { label: "Tahsilat Oranı", value: fmtPct(rate), foot: COLLECTION_SCOPE, goodWhen: "up" },
            { label: "Mutabakat Bekleyen", value: fmtNum(waiting), foot: "Kapatılmayı bekleyen ödeme", to: { page: "payments", params: { tab: "mutabakat" } } },
            { label: "Zam (Tahsil Edilen)", value: fmtTlCompact(collectedFees), foot: "Bu ay ödemeyle gelen" },
            { label: "Zam (Doğan, Ödenmemiş)", value: fmtTlCompact(accruedFees), foot: "Vadesi geçmiş faturalarda işliyor", goodWhen: "down", to: { page: "payments", params: { tab: "kesme" } } },
            { label: "Ödeme Planlı Abone", value: fmtNum(activePlans.length), foot: `${fmtTlCompact(activePlans.reduce((s, p) => s + p.total, 0))} plan toplamı`, to: { page: "payments", params: { tab: "planlar" } } },
            { label: "Ortalama Tahsilat", value: fmtTl(month.length ? Math.round(month.reduce((s, p) => s + p.amount, 0) / month.length) : 0), foot: "Bu ay ödeme başına" },
          ]}
        />

        <Tabs
          aria-label="Ödeme Bölümleri"
          variant="underline"
          value={tab}
          onValueChange={(v) => go("payments", { tab: v === "tahsilat" ? undefined : v })}
          items={TAB_IDS.map((id) => ({
            value: id,
            label: (
              <span className="inline-flex items-center gap-1.5">
                {TAB_LABEL[id]}
                {counts[id] ? <span className="kz-mono text-micro text-muted">{num.format(counts[id]!)}</span> : null}
              </span>
            ),
            panel: id === tab ? content[id] : null,
          }))}
        />
      </PageBody>
    </>
  );
}
