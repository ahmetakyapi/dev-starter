"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Boxes, ClipboardCheck, Download, PackageCheck, PackageMinus, Search, ShieldAlert, Undo2, Wrench } from "lucide-react";
import type { ActiveFilter } from "@/components/ui/active-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import type { FilterGroup } from "@/components/ui/filter-sheet";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-field";
import { RadioGroup } from "@/components/ui/radio-group";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { matchesTr } from "@/components/ui/search-field";
import { ScheduleList, type ScheduleItem } from "@/components/ui/schedule-list";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SelectionAction, SelectionBar } from "@/components/ui/selection-bar";
import { audit } from "./_audit";
import { TODAY, TODAY_KEY, dayLabel, fullDate, parseDay } from "./_data";
import { DEPOTS, STOCK_STATUS_LABEL, type StockMeter, type StockStatus } from "./_data-yeni";
import { countDiff, countReports, stockListUi, useCountReports } from "./_data-stok";
import { downloadCsv } from "./_data-sayac";
import { findCustomer } from "./_data-musteri";
import { useDerived } from "./_core";
import { useCan } from "./_permissions";
import { inspectionOverdue, stockCounts } from "./_selectors";
import { allocateStock, receiveStock, returnFromInspection, sendToInspection, useApplications, useStock } from "./_store";
import { FilterBar, Metric, fmtNum, useListKeys } from "./_kit";
import { MetricStrip, PageBody, PageHead, Panel, href, useApp, type PageProps } from "./_ui";
import { useRef } from "react";

/**
 * Sayaç Stok: depo envanteri ve sayacın yaşam döngüsü (stokta → tahsisli →
 * sökülmüş → muayenede → stokta/hurda). Her işlem tek depoya (`_store.ts`)
 * yazılır: tahsis edilen sayaç stoktan düşer, Sayaçlar sayfasındaki değişim
 * iş emri bu havuzdan seçer, söküm tamamlanınca sayaç buraya "sökülmüş"
 * olarak döner. Muayene süresi örnek bir parametredir (`INSPECTION_YEARS`).
 */

const STATUS_TONE: Record<StockStatus, "success" | "primary" | "warning" | "neutral" | "danger"> = {
  stokta: "success",
  tahsisli: "primary",
  sokulmus: "warning",
  muayenede: "warning",
  hurda: "neutral",
};

const VIEWS = [
  { id: "hepsi", label: "Hepsi", test: (_s: StockMeter) => true },
  { id: "stokta", label: "Stokta", test: (s: StockMeter) => s.status === "stokta" },
  { id: "gerekli", label: "Muayene Gereken", test: (s: StockMeter) => (s.status === "stokta" || s.status === "tahsisli") && s.inspectionDue < TODAY_KEY },
  { id: "sokulmus", label: "Sökülmüş (Kabul Bekler)", test: (s: StockMeter) => s.status === "sokulmus" },
  { id: "muayenede", label: "Muayenede", test: (s: StockMeter) => s.status === "muayenede" },
] as const;

const MODELS = ["Akıllı Sayaç AS-310", "Akıllı Sayaç AS-330 (3 faz)", "Elektronik Sayaç ES-120", "OG Sayaç OS-500"];
const FILTER_GROUPS: readonly FilterGroup[] = [
  { id: "status", label: "Durum", multiple: true, options: (Object.keys(STOCK_STATUS_LABEL) as StockStatus[]).map((s) => ({ value: s, label: STOCK_STATUS_LABEL[s] })) },
  { id: "depot", label: "Depo", multiple: true, options: DEPOTS.map((d) => ({ value: d, label: d })) },
  { id: "model", label: "Sayaç Tipi", multiple: true, options: MODELS.map((x) => ({ value: x, label: x })) },
  { id: "comm", label: "İletişim", multiple: true, options: [{ value: "ami", label: "AMI" }, { value: "gsm", label: "GSM / GPRS" }, { value: "elle", label: "Elle Okuma" }] },
];

const Mono = ({ children }: { children: ReactNode }) => <span className="kz-mono whitespace-nowrap">{children}</span>;

