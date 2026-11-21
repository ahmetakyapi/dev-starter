"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, ClipboardList, FilePlus2, Gauge, MessageSquare, Wallet, X, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import type { FilterGroup, FilterValue } from "@/components/ui/filter-sheet";
import { Input } from "@/components/ui/input";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import type { SavedView } from "@/components/ui/saved-views";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { StageBars } from "@/components/ui/stage-bars";
import { TickMeter } from "@/components/ui/tick-meter";
import { Textarea } from "@/components/ui/textarea";
import { Timeline, type TimelineEvent } from "@/components/ui/timeline";
import { audit } from "./_audit";
import { REGIONS, TODAY, daysBetween, dayLabel, parseDay, region } from "./_data";
import { CITY_DISTRICTS } from "./_data-musteri";
import {
  APPLICATION_KIND_LABEL,
  APPLICATION_STAGES,
  type Application,
  type ApplicationKind,
  type ApplicationStage,
} from "./_data-yeni";
import { EmptyStateX, FilterBar, PageHero, fmtDec, fmtNum, fmtTl, useListKeys } from "./_kit";
import { useCan } from "./_permissions";
import { applicationsOpen } from "./_selectors";
import {
  WORK_STATUS_LABEL,
  WORK_TYPE_LABEL,
  advanceApplication,
  allocateStock,
  applicationGate,
  createApplication,
  getApplications,
  payApplicationFee,
  rejectApplication,
  toggleApplicationDoc,
  useApplications,
  useStock,
  useWorkOrders,
} from "./_store";
import { PageBody, PageHead, Panel, href, useApp, type PageProps } from "./_ui";

/** Aşamada bekleme sınırı (gün): ÖRNEK hedef süreler; aşılınca SLA rozeti çıkar. */
const SLA_DAYS: Record<ApplicationStage, number> = { basvuru: 3, evrak: 5, kesif: 7, bedel: 5, montaj: 7, enerji: 3, tamam: 0, red: 0 };
const STAGE_ORDER = APPLICATION_STAGES.map((s) => s.id);
const stageIndex = (s: ApplicationStage) => (s === "red" ? -1 : STAGE_ORDER.indexOf(s as (typeof STAGE_ORDER)[number]));
const stageLabel = (s: ApplicationStage) => (s === "red" ? "Reddedildi" : (APPLICATION_STAGES.find((x) => x.id === s)?.label ?? s));
const isOpen = (a: Application) => a.stage !== "tamam" && a.stage !== "red";
const daysIn = (a: Application) => Math.max(0, daysBetween(parseDay(a.stageSince), TODAY));
const slaOver = (a: Application) => (isOpen(a) ? Math.max(0, daysIn(a) - SLA_DAYS[a.stage]) : 0);
const docsDone = (a: Application) => a.docs.filter((d) => d.ok).length;
const totalDays = (a: Application) => Math.max(0, daysBetween(parseDay(a.createdAt), parseDay(a.stageSince)));

const VIEWS: readonly { id: string; label: string; match: (a: Application) => boolean }[] = [
  { id: "all", label: "Tümü", match: () => true },
  { id: "acik", label: "Açık", match: isOpen },
  { id: "sla", label: "SLA Aşımı", match: (a) => slaOver(a) > 0 },
  { id: "evrak", label: "Evrak Eksik", match: (a) => isOpen(a) && docsDone(a) < a.docs.length },
  { id: "bedel", label: "Bedel Bekliyor", match: (a) => isOpen(a) && !a.feePaid && stageIndex(a.stage) >= stageIndex("bedel") },
  { id: "montaj", label: "Montaj", match: (a) => a.stage === "montaj" || a.stage === "enerji" },
  { id: "tamam", label: "Tamamlanan", match: (a) => a.stage === "tamam" },
  { id: "red", label: "Reddedilen", match: (a) => a.stage === "red" },
];

