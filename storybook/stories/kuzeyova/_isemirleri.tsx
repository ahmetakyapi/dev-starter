"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { CalendarDays, CheckCheck, ClipboardList, Timer, UserX, Users, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Combobox, type ComboboxItem } from "@/components/ui/combobox";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { FactorList } from "@/components/ui/factor-list";
import { InsightCallout } from "@/components/ui/insight-callout";
import { PolicyChecks, type PolicyCheck } from "@/components/ui/policy-checks";
import { ValueDiff } from "@/components/ui/value-diff";
import { Input } from "@/components/ui/input";
import { KanbanBoard, type KanbanCard, type KanbanColumn } from "@/components/ui/kanban-board";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Timeline, type TimelineEvent } from "@/components/ui/timeline";
import { WeekCalendar, type CalendarEvent } from "@/components/ui/week-calendar";
import type { ActiveFilter } from "@/components/ui/active-filters";
import type { FilterGroup, FilterValue } from "@/components/ui/filter-sheet";
import { TODAY, TODAY_KEY, addDays, clock, dateTime, dayKey, fullDate, region, REGIONS } from "./_data";
import { allCustomers, metersFor } from "./_data-musteri";
import { CREWS } from "./_data-operasyon";
import { customerOf } from "./_data-ops-sayfa";
import { BarTarget, EmptyStateX, FilterBar, PageHero, RowAnchor, RowLink, fmtDur, fmtNum, useListKeys } from "./_kit";
import { useCan } from "./_permissions";
import { scheduleSlot } from "./_cutpolicy";
import { WORK_FLOW, WORK_STATUS_LABEL, WORK_TYPE_LABEL, advanceWorkOrder, assignWorkOrder, cancelWorkOrder, createWorkOrder, useWorkOrders, type WorkOrderX, type WorkResult, type WorkStatus, type WorkType } from "./_store";
import { IconTile, PageBody, PageHead, Panel, href, useApp, type PageProps } from "./_ui";


/* ------------------------------------------------------------------------ */
/* Ortak                                                                     */
/* ------------------------------------------------------------------------ */

const VIEWS = ["pano", "liste", "takvim", "ekip"] as const;
type ViewId = (typeof VIEWS)[number];
const STATUS_TONE: Record<WorkStatus, "neutral" | "primary" | "warning" | "success" | "danger"> = { acik: "warning", atandi: "primary", yolda: "primary", sahada: "primary", tamamlandi: "success", iptal: "neutral" };
const TYPE_ORDER = Object.keys(WORK_TYPE_LABEL) as WorkType[];
const TYPE_SERIES: Record<WorkType, 1 | 2 | 3 | 4 | 5 | 6> = { kesme: 6, baglama: 1, "sayac-degisim": 4, sokum: 3, "okuma-turu": 2, kontrol: 5, kesif: 2, montaj: 1, ariza: 6 };
const TYPE_TONE = (t: WorkType): "neutral" | "primary" | "chart-1" | "chart-4" | "chart-6" => (t === "kesme" || t === "ariza" ? "chart-6" : t === "baglama" || t === "montaj" ? "chart-1" : t === "sayac-degisim" || t === "sokum" ? "chart-4" : t === "kontrol" ? "primary" : "neutral");
const DAILY_CAPACITY = 6;

const GROUPS: FilterGroup[] = [
  { id: "tur", label: "İş Türü", multiple: true, options: TYPE_ORDER.map((t) => ({ value: t, label: WORK_TYPE_LABEL[t] })) },
  { id: "durum", label: "Durum", multiple: true, options: (Object.keys(WORK_STATUS_LABEL) as WorkStatus[]).map((s) => ({ value: s, label: WORK_STATUS_LABEL[s] })) },
  { id: "ekip", label: "Ekip", multiple: true, options: [{ value: "_yok", label: "Atanmamış" }, ...CREWS.map((c) => ({ value: c, label: c }))] },
  { id: "bolge", label: "Bölge", multiple: true, options: REGIONS.map((r) => ({ value: r.id, label: r.name })) },
];
const LABEL_OF: Record<string, (v: string) => string> = {
  tur: (v) => WORK_TYPE_LABEL[v as WorkType] ?? v,
  durum: (v) => WORK_STATUS_LABEL[v as WorkStatus] ?? v,
  ekip: (v) => (v === "_yok" ? "Atanmamış" : v),
  bolge: (v) => region(v).name,
};

