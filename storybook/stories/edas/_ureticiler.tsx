"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ClipboardCheck, FileText, PlugZap, Send, Sun, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { ChartCard } from "@/components/ui/chart-card";
import { ComboChart } from "@/components/ui/combo-chart";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { StepRail } from "@/components/ui/step-rail";
import { CURRENT_PERIOD, KIND_LABEL, customer, dayLabel, meterById, num, periodLabel, tl } from "./_data";
import { creditValue, producerIndexes, producerPeriods, settleToInvoice, settlementTarget, transformerHeadroom } from "./_data-uretici";
import { PRODUCER_STATUS_LABEL, type Producer, type ProducerStatus } from "./_data-yeni";
import { PageHero, fmtKwh, fmtNum, fmtPct, fmtTl } from "./_kit";
import { useCan } from "./_permissions";
import { advanceProducer, useProducers, useStoreVersion } from "./_store";
import { CARD, IconTile, PageBody, PageHead, Panel, href, useApp, type PageProps } from "./_ui";

const link = (go: PageProps["go"], page: Parameters<PageProps["go"]>[0], params: Record<string, string | undefined>) => ({
  href: href(page, params),
  onClick: (e: { preventDefault: () => void }) => {
    e.preventDefault();
    go(page, params);
  },
});

const STATUS_TONE: Record<ProducerStatus, "neutral" | "warning" | "success"> = { basvuru: "neutral", kabul: "warning", devrede: "success" };
const STEP_INDEX: Record<ProducerStatus, number> = { basvuru: 0, kabul: 1, devrede: 3 };
const monthShort = (p: string) => new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(new Date(`${p}-01T00:00:00`)).replace(".", "");

/* ======================================================================== */
/* Sayfa                                                                     */
/* ======================================================================== */

export function UreticilerPage({ params, go }: PageProps) {
  useStoreVersion();
  const producers = useProducers();
  const detail = params.id ? producers.find((p) => p.id === params.id) : undefined;
  if (params.id && !detail) {
    return (
      <>
        <PageHead title="Üreticiler" description="Üretici bulunamadı." />
        <PageBody>
          <EmptyState icon={<Sun />} title="Üretici Bulunamadı" hint={`${params.id} kayıtlı değil.`} action={<Button variant="secondary" size="sm" onClick={() => go("producers")}>Üreticilere Dön</Button>} />
        </PageBody>
      </>
    );
  }
  return detail ? <ProducerDetail p={detail} go={go} /> : <ProducerList producers={producers} go={go} />;
}

/* ======================================================================== */
/* Liste                                                                     */
/* ======================================================================== */

type Row = { p: Producer; last: { consumed: number; exported: number; net: number }; warn: boolean };