/** Liste sırası: ilgi bekleyenler önce (sökülmüş, muayenesi geçen), hurda en sonda. */
const stockRank = (s: StockMeter) => (s.status === "sokulmus" ? 0 : (s.status === "stokta" || s.status === "tahsisli") && s.inspectionDue < TODAY_KEY ? 1 : s.status === "muayenede" ? 2 : s.status === "stokta" ? 3 : s.status === "tahsisli" ? 4 : 9);
const sel = (f: Readonly<Record<string, readonly string[]>>, id: string) => f[id] ?? [];

export function StokPage({ go }: PageProps) {
  const { notify } = useApp();
  const canManage = useCan("sayac");
  const stock = useStock();
  const ui = stockListUi.use();
  const reports = useCountReports();
  const counts = useDerived(stockCounts);
  const overdue = useDerived(inspectionOverdue);
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [allocate, setAllocate] = useState<StockMeter | null>(null);
  const [receive, setReceive] = useState<StockMeter | null>(null);
  const [counting, setCounting] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  useListKeys(list);
  const [shown, setShown] = useState(25);

  const view = VIEWS.find((v) => v.id === ui.view) ?? VIEWS[0];
  const set = (patch: Partial<typeof ui>) => {
    stockListUi.set((s) => ({ ...s, ...patch }));
    setShown(25);
  };

  const rows = useMemo(() => {
    const f = ui.filters;
    return stock
      .filter((s) => {
        if (!view.test(s)) return false;
        if (sel(f, "status").length && !sel(f, "status").includes(s.status)) return false;
        if (sel(f, "depot").length && !sel(f, "depot").includes(s.depot)) return false;
        if (sel(f, "model").length && !sel(f, "model").includes(s.model)) return false;
        if (sel(f, "comm").length && !sel(f, "comm").includes(s.comm)) return false;
        if (ui.query.trim() && !matchesTr(`${s.serial} ${s.model} ${s.depot} ${s.seal ?? ""} ${s.allocatedTo ?? ""}`, ui.query, { fold: true })) return false;
        return true;
      })
      .sort((a, b) => stockRank(a) - stockRank(b) || a.inspectionDue.localeCompare(b.inspectionDue) || a.serial.localeCompare(b.serial));
  }, [stock, ui.filters, ui.query, view]);
  const visible = rows.slice(0, shown);

  const optionLabel = (g: string, v: string) => FILTER_GROUPS.find((x) => x.id === g)?.options.find((o) => o.value === v)?.label ?? v;
  const active: ActiveFilter[] = [
    ...(ui.query.trim() ? [{ id: "query", label: "Arama", value: `“${ui.query.trim()}”`, valueText: ui.query.trim() }] : []),
    ...FILTER_GROUPS.flatMap((g) => sel(ui.filters, g.id).map((v) => ({ id: `${g.id}::${v}`, label: g.label, value: String(optionLabel(g.id, v)), valueText: String(optionLabel(g.id, v)) }))),
  ];
  const removeFilter = (id: string) => {
    if (id === "query") return set({ query: "" });
    const [g, v] = id.split("::");
    set({ filters: { ...ui.filters, [g]: sel(ui.filters, g).filter((x) => x !== v) } });
  };

  const pickedRows = stock.filter((s) => picked.has(s.id));
  const allVisible = visible.length > 0 && visible.every((s) => picked.has(s.id));
  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (allVisible) visible.forEach((s) => next.delete(s.id));
      else visible.forEach((s) => next.add(s.id));
      return next;
    });

  const dueText = (s: StockMeter) => {
    const late = s.inspectionDue < TODAY_KEY && (s.status === "stokta" || s.status === "tahsisli");
    return <span className={late ? "font-semibold text-warning" : "text-body"}>{`${dayLabel(s.inspectionDue)} ${parseDay(s.inspectionDue).getFullYear()}`}{late ? " · süresi geçti" : ""}</span>;
  };
  const ownerOf = (s: StockMeter) => {
    if (!s.allocatedTo) return null;
    const c = s.allocatedTo.startsWith("C-") ? findCustomer(s.allocatedTo) : null;
    return c ? (
      <a href={href("customers", { id: c.id })} className="text-body hover:text-strong hover:underline">
        {c.name}
      </a>
    ) : (
      <span className="text-body">{s.allocatedTo}</span>
    );
  };

  const rowActions = (s: StockMeter) => (
    <span className="flex flex-wrap gap-1.5">
      {s.status === "stokta" ? (
        <Button variant="secondary" size="sm" disabled={!canManage} onClick={() => setAllocate(s)}>
          <PackageCheck aria-hidden /> Tahsis Et
        </Button>
      ) : null}
      {s.status === "sokulmus" ? (
        <Button variant="secondary" size="sm" disabled={!canManage} onClick={() => setReceive(s)}>
          <PackageMinus aria-hidden /> Depoya Kabul
        </Button>
      ) : null}
      {s.status === "muayenede" ? (
        <Button
          variant="secondary"
          size="sm"
          disabled={!canManage}
          onClick={() => {
            returnFromInspection([s.id], true);
            notify({ title: "Muayeneden Döndü", body: `${s.serial} stoğa alındı.`, tone: "success", undo: () => sendToInspection([s.id]) });
          }}
        >
          <Undo2 aria-hidden /> Stoğa Al
        </Button>
      ) : null}
    </span>
  );

  const columns: readonly Column<StockMeter>[] = [
    { key: "select", header: <Checkbox aria-label="Görünen Bütün Sayaçları Seç" checked={allVisible} onChange={toggleAll} />, width: "3rem", render: (s) => <Checkbox aria-label={`${s.serial} sayacını seç`} checked={picked.has(s.id)} onChange={() => toggle(s.id)} /> },
    { key: "serial", width: "9.5rem", header: "Seri No", render: (s) => <span data-row tabIndex={0} className="font-semibold text-strong outline-none focus-visible:ring-2 focus-visible:ring-line-focus"><Mono>{s.serial}</Mono></span> },
    { key: "model", width: "13rem", header: "Tip", render: (s) => <span className="grid"><span>{s.model}</span><span className="text-small text-muted">{s.multiZone ? "Çok zamanlı" : "Tek zamanlı"} · {s.comm === "ami" ? "AMI" : s.comm === "gsm" ? "GSM" : "Elle"}</span></span> },
    { key: "depot", width: "7rem", header: "Depo", render: (s) => s.depot },
    { key: "status", width: "8.5rem", header: "Durum", render: (s) => <Badge tone={STATUS_TONE[s.status]} dot>{STOCK_STATUS_LABEL[s.status]}</Badge> },
    { key: "due", width: "8rem", header: "Muayene", render: dueText },
    { key: "seal", width: "9rem", header: "Mühür / Tahsis", render: (s) => <span className="grid"><span>{s.seal ? <Mono>{s.seal}</Mono> : "—"}</span><span className="text-small">{ownerOf(s)}</span></span> },
    { key: "actions", width: "4.5rem", header: <span className="sr-only">İşlemler</span>, render: rowActions },
  ];

  const items: RecordItem[] = visible.map((s) => ({
    id: s.id,
    title: <Mono>{s.serial}</Mono>,
    subtitle: `${s.model} · ${s.depot}`,
    value: <Badge tone={STATUS_TONE[s.status]} dot>{STOCK_STATUS_LABEL[s.status]}</Badge>,
    meta: `Muayene: ${dayLabel(s.inspectionDue)} ${parseDay(s.inspectionDue).getFullYear()}${s.seal ? ` · ${s.seal}` : ""}`,
    actions: <Checkbox aria-label={`${s.serial} sayacını seç`} checked={picked.has(s.id)} onChange={() => toggle(s.id)} />,
  }));

  // Muayene takvimi: gecikenler ve en yakın muayeneler (ufuk yok: stoğun yarısı yıllar sonra).
  const calendar: ScheduleItem[] = useMemo(() => {
    return stock
      .filter((s) => s.status !== "hurda" && s.status !== "muayenede")
      .sort((a, b) => a.inspectionDue.localeCompare(b.inspectionDue))
      .slice(0, 6)
      .map((s): ScheduleItem => {
        const late = s.inspectionDue < TODAY_KEY;
        return { id: s.id, at: `${s.inspectionDue}T09:00`, time: late ? "Geçti" : "09:00", day: dayLabel(s.inspectionDue), title: <Mono>{s.serial}</Mono>, detail: `${s.model} · ${s.depot}${late ? " · muayene gerekli" : ` · ${parseDay(s.inspectionDue).getFullYear()}`}`, color: late ? 4 : 2 };
      });
  }, [stock]);

  const exportRows = (list: readonly StockMeter[], name: string) => {
    downloadCsv(name, [
      ["Seri no", "Tip", "Depo", "Durum", "Muayene", "Mühür", "Tahsis"],
      ...list.map((s) => [s.serial, s.model, s.depot, STOCK_STATUS_LABEL[s.status], s.inspectionDue, s.seal ?? "", s.allocatedTo ?? ""]),
    ]);
    notify({ title: "CSV İndirildi", body: `${fmtNum(list.length)} sayaç, ${name}`, tone: "success" });
  };

  const sendable = pickedRows.filter((s) => s.status === "stokta" || s.status === "tahsisli");
  const inInspection = pickedRows.filter((s) => s.status === "muayenede");

  return (
    <>
      <PageHead
        title="Sayaç Stok"
        description="Depo envanteri, tahsis, muayene ve söküm: sayaçların yaşam döngüsü. Tahsis edilen sayaç stoktan düşer, söküm bitince buraya döner."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => exportRows(rows, "sayac-stok-2026-11.csv")}>
              <Download aria-hidden /> CSV İndir
            </Button>
            <Button variant="primary" size="sm" disabled={!canManage} onClick={() => setCounting(true)}>
              <ClipboardCheck aria-hidden /> Stok Sayımı
            </Button>
          </>
        }
      />
      <PageBody>
        <MetricStrip>
          <Metric icon={<Boxes />} label="Stokta" value={fmtNum(counts.stokta)} foot="Tahsise hazır" to={{ page: "stock", params: { tab: "stokta" } }} />
          <Metric icon={<PackageCheck />} label="Tahsisli" value={fmtNum(counts.tahsisli)} foot="Montaj ya da abone" />
          <Metric icon={<Wrench />} label="Muayenede" value={fmtNum(counts.muayenede)} foot="Laboratuvarda" to={{ page: "stock", params: { tab: "muayenede" } }} />
          <Metric icon={<PackageMinus />} label="Sökülmüş" value={fmtNum(counts.sokulmus)} foot="Kabul bekler" to={{ page: "stock", params: { tab: "sokulmus" } }} />
          <Metric icon={<ShieldAlert />} label="Muayenesi Geçen" value={fmtNum(overdue.length)} foot="Stokta ya da sahada" to={{ page: "stock", params: { tab: "gerekli" } }} />
          <Metric icon={<Search />} label="Hurda" value={fmtNum(counts.hurda)} foot="Kayıttan düşecek" />
        </MetricStrip>

        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <Panel title="Sayaç Envanteri" note={`${fmtNum(rows.length)} sayaç · ilgi bekleyenler üstte, hurda sonda`} id="stok-liste">
            <div ref={list} className="grid gap-3 border-b border-line-soft p-3 sm:p-4">
              <FilterBar
                search={{ value: ui.query, onChange: (v) => set({ query: v }), placeholder: "Seri no, tip, depo, mühür", label: "Stokta Ara" }}
                filters={active}
                onRemoveFilter={removeFilter}
                onClearFilters={() => set({ filters: {}, query: "" })}
                summary={`${fmtNum(rows.length)} sayaç`}
                views={{
                  items: VIEWS.map((v) => ({ id: v.id, label: v.label, count: stock.filter(v.test).length, builtin: true })),
                  value: ui.view,
                  onChange: (id) => set({ view: id }),
                }}
                drawer={{ groups: FILTER_GROUPS, value: ui.filters, onChange: (v) => set({ filters: v }), resultCount: rows.length, resultLabel: (n) => `${n} Sayacı Göster` }}
              />
            </div>
            {rows.length === 0 ? (
              <div className="grid justify-items-center gap-3 p-8 text-center">
                <p className="text-read font-semibold text-strong">Bu görünümde sayaç yok.</p>
                <Button variant="secondary" size="sm" onClick={() => set({ view: "hepsi", filters: {}, query: "" })}>
                  Hepsini Göster
                </Button>
              </div>
            ) : (
              <>
                <div className="max-md:hidden">
                  <DataTable<StockMeter> caption="Sayaç stoku" columns={columns} rows={visible} rowKey={(s) => s.id} density="comfortable" on="surface" stickyFirst={false} minWidth="58rem" />
                </div>
                <div className="px-3 pb-3 md:hidden">
                  <RecordList label="Sayaç Stoku" items={items} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-4 py-3">
                  <p className="text-small text-muted" aria-live="polite">{fmtNum(visible.length)} / {fmtNum(rows.length)} sayaç gösteriliyor</p>
                  {rows.length > shown ? (
                    <Button variant="secondary" size="sm" onClick={() => setShown((n) => n + 25)}>
                      Daha Fazla Göster
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </Panel>

          <div className="grid min-w-0 content-start gap-5">
            <Panel title="Muayene Takvimi" note="Geciken ve en yakın 6 muayene" id="muayene-takvim">
              {calendar.length ? <div className="px-4 py-2"><ScheduleList items={calendar} label="Yaklaşan Muayeneler" /></div> : <p className="p-5 text-base text-muted">Yaklaşan muayene yok.</p>}
              <p className="border-t border-line-soft px-4 py-3 text-small text-muted">Muayene süreleri örnek parametredir; gerçek süre sayaç tipine ve mevzuata göre değişir.</p>
            </Panel>
            <Panel title="Son Sayımlar" note={reports.length ? undefined : "Henüz sayım yapılmadı"} id="sayimlar">
              {reports.length === 0 ? (
                <p className="p-5 text-base text-muted">“Stok sayımı” ile depo başına fiziksel adedi girin; fark raporu burada kalır.</p>
              ) : (
                <ul className="divide-y divide-line-soft">
                  {reports.slice(0, 4).map((r) => {
                    const d = countDiff(r);
                    return (
                      <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-base">
                        <span className="min-w-0">
                          <span className="block font-medium text-strong">{r.at}</span>
                          <span className="block text-small text-muted">{r.by} · {r.lines.length} depo</span>
                        </span>
                        <Badge tone={d === 0 ? "success" : "warning"} dot>{d === 0 ? "Fark yok" : `${d > 0 ? "+" : "−"}${Math.abs(d)} sayaç`}</Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      </PageBody>

      <SelectionBar count={picked.size} noun="sayaç" onClear={() => setPicked(new Set())}>
        <SelectionAction
          icon={<Wrench />}
          onClick={() => {
            if (!canManage || sendable.length === 0) {
              notify({ title: "Muayeneye Gönderilemedi", body: "Seçilenler arasında stokta ya da tahsisli sayaç yok.", tone: "info" });
              return;
            }
            const ids = sendable.map((s) => s.id);
            sendToInspection(ids);
            notify({ title: "Muayeneye Gönderildi", body: `${fmtNum(ids.length)} sayaç.`, tone: "success", undo: () => returnFromInspection(ids, true) });
            setPicked(new Set());
          }}
        >
          Muayeneye Gönder
        </SelectionAction>
        <SelectionAction
          icon={<Undo2 />}
          onClick={() => {
            if (!canManage || inInspection.length === 0) {
              notify({ title: "Geri Alınamadı", body: "Seçilenler arasında muayenede sayaç yok.", tone: "info" });
              return;
            }
            returnFromInspection(inInspection.map((s) => s.id), true);
            notify({ title: "Muayeneden Geri Alındı", body: `${fmtNum(inInspection.length)} sayaç stoğa girdi.`, tone: "success" });
            setPicked(new Set());
          }}
        >
          Muayeneden Geri Al
        </SelectionAction>
        <SelectionAction
          icon={<Download />}
          onClick={() => {
            exportRows(pickedRows, "secili-stok.csv");
            setPicked(new Set());
          }}
        >
          CSV İndir
        </SelectionAction>
      </SelectionBar>

      <AllocateDialog meter={allocate} onClose={() => setAllocate(null)} go={go} />
      <ReceiveDialog meter={receive} onClose={() => setReceive(null)} />
      <CountDialog open={counting} onClose={() => setCounting(false)} stock={stock} />
    </>
  );
}

/* --- Tahsis ---------------------------------------------------------------- */

function AllocateDialog({ meter, onClose, go }: { meter: StockMeter | null; onClose: () => void; go: PageProps["go"] }) {
  const { notify } = useApp();
  const applications = useApplications();
  const [mode, setMode] = useState<"basvuru" | "abone">("basvuru");
  const [appId, setAppId] = useState("");
  const [custId, setCustId] = useState("");
  const [touched, setTouched] = useState(false);
  const montaj = applications.filter((a) => a.stage === "montaj" || a.stage === "bedel");
  const customer = custId.trim() ? findCustomer(custId.trim().toUpperCase()) : undefined;
  const error = touched ? (mode === "basvuru" ? (appId ? undefined : "Montaj bekleyen bir başvuru seçin.") : customer ? undefined : "Geçerli bir abone kimliği girin (örnek: C-10001).") : undefined;

  const done = () => {
    setTouched(false);
    setAppId("");
    setCustId("");
    onClose();
  };
  const submit = () => {
    setTouched(true);
    if (!meter) return;
    if (mode === "basvuru" ? !appId : !customer) return;
    const ok = allocateStock(meter.id, mode === "basvuru" ? { applicationId: appId } : { customerId: customer!.id });
    if (!ok) {
      notify({ title: "Tahsis Edilemedi", body: "Sayaç artık stokta değil.", tone: "info" });
      return done();
    }
    audit("Stoktan tahsis (arayüz)", meter.serial, "Stokta", mode === "basvuru" ? appId : customer!.id);
    notify({ title: "Sayaç Tahsis Edildi", body: `${meter.serial} → ${mode === "basvuru" ? appId : customer!.name}. Stoktan düştü, mühür verildi.`, tone: "success" });
    done();
    if (mode === "basvuru") go("applications", { id: appId });
  };

  return (
    <Dialog
      open={!!meter}
      onOpenChange={(o) => !o && done()}
      title="Sayaç Tahsisi"
      description={meter ? `${meter.serial} · ${meter.model} · ${meter.depot}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={done}>Vazgeç</Button>
          <Button variant="primary" onClick={submit}>Tahsis Et</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <SegmentedControl aria-label="Tahsis Hedefi" value={mode} onValueChange={(v) => setMode(v as "basvuru" | "abone")} options={[{ value: "basvuru", label: "Başvuru Montajı" }, { value: "abone", label: "Mevcut Abone (Değişim)" }]} />
        {mode === "basvuru" ? (
          <RadioGroup name="alloc-app" legend="Başvuru" value={appId} onChange={setAppId} className="max-h-48 overflow-y-auto rounded-lg bg-surface p-3" options={montaj.length ? montaj.map((a) => ({ value: a.id, label: a.id, hint: `${a.applicant} · ${a.powerKw} kW ${a.voltage}` })) : [{ value: "", label: "Montaj Bekleyen Başvuru Yok", disabled: true }]} />
        ) : (
          <Input label="Abone Kimliği" value={custId} onChange={(e) => setCustId(e.target.value)} placeholder="C-10001" hint={customer ? `${customer.name} · ${customer.district}` : "Sayaç değişimi için abone kimliği"} />
        )}
        {error ? <p role="alert" className="text-small text-danger">{error}</p> : null}
        <p className="text-small text-muted">Tahsis anında sayaç stoktan düşer ve mühür numarası atanır. Başvuru seçilirse başvurunun montaj aşamasına sayaç bağlanır.</p>
      </div>
    </Dialog>
  );
}

/* --- Sökülen sayaç kabulü -------------------------------------------------- */

function ReceiveDialog({ meter, onClose }: { meter: StockMeter | null; onClose: () => void }) {
  const { notify } = useApp();
  const [index, setIndex] = useState<number | null>(0);
  const [seal, setSeal] = useState("");
  const [condition, setCondition] = useState("iyi");
  const [touched, setTouched] = useState(false);
  const error = touched && !seal.trim() ? "Sökülürken mühür durumunu yazın (örnek: sağlam, kopuk)." : undefined;
  const done = () => {
    setTouched(false);
    setSeal("");
    onClose();
  };
  return (
    <Dialog
      open={!!meter}
      onOpenChange={(o) => !o && done()}
      title="Sökülen Sayacı Depoya Kabul Et"
      description={meter ? `${meter.serial} · ${meter.model}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={done}>Vazgeç</Button>
          <Button
            variant="primary"
            onClick={() => {
              setTouched(true);
              if (!meter || !seal.trim()) return;
              receiveStock(meter.id);
              audit("Sökülen sayacı kabul etti", meter.serial, undefined, `Son endeks ${index ?? 0} kWh · mühür: ${seal.trim()} · ${condition === "iyi" ? "çalışır" : "hasarlı"}`);
              if (condition === "hasarli") sendToInspection([meter.id]);
              notify({ title: "Depoya Kabul Edildi", body: `${meter.serial}: ${condition === "iyi" ? "stoğa girdi" : "hasarlı olduğu için muayeneye gönderildi"}.`, tone: "success" });
              done();
            }}
          >
            Kabul Et
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Son Endeks T1 (kWh)" value={index} onValueChange={setIndex} min={0} />
        <Input label="Mühür Durumu" value={seal} onChange={(e) => setSeal(e.target.value)} placeholder="Sağlam" />
        {error ? <p role="alert" className="text-small text-danger sm:col-span-2">{error}</p> : null}
        <div className="sm:col-span-2">
          <RadioGroup name="recv-cond" legend="Sayaç Durumu" value={condition} onChange={setCondition} options={[{ value: "iyi", label: "Çalışır Durumda: Stoğa Gir" }, { value: "hasarli", label: "Hasarlı ya da Şüpheli: Muayeneye Gönder" }]} />
        </div>
      </div>
    </Dialog>
  );
}

/* --- Stok sayımı ---------------------------------------------------------- */

function CountDialog({ open, onClose, stock }: { open: boolean; onClose: () => void; stock: readonly StockMeter[] }) {
  const { notify } = useApp();
  // Depoda bulunması gereken: stokta + muayeneye gitmemiş sökülmüş sayaçlar.
  const system = useMemo(() => DEPOTS.map((d) => ({ depot: d, system: stock.filter((s) => s.depot === d && (s.status === "stokta" || s.status === "sokulmus")).length })), [stock]);
  const [counted, setCounted] = useState<Record<string, number | null>>({});
  const lines = system.map((l) => ({ ...l, counted: counted[l.depot] ?? l.system }));
  const diff = lines.reduce((s, l) => s + (l.counted - l.system), 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Stok Sayımı"
      description="Depo başına fiziksel adedi girin; boş bırakılan depo sistem adediyle aynı sayılır. Fark raporu kaydedilir ve CSV olarak iner."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button
            variant="primary"
            onClick={() => {
              const id = `SY-${String(countReports.get().length + 1).padStart(3, "0")}`;
              countReports.set((l) => [{ id, at: "21 Kas, 10:40", by: "Ayşe Yıldırım", lines }, ...l]);
              audit("Stok sayımı kaydetti", id, `${lines.reduce((s, l) => s + l.system, 0)} sayaç`, `${diff === 0 ? "fark yok" : `${diff > 0 ? "+" : ""}${diff} fark`}`);
              downloadCsv(`stok-sayim-${id}.csv`, [["Depo", "Sistem", "Sayılan", "Fark"], ...lines.map((l) => [l.depot, l.system, l.counted, l.counted - l.system])]);
              notify({ title: "Sayım Kaydedildi", body: diff === 0 ? "Fark yok." : `${Math.abs(diff)} sayaç ${diff > 0 ? "fazla" : "eksik"}; fark raporu indirildi.`, tone: diff === 0 ? "success" : "info" });
              setCounted({});
              onClose();
            }}
          >
            Sayımı Kaydet
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        {lines.map((l) => {
          const d = l.counted - l.system;
          return (
            <div key={l.depot} className="grid items-end gap-3 sm:grid-cols-[1fr_8rem_8rem]">
              <div>
                <p className="text-base font-medium text-strong">{l.depot}</p>
                <p className="text-small text-muted">Sistem: {fmtNum(l.system)} sayaç</p>
              </div>
              <NumberField label="Sayılan" value={counted[l.depot] ?? l.system} onValueChange={(v) => setCounted((c) => ({ ...c, [l.depot]: v }))} min={0} />
              <p className={`pb-2 text-base font-semibold tabular-nums ${d === 0 ? "text-muted" : "text-warning"}`}>{d === 0 ? "Fark yok" : `${d > 0 ? "+" : "−"}${Math.abs(d)} fark`}</p>
            </div>
          );
        })}
        <p className="border-t border-line-soft pt-3 text-small text-muted">Toplam fark: <strong className="text-strong">{diff === 0 ? "yok" : `${diff > 0 ? "+" : "−"}${Math.abs(diff)} sayaç`}</strong> · {fullDate.format(TODAY)}</p>
      </div>
    </Dialog>
  );
}
