"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRightLeft, Building2, CalendarClock, CheckCircle2, FileWarning, Handshake, Landmark, Phone, Scale, ShieldCheck, Users, Zap } from "lucide-react";
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
import { Stat, StatGrid } from "@/components/ui/stat";
import { TickMeter } from "@/components/ui/tick-meter";
import { Textarea } from "@/components/ui/textarea";
import { CUSTOMERS, PERIODS_12, SUPPLIERS, customer, dayKey, fullDate, num, num1, parseDay, periodLabel, tl, tlShort, TODAY, addDays, type Supplier } from "./_data";
import {
  FLOW_LINKS,
  SUPPLIER_SHORT,
  TRANSFERS,
  TRANSFER_STAGES,
  TREND_LABELS,
  batchInvoiced,
  customerOffers,
  distributionBilled,
  supplierRows,
  supplierTrend,
  type SupplierRow,
  type Transfer,
  type TransferStage,
} from "./_data-operasyon";
import { CARD, IconTile, MetricStrip, PageBody, PageHead, Panel, SampleNote, href, useApp, type PageProps } from "./_ui";

/* ------------------------------------------------------------------------ */
/* Küçük parçalar                                                            */
/* ------------------------------------------------------------------------ */

const energy = (kwh: number) => (kwh >= 1_000_000 ? `${num1.format(kwh / 1_000_000)} GWh` : `${num1.format(kwh / 1000)} MWh`);
const day = (key: string) => fullDate.format(parseDay(key));
const unitPrice = (v: number) => `${v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺/kWh`;

function Cell({ icon, label, value, unit, foot, tone }: { icon: ReactNode; label: string; value: string; unit?: string; foot: string; tone?: "warning" | "danger" | "neutral" }) {
  return (
    <div className="relative flex h-full flex-col gap-3 p-4 sm:p-5">
      <IconTile tone={tone ?? "neutral"} className="absolute top-4 right-4 sm:top-5 sm:right-5">
        {icon}
      </IconTile>
      <div className="pr-10">
        <StatGrid className="grid-cols-1 sm:grid-cols-1">
          <Stat label={label} value={value} unit={unit} />
        </StatGrid>
      </div>
      <p className="mt-auto border-t border-dashed border-line pt-3 text-small text-muted">{foot}</p>
    </div>
  );
}

function ReconBadge({ diff }: { diff: number }) {
  if (diff === 0) return <Badge tone="success" dot>Mutabık</Badge>;
  return (
    <Badge tone="warning" dot>
      {diff > 0 ? "+" : "−"}
      {tl(Math.abs(diff))} fark
    </Badge>
  );
}

const STAGE_TONE: Record<TransferStage, "neutral" | "primary" | "warning" | "success"> = { talep: "neutral", dogrulama: "warning", tarih: "primary", tamam: "success" };

const REJECT_REASONS = [
  { value: "borc", label: "Vadesi geçmiş fatura borcu" },
  { value: "taahhut", label: "Taahhüt süresi dolmadı" },
  { value: "sayac", label: "Sayaç bilgisi eşleşmiyor" },
  { value: "belge", label: "Eksik ya da hatalı belge" },
];

/* ------------------------------------------------------------------------ */
/* Sayfa                                                                     */
/* ------------------------------------------------------------------------ */

