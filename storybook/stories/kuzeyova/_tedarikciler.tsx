"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Building2, CheckCircle2, FileWarning, Phone, Receipt } from "lucide-react";
import { AreaChart } from "@/components/ui/area-chart";
import { Badge } from "@/components/ui/badge";
import { BarList } from "@/components/ui/bar-list";
import { Button } from "@/components/ui/Button";
import { ChartCard } from "@/components/ui/chart-card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { SankeyChart } from "@/components/ui/sankey-chart";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { TickMeter } from "@/components/ui/tick-meter";
import { Textarea } from "@/components/ui/textarea";
import { CUSTOMERS, PERIODS_12, SUPPLIERS, TODAY, addDays, customer, dayKey, fullDate, num, num1, parseDay, periodLabel, tl, tlShort, type Supplier } from "./_data";
import {
  FLOW_LINKS,
  SUPPLIER_SHORT,
  TRANSFER_STAGES,
  TREND_LABELS,
  customerOffers,
  supplierRows,
  supplierTrend,
  type SupplierRow,
  type TransferStage,
} from "./_data-operasyon";
import {
  TRANSFER_MAX_DAYS,
  batchInvoice,
  batchInvoices,
  completeTransfer,
  effectiveDiff,
  giveTransferDate,
  moveToVerify,
  openReconDiff,
  reconPeriods,
  recordSupplierObjection,
  rejectObjection,
  rejectTransfer,
  settleWithCorrection,
  startTransferFor,
  transferDaysLeft,
  useRecon,
  useTransfers,
  type BatchInvoice,
  type TransferRow,
} from "./_data-tedarik";
import { PageHero, fmtKwh, fmtNum, fmtTl, fmtTlCompact } from "./_kit";
import { useCan } from "./_permissions";
import { useStoreVersion } from "./_store";
import { CARD, IconTile, PageBody, PageHead, Panel, href, useApp, type PageProps } from "./_ui";

const day = (key: string) => fullDate.format(parseDay(key));
const unitPrice = (v: number) => `${v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺/kWh`;
const link = (go: PageProps["go"], page: Parameters<PageProps["go"]>[0], params: Record<string, string | undefined>) => ({
  href: href(page, params),
  onClick: (e: { preventDefault: () => void }) => {
    e.preventDefault();
    go(page, params);
  },
});

const TABS = ["genel", "gecis", "mutabakat", "piyasa"] as const;
type TabId = (typeof TABS)[number];
const TAB_LABEL: Record<TabId, string> = { genel: "Genel", gecis: "Geçiş Kuyruğu", mutabakat: "Dağıtım Bedeli Mutabakatı", piyasa: "Piyasa ve Seçenekler" };

function ReconBadge({ diff, state }: { diff: number; state?: BatchInvoice["state"] }) {
  if (state?.status === "itirazli") return <Badge tone="warning" dot>Tedarikçi itirazı</Badge>;
  if (diff === 0) return <Badge tone="success" dot>Mutabık</Badge>;
  return <Badge tone="warning" dot>{diff > 0 ? "+" : "−"}{tl(Math.abs(diff))} fark</Badge>;
}

const STAGE_TONE: Record<TransferStage, "neutral" | "primary" | "warning" | "success"> = { talep: "neutral", dogrulama: "warning", tarih: "primary", tamam: "success" };
const REJECT_REASONS = [
  { value: "Vadesi geçmiş fatura borcu", label: "Vadesi Geçmiş Fatura Borcu" },
  { value: "Taahhüt süresi dolmadı", label: "Taahhüt Süresi Dolmadı" },
  { value: "Sayaç bilgisi eşleşmiyor", label: "Sayaç Bilgisi Eşleşmiyor" },
  { value: "Eksik ya da hatalı belge", label: "Eksik ya da Hatalı Belge" },
];

/* ======================================================================== */
/* Sayfa                                                                     */
/* ======================================================================== */

export function TedarikcilerPage({ params, go }: PageProps) {
  useStoreVersion();
  const rows = useMemo(() => supplierRows(PERIODS_12[10]), []);
  const detail = params.id ? rows.find((r) => r.supplier.id === params.id) : undefined;
  if (params.id && detail) return <SupplierDetail row={detail} go={go} />;
  return <SupplierList rows={rows} params={params} go={go} />;
}