const isOpen = (w: WorkOrderX) => w.status !== "tamamlandi" && w.status !== "iptal";
const elapsedH = (w: WorkOrderX) => (TODAY.getTime() - w.createdAt.getTime()) / 3_600_000;
const slaLeft = (w: WorkOrderX) => Math.round((w.slaHours - elapsedH(w)) * 10) / 10;
/** Seri numarasını üçerli gruplara böler (fark vurgusu için). */
const chunk = (v: string) => v.match(/.{1,3}/g) ?? [v];
const crewOf = (regionId: string) => CREWS[Math.max(0, REGIONS.findIndex((r) => r.id === regionId))];

/** Bağlı kaydın sayfası: kimlik önekinden. */
function linkedLink(id: string | null): { label: string; to: string } | null {
  if (!id) return null;
  if (id.startsWith("KC-")) return { label: `Kaçak Vakası ${id}`, to: href("leaks", { id }) };
  if (id.startsWith("K-")) return { label: `Arıza ${id}`, to: href("outages", { id }) };
  if (id.startsWith("BAS-")) return { label: `Başvuru ${id}`, to: href("applications", { id }) };
  if (id.startsWith("IT-")) return { label: `İtiraz ${id}`, to: href("disputes", { id }) };
  if (id.startsWith("CG-")) return { label: `Çağrı ${id}`, to: href("calls", { id }) };
  return { label: id, to: href("workorders", { id }) };
}

function SlaBadge({ w }: { w: WorkOrderX }) {
  if (!isOpen(w)) return null;
  const left = slaLeft(w);
  return left < 0 ? (
    <Badge tone="danger" dot>SLA {fmtDur(-left * 60)} aşıldı</Badge>
  ) : (
    <Badge tone={left < 12 ? "warning" : "neutral"} dot>{fmtDur(left * 60)} kaldı</Badge>
  );
}

/* ------------------------------------------------------------------------ */
/* Sayfa                                                                     */
/* ------------------------------------------------------------------------ */