function ProducerList({ producers, go }: { producers: readonly Producer[]; go: PageProps["go"] }) {
  const rows: Row[] = useMemo(
    () =>
      producers.map((p) => {
        const per = producerPeriods(p).filter((r) => r.consumed > 0).slice(-1)[0];
        return { p, last: per ?? { consumed: 0, exported: 0, net: 0 }, warn: !!transformerHeadroom(p)?.warn };
      }),
    [producers],
  );
  const live = producers.filter((p) => p.status === "devrede");
  const installed = live.reduce((s, p) => s + p.installedKw, 0);
  const exported = rows.reduce((s, r) => s + r.last.exported, 0);
  const credit = producers.reduce((s, p) => s + p.creditKwh, 0);
  const waiting = producers.filter((p) => p.status !== "devrede").length;
  const warn = rows.filter((r) => r.warn).length;

  const columns: Column<Row>[] = [
    {
      key: "n",
      header: "Üretici",
      sortable: true,
      sortValue: (r) => customer(r.p.customerId).name,
      render: (r) => (
        <a {...link(go, "producers", { id: r.p.id })} className="block min-w-0">
          <span className="block truncate font-medium text-strong hover:underline">{customer(r.p.customerId).name}</span>
          <span className="edas-mono text-micro text-muted">{r.p.id} · {meterById(r.p.meterId)?.serial}</span>
        </a>
      ),
    },
    { key: "k", header: "Tür", render: (r) => `GES · ${KIND_LABEL[customer(r.p.customerId).kind]}` },
    { key: "kw", header: "Kurulu Güç", numeric: true, sortable: true, sortValue: (r) => r.p.installedKw, render: (r) => <span className="edas-mono">{num.format(r.p.installedKw)} kW</span> },
    { key: "s", header: "Durum", render: (r) => <Badge tone={STATUS_TONE[r.p.status]} dot>{PRODUCER_STATUS_LABEL[r.p.status]}</Badge> },
    { key: "c", header: "Son Dönem Çekiş", numeric: true, render: (r) => <span className="edas-mono">{r.p.status === "devrede" ? `${num.format(r.last.consumed)} kWh` : "-"}</span> },
    { key: "e", header: "Son Dönem Veriş", numeric: true, render: (r) => <span className="edas-mono">{r.p.status === "devrede" ? `${num.format(r.last.exported)} kWh` : "-"}</span> },
    { key: "cr", header: "Devreden Alacak", numeric: true, sortable: true, sortValue: (r) => r.p.creditKwh, render: (r) => <span className={r.p.creditKwh ? "edas-mono font-medium text-strong" : "edas-mono text-muted"}>{r.p.creditKwh ? `${num.format(r.p.creditKwh)} kWh` : "-"}</span> },
    { key: "w", header: "Trafo", render: (r) => (r.warn ? <Badge tone="warning" dot>Kapasite uyarısı</Badge> : <span className="text-muted">·</span>) },
  ];
  const items: RecordItem[] = rows.map((r) => ({
    id: r.p.id,
    title: customer(r.p.customerId).name,
    subtitle: `${r.p.id} · ${r.p.installedKw} kW GES`,
    leading: <IconTile tone={r.p.status === "devrede" ? "success" : "neutral"}><Sun /></IconTile>,
    value: r.p.creditKwh ? `${num.format(r.p.creditKwh)} kWh alacak` : PRODUCER_STATUS_LABEL[r.p.status],
    meta: r.p.status === "devrede" ? `Son dönem veriş ${fmtKwh(r.last.exported)}` : `Başvuru ${dayLabel(r.p.appliedAt)}`,
    status: <Badge tone={STATUS_TONE[r.p.status]} dot>{PRODUCER_STATUS_LABEL[r.p.status]}</Badge>,
    href: href("producers", { id: r.p.id }),
    onSelect: () => go("producers", { id: r.p.id }),
  }));

  return (
    <>
      <PageHead title="Üreticiler" description="Net ölçüm ve lisanssız üretim: çift yönlü sayaç, dönemsel mahsup ve devreden alacak." />
      <PageBody>
        <PageHero
          primary={{ label: "Devrede Kurulu Güç", value: `${num.format(installed)} kW`, foot: `${live.length} üretici devrede · ${fmtNum(producers.length)} kayıt` }}
          secondary={[
            { label: "Şebekeye Verilen (Son Dönem)", value: fmtKwh(exported), foot: "2.8.0 toplamı" },
            { label: "Devreden Alacak", value: fmtKwh(credit), foot: "Mahsup bekleyen enerji", goodWhen: "down" },
            { label: "Bekleyen Başvuru", value: fmtNum(waiting), foot: "Başvuru ya da kabul aşamasında" },
            { label: "Trafo Kapasite Uyarısı", value: fmtNum(warn), foot: "Doluluk ≥ %85 ya da güç sınırı aşıldı", goodWhen: "down", to: { page: "grid" } },
            { label: "Mahsup Değeri", value: fmtTl(live.reduce((s, p) => s + creditValue(p, p.creditKwh), 0), 0), foot: "Devreden alacağın TL karşılığı (ÖRNEK fiyat)" },
          ]}
        />
        <Panel title="Üretici Listesi" note="Üretici adına basınca çift yönlü okuma, dönem mahsubu ve başvuru aşamaları açılır.">
          <div className="max-md:hidden">
            <DataTable<Row> caption="Üreticiler" columns={columns} rows={rows} rowKey={(r) => r.p.id} density="comfortable" on="surface" stickyFirst={false} />
          </div>
          <div className="p-3 md:hidden">
            <RecordList label="Üreticiler" items={items} />
          </div>
        </Panel>
      </PageBody>
    </>
  );
}

/* ======================================================================== */
/* Ayrıntı                                                                   */
/* ======================================================================== */