export function TedarikcilerPage({ params, go }: PageProps) {
  const { notify } = useApp();
  const rows = useMemo(() => supplierRows(PERIODS_12[10]), []);
  const detail = params.id ? rows.find((r) => r.supplier.id === params.id) : undefined;

  /* Geçiş kuyruğu sayfa içinde değişir (yalnız bu oturumda). */
  const [transfers, setTransfers] = useState<readonly Transfer[]>(TRANSFERS);
  const [dateFor, setDateFor] = useState<Transfer | null>(null);
  const [effective, setEffective] = useState("");
  const [rejectFor, setRejectFor] = useState<Transfer | null>(null);
  const [reason, setReason] = useState<string | null>("borc");
  const [note, setNote] = useState("");
  const [chosen, setChosen] = useState(() => CUSTOMERS.filter((c) => c.free)[2].id);
  const [approved, setApproved] = useState<ReadonlySet<string>>(new Set());

  const patch = (id: string, change: Partial<Transfer>) => setTransfers((all) => all.map((t) => (t.id === id ? { ...t, ...change } : t)));

  const moveToVerify = (t: Transfer) => {
    patch(t.id, { stage: "dogrulama" });
    notify({ title: `${t.id} doğrulamaya alındı`, body: `${customer(t.customerId).name}: borç, sözleşme ve sayaç kontrolü başladı`, tone: "info" });
  };
  const openDate = (t: Transfer) => {
    setEffective(dayKey(addDays(TODAY, 7)));
    setDateFor(t);
  };
  const confirmDate = () => {
    if (!dateFor) return;
    patch(dateFor.id, { stage: "tarih", effective });
    notify({ title: `${dateFor.id}: geçiş tarihi verildi`, body: `${day(effective)} · müşteriye SMS gönderildi`, tone: "success" });
    setDateFor(null);
  };
  const complete = (t: Transfer) => {
    patch(t.id, { stage: "tamam" });
    notify({ title: `${t.id} tamamlandı`, body: `${customer(t.customerId).name} artık ${SUPPLIER_SHORT[t.to]} ile faturalanıyor`, tone: "success" });
  };
  const confirmReject = () => {
    if (!rejectFor) return;
    setTransfers((all) => all.filter((t) => t.id !== rejectFor.id));
    notify({ title: `${rejectFor.id} reddedildi`, body: `${REJECT_REASONS.find((r) => r.value === reason)?.label ?? "Gerekçe"} · müşteri ve yeni tedarikçi bilgilendirildi`, tone: "info" });
    setRejectFor(null);
    setNote("");
  };
  const startTransfer = (to: string) => {
    const c = customer(chosen);
    const id = `G-${5100 + transfers.length + 20}`;
    setTransfers((all) => [{ id, customerId: c.id, from: c.supplierId, to, stage: "talep", requested: dayKey(TODAY), effective: null, blocker: null }, ...all]);
    notify({ title: `${id} oluşturuldu`, body: `${c.name} → ${SUPPLIER_SHORT[to]} · Talep Alındı sütununda`, tone: "success" });
  };

  /* ---------------- Ayrıntı ---------------- */
  if (params.id && detail) {
    return (
      <SupplierDetail
        row={detail}
        approved={approved.has(detail.supplier.id)}
        onApprove={() => {
          setApproved((s) => new Set(s).add(detail.supplier.id));
          notify({ title: "Mutabakat onaylandı", body: `${detail.supplier.name}: ${periodLabel(PERIODS_12[10])} dağıtım bedeli kapatıldı`, tone: "success" });
        }}
        onDispute={() => notify({ title: "İtiraz kaydı açıldı", body: `${detail.supplier.name} toplu faturası için fark incelemesi başladı`, tone: "info" })}
        go={go}
      />
    );
  }

  /* ---------------- Liste ---------------- */
  const free = CUSTOMERS.filter((c) => c.free).length;
  const avgPrice = rows.reduce((s, r) => s + r.supplier.unitPrice, 0) / rows.length;
  const pending = transfers.filter((t) => t.stage !== "tamam").length;
  const ending = rows.filter((r) => r.daysToEnd <= 60);

  const columns: Column<SupplierRow>[] = [
    {
      key: "name",
      header: "Tedarikçi",
      sortable: true,
      sortValue: (r) => r.supplier.name,
      render: (r) => (
        <a href={href("suppliers", { id: r.supplier.id })} className="block min-w-0">
          <span className="block truncate font-medium text-strong hover:underline">{r.supplier.name}</span>
          <span className="edas-mono block text-small text-muted">{r.supplier.license}</span>
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
    { key: "recon", header: "Dağıtım Bedeli Mutabakatı", render: (r) => <ReconBadge diff={r.diff} /> },
  ];

  const items: RecordItem[] = rows.map((r) => ({
    id: r.supplier.id,
    title: r.supplier.name,
    subtitle: `${r.supplier.kind === "gorevli" ? "Görevli tedarik" : "Perakende satış"} · ${unitPrice(r.supplier.unitPrice)}`,
    leading: <IconTile tone="neutral"><Building2 /></IconTile>,
    value: `${num.format(r.customers)} müşteri · %${num1.format(r.share)}`,
    meta: `Sözleşme sonu ${day(r.supplier.contractEnd)}`,
    status: <ReconBadge diff={r.diff} />,
    href: href("suppliers", { id: r.supplier.id }),
    onSelect: () => go("suppliers", { id: r.supplier.id }),
  }));

  const offers = customerOffers(customer(chosen));
  const current = offers.find((o) => o.current)!;
  const freeOptions = CUSTOMERS.filter((c) => c.free).slice(0, 40).map((c) => ({ value: c.id, label: `${c.name} · ${c.id}` }));

  return (
    <>
      <PageHead
        title="Tedarikçiler"
        description="Görevli tedarik ve perakende satış şirketleri, geçiş talepleri ve dağıtım bedeli mutabakatı."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => notify({ title: "Piyasa raporu hazırlanıyor", body: "Tedarikçi bazında enerji ve mutabakat özeti, birkaç saniye", tone: "info" })}>
              Piyasa Raporu
            </Button>
            <Button variant="primary" size="sm" onClick={() => document.getElementById("musteri-secenekleri")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              Geçiş Başlat
            </Button>
          </>
        }
      />
      <PageBody>
        <MetricStrip>
          <Cell icon={<Building2 />} label="Tedarikçi" value={num.format(rows.length)} foot="1 görevli, 5 perakende satış şirketi" />
          <Cell icon={<Users />} label="Serbest Tüketici" value={num.format(free)} foot={`${num.format(CUSTOMERS.length)} abonenin %${num1.format((free / CUSTOMERS.length) * 100)}'i seçim yapabilir`} />
          <Cell icon={<Zap />} label={`Teslim Edilen Enerji`} value={energy(rows.reduce((s, r) => s + r.usage, 0))} foot={`${periodLabel(PERIODS_12[10])}, okuması tamamlanan sayaçlar`} />
          <Cell icon={<Scale />} label="Ortalama Birim Fiyat" value={avgPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} unit="₺/kWh" foot="Vergisiz enerji bedeli, tedarikçi ortalaması" />
          <Cell icon={<ArrowRightLeft />} label="Bekleyen Geçiş" value={num.format(pending)} foot={`${transfers.filter((t) => t.blocker).length} talepte engel var`} tone={pending ? "warning" : "neutral"} />
          <Cell icon={<CalendarClock />} label="Sözleşmesi Dolacak" value={num.format(ending.length)} foot={ending.length ? `60 gün içinde: ${ending.map((r) => SUPPLIER_SHORT[r.supplier.id]).join(", ")}` : "60 gün içinde dolan sözleşme yok"} tone={ending.length ? "warning" : "neutral"} />
        </MetricStrip>

        <Panel id="ted-liste" title="Tedarikçi Listesi" note="Satıra basınca tedarikçinin müşterileri, faturalaması ve teminat durumu açılır.">
          <div className="max-md:hidden">
            <DataTable<SupplierRow> caption="Tedarikçiler" columns={columns} rows={rows} rowKey={(r) => r.supplier.id} density="comfortable" on="surface" stickyFirst={false} />
          </div>
          <div className="p-3 md:hidden">
            <RecordList label="Tedarikçiler" items={items} />
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <ChartCard id="ted-pay" className={`${CARD} xl:col-span-2`} label="Piyasa Payı" value={`${num.format(rows[0].customers)} müşteri`} change={null} action={<Badge tone="neutral">Müşteri sayısı</Badge>}>
            <BarList title="Tedarikçilere Göre Müşteri Sayısı" columns={["Tedarikçi", "Müşteri"]} items={rows.map((r) => ({ label: SUPPLIER_SHORT[r.supplier.id], value: r.customers, href: href("suppliers", { id: r.supplier.id }) }))} series={1} />
          </ChartCard>
          <ChartCard id="ted-akis" className={`${CARD} xl:col-span-3`} label="Son 12 Ayda Tedarikçi Değiştirenler" value={`${num.format(FLOW_LINKS.reduce((s, l) => s + l.value, 0))} müşteri`} change={null}>
            <SankeyChart
              title="Tedarikçiler Arası Geçiş Akışı"
              unit="müşteri"
              sources={SUPPLIERS.map((s, i) => ({ id: s.id, label: SUPPLIER_SHORT[s.id], series: ((i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6 }))}
              targets={SUPPLIERS.map((s) => ({ id: `to-${s.id}`, label: SUPPLIER_SHORT[s.id] }))}
              links={FLOW_LINKS}
            />
          </ChartCard>
        </div>

        <Panel
          id="ted-gecis"
          title="Tedarikçi Değişikliği (Geçiş) Kuyruğu"
          note="Talep → doğrulama → geçiş tarihi → tamamlandı. Engeli olan talep doğrulamadan çıkamaz."
          actions={<Badge tone="warning" dot>{pending} açık talep</Badge>}
        >
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
                    return (
                      <article key={t.id} className="rounded-md bg-overlay p-3 shadow-raised ring-1 ring-line">
                        <div className="flex items-start justify-between gap-2">
                          <a href={href("customers", { id: c.id })} className="min-w-0 text-small font-medium text-strong hover:underline">
                            <span className="block truncate">{c.name}</span>
                          </a>
                          <span className="edas-mono shrink-0 text-micro text-muted">{t.id}</span>
                        </div>
                        <p className="mt-1 text-small text-muted">
                          {SUPPLIER_SHORT[t.from]} <span aria-hidden>→</span>
                          <span className="sr-only"> yeni tedarikçi </span> {SUPPLIER_SHORT[t.to]}
                        </p>
                        <p className="mt-1 text-micro text-muted">
                          Talep {day(t.requested)}
                          {t.effective ? ` · Geçiş ${day(t.effective)}` : ""}
                        </p>
                        {t.blocker ? (
                          <p className="mt-2 flex items-start gap-1.5 rounded-sm bg-warning-wash px-2 py-1.5 text-micro text-warning">
                            <FileWarning aria-hidden className="mt-px size-3.5 shrink-0" />
                            Engel: {t.blocker}
                          </p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {t.stage === "talep" ? (
                            <Button size="sm" variant="primary" onClick={() => moveToVerify(t)}>
                              Doğrulamaya Al
                            </Button>
                          ) : null}
                          {t.stage === "dogrulama" ? (
                            <Button size="sm" variant="primary" disabled={!!t.blocker} onClick={() => openDate(t)}>
                              Geçiş Tarihi Ver
                            </Button>
                          ) : null}
                          {t.stage === "tarih" ? (
                            <Button size="sm" variant="primary" onClick={() => complete(t)}>
                              Tamamla
                            </Button>
                          ) : null}
                          {t.stage !== "tamam" ? (
                            <Button size="sm" variant="ghost" onClick={() => setRejectFor(t)}>
                              Reddet
                            </Button>
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
                {
                  key: "n",
                  header: "Tedarikçi",
                  render: (o) => (
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-strong">{o.supplier.name}</span>
                      {o.current ? <Badge tone="primary">Mevcut</Badge> : null}
                    </span>
                  ),
                },
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
                {
                  key: "a",
                  header: <span className="sr-only">Eylem</span>,
                  render: (o) =>
                    o.current ? null : (
                      <Button size="sm" variant="secondary" disabled={!o.eligible} onClick={() => startTransfer(o.supplier.id)}>
                        Geçiş Başlat
                      </Button>
                    ),
                },
              ]}
            />
          </div>
          <ul className="grid gap-2 p-3 md:hidden" aria-label="Tedarikçi seçenekleri">
            {offers.map((o) => (
              <li key={o.supplier.id} className="rounded-lg bg-surface p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-strong">{o.supplier.name}</p>
                  {o.current ? <Badge tone="primary">Mevcut</Badge> : null}
                </div>
                <p className="mt-1 text-small text-muted">
                  {unitPrice(o.supplier.unitPrice)} · {o.commit ? `${o.commit} ay taahhüt` : "Taahhüt yok"}
                </p>
                <p className="mt-1 text-read font-semibold text-strong">{tlShort(o.monthly)} <span className="text-small font-normal text-muted">tahmini aylık</span></p>
                {o.current ? null : (
                  <Button className="mt-2" size="sm" variant="secondary" disabled={!o.eligible} onClick={() => startTransfer(o.supplier.id)}>
                    Geçiş Başlat
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <p className="border-t border-line-soft px-4 py-3 text-micro text-muted">
            Tahmini aylık fatura, aboneliğin son üç aylık ortalama tüketimi ile vergiler dahil hesaplanır; kesin tutar sözleşme koşullarına bağlıdır. Serbest tüketici olmayan abone yalnız görevli tedarikçiyi seçebilir.
          </p>
        </Panel>

        <SampleNote />
      </PageBody>

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
        <div className="grid gap-3">
          <Input label="Geçiş Tarihi" type="date" value={effective} min={dayKey(addDays(TODAY, 1))} onChange={(e) => setEffective(e.target.value)} hint="Geçiş, sayaç okumasının yapılacağı günde başlar; müşteriye SMS gider." />
        </div>
      </Dialog>

      <Dialog
        open={!!rejectFor}
        onOpenChange={(o) => !o && setRejectFor(null)}
        title="Geçiş Talebini Reddet"
        description={rejectFor ? `${rejectFor.id} · ${customer(rejectFor.customerId).name}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectFor(null)}>Vazgeç</Button>
            <Button variant="danger" onClick={confirmReject}>Talebi Reddet</Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Select label="Gerekçe" items={REJECT_REASONS} value={reason} onValueChange={setReason} />
          <Textarea label="Ek not" hint="Müşteri ve yeni tedarikçi ile paylaşılır." value={note} onChange={(e) => setNote(e.target.value)} minRows={3} />
        </div>
      </Dialog>
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Tedarikçi ayrıntısı                                                       */
/* ------------------------------------------------------------------------ */

function SupplierDetail({ row, approved, onApprove, onDispute, go }: { row: SupplierRow; approved: boolean; onApprove: () => void; onDispute: () => void; go: PageProps["go"] }) {
  const { notify } = useApp();
  const s: Supplier = row.supplier;
  const mine = CUSTOMERS.filter((c) => c.supplierId === s.id);
  const trend = supplierTrend(s.id);
  const periods = PERIODS_12.slice(-3).reverse();
  const recon = periods.map((p) => {
    const billed = distributionBilled(s.id, p);
    const batch = batchInvoiced(s.id, p);
    return { period: p, billed, batch, diff: batch - billed };
  });
  const issue = recon.some((r) => r.diff !== 0);
  const usedPct = Math.round((row.receivable / row.collateral) * 100);

  const customerColumns: Column<(typeof mine)[number]>[] = [
    {
      key: "n",
      header: "Müşteri",
      render: (c) => (
        <a href={href("customers", { id: c.id })} className="block min-w-0">
          <span className="block truncate font-medium text-strong hover:underline">{c.name}</span>
          <span className="edas-mono block text-small text-muted">{c.id} · {c.installation}</span>
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
            <Button variant="secondary" size="sm" onClick={() => go("suppliers")}>
              <ArrowLeft aria-hidden /> Tedarikçilere Dön
            </Button>
            <Button variant="primary" size="sm" onClick={() => go("invoices")}>
              Faturaları Gör
            </Button>
          </>
        }
      />
      <PageBody>
        <MetricStrip>
          <Cell icon={<Users />} label="Müşteri" value={num.format(row.customers)} foot={`%${num1.format(row.share)} pay · ${num.format(row.free)} serbest tüketici`} />
          <Cell icon={<Zap />} label="Teslim Edilen Enerji" value={energy(row.usage)} foot={periodLabel(PERIODS_12[10])} />
          <Cell icon={<Scale />} label="Birim Fiyat" value={s.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} unit="₺/kWh" foot="Vergisiz enerji bedeli" />
          <Cell icon={<Landmark />} label="Dağıtım Bedeli" value={tlShort(row.billed)} foot="Abone faturalarının toplamı" />
          <Cell icon={<ShieldCheck />} label="Teminat Mektubu" value={tlShort(row.collateral)} foot="Dağıtım bedeli teminatı" />
          <Cell icon={<Handshake />} label="Sözleşme Sonu" value={day(s.contractEnd)} foot={`${row.daysToEnd} gün kaldı`} tone={row.daysToEnd <= 60 ? "warning" : "neutral"} />
        </MetricStrip>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <ChartCard id="td-tuketim" className={`${CARD} xl:col-span-3`} label="Müşterilerinin Tüketimi" value={energy(row.usage)} change={trend[4] ? Math.round(((trend[5] - trend[4]) / trend[4]) * 1000) / 10 : null} changeLabel="önceki aya göre" action={<Badge tone="neutral">Aylık, MWh</Badge>}>
            <AreaChart title={`${s.name} müşterilerinin aylık tüketimi`} labels={TREND_LABELS} series={[{ label: "Tüketim", values: trend, series: 1 }]} unit="MWh" valueFormat={{ maximumFractionDigits: 1 }} />
          </ChartCard>

          <Panel id="td-teminat" title="Teminat ve Borç Durumu" note="Dağıtım bedeli alacağının teminata oranı" className="xl:col-span-2">
            <div className="grid gap-4 p-4 sm:p-5">
              <TickMeter label="Teminat kullanımı" value={Math.min(usedPct, 100)} max={100} text={`%${usedPct}`} valueText={`Teminatın yüzde ${usedPct}'i kullanılıyor`} marker={0.8} />
              <dl className="grid grid-cols-2 gap-3 text-small">
                <div className="rounded-lg bg-surface p-3">
                  <dt className="text-muted">Açık alacak</dt>
                  <dd className="mt-1 text-read font-semibold text-strong">{tlShort(row.receivable)}</dd>
                </div>
                <div className="rounded-lg bg-surface p-3">
                  <dt className="text-muted">Teminat</dt>
                  <dd className="mt-1 text-read font-semibold text-strong">{tlShort(row.collateral)}</dd>
                </div>
              </dl>
              <p className="text-small text-muted">İşaret %80: teminatın bu oranı aşılırsa tedarikçiye yazı gönderilir ve teminat artırımı istenir.</p>
              <Button variant="secondary" size="sm" className="w-fit" onClick={() => notify({ title: "Teminat artırımı yazısı gönderildi", body: `${s.name}: mevcut teminat ${tlShort(row.collateral)}`, tone: "info" })} disabled={usedPct < 80}>
                Teminat Artırımı İste
              </Button>
            </div>
          </Panel>
        </div>

        <Panel
          id="td-mutabakat"
          title="Dağıtım Bedeli Mutabakatı"
          note="Tedarikçinin gönderdiği toplu fatura ile abone faturalarının dağıtım bedeli toplamı karşılaştırılır."
          actions={issue && !approved ? <Badge tone="warning" dot>Fark var</Badge> : <Badge tone="success" dot>Mutabık</Badge>}
        >
          <div className="max-md:hidden">
            <DataTable
              caption="Dönem bazında mutabakat"
              rows={recon}
              rowKey={(r) => r.period}
              density="comfortable"
              on="surface"
              stickyFirst={false}
              columns={[
                { key: "p", header: "Dönem", render: (r) => periodLabel(r.period) },
                { key: "b", header: "Abone Faturaları Toplamı", numeric: true, render: (r) => tl(r.billed) },
                { key: "t", header: "Tedarikçi Toplu Faturası", numeric: true, render: (r) => tl(r.batch) },
                { key: "d", header: "Fark", numeric: true, render: (r) => <ReconBadge diff={approved ? 0 : r.diff} /> },
              ]}
            />
          </div>
          <ul className="grid gap-2 p-3 md:hidden" aria-label="Dönem bazında mutabakat">
            {recon.map((r) => (
              <li key={r.period} className="flex items-center justify-between gap-3 rounded-lg bg-surface p-3">
                <div>
                  <p className="font-medium text-strong">{periodLabel(r.period)}</p>
                  <p className="text-small text-muted">{tl(r.billed)} / {tl(r.batch)}</p>
                </div>
                <ReconBadge diff={approved ? 0 : r.diff} />
              </li>
            ))}
          </ul>
          {issue && !approved ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-4 py-3 sm:px-5">
              <p className="flex items-start gap-2 text-small text-warning">
                <FileWarning aria-hidden className="mt-0.5 size-4 shrink-0" />
                Toplu fatura ile abone faturaları arasında fark var. Onaylamadan önce fark kalemlerini inceleyin.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={onDispute}>İtiraz Et</Button>
                <Button size="sm" variant="primary" onClick={onApprove}>Farkı Kabul Et ve Onayla</Button>
              </div>
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
                ["Fatura dönemi", "Aylık, okuma gününden 3 gün sonra"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-muted">{k}</dt>
                  <dd className="mt-0.5 font-medium text-strong">{v}</dd>
                </div>
              ))}
              <div>
                <dt className="text-muted">Çağrı merkezi</dt>
                <dd className="mt-0.5 inline-flex items-center gap-2 font-medium text-strong">
                  <Phone aria-hidden className="size-4 text-muted" />
                  <a className="edas-mono hover:underline" href={`tel:${s.phone.replace(/\s/g, "")}`}>{s.phone}</a>
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

        <SampleNote />
      </PageBody>
    </>
  );
}