/** Satırın tamamı tıklanır: tablo içindeki ad bağlantısını (`data-row`) tetikler; klavye için asıl bağlantı durur. */
function RowClickable({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useListKeys(root);
  return (
    <div
      ref={root}
      className="[&_tbody_tr]:cursor-pointer"
      onClick={(event) => {
        const el = event.target as HTMLElement;
        if (el.closest("a,button,input,label,[role=checkbox]")) return;
        el.closest("tr")?.querySelector<HTMLAnchorElement>("a[data-row]")?.click();
      }}
    >
      {children}
    </div>
  );
}

const STAGE_TONE = (s: ApplicationStage) => (s === "tamam" ? "success" : s === "red" ? "danger" : "primary") as "success" | "danger" | "primary";

export function BasvurularPage({ params, go }: PageProps) {
  const { notify } = useApp();
  const canEdit = useCan("musteri");
  const apps = useApplications();
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);

  const viewId = VIEWS.some((v) => v.id === params.g) ? params.g : "all";
  const view = VIEWS.find((v) => v.id === viewId) ?? VIEWS[0];
  const selected = params.id ? apps.find((a) => a.id === params.id) : undefined;
  const set = (patch: Record<string, string | undefined>) => go("applications", { ...params, id: undefined, ...patch });

  const fold = (s: string) => s.toLocaleLowerCase("tr-TR");
  const rows = useMemo(() => {
    const needle = fold(q.trim());
    const list = apps.filter((a) => {
      if (!view.match(a)) return false;
      if (params.kind && a.kind !== params.kind) return false;
      if (params.volt && a.voltage !== params.volt) return false;
      if (params.region && a.regionId !== params.region) return false;
      if (params.stage && a.stage !== params.stage) return false;
      return !needle || fold(`${a.id} ${a.applicant} ${a.address}`).includes(needle);
    });
    const dir = params.dir === "asc" ? 1 : -1;
    const key = params.sort ?? "sla";
    const value = (a: Application): number | string =>
      key === "id" ? a.id : key === "power" ? a.powerKw : key === "fee" ? a.connectionFee : key === "days" ? daysIn(a) : slaOver(a) * 1000 + daysIn(a) + (isOpen(a) ? 100_000 : 0);
    return [...list].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "tr-TR")) * dir;
    });
  }, [apps, view, q, params.kind, params.volt, params.region, params.stage, params.sort, params.dir]);

  const open = applicationsOpen();
  const stats = {
    open: open.length,
    sla: apps.filter((a) => slaOver(a) > 0).length,
    docs: apps.filter((a) => isOpen(a) && docsDone(a) < a.docs.length).length,
    fee: apps.filter((a) => isOpen(a) && !a.feePaid && stageIndex(a.stage) >= stageIndex("bedel")).length,
    montaj: apps.filter((a) => a.stage === "montaj" || a.stage === "enerji").length,
    done: apps.filter((a) => a.stage === "tamam"),
  };
  const avgDays = stats.done.length ? stats.done.reduce((s, a) => s + totalDays(a), 0) / stats.done.length : 0;

  // Huni: aşamaya ulaşan başvuru sayısı (reddedilenler hariç)
  const live = apps.filter((a) => a.stage !== "red");
  const funnel = APPLICATION_STAGES.map((s, i) => ({ label: s.label, value: live.filter((a) => stageIndex(a.stage) >= i).length, note: s.hint }));

  const viewItems: SavedView[] = VIEWS.map((v) => ({ id: v.id, label: v.label, count: apps.filter(v.match).length, builtin: true }));
  const chips = [
    ...(params.kind ? [{ id: "kind", label: "Tür", value: APPLICATION_KIND_LABEL[params.kind as ApplicationKind] ?? params.kind }] : []),
    ...(params.volt ? [{ id: "volt", label: "Gerilim", value: params.volt === "OG" ? "Orta gerilim" : "Alçak gerilim" }] : []),
    ...(params.region ? [{ id: "region", label: "Bölge", value: REGIONS.find((r) => r.id === params.region)?.name ?? params.region }] : []),
    ...(params.stage ? [{ id: "stage", label: "Aşama", value: stageLabel(params.stage as ApplicationStage) }] : []),
    ...(q.trim() ? [{ id: "q", label: "Arama", value: q.trim() }] : []),
  ];
  const groups: FilterGroup[] = [
    { id: "kind", label: "Başvuru Türü", options: (Object.keys(APPLICATION_KIND_LABEL) as ApplicationKind[]).map((k) => ({ value: k, label: APPLICATION_KIND_LABEL[k] })) },
    { id: "volt", label: "Gerilim", options: [{ value: "AG", label: "Alçak Gerilim (AG)" }, { value: "OG", label: "Orta Gerilim (OG)" }] },
    { id: "region", label: "Bölge", options: REGIONS.map((r) => ({ value: r.id, label: r.name })) },
    { id: "stage", label: "Aşama", options: [...APPLICATION_STAGES.map((s) => ({ value: s.id, label: s.label })), { value: "red", label: "Reddedildi" }] },
  ];
  const drawerValue: FilterValue = { kind: params.kind ? [params.kind] : [], volt: params.volt ? [params.volt] : [], region: params.region ? [params.region] : [], stage: params.stage ? [params.stage] : [] };
  const clear = () => {
    setQ("");
    go("applications", { g: params.g });
  };

  // Telefonda satır, ayrıntıya bağlanır
  const items: RecordItem[] = rows.map((a) => ({
    id: a.id,
    title: a.applicant,
    subtitle: `${a.id} · ${APPLICATION_KIND_LABEL[a.kind]} · ${fmtNum(a.powerKw)} kW ${a.voltage}`,
    value: fmtTl(a.connectionFee, 0),
    meta: `${region(a.regionId).name} · ${isOpen(a) ? `${daysIn(a)} gündür bu aşamada` : stageLabel(a.stage)}`,
    status: (
      <span className="flex flex-wrap gap-1">
        <Badge tone={STAGE_TONE(a.stage)}>{stageLabel(a.stage)}</Badge>
        {slaOver(a) > 0 ? <Badge tone="danger">SLA +{slaOver(a)} gün</Badge> : null}
      </span>
    ),
    href: href("applications", { ...params, id: a.id }),
  }));

  const columns: Column<Application>[] = [
    {
      key: "id",
      header: "Başvuru",
      sortable: true,
      sortValue: (a) => a.id,
      width: "15rem",
      render: (a) => (
        <div className="min-w-0">
          <a data-row href={href("applications", { ...params, id: a.id })} className="block truncate font-medium text-strong hover:underline">
            {a.applicant}
          </a>
          <span className="kz-mono text-small text-muted">{a.id}</span>
        </div>
      ),
    },
    { key: "kind", header: "Tür", render: (a) => APPLICATION_KIND_LABEL[a.kind] },
    {
      key: "loc",
      header: "Konum",
      render: (a) => (
        <div className="min-w-0">
          <span className="block truncate text-body">{region(a.regionId).name} · {a.district}</span>
          <span className="block truncate text-small text-muted">{a.address.split(",")[0]}</span>
        </div>
      ),
    },
    { key: "power", header: "Güç", numeric: true, sortable: true, sortValue: (a) => a.powerKw, render: (a) => `${fmtNum(a.powerKw)} kW ${a.voltage}` },
    {
      key: "stage",
      header: "Aşama",
      render: (a) => (
        <div className="flex flex-col items-start gap-1">
          <Badge tone={STAGE_TONE(a.stage)}>{stageLabel(a.stage)}</Badge>
          {isOpen(a) ? <span className="text-small text-muted">Evrak {docsDone(a)}/{a.docs.length}</span> : null}
        </div>
      ),
    },
    {
      key: "days",
      header: "Süre",
      numeric: true,
      sortable: true,
      sortValue: (a) => slaOver(a) * 1000 + daysIn(a),
      render: (a) =>
        isOpen(a) ? (
          <div className="flex flex-col items-end gap-1">
            <span>{daysIn(a)} gün</span>
            {slaOver(a) > 0 ? <Badge tone="danger">SLA +{slaOver(a)} gün</Badge> : <span className="text-small text-muted">hedef {SLA_DAYS[a.stage]} gün</span>}
          </div>
        ) : (
          <span className="text-muted">{a.stage === "tamam" ? `${totalDays(a)} günde tamam` : "—"}</span>
        ),
    },
    { key: "assigned", header: "Atanan", render: (a) => a.assignedTo },
    {
      key: "fee",
      header: "Bağlantı Bedeli",
      numeric: true,
      sortable: true,
      sortValue: (a) => a.connectionFee,
      render: (a) => (
        <div className="flex flex-col items-end gap-1">
          <span>{fmtTl(a.connectionFee, 0)}</span>
          <span className={`text-small ${a.feePaid ? "text-success" : "text-muted"}`}>{a.feePaid ? "Tahsil edildi" : "Bekliyor"}</span>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHead
        title="Başvurular"
        description="Yeni bağlantı, güç artırımı ve devir başvuruları: evrak, keşif, bağlantı bedeli, montaj ve enerjilendirme."
        actions={
          canEdit ? (
            <Button variant="primary" onClick={() => setCreating(true)}>
              <FilePlus2 /> Yeni Başvuru
            </Button>
          ) : null
        }
      />
      <PageBody>
        <PageHero
          primary={{ label: "Açık Başvuru", value: fmtNum(stats.open), foot: `${stats.sla} başvuru SLA hedefini aştı`, icon: <ClipboardList />, goodWhen: "down", to: { page: "applications", params: { g: "sla" } } }}
          secondary={[
            { label: "SLA Aşımı", value: fmtNum(stats.sla), foot: "Aşamada hedef süreyi geçenler", to: { page: "applications", params: { g: "sla" } } },
            { label: "Evrak Eksik", value: fmtNum(stats.docs), foot: "Belge tamamlanmadan keşif yok", to: { page: "applications", params: { g: "evrak" } } },
            { label: "Bedel Bekliyor", value: fmtNum(stats.fee), foot: "Tahsil edilmeden montaj yok", to: { page: "applications", params: { g: "bedel" } } },
            { label: "Montaj ve Enerji", value: fmtNum(stats.montaj), foot: "Sayaç tahsisi ve enerjilendirme", to: { page: "applications", params: { g: "montaj" } } },
            { label: "Enerjilenen", value: fmtNum(stats.done.length), foot: "Abonelik açılanlar", to: { page: "applications", params: { g: "tamam" } } },
            { label: "Başvurudan Enerjiye", value: stats.done.length ? `${fmtDec(avgDays, 1)} gün` : "—", foot: "Ticari kalite göstergesi (ortalama)" },
          ]}
        />

        <Panel title="Aşama Hunisi" note="Her aşamaya ulaşan başvuru sayısı (reddedilenler hariç)" id="basvuru-huni">
          <div className="p-4 sm:p-5">
            <StageBars title="Başvuru Aşama Hunisi" stages={funnel} />
          </div>
        </Panel>

        <Panel title="Başvuru Listesi" note={chips.length || viewId !== "all" ? `${fmtNum(rows.length)} sonuç, ${fmtNum(apps.length)} başvuru içinde` : "Varsayılan sıra: SLA aşanlar önce."} id="basvuru-liste">
          <div className="space-y-3 border-b border-line-soft px-4 py-3 sm:px-5">
            <FilterBar
              search={{ value: q, onChange: setQ, placeholder: "Başvuru no, ad ya da adres", label: "Başvuru Ara" }}
              filters={chips}
              onRemoveFilter={(id) => (id === "q" ? setQ("") : set({ [id]: undefined }))}
              onClearFilters={clear}
              summary={chips.length ? `${fmtNum(rows.length)} başvuru` : undefined}
              views={{ items: viewItems, value: viewId, onChange: (id) => set({ g: id === "all" ? undefined : id }) }}
              drawer={{
                groups,
                value: drawerValue,
                onChange: (v) => set({ kind: v.kind?.[0], volt: v.volt?.[0], region: v.region?.[0], stage: v.stage?.[0] }),
                resultCount: rows.length,
                resultLabel: (n) => `${fmtNum(n)} Başvuruyu Göster`,
              }}
            />
          </div>
          <div className="max-md:hidden">
            <RowClickable>
              <DataTable<Application>
                caption="Başvuru listesi"
                columns={columns}
                rows={rows}
                rowKey={(a) => a.id}
                sort={{ key: params.sort ?? "days", dir: params.dir === "asc" ? "asc" : "desc" }}
                sortHref={(key, dir) => href("applications", { ...params, id: undefined, sort: key, dir })}
                density="comfortable"
                on="surface"
                stickyFirst={false}
                minWidth="62rem"
                empty={<EmptyStateX title="Bu süzgece uyan başvuru yok." hint="Görünümü değiştirin ya da süzgeçleri temizleyin." action={<Button variant="secondary" size="sm" onClick={clear}>Süzgeçleri Temizle</Button>} />}
              />
            </RowClickable>
          </div>
          <div className="md:hidden">
            {items.length ? <RecordList label="Başvuru Listesi" items={items} /> : <EmptyStateX title="Bu süzgece uyan başvuru yok." action={<Button variant="secondary" size="sm" onClick={clear}>Süzgeçleri Temizle</Button>} />}
          </div>
        </Panel>
      </PageBody>

      <ApplicationSheet app={selected} onClose={() => go("applications", { ...params, id: undefined })} go={go} />
      <NewApplicationDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(a) => {
          notify({ title: "Başvuru Alındı", body: `${a.id} · ${a.applicant}`, tone: "success" });
          go("applications", { id: a.id });
        }}
      />
    </>
  );
}

