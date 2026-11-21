"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, FileSignature, Gavel, Search, ShieldAlert, Siren, Wallet, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Combobox, type ComboboxItem } from "@/components/ui/combobox";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Input } from "@/components/ui/input";
import { KanbanBoard, type KanbanCard, type KanbanColumn } from "@/components/ui/kanban-board";
import { LineChart } from "@/components/ui/line-chart";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { RegionMap, type MapRegion } from "@/components/ui/region-map";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { SignaturePad } from "@/components/ui/signature-pad";
import { Stepper } from "@/components/ui/stepper";
import { Textarea } from "@/components/ui/textarea";
import { Timeline, type TimelineEvent } from "@/components/ui/timeline";
import { audit } from "./_audit";
import { PERIODS_12, FLAG_LABEL, METERS, TODAY, TODAY_KEY, daysBetween, parseDay, shortDate, dateTime, meterById, regionLoss, region, transformer } from "./_data";
import { meterEvents } from "./_data-sayac";
import { LEAK_STAGES, type LeakCase, type LeakStage } from "./_data-yeni";
import { LEAK_PARAMS, consumption12, customerOf, leakBreakdown, suspectMeters } from "./_data-ops-sayfa";
import { MAP_SHAPES, MAP_VIEWBOX } from "./_harita";
import { BarTarget, EmptyStateX, PageHero, RowAnchor, RowLink, fmtDec, fmtKwh, fmtNum, fmtPct, fmtTl, fmtTlCompact, useListKeys } from "./_kit";
import { useCan } from "./_permissions";
import { flaggedReadings } from "./_selectors";
import { advanceLeak, createDispute, createLeak, getDisputes, setLeakAmount, useLeaks, useWorkOrders } from "./_store";
import { PageBody, PageHead, Panel, href, useApp, type PageProps } from "./_ui";
import { useDerived } from "./_core";

/* ------------------------------------------------------------------------ */
/* Ortak                                                                     */
/* ------------------------------------------------------------------------ */

const VIEWS = ["pano", "liste", "supheli", "kayip"] as const;
type ViewId = (typeof VIEWS)[number];
const STAGE_IDS = LEAK_STAGES.map((s) => s.id as string);
const stageIndex = (l: LeakCase) => STAGE_IDS.indexOf(l.stage);
const stageLabel = (s: LeakStage) => LEAK_STAGES.find((x) => x.id === s)?.label ?? s;
const STAGE_TONE: Record<LeakStage, "neutral" | "warning" | "primary" | "danger" | "success"> = { supheli: "warning", kontrol: "primary", tutanak: "primary", bedel: "danger", itiraz: "warning", kapandi: "success" };
const SOURCE_LABEL = { okuma: "Okuma bayrağı", ihbar: "İhbar", denetim: "Denetim" } as const;
const FLAGS_FOR_LEAK = ["manyetik", "kapak-acma", "dusuk-tuketim", "faz-kaybi"] as const;

function StageBadge({ stage }: { stage: LeakStage }) {
  return <Badge tone={STAGE_TONE[stage]} dot>{stageLabel(stage)}</Badge>;
}

/* ------------------------------------------------------------------------ */
/* Sayfa                                                                     */
/* ------------------------------------------------------------------------ */

