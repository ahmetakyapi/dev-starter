"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, ClipboardList, Clock, MessageSquareText, Timer, Users, Wrench, Zap } from "lucide-react";
import { AreaChart } from "@/components/ui/area-chart";
import { Badge } from "@/components/ui/badge";
import { BarList } from "@/components/ui/bar-list";
import { Button } from "@/components/ui/Button";
import { ChartCard } from "@/components/ui/chart-card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { KanbanBoard, type KanbanCard, type KanbanColumn } from "@/components/ui/kanban-board";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { ScheduleList, type ScheduleItem } from "@/components/ui/schedule-list";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Stat, StatGrid } from "@/components/ui/stat";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Timeline, type TimelineEvent } from "@/components/ui/timeline";
import {
  CUSTOMERS,
  REGIONS,
  SUBSTATIONS,
  TODAY,
  TODAY_KEY,
  WORK_ORDERS,
  WORK_TYPE_LABEL,
  addDays,
  clock,
  customer,
  dateTime,
  dayKey,
  fullDate,
  num,
  outageDaily,
  parseDay,
  region,
  shortDate,
  substation,
  type Outage,
  type WorkOrder,
} from "./_data";
import { CREWS, OUTAGE_LIST, OUTAGE_SMS, affectedSample, minutesOf, outageByRegion, outageTimeline, reliability } from "./_data-operasyon";
import { CARD, IconTile, MetricStrip, OutageBadge, PageBody, PageHead, Panel, SampleNote, href, useApp, type PageProps } from "./_ui";

/* ------------------------------------------------------------------------ */
/* Yardımcılar                                                               */
/* ------------------------------------------------------------------------ */

const duration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? (m ? `${h} sa ${m} dk` : `${h} sa`) : `${m} dk`;
};

const KINDS = ["acik", "planli", "is-emri", "gecmis"] as const;
type TabId = (typeof KINDS)[number];

/** Sayfa içinde değişen kayıt: ekip, tahmini süre, kapatma ve günlük satırları. */
type Override = { crew?: string; eta?: number; closed?: boolean; smsSent?: boolean; log: readonly { at: Date; title: string; body?: string }[] };

function Cell({ icon, label, value, foot, tone }: { icon: ReactNode; label: string; value: string; foot: string; tone?: "warning" | "danger" | "neutral" }) {
  return (
    <div className="relative flex h-full flex-col gap-3 p-4 sm:p-5">
      <IconTile tone={tone ?? "neutral"} className="absolute top-4 right-4 sm:top-5 sm:right-5">
        {icon}
      </IconTile>
      <div className="pr-10">
        <StatGrid className="grid-cols-1 sm:grid-cols-1">
          <Stat label={label} value={value} />
        </StatGrid>
      </div>
      <p className="mt-auto border-t border-dashed border-line pt-3 text-small text-muted">{foot}</p>
    </div>
  );
}

const REGION_OPTIONS = REGIONS.map((r) => ({ value: r.id, label: r.name }));
const CREW_OPTIONS = CREWS.map((c) => ({ value: c, label: c }));
const PLAN_CAUSES = ["Hat bakımı", "Trafo değişimi", "Yeni şebeke bağlantısı", "Direk değişimi"].map((c) => ({ value: c, label: c }));
const ETA_OPTIONS = [30, 60, 90, 120, 180, 240].map((m) => ({ value: String(m), label: duration(m) }));

const WORK_TONE: Record<WorkOrder["type"], "neutral" | "primary" | "chart-1" | "chart-4" | "chart-6"> = {
  kesme: "chart-6",
  baglama: "chart-1",
  "sayac-degisim": "chart-4",
  "okuma-turu": "neutral",
  kontrol: "primary",
};

/* ------------------------------------------------------------------------ */
/* Sayfa                                                                     */
/* ------------------------------------------------------------------------ */