function ProducerDetail({ p, go }: { p: Producer; go: PageProps["go"] }) {
  const { notify } = useApp();
  const canStep = useCan("sayac");
  const canPay = useCan("odeme");
  const c = customer(p.customerId);
  const meter = meterById(p.meterId);
  const periods = useMemo(() => producerPeriods(p), [p]);
  const indexes = useMemo(() => producerIndexes(p), [p]);
  const head = transformerHeadroom(p);
  const target = settlementTarget(p.customerId);
  const [open, setOpen] = useState(false);
  const [kwh, setKwh] = useState("");
  const [error, setError] = useState("");

  const lastIdx = periods.map((r) => r.consumed > 0).lastIndexOf(true);
  const last = periods[lastIdx] ?? periods[periods.length - 1];
  const totalExp = periods.reduce((s, r) => s + r.exported, 0);
  const totalCon = periods.reduce((s, r) => s + r.consumed, 0);
  const parsed = Math.round(Number(kwh.replace(",", ".")) * 10) / 10;

  const steps = [
    { icon: <FileText />, title: "Başvuru", description: `Alındı ${dayLabel(p.appliedAt)}` },
    { icon: <ClipboardCheck />, title: "Kabul", description: p.acceptedAt ? `Kabul ${dayLabel(p.acceptedAt)}` : "Proje ve kapasite kontrolü" },
    { icon: <PlugZap />, title: "Çift yönlü sayaç", description: "2.8.0 sayaç montajı" },
    { icon: <Sun />, title: "Devrede", description: "Dönemsel mahsup başlar" },
  ];
  const current = STEP_INDEX[p.status];
  const nextLabel = p.status === "basvuru" ? "Başvuruyu Kabul Et" : p.status === "kabul" ? "Sayacı Devreye Al" : "";

  return (
    <>
      <PageHead
        title="Üreticiler"
        crumb={`${p.id} · ${c.name}`}
        description={`${p.installedKw} kW GES · tesisat ${c.installation} · ${meter?.serial ?? ""}`}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => go("producers")}><ArrowLeft aria-hidden /> Listeye Dön</Button>
            {nextLabel ? (
              <Button
                variant="primary"
                size="sm"
                disabled={!canStep}
                onClick={() => {
                  advanceProducer(p.id);
                  notify({ title: p.status === "basvuru" ? "Başvuru kabul edildi" : "Çift yönlü sayaç devreye alındı", body: `${c.name} · ${p.id}`, tone: "success" });
                }}
              >
                {nextLabel}
              </Button>
            ) : (
              <Button variant="primary" size="sm" disabled={!canPay || p.creditKwh <= 0} onClick={() => { setKwh(String(p.creditKwh)); setError(""); setOpen(true); }}>
                <Send aria-hidden /> Dönem Mahsubu
              </Button>
            )}
          </>
        }
      />
      <PageBody>
        <PageHero
          primary={{ label: "Devreden Alacak", value: `${num.format(p.creditKwh)} kWh`, foot: p.creditKwh ? `${fmtTl(creditValue(p, p.creditKwh))} değerinde (ÖRNEK fiyat)` : "Mahsup bekleyen enerji yok", goodWhen: "down" }}
          secondary={[
            { label: `${monthShort(last.period)} Çekiş (1.8.0)`, value: fmtKwh(last.consumed), foot: periodLabel(last.period) },
            { label: `${monthShort(last.period)} Veriş (2.8.0)`, value: fmtKwh(last.exported), foot: p.status === "devrede" ? "Şebekeye verilen" : "Devreye alınınca" },
            { label: "Net Pozisyon", value: fmtKwh(Math.abs(last.net)), foot: last.net <= 0 ? "Üretici lehine (alacak doğar)" : "Şebekeden net çekiş" },
            { label: "12 Ay Veriş / Çekiş", value: totalCon ? fmtPct((totalExp / totalCon) * 100, 0) : "-", foot: `${fmtKwh(totalExp)} / ${fmtKwh(totalCon)}` },
          ]}
        />

        {p.status !== "devrede" ? (
          <Panel title="Başvuru Aşamaları" note="Kabul edilmeden çift yönlü sayaç takılamaz; sayaç devreye girmeden mahsup yapılamaz.">
            <div className="p-4 sm:p-5">
              <StepRail steps={steps} current={current} fill="static" headingLevel={3} />
            </div>
          </Panel>
        ) : null}

        {head ? (
          <Panel title="Trafo Kapasitesi" note="Üreticinin sayacının bağlı olduğu dağıtım trafosunda boş güç ve bağlantı sınırı.">
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
              {[
                ["Trafo", `${head.id} · ${head.kva} kVA`],
                ["Doluluk", `%${head.loadPct.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`],
                ["Boş güç", `${head.headroomKw.toLocaleString("tr-TR")} kW`],
                ["Kurulu GES", `${p.installedKw} kW`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-surface p-3">
                  <p className="text-small text-muted">{k}</p>
                  <p className="edas-mono mt-0.5 text-read font-semibold text-strong">{v}</p>
                </div>
              ))}
              {head.warn ? (
                <p className="flex items-start gap-2 rounded-lg bg-warning-wash p-3 text-small text-warning sm:col-span-2 lg:col-span-4">
                  <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                  <span>Bağlantı sınırı: trafo doluluğu yüksek ya da kurulu güç boş gücü aşıyor. Güç artırımı ya da yeni üretici için trafo kapasite çalışması gerekir.</span>
                </p>
              ) : (
                <p className="flex items-start gap-2 rounded-lg bg-success-wash p-3 text-small text-success sm:col-span-2 lg:col-span-4">
                  <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0" />
                  <span>Trafo kapasitesi yeterli.</span>
                </p>
              )}
            </div>
          </Panel>
        ) : null}

        <ChartCard id="ur-aylik" className={CARD} label="Aylık Çekiş ve Veriş" value={`${fmtKwh(totalExp)} verildi`} change={null} changeLabel="son 12 ay">
          <ComboChart
            title="Aylık çekiş (sütun) ve veriş oranı (çizgi)"
            labels={periods.map((r) => monthShort(r.period))}
            bars={{ label: "Çekiş (1.8.0)", values: periods.map((r) => r.consumed), series: 1, unit: "kWh", format: { maximumFractionDigits: 0 } }}
            line={{ label: "Veriş / çekiş", values: periods.map((r) => r.ratio), series: 5, format: { style: "percent", maximumFractionDigits: 0 } }}
          />
        </ChartCard>

        <Panel title="Çift Yönlü Okuma" note="1.8.0 şebekeden çekilen, 2.8.0 şebekeye verilen enerji. Endeksler kümülatif (ÖRNEK taban), dönem değerleri okumadan.">
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Çift yönlü okuma tablosu">
            <table className="edas-mono w-full min-w-[40rem] text-small">
              <caption className="sr-only">Dönemlere göre çekiş, veriş ve kümülatif endeks</caption>
              <thead>
                <tr className="text-muted">
                  <th scope="col" className="px-5 py-2.5 text-left font-medium">Dönem</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">1.8.0 Endeks</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">2.8.0 Endeks</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Çekiş</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Veriş</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {[...indexes].reverse().map((r) => (
                  <tr key={r.period} className="border-t border-line-soft">
                    <th scope="row" className="px-5 py-2 text-left font-medium text-strong">{periodLabel(r.period)}</th>
                    <td className="px-3 py-2 text-right text-body">{num.format(r.imp)}</td>
                    <td className="px-3 py-2 text-right text-body">{num.format(r.exp)}</td>
                    <td className="px-3 py-2 text-right">{num.format(r.consumed)}</td>
                    <td className="px-3 py-2 text-right text-success">{num.format(r.exported)}</td>
                    <td className={`px-5 py-2 text-right ${r.consumed - r.exported <= 0 ? "text-success" : "text-strong"}`}>{num.format(r.consumed - r.exported)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Düzenleyici Bildirim" note="Lisanssız üretim bilgileri aylık bildirim dosyasına dahil edilir.">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
            <p className="text-small text-body">
              {p.status === "devrede" ? `${periodLabel(CURRENT_PERIOD)} dönemi veriş verisi bildirim dosyasında hazır.` : "Devreye alınınca bildirim dosyasına eklenir."}
            </p>
            <Button variant="secondary" size="sm" onClick={() => go("reports", { tab: "epdk" })}>Bildirimlere Git</Button>
          </div>
        </Panel>
      </PageBody>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Dönem Mahsubu"
        description={`${c.name} · devreden alacak ${num.format(p.creditKwh)} kWh`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Vazgeç</Button>
            <Button
              variant="primary"
              onClick={() => {
                const r = settleToInvoice(p, parsed);
                if (!r.ok) return setError(r.error);
                notify({
                  title: `${num.format(parsed)} kWh mahsup edildi`,
                  body: r.invoiceId ? `${tl(r.applied)} ${r.invoiceId} faturasına işlendi${r.remainder ? `; ${tl(r.remainder)} açık alacak kaldı` : ""}.` : `Açık fatura yok: ${tl(r.remainder)} açık alacak olarak kaydedildi.`,
                  tone: "success",
                });
                setOpen(false);
              }}
            >
              Mahsup Et
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Input label="Mahsup edilecek enerji" inputMode="decimal" suffix="kWh" value={kwh} onChange={(e) => { setKwh(e.target.value); setError(""); }} error={error || undefined} />
          <dl className="grid grid-cols-2 gap-3 rounded-lg bg-surface p-3 text-small">
            <div><dt className="text-muted">TL karşılığı</dt><dd className="edas-mono mt-0.5 font-semibold text-strong">{tl(creditValue(p, Number.isFinite(parsed) ? Math.max(0, parsed) : 0))}</dd></div>
            <div><dt className="text-muted">Yansıyacağı fatura</dt><dd className="edas-mono mt-0.5 text-body">{target ? `${target.id} (kalan ${tl(target.total - target.paid)})` : "Açık fatura yok"}</dd></div>
          </dl>
          <p className="text-small text-muted">Birim bedel tedarikçinin T1 enerji fiyatıdır (ÖRNEK). Fatura bakiyesini aşan kısım avans alacağı olarak kalır; İtirazlar ve Mahsup sayfasında görünür.</p>
        </div>
      </Dialog>
    </>
  );
}
