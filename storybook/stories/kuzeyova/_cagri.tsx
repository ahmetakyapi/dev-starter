"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { Headset, MessageSquareWarning, PhoneCall, Smile, Star, TimerReset, Wrench, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BarList } from "@/components/ui/bar-list";
import { Button } from "@/components/ui/Button";
import { Combobox, type ComboboxItem } from "@/components/ui/combobox";
import { Heatmap } from "@/components/ui/heatmap";
import { Rating } from "@/components/ui/rating";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Timeline, type TimelineEvent } from "@/components/ui/timeline";
import type { ActiveFilter } from "@/components/ui/active-filters";
import type { SavedView } from "@/components/ui/saved-views";
import type { FilterGroup, FilterValue } from "@/components/ui/filter-sheet";
import { useDerived } from "./_core";
import { TODAY, TODAY_KEY, dateTime, dayKey, region } from "./_data";
import { allCustomers } from "./_data-musteri";
import { CALL_CHANNEL_LABEL, CALL_KIND_LABEL, type Call, type CallChannel, type CallKind } from "./_data-yeni";
import { CALL_HOURS, callDays, callHourGrid, callRemaining, customerOf, isSensitive } from "./_data-ops-sayfa";
import { BarTarget, EmptyStateX, FilterBar, PageHero, RowAnchor, RowLink, fmtDec, fmtDur, fmtNum, useListKeys } from "./_kit";
import { useCan } from "./_permissions";
import { customerBalance, faultCandidates, openOutages } from "./_selectors";
import { WORK_TYPE_LABEL, createCall, createDispute, createOutageFromCalls, createWorkOrder, linkCallToOutage, setCallStatus, useCalls, type WorkType } from "./_store";
import { liveInvoices } from "./_selectors";
import { IconTile, PageBody, PageHead, Panel, href, useApp, type PageProps } from "./_ui";

/* ------------------------------------------------------------------------ */
/* Ortak                                                                     */
/* ------------------------------------------------------------------------ */

const KIND_TONE: Record<CallKind, "danger" | "primary" | "warning" | "neutral"> = { ariza: "danger", fatura: "primary", sayac: "warning", bilgi: "neutral", sikayet: "warning", kesme: "primary" };
const STATUS_LABEL = { acik: "Açık", islemde: "İşlemde", kapandi: "Kapandı" } as const;
const PRIORITY_LABEL = { dusuk: "Düşük", normal: "Normal", yuksek: "Yüksek" } as const;
const TABS = ["kuyruk", "yogunluk"] as const;
type TabId = (typeof TABS)[number];

const VIEWS: SavedView[] = [
  { id: "acik", label: "Açık Kuyruk", builtin: true },
  { id: "sla", label: "SLA Aşanlar", builtin: true },
  { id: "ariza", label: "Elektrik Yok", builtin: true },
  { id: "hepsi", label: "Hepsi", builtin: true },
];
const GROUPS: FilterGroup[] = [
  { id: "durum", label: "Durum", options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })) },
  { id: "tur", label: "Tür", multiple: true, options: Object.entries(CALL_KIND_LABEL).map(([value, label]) => ({ value, label })) },
  { id: "oncelik", label: "Öncelik", options: Object.entries(PRIORITY_LABEL).map(([value, label]) => ({ value, label })) },
  { id: "kanal", label: "Kanal", multiple: true, options: Object.entries(CALL_CHANNEL_LABEL).map(([value, label]) => ({ value, label })) },
];
const LABELS: Record<string, Record<string, string>> = {
  durum: STATUS_LABEL,
  tur: CALL_KIND_LABEL,
  oncelik: PRIORITY_LABEL,
  kanal: CALL_CHANNEL_LABEL,
};

function viewFilter(view: string): FilterValue {
  if (view === "acik") return { durum: ["acik", "islemde"] };
  if (view === "ariza") return { tur: ["ariza"], durum: ["acik", "islemde"] };
  return {};
}