export function ArizaPage({ params, go }: PageProps) {
  const { notify } = useApp();
  const tab: TabId = (KINDS as readonly string[]).includes(params.tab ?? "") ? (params.tab as TabId) : "acik";

  /* Yerel durum (bu oturumda): ekip/süre/kapatma, planlanan çalışmalar, SMS penceresi. */
  const [ov, setOv] = useState<Readonly<Record<string, Override>>>({});
  const [extraPlanned, setExtraPlanned] = useState<readonly Outage[]>([]);
  const [planOpen, setPlanOpen] = useState(false);
  const [smsFor, setSmsFor] = useState<Outage | null>(null);
  const [closeFor, setCloseFor] = useState<Outage | null>(null);
  const [orderOpen, setOrderOpen] = useState<WorkOrder | null>(null);
  const [cancelled, setCancelled] = useState<ReadonlySet<string>>(new Set());

  const all = useMemo(() => [...extraPlanned, ...OUTAGE_LIST], [extraPlanned]);
  const effective = (o: Outage): Outage => {
    const x = ov[o.id];
    if (!x?.closed) return o;
    return { ...o, status: "cozuldu", end: TODAY };
  };
  const list = all.map(effective).filter((o) => !cancelled.has(o.id));
  const open = list.filter((o) => o.status === "acik");
  const planned = list.filter((o) => o.status === "planlandi").sort((a, b) => a.start.getTime() - b.start.getTime());
  const history = list.filter((o) => o.status === "cozuldu");

  const patch = (id: string, change: Partial<Override>, log?: Override["log"][number]) =>
    setOv((m) => ({ ...m, [id]: { ...m[id], ...change, log: [...(m[id]?.log ?? []), ...(log ? [log] : [])] } }));

  const regionAffected = (o: Outage) => num.format(o.affected);

  const detail = params.id ? list.find((o) => o.id === params.id) : undefined;
  const reliab = reliability(30);

  /* ---------------- İşlemler ---------------- */
  const assignCrew = (o: Outage, crew: string) => {
    patch(o.id, { crew }, { at: TODAY, title: `Ekip değişti: ${crew}` });
    notify({ title: `${o.id}: ekip atandı`, body: crew, tone: "success" });
  };
  const updateEta = (o: Outage, minutes: number) => {
    patch(o.id, { eta: minutes }, { at: TODAY, title: `Tahmini süre güncellendi: ${duration(minutes)}` });
    notify({ title: `${o.id}: tahmini süre ${duration(minutes)}`, body: "Müşteri bilgilendirmesi için SMS gönderebilirsiniz", tone: "info" });
  };
  const sendSms = (o: Outage) => {
    patch(o.id, { smsSent: true }, { at: TODAY, title: `${num.format(o.affected)} aboneye SMS gönderildi` });
    notify({ title: "SMS duyurusu gönderildi", body: `${region(o.regionId).name} · ${num.format(o.affected)} abone`, tone: "success" });
    setSmsFor(null);
  };
  const closeOutage = (o: Outage) => {
    patch(o.id, { closed: true }, { at: TODAY, title: "Enerji verildi, kayıt kapatıldı" });
    notify({ title: `${o.id} kapatıldı`, body: `${num.format(o.affected)} abonenin enerjisi verildi · toplam ${duration(minutesOf({ ...o, end: TODAY }))}`, tone: "success" });
    setCloseFor(null);
  };

  /* ---------------- Ayrıntı ---------------- */
  if (params.id && detail) {
    return (
      <>
        <OutageDetail
          o={detail}
          ov={ov[detail.id]}
          go={go}
          onCrew={(c) => assignCrew(detail, c)}
          onEta={(m) => updateEta(detail, m)}
          onSms={() => setSmsFor(detail)}
          onClose={() => setCloseFor(detail)}
          onCancel={() => {
            setCancelled((s) => new Set(s).add(detail.id));
            notify({ title: `${detail.id} iptal edildi`, body: "Planlı çalışma duyurusu geri çekilecek", tone: "info" });
            go("outages", { tab: "planli" });
          }}
        />
        <SmsDialog o={smsFor} onClose={() => setSmsFor(null)} onSend={sendSms} />
        <CloseDialog o={closeFor} onClose={() => setCloseFor(null)} onConfirm={closeOutage} />
      </>
    );
  }

  /* ---------------- Liste ---------------- */
  const openColumns: Column<Outage>[] = [
    {
      key: "id",
      header: "Kayıt",
      sortable: true,
      sortValue: (o) => o.id,
      render: (o) => (
        <a href={href("outages", { id: o.id })} className="block">
          <span className="edas-mono block font-medium text-strong hover:underline">{o.id}</span>
          <span className="block text-small text-muted">{o.cause}</span>
        </a>
      ),
    },
    { key: "tm", header: "Trafo Merkezi", render: (o) => `${substation(o.substationId).name} · ${region(o.regionId).name}` },
    { key: "af", header: "Etkilenen Abone", numeric: true, sortable: true, sortValue: (o) => o.affected, render: (o) => regionAffected(o) },
    { key: "st", header: "Başlangıç", sortable: true, sortValue: (o) => o.start.getTime(), render: (o) => dateTime(o.start) },
    { key: "du", header: "Süre", numeric: true, render: (o) => duration(minutesOf(o)) },
    { key: "cr", header: "Ekip", render: (o) => ov[o.id]?.crew ?? o.crew },
    { key: "s", header: "Durum", render: (o) => <OutageBadge status={o.status} kind={o.kind} /> },
  ];
  const itemOf = (o: Outage): RecordItem => ({
    id: o.id,
    title: `${o.id} · ${substation(o.substationId).name}`,
    subtitle: `${o.cause} · ${region(o.regionId).name}`,
    leading: (
      <IconTile tone={o.status === "acik" ? "danger" : "neutral"}>
        <Zap />
      </IconTile>
    ),
    value: `${regionAffected(o)} abone`,
    meta: `${dateTime(o.start)} · ${duration(minutesOf(o))}`,
    status: <OutageBadge status={o.status} kind={o.kind} />,
    href: href("outages", { id: o.id }),
    onSelect: () => go("outages", { id: o.id }),
  });
  const table = (rows: Outage[], caption: string) => (
    <>
      <div className="max-md:hidden">
        <DataTable<Outage> caption={caption} columns={openColumns} rows={rows} rowKey={(o) => o.id} density="comfortable" on="surface" stickyFirst={false} empty="Bu listede kayıt yok" />
      </div>
      <div className="p-3 md:hidden">
        <RecordList label={caption} items={rows.map(itemOf)} />
      </div>
    </>
  );

  const byRegion = outageByRegion();
  const daily = outageDaily(30);
  const dailyLabels = Array.from({ length: 30 }, (_, i) => shortDate.format(addDays(TODAY, i - 29)));

  const scheduleItems: ScheduleItem[] = planned.slice(0, 8).map((o) => ({
    id: o.id,
    at: `${dayKey(o.start)}T${clock.format(o.start)}`,
    time: `${clock.format(o.start)}-${o.end ? clock.format(o.end) : ""}`,
    day: new Intl.DateTimeFormat("tr-TR", { weekday: "short", day: "numeric" }).format(o.start),
    title: `${substation(o.substationId).name} · ${o.cause}`,
    detail: `${region(o.regionId).name} · ${num.format(o.affected)} abone`,
    color: 4,
    href: href("outages", { id: o.id }),
  }));

  const orderCols = useMemo<KanbanColumn[]>(() => {
    const card = (w: WorkOrder): KanbanCard => ({
      id: w.id,
      title: `${WORK_TYPE_LABEL[w.type]} · ${w.customerId ? customer(w.customerId).name : region(w.regionId).name}`,
      tags: [{ label: region(w.regionId).name, tone: WORK_TONE[w.type] }],
      due: dayKey(w.scheduled),
    });
    const todayKey = TODAY_KEY;
    return [
      { id: "plan", title: "Planlandı", cards: WORK_ORDERS.filter((w) => w.status === "planlandi" && dayKey(w.scheduled) > todayKey).map(card) },
      { id: "bugun", title: "Bugün Sahada", limit: 8, cards: WORK_ORDERS.filter((w) => w.status === "planlandi" && dayKey(w.scheduled) <= todayKey).map(card) },
      { id: "tamam", title: "Tamamlandı", done: true, cards: WORK_ORDERS.filter((w) => w.status === "tamamlandi").map(card) },
    ];
  }, []);
  const orderOf = (id: string) => WORK_ORDERS.find((w) => w.id === id) ?? null;

  const panels: { value: TabId; label: string; panel: ReactNode }[] = [
    {
      value: "acik",
      label: `Açık Arızalar (${open.length})`,
      panel: (
        <div className="grid gap-5 pt-5">
          <Panel id="ariza-acik" title="Açık Arızalar" note="Ekipler sahada; süre canlı hesaplanır. Satıra basınca ekip, süre ve müşteri duyurusu yönetilir." actions={<Badge tone={open.length ? "danger" : "success"} dot>{open.length} açık</Badge>}>
            {table(open, "Açık arızalar")}
          </Panel>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
            <ChartCard id="ariza-gunluk" className={`${CARD} xl:col-span-3`} label="Günlük Açık Arıza" value={`${daily[daily.length - 1]} bugün`} change={null} action={<Badge tone="neutral">Son 30 gün</Badge>}>
              <AreaChart title="Son 30 günün günlük açık arıza sayısı" labels={dailyLabels} series={[{ label: "Açık arıza", values: daily, series: 6 }]} unit="arıza" />
            </ChartCard>
            <ChartCard id="ariza-bolge" className={`${CARD} xl:col-span-2`} label="Bölgeye Göre Kesinti" value={`${num.format(byRegion.reduce((s, r) => s + r.count, 0))} kayıt`} change={null} action={<Badge tone="neutral">Plansız</Badge>}>
              <BarList title="Bölgeye göre plansız kesinti sayısı" columns={["Bölge", "Kayıt"]} items={byRegion.map((r) => ({ label: `${r.region.name} · ${duration(r.minutes)}`, value: r.count }))} series={6} />
            </ChartCard>
          </div>
        </div>
      ),
    },
    {
      value: "planli",
      label: `Planlı Kesintiler (${planned.length})`,
      panel: (
        <div className="grid gap-5 pt-5">
          <Panel
            id="ariza-planli"
            title="Planlı Çalışmalar"
            note="Duyuru, çalışmadan en az 48 saat önce abonelere gider."
            actions={
              <Button size="sm" variant="primary" onClick={() => setPlanOpen(true)}>
                Çalışma Planla
              </Button>
            }
          >
            {table(planned, "Planlı çalışmalar")}
          </Panel>
          <Panel id="ariza-takvim" title="Takvim" note="Önümüzdeki planlı çalışmalar, tarih sırasıyla.">
            <div className="p-4 sm:p-5">
              {scheduleItems.length ? <ScheduleList label="Planlı çalışma takvimi" items={scheduleItems} /> : <p className="text-small text-muted">Planlı çalışma yok.</p>}
            </div>
          </Panel>
        </div>
      ),
    },
    {
      value: "is-emri",
      label: "İş Emirleri",
      panel: (
        <div className="pt-5">
          <Panel id="ariza-isemri" title="İş Emri Panosu" note="Kartı sürükleyin ya da klavyeyle (Boşluk, ok tuşları) taşıyın; Enter ayrıntıyı açar.">
            <div className="p-3 sm:p-4">
              <KanbanBoard label="İş emirleri" defaultColumns={orderCols} today={TODAY_KEY} onCardOpen={(c) => setOrderOpen(orderOf(c.id))} onChange={() => notify({ title: "İş emri taşındı", body: "Durum güncellendi", tone: "success" })} />
            </div>
          </Panel>
        </div>
      ),
    },
    {
      value: "gecmis",
      label: "Geçmiş",
      panel: (
        <div className="pt-5">
          <Panel id="ariza-gecmis" title="Giderilen Kesintiler" note={`Son 60 gün · ${num.format(history.length)} kayıt`}>
            {table(history.slice(0, 40), "Giderilen kesintiler")}
          </Panel>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHead
        title="Arıza ve Kesintiler"
        description="Plansız arızalar, planlı çalışmalar ve iş emirleri."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setPlanOpen(true)}>
              Çalışma Planla
            </Button>
            <Button variant="primary" size="sm" onClick={() => notify({ title: "Arıza kaydı açıldı", body: "Çağrı merkezinden gelen bildirim kayda alındı", tone: "info" })}>
              Arıza Kaydı Aç
            </Button>
          </>
        }
      />
      <PageBody>
        <MetricStrip>
          <Cell icon={<Zap />} label="Açık Arıza" value={num.format(open.length)} foot={open.length ? "Ekipler sahada" : "Açık kayıt yok"} tone={open.length ? "danger" : "neutral"} />
          <Cell icon={<Users />} label="Etkilenen Abone" value={num.format(open.reduce((s, o) => s + o.affected, 0))} foot="Şu anda enerjisi olmayan" tone={open.length ? "danger" : "neutral"} />
          <Cell icon={<Timer />} label="SAIDI · 30 Gün" value={`${reliab.saidi} dk`} foot="Abone başına kesinti süresi" />
          <Cell icon={<AlertTriangle />} label="SAIFI · 30 Gün" value={reliab.saifi.toLocaleString("tr-TR")} foot="Abone başına kesinti sayısı" />
          <Cell icon={<Clock />} label="Ortalama Onarım" value={duration(reliab.mttr)} foot={`${reliab.count} plansız kayıt üzerinden`} />
          <Cell icon={<ClipboardList />} label="Planlı Çalışma" value={num.format(planned.length)} foot={`${WORK_ORDERS.filter((w) => w.status === "planlandi").length} iş emri açık`} tone={planned.length ? "warning" : "neutral"} />
        </MetricStrip>

        <Tabs aria-label="Arıza ve kesinti görünümleri" variant="underline" value={tab} onValueChange={(v) => go("outages", { tab: v })} items={panels.map((p) => ({ value: p.value, label: p.label, panel: p.value === tab ? p.panel : null }))} />

        <SampleNote />
      </PageBody>

      <PlanDialog
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        onPlan={(o) => {
          setExtraPlanned((l) => [o, ...l]);
          setPlanOpen(false);
          notify({ title: "Planlı çalışma oluşturuldu", body: `${o.id} · ${substation(o.substationId).name} · ${fullDate.format(o.start)}`, tone: "success" });
          go("outages", { tab: "planli" });
        }}
        nextId={`K-2026${1300 + extraPlanned.length}`}
      />

      <Sheet
        open={!!orderOpen}
        onOpenChange={(o) => !o && setOrderOpen(null)}
        title={orderOpen ? WORK_TYPE_LABEL[orderOpen.type] : ""}
        description={orderOpen ? `${orderOpen.id} · ${fullDate.format(orderOpen.scheduled)}, ${clock.format(orderOpen.scheduled)}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOrderOpen(null)}>Kapat</Button>
            {orderOpen?.customerId ? (
              <Button variant="primary" onClick={() => { const id = orderOpen.customerId!; setOrderOpen(null); go("customers", { id }); }}>
                Müşteriyi Aç
              </Button>
            ) : null}
          </>
        }
      >
        {orderOpen ? (
          <dl className="grid gap-3 text-small">
            {[
              ["Bölge", region(orderOpen.regionId).name],
              ["Müşteri", orderOpen.customerId ? `${customer(orderOpen.customerId).name} · ${orderOpen.customerId}` : "Bölge geneli"],
              ["Neden", orderOpen.reason],
              ["Durum", orderOpen.status === "tamamlandi" ? "Tamamlandı" : "Planlandı"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted">{k}</dt>
                <dd className="mt-0.5 font-medium text-strong">{v}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Sheet>
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Arıza ayrıntısı                                                           */
/* ------------------------------------------------------------------------ */

function OutageDetail({ o, ov, go, onCrew, onEta, onSms, onClose, onCancel }: { o: Outage; ov?: Override; go: PageProps["go"]; onCrew: (c: string) => void; onEta: (m: number) => void; onSms: () => void; onClose: () => void; onCancel: () => void }) {
  const [crew, setCrew] = useState<string | null>(ov?.crew ?? o.crew);
  const [eta, setEta] = useState<string | null>(String(ov?.eta ?? 120));
  const isOpen = o.status === "acik";
  const planned = o.status === "planlandi";

  const steps = outageTimeline(o);
  const events: TimelineEvent[] = [
    ...steps.map((s) => ({ at: s.at, title: s.label, body: undefined as string | undefined })),
    ...(ov?.log ?? []).map((l) => ({ at: l.at, title: l.title, body: l.body })),
  ]
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .map((e, i) => ({
      id: `${o.id}-${i}`,
      at: e.at.toISOString(),
      when: dateTime(e.at),
      title: e.title,
      description: e.body,
      tone: e.title.startsWith("Enerji verildi") ? ("success" as const) : e.title.startsWith("Arıza bildirimi") ? ("danger" as const) : ("neutral" as const),
    }));

  const sample = affectedSample(o, Math.min(6, o.affected));
  const minutes = minutesOf(o);
  const message = OUTAGE_SMS.replace("{bolge}", region(o.regionId).name).replace("{sure}", duration(ov?.eta ?? 120));

  return (
    <>
      <PageHead
        title="Arıza ve Kesintiler"
        crumb={o.id}
        description={`${o.cause} · ${substation(o.substationId).name}, ${region(o.regionId).name}`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => go("outages", { tab: planned ? "planli" : isOpen ? "acik" : "gecmis" })}>
              <ArrowLeft aria-hidden /> Listeye Dön
            </Button>
            {isOpen ? (
              <Button variant="primary" size="sm" onClick={onClose}>
                Enerji Verildi
              </Button>
            ) : null}
          </>
        }
      />
      <PageBody>
        <MetricStrip>
          <Cell icon={<Users />} label="Etkilenen Abone" value={num.format(o.affected)} foot={isOpen ? "Şu anda enerjisi yok" : "Etkilenen toplam abone"} tone={isOpen ? "danger" : "neutral"} />
          <Cell icon={<Clock />} label={isOpen ? "Süre (Canlı)" : planned ? "Planlanan Süre" : "Toplam Süre"} value={planned && o.end ? duration(Math.round((o.end.getTime() - o.start.getTime()) / 60_000)) : duration(minutes)} foot={planned ? `${fullDate.format(o.start)}, ${clock.format(o.start)}` : `Başlangıç ${dateTime(o.start)}`} />
          <Cell icon={<Zap />} label="Trafo Merkezi" value={substation(o.substationId).name} foot={`${substation(o.substationId).capacityMva} MVA`} />
          <Cell icon={<Wrench />} label="Ekip" value={(ov?.crew ?? o.crew).replace(/ \(.*\)/, "")} foot={ov?.crew ?? o.crew} />
          <Cell icon={<Timer />} label="Tahmini Süre" value={duration(ov?.eta ?? 120)} foot={ov?.eta ? "Güncellendi" : "İlk tahmin"} />
          <Cell icon={<MessageSquareText />} label="Müşteri Bilgilendirme" value={ov?.smsSent ? "Gönderildi" : "Bekliyor"} foot={ov?.smsSent ? `${num.format(o.affected)} aboneye SMS` : "SMS henüz gönderilmedi"} tone={ov?.smsSent || !isOpen ? "neutral" : "warning"} />
        </MetricStrip>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <Panel id="ad-zaman" title="Zaman Çizelgesi" note="Bildirimden enerjinin verilmesine kadar her adım." className="xl:col-span-3">
            <div className="p-4 sm:p-5">
              <Timeline events={events} />
            </div>
          </Panel>

          <Panel id="ad-islem" title={planned ? "Planlı Çalışma" : "İşlemler"} note={isOpen ? "Ekibi, tahmini süreyi ve müşteri duyurusunu buradan yönetin." : planned ? "Duyuru ve iptal." : "Kayıt kapalı; değişiklik yapılamaz."} className="xl:col-span-2">
            <div className="grid gap-4 p-4 sm:p-5">
              {isOpen ? (
                <>
                  <div className="grid gap-2">
                    <Select label="Ekip" items={CREW_OPTIONS} value={crew} onValueChange={setCrew} />
                    <Button size="sm" variant="secondary" className="w-fit" onClick={() => crew && onCrew(crew)} disabled={!crew || crew === (ov?.crew ?? o.crew)}>
                      Ekibi Ata
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    <Select label="Tahmini Süre" items={ETA_OPTIONS} value={eta} onValueChange={setEta} />
                    <Button size="sm" variant="secondary" className="w-fit" onClick={() => eta && onEta(Number(eta))}>
                      Süreyi Güncelle
                    </Button>
                  </div>
                </>
              ) : null}
              {isOpen || planned ? (
                <Button size="sm" variant={ov?.smsSent ? "ghost" : "primary"} className="w-fit" onClick={onSms}>
                  <MessageSquareText aria-hidden /> Müşterilere SMS Gönder
                </Button>
              ) : (
                <p className="flex items-center gap-2 text-small text-success">
                  <CheckCircle2 aria-hidden className="size-4" /> Giderildi, enerji verildi.
                </p>
              )}
              {planned ? (
                <Button size="sm" variant="danger" className="w-fit" onClick={onCancel}>
                  Çalışmayı İptal Et
                </Button>
              ) : null}
            </div>
          </Panel>
        </div>

        <Panel id="ad-aboneler" title="Etkilenen Aboneler" note={sample.length < o.affected ? `${num.format(o.affected)} abonenin ilk ${sample.length}'ı; tam liste müşteri sayfasında bölge süzgeciyle.` : `${num.format(o.affected)} abonenin tamamı`}>
          <div className="max-md:hidden">
            <DataTable
              caption="Etkilenen aboneler (örnek)"
              rows={sample}
              rowKey={(c) => c.id}
              density="comfortable"
              on="surface"
              stickyFirst={false}
              columns={[
                { key: "n", header: "Müşteri", render: (c) => <a href={href("customers", { id: c.id })} className="font-medium text-strong hover:underline">{c.name}</a> },
                { key: "i", header: "Tesisat No", render: (c) => <span className="edas-mono">{c.installation}</span> },
                { key: "d", header: "Mahalle", render: (c) => c.district },
                { key: "v", header: "Gerilim", render: (c) => c.voltage },
                { key: "p", header: "Telefon", render: (c) => <span className="edas-mono">{c.phone}</span> },
              ]}
            />
          </div>
          <div className="p-3 md:hidden">
            <RecordList label="Etkilenen aboneler" items={sample.map((c) => ({ id: c.id, title: c.name, subtitle: `${c.district} · ${c.voltage}`, value: c.phone, href: href("customers", { id: c.id }), onSelect: () => go("customers", { id: c.id }) }))} />
          </div>
        </Panel>

        <SampleNote />
      </PageBody>
      <p className="sr-only">{message}</p>
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Diyaloglar                                                                */
/* ------------------------------------------------------------------------ */

function SmsDialog({ o, onClose, onSend }: { o: Outage | null; onClose: () => void; onSend: (o: Outage) => void }) {
  const text = o ? OUTAGE_SMS.replace("{bolge}", region(o.regionId).name).replace("{sure}", o.end ? "kısa süre" : "2 saat") : "";
  return (
    <Dialog
      open={!!o}
      onOpenChange={(x) => !x && onClose()}
      title="Müşterilere SMS Duyurusu"
      description={o ? `${region(o.regionId).name} · ${num.format(o.affected)} abone` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button variant="primary" onClick={() => o && onSend(o)}>{o ? `${num.format(o.affected)} Aboneye Gönder` : "Gönder"}</Button>
        </>
      }
    >
      <div className="grid gap-3">
        <p className="text-small text-muted">Önizleme (Türkçe karakter kullanılmaz; böylece tek SMS 160 karakter sığar):</p>
        <p className="rounded-lg bg-surface p-3 text-small text-strong">{text}</p>
        <p className="text-micro text-muted">{text.length} karakter · {Math.ceil(text.length / 160)} SMS. Yalnız etkilenen aboneler ve bölge sakinleri alır.</p>
      </div>
    </Dialog>
  );
}

function CloseDialog({ o, onClose, onConfirm }: { o: Outage | null; onClose: () => void; onConfirm: (o: Outage) => void }) {
  return (
    <Dialog
      open={!!o}
      onOpenChange={(x) => !x && onClose()}
      title="Enerji Verildi mi?"
      description={o ? `${o.id} · ${num.format(o.affected)} abone` : undefined}
      footer={
        <>
          <Button variant="ghost" data-autofocus onClick={onClose}>Vazgeç</Button>
          <Button variant="primary" onClick={() => o && onConfirm(o)}>Kaydı Kapat</Button>
        </>
      }
    >
      <p className="text-small text-muted">Kayıt kapanınca süre durur, abonelere enerjinin geldiği bildirilir ve kayıt Geçmiş sekmesine taşınır. Bu işlem geri alınamaz.</p>
    </Dialog>
  );
}

function PlanDialog({ open, onClose, onPlan, nextId }: { open: boolean; onClose: () => void; onPlan: (o: Outage) => void; nextId: string }) {
  const [date, setDate] = useState(dayKey(addDays(TODAY, 4)));
  const [from, setFrom] = useState("09:00");
  const [to, setTo] = useState("13:00");
  const [reg, setReg] = useState<string | null>("merkez");
  const [sub, setSub] = useState<string | null>(null);
  const [cause, setCause] = useState<string | null>("Hat bakımı");
  const [note, setNote] = useState("");

  const subs = SUBSTATIONS.filter((s) => s.regionId === reg).map((s) => ({ value: s.id, label: s.name }));
  const subId = sub && subs.some((s) => s.value === sub) ? sub : subs[0]?.value ?? null;
  const regionName = region(reg ?? "merkez").name;
  const estimate = Math.max(8, Math.round(CUSTOMERS.filter((c) => c.regionId === reg).length * 0.2));
  const lead = Math.round((parseDay(date).getTime() - parseDay(TODAY_KEY).getTime()) / 3_600_000);
  const early = lead >= 48;
  const msg = `Bakim calismasi nedeniyle ${date} tarihinde ${from}-${to} saatleri arasinda ${regionName} bolgesinde elektrik kesilecektir. Anlayisiniz icin tesekkur ederiz.`;

  const submit = () => {
    if (!subId || !reg) return;
    const [fh, fm] = from.split(":").map(Number);
    const [th, tm] = to.split(":").map(Number);
    const d = parseDay(date);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), fh, fm);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), th, tm);
    onPlan({ id: nextId, kind: "planli", status: "planlandi", substationId: subId, regionId: reg, start, end, affected: estimate, cause: cause ?? "Hat bakımı", crew: CREWS[REGIONS.findIndex((r) => r.id === reg)] });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(x) => !x && onClose()}
      size="lg"
      title="Planlı Çalışma Planla"
      description="Tarih ve saat aralığı, bölge ve neden. Duyuru önizlemesi altta."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button variant="primary" onClick={submit} disabled={!subId || to <= from}>Planla ve Duyur</Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Tarih" type="date" value={date} min={dayKey(addDays(TODAY, 1))} onChange={(e) => setDate(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Başlangıç" type="time" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="Bitiş" type="time" value={to} error={to <= from ? "Bitiş başlangıçtan sonra olmalı" : undefined} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Select label="Bölge" items={REGION_OPTIONS} value={reg} onValueChange={(v) => { setReg(v); setSub(null); }} />
        <Select label="Trafo Merkezi" items={subs} value={subId} onValueChange={setSub} />
        <Select label="Neden" items={PLAN_CAUSES} value={cause} onValueChange={setCause} />
        <div className="rounded-lg bg-surface p-3 text-small">
          <p className="text-muted">Tahmini etkilenen abone</p>
          <p className="mt-0.5 text-read font-semibold text-strong">{num.format(estimate)}</p>
          <p className={`mt-1 text-micro ${early ? "text-muted" : "text-warning"}`}>{early ? "Duyuru süresi yeterli (48 saatten fazla)." : "Duyuru süresi 48 saatten kısa: kurul bildirimi gerekir."}</p>
        </div>
        <div className="sm:col-span-2">
          <Textarea label="Not (iç kullanım)" value={note} onChange={(e) => setNote(e.target.value)} minRows={2} />
        </div>
        <div className="sm:col-span-2">
          <p className="text-small text-muted">Abone duyurusu önizlemesi</p>
          <p className="mt-1 rounded-lg bg-surface p-3 text-small text-strong">{msg}</p>
        </div>
      </div>
    </Dialog>
  );
}