export function KacakPage({ params, go }: PageProps) {
  const { notify } = useApp();
  const can = useCan("sayac") || useCan("okuma");
  const leaks = useLeaks();
  const view: ViewId = (VIEWS as readonly string[]).includes(params.tab ?? "") ? (params.tab as ViewId) : "pano";
  const [newOpen, setNewOpen] = useState(!!params.new);
  const [nonce, setNonce] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  useListKeys(listRef);

  const detail = params.id ? leaks.find((l) => l.id === params.id) : undefined;
  const open = leaks.filter((l) => l.stage !== "kapandi");
  const billing = leaks.filter((l) => l.stage === "bedel" || l.stage === "itiraz");
  const closed = leaks.filter((l) => l.stage === "kapandi");
  const suspects = useDerived(() => suspectMeters(), [leaks]);
  const known = new Set(leaks.map((l) => l.meterId));

  const startLeak = (meterId: string, customerId: string, flag: string, source: LeakCase["source"] = "okuma") => {
    const l = createLeak(meterId, customerId, flag, source);
    notify({ title: "Kaçak vakası açıldı", body: `${l.id} · ${customerOf(customerId).name}`, tone: "success" });
    go("leaks", { id: l.id });
  };

  if (detail) return <LeakDetail l={detail} go={go} can={can} />;

  const columns: KanbanColumn[] = LEAK_STAGES.map((s) => ({
    id: s.id,
    title: s.label,
    done: s.id === "kapandi",
    cards: leaks
      .filter((l) => l.stage === s.id)
      .map<KanbanCard>((l) => ({ id: l.id, title: `${l.id} · ${customerOf(l.customerId).name}`, tags: [{ label: l.flag.split(" (")[0].slice(0, 28), tone: STAGE_TONE[l.stage] === "danger" ? "chart-6" : "primary" }], assignee: { name: l.assignedTo } })),
  }));
  const signature = leaks.map((l) => `${l.id}:${l.stage}`).join("|");

  const onBoardChange = (cols: KanbanColumn[]) => {
    const target = new Map<string, string>();
    for (const c of cols) for (const card of c.cards) target.set(card.id, c.id);
    for (const l of leaks) {
      const to = target.get(l.id);
      if (!to || to === l.stage) continue;
      const next = STAGE_IDS.indexOf(to);
      if (!can) notify({ title: "Bu işlem için yetkin yok", tone: "info" });
      else if (next !== stageIndex(l) + 1) notify({ title: "Aşama atlanamaz", body: "Vaka sırayla ilerler: her aşamanın kendi kaydı vardır.", tone: "info" });
      else if (advanceLeak(l.id)) notify({ title: `${l.id}: ${stageLabel(to as LeakStage)} aşamasına geçti`, body: to === "kontrol" ? "Saha kontrol iş emri oluştu" : to === "tutanak" ? "Tutanak numarası verildi" : undefined, tone: "success" });
      break;
    }
    setNonce((n) => n + 1);
  };

  const columnsTable: Column<LeakCase>[] = [
    { key: "id", header: "Vaka", sortable: true, sortValue: (l) => l.id, render: (l) => <a href={href("leaks", { id: l.id })} className="edas-mono font-medium text-strong hover:underline">{l.id}</a> },
    { key: "c", header: "Müşteri", render: (l) => customerOf(l.customerId).name },
    { key: "f", header: "Bulgu", render: (l) => l.flag },
    { key: "s", header: "Aşama", sortable: true, sortValue: (l) => stageIndex(l), render: (l) => <StageBadge stage={l.stage} /> },
    { key: "k", header: "Tahmini kWh", numeric: true, sortable: true, sortValue: (l) => l.estimatedKwh, render: (l) => fmtNum(l.estimatedKwh) },
    { key: "a", header: "Bedel", numeric: true, sortable: true, sortValue: (l) => l.amount, render: (l) => fmtTl(l.amount, 0) },
  ];

  const prev = PERIODS_12[10];
  const loss = regionLoss(prev);
  const byTr = new Map<string, number>();
  for (const l of open) {
    const tr = meterById(l.meterId)?.transformerId;
    if (tr) byTr.set(tr, (byTr.get(tr) ?? 0) + 1);
  }
  const trRows = [...byTr.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, n]) => ({ id, label: `${transformer(id).name} · ${transformer(id).substationId}`, value: n }));
  const lossMap: MapRegion[] = MAP_SHAPES.map((s) => {
    const r = loss.find((x) => x.region.id === s.id)!;
    return { id: s.id, label: region(s.id).name, path: s.path, at: s.at, value: r.lossPct, tone: r.lossPct > r.region.lossTarget ? "danger" : undefined, note: `hedef ${fmtPct(r.region.lossTarget)}` };
  });

  const flagged = flaggedReadings().filter((r) => r.flags.some((f) => (FLAGS_FOR_LEAK as readonly string[]).includes(f)));

  const body: Record<ViewId, ReactNode> = {
    pano: (
      <Panel id="kacak-pano" title="Vaka Panosu" note="Vaka sırayla ilerler: şüphe, saha kontrolü, tutanak, bedel, itiraz, kapanış. Kartı sürükle ya da klavyeyle taşı; Enter ayrıntıyı açar.">
        <div className="p-3 sm:p-4">
          <KanbanBoard key={`${signature}-${nonce}`} label="Kaçak vakaları" defaultColumns={columns} today={TODAY_KEY} onChange={onBoardChange} onCardOpen={(c) => go("leaks", { id: c.id })} />
        </div>
      </Panel>
    ),
    liste: (
      <Panel id="kacak-liste" title="Bütün Vakalar" note={`${fmtNum(leaks.length)} vaka`}>
        <div className="max-md:hidden">
          <DataTable<LeakCase> caption="Kaçak vakaları" columns={columnsTable} rows={leaks} rowKey={(l) => l.id} density="comfortable" on="surface" stickyFirst={false} empty="Vaka yok" />
        </div>
        <div className="p-3 md:hidden">
          <RecordList label="Kaçak vakaları" items={leaks.map<RecordItem>((l) => ({ id: l.id, title: `${l.id} · ${customerOf(l.customerId).name}`, subtitle: l.flag, value: fmtTl(l.amount, 0), status: <StageBadge stage={l.stage} />, href: href("leaks", { id: l.id }), onSelect: () => go("leaks", { id: l.id }) }))} />
        </div>
      </Panel>
    ),
    supheli: (
      <div className="grid gap-5">
        <Panel id="kacak-skor" title="Şüpheli Sayaç Sıralaması" note="Skor: son üç dönemin bayrakları + müdahale durumu + tüketim düşüşü. Açık vakası olmayanlara vaka aç.">
          {suspects.length ? (
            <>
              <div className="max-md:hidden">
                <DataTable
                  caption="Şüpheli sayaçlar"
                  rows={suspects.slice(0, 20)}
                  rowKey={(r) => r.meterId}
                  density="comfortable"
                  on="surface"
                  stickyFirst={false}
                  columns={[
                    { key: "m", header: "Sayaç", render: (r) => <a href={href("meters", { id: r.meterId })} className="edas-mono font-medium text-strong hover:underline">{METERS.find((m) => m.id === r.meterId)?.serial ?? r.meterId}</a> },
                    { key: "c", header: "Müşteri", render: (r) => customerOf(r.customerId).name },
                    { key: "f", header: "Bayraklar", render: (r) => (r.flags.length ? r.flags.map((f) => FLAG_LABEL[f as keyof typeof FLAG_LABEL] ?? f).join(", ") : r.status === "mudahale" ? "Müdahale şüphesi" : "—") },
                    { key: "d", header: "Düşüş", numeric: true, sortable: true, sortValue: (r) => r.drop, render: (r) => (r.drop ? `%${r.drop}` : "—") },
                    { key: "s", header: "Skor", numeric: true, sortable: true, sortValue: (r) => r.score, render: (r) => <Badge tone={r.score >= 60 ? "danger" : r.score >= 40 ? "warning" : "neutral"} dot>{r.score}</Badge> },
                    { key: "a", header: "", render: (r) => (known.has(r.meterId) ? <Badge tone="neutral">Vakası var</Badge> : can ? <Button size="sm" variant="secondary" onClick={() => startLeak(r.meterId, r.customerId, r.flags.length ? FLAG_LABEL[r.flags[0] as keyof typeof FLAG_LABEL] ?? r.flags[0] : "Müdahale şüphesi", r.status === "mudahale" ? "denetim" : "okuma")}>Vaka Aç</Button> : null) },
                  ]}
                />
              </div>
              <div className="p-3 md:hidden">
                <RecordList label="Şüpheli sayaçlar" items={suspects.slice(0, 15).map<RecordItem>((r) => ({ id: r.meterId, title: customerOf(r.customerId).name, subtitle: r.flags.map((f) => FLAG_LABEL[f as keyof typeof FLAG_LABEL] ?? f).join(", ") || "Müdahale şüphesi", value: `Skor ${r.score}`, status: known.has(r.meterId) ? <Badge tone="neutral">Vakası var</Badge> : undefined, onSelect: can && !known.has(r.meterId) ? () => startLeak(r.meterId, r.customerId, r.flags.length ? FLAG_LABEL[r.flags[0] as keyof typeof FLAG_LABEL] ?? r.flags[0] : "Müdahale şüphesi") : undefined }))} />
              </div>
            </>
          ) : (
            <EmptyStateX title="Şüpheli sayaç yok" hint="Skoru 20'nin üstünde sayaç bulunmuyor." />
          )}
        </Panel>
        <Panel id="kacak-bayrak" title="Okuma Bayrakları" note="Kaçakla ilgili bayrak taşıyan, karara bağlanmamış okumalar.">
          {flagged.length ? (
            <ul ref={listRef} role="list" className="divide-y divide-line-soft">
              {flagged.slice(0, 12).map((r) => (
                <li key={r.id}>
                  <RowLink className="flex flex-wrap items-center gap-3 px-4 py-2.5 sm:px-5">
                    <span className="min-w-0 flex-1">
                      <RowAnchor to={{ page: "readings", params: { id: r.id } }} className="edas-mono">{r.id}</RowAnchor>
                      <span className="block truncate text-small text-muted">{customerOf(r.customerId).name} · {r.flags.map((f) => FLAG_LABEL[f]).join(", ")}</span>
                    </span>
                    {known.has(r.meterId) ? <Badge tone="neutral">Vakası var</Badge> : null}
                  </RowLink>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyStateX title="Kaçakla ilgili açık bayrak yok" hint="Okumalar sayfasındaki şüpheli okumaların hiçbirinde manyetik, kapak ya da düşük tüketim bayrağı yok." />
          )}
        </Panel>
      </div>
    ),
    kayip: (
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel id="kacak-kayip" title="Bölgeye Göre Kayıp" note={`${prev} dönemi; çizgi hedef, hedefi aşan bölge kırmızı.`}>
          <div className="grid gap-4 p-4 sm:p-5">
            <BarTarget aria-label="Bölgeye göre kayıp oranı" targetLabel="hedef" format={(v) => fmtPct(v)} rows={loss.map((r) => ({ id: r.region.id, label: r.region.name, value: r.lossPct, target: r.region.lossTarget }))} />
            <RegionMap title="Bölgeye göre kayıp oranı" regions={lossMap} viewBox={MAP_VIEWBOX} format={(v) => fmtPct(v)} legend={["Düşük kayıp", "Yüksek kayıp"]} />
          </div>
        </Panel>
        <Panel id="kacak-dtr" title="Trafo Bazında Açık Vaka" note="Açık vakaların bağlı olduğu dağıtım trafoları: kayıp-kaçak kümelenmesi.">
          <div className="p-4 sm:p-5">
            {trRows.length ? <BarTarget aria-label="Trafoya göre açık kaçak vakası" format={(v) => `${fmtNum(v)} vaka`} rows={trRows} /> : <EmptyStateX title="Trafo bağlı vaka yok" hint="Açık vakaların sayaçları bir dağıtım trafosuna bağlı değil." />}
            <p className="mt-3 text-small text-muted">Aynı trafoda birikim, teknik olmayan kaybın o bölümde yoğunlaştığına işaret eder; saha denetimini oraya yönlendir.</p>
          </div>
        </Panel>
      </div>
    ),
  };

  return (
    <>
      <PageHead title="Kaçak Vakaları" description="Şüpheli okumadan tutanağa, bedele ve itiraza: kaçak tespit süreci tek yerde." actions={can ? <Button size="sm" variant="primary" onClick={() => setNewOpen(true)}><Siren aria-hidden /> Vaka Aç</Button> : null} />
      <PageBody>
        <PageHero
          primary={{ label: "Açık Vaka", value: fmtNum(open.length), foot: `${fmtNum(open.filter((l) => l.stage === "supheli").length)} şüphe aşamasında · ${fmtNum(open.filter((l) => l.stage === "kontrol").length)} saha kontrolünde`, icon: <ShieldAlert /> }}
          secondary={[
            { label: "Tahmini Kaçak", value: fmtKwh(open.reduce((s, l) => s + l.estimatedKwh, 0)), foot: "Açık vakalar toplamı", icon: <Zap /> },
            { label: "Tahakkuk Edilen", value: fmtTlCompact(billing.reduce((s, l) => s + l.amount, 0)), foot: `${fmtNum(billing.length)} vaka bedel ya da itirazda`, icon: <Wallet /> },
            { label: "İtirazdaki", value: fmtNum(leaks.filter((l) => l.stage === "itiraz").length), foot: "Karar bekleyen tutanak", icon: <Gavel /> },
            { label: "Kapanan", value: fmtNum(closed.length), foot: fmtTlCompact(closed.reduce((s, l) => s + l.amount, 0)) + " toplam", icon: <FileSignature /> },
            { label: "Ort. Vaka Yaşı", value: `${fmtNum(open.length ? Math.round(open.reduce((s, l) => s + daysBetween(parseDay(l.openedAt), TODAY), 0) / open.length) : 0)} gün`, foot: "Açık vakaların", icon: <Siren /> },
            { label: "Şüpheli Sayaç", value: fmtNum(suspects.length), foot: "Skoru 20 üstü", icon: <Search />, to: { page: "leaks", params: { tab: "supheli" } } },
          ]}
        />
        <SegmentedControl<ViewId> aria-label="Görünüm" options={[{ value: "pano", label: "Pano" }, { value: "liste", label: "Liste" }, { value: "supheli", label: "Şüpheli Sayaçlar" }, { value: "kayip", label: "Kayıp Analizi" }]} value={view} onValueChange={(v) => go("leaks", { tab: v })} />
        {body[view]}
      </PageBody>
      <NewLeakDialog open={newOpen} preset={params.new} suspects={suspects} onClose={() => { setNewOpen(false); if (params.new) go("leaks", { tab: view }); }} onStart={(m, c, f, s) => { setNewOpen(false); startLeak(m, c, f, s); }} />
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Yeni vaka                                                                 */
/* ------------------------------------------------------------------------ */

function NewLeakDialog({ open, preset, suspects, onClose, onStart }: { open: boolean; preset?: string; suspects: ReturnType<typeof suspectMeters>; onClose: () => void; onStart: (meterId: string, customerId: string, flag: string, source: LeakCase["source"]) => void }) {
  const items: ComboboxItem[] = useMemo(() => {
    const ids = new Set(suspects.map((s) => s.meterId));
    const rest = METERS.filter((m) => !ids.has(m.id)).slice(0, 60);
    return [...suspects.slice(0, 30).map((s) => s.meterId), ...rest.map((m) => m.id)].map((id) => {
      const m = METERS.find((x) => x.id === id)!;
      return { value: id, label: `${m.serial} · ${customerOf(m.customerId).name}${ids.has(id) ? " · şüpheli" : ""}` };
    });
  }, [suspects]);
  const [meter, setMeter] = useState<ComboboxItem | null>(preset ? items.find((i) => i.value === preset) ?? null : null);
  const [source, setSource] = useState<string | null>("ihbar");
  const [flag, setFlag] = useState("");
  const m = meter ? METERS.find((x) => x.id === meter.value) : undefined;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Kaçak Vakası Aç"
      description="Şüpheli bir sayaçtan ya da ihbardan vaka aç; saha kontrol iş emri aşamaya geçince oluşur."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button variant="primary" disabled={!m} onClick={() => m && onStart(m.id, m.customerId, flag.trim() || "İhbar üzerine açıldı", (source ?? "ihbar") as LeakCase["source"])}>Vakayı Aç</Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Combobox label="Sayaç" items={items} value={meter} onValueChange={setMeter} placeholder="Seri no ya da müşteri adı" emptyText="Eşleşen sayaç yok." />
        <Select label="Kaynak" items={Object.entries(SOURCE_LABEL).map(([value, label]) => ({ value, label }))} value={source} onValueChange={setSource} />
        <Input label="Bulgu" value={flag} onChange={(e) => setFlag(e.target.value)} hint="Örn. kapak açma kaydı, manyetik müdahale, komşu ihbarı." />
      </div>
    </Dialog>
  );
}

/* ------------------------------------------------------------------------ */
/* Vaka ayrıntısı                                                            */
/* ------------------------------------------------------------------------ */

function LeakDetail({ l, go, can }: { l: LeakCase; go: PageProps["go"]; can: boolean }) {
  const { notify } = useApp();
  const orders = useWorkOrders();
  const disputes = useDerived(() => getDisputes().filter((d) => d.kind === "kacak" && d.subjectId === l.id), [l.id]);
  const cust = customerOf(l.customerId);
  const meter = meterById(l.meterId);
  const idx = stageIndex(l);
  const next = LEAK_STAGES[idx + 1];
  const wo = l.workOrderId ? orders.find((w) => w.id === l.workOrderId) : undefined;
  const series = consumption12(l.meterId);
  const events = useMemo<TimelineEvent[]>(() => (meter ? meterEvents(meter) : []).filter((e) => ["kapak", "manyetik", "gerilim", "saat"].includes(e.kind)).slice(0, 8).map((e) => ({ id: e.id, at: e.at.toISOString(), when: dateTime(e.at), title: e.title, description: e.detail, tone: e.tone })), [meter]);

  const [kwh, setKwh] = useState(String(l.estimatedKwh));
  const [months, setMonths] = useState(String(l.months));
  const [finding, setFinding] = useState<string | null>("kapak");
  const [notes, setNotes] = useState("");
  const [signed, setSigned] = useState(false);
  const [saved, setSaved] = useState(false);
  const kwhN = Math.max(0, Number(kwh) || 0);
  const calc = leakBreakdown(kwhN);

  const advance = () => {
    if (!next) return;
    if (advanceLeak(l.id)) notify({ title: `${l.id}: ${next.label} aşamasına geçti`, body: next.id === "kontrol" ? "Saha kontrol iş emri oluştu" : next.id === "tutanak" ? "Tutanak numarası verildi" : undefined, tone: "success" });
  };

  return (
    <>
      <PageHead
        title="Kaçak Vakaları"
        crumb={l.id}
        description={`${cust.name} · ${SOURCE_LABEL[l.source]} · ${l.flag}`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => go("leaks", {})}><ArrowLeft aria-hidden /> Vakalara Dön</Button>
            {can && next ? <Button variant="primary" size="sm" onClick={advance}>{next.id === "kapandi" ? "Vakayı Kapat" : `${next.label} Aşamasına Geç`}</Button> : null}
          </>
        }
      />
      <PageBody>
        <section aria-label="Süreç" className="rounded-xl bg-overlay p-4 shadow-raised ring-1 ring-line sm:p-5">
          <Stepper aria-label="Vaka süreci" current={idx} steps={LEAK_STAGES.map((s) => ({ label: s.label, description: s.hint }))} />
        </section>

        <PageHero
          primary={{ label: "Kaçak Bedeli", value: fmtTl(l.amount, 0), foot: `${fmtNum(l.estimatedKwh)} kWh · ${l.months} ay · ÖRNEK parametre`, icon: <Wallet /> }}
          secondary={[
            { label: "Aşama", value: stageLabel(l.stage), foot: next ? `Sonraki: ${next.label}` : "Süreç tamam", icon: <ShieldAlert /> },
            { label: "Tutanak", value: l.tutanakNo ?? "Yok", foot: l.tutanakNo ? "Tutanak numarası verildi" : "Tutanak aşamasında verilir", icon: <FileSignature /> },
            { label: "Sorumlu", value: l.assignedTo.split(" ")[0], foot: l.assignedTo, icon: <Siren /> },
            { label: "Açılış", value: shortDate.format(parseDay(l.openedAt)), foot: l.openedAt, icon: <Zap /> },
            { label: "Kaynak", value: SOURCE_LABEL[l.source], foot: "Vakayı başlatan kaynak", icon: <Search /> },
          ]}
        />

        <div className="grid gap-5 xl:grid-cols-5">
          <Panel id="kd-tuketim" title="Son 12 Ay Tüketim" note="Düşüş ya da sıçrama kaçağın başladığı dönemi işaret eder (kWh)." className="xl:col-span-3">
            <div className="p-4 sm:p-5">
              {series.values.length ? <LineChart title={`${cust.name} aylık tüketim`} labels={series.labels} series={[{ label: "Tüketim", values: series.values, series: 1 }]} unit="kWh" showToggles={false} markers /> : <EmptyStateX title="Okuma geçmişi yok" hint="Bu sayaç için doğrulanmış okuma bulunmuyor." />}
            </div>
          </Panel>
          <Panel id="kd-olay" title="Sayaç Olay Günlüğü" note="Kapak açma, manyetik alan, gerilim ve saat olayları." className="xl:col-span-2">
            <div className="p-4 sm:p-5">{events.length ? <Timeline events={events} /> : <p className="text-small text-muted">Son 90 günde ilgili olay yok.</p>}</div>
          </Panel>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel id="kd-tutanak" title="Tutanak" note={l.tutanakNo ? `Tutanak ${l.tutanakNo}` : "Tutanak aşamasında doldurulur."}>
            <div className="grid gap-3 p-4 sm:p-5">
              {idx >= 2 ? (
                <>
                  <Select label="Tespit edilen bulgu" items={[{ value: "kapak", label: "Mühür kopuk / kapak açılmış" }, { value: "manyetik", label: "Manyetik müdahale" }, { value: "bypass", label: "Sayaç öncesi bağlantı (by-pass)" }, { value: "ayar", label: "Sayaç ayarı değiştirilmiş" }]} value={finding} onValueChange={setFinding} />
                  <Textarea label="Saha notu" value={notes} onChange={(e) => setNotes(e.target.value)} minRows={3} />
                  <FileDropzone label="Fotoğraf ve belge" hint="Mühür, sayaç ve bağlantı fotoğrafları (PNG, JPG)" accept={["image/png", "image/jpeg"]} multiple />
                  <SignaturePad label="Tespit eden personel imzası" onValueChange={(v) => setSigned(!!v)} height={120} />
                  {can ? (
                    <Button size="sm" variant="primary" className="w-fit" disabled={!signed || saved} onClick={() => { audit("Kaçak tutanağını kaydetti", `${l.id} · ${l.tutanakNo ?? ""}`, undefined, finding ?? ""); setSaved(true); notify({ title: "Tutanak kaydedildi", body: l.tutanakNo ?? l.id, tone: "success" }); }}>
                      {saved ? "Tutanak Kaydedildi" : "Tutanağı Kaydet"}
                    </Button>
                  ) : null}
                  {!signed ? <p className="text-small text-muted">Kaydetmek için imza gerekir.</p> : null}
                </>
              ) : (
                <p className="text-small text-muted">Vaka tutanak aşamasına gelince bulgu, saha notu, fotoğraf ve imza buradan girilir.{wo ? " Saha kontrolü iş emri yolda." : ""}</p>
              )}
              {wo ? <p className="text-small text-muted">Saha kontrol iş emri: <a href={href("workorders", { id: wo.id })} className="edas-mono font-medium text-strong hover:underline">{wo.id}</a> ({wo.status})</p> : null}
            </div>
          </Panel>

          <Panel id="kd-bedel" title="Bedel Hesabı" note="Katsayılar ÖRNEK parametredir; resmî hesap mevzuat tanımına göre yapılır.">
            <div className="grid gap-3 p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Tahmini kaçak tüketim (kWh)" inputMode="numeric" value={kwh} onChange={(e) => setKwh(e.target.value.replace(/\D/g, ""))} disabled={!can || idx >= 4} />
                <Input label="Süre (ay)" inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value.replace(/\D/g, ""))} disabled={!can || idx >= 4} />
              </div>
              <dl className="grid gap-1 rounded-lg bg-surface p-3 text-small">
                <div className="flex justify-between"><dt className="text-muted">Enerji ({fmtNum(kwhN)} kWh × {fmtDec(LEAK_PARAMS.unitPrice, 2)} ₺)</dt><dd className="font-medium text-strong tabular-nums">{fmtTl(calc.energy)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Kaçak katsayısı × {fmtDec(LEAK_PARAMS.penaltyFactor, 1)}</dt><dd className="font-medium text-strong tabular-nums">{fmtTl(calc.penalty)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Vergi ve fonlar × {fmtDec(LEAK_PARAMS.taxFactor, 1)}</dt><dd className="font-medium text-strong tabular-nums">{fmtTl(calc.total)}</dd></div>
                <div className="flex justify-between border-t border-line-soft pt-1"><dt className="font-semibold text-strong">Kaçak bedeli</dt><dd className="font-semibold text-strong tabular-nums">{fmtTl(calc.total)}</dd></div>
              </dl>
              {can && idx < 4 ? <Button size="sm" variant="secondary" className="w-fit" disabled={!kwhN} onClick={() => { setLeakAmount(l.id, kwhN, Math.max(1, Number(months) || 1)); notify({ title: "Bedel hesaplandı", body: `${fmtNum(kwhN)} kWh · ${fmtTl(calc.total, 0)}`, tone: "success" }); }}>Bedeli Kaydet</Button> : <p className="text-small text-muted">Bedel itiraz aşamasından sonra değiştirilemez.</p>}
            </div>
          </Panel>
        </div>

        <Panel id="kd-islem" title="Müşteri ve İtiraz" note="Müşteri sayfası, itiraz kaydı ve vakayı kapatma.">
          <div className="grid gap-3 p-4 sm:p-5">
            <p className="text-base text-body"><a href={href("customers", { id: cust.id })} className="font-semibold text-strong hover:underline">{cust.name}</a> · Tesisat {cust.installation} · {region(cust.regionId).name}, {cust.district}</p>
            {disputes.length ? (
              <ul role="list" className="grid gap-1 text-small">
                {disputes.map((d) => (<li key={d.id}>İtiraz <a href={href("disputes", { id: d.id })} className="edas-mono font-medium text-strong hover:underline">{d.id}</a> · {d.status} · {d.reason}</li>))}
              </ul>
            ) : (
              <p className="text-small text-muted">Bu vaka için itiraz kaydı yok.</p>
            )}
            {can && (l.stage === "bedel" || l.stage === "itiraz") && !disputes.length ? (
              <Button size="sm" variant="secondary" className="w-fit" onClick={() => { const d = createDispute({ kind: "kacak", subjectId: l.id, customerId: l.customerId, reason: "Tutanak ve bedele itiraz" }); notify({ title: "İtiraz kaydı açıldı", body: d.id, tone: "success" }); }}>İtiraz Kaydı Aç</Button>
            ) : null}
          </div>
        </Panel>
      </PageBody>
    </>
  );
}