function SupplierList({ rows, params, go }: { rows: SupplierRow[]; params: PageProps["params"]; go: PageProps["go"] }) {
  const transfers = useTransfers();
  useRecon();
  const tab: TabId = (TABS as readonly string[]).includes(params.tab ?? "") ? (params.tab as TabId) : "genel";
  const free = CUSTOMERS.filter((c) => c.free).length;
  const avgPrice = rows.reduce((s, r) => s + r.supplier.unitPrice, 0) / rows.length;
  const pending = transfers.filter((t) => t.stage !== "tamam");
  const overdue = pending.filter((t) => transferDaysLeft(t) < 0).length;
  const ending = rows.filter((r) => r.daysToEnd <= 60);
  const open = openReconDiff();

  const columns: Column<SupplierRow>[] = [
    {
      key: "name",
      header: "Tedarikçi",
      sortable: true,
      sortValue: (r) => r.supplier.name,
      render: (r) => (
        <a {...link(go, "suppliers", { id: r.supplier.id })} className="block min-w-0">
          <span className="block truncate font-medium text-strong hover:underline">{r.supplier.name}</span>
          <span className="kz-mono block text-small text-muted">{r.supplier.license}</span>
        </a>
      ),
    },
    { key: "kind", header: "Tür", render: (r) => (r.supplier.kind === "gorevli" ? <Badge tone="primary">Görevli Tedarik</Badge> : <Badge tone="neutral">Perakende Satış</Badge>) },
    { key: "customers", header: "Müşteri", numeric: true, sortable: true, sortValue: (r) => r.customers, render: (r) => num.format(r.customers) },
    { key: "share", header: "Pay", numeric: true, sortable: true, sortValue: (r) => r.share, render: (r) => `%${num1.format(r.share)}`, bar: { value: (r) => r.share, tone: "neutral" } },
    { key: "price", header: "Birim Fiyat", numeric: true, sortable: true, sortValue: (r) => r.supplier.unitPrice, render: (r) => unitPrice(r.supplier.unitPrice) },
    {
      key: "end",
      header: "Sözleşme Sonu",
      sortable: true,
      sortValue: (r) => r.supplier.contractEnd,
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          {day(r.supplier.contractEnd)}
          {r.daysToEnd <= 60 ? <Badge tone="warning">{r.daysToEnd} gün</Badge> : null}
        </span>
      ),
    },
    {
      key: "recon",
      header: "Mutabakat",
      render: (r) => {
        const b = batchInvoice(r.supplier.id, PERIODS_12[10]);
        return <ReconBadge diff={effectiveDiff(b)} state={b.state} />;
      },
    },
  ];
  const items: RecordItem[] = rows.map((r) => {
    const b = batchInvoice(r.supplier.id, PERIODS_12[10]);
    return {
      id: r.supplier.id,
      title: r.supplier.name,
      subtitle: `${r.supplier.kind === "gorevli" ? "Görevli tedarik" : "Perakende satış"} · ${unitPrice(r.supplier.unitPrice)}`,
      leading: <IconTile tone="neutral"><Building2 /></IconTile>,
      value: `${num.format(r.customers)} müşteri · %${num1.format(r.share)}`,
      meta: `Sözleşme sonu ${day(r.supplier.contractEnd)}`,
      status: <ReconBadge diff={effectiveDiff(b)} state={b.state} />,
      href: href("suppliers", { id: r.supplier.id }),
      onSelect: () => go("suppliers", { id: r.supplier.id }),
    };
  });

  const panels: Record<TabId, ReactNode> = {
    genel: (
      <div className="grid gap-5">
        <Panel title="Tedarikçi Listesi" note="Tedarikçi adına basınca müşterileri, faturalaması ve teminat durumu açılır.">
          <div className="max-md:hidden">
            <DataTable<SupplierRow> caption="Tedarikçiler" columns={columns} rows={rows} rowKey={(r) => r.supplier.id} density="comfortable" on="surface" stickyFirst={false} />
          </div>
          <div className="p-3 md:hidden">
            <RecordList label="Tedarikçiler" items={items} />
          </div>
        </Panel>
        <ChartCard id="ted-pay" className={CARD} label="Piyasa Payı" value={`${num.format(CUSTOMERS.length)} abone`} change={null} action={<Badge tone="neutral">Müşteri sayısı</Badge>}>
          <BarList title="Tedarikçilere Göre Müşteri Sayısı" columns={["Tedarikçi", "Müşteri"]} items={rows.map((r) => ({ label: SUPPLIER_SHORT[r.supplier.id], value: r.customers, href: href("suppliers", { id: r.supplier.id }) }))} series={1} />
        </ChartCard>
      </div>
    ),
    gecis: <TransferBoard go={go} />,
    mutabakat: <ReconTab go={go} />,
    piyasa: <MarketTab go={go} />,
  };

  return (
    <>
      <PageHead
        title="Tedarikçiler"
        description="Görevli tedarik ve perakende satış şirketleri, geçiş talepleri ve dağıtım bedeli mutabakatı."
        actions={
          <Button variant="primary" size="sm" onClick={() => go("suppliers", { tab: "piyasa" })}>
            Geçiş Başlat
          </Button>
        }
      />
      <PageBody>
        <PageHero
          primary={{ label: "Mutabakat Bekleyen Fark", value: fmtTl(open.total), foot: open.count ? `${open.count} dönem-tedarikçi kaydında dağıtım bedeli farkı var` : "Bütün toplu faturalar mutabık", goodWhen: "down", to: { page: "suppliers", params: { tab: "mutabakat" } } }}
          secondary={[
            { label: "Tedarikçi", value: fmtNum(rows.length), foot: "1 görevli, 5 perakende satış" },
            { label: "Serbest Tüketici", value: fmtNum(free), foot: `${num.format(CUSTOMERS.length)} abonenin %${num1.format((free / CUSTOMERS.length) * 100)}'i seçim yapabilir` },
            { label: "Teslim Edilen Enerji", value: fmtKwh(rows.reduce((s, r) => s + r.usage, 0)), foot: periodLabel(PERIODS_12[10]) },
            { label: "Ortalama Birim Fiyat", value: unitPrice(avgPrice).replace(" ₺/kWh", ""), unit: "₺/kWh", foot: "Vergisiz, tedarikçi ortalaması" },
            { label: "Bekleyen Geçiş", value: fmtNum(pending.length), foot: overdue ? `${overdue} talepte azami süre aşıldı` : `${transfers.filter((t) => t.blocker).length} talepte engel var`, to: { page: "suppliers", params: { tab: "gecis" } } },
            { label: "Sözleşmesi Dolacak", value: fmtNum(ending.length), foot: ending.length ? `60 gün içinde: ${ending.map((r) => SUPPLIER_SHORT[r.supplier.id]).join(", ")}` : "60 gün içinde dolan yok" },
          ]}
        />
        <Tabs
          aria-label="Tedarikçi Bölümleri"
          variant="underline"
          value={tab}
          onValueChange={(v) => go("suppliers", { tab: v === "genel" ? undefined : v })}
          items={TABS.map((id) => ({
            value: id,
            label: (
              <span className="inline-flex items-center gap-1.5">
                {TAB_LABEL[id]}
                {id === "gecis" && pending.length ? <span className="kz-mono text-micro text-muted">{pending.length}</span> : null}
                {id === "mutabakat" && open.count ? <span className="kz-mono text-micro text-warning">{open.count}</span> : null}
              </span>
            ),
            panel: id === tab ? panels[id] : null,
          }))}
        />
      </PageBody>
    </>
  );
}