export function IsEmirleriPage({ params, go }: PageProps) {
  const { notify } = useApp();
  const can = useCan("sayac") || useCan("musteri") || useCan("kesme");
  const orders = useWorkOrders();
  const view: ViewId = (VIEWS as readonly string[]).includes(params.tab ?? "") ? (params.tab as ViewId) : "pano";

  const [q, setQ] = useState("");
  const [value, setValue] = useState<FilterValue>(params.type ? { tur: [params.type] } : {});
  const [createOpen, setCreateOpen] = useState(false);
  const [completeFor, setCompleteFor] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [weekShift, setWeekShift] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  useListKeys(listRef);

  const detail = params.id ? orders.find((w) => w.id === params.id) ?? null : null;
  const completing = completeFor ? orders.find((w) => w.id === completeFor) ?? null : null;

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("tr-TR");
    const has = (key: string, v: string) => !(value[key]?.length) || value[key]!.includes(v);
    return orders.filter((w) => {
      if (!has("tur", w.type) || !has("durum", w.status) || !has("bolge", w.regionId)) return false;
      if (value.ekip?.length && !value.ekip.includes(w.assignee ?? "_yok")) return false;
      if (needle) {
        const c = w.customerId ? customerOf(w.customerId) : null;
        if (!`${w.id} ${WORK_TYPE_LABEL[w.type]} ${w.reason} ${c?.name ?? ""} ${w.assignee ?? ""}`.toLocaleLowerCase("tr-TR").includes(needle)) return false;
      }
      return true;
    });
  }, [orders, q, value]);

  const filters: ActiveFilter[] = GROUPS.flatMap((g) => (value[g.id] ?? []).map((v) => ({ id: `${g.id}:${v}`, label: g.label, value: LABEL_OF[g.id](v) })));
  const removeFilter = (id: string) => {
    const [g, v] = id.split(":");
    setValue((cur) => ({ ...cur, [g]: (cur[g] ?? []).filter((x) => x !== v) }));
  };

  const open = orders.filter(isOpen);
  const breaches = open.filter((w) => slaLeft(w) < 0);
  const unassigned = open.filter((w) => !w.assignee);
  const onSite = open.filter((w) => w.status === "sahada" || w.status === "yolda");
  const doneToday = orders.filter((w) => w.status === "tamamlandi" && dayKey(w.history[w.history.length - 1]?.at ?? w.createdAt) === TODAY_KEY);

  /* Kanban: sürükleme DURUM MAKİNESİNE çevrilir; geçersiz hamle geri alınır. */
  const colId = (s: WorkStatus) => s;
  const columns = useMemo<KanbanColumn[]>(
    () =>
      WORK_FLOW.map((s) => ({
        id: colId(s),
        title: WORK_STATUS_LABEL[s],
        done: s === "tamamlandi",
        cards: filtered
          .filter((w) => w.status === s)
          .map<KanbanCard>((w) => ({
            id: w.id,
            title: `${WORK_TYPE_LABEL[w.type]} · ${w.customerId ? customerOf(w.customerId).name : region(w.regionId).name}`,
            tags: [{ label: region(w.regionId).name, tone: TYPE_TONE(w.type) }, ...(isOpen(w) && slaLeft(w) < 0 ? [{ label: "SLA Aşıldı", tone: "chart-6" as const }] : [])],
            assignee: w.assignee ? { name: w.assignee } : undefined,
            due: dayKey(w.scheduled),
          })),
      })),
    [filtered],
  );
  const signature = orders.map((w) => `${w.id}:${w.status}:${w.assignee ?? ""}`).join("|");

  const onBoardChange = (cols: KanbanColumn[]) => {
    const target = new Map<string, string>();
    for (const c of cols) for (const card of c.cards) target.set(card.id, c.id);
    for (const w of orders) {
      const to = target.get(w.id);
      if (!to || to === w.status) continue;
      const from = WORK_FLOW.indexOf(w.status);
      const next = WORK_FLOW.indexOf(to as WorkStatus);
      if (!can) {
        notify({ title: "Bu İşlem için Yetkin Yok", body: "İş emri durumunu değiştirmek saha ya da müşteri hizmetleri yetkisi ister.", tone: "info" });
      } else if (from < 0 || next <= from) {
        notify({ title: "Durum Geri Alınamaz", body: "İptal için ayrıntıyı aç; tamamlanan iş yeniden açılmaz.", tone: "info" });
      } else if (to === "tamamlandi") {
        setCompleteFor(w.id);
      } else {
        if (!w.assignee) assignWorkOrder(w.id, crewOf(w.regionId));
        for (let i = from; i < next; i++) advanceWorkOrder(w.id);
        notify({ title: `${w.id} ${WORK_STATUS_LABEL[to as WorkStatus]} Durumuna Taşındı`, body: !w.assignee ? `${crewOf(w.regionId)} otomatik atandı` : w.assignee, tone: "success" });
      }
      break;
    }
    setNonce((n) => n + 1);
  };

  /* Takvim */
  const weekStart = dayKey(addDays(TODAY, weekShift * 7));
  const events: CalendarEvent[] = filtered
    .filter((w) => w.status !== "iptal")
    .map((w) => {
      const start = `${dayKey(w.scheduled)}T${String(w.scheduled.getHours()).padStart(2, "0")}:${String(w.scheduled.getMinutes()).padStart(2, "0")}`;
      const endDate = new Date(w.scheduled.getTime() + 2 * 3_600_000);
      return { id: w.id, title: `${WORK_TYPE_LABEL[w.type]} · ${w.customerId ? customerOf(w.customerId).name : region(w.regionId).name}`, start, end: `${dayKey(endDate)}T${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`, series: TYPE_SERIES[w.type], location: region(w.regionId).name };
    });

  /* Ekip yükü */
  const crewRows = [...CREWS, "Atanmamış"].map((c) => ({ id: c, label: c, value: open.filter((w) => (w.assignee ?? "Atanmamış") === c).length, target: c === "Atanmamış" ? undefined : DAILY_CAPACITY }));

  const columnsTable: Column<WorkOrderX>[] = [
    { key: "id", header: "İş Emri", sortable: true, sortValue: (w) => w.id, render: (w) => <a href={href("workorders", { id: w.id })} className="kz-mono font-medium text-strong hover:underline">{w.id}</a> },
    { key: "t", header: "Tür", sortable: true, sortValue: (w) => WORK_TYPE_LABEL[w.type], render: (w) => WORK_TYPE_LABEL[w.type] },
    { key: "c", header: "Abone / Bölge", render: (w) => (w.customerId ? customerOf(w.customerId).name : region(w.regionId).name) },
    { key: "a", header: "Atanan", render: (w) => w.assignee ?? <span className="text-muted">Atanmadı</span> },
    { key: "p", header: "Planlı", sortable: true, sortValue: (w) => w.scheduled.getTime(), render: (w) => dateTime(w.scheduled) },
    { key: "sla", header: "SLA", render: (w) => <SlaBadge w={w} /> },
    { key: "s", header: "Durum", render: (w) => <Badge tone={STATUS_TONE[w.status]} dot>{WORK_STATUS_LABEL[w.status]}</Badge> },
  ];

  const body: Record<ViewId, ReactNode> = {
    pano: (
      <Panel id="is-pano" title="İş Emri Panosu" note="Kartı sürükle ya da klavyeyle taşı (Boşluk, ok tuşları); Enter ayrıntıyı açar. Geri adım ve atlama yapılamaz: durum makinesi ileri akar.">
        <div className="p-3 sm:p-4">
          <div className="max-h-[46rem] overflow-y-auto overscroll-contain"><KanbanBoard key={`${signature}-${nonce}-${filtered.length}`} label="İş Emirleri" defaultColumns={columns} today={TODAY_KEY} onChange={onBoardChange} onCardOpen={(c) => go("workorders", { tab: view, id: c.id })} /></div>
        </div>
      </Panel>
    ),
    liste: (
      <Panel id="is-liste" title="İş Emirleri" note={`${fmtNum(filtered.length)} kayıt`}>
        {filtered.length ? (
          <>
            <div className="max-md:hidden">
              <DataTable<WorkOrderX> caption="İş emirleri" columns={columnsTable} rows={filtered} rowKey={(w) => w.id} density="comfortable" on="surface" stickyFirst={false} empty="Bu süzgeçle iş emri yok" />
            </div>
            <div className="p-3 md:hidden">
              <RecordList
                label="İş Emirleri"
                items={filtered.slice(0, 40).map<RecordItem>((w) => ({ id: w.id, title: `${w.id} · ${WORK_TYPE_LABEL[w.type]}`, subtitle: w.customerId ? customerOf(w.customerId).name : region(w.regionId).name, meta: dateTime(w.scheduled), status: <Badge tone={STATUS_TONE[w.status]} dot>{WORK_STATUS_LABEL[w.status]}</Badge>, href: href("workorders", { id: w.id }), onSelect: () => go("workorders", { id: w.id }) }))}
              />
            </div>
          </>
        ) : (
          <EmptyStateX title="Bu Süzgeçle İş Emri Yok" hint="Süzgeçleri gevşet ya da yeni bir iş emri aç." />
        )}
      </Panel>
    ),
    takvim: (
      <Panel
        id="is-takvim"
        title="Haftalık Plan"
        note="Planlı saatten iki saatlik pencere; renk iş türüdür."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setWeekShift((s) => s - 1)}>Önceki Hafta</Button>
            <Button size="sm" variant="ghost" onClick={() => setWeekShift(0)} disabled={weekShift === 0}>Bu Hafta</Button>
            <Button size="sm" variant="ghost" onClick={() => setWeekShift((s) => s + 1)}>Sonraki Hafta</Button>
          </div>
        }
      >
        <div className="p-3 sm:p-4">
          <WeekCalendar week={weekStart} events={events} startHour={7} endHour={19} weekdaysOnly label="İş Emri Takvimi" now={`${TODAY_KEY}T10:40`} onSelect={(e) => go("workorders", { tab: "takvim", id: e.id })} />
        </div>
      </Panel>
    ),
    ekip: (
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel id="is-ekip" title="Ekip Yükü" note={`Açık iş emri sayısı; çizgi günlük kapasite (${DAILY_CAPACITY}).`}>
          <div className="p-4 sm:p-5">
            <BarTarget aria-label="Ekibe Göre Açık İş Emri" targetLabel="kapasite" format={(v) => `${fmtNum(v)} iş`} rows={crewRows} />
          </div>
        </Panel>
        <Panel id="is-atanmamis" title="Atama Bekleyenler" note={`${unassigned.length} iş emri`}>
          {unassigned.length ? (
            <ul ref={listRef} role="list" className="divide-y divide-line-soft">
              {unassigned.slice(0, 12).map((w) => (
                <li key={w.id}>
                  <RowLink className="flex flex-wrap items-center gap-3 px-4 py-2.5 sm:px-5">
                    <span className="min-w-0 flex-1">
                      <RowAnchor to={{ page: "workorders", params: { id: w.id } }} className="kz-mono">{w.id}</RowAnchor>
                      <span className="block truncate text-small text-muted">{WORK_TYPE_LABEL[w.type]} · {w.customerId ? customerOf(w.customerId).name : region(w.regionId).name}</span>
                    </span>
                    <SlaBadge w={w} />
                  </RowLink>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyStateX title="Atanmamış İş Emri Yok" hint="Bütün açık işlerin bir ekibi var." />
          )}
        </Panel>
      </div>
    ),
  };

  return (
    <>
      <PageHead title="İş Emirleri" description="Kesme, bağlama, sayaç değişimi, kaçak kontrolü ve arıza onarımı: tek durum makinesi." actions={can ? <Button size="sm" variant="primary" onClick={() => setCreateOpen(true)}><ClipboardList aria-hidden /> İş Emri Aç</Button> : null} />
      <PageBody>
        <PageHero
          primary={{ label: "Açık İş Emri", value: fmtNum(open.length), foot: `${fmtNum(onSite.length)} yolda ya da sahada`, icon: <Wrench /> }}
          secondary={[
            { label: "SLA Aşan", value: fmtNum(breaches.length), foot: breaches.length ? "Önce bunlara ekip yönlendir" : "Hedef sürede", icon: <Timer />, to: { page: "workorders", params: { tab: "liste" } } },
            { label: "Atanmamış", value: fmtNum(unassigned.length), foot: "Ekip bekleyen", icon: <UserX />, to: { page: "workorders", params: { tab: "ekip" } } },
            { label: "Bugün Tamamlanan", value: fmtNum(doneToday.length), foot: "Sahadan kapanan", icon: <CheckCheck /> },
            { label: "Bu Hafta Planlı", value: fmtNum(open.filter((w) => w.scheduled <= addDays(TODAY, 7)).length), foot: "7 gün içinde", icon: <CalendarDays />, to: { page: "workorders", params: { tab: "takvim" } } },
            { label: "Ort. Açık Süre", value: fmtDur(open.length ? (open.reduce((s, w) => s + elapsedH(w), 0) / open.length) * 60 : 0), foot: "Açılıştan bu yana", icon: <ClipboardList /> },
            { label: "Aktif Ekip", value: fmtNum(new Set(open.map((w) => w.assignee).filter(Boolean)).size), foot: `${CREWS.length} ekipten`, icon: <Users /> },
          ]}
        />

        <div className="grid gap-3">
          <FilterBar
            search={{ value: q, onChange: setQ, placeholder: "İş emri, abone, ekip ya da neden ara", label: "İş Emri Ara" }}
            filters={filters}
            onRemoveFilter={removeFilter}
            onClearFilters={() => { setValue({}); setQ(""); }}
            drawer={{ groups: GROUPS, value, onChange: setValue, resultCount: filtered.length, resultLabel: (n) => `${n} iş emrini göster` }}
            summary={`${fmtNum(filtered.length)} iş emri`}
            actions={
              <SegmentedControl<ViewId>
                aria-label="Görünüm"
                options={[{ value: "pano", label: "Pano" }, { value: "liste", label: "Liste" }, { value: "takvim", label: "Takvim" }, { value: "ekip", label: "Ekip" }]}
                value={view}
                onValueChange={(v) => go("workorders", { tab: v })}
              />
            }
          />
        </div>
        {body[view]}
      </PageBody>

      <DetailSheet w={detail} view={view} canEdit={can} onClose={() => go("workorders", { tab: view })} go={go} onComplete={(id) => setCompleteFor(id)} />
      <CompleteDialog w={completing} onClose={() => setCompleteFor(null)} />
      <CreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(w) => { setCreateOpen(false); notify({ title: "İş Emri Açıldı", body: `${w.id} · ${WORK_TYPE_LABEL[w.type]}`, tone: "success" }); go("workorders", { tab: view, id: w.id }); }} />
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Ayrıntı                                                                   */
/* ------------------------------------------------------------------------ */

function DetailSheet({ w, view, canEdit, onClose, go, onComplete }: { w: WorkOrderX | null; view: ViewId; canEdit: boolean; onClose: () => void; go: PageProps["go"]; onComplete: (id: string) => void }) {
  const { notify } = useApp();
  const [assignSel, setAssignSel] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const cust = w?.customerId ? customerOf(w.customerId) : null;
  const link = linkedLink(w?.linkedId ?? null);
  const events: TimelineEvent[] = (w?.history ?? []).map((h, i) => ({ id: `${w?.id}-${i}`, at: h.at.toISOString(), when: dateTime(h.at), title: WORK_STATUS_LABEL[h.status], description: h.by, tone: h.status === "tamamlandi" ? "success" : h.status === "iptal" ? "danger" : "neutral" }));
  const nextStatus = w && isOpen(w) ? WORK_FLOW[WORK_FLOW.indexOf(w.status) + 1] : null;
  const advance = () => {
    if (!w || !nextStatus) return;
    if (nextStatus === "tamamlandi") return onComplete(w.id);
    if (!w.assignee) assignWorkOrder(w.id, crewOf(w.regionId));
    advanceWorkOrder(w.id);
    notify({ title: `${w.id} ${WORK_STATUS_LABEL[nextStatus]} Durumuna Geçti`, tone: "success" });
  };
  const meter = w?.meterId ?? (w?.customerId ? metersFor(w.customerId)[0]?.id : undefined);
  return (
    <>
      <Sheet
        open={!!w}
        onOpenChange={(o) => !o && onClose()}
        side="right"
        size="xl"
        title={w ? `${w.id} · ${WORK_TYPE_LABEL[w.type]}` : ""}
        description={w ? `${fullDate.format(w.scheduled)}, ${clock.format(w.scheduled)} · ${region(w.regionId).name}` : undefined}
        status={w ? <Badge tone={STATUS_TONE[w.status]} dot>{WORK_STATUS_LABEL[w.status]}</Badge> : undefined}
        icon={w ? <IconTile tone={w.type === "kesme" || w.type === "ariza" ? "danger" : "primary"}><Wrench /></IconTile> : undefined}
        footerStart={w && canEdit && isOpen(w) ? <Button variant="danger" size="sm" onClick={() => setCancelOpen(true)}>İptal Et</Button> : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>Kapat</Button>
            {w && canEdit && nextStatus ? <Button variant="primary" onClick={advance}>{nextStatus === "tamamlandi" ? "Tamamla" : `${WORK_STATUS_LABEL[nextStatus]} Olarak İşaretle`}</Button> : null}
          </>
        }
      >
        {w ? (
          <div className="grid gap-5">
            <p className="rounded-lg bg-surface p-3 text-base text-strong">{w.reason}</p>
            {isOpen(w) ? (
              <FactorList
                title="Neden Önce Yapılmalı"
                headingLevel={3}
                severity={slaLeft(w) < 0 ? "high" : slaLeft(w) < 2 ? "medium" : "low"}
                factors={[
                  { label: "SLA", value: slaLeft(w) < 0 ? `${fmtDur(-slaLeft(w) * 60)} Aşıldı` : `${fmtDur(slaLeft(w) * 60)} Kaldı`, hint: `${w.slaHours} saat hedef`, tone: slaLeft(w) < 0 ? "danger" : slaLeft(w) < 2 ? "warning" : "neutral" },
                  { label: "Ekip", value: w.assignee ? "Atandı" : "Atanmadı", hint: w.assignee ?? "Önce ekip yönlendir", tone: w.assignee ? "neutral" : "warning" },
                  { label: "Bağlı Kayıt", value: link ? link.label : "Yok", hint: link ? "Arıza ya da çağrıyla bağlantılı" : "Bağımsız iş emri", tone: "neutral" },
                  { label: "Açık Kalma", value: fmtDur(Math.round(elapsedH(w) * 60)), hint: "Açılıştan bu yana", tone: "neutral" },
                ]}
              />
            ) : null}
            <dl className="grid gap-x-4 gap-y-2 text-small sm:grid-cols-2">
              <div><dt className="text-muted">Abone</dt><dd className="font-medium text-strong">{cust ? <a href={href("customers", { id: cust.id })} className="hover:underline">{cust.name}</a> : "Bölge geneli"}</dd></div>
              <div><dt className="text-muted">Sayaç</dt><dd className="font-medium text-strong">{meter ? <a href={href("meters", { id: meter })} className="kz-mono hover:underline">{meter}</a> : "—"}</dd></div>
              <div><dt className="text-muted">Bağlı Kayıt</dt><dd className="font-medium text-strong">{link ? <a href={link.to} className="hover:underline">{link.label}</a> : "—"}</dd></div>
              <div><dt className="text-muted">Atanan</dt><dd className="font-medium text-strong">{w.assignee ?? "Atanmadı"}</dd></div>
              <div><dt className="text-muted">SLA</dt><dd className="font-medium text-strong"><SlaBadge w={w} />{!isOpen(w) ? `${w.slaHours} saat hedefti` : ""}</dd></div>
              <div><dt className="text-muted">Açılış</dt><dd className="font-medium text-strong">{dateTime(w.createdAt)}</dd></div>
            </dl>
            {w.result && (w.result.oldSerial || w.result.newSerial || w.result.note) ? (
              <section aria-label="Sonuç" className="grid gap-1 rounded-lg bg-surface p-3 text-small">
                <h3 className="text-read font-semibold text-strong">Sonuç</h3>
                {w.result.oldSerial ? <p>Sökülen sayaç: <span className="kz-mono font-medium text-strong">{w.result.oldSerial}</span>{w.result.oldIndex !== undefined ? ` · son endeks ${fmtNum(w.result.oldIndex)}` : ""}</p> : null}
                {w.result.newSerial ? <p>Takılan sayaç: <span className="kz-mono font-medium text-strong">{w.result.newSerial}</span>{w.result.newIndex !== undefined ? ` · ilk endeks ${fmtNum(w.result.newIndex)}` : ""}</p> : null}
                {w.result.seal ? <p>Mühür: <span className="kz-mono font-medium text-strong">{w.result.seal}</span></p> : null}
                {w.result.note ? <p className="text-body">{w.result.note}</p> : null}
              </section>
            ) : null}
            {canEdit && isOpen(w) ? (
              <section aria-label="Atama" className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                <Select label="Ekip Ata" items={CREWS.map((c) => ({ value: c, label: c }))} value={assignSel ?? w.assignee} onValueChange={setAssignSel} placeholder="Ekip seç" />
                <Button size="sm" variant="secondary" disabled={!assignSel || assignSel === w.assignee} onClick={() => assignSel && (assignWorkOrder(w.id, assignSel), notify({ title: `${w.id}: Ekip Atandı`, body: assignSel, tone: "success" }))}>Ata</Button>
              </section>
            ) : null}
            <section aria-label="Geçmiş" className="grid gap-2">
              <h3 className="text-read font-semibold text-strong">Durum Geçmişi</h3>
              <Timeline events={events} />
            </section>
          </div>
        ) : null}
      </Sheet>
      <Dialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="İş Emri İptal Edilsin mi?"
        description={w ? `${w.id} · ${WORK_TYPE_LABEL[w.type]}` : undefined}
        footer={
          <>
            <Button variant="ghost" data-autofocus onClick={() => setCancelOpen(false)}>Vazgeç</Button>
            <Button variant="danger" disabled={reason.trim().length < 3} onClick={() => { if (!w) return; cancelWorkOrder(w.id, reason.trim()); setCancelOpen(false); setReason(""); notify({ title: `${w.id} İptal Edildi`, body: reason.trim(), tone: "info" }); go("workorders", { tab: view, id: w.id }); }}>İptal Et</Button>
          </>
        }
      >
        <Textarea label="İptal Gerekçesi" value={reason} onChange={(e) => setReason(e.target.value)} minRows={3} />
        <p className="mt-2 text-small text-muted">Kesme ve bağlama emri iptal edilince abonedeki bekleyen işlem de kalkar. Bu işlem geri alınamaz.</p>
      </Dialog>
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Tamamlama ve yeni iş emri                                                 */
/* ------------------------------------------------------------------------ */

function CompleteDialog({ w, onClose }: { w: WorkOrderX | null; onClose: () => void }) {
  const { notify } = useApp();
  const [f, setF] = useState({ oldSerial: "", oldIndex: "", newSerial: "", newIndex: "", seal: "", note: "" });
  const swap = w?.type === "sayac-degisim" || w?.type === "sokum";
  const invalid = swap && (!f.oldSerial.trim() || (w?.type === "sayac-degisim" && !f.newSerial.trim()));
  const submit = () => {
    if (!w) return;
    const result: WorkResult = { ...(f.oldSerial ? { oldSerial: f.oldSerial.trim() } : {}), ...(f.oldIndex ? { oldIndex: Number(f.oldIndex) } : {}), ...(f.newSerial ? { newSerial: f.newSerial.trim() } : {}), ...(f.newIndex ? { newIndex: Number(f.newIndex) } : {}), ...(f.seal ? { seal: f.seal.trim() } : {}), ...(f.note ? { note: f.note.trim() } : {}) };
    if (!w.assignee) assignWorkOrder(w.id, crewOf(w.regionId));
    // Durum makinesi ileri akar: tamamlanmaya kadar kalan adımlar sırayla işlenir.
    const from = WORK_FLOW.indexOf(w.status);
    for (let i = from; i < WORK_FLOW.length - 1; i++) advanceWorkOrder(w.id, i === WORK_FLOW.length - 2 ? result : undefined);
    notify({ title: `${w.id} Tamamlandı`, body: w.type === "kesme" ? "Enerji kesildi, abone durumu güncellendi" : w.type === "baglama" ? "Enerji yeniden bağlandı" : w.type === "sayac-degisim" ? "Sayaç değişimi işlendi, stok güncellendi" : "Saha sonucu kaydedildi", tone: "success" });
    setF({ oldSerial: "", oldIndex: "", newSerial: "", newIndex: "", seal: "", note: "" });
    onClose();
  };
  const doneChecks: PolicyCheck[] = [
    { id: "eski", label: "Sökülen Sayaç", detail: f.oldSerial.trim() ? "Seri numarası girildi" : "Seri numarası gerekli", state: f.oldSerial.trim() ? "pass" : "fail" },
    ...(w?.type === "sayac-degisim"
      ? [{ id: "yeni", label: "Takılan Sayaç", detail: f.newSerial.trim() ? "Seri numarası girildi" : "Seri numarası gerekli", state: (f.newSerial.trim() ? "pass" : "fail") as PolicyCheck["state"] }]
      : []),
    { id: "muhur", label: "Mühür", detail: f.seal.trim() ? "Mühür numarası girildi" : "Mühür numarası girilmedi", state: f.seal.trim() ? "pass" : "warn" },
  ];
  const field = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <Dialog
      open={!!w}
      onOpenChange={(o) => !o && onClose()}
      size="lg"
      title="İş Emrini Tamamla"
      description={w ? `${w.id} · ${WORK_TYPE_LABEL[w.type]}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button variant="primary" onClick={submit} disabled={!!invalid}>Tamamla</Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {swap ? (
          <>
            <Input label="Sökülen Sayaç Seri No" value={f.oldSerial} onChange={field("oldSerial")} />
            <Input label="Son Endeks (kWh)" inputMode="numeric" value={f.oldIndex} onChange={field("oldIndex")} />
            {w?.type === "sayac-degisim" ? (
              <>
                <Input label="Takılan Sayaç Seri No" value={f.newSerial} onChange={field("newSerial")} hint="Stoktaki bir seri numarası yazılırsa tahsisli olur." />
                <Input label="İlk Endeks (kWh)" inputMode="numeric" value={f.newIndex} onChange={field("newIndex")} />
              </>
            ) : null}
            <Input label="Mühür No" value={f.seal} onChange={field("seal")} />
            <span className="hidden sm:block" />
          </>
        ) : null}
        <div className="sm:col-span-2">
          <Textarea label="Saha Notu" value={f.note} onChange={field("note")} minRows={2} />
        </div>
        {w?.type === "sayac-degisim" && f.oldSerial.trim() && f.newSerial.trim() ? (
          <div className="sm:col-span-2">
            <ValueDiff
              rows={[
                { label: "Sökülen Sayaç", groups: chunk(f.oldSerial.trim()), tone: "bad", note: f.oldIndex ? `Son endeks ${fmtNum(Number(f.oldIndex) || 0)} kWh` : undefined },
                { label: "Takılan Sayaç", groups: chunk(f.newSerial.trim()), tone: "good", note: f.newIndex ? `İlk endeks ${fmtNum(Number(f.newIndex) || 0)} kWh` : undefined },
              ]}
            />
          </div>
        ) : null}
        {swap ? (
          <div className="sm:col-span-2">
            <PolicyChecks title="Tamamlama Kontrolleri" checks={doneChecks} />
          </div>
        ) : null}
        {w?.type === "kesme" ? (
          <div className="sm:col-span-2">
            <InsightCallout kind="warning" label="Sonuç" title="Enerji Kesilecek" headingLevel={3}>Tamamlanınca abone enerjisi kesildi olarak işaretlenir ve sayaç rölesi açılır.</InsightCallout>
          </div>
        ) : null}
        {w?.type === "baglama" ? (
          <div className="sm:col-span-2">
            <InsightCallout kind="success" label="Sonuç" title="Enerji Yeniden Bağlanır" headingLevel={3}>Tamamlanınca enerji yeniden bağlanır ve kesme aşaması temizlenir.</InsightCallout>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}

function CreateDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (w: WorkOrderX) => void }) {
  const items: ComboboxItem[] = useMemo(() => allCustomers().map((c) => ({ value: c.id, label: `${c.name} · Tesisat ${c.installation}` })), []);
  const [type, setType] = useState<string | null>("kontrol");
  const [cust, setCust] = useState<ComboboxItem | null>(null);
  const [reg, setReg] = useState<string | null>("merkez");
  const [crew, setCrew] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const submit = () => {
    if (!type) return;
    const w = createWorkOrder({ type: type as WorkType, customerId: cust?.value ?? null, regionId: cust ? customerOf(cust.value).regionId : reg ?? undefined, reason: reason.trim() || WORK_TYPE_LABEL[type as WorkType], assignee: crew ?? undefined, scheduled: scheduleSlot() });
    setReason("");
    setCust(null);
    onCreated(w);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      size="lg"
      title="İş Emri Aç"
      description="Planlı zaman iş gününe ve mesaiye oturur; abone seçilirse bölge ondan gelir."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button variant="primary" onClick={submit} disabled={!type || reason.trim().length < 3}>İş Emri Aç</Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="İş Türü" items={TYPE_ORDER.map((t) => ({ value: t, label: WORK_TYPE_LABEL[t] }))} value={type} onValueChange={setType} />
        <Select label="Ekip (İsteğe Bağlı)" items={CREWS.map((c) => ({ value: c, label: c }))} value={crew} onValueChange={setCrew} placeholder="Sonra ata" />
        <Combobox label="Abone" items={items} value={cust} onValueChange={setCust} placeholder="Ad ya da tesisat no" emptyText="Eşleşen abone yok." />
        <Select label="Bölge" items={REGIONS.map((r) => ({ value: r.id, label: r.name }))} value={cust ? customerOf(cust.value).regionId : reg} onValueChange={setReg} disabled={!!cust} />
        <div className="sm:col-span-2">
          <Textarea label="Neden" value={reason} onChange={(e) => setReason(e.target.value)} minRows={2} />
        </div>
      </div>
    </Dialog>
  );
}