function SlaBadge({ c }: { c: Call }) {
  if (c.status === "kapandi") return <Badge tone="success" dot>Kapandı</Badge>;
  const left = callRemaining(c);
  return left < 0 ? (
    <Badge tone="danger" dot>
      SLA {fmtDur(-left)} aşıldı
    </Badge>
  ) : (
    <Badge tone={left < 60 ? "warning" : "neutral"} dot>
      {fmtDur(left)} kaldı
    </Badge>
  );
}

/* ------------------------------------------------------------------------ */
/* Sayfa                                                                     */
/* ------------------------------------------------------------------------ */

export function CagriPage({ params, go }: PageProps) {
  const { notify } = useApp();
  const canCall = useCan("musteri") || useCan("sayac");
  const calls = useCalls();
  const tab: TabId = (TABS as readonly string[]).includes(params.tab ?? "") ? (params.tab as TabId) : "kuyruk";

  const [q, setQ] = useState("");
  const [view, setView] = useState("acik");
  const [value, setValue] = useState<FilterValue>(viewFilter("acik"));
  const [limit, setLimit] = useState(30);
  const [newOpen, setNewOpen] = useState(!!params.new);
  const listRef = useRef<HTMLUListElement>(null);
  useListKeys(listRef);

  const candidates = useDerived(() => faultCandidates());
  const open = calls.filter((c) => c.status !== "kapandi");
  const slaBreached = open.filter((c) => callRemaining(c) < 0);
  const today = calls.filter((c) => dayKey(c.at) === TODAY_KEY);
  const rated = calls.filter((c) => c.rating);
  const avgRating = rated.length ? rated.reduce((s, c) => s + (c.rating ?? 0), 0) / rated.length : 0;
  const detail = params.id ? calls.find((c) => c.id === params.id) : undefined;

  const set = (id: string, items: readonly string[]) => setValue((cur) => ({ ...cur, [id]: items }));
  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("tr-TR");
    return calls.filter((c) => {
      if (view === "sla" && !(c.status !== "kapandi" && callRemaining(c) < 0)) return false;
      const ok = (key: string, v: string) => !(value[key]?.length) || value[key]!.includes(v);
      if (!ok("durum", c.status) || !ok("tur", c.kind) || !ok("oncelik", c.priority) || !ok("kanal", c.channel)) return false;
      if (needle) {
        const cust = c.customerId ? customerOf(c.customerId) : null;
        if (!`${c.id} ${c.note} ${cust?.name ?? ""} ${cust?.installation ?? ""} ${CALL_KIND_LABEL[c.kind]}`.toLocaleLowerCase("tr-TR").includes(needle)) return false;
      }
      return true;
    });
  }, [calls, q, value, view]);

  const filters: ActiveFilter[] = GROUPS.flatMap((g) => (value[g.id] ?? []).map((v) => ({ id: `${g.id}:${v}`, label: g.label, value: LABELS[g.id][v] })));
  const removeFilter = (id: string) => {
    const [g, v] = id.split(":");
    set(g, (value[g] ?? []).filter((x) => x !== v));
  };

  const heat = useDerived(() => callHourGrid(calls.filter((c) => TODAY.getTime() - c.at.getTime() <= 30 * 86_400_000)), [calls]);
  const kindRows = (Object.keys(CALL_KIND_LABEL) as CallKind[]).map((k) => ({ label: CALL_KIND_LABEL[k], value: calls.filter((c) => c.kind === k).length }));
  const channelRows = (Object.keys(CALL_CHANNEL_LABEL) as CallChannel[]).map((k) => ({ id: k, label: CALL_CHANNEL_LABEL[k], value: calls.filter((c) => c.channel === k).length }));
  const ratingRows = [5, 4, 3, 2, 1].map((n) => ({ id: String(n), label: `${n} Yıldız`, value: rated.filter((c) => c.rating === n).length }));

  const queue = (
    <Panel id="cagri-kuyruk" title="Çağrı Kuyruğu" note={`${fmtNum(filtered.length)} çağrı · SLA, çağrı tipine göre hedef süredir.`} actions={<Badge tone={slaBreached.length ? "danger" : "success"} dot>{slaBreached.length} SLA aşıldı</Badge>}>
      <div className="grid gap-3 p-4 sm:p-5">
        <FilterBar
          search={{ value: q, onChange: setQ, placeholder: "Müşteri, tesisat, çağrı no ya da not ara", label: "Çağrı Ara" }}
          filters={filters}
          onRemoveFilter={removeFilter}
          onClearFilters={() => { setValue({}); setView("hepsi"); }}
          views={{ items: VIEWS, value: view, onChange: (id) => { setView(id); setValue(viewFilter(id)); setLimit(30); } }}
          drawer={{ groups: GROUPS, value, onChange: setValue, resultCount: filtered.length, resultLabel: (n) => `${n} çağrıyı göster` }}
          summary={`${fmtNum(filtered.length)} çağrı`}
        />
      </div>
      {filtered.length ? (
        <>
          <ul ref={listRef} role="list" aria-label="Çağrılar" className="divide-y divide-line-soft border-t border-line-soft">
            {filtered.slice(0, limit).map((c) => {
              const cust = c.customerId ? customerOf(c.customerId) : null;
              return (
                <li key={c.id}>
                  <RowLink className="grid gap-1 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-x-8 sm:px-5">
                    <div className="grid min-w-0 gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <RowAnchor to={{ page: "calls", params: { id: c.id } }} className="kz-mono">{c.id}</RowAnchor>
                        <Badge tone={KIND_TONE[c.kind]} dot>{CALL_KIND_LABEL[c.kind]}</Badge>
                        {c.priority === "yuksek" ? <Badge tone="danger">Yüksek öncelik</Badge> : null}
                        {c.outageId ? <Badge tone="primary">{c.outageId}</Badge> : null}
                      </div>
                      <p className="text-base text-body">{cust ? `${cust.name} · ${cust.district}` : "Kimliksiz arayan"} — {c.note}</p>
                    </div>
                    <div className="grid gap-1 sm:justify-items-end sm:text-right">
                      <SlaBadge c={c} />
                      <p className="text-small text-muted tabular-nums">{dateTime(c.at)} · {CALL_CHANNEL_LABEL[c.channel]} · {c.assignee}</p>
                    </div>
                  </RowLink>
                </li>
              );
            })}
          </ul>
          {filtered.length > limit ? (
            <div className="border-t border-line-soft p-3 text-center">
              <Button size="sm" variant="ghost" onClick={() => setLimit((l) => l + 40)}>Daha Fazla Göster ({filtered.length - limit} çağrı)</Button>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyStateX title="Bu Süzgeçle Çağrı Yok" hint="Süzgeçleri gevşet ya da Hepsi görünümüne dön." action={<Button size="sm" variant="secondary" onClick={() => { setValue({}); setView("hepsi"); setQ(""); }}>Süzgeçleri Temizle</Button>} />
      )}
    </Panel>
  );

  const density = (
    <div className="grid gap-5 pt-5">
      <div className="grid gap-5 xl:grid-cols-5">
        <Panel id="cagri-saat" title="Saat ve Gün Yoğunluğu" note="Son 30 gün; koyu hücre daha çok çağrı. Vardiya planı için." className="xl:col-span-3">
          <div className="relative overflow-x-auto p-4 sm:p-5" tabIndex={0} role="region" aria-label="Saat ve Gün Yoğunluk Tablosu">
            <HourGrid grid={heat} />
          </div>
        </Panel>
        <Panel id="cagri-konu" title="Konu Dağılımı" note="Tüm kayıtlı çağrılar." className="xl:col-span-2">
          <div className="p-4 sm:p-5">
            <BarList title="Konuya Göre Çağrı Sayısı" columns={["Konu", "Çağrı"]} items={kindRows} series={1} />
          </div>
        </Panel>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel id="cagri-takvim" title="Günlük Çağrı Hacmi" note="Son 6 hafta, günlük toplam.">
          <div className="p-4 sm:p-5">
            <Heatmap title="Son Altı Haftanın Günlük Çağrı Sayısı" data={callDays(calls)} weeks={6} end={TODAY_KEY} unit="çağrı" />
          </div>
        </Panel>
        <Panel id="cagri-memnuniyet" title="Memnuniyet ve Kanal" note={`${rated.length} değerlendirme`}>
          <div className="grid gap-5 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-heading font-semibold text-strong tabular-nums">{fmtDec(avgRating)}</p>
              <Rating value={avgRating} size="md" count={rated.length} />
            </div>
            <BarTarget aria-label="Puana Göre Değerlendirme Sayısı" format={(v) => `${fmtNum(v)} çağrı`} rows={ratingRows} />
            <BarTarget aria-label="Kanala Göre Çağrı Sayısı" format={(v) => `${fmtNum(v)} çağrı`} rows={channelRows} />
          </div>
        </Panel>
      </div>
    </div>
  );

  const panels: { value: TabId; label: string; panel: ReactNode }[] = [
    { value: "kuyruk", label: `Kuyruk (${open.length})`, panel: <div className="pt-5">{queue}</div> },
    { value: "yogunluk", label: "Yoğunluk ve Memnuniyet", panel: density },
  ];

  return (
    <>
      <PageHead
        title="Çağrı Merkezi"
        description="Arayan müşteriyi bul, çağrıyı kaydet; arıza, iş emri ve itiraza tek tuşla çevir."
        actions={canCall ? <Button variant="primary" size="sm" onClick={() => setNewOpen(true)}><PhoneCall aria-hidden /> Yeni Çağrı</Button> : null}
      />
      <PageBody>
        {candidates.length ? (
          <section aria-label="Arıza Adayları" className="grid gap-2">
            {candidates.map((c) => (
              <div key={c.transformerId} role="group" aria-label={`Arıza adayı ${c.transformer.name}`} className="flex flex-wrap items-center gap-3 rounded-xl bg-warning-wash px-4 py-3 ring-1 ring-warning/30">
                <IconTile tone="warning"><Zap /></IconTile>
                <p className="min-w-[min(100%,16rem)] flex-1 text-base text-strong">
                  <span className="font-semibold">{c.transformer.name}</span> için {c.count} elektrik yok çağrısı var; ortak arıza adayı.
                  <span className="block text-small text-muted">Kayıt açılınca çağrılar arızaya bağlanır, ekip atanır ve onarım iş emri oluşur.</span>
                </p>
                {canCall ? (
                  <Button size="sm" variant="primary" onClick={() => { const o = createOutageFromCalls(c.transformerId); if (o) { notify({ title: "Arıza Kaydı Açıldı", body: `${o.id} · ${c.count} çağrı bağlandı`, tone: "success" }); go("outages", { id: o.id }); } }}>
                    Arızaya Çevir
                  </Button>
                ) : null}
              </div>
            ))}
          </section>
        ) : null}

        <PageHero
          primary={{ label: "Açık Çağrı", value: fmtNum(open.length), foot: `${fmtNum(open.filter((c) => c.kind === "ariza").length)} elektrik yok · ${fmtNum(open.filter((c) => c.status === "islemde").length)} işlemde`, icon: <Headset /> }}
          secondary={[
            { label: "SLA Aşan", value: fmtNum(slaBreached.length), foot: slaBreached.length ? "Önce bunlara dön" : "Hedef sürede", icon: <TimerReset /> },
            { label: "Arıza Adayı", value: fmtNum(candidates.length), foot: "Aynı trafoya 3+ çağrı", icon: <Zap /> },
            { label: "Bugün Gelen", value: fmtNum(today.length), foot: `${fmtNum(today.filter((c) => c.status === "kapandi").length)} kapandı`, icon: <PhoneCall /> },
            { label: "Memnuniyet", value: fmtDec(avgRating), unit: "/ 5", foot: `${rated.length} değerlendirme`, icon: <Smile /> },
            { label: "Yüksek Öncelik", value: fmtNum(open.filter((c) => c.priority === "yuksek").length), foot: "Önce ele alınacak", icon: <Star /> },
            { label: "Şikayet", value: fmtNum(calls.filter((c) => c.kind === "sikayet" && c.status !== "kapandi").length), foot: "Açık şikayet kaydı", icon: <MessageSquareWarning /> },
          ]}
        />

        <Tabs aria-label="Çağrı Merkezi Görünümleri" variant="underline" value={tab} onValueChange={(v) => go("calls", { tab: v })} items={panels.map((p) => ({ value: p.value, label: p.label, panel: p.value === tab ? p.panel : null }))} />
      </PageBody>

      <CallSheet call={detail ?? null} canCall={canCall} onClose={() => go("calls", { tab })} go={go} />
      <NewCallSheet open={newOpen} onClose={() => { setNewOpen(false); if (params.new) go("calls", { tab }); }} onCreated={(c) => { setNewOpen(false); notify({ title: "Çağrı Kaydedildi", body: `${c.id} · ${CALL_KIND_LABEL[c.kind]}`, tone: "success" }); go("calls", { id: c.id }); }} presetCustomer={params.new} />
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Saat × gün ısı tablosu                                                    */
/* ------------------------------------------------------------------------ */

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
function HourGrid({ grid }: { grid: number[][] }) {
  const max = Math.max(1, ...grid.flat());
  return (
    <table className="w-full min-w-[34rem] border-separate border-spacing-1 text-small">
      <caption className="sr-only">Gün ve saate göre çağrı sayısı</caption>
      <thead>
        <tr>
          <th scope="col" className="w-10" />
          {CALL_HOURS.map((h) => (
            <th key={h} scope="col" className="font-medium text-muted tabular-nums">{String(h).padStart(2, "0")}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {DAYS.map((d, i) => (
          <tr key={d}>
            <th scope="row" className="pr-1 text-left font-medium text-muted">{d}</th>
            {grid[i].map((n, j) => (
              <td key={j} className="h-8 rounded-md text-center tabular-nums text-strong" style={{ backgroundColor: n ? `color-mix(in srgb, var(--chart-1) ${10 + Math.round((n / max) * 80)}%, transparent)` : "var(--chart-track)" }}>
                <span className={n ? "" : "sr-only"}>{n}</span>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ------------------------------------------------------------------------ */
/* Çağrı ayrıntısı                                                           */
/* ------------------------------------------------------------------------ */

const WORK_BY_KIND: Partial<Record<CallKind, WorkType>> = { ariza: "ariza", sayac: "sayac-degisim", kesme: "baglama" };

function CallSheet({ call, canCall, onClose, go }: { call: Call | null; canCall: boolean; onClose: () => void; go: PageProps["go"] }) {
  const { notify } = useApp();
  const calls = useCalls();
  const outages = useDerived(() => openOutages());
  const [outageSel, setOutageSel] = useState<string | null>(null);
  const [ratingSel, setRatingSel] = useState<string | null>("5");
  const cust = call?.customerId ? customerOf(call.customerId) : null;
  const history = call?.customerId ? calls.filter((c) => c.customerId === call.customerId).sort((a, b) => b.at.getTime() - a.at.getTime()) : [];
  const events: TimelineEvent[] = history.slice(0, 8).map((c) => ({ id: c.id, at: c.at.toISOString(), when: dateTime(c.at), title: `${CALL_KIND_LABEL[c.kind]} · ${c.id}`, description: c.note, tone: c.id === call?.id ? "primary" : c.status === "kapandi" ? "neutral" : "warning" }));
  const workType = call ? WORK_BY_KIND[call.kind] : undefined;
  const invoice = call?.customerId ? liveInvoices().find((i) => i.customerId === call.customerId && i.status !== "odendi") ?? liveInvoices().find((i) => i.customerId === call.customerId) : undefined;
  const disputeKind = call?.kind === "fatura" ? "fatura" : call?.kind === "sayac" ? "sayac" : call?.kind === "kesme" ? "kesme" : null;
  const subject = disputeKind === "fatura" ? invoice?.id : disputeKind === "sayac" ? call?.meterId : disputeKind === "kesme" ? call?.customerId : null;

  return (
    <Sheet
      open={!!call}
      onOpenChange={(o) => !o && onClose()}
      size="lg"
      title={call ? `${call.id} · ${CALL_KIND_LABEL[call.kind]}` : ""}
      description={call ? `${dateTime(call.at)} · ${CALL_CHANNEL_LABEL[call.channel]} · ${call.assignee}` : undefined}
      status={call ? <SlaBadge c={call} /> : undefined}
      footer={<Button variant="ghost" onClick={onClose}>Kapat</Button>}
    >
      {call ? (
        <div className="grid gap-5">
          <p className="rounded-lg bg-surface p-3 text-base text-strong">{call.note}</p>

          <section aria-label="Müşteri" className="grid gap-2">
            <h3 className="text-read font-semibold text-strong">Müşteri</h3>
            {cust ? (
              <dl className="grid gap-x-4 gap-y-1 text-small sm:grid-cols-2">
                <div><dt className="text-muted">Ad</dt><dd className="font-medium text-strong"><a href={href("customers", { id: cust.id })} className="hover:underline">{cust.name}</a>{isSensitive(cust) ? <Badge tone="danger" className="ml-2">Hassas abone</Badge> : null}</dd></div>
                <div><dt className="text-muted">Tesisat No</dt><dd className="kz-mono font-medium text-strong">{cust.installation}</dd></div>
                <div><dt className="text-muted">Adres</dt><dd className="font-medium text-strong">{cust.address}</dd></div>
                <div><dt className="text-muted">Bölge</dt><dd className="font-medium text-strong">{region(cust.regionId).name} · {cust.district}</dd></div>
                <div><dt className="text-muted">Telefon</dt><dd className="kz-mono font-medium text-strong">{cust.phone}</dd></div>
                <div><dt className="text-muted">Açık Bakiye</dt><dd className="font-medium text-strong tabular-nums">{customerBalance(cust.id) ? `₺${(customerBalance(cust.id) / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "Yok"}</dd></div>
              </dl>
            ) : (
              <p className="text-small text-muted">Arayan kimliği bilinmiyor: tesisat numarasıyla müşteri bulunamadı.</p>
            )}
          </section>

          {canCall && call.status !== "kapandi" ? (
            <section aria-label="İşlemler" className="grid gap-3">
              <h3 className="text-read font-semibold text-strong">İşlemler</h3>
              <div className="flex flex-wrap gap-2">
                {call.status === "acik" ? <Button size="sm" variant="secondary" onClick={() => (setCallStatus(call.id, "islemde"), notify({ title: `${call.id} İşleme Alındı`, tone: "info" }))}>İşleme Al</Button> : null}
                {call.kind === "ariza" && call.transformerId && !call.outageId ? (
                  <Button size="sm" variant="primary" onClick={() => { const o = createOutageFromCalls(call.transformerId!); if (o) { notify({ title: "Arıza Kaydı Açıldı", body: `${o.id} · ${call.transformerId}`, tone: "success" }); onClose(); go("outages", { id: o.id }); } }}>
                    <Zap aria-hidden /> Arıza Kaydına Çevir
                  </Button>
                ) : null}
                {workType ? (
                  <Button size="sm" variant="secondary" onClick={() => { const w = createWorkOrder({ type: workType, customerId: call.customerId, meterId: call.meterId, reason: `${call.id}: ${call.note}`, linkedId: call.outageId ?? call.id }); notify({ title: "İş Emri Açıldı", body: `${w.id} · ${WORK_TYPE_LABEL[workType]}`, tone: "success" }); }}>
                    <Wrench aria-hidden /> {WORK_TYPE_LABEL[workType]} İş Emri Aç
                  </Button>
                ) : null}
                {disputeKind && subject && call.customerId ? (
                  <Button size="sm" variant="secondary" onClick={() => { const d = createDispute({ kind: disputeKind, subjectId: subject, customerId: call.customerId!, reason: call.note, meterTest: disputeKind === "sayac" }); notify({ title: "İtiraz Kaydı Açıldı", body: `${d.id} · ${disputeKind}`, tone: "success" }); }}>
                    <Star aria-hidden /> İtiraz Oluştur
                  </Button>
                ) : null}
              </div>
              {call.kind === "ariza" && !call.outageId && outages.length ? (
                <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                  <Select label="Mevcut Arızaya Bağla" items={outages.map((o) => ({ value: o.id, label: `${o.id} · ${o.cause}` }))} value={outageSel} onValueChange={setOutageSel} placeholder="Açık arıza seç" />
                  <Button size="sm" variant="secondary" disabled={!outageSel} onClick={() => outageSel && (linkCallToOutage(call.id, outageSel), notify({ title: "Çağrı Arızaya Bağlandı", body: outageSel, tone: "success" }))}>Bağla</Button>
                </div>
              ) : null}
              {call.outageId ? <p className="text-small text-muted">Bu çağrı <a href={href("outages", { id: call.outageId })} className="font-medium text-strong hover:underline">{call.outageId}</a> kaydına bağlı.</p> : null}
              <div className="grid gap-2 border-t border-line-soft pt-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <Select label="Müşteri Memnuniyeti" items={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} Yıldız` }))} value={ratingSel} onValueChange={setRatingSel} />
                <Button size="sm" variant="primary" onClick={() => (setCallStatus(call.id, "kapandi", Number(ratingSel)), notify({ title: `${call.id} Kapatıldı`, body: `${ratingSel} yıldız`, tone: "success" }))}>Çağrıyı Kapat</Button>
              </div>
            </section>
          ) : call.status === "kapandi" ? (
            <p className="flex items-center gap-2 text-small text-muted">Çağrı kapalı{call.rating ? <><Rating value={call.rating} size="sm" /> {call.rating} yıldız</> : null}.</p>
          ) : null}

          {events.length ? (
            <section aria-label="Müşteri Geçmişi" className="grid gap-2">
              <h3 className="text-read font-semibold text-strong">Önceki Çağrılar</h3>
              <Timeline events={events} />
            </section>
          ) : null}
        </div>
      ) : null}
    </Sheet>
  );
}

/* ------------------------------------------------------------------------ */
/* Yeni çağrı                                                                */
/* ------------------------------------------------------------------------ */

function NewCallSheet({ open, onClose, onCreated, presetCustomer }: { open: boolean; onClose: () => void; onCreated: (c: Call) => void; presetCustomer?: string }) {
  const items: ComboboxItem[] = useMemo(() => allCustomers().map((c) => ({ value: c.id, label: `${c.name} · Tesisat ${c.installation} · ${c.district}` })), []);
  const [cust, setCust] = useState<ComboboxItem | null>(presetCustomer ? items.find((i) => i.value === presetCustomer) ?? null : null);
  const [kind, setKind] = useState<string | null>("ariza");
  const [priority, setPriority] = useState<string | null>("normal");
  const [channel, setChannel] = useState<string | null>("telefon");
  const [note, setNote] = useState("");
  const priorityValue = kind === "ariza" && priority === "normal" ? "yuksek" : priority;
  const submit = () => {
    if (!kind) return;
    const c = createCall({ kind: kind as CallKind, customerId: cust?.value ?? null, channel: (channel ?? "telefon") as CallChannel, note: note.trim() || CALL_KIND_LABEL[kind as CallKind], priority: (priorityValue ?? "normal") as Call["priority"] });
    setNote("");
    onCreated(c);
  };
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Yeni Çağrı"
      description="Arayanı tesisat ya da adıyla bul; kayıt hemen kuyruğa düşer."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button variant="primary" onClick={submit} disabled={!kind || (!cust && !note.trim())}>Çağrıyı Kaydet</Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Combobox label="Müşteri" items={items} value={cust} onValueChange={setCust} placeholder="Ad, tesisat no ya da mahalle" emptyText="Eşleşen müşteri yok. Kimliksiz çağrı olarak not girip kaydedebilirsin." />
        <Select label="Çağrı Türü" items={Object.entries(CALL_KIND_LABEL).map(([value, label]) => ({ value, label }))} value={kind} onValueChange={setKind} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Öncelik" items={Object.entries(PRIORITY_LABEL).map(([value, label]) => ({ value, label }))} value={priorityValue} onValueChange={setPriority} />
          <Select label="Kanal" items={Object.entries(CALL_CHANNEL_LABEL).map(([value, label]) => ({ value, label }))} value={channel} onValueChange={setChannel} />
        </div>
        <Textarea label="Not" value={note} onChange={(e) => setNote(e.target.value)} minRows={3} />
        {kind === "ariza" ? <p className="rounded-lg bg-surface p-3 text-small text-muted">Elektrik yok çağrıları yüksek öncelikle açılır; aynı trafoya üç çağrı gelirse arıza adayı olarak öne çıkar.</p> : null}
      </div>
    </Sheet>
  );
}