/* ======================================================================== */
/* Geçiş kuyruğu                                                             */
/* ======================================================================== */

function TransferBoard({ go }: { go: PageProps["go"] }) {
  const { notify } = useApp();
  const transfers = useTransfers();
  const canMove = useCan("musteri");
  const [dateFor, setDateFor] = useState<TransferRow | null>(null);
  const [effective, setEffective] = useState("");
  const [dateError, setDateError] = useState("");
  const [rejectFor, setRejectFor] = useState<TransferRow | null>(null);
  const [reason, setReason] = useState<string | null>(REJECT_REASONS[0].value);
  const [note, setNote] = useState("");
  const pending = transfers.filter((t) => t.stage !== "tamam").length;

  const verify = (t: TransferRow) => {
    if (moveToVerify(t.id)) notify({ title: `${t.id} Doğrulamaya Alındı`, body: `${customer(t.customerId).name}: borç, sözleşme ve sayaç kontrolü başladı`, tone: "info" });
  };
  const confirmDate = () => {
    if (!dateFor) return;
    const r = giveTransferDate(dateFor.id, effective);
    if (!r.ok) return setDateError(r.error);
    notify({ title: `${dateFor.id}: Geçiş Tarihi Verildi`, body: `${day(effective)} · müşteriye SMS gönderildi`, tone: "success" });
    setDateFor(null);
  };
  const complete = (t: TransferRow) => {
    if (completeTransfer(t.id)) notify({ title: `${t.id} Tamamlandı`, body: `${customer(t.customerId).name} artık ${SUPPLIER_SHORT[t.to]} ile faturalanıyor (Müşteriler ve Faturalar güncellendi)`, tone: "success" });
  };

  return (
    <>
      <Panel title="Tedarikçi Değişikliği (Geçiş) Kuyruğu" note={`Talep → doğrulama → geçiş tarihi → tamamlandı. Engeli olan talep doğrulamadan çıkamaz; azami süre ${TRANSFER_MAX_DAYS} gün (ÖRNEK parametre). Müşteri kartından başlatılanlar da burada.`} actions={<Badge tone="warning" dot>{pending} açık talep</Badge>}>
        <div className="grid grid-cols-1 gap-3 p-3 sm:p-4 md:grid-cols-2 xl:grid-cols-4">
          {TRANSFER_STAGES.map((stage) => {
            const list = transfers.filter((t) => t.stage === stage.id);
            return (
              <section key={stage.id} aria-labelledby={`gecis-${stage.id}`} className="flex min-w-0 flex-col gap-2 rounded-lg bg-surface p-2">
                <header className="px-2 pt-1">
                  <h3 id={`gecis-${stage.id}`} className="flex items-center justify-between gap-2 text-small font-semibold text-strong">
                    {stage.label}
                    <Badge tone={STAGE_TONE[stage.id]}>{list.length}</Badge>
                  </h3>
                  <p className="mt-0.5 text-micro text-muted">{stage.hint}</p>
                </header>
                {list.length === 0 ? <p className="rounded-md px-2 py-6 text-center text-small text-muted">Bu aşamada talep yok</p> : null}
                {list.map((t) => {
                  const c = customer(t.customerId);
                  const left = transferDaysLeft(t);
                  return (
                    <article key={t.id} className="rounded-md bg-overlay p-3 shadow-raised ring-1 ring-line">
                      <div className="flex items-start justify-between gap-2">
                        <a {...link(go, "customers", { id: c.id })} className="min-w-0 text-small font-medium text-strong hover:underline">
                          <span className="block truncate">{c.name}</span>
                        </a>
                        <span className="kz-mono shrink-0 text-micro text-muted">{t.id}</span>
                      </div>
                      <p className="mt-1 text-small text-muted">
                        {SUPPLIER_SHORT[t.from]} <span aria-hidden>→</span>
                        <span className="sr-only"> yeni tedarikçi </span> {SUPPLIER_SHORT[t.to]}
                        {t.source === "musteri" ? <span className="ml-1 text-micro">(müşteri kartından)</span> : null}
                      </p>
                      <p className="mt-1 text-micro text-muted">
                        Talep {day(t.requested)}
                        {t.effective ? ` · Geçiş ${day(t.effective)}` : ""}
                      </p>
                      {t.stage !== "tamam" ? (
                        <p className={left < 0 ? "mt-1 text-micro font-medium text-danger" : left <= 5 ? "mt-1 text-micro font-medium text-warning" : "mt-1 text-micro text-muted"}>
                          {left < 0 ? `Azami süre ${-left} gün aşıldı` : `Azami süreye ${left} gün kaldı`}
                        </p>
                      ) : null}
                      {t.blocker ? (
                        <p className="mt-2 flex items-start gap-1.5 rounded-sm bg-warning-wash px-2 py-1.5 text-micro text-warning">
                          <FileWarning aria-hidden className="mt-px size-3.5 shrink-0" />
                          Engel: {t.blocker}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {t.stage === "talep" ? <Button size="sm" variant="primary" disabled={!canMove} onClick={() => verify(t)}>Doğrulamaya Al</Button> : null}
                        {t.stage === "dogrulama" ? (
                          <Button size="sm" variant="primary" disabled={!!t.blocker || !canMove} onClick={() => { setEffective(dayKey(addDays(TODAY, 7))); setDateError(""); setDateFor(t); }}>
                            Geçiş Tarihi Ver
                          </Button>
                        ) : null}
                        {t.stage === "tarih" ? <Button size="sm" variant="primary" disabled={!canMove} onClick={() => complete(t)}>Tamamla</Button> : null}
                        {t.stage !== "tamam" ? (
                          <Button size="sm" variant="ghost" disabled={!canMove} onClick={() => setRejectFor(t)}>Reddet</Button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-micro text-success">
                            <CheckCircle2 aria-hidden className="size-3.5" /> Tedarikçi güncellendi
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </section>
            );
          })}
        </div>
      </Panel>

      <Dialog
        open={!!dateFor}
        onOpenChange={(o) => !o && setDateFor(null)}
        title="Geçiş Tarihi Ver"
        description={dateFor ? `${customer(dateFor.customerId).name}: ${SUPPLIER_SHORT[dateFor.from]} → ${SUPPLIER_SHORT[dateFor.to]}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDateFor(null)}>Vazgeç</Button>
            <Button variant="primary" onClick={confirmDate} disabled={!effective}>Tarihi Onayla</Button>
          </>
        }
      >
        <Input label="Geçiş Tarihi" type="date" value={effective} min={dayKey(addDays(TODAY, 1))} onChange={(e) => { setEffective(e.target.value); setDateError(""); }} error={dateError || undefined} hint={`Azami ${TRANSFER_MAX_DAYS} gün: talep tarihinden itibaren sayılır. Müşteriye SMS gider.`} />
      </Dialog>

      <Dialog
        open={!!rejectFor}
        onOpenChange={(o) => !o && setRejectFor(null)}
        title="Geçiş Talebini Reddet"
        description={rejectFor ? `${rejectFor.id} · ${customer(rejectFor.customerId).name}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectFor(null)}>Vazgeç</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!rejectFor) return;
                if (rejectTransfer(rejectFor.id, reason ?? "Gerekçe", note)) notify({ title: `${rejectFor.id} Reddedildi`, body: `${reason} · müşteri ve yeni tedarikçi bilgilendirildi`, tone: "info" });
                setRejectFor(null);
                setNote("");
              }}
            >
              Talebi Reddet
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Select label="Gerekçe" items={REJECT_REASONS} value={reason} onValueChange={setReason} />
          <Textarea label="Ek Not" hint="Müşteri ve yeni tedarikçi ile paylaşılır." value={note} onChange={(e) => setNote(e.target.value)} minRows={3} />
        </div>
      </Dialog>
    </>
  );
}

/* ======================================================================== */
/* Dağıtım bedeli mutabakatı                                                 */
/* ======================================================================== */

function ReconTab({ go }: { go: PageProps["go"] }) {
  const { notify } = useApp();
  useRecon();
  const canAct = useCan("odeme");
  const [period, setPeriod] = useState<string>(PERIODS_12[10]);
  const [objection, setObjection] = useState<BatchInvoice | null>(null);
  const [rejectFor, setRejectFor] = useState<BatchInvoice | null>(null);
  const [note, setNote] = useState("");
  const rows = batchInvoices(period);
  const open = rows.filter((b) => effectiveDiff(b) !== 0 || b.state?.status === "itirazli");
  const total = rows.reduce((s, b) => s + b.batch, 0);

  const columns: Column<BatchInvoice>[] = [
    {
      key: "s",
      header: "Tedarikçi",
      render: (b) => (
        <a {...link(go, "suppliers", { id: b.supplierId })} className="block min-w-0">
          <span className="block truncate font-medium text-strong hover:underline">{SUPPLIERS.find((s) => s.id === b.supplierId)!.name}</span>
          <span className="kz-mono text-micro text-muted">{b.id}</span>
        </a>
      ),
    },
    { key: "b", header: "Abone Faturaları Toplamı", numeric: true, render: (b) => <span className="kz-mono">{tl(b.billed)}</span> },
    { key: "t", header: "Toplu Fatura (Kuzeyova)", numeric: true, render: (b) => <span className="kz-mono font-medium text-strong">{tl(b.batch)}</span> },
    { key: "d", header: "Fark", render: (b) => <ReconBadge diff={effectiveDiff(b)} state={b.state} /> },
    {
      key: "a",
      header: <span className="sr-only">İşlemler</span>,
      render: (b) => {
        if (b.state?.status === "mutabik") return <span className="text-small text-success">{b.state.how === "duzeltme" ? "Düzeltme kesildi" : "İtiraz reddedildi"}</span>;
        if (b.diff === 0) return null;
        return b.state?.status === "itirazli" ? (
          <span className="flex justify-end gap-1.5">
            <Button size="sm" variant="primary" disabled={!canAct} onClick={() => settleNow(b)}>Düzeltme Kes</Button>
            <Button size="sm" variant="ghost" disabled={!canAct} onClick={() => setRejectFor(b)}>İtirazı Reddet</Button>
          </span>
        ) : (
          <Button size="sm" variant="secondary" disabled={!canAct} onClick={() => setObjection(b)}>İtirazı Kaydet</Button>
        );
      },
    },
  ];

  const settleNow = (b: BatchInvoice) => {
    if (settleWithCorrection(b)) notify({ title: "Düzeltme Faturası Kesildi", body: `${b.id}: ${b.diff > 0 ? "iade" : "ek"} ${fmtTl(Math.abs(b.diff))}. Mutabakat kapandı.`, tone: "success" });
  };

  return (
    <div className="grid gap-5">
      <Panel
        title="Dağıtım Bedeli Toplu Faturaları"
        note="Dağıtım şirketi (Kuzeyova) her tedarikçiye dönem sonunda toplu dağıtım bedeli faturası keser. Tutar, o tedarikçinin abone faturalarındaki dağıtım bedeli toplamına eşit olmalı; fark varsa tedarikçi itiraz eder."
        actions={<Select label="Dönem" hideLabel items={reconPeriods().map((p) => ({ value: p, label: periodLabel(p) }))} value={period} onValueChange={(v) => setPeriod(v ?? PERIODS_12[10])} />}
      >
        <div className="grid gap-2 border-b border-line-soft p-4 text-small sm:px-5">
          <p className="text-body">
            <strong className="font-semibold text-strong">{periodLabel(period)}</strong> dönemi: {rows.length} toplu fatura, toplam {fmtTl(total, 0)}. {open.length ? `${open.length} kayıtta fark ya da itiraz var.` : "Hepsi mutabık."}
          </p>
        </div>
        <div className="max-md:hidden">
          <DataTable<BatchInvoice> caption={`${periodLabel(period)} toplu faturaları`} columns={columns} rows={rows} rowKey={(b) => b.id} density="comfortable" on="surface" stickyFirst={false} />
        </div>
        <ul className="grid gap-2 p-3 md:hidden" aria-label="Toplu Faturalar">
          {rows.map((b) => (
            <li key={b.id} className="grid gap-2 rounded-lg bg-surface p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-strong">{SUPPLIER_SHORT[b.supplierId]}</p>
                <ReconBadge diff={effectiveDiff(b)} state={b.state} />
              </div>
              <p className="kz-mono text-small text-muted">{tl(b.billed)} / {tl(b.batch)}</p>
              {b.diff !== 0 && !b.state ? <Button size="sm" variant="secondary" disabled={!canAct} onClick={() => setObjection(b)}>İtirazı Kaydet</Button> : null}
              {b.state?.status === "itirazli" ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" disabled={!canAct} onClick={() => settleNow(b)}>Düzeltme Kes</Button>
                  <Button size="sm" variant="ghost" disabled={!canAct} onClick={() => setRejectFor(b)}>Reddet</Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>

      <Dialog
        open={!!objection}
        onOpenChange={(o) => !o && setObjection(null)}
        title="Tedarikçi İtirazını Kaydet"
        description={objection ? `${objection.id} · fark ${fmtTl(Math.abs(objection.diff))}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setObjection(null)}>Vazgeç</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!objection) return;
                if (recordSupplierObjection(objection, note)) notify({ title: "Tedarikçi İtirazı Kaydedildi", body: `${objection.id}: fark kalemleri inceleniyor.`, tone: "info" });
                setObjection(null);
                setNote("");
              }}
            >
              Kaydet
            </Button>
          </>
        }
      >
        <Textarea label="İtiraz Gerekçesi" value={note} onChange={(e) => setNote(e.target.value)} minRows={3} hint="Tedarikçiden gelen yazıdaki gerekçeyi özetleyin." />
      </Dialog>
      <Dialog
        open={!!rejectFor}
        onOpenChange={(o) => !o && setRejectFor(null)}
        title="İtirazı Reddet"
        description={rejectFor ? `${rejectFor.id}: toplu fatura geçerli sayılır.` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectFor(null)}>Vazgeç</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!rejectFor) return;
                if (rejectObjection(rejectFor, note || "Toplu fatura abone faturalarıyla doğrulandı")) notify({ title: "İtiraz Reddedildi", body: `${rejectFor.id} mutabık sayıldı; tedarikçiye yazı gider.`, tone: "info" });
                setRejectFor(null);
                setNote("");
              }}
            >
              İtirazı Reddet
            </Button>
          </>
        }
      >
        <Textarea label="Gerekçe" value={note} onChange={(e) => setNote(e.target.value)} minRows={3} />
      </Dialog>
    </div>
  );
}

/* ======================================================================== */
/* Piyasa: seçenekler ve akış                                                */
/* ======================================================================== */

function MarketTab({ go }: { go: PageProps["go"] }) {
  const { notify } = useApp();
  const canMove = useCan("musteri");
  const [chosen, setChosen] = useState(() => CUSTOMERS.filter((c) => c.free)[2].id);
  const offers = customerOffers(customer(chosen));
  const current = offers.find((o) => o.current)!;
  const freeOptions = CUSTOMERS.filter((c) => c.free).slice(0, 40).map((c) => ({ value: c.id, label: `${c.name} · ${c.id}` }));
  const start = (to: string) => {
    const t = startTransferFor(chosen, to);
    if (!t) return notify({ title: "Geçiş Başlatılamadı", body: "Bu abonenin açık bir geçiş talebi var ya da yetkiniz yok.", tone: "info" });
    notify({ title: `${t.id} Oluşturuldu`, body: `${customer(chosen).name} → ${SUPPLIER_SHORT[to]} · Geçiş Kuyruğu'nda`, tone: "success" });
    go("suppliers", { tab: "gecis" });
  };
  const total = FLOW_LINKS.reduce((s, l) => s + l.value, 0);

  return (
    <div className="grid gap-5">
      <Panel
        id="musteri-secenekleri"
        title="Müşteri Seçenekleri"
        note="Bir abonenin görevli tedarik ve serbest tüketici seçeneklerini aynı tabloda karşılaştırın."
        actions={<div className="w-64 max-w-full"><Select label="Müşteri" hideLabel items={freeOptions} value={chosen} onValueChange={(v) => v && setChosen(v)} /></div>}
      >
        <div className="max-md:hidden">
          <DataTable
            caption={`${customer(chosen).name} için tedarikçi seçenekleri`}
            rows={offers}
            rowKey={(o) => o.supplier.id}
            density="comfortable"
            on="surface"
            stickyFirst={false}
            columns={[
              { key: "n", header: "Tedarikçi", render: (o) => <span className="flex items-center gap-2"><span className="font-medium text-strong">{o.supplier.name}</span>{o.current ? <Badge tone="primary">Mevcut</Badge> : null}</span> },
              { key: "k", header: "Tür", render: (o) => (o.supplier.kind === "gorevli" ? "Görevli tedarik" : "Perakende satış") },
              { key: "p", header: "Birim Fiyat", numeric: true, render: (o) => unitPrice(o.supplier.unitPrice) },
              { key: "c", header: "Taahhüt", numeric: true, render: (o) => (o.commit ? `${o.commit} ay` : "Yok") },
              { key: "m", header: "Tahmini Aylık Fatura", numeric: true, render: (o) => tlShort(o.monthly) },
              {
                key: "d",
                header: "Mevcuda Göre",
                numeric: true,
                render: (o) => {
                  if (o.current) return <span className="text-muted">·</span>;
                  const diff = o.monthly - current.monthly;
                  return <Badge tone={diff < 0 ? "success" : "neutral"}>{diff < 0 ? "−" : "+"}{tlShort(Math.abs(diff))}</Badge>;
                },
              },
              { key: "a", header: <span className="sr-only">Eylem</span>, render: (o) => (o.current ? null : <Button size="sm" variant="secondary" disabled={!o.eligible || !canMove} onClick={() => start(o.supplier.id)}>Geçiş Başlat</Button>) },
            ]}
          />
        </div>
        <ul className="grid gap-2 p-3 md:hidden" aria-label="Tedarikçi Seçenekleri">
          {offers.map((o) => (
            <li key={o.supplier.id} className="rounded-lg bg-surface p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-strong">{o.supplier.name}</p>
                {o.current ? <Badge tone="primary">Mevcut</Badge> : null}
              </div>
              <p className="mt-1 text-small text-muted">{unitPrice(o.supplier.unitPrice)} · {o.commit ? `${o.commit} ay taahhüt` : "Taahhüt yok"}</p>
              <p className="mt-1 text-read font-semibold text-strong">{tlShort(o.monthly)} <span className="text-small font-normal text-muted">tahmini aylık</span></p>
              {o.current ? null : <Button className="mt-2" size="sm" variant="secondary" disabled={!o.eligible || !canMove} onClick={() => start(o.supplier.id)}>Geçiş Başlat</Button>}
            </li>
          ))}
        </ul>
        <p className="border-t border-line-soft px-4 py-3 text-micro text-muted">
          Tahmini aylık fatura, aboneliğin son üç aylık ortalama tüketimi ile vergiler dahil hesaplanır; kesin tutar sözleşme koşullarına bağlıdır. Serbest tüketici olmayan abone yalnız görevli tedarikçiyi seçebilir.
        </p>
      </Panel>

      <ChartCard id="ted-akis" className={CARD} label="Son 12 Ayda Tedarikçi Değiştirenler" value={`${num.format(total)} müşteri`} change={null}>
        <SankeyChart
          title="Tedarikçiler Arası Geçiş Akışı"
          unit="müşteri"
          sources={SUPPLIERS.map((s) => ({ id: s.id, label: SUPPLIER_SHORT[s.id], series: 1 }))}
          targets={SUPPLIERS.map((s) => ({ id: `to-${s.id}`, label: SUPPLIER_SHORT[s.id] }))}
          links={FLOW_LINKS}
        />
        <p className="mt-2 text-small text-muted">Solda ayrılan, sağda katılan tedarikçi. Çok küçük akışlar etiketsiz kalır; tam sayılar ekran okuyucu tablosunda.</p>
      </ChartCard>
    </div>
  );
}

/* ======================================================================== */
/* Tedarikçi ayrıntısı                                                       */
/* ======================================================================== */

function SupplierDetail({ row, go }: { row: SupplierRow; go: PageProps["go"] }) {
  const { notify } = useApp();
  useRecon();
  const canAct = useCan("odeme");
  const s: Supplier = row.supplier;
  const mine = CUSTOMERS.filter((c) => c.supplierId === s.id);
  const trend = supplierTrend(s.id);
  const periods = reconPeriods();
  const recon = periods.map((p) => batchInvoice(s.id, p));
  const issue = recon.some((r) => effectiveDiff(r) !== 0);
  const usedPct = Math.round((row.receivable / row.collateral) * 100);

  const customerColumns: Column<(typeof mine)[number]>[] = [
    {
      key: "n",
      header: "Müşteri",
      render: (c) => (
        <a {...link(go, "customers", { id: c.id })} className="block min-w-0">
          <span className="block truncate font-medium text-strong hover:underline">{c.name}</span>
          <span className="kz-mono block text-small text-muted">{c.id} · {c.installation}</span>
        </a>
      ),
    },
    { key: "v", header: "Gerilim", render: (c) => c.voltage },
    { key: "f", header: "Seçim", render: (c) => (c.free ? <Badge tone="primary">Serbest tüketici</Badge> : <Badge tone="neutral">Görevli tedarik</Badge>) },
    { key: "u", header: "Aylık Tüketim", numeric: true, render: (c) => `${num.format(c.baseKwh)} kWh` },
  ];

  return (
    <>
      <PageHead
        title="Tedarikçiler"
        crumb={s.name}
        description={`${s.kind === "gorevli" ? "Görevli tedarik şirketi" : "Perakende satış şirketi"} · lisans ${s.license}`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => go("suppliers")}><ArrowLeft aria-hidden /> Tedarikçilere Dön</Button>
            <Button variant="primary" size="sm" onClick={() => go("invoices", { status: "hepsi" })}><Receipt aria-hidden /> Faturaları Gör</Button>
          </>
        }
      />
      <PageBody>
        <PageHero
          primary={{ label: "Müşteri", value: fmtNum(row.customers), foot: `%${num1.format(row.share)} pay · ${num.format(row.free)} serbest tüketici` }}
          secondary={[
            { label: "Teslim Edilen Enerji", value: fmtKwh(row.usage), foot: periodLabel(PERIODS_12[10]) },
            { label: "Birim Fiyat", value: unitPrice(s.unitPrice).replace(" ₺/kWh", ""), unit: "₺/kWh", foot: "Vergisiz enerji bedeli" },
            { label: "Dağıtım Bedeli", value: fmtTlCompact(row.billed), foot: "Abone faturalarının toplamı" },
            { label: "Teminat Mektubu", value: fmtTlCompact(row.collateral), foot: "Dağıtım bedeli teminatı" },
            { label: "Sözleşme Sonu", value: day(s.contractEnd), foot: `${row.daysToEnd} gün kaldı`, goodWhen: "up" },
          ]}
        />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <ChartCard id="td-tuketim" className={`${CARD} xl:col-span-3`} label="Müşterilerinin Tüketimi" value={fmtKwh(row.usage)} change={trend[4] ? Math.round(((trend[5] - trend[4]) / trend[4]) * 1000) / 10 : null} changeLabel="önceki aya göre" action={<Badge tone="neutral">Aylık, MWh</Badge>}>
            <AreaChart title={`${s.name} müşterilerinin aylık tüketimi`} labels={TREND_LABELS} series={[{ label: "Tüketim", values: trend, series: 1 }]} unit="MWh" valueFormat={{ maximumFractionDigits: 1 }} />
          </ChartCard>

          <Panel id="td-teminat" title="Teminat ve Borç Durumu" note="Dağıtım bedeli alacağının teminata oranı" className="xl:col-span-2">
            <div className="grid gap-4 p-4 sm:p-5">
              <TickMeter label="Teminat Kullanımı" value={Math.min(usedPct, 100)} max={100} text={`%${usedPct}`} valueText={`Teminatın yüzde ${usedPct}'i kullanılıyor`} marker={0.8} />
              <dl className="grid grid-cols-2 gap-3 text-small">
                <div className="rounded-lg bg-surface p-3"><dt className="text-muted">Açık Alacak</dt><dd className="mt-1 text-read font-semibold text-strong">{tlShort(row.receivable)}</dd></div>
                <div className="rounded-lg bg-surface p-3"><dt className="text-muted">Teminat</dt><dd className="mt-1 text-read font-semibold text-strong">{tlShort(row.collateral)}</dd></div>
              </dl>
              <p className="text-small text-muted">İşaret %80: teminatın bu oranı aşılırsa tedarikçiye yazı gönderilir ve teminat artırımı istenir.</p>
              <Button variant="secondary" size="sm" className="w-fit" onClick={() => notify({ title: "Teminat Artırımı Yazısı Gönderildi", body: `${s.name}: mevcut teminat ${tlShort(row.collateral)}`, tone: "info" })} disabled={usedPct < 80}>
                Teminat Artırımı İste
              </Button>
            </div>
          </Panel>
        </div>

        <Panel
          id="td-mutabakat"
          title="Dağıtım Bedeli Mutabakatı"
          note="Kuzeyova'nın bu tedarikçiye kestiği toplu dağıtım bedeli faturası, abone faturalarındaki dağıtım bedeli toplamıyla karşılaştırılır. Fark varsa tedarikçi itiraz eder."
          actions={issue ? <Badge tone="warning" dot>Fark var</Badge> : <Badge tone="success" dot>Mutabık</Badge>}
        >
          <div className="max-md:hidden">
            <DataTable
              caption="Dönem bazında mutabakat"
              rows={recon}
              rowKey={(r) => r.id}
              density="comfortable"
              on="surface"
              stickyFirst={false}
              columns={[
                { key: "p", header: "Dönem", render: (r) => periodLabel(r.period) },
                { key: "b", header: "Abone Faturaları Toplamı", numeric: true, render: (r) => tl(r.billed) },
                { key: "t", header: "Toplu Fatura (Kuzeyova)", numeric: true, render: (r) => tl(r.batch) },
                { key: "d", header: "Fark", numeric: true, render: (r) => <ReconBadge diff={effectiveDiff(r)} state={r.state} /> },
              ]}
            />
          </div>
          <ul className="grid gap-2 p-3 md:hidden" aria-label="Dönem Bazında Mutabakat">
            {recon.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface p-3">
                <div>
                  <p className="font-medium text-strong">{periodLabel(r.period)}</p>
                  <p className="text-small text-muted">{tl(r.billed)} / {tl(r.batch)}</p>
                </div>
                <ReconBadge diff={effectiveDiff(r)} state={r.state} />
              </li>
            ))}
          </ul>
          {issue ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-4 py-3 sm:px-5">
              <p className="flex items-start gap-2 text-small text-warning">
                <FileWarning aria-hidden className="mt-0.5 size-4 shrink-0" />
                Toplu fatura ile abone faturaları arasında fark var. İtiraz ve düzeltme Mutabakat sekmesinde yönetilir.
              </p>
              <Button size="sm" variant="primary" disabled={!canAct} onClick={() => go("suppliers", { tab: "mutabakat" })}>Mutabakata Git</Button>
            </div>
          ) : null}
        </Panel>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <Panel id="td-sozlesme" title="Sözleşme ve İletişim" className="xl:col-span-2">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 p-4 text-small sm:grid-cols-2 sm:p-5 xl:grid-cols-1">
              {[
                ["Lisans no", s.license],
                ["Tür", s.kind === "gorevli" ? "Görevli tedarik şirketi" : "Perakende satış şirketi"],
                ["Sözleşme bitişi", day(s.contractEnd)],
                ["Birim enerji bedeli", unitPrice(s.unitPrice)],
                ["Dilim fiyatları", `T1 ${s.prices.t1.toFixed(2)} · T2 ${s.prices.t2.toFixed(2)} · T3 ${s.prices.t3.toFixed(2)} ₺/kWh`],
                ["Fatura düzenleyen", "Tedarikçi (dağıtım bedeli kalemiyle)"],
              ].map(([k, v]) => (
                <div key={k}><dt className="text-muted">{k}</dt><dd className="mt-0.5 font-medium text-strong">{v}</dd></div>
              ))}
              <div>
                <dt className="text-muted">Çağrı Merkezi</dt>
                <dd className="mt-0.5 inline-flex items-center gap-2 font-medium text-strong">
                  <Phone aria-hidden className="size-4 text-muted" />
                  <a className="kz-mono hover:underline" href={`tel:${s.phone.replace(/\s/g, "")}`}>{s.phone}</a>
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel id="td-musteriler" title="Müşterileri" note={`${num.format(mine.length)} abone; ilk 12'si gösteriliyor`} className="xl:col-span-3" actions={<Button size="sm" variant="secondary" onClick={() => go("customers")}>Tüm Müşteriler</Button>}>
            <div className="max-md:hidden">
              <DataTable<(typeof mine)[number]> caption={`${s.name} müşterileri`} columns={customerColumns} rows={mine.slice(0, 12)} rowKey={(c) => c.id} density="comfortable" on="surface" stickyFirst={false} />
            </div>
            <div className="p-3 md:hidden">
              <RecordList
                label={`${s.name} müşterileri`}
                items={mine.slice(0, 12).map((c) => ({
                  id: c.id,
                  title: c.name,
                  subtitle: `${c.id} · ${c.voltage}`,
                  value: `${num.format(c.baseKwh)} kWh`,
                  status: c.free ? <Badge tone="primary">Serbest</Badge> : <Badge tone="neutral">Görevli</Badge>,
                  href: href("customers", { id: c.id }),
                  onSelect: () => go("customers", { id: c.id }),
                }))}
              />
            </div>
          </Panel>
        </div>
      </PageBody>
    </>
  );
}