/* ====================================================================== *
 *  AYRINTI ÇEKMECESİ
 * ====================================================================== */

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-small text-muted">{label}</dt>
      <dd className="mt-0.5 text-base font-medium text-strong">{value}</dd>
    </div>
  );
}

const NEXT_LABEL: Record<ApplicationStage, string> = {
  basvuru: "Evrak kontrolüne al",
  evrak: "Keşfe gönder",
  kesif: "Bedel ve sözleşmeye al",
  bedel: "Montaja gönder",
  montaj: "Enerjilendirmeye al",
  enerji: "Enerjilendir, abonelik aç",
  tamam: "",
  red: "",
};

function ApplicationSheet({ app, onClose, go }: { app: Application | undefined; onClose: () => void; go: PageProps["go"] }) {
  const { notify } = useApp();
  const canEdit = useCan("musteri");
  const canFee = useCan("odeme");
  const canStock = useCan("sayac");
  const stock = useStock();
  const work = useWorkOrders();
  const [rejecting, setRejecting] = useState(false);
  const [stockId, setStockId] = useState("");
  const free = useMemo(() => stock.filter((s) => s.status === "stokta"), [stock]);
  useEffect(() => {
    if (!free.some((s) => s.id === stockId)) setStockId(free[0]?.id ?? "");
  }, [free, stockId]);

  if (!app) return <Sheet open={false} onOpenChange={onClose} title="Başvuru" />;
  const closed = !isOpen(app);
  const gate = applicationGate(app);
  const idx = Math.max(stageIndex(app.stage), 0);
  const linked = work.filter((w) => w.linkedId === app.id);
  const missingDocs = app.docs.filter((d) => !d.ok);

  const events: TimelineEvent[] = [
    ...(app.stage === "tamam" || app.stage === "red" ? [{ id: "end", at: app.stageSince, when: dayLabel(app.stageSince), title: app.stage === "tamam" ? "Enerjilendi, abonelik açıldı" : "Başvuru reddedildi", description: app.note, tone: (app.stage === "tamam" ? "success" : "danger") as TimelineEvent["tone"] }] : [{ id: "stage", at: app.stageSince, when: dayLabel(app.stageSince), title: `${stageLabel(app.stage)} aşamasında`, description: `${daysIn(app)} gündür; hedef ${SLA_DAYS[app.stage]} gün`, tone: (slaOver(app) > 0 ? "danger" : "primary") as TimelineEvent["tone"] }]),
    ...linked.map((w) => ({ id: w.id, at: w.createdAt.toISOString(), when: dayLabel(w.createdAt.toISOString().slice(0, 10)), title: `${WORK_TYPE_LABEL[w.type]} iş emri ${w.id}`, description: WORK_STATUS_LABEL[w.status], tone: (w.status === "tamamlandi" ? "success" : "neutral") as TimelineEvent["tone"] })),
    { id: "created", at: app.createdAt, when: dayLabel(app.createdAt), title: "Başvuru Alındı", description: `${APPLICATION_KIND_LABEL[app.kind]} · ${app.assignedTo}`, tone: "neutral" },
  ];

  function advance() {
    const a = app!;
    const result = advanceApplication(a.id);
    if (!result.ok) {
      notify({ title: "Aşama Geçilemedi", body: result.reason, tone: "info" });
      return;
    }
    const after = getApplications().find((x) => x.id === a.id);
    if (after?.stage === "tamam") notify({ title: "Enerjilendi", body: after.note ?? "Abonelik açıldı", tone: "success" });
    else notify({ title: `${stageLabel(after?.stage ?? a.stage)} aşamasına geçti`, body: a.id, tone: "success" });
  }

  return (
    <>
      <Sheet
        open
        onOpenChange={(o) => !o && onClose()}
        side="right"
        size="lg"
        title={app.applicant}
        description={`${app.id} · ${APPLICATION_KIND_LABEL[app.kind]}`}
        status={<Badge tone={STAGE_TONE(app.stage)}>{stageLabel(app.stage)}</Badge>}
        footerStart={
          !closed && canEdit ? (
            <Button variant="ghost" onClick={() => setRejecting(true)} className="text-danger">
              <X /> Reddet
            </Button>
          ) : undefined
        }
        footer={
          closed ? (
            app.stage === "tamam" ? (
              <a className={buttonClass({ variant: "primary" })} href={href("customers", { q: app.applicant })}>
                Müşteriyi Gör <ArrowRight />
              </a>
            ) : (
              <Button variant="secondary" onClick={onClose}>Kapat</Button>
            )
          ) : (
            <>
              {app.stage === "enerji" ? (
                <a className={buttonClass({ variant: "secondary" })} href={href("register", { application: app.id })}>
                  Sihirbazla Tamamla
                </a>
              ) : null}
              <Button variant="primary" disabled={!canEdit} onClick={advance}>
                <Zap /> {NEXT_LABEL[app.stage]}
              </Button>
            </>
          )
        }
      >
        <div className="grid gap-5">
          {app.stage === "red" ? null : (
            <div className="grid gap-2">
              <p className="text-small font-medium text-muted">{app.stage === "tamam" ? "Süreç tamamlandı" : `Aşama ${Math.min(idx + 1, 6)} / 6 · ${stageLabel(app.stage)}`}</p>
              <TickMeter label="Başvuru Aşaması" value={app.stage === "tamam" ? 6 : idx} max={6} ticks={6} text={app.stage === "tamam" ? "6 / 6" : `${idx} / 6 tamam`} />
              <ol className="grid grid-cols-3 gap-x-2 gap-y-1 text-small text-muted sm:grid-cols-6">
                {APPLICATION_STAGES.slice(0, 6).map((s, i) => (
                  <li key={s.id} aria-current={i === idx && app.stage !== "tamam" ? "step" : undefined} className={i === idx && app.stage !== "tamam" ? "font-semibold text-strong" : i < idx || app.stage === "tamam" ? "text-body" : undefined}>
                    {s.label}
                    <span className="sr-only">{i < idx || app.stage === "tamam" ? " (tamamlandı)" : ""}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {!closed && !gate.ok ? (
            <div role="note" className="flex items-start gap-3 rounded-xl bg-warning-wash px-4 py-3 text-base ring-1 ring-warning/20">
              <ClipboardList aria-hidden className="mt-0.5 size-5 shrink-0 text-warning" />
              <p className="text-body"><strong className="font-semibold text-strong">Sonraki aşama için engel:</strong> {gate.reason}.</p>
            </div>
          ) : null}
          {app.stage === "red" ? <p role="note" className="rounded-xl bg-danger-wash px-4 py-3 text-base text-body ring-1 ring-danger/20">{app.note}</p> : null}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-surface p-4">
            <Fact label="Adres" value={app.address} />
            <Fact label="Bölge" value={`${region(app.regionId).name} · ${app.district}`} />
            <Fact label="Güç ve Gerilim" value={`${fmtNum(app.powerKw)} kW · ${app.voltage}`} />
            <Fact label="Atanan" value={app.assignedTo} />
          </dl>

          <Panel title="Evrak Kontrolü" note={`${docsDone(app)} / ${app.docs.length} tamam`} id="basvuru-evrak">
            <ul className="grid gap-1 p-4 sm:p-5">
              {app.docs.map((d) => (
                <li key={d.id}>
                  <Checkbox
                    label={d.label}
                    checked={d.ok}
                    disabled={closed || !canEdit}
                    onChange={() => toggleApplicationDoc(app.id, d.id)}
                  />
                </li>
              ))}
            </ul>
            {missingDocs.length && !closed && canEdit ? (
              <div className="border-t border-line-soft px-4 py-3 sm:px-5">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    audit("Eksik evrak SMS'i gönderdi", app.id, undefined, missingDocs.map((d) => d.label).join(", "));
                    notify({ title: "Eksik Evrak SMS'i Gönderildi", body: `${missingDocs.length} belge istendi.`, tone: "success" });
                  }}
                >
                  <MessageSquare /> Eksik Evrak SMS'i
                </Button>
              </div>
            ) : null}
          </Panel>

          <Panel title="Bağlantı ve Güvence Bedeli" note="Örnek hesap: güç ve gerilime göre" id="basvuru-bedel">
            <div className="grid gap-4 p-4 sm:p-5">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                <Fact label="Bağlantı Bedeli" value={fmtTl(app.connectionFee)} />
                <Fact label="Güvence Bedeli" value={fmtTl(app.deposit)} />
                <Fact label="Toplam" value={fmtTl(app.connectionFee + app.deposit)} />
              </dl>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge tone={app.feePaid ? "success" : "warning"} dot>{app.feePaid ? "Tahsil edildi" : "Tahsilat bekliyor"}</Badge>
                {!app.feePaid && !closed ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!canFee}
                    onClick={() => {
                      payApplicationFee(app.id);
                      notify({ title: "Bağlantı Bedeli Tahsil Edildi", body: `${fmtTl(app.connectionFee)} · ${app.id}`, tone: "success" });
                    }}
                  >
                    <Wallet /> Tahsilatı Kaydet
                  </Button>
                ) : null}
              </div>
            </div>
          </Panel>

          <Panel title="Sayaç Tahsisi" note={app.meterSerial ? `Tahsis edildi: ${app.meterSerial}` : "Montaj için stoktan sayaç ayrılır"} id="basvuru-sayac">
            <div className="grid gap-3 p-4 sm:p-5">
              {app.meterSerial ? (
                <p className="kz-mono flex items-center gap-2 text-base text-strong"><Gauge aria-hidden className="size-4 text-muted" /> {app.meterSerial}</p>
              ) : free.length ? (
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <Select label="Stoktaki Sayaç" value={stockId} onValueChange={(v) => v && setStockId(v)} items={free.slice(0, 40).map((s) => ({ value: s.id, label: `${s.serial} · ${s.model}` }))} />
                  <Button
                    variant="secondary"
                    disabled={!stockId || closed || !canStock}
                    onClick={() => {
                      if (allocateStock(stockId, { applicationId: app.id })) notify({ title: "Sayaç Tahsis Edildi", body: free.find((s) => s.id === stockId)?.serial, tone: "success" });
                    }}
                  >
                    Tahsis Et
                  </Button>
                </div>
              ) : (
                <p className="text-small text-muted">Stokta sayaç kalmadı.</p>
              )}
              {!canStock && !app.meterSerial ? <p className="text-small text-muted">Sayaç tahsisi için sayaç yetkisi gerekir.</p> : null}
            </div>
          </Panel>

          <Panel title="Süreç" note={linked.length ? `${linked.length} iş emri bağlı` : "Keşif ve montaj aşamalarında iş emri açılır"} id="basvuru-surec">
            <div className="p-4 sm:p-5">
              <Timeline events={events} />
              {linked.length ? (
                <p className="mt-3 text-small text-muted">
                  İş emirleri:{" "}
                  {linked.map((w) => (
                    <a key={w.id} href={href("workorders", { id: w.id })} className="kz-mono mr-2 font-medium text-primary-ink hover:underline">{w.id}</a>
                  ))}
                </p>
              ) : null}
            </div>
          </Panel>
        </div>
      </Sheet>
      <RejectDialog open={rejecting} onClose={() => setRejecting(false)} app={app} onDone={() => setRejecting(false)} />
    </>
  );
}

const REJECT_REASONS = ["Tapu bilgisi uyuşmadı", "Proje onaylanmadı", "Şebeke kapasitesi yetersiz", "Başvuru sahibi vazgeçti", "Eksik evrak süresinde tamamlanmadı"] as const;

function RejectDialog({ open, onClose, app, onDone }: { open: boolean; onClose: () => void; app: Application; onDone: () => void }) {
  const { notify } = useApp();
  const [reason, setReason] = useState<string>(REJECT_REASONS[0]);
  const [extra, setExtra] = useState("");
  const text = `Sayın ${app.applicant}, ${app.id} numaralı başvurunuz şu nedenle sonuçlandırılamadı: ${reason.toLocaleLowerCase("tr-TR")}${extra.trim() ? `. ${extra.trim()}` : "."} Ayrıntı için çağrı merkezimizi arayabilirsiniz.`;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Başvuruyu Reddet"
      description="Gerekçe kayda geçer ve başvuru sahibine SMS gider."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              rejectApplication(app.id, `${reason}${extra.trim() ? `: ${extra.trim()}` : ""}`);
              notify({ title: "Başvuru Reddedildi", body: `${app.id} · SMS iletildi`, tone: "info" });
              onDone();
            }}
          >
            Reddet ve SMS Gönder
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Select label="Gerekçe" value={reason} onValueChange={(v) => v && setReason(v)} items={REJECT_REASONS.map((r) => ({ value: r, label: r }))} />
        <Textarea label="Ek Not (İsteğe Bağlı)" value={extra} onChange={(e) => setExtra(e.target.value)} minRows={2} />
        <p className="rounded-lg bg-surface p-3 text-small text-body">
          <span className="block font-medium text-muted">SMS önizleme</span>
          {text}
        </p>
      </div>
    </Dialog>
  );
}

function NewApplicationDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (a: Application) => void }) {
  const [kind, setKind] = useState<ApplicationKind>("yeni");
  const [applicant, setApplicant] = useState("");
  const [area, setArea] = useState(CITY_DISTRICTS[0].value);
  const [street, setStreet] = useState("");
  const [power, setPower] = useState("8");
  const [voltage, setVoltage] = useState<"AG" | "OG">("AG");
  const kw = Number(power);
  const errors = {
    applicant: applicant.trim().length < 3 ? "Ad ya da unvan en az 3 karakter olmalı." : undefined,
    street: street.trim().length < 6 ? "Cadde, sokak ve kapı numarasını yazın." : undefined,
    power: !(kw > 0) ? "Güç sıfırdan büyük olmalı." : voltage === "AG" && kw > 55 ? "Alçak gerilimde 55 kW üstü için orta gerilim seçin." : voltage === "OG" && kw < 100 ? "Orta gerilimde güç en az 100 kW olmalı." : undefined,
  };
  const [touched, setTouched] = useState(false);
  const bad = Object.values(errors).some(Boolean);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Yeni Başvuru"
      description="Başvuru kaydı açılır; evrak kontrolüyle süreç başlar."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setTouched(true);
              if (bad) return;
              const [regionId, district] = area.split("|");
              const a = createApplication({ kind, applicant: applicant.trim(), regionId, district, address: `${street.trim()}, ${district}`, powerKw: kw, voltage });
              setApplicant("");
              setStreet("");
              setTouched(false);
              onClose();
              onCreated(a);
            }}
          >
            Başvuruyu Al
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Select label="Başvuru Türü" value={kind} onValueChange={(v) => v && setKind(v as ApplicationKind)} items={(Object.keys(APPLICATION_KIND_LABEL) as ApplicationKind[]).map((k) => ({ value: k, label: APPLICATION_KIND_LABEL[k] }))} />
        <Input label="Ad Soyad ya da Unvan" value={applicant} onChange={(e) => setApplicant(e.target.value)} error={touched ? errors.applicant : undefined} data-autofocus />
        <Select label="İlçe / Mahalle" value={area} onValueChange={(v) => v && setArea(v)} items={CITY_DISTRICTS.map((c) => ({ value: c.value, label: c.label }))} />
        <Input label="Cadde, Sokak ve Kapı No" value={street} onChange={(e) => setStreet(e.target.value)} error={touched ? errors.street : undefined} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Gerilim" value={voltage} onValueChange={(v) => { if (v) { setVoltage(v as "AG" | "OG"); setPower(v === "OG" ? "250" : "8"); } }} items={[{ value: "AG", label: "Alçak Gerilim (AG)" }, { value: "OG", label: "Orta Gerilim (OG)" }]} />
          <Input label="Talep Edilen Güç" suffix="kW" inputMode="decimal" value={power} onChange={(e) => setPower(e.target.value)} error={touched ? errors.power : undefined} />
        </div>
      </div>
    </Dialog>
  );
}

