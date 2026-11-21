"use client";

import { useRef, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, CalendarClock, CheckCircle2, Clock, MessageSquareText, ShieldAlert, Timer, Users, Wrench, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { FactorList } from "@/components/ui/factor-list";
import { PolicyChecks, type PolicyCheck } from "@/components/ui/policy-checks";
import { Input } from "@/components/ui/input";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { RegionMap, type MapRegion } from "@/components/ui/region-map";
import { ScheduleList, type ScheduleItem } from "@/components/ui/schedule-list";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Timeline, type TimelineEvent } from "@/components/ui/timeline";
import { useDerived } from "./_core";
import { FEEDERS, REGIONS, SUBSTATIONS, TODAY, addDays, clock, dateTime, dayKey, fullDate, region, substation, type Outage } from "./_data";
import { CREWS, OUTAGE_SMS, outageTimeline } from "./_data-operasyon";
import {
  ETA_CHOICES,
  OUTAGE_CAUSES,
  PLAN_CAUSES,
  affectedCustomers,
  affectedSensitive,
  dailyOpen,
  feederTransformers,
  impactOf,
  outageCountByRegion,
  outageMin,
  reliabilityOf,
  fixOutage,
  isSensitive,
} from "./_data-ops-sayfa";
import { MAP_SHAPES, MAP_VIEWBOX } from "./_harita";
import { getCutPolicy, scheduleSlot } from "./_cutpolicy";
import { isBusinessDay, inWorkHours, keyOf } from "./_calendar";
import { BarTarget, CandidateStrip, EmptyStateX, PageHero, RowAnchor, RowLink, StepCountChart, UnitLegend, fmtDec, fmtDur, fmtNum, useListKeys } from "./_kit";
import { assignOutageCrew, cancelOutage, closeOutage, createOutage, effectiveOutages, getOutageState, sendOutageSms, setOutageEta } from "./_ops";
import { faultCandidates } from "./_selectors";
import { WORK_STATUS_LABEL, WORK_TYPE_LABEL, createOutageFromCalls, createWorkOrder, getCalls, getWorkOrders } from "./_store";
import { useCan } from "./_permissions";
import { IconTile, OutageBadge, PageBody, PageHead, Panel, href, useApp, type PageProps } from "./_ui";

/* ------------------------------------------------------------------------ */
/* Ortak                                                                     */
/* ------------------------------------------------------------------------ */

const TABS = ["acik", "planli", "gecmis", "guvenilirlik"] as const;
type TabId = (typeof TABS)[number];
const crewOf = (regionId: string) => CREWS[Math.max(0, REGIONS.findIndex((r) => r.id === regionId))];
const REGION_ITEMS = REGIONS.map((r) => ({ value: r.id, label: r.name }));

/** Depo durumu: üreteç tabanı + yamalar + sayfada açılan kayıtlar; canlı. */
function useOutageData() {
  return useDerived(() => {
    const list = effectiveOutages().map(fixOutage);
    const patches = getOutageState().patches;
    return { list, patches };
  });
}

function messageOf(o: Outage, etaMin: number) {
  return OUTAGE_SMS.replace("{bolge}", region(o.regionId).name).replace("{sure}", fmtDur(etaMin));
}

/* ------------------------------------------------------------------------ */
/* Sayfa                                                                     */
/* ------------------------------------------------------------------------ */

export function ArizaPage({ params, go }: PageProps) {
  const { notify } = useApp();
  const canOps = useCan("sayac") || useCan("musteri");
  const { list, patches } = useOutageData();
  const tab: TabId = (TABS as readonly string[]).includes(params.tab ?? "") ? (params.tab as TabId) : params.status === "gecmis" ? "gecmis" : "acik";

  const [createOpen, setCreateOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(!!params.plan);
  const [smsFor, setSmsFor] = useState<string | null>(null);
  const [closeFor, setCloseFor] = useState<string | null>(null);

  const open = list.filter((o) => o.status === "acik");
  const planned = list.filter((o) => o.status === "planlandi").sort((a, b) => a.start.getTime() - b.start.getTime());
  const history = list.filter((o) => o.status === "cozuldu").sort((a, b) => b.start.getTime() - a.start.getTime());
  const detail = params.id ? list.find((o) => o.id === params.id) : undefined;
  const reliab = useDerived(() => reliabilityOf(list, 30), [list]);
  const candidates = useDerived(() => faultCandidates());
  const smsOutage = smsFor ? list.find((o) => o.id === smsFor) ?? null : null;
  const closeOutageFor = closeFor ? list.find((o) => o.id === closeFor) ?? null : null;

  const doSms = (o: Outage) => {
    sendOutageSms(o.id, o.affected);
    notify({ title: "SMS Duyurusu Gönderildi", body: `${region(o.regionId).name} · ${fmtNum(o.affected)} abone`, tone: "success" });
    setSmsFor(null);
  };
  const doClose = (o: Outage) => {
    closeOutage(o.id);
    notify({ title: `${o.id} Kapatıldı`, body: `${fmtNum(o.affected)} abonenin enerjisi verildi · ${fmtDur(outageMin(o))}`, tone: "success" });
    setCloseFor(null);
  };

  const dialogs = (
    <>
      <SmsDialog o={smsOutage} etaMin={smsOutage ? patches[smsOutage.id]?.etaMin ?? 120 : 120} onClose={() => setSmsFor(null)} onSend={doSms} />
      <CloseDialog o={closeOutageFor} onClose={() => setCloseFor(null)} onConfirm={doClose} />
      <CreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(o) => {
          setCreateOpen(false);
          notify({ title: "Arıza Kaydı Açıldı", body: `${o.id} · ${substation(o.substationId).name} · ${fmtNum(o.affected)} abone`, tone: "success" });
          go("outages", { id: o.id });
        }}
      />
      <PlanDialog
        open={planOpen}
        planFor={params.plan}
        onClose={() => {
          setPlanOpen(false);
          if (params.plan) go("outages", { tab: "planli" });
        }}
        onPlan={(o, shifted) => {
          setPlanOpen(false);
          notify({ title: "Planlı Çalışma Oluşturuldu", body: `${o.id} · ${fullDate.format(o.start)}, ${clock.format(o.start)}${shifted ? " (iş gününe oturtuldu)" : ""}`, tone: "success" });
          go("outages", { tab: "planli" });
        }}
      />
    </>
  );

  if (params.id && detail) {
    return (
      <>
        <OutageDetail o={detail} patch={patches[detail.id]} go={go} canOps={canOps} onSms={() => setSmsFor(detail.id)} onClose={() => setCloseFor(detail.id)} />
        {dialogs}
      </>
    );
  }

  const regionId = params.region && REGIONS.some((r) => r.id === params.region) ? params.region : null;
  const shown = regionId ? open.filter((o) => o.regionId === regionId) : open;
  const recentFixed = list.filter((o) => o.kind === "plansiz" && o.status === "cozuldu").slice(0, 4);
  const openAffected = open.reduce((s, o) => s + o.affected, 0);
  const openSensitive = open.reduce((s, o) => s + affectedSensitive(o), 0);

  const mapRegions: MapRegion[] = MAP_SHAPES.map((s) => {
    const mine = open.filter((o) => o.regionId === s.id);
    const n = mine.length;
    return { id: s.id, label: region(s.id).name, path: s.path, at: s.at, value: n, tone: n ? "danger" : "neutral", note: n ? `${n} açık arıza · ${fmtNum(mine.reduce((x, o) => x + o.affected, 0))} abone` : "Kesinti yok" };
  });

  const panels: { value: TabId; label: string; panel: ReactNode }[] = [
    {
      value: "acik",
      label: `Açık Arızalar (${open.length})`,
      panel: (
        <div className="grid gap-5 pt-5">
          <div className="grid gap-5 xl:grid-cols-5">
            <Panel id="ariza-harita" title="Şebeke Durumu" note="Bölgeye basınca liste süzülür; kırmızı bölgede açık arıza var." className="xl:col-span-2">
              <div className="p-4 sm:p-5">
                <RegionMap title="Bölgeye Göre Açık Arıza" regions={mapRegions} viewBox={MAP_VIEWBOX} format={(v) => `${fmtNum(v)} arıza`} legend={["Kesinti yok", "Açık arıza"]} selectedId={regionId} onSelect={(id) => go("outages", { tab: "acik", region: regionId === id ? undefined : id })} />
              </div>
            </Panel>
            <Panel
              id="ariza-acik"
              title="Açık Arızalar"
              note={regionId ? `${region(regionId).name} bölgesi · ${shown.length} kayıt` : "Süre canlı hesaplanır; satırın tamamı ayrıntıyı açar."}
              actions={regionId ? <Button size="sm" variant="ghost" onClick={() => go("outages", { tab: "acik" })}>Süzgeci Kaldır</Button> : <Badge tone={open.length ? "danger" : "success"} dot>{open.length} açık</Badge>}
              className="xl:col-span-3"
            >
              {shown.length ? <OpenList rows={shown} patches={patches} /> : <EmptyStateX title="Bu Bölgede Açık Arıza Yok" hint="Harita süzgecini kaldırarak bütün şebekeyi görebilirsin." />}
              {shown.length <= 2 && recentFixed.length ? (
                <div className="border-t border-line-soft p-4 sm:p-5">
                  <p className="mb-2 text-small font-medium text-strong">Son Giderilen Kesintiler</p>
                  <ul role="list" className="grid gap-2 text-small">
                    {recentFixed.map((o) => (
                      <li key={o.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                        <span className="min-w-0">
                          <a href={href("outages", { id: o.id })} className="kz-mono font-medium text-strong hover:underline">{o.id}</a>
                          <span className="ml-2 text-body">{substation(o.substationId).name} · {o.cause}</span>
                        </span>
                        <span className="text-muted tabular-nums">{fmtNum(o.affected)} abone · {fmtDur(outageMin(o))}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Panel>
          </div>
          <Panel id="ariza-gunluk" title="Günlük Açık Arıza" note="Her günün sonunda süren plansız kayıt sayısı; ayrık sayım basamaklı çizilir.">
            <div className="grid gap-3 p-4 sm:p-5">
              <StepCountChart data={dailyOpen(list, 30).map((v, i) => ({ label: new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(addDays(TODAY, i - 29)), value: v }))} title="Son 30 günün günlük açık arıza sayısı" unit=" arıza" />
              <UnitLegend items={[{ label: "Açık Arıza", series: 1, value: `${open.length} bugün` }]} />
            </div>
          </Panel>
        </div>
      ),
    },
    {
      value: "planli",
      label: `Planlı Kesintiler (${planned.length})`,
      panel: (
        <div className="grid gap-5 pt-5">
          <Panel id="ariza-planli" title="Planlı Çalışmalar" note="İş günü ve mesai içine oturur; duyuru çalışmadan en az 48 saat önce gider." actions={canOps ? <Button size="sm" variant="primary" onClick={() => setPlanOpen(true)}>Çalışma Planla</Button> : null}>
            {planned.length ? <PlannedList rows={planned} go={go} /> : <EmptyStateX title="Planlı Çalışma Yok" hint="Çalışma Planla ile bir bakım ya da trafo değişimi ekleyebilirsin." />}
          </Panel>
          <Panel id="ariza-takvim" title="Takvim" note="Önümüzdeki planlı çalışmalar, tarih sırasıyla.">
            <div className="p-4 sm:p-5">
              {planned.length ? (
                <ScheduleList
                  label="Planlı Çalışma Takvimi"
                  items={planned.slice(0, 8).map<ScheduleItem>((o) => ({
                    id: o.id,
                    at: `${dayKey(o.start)}T${clock.format(o.start)}`,
                    time: `${clock.format(o.start)}-${o.end ? clock.format(o.end) : ""}`,
                    day: new Intl.DateTimeFormat("tr-TR", { weekday: "short", day: "numeric" }).format(o.start),
                    title: `${substation(o.substationId).name} · ${o.cause}`,
                    detail: `${region(o.regionId).name} · ${fmtNum(o.affected)} abone`,
                    color: 4,
                    href: href("outages", { id: o.id }),
                  }))}
                />
              ) : (
                <p className="text-small text-muted">Planlı çalışma yok.</p>
              )}
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
          <Panel id="ariza-gecmis" title="Giderilen Kesintiler" note={`Son 60 gün · ${fmtNum(history.length)} kayıt`}>
            <HistoryTable rows={history.slice(0, 40)} go={go} />
          </Panel>
        </div>
      ),
    },
    {
      value: "guvenilirlik",
      label: "Güvenilirlik",
      panel: (
        <div className="grid gap-5 pt-5">
          <Panel id="ariza-hesap" title="SAIDI ve SAIFI Hesabı" note="Son 30 gün; yalnız 3 dakikadan uzun plansız kesintiler (ÖRNEK eşik). Payda: aktif abone sayısı.">
            <div className="grid gap-4 p-4 sm:p-5">
              <dl className="grid gap-3 sm:grid-cols-4">
                {[
                  ["SAIDI", `${fmtDec(reliab.saidi)} dk`, "abone başına süre"],
                  ["SAIFI", fmtDec(reliab.saifi, 2), "abone başına kesinti"],
                  ["Abone dakika", fmtNum(reliab.minutes), `${fmtNum(reliab.events)} etkilenme`],
                  ["Aktif abone", fmtNum(reliab.total), "payda"],
                ].map(([k, v, f]) => (
                  <div key={k} className="rounded-lg bg-surface p-3">
                    <dt className="text-small text-muted">{k}</dt>
                    <dd className="mt-0.5 text-read font-semibold text-strong tabular-nums">{v}</dd>
                    <dd className="text-small text-muted">{f}</dd>
                  </div>
                ))}
              </dl>
              <p className="rounded-lg bg-surface p-3 text-small text-body">
                SAIDI = Σ(etkilenen abone × süre) ÷ aktif abone = {fmtNum(reliab.minutes)} ÷ {fmtNum(reliab.total)} = <strong className="text-strong">{fmtDec(reliab.saidi)} dk</strong>. SAIFI = Σ etkilenen abone ÷ aktif abone = {fmtNum(reliab.events)} ÷ {fmtNum(reliab.total)} = <strong className="text-strong">{fmtDec(reliab.saifi, 2)}</strong>. Eşik ve istisnalar örnek parametredir; resmî bildirimde mevzuat tanımı esas alınır.
              </p>
              <DataTable<(typeof reliab.rows)[number]>
                caption="Hesaba giren kesintiler"
                rows={reliab.rows}
                rowKey={(r) => r.o.id}
                density="comfortable"
                on="surface"
                stickyFirst={false}
                columns={[
                  { key: "id", header: "Kayıt", render: (r) => <a href={href("outages", { id: r.o.id })} className="kz-mono font-medium text-strong hover:underline">{r.o.id}</a> },
                  { key: "tm", header: "Trafo Merkezi", render: (r) => substation(r.o.substationId).name },
                  { key: "af", header: "Etkilenen", numeric: true, sortable: true, sortValue: (r) => r.o.affected, render: (r) => fmtNum(r.o.affected) },
                  { key: "du", header: "Süre", numeric: true, sortable: true, sortValue: (r) => r.minutes, render: (r) => fmtDur(r.minutes) },
                  { key: "cm", header: "Abone Dakika", numeric: true, sortable: true, sortValue: (r) => r.customerMinutes, render: (r) => fmtNum(r.customerMinutes) },
                ]}
                empty="Son 30 günde hesaba giren kesinti yok"
              />
            </div>
          </Panel>
          <Panel id="ariza-bolge" title="Bölgeye Göre Plansız Kesinti" note="Tek ölçü: kayıt sayısı.">
            <div className="p-4 sm:p-5">
              <BarTarget aria-label="Bölgeye Göre Plansız Kesinti Sayısı" format={(v) => `${fmtNum(v)} kayıt`} rows={outageCountByRegion(list).map((r) => ({ id: r.region.id, label: r.region.name, value: r.count }))} />
            </div>
          </Panel>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHead
        title="Arıza ve Kesintiler"
        description="Plansız arızalar · planlı çalışmalar · abone duyuruları"
        actions={
          canOps ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setPlanOpen(true)}>
                <CalendarClock aria-hidden /> Çalışma Planla
              </Button>
              <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
                <Zap aria-hidden /> Arıza Kaydı Aç
              </Button>
            </>
          ) : null
        }
      />
      <PageBody>
        <CandidateStrip
          items={candidates.map((c) => ({
            id: c.transformerId,
            title: `Olası Ortak Arıza: ${c.transformer.name} Trafosunda ${c.count} Çağrı`,
            detail: `${substation(c.transformer.substationId).name} bölgesinden gelen çağrıların hiçbiri bir arızaya bağlı değil.`,
            action: (
              <>
                <a href={href("calls")} className="text-small font-medium text-strong underline-offset-2 hover:underline">Çağrıları Gör</a>
                {canOps ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      const o = createOutageFromCalls(c.transformerId);
                      if (o) {
                        notify({ title: "Arıza Kaydı Açıldı", body: `${o.id} · ${c.count} çağrı bağlandı, onarım iş emri oluştu`, tone: "success" });
                        go("outages", { id: o.id });
                      }
                    }}
                  >
                    Arızaya Çevir
                  </Button>
                ) : null}
              </>
            ),
          }))}
        />

        <PageHero
          primary={{ label: "Açık Arıza", value: fmtNum(open.length), foot: open.length ? `${fmtNum(openAffected)} abone şu an enerjisiz` : "Şebekede açık arıza yok", icon: <Zap />, to: { page: "outages", params: { tab: "acik" } } }}
          secondary={[
            { label: "Etkilenen Abone", value: fmtNum(openAffected), foot: open.length ? "Şu an enerjisiz" : "Enerjisiz abone yok", icon: <Users /> },
            { label: "Hassas Abone", value: fmtNum(openSensitive), foot: "Tıbbi cihaz vb. öncelikli", icon: <ShieldAlert /> },
            { label: "SAIDI · 30 Gün", value: fmtDec(reliab.saidi), unit: "dk", foot: "Abone başına süre", icon: <Timer />, to: { page: "outages", params: { tab: "guvenilirlik" } } },
            { label: "SAIFI · 30 Gün", value: fmtDec(reliab.saifi, 2), foot: "Abone başına kesinti", icon: <AlertTriangle />, to: { page: "outages", params: { tab: "guvenilirlik" } } },
            { label: "Ortalama Onarım", value: fmtDur(reliab.mttr), foot: "Giderilen plansız kayıtlar", icon: <Clock /> },
            { label: "Planlı Çalışma", value: fmtNum(planned.length), foot: `${fmtNum(getWorkOrders().filter((w) => w.type === "ariza" && w.status !== "tamamlandi" && w.status !== "iptal").length)} onarım iş emri açık`, icon: <CalendarClock />, to: { page: "outages", params: { tab: "planli" } } },
          ]}
        />

        <Tabs aria-label="Arıza ve Kesinti Görünümleri" variant="underline" value={tab} onValueChange={(v) => go("outages", { tab: v })} items={panels.map((p) => ({ value: p.value, label: p.label, panel: p.value === tab ? p.panel : null }))} />
      </PageBody>
      {dialogs}
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Listeler                                                                  */
/* ------------------------------------------------------------------------ */

function OpenList({ rows, patches }: { rows: readonly Outage[]; patches: ReturnType<typeof getOutageState>["patches"] }) {
  const list = useRef<HTMLUListElement>(null);
  useListKeys(list);
  return (
    <ul ref={list} role="list" aria-label="Açık Arızalar" className="divide-y divide-line-soft">
      {rows.map((o) => {
        const p = patches[o.id];
        const sensitive = affectedSensitive(o);
        return (
          <li key={o.id}>
            <RowLink className="grid gap-1 px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <RowAnchor to={{ page: "outages", params: { id: o.id } }} className="kz-mono">
                  {o.id}
                </RowAnchor>
                <OutageBadge status={o.status} kind={o.kind} />
                {sensitive ? (
                  <Badge tone="danger" dot>
                    {sensitive} hassas abone
                  </Badge>
                ) : null}
                {p?.smsSent ? <Badge tone="neutral">SMS gitti</Badge> : null}
              </div>
              <p className="text-base text-body">
                {o.cause} · {substation(o.substationId).name}
                {o.feederId ? ` · ${FEEDERS.find((f) => f.id === o.feederId)?.name.split(" · ")[1] ?? ""}` : ""}
              </p>
              <p className="text-small text-muted tabular-nums">
                {fmtNum(o.affected)} abone · {fmtDur(outageMin(o))} sürüyor · {p?.crew ?? o.crew}
                {p?.etaMin ? ` · tahmini ${fmtDur(p.etaMin)}` : ""}
              </p>
            </RowLink>
          </li>
        );
      })}
    </ul>
  );
}

function PlannedList({ rows, go }: { rows: readonly Outage[]; go: PageProps["go"] }) {
  const items: RecordItem[] = rows.map((o) => ({
    id: o.id,
    title: `${o.id} · ${substation(o.substationId).name}`,
    subtitle: `${o.cause} · ${region(o.regionId).name}`,
    leading: (
      <IconTile tone="warning">
        <Wrench />
      </IconTile>
    ),
    value: `${fmtNum(o.affected)} abone`,
    meta: `${fullDate.format(o.start)}, ${clock.format(o.start)}${o.end ? `-${clock.format(o.end)}` : ""}`,
    status: <OutageBadge status={o.status} kind={o.kind} />,
    href: href("outages", { id: o.id }),
    onSelect: () => go("outages", { id: o.id }),
  }));
  return (
    <div className="p-3 sm:p-4">
      <RecordList label="Planlı Çalışmalar" items={items} />
    </div>
  );
}

function HistoryTable({ rows, go }: { rows: readonly Outage[]; go: PageProps["go"] }) {
  const columns: Column<Outage>[] = [
    { key: "id", header: "Kayıt", sortable: true, sortValue: (o) => o.id, render: (o) => <a href={href("outages", { id: o.id })} className="kz-mono font-medium text-strong hover:underline">{o.id}</a> },
    { key: "cause", header: "Neden", render: (o) => o.cause },
    { key: "tm", header: "Trafo Merkezi", render: (o) => `${substation(o.substationId).name} · ${region(o.regionId).name}` },
    { key: "af", header: "Etkilenen", numeric: true, sortable: true, sortValue: (o) => o.affected, render: (o) => fmtNum(o.affected) },
    { key: "st", header: "Başlangıç", sortable: true, sortValue: (o) => o.start.getTime(), render: (o) => dateTime(o.start) },
    { key: "du", header: "Süre", numeric: true, sortable: true, sortValue: (o) => outageMin(o), render: (o) => fmtDur(outageMin(o)) },
    { key: "s", header: "Durum", render: (o) => <OutageBadge status={o.status} kind={o.kind} /> },
  ];
  return (
    <>
      <div className="max-md:hidden">
        <DataTable<Outage> caption="Giderilen kesintiler" columns={columns} rows={rows} rowKey={(o) => o.id} density="comfortable" on="surface" stickyFirst={false} empty="Bu listede kayıt yok" />
      </div>
      <div className="p-3 md:hidden">
        <RecordList
          label="Giderilen Kesintiler"
          items={rows.map<RecordItem>((o) => ({ id: o.id, title: `${o.id} · ${substation(o.substationId).name}`, subtitle: o.cause, value: fmtDur(outageMin(o)), meta: dateTime(o.start), status: <OutageBadge status={o.status} kind={o.kind} />, href: href("outages", { id: o.id }), onSelect: () => go("outages", { id: o.id }) }))}
        />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Ayrıntı                                                                   */
/* ------------------------------------------------------------------------ */

function OutageDetail({ o, patch, go, canOps, onSms, onClose }: { o: Outage; patch?: ReturnType<typeof getOutageState>["patches"][string]; go: PageProps["go"]; canOps: boolean; onSms: () => void; onClose: () => void }) {
  const { notify } = useApp();
  const isOpen = o.status === "acik";
  const planned = o.status === "planlandi";
  const crew = patch?.crew ?? o.crew;
  const etaMin = patch?.etaMin ?? 120;
  const [crewSel, setCrewSel] = useState<string | null>(crew);
  const [etaSel, setEtaSel] = useState<string | null>(String(etaMin));
  const customers = affectedCustomers(o);
  const sensitive = customers.filter(isSensitive);
  const calls = getCalls().filter((c) => c.outageId === o.id);
  const orders = getWorkOrders().filter((w) => w.linkedId === o.id);
  const minutes = outageMin(o);
  const crewChanged = !!crewSel && crewSel !== crew;
  const etaChanged = !!etaSel && Number(etaSel) !== etaMin;

  const seedSteps = outageTimeline(o);
  const events: TimelineEvent[] = [
    ...seedSteps.map((s) => ({ at: s.at, title: s.label, detail: undefined as string | undefined, tone: (s.id === "enerji" ? "success" : s.id === "bildirim" ? "danger" : "neutral") as TimelineEvent["tone"] })),
    ...(patch?.events ?? []).map((e) => ({ at: e.at, title: e.title, detail: e.detail, tone: e.tone as TimelineEvent["tone"] })),
  ]
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .map((e, i) => ({ id: `${o.id}-${i}`, at: e.at.toISOString(), when: dateTime(e.at), title: e.title, description: e.detail, tone: e.tone }));

  const regionMap: MapRegion[] = MAP_SHAPES.map((s) => ({ id: s.id, label: region(s.id).name, path: s.path, at: s.at, value: s.id === o.regionId ? 1 : 0, tone: s.id === o.regionId ? (isOpen ? "danger" : "warning") : "neutral", note: s.id === o.regionId ? `${o.id} · ${fmtNum(o.affected)} abone` : undefined }));

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
            {isOpen && canOps ? (
              <Button variant="primary" size="sm" onClick={onClose}>
                Enerji Verildi
              </Button>
            ) : null}
          </>
        }
      />
      <PageBody>
        <PageHero
          primary={{ label: planned ? "Planlanan Süre" : isOpen ? "Süre (Canlı)" : "Toplam Süre", value: planned && o.end ? fmtDur(Math.round((o.end.getTime() - o.start.getTime()) / 60_000)) : fmtDur(minutes), foot: planned ? `${fullDate.format(o.start)}, ${clock.format(o.start)}` : `Başlangıç ${dateTime(o.start)}`, icon: <Clock /> }}
          secondary={[
            { label: "Etkilenen Abone", value: fmtNum(o.affected), foot: isOpen ? "Şu an enerjisi yok" : "Etkilenen toplam", icon: <Users /> },
            { label: "Hassas Abone", value: fmtNum(sensitive.length), foot: sensitive.length ? "Öncelikli bilgilendir" : "Hassas abone yok", icon: <ShieldAlert /> },
            { label: "Ekip", value: crew.replace(/ \(.*\)/, ""), foot: crew, icon: <Wrench /> },
            { label: "Tahmini Süre", value: fmtDur(etaMin), foot: patch?.etaMin ? "Güncellendi" : "İlk tahmin", icon: <Timer /> },
            { label: "Abone Duyurusu", value: patch?.smsSent ? "Gönderildi" : "Bekliyor", foot: patch?.smsSent ? `${fmtNum(patch.smsSent)} SMS` : "SMS henüz gitmedi", icon: <MessageSquareText /> },
          ]}
        />

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-5">
          <div className="grid gap-5 xl:col-span-3">
            <Panel id="ad-zaman" title="Zaman Çizgisi" note="Bildirimden enerjinin verilmesine kadar her adım">
              <div className="p-4 sm:p-5">
                <Timeline events={events} />
              </div>
            </Panel>
            <Panel id="ad-harita" title="Bölge" note={`${region(o.regionId).name} · ${o.feederId ? FEEDERS.find((f) => f.id === o.feederId)?.name : substation(o.substationId).name}`}>
              <div className="p-4 sm:p-5">
                <div className="mx-auto max-w-md"><RegionMap title="Kesintinin Bölgesi" regions={regionMap} viewBox={MAP_VIEWBOX} format={(v) => (v ? "Bu kayıt" : "Etkilenmedi")} legend={["Etkilenmedi", "Bu kayıt"]} /></div>
              </div>
            </Panel>
          </div>

          <div className="grid gap-5 xl:col-span-2">
            <Panel id="ad-islem" title={planned ? "Planlı Çalışma" : "İşlemler"} note={isOpen ? "Ekip ve süre · abone duyurusu · onarım" : planned ? "Duyuru ve iptal" : "Kayıt kapalı"}>
              <div className="grid divide-y divide-line-soft">
                {isOpen && canOps ? (
                  <section aria-label="Ekip ve Süre" className="grid gap-3 p-4 sm:p-5">
                    <h3 className="text-base font-semibold text-strong">Ekip ve Süre</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Select label="Ekip" items={CREWS.map((c) => ({ value: c, label: c }))} value={crewSel} onValueChange={setCrewSel} />
                      <Select label="Tahmini Süre" items={ETA_CHOICES.map((m) => ({ value: String(m), label: fmtDur(m) }))} value={etaSel} onValueChange={setEtaSel} />
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-fit"
                      disabled={!crewChanged && !etaChanged}
                      onClick={() => {
                        if (crewChanged && crewSel) {
                          assignOutageCrew(o.id, crewSel);
                          notify({ title: `${o.id}: Ekip Atandı`, body: crewSel, tone: "success" });
                        }
                        if (etaChanged && etaSel) {
                          setOutageEta(o.id, Number(etaSel));
                          notify({ title: `${o.id}: Tahmini Süre ${fmtDur(Number(etaSel))}`, body: "Aboneleri bilgilendirmek için SMS gönderebilirsin", tone: "info" });
                        }
                      }}
                    >
                      Değişiklikleri Kaydet
                    </Button>
                  </section>
                ) : null}
                {(isOpen || planned) && canOps ? (
                  <section aria-label="Duyuru ve Onarım" className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                    <div className="grid content-start gap-1.5">
                      <h3 className="text-base font-semibold text-strong">Abone Duyurusu</h3>
                      <p className="text-small text-muted">{patch?.smsSent ? `${fmtNum(patch.smsSent)} aboneye SMS gitti` : "SMS henüz gitmedi"}</p>
                      <Button size="sm" variant={patch?.smsSent ? "ghost" : "primary"} className="mt-1 w-fit" onClick={onSms}>
                        <MessageSquareText aria-hidden /> SMS Gönder
                      </Button>
                    </div>
                    {isOpen ? (
                      <div className="grid content-start gap-1.5">
                        <h3 className="text-base font-semibold text-strong">Onarım</h3>
                        <p className="text-small text-muted">{orders.length ? `${fmtNum(orders.length)} iş emri bağlı` : "Bağlı iş emri yok"}</p>
                        {!orders.length ? (
                          <Button size="sm" variant="secondary" className="mt-1 w-fit" onClick={() => (createWorkOrder({ type: "ariza", regionId: o.regionId, reason: `${o.id} onarımı`, linkedId: o.id, assignee: crew, slaHours: 4 }), notify({ title: "Onarım İş Emri Oluşturuldu", body: crew, tone: "success" }))}>
                            <Wrench aria-hidden /> İş Emri Aç
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </section>
                ) : null}
                {planned && canOps ? (
                  <section aria-label="İptal" className="p-4 sm:p-5">
                    <Button size="sm" variant="danger" className="w-fit" onClick={() => (cancelOutage(o.id), notify({ title: `${o.id} İptal Edildi`, body: "Planlı çalışma duyurusu geri çekilecek", tone: "info" }), go("outages", { tab: "planli" }))}>
                      Çalışmayı İptal Et
                    </Button>
                  </section>
                ) : null}
                {!isOpen && !planned ? (
                  <p className="flex items-center gap-2 p-4 text-small text-success sm:p-5">
                    <CheckCircle2 aria-hidden className="size-4" /> Giderildi: enerji verildi
                  </p>
                ) : null}
              </div>
            </Panel>

            {isOpen ? (
              <section className="rounded-xl bg-overlay p-4 shadow-raised ring-1 ring-line sm:p-5">
                <FactorList
                  title="Öncelik Nedenleri"
                  className="max-w-none"
                  severity={sensitive.length || o.affected >= 1000 ? "high" : minutes >= 120 ? "medium" : "low"}
                  factors={[
                    { label: "Etkilenen Abone", value: fmtNum(o.affected), hint: "Şu an enerjisiz", tone: o.affected >= 1000 ? "danger" : "neutral" },
                    { label: "Hassas Abone", value: fmtNum(sensitive.length), hint: sensitive.length ? "Tıbbi cihaz vb. önce bilgilendir" : "Yok", tone: sensitive.length ? "danger" : "neutral" },
                    { label: "Açık Kalma Süresi", value: fmtDur(minutes), hint: `Tahmin ${fmtDur(etaMin)}`, tone: minutes > etaMin ? "warning" : "neutral" },
                    { label: "Gelen Çağrı", value: fmtNum(calls.length), hint: calls.length > 1 ? "Aynı arızadan tekrar eden çağrı" : "Bağlı çağrı az", tone: "neutral" },
                  ]}
                />
              </section>
            ) : null}
          </div>
        </div>

        <Panel
          id="ad-aboneler"
          title="Etkilenen Aboneler"
          note={`${fmtNum(customers.length)} abone · hassas aboneler başta${customers.length !== o.affected ? ` (kayıtta ${fmtNum(o.affected)}: modellenmeyen aboneler dahil)` : ""}`}
          actions={sensitive.length ? <Badge tone="danger" dot>{sensitive.length} hassas</Badge> : null}
        >
          {customers.length ? (
            <>
              <div className="max-md:hidden">
                <DataTable
                  caption="Etkilenen Abone Listesi"
                  rows={customers.slice(0, 30)}
                  rowKey={(c) => c.id}
                  density="comfortable"
                  on="surface"
                  stickyFirst={false}
                  columns={[
                    { key: "n", header: "Abone", render: (c) => (<span className="inline-flex flex-wrap items-center gap-2"><a href={href("customers", { id: c.id })} className="font-medium text-strong hover:underline">{c.name}</a>{isSensitive(c) ? <Badge tone="danger">Hassas</Badge> : null}</span>) },
                    { key: "i", header: "Tesisat No", render: (c) => <span className="kz-mono">{c.installation}</span> },
                    { key: "d", header: "Mahalle", render: (c) => c.district },
                    { key: "v", header: "Gerilim", render: (c) => c.voltage },
                    { key: "p", header: "Telefon", render: (c) => <span className="kz-mono">{c.phone}</span> },
                  ]}
                />
              </div>
              <div className="p-3 md:hidden">
                <RecordList label="Etkilenen Aboneler" items={customers.slice(0, 20).map<RecordItem>((c) => ({ id: c.id, title: c.name, subtitle: `${c.district} · ${c.voltage}${isSensitive(c) ? " · Hassas" : ""}`, value: c.phone, href: href("customers", { id: c.id }), onSelect: () => go("customers", { id: c.id }) }))} />
              </div>
            </>
          ) : (
            <EmptyStateX title="Modellenen Abone Yok" hint="Bu kayıt, modellenmeyen abonelerin bağlı olduğu bir şebeke bölümünde." />
          )}
        </Panel>

        {calls.length || orders.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel id="ad-cagri" title="Bağlı Çağrılar" note={`${calls.length} çağrı bu kayda bağlı`}>
            {calls.length ? (
              <ul role="list" className="divide-y divide-line-soft">
                {calls.slice(0, 8).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                    <a href={href("calls", { id: c.id })} className="kz-mono text-base font-medium text-strong hover:underline">{c.id}</a>
                    <span className="min-w-0 flex-1 truncate text-small text-muted">{c.note}</span>
                    <span className="text-small text-muted tabular-nums">{clock.format(c.at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-small text-muted sm:p-5">Bağlı çağrı yok.</p>
            )}
          </Panel>
          <Panel id="ad-isemri" title="Onarım İş Emirleri" note={`${orders.length} iş emri`}>
            {orders.length ? (
              <ul role="list" className="divide-y divide-line-soft">
                {orders.map((w) => (
                  <li key={w.id} className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                    <a href={href("workorders", { id: w.id })} className="kz-mono text-base font-medium text-strong hover:underline">{w.id}</a>
                    <span className="min-w-0 flex-1 truncate text-small text-muted">{WORK_TYPE_LABEL[w.type]} · {w.assignee ?? "Atanmadı"}</span>
                    <Badge tone={w.status === "tamamlandi" ? "success" : w.status === "iptal" ? "neutral" : "warning"} dot>{WORK_STATUS_LABEL[w.status]}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-small text-muted sm:p-5">Bağlı iş emri yok.</p>
            )}
          </Panel>
        </div>
        ) : null}
      </PageBody>
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Diyaloglar                                                                */
/* ------------------------------------------------------------------------ */

function SmsDialog({ o, etaMin, onClose, onSend }: { o: Outage | null; etaMin: number; onClose: () => void; onSend: (o: Outage) => void }) {
  const text = o ? messageOf(o, etaMin) : "";
  const sensitive = o ? affectedSensitive(o) : 0;
  return (
    <Dialog
      open={!!o}
      onOpenChange={(x) => !x && onClose()}
      title="Abonelere SMS Duyurusu"
      description={o ? `${region(o.regionId).name} · ${fmtNum(o.affected)} abone` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button variant="primary" onClick={() => o && onSend(o)}>{o ? `${fmtNum(o.affected)} Aboneye Gönder` : "Gönder"}</Button>
        </>
      }
    >
      <div className="grid gap-3">
        <p className="text-small text-muted">Önizleme (Türkçe karakter kullanılmaz; tek SMS 160 karakter sığar):</p>
        <p className="rounded-lg bg-surface p-3 text-small text-strong">{text}</p>
        <p className="text-micro text-muted">{text.length} karakter · {Math.ceil(text.length / 160)} SMS. Yalnız etkilenen aboneler ve bölge sakinleri alır.</p>
        {sensitive ? <p className="rounded-lg bg-warning-wash p-3 text-small text-strong">{sensitive} hassas abone var: SMS'e ek olarak telefonla aranmaları önerilir.</p> : null}
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
      description={o ? `${o.id} · ${fmtNum(o.affected)} abone` : undefined}
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

/** Bölge → TM → fider seçicileri: arıza ve planlı çalışma diyaloglarının ortak kısmı. */
function useTopology(initialRegion: string, initialFeeder?: string) {
  const [reg, setReg] = useState<string>(initialRegion);
  const [sub, setSub] = useState<string | null>(null);
  const [fdr, setFdr] = useState<string | null>(initialFeeder ?? null);
  const subs = SUBSTATIONS.filter((s) => s.regionId === reg);
  const subId = (sub && subs.some((s) => s.id === sub) ? sub : initialFeeder && FEEDERS.find((f) => f.id === initialFeeder)?.substationId) || subs[0]?.id || null;
  const fdrs = FEEDERS.filter((f) => f.substationId === subId);
  const fdrId = fdr && fdrs.some((f) => f.id === fdr) ? fdr : fdrs[0]?.id ?? null;
  const trs = fdrId ? feederTransformers(fdrId) : [];
  const impact = impactOf(trs.map((t) => t.id));
  return { reg, setReg: (v: string) => { setReg(v); setSub(null); setFdr(null); }, subId, setSub: (v: string | null) => { setSub(v); setFdr(null); }, fdrId, setFdr, subs, fdrs, trs, impact };
}

function TopologyFields({ t }: { t: ReturnType<typeof useTopology> }) {
  return (
    <>
      <Select label="Bölge" items={REGION_ITEMS} value={t.reg} onValueChange={(v) => v && t.setReg(v)} />
      <Select label="Trafo Merkezi" items={t.subs.map((s) => ({ value: s.id, label: s.name }))} value={t.subId} onValueChange={t.setSub} />
      <Select label="Fider" items={t.fdrs.map((f) => ({ value: f.id, label: f.name.split(" · ")[1] ?? f.name }))} value={t.fdrId} onValueChange={t.setFdr} />
    </>
  );
}

function CreateDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (o: Outage) => void }) {
  const t = useTopology("merkez");
  const [cause, setCause] = useState<string | null>(OUTAGE_CAUSES[0]);
  const [note, setNote] = useState("");
  const submit = () => {
    if (!t.subId || !t.fdrId) return;
    const crew = crewOf(t.reg);
    const o = createOutage({ kind: "plansiz", substationId: t.subId, regionId: t.reg, feederId: t.fdrId, transformerIds: t.trs.map((x) => x.id), start: TODAY, end: null, cause: cause ?? OUTAGE_CAUSES[0], crew, affected: t.impact.count || undefined });
    createWorkOrder({ type: "ariza", regionId: t.reg, reason: `${o.id} onarımı${note ? `: ${note}` : ""}`, linkedId: o.id, assignee: crew, slaHours: 4 });
    onCreate(o);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(x) => !x && onClose()}
      size="lg"
      title="Arıza Kaydı Aç"
      description="Fider seçilince etkilenen aboneler, bağlı dağıtım trafolarından hesaplanır."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button variant="primary" onClick={submit} disabled={!t.fdrId}>Kaydı Aç ve Ekibi Gönder</Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <TopologyFields t={t} />
        <Select label="Neden" items={OUTAGE_CAUSES.map((c) => ({ value: c, label: c }))} value={cause} onValueChange={setCause} />
        <div className="rounded-lg bg-surface p-3 text-small sm:col-span-2">
          <p className="text-muted">Tahmini Etkilenen</p>
          <p className="mt-0.5 text-read font-semibold text-strong tabular-nums">{fmtNum(t.impact.count)} abone <span className="text-small font-normal text-muted">· {t.trs.length} dağıtım trafosu</span></p>
          {t.impact.sensitive ? <p className="mt-1 text-small text-warning">{t.impact.sensitive} hassas abone: öncelikli bilgilendir.</p> : null}
          <p className="mt-1 text-micro text-muted">Ekip: {crewOf(t.reg)}. Onarım iş emri (4 saat hedef) otomatik açılır.</p>
        </div>
        <div className="sm:col-span-2">
          <Textarea label="Not (İç Kullanım)" value={note} onChange={(e) => setNote(e.target.value)} minRows={2} />
        </div>
      </div>
    </Dialog>
  );
}

function PlanDialog({ open, planFor, onClose, onPlan }: { open: boolean; planFor?: string; onClose: () => void; onPlan: (o: Outage, shifted: boolean) => void }) {
  const preset = planFor ? feederOfTransformer(planFor) : undefined;
  const t = useTopology(preset?.regionId ?? "merkez", preset?.feederId);
  const [date, setDate] = useState(dayKey(addDays(TODAY, 3)));
  const [hour, setHour] = useState("09");
  const [duration, setDuration] = useState("4");
  const [cause, setCause] = useState<string | null>(PLAN_CAUSES[0]);
  const policy = getCutPolicy();

  const wantedHour = Number(hour);
  const business = isBusinessDay(date, policy.holidays);
  const inHours = inWorkHours(wantedHour, policy.workStart, policy.workEnd);
  const slot = scheduleSlot(date, wantedHour);
  const shifted = keyOf(slot) !== date || slot.getHours() !== wantedHour;
  const end = new Date(slot.getTime() + Number(duration) * 3_600_000);
  const lead = Math.round((slot.getTime() - TODAY.getTime()) / 3_600_000);
  const msg = `Bakim calismasi nedeniyle ${keyOf(slot)} tarihinde ${clock.format(slot)}-${clock.format(end)} saatleri arasinda ${region(t.reg).name} bolgesinde elektrik kesilecektir. Anlayisiniz icin tesekkur ederiz.`;

  const planChecks: PolicyCheck[] = [
    { id: "gun", label: "İş Günü", detail: business ? "Seçilen gün iş günü" : "Seçilen gün iş günü değil", state: business ? "pass" : "warn" },
    { id: "mesai", label: "Mesai Saati", detail: inHours ? "Başlangıç mesai içinde" : "Seçilen saat mesai dışında", state: inHours ? "pass" : "warn" },
    { id: "yer", label: "Planlanan Zaman", detail: shifted ? `${fullDate.format(slot)}, ${clock.format(slot)} olarak kaydırılır` : "İstenen zamanda planlanır", state: shifted ? "warn" : "pass" },
    { id: "hassas", label: "Hassas Abone", detail: t.impact.sensitive ? `${t.impact.sensitive} hassas abone etkilenir: alternatif besleme ya da jeneratör planı gerekir` : "Hassas abone etkilenmiyor", state: t.impact.sensitive ? "warn" : "pass" },
    { id: "duyuru", label: "Duyuru Süresi", detail: lead >= 48 ? "48 saatten fazla, yeterli" : "48 saatten kısa: kurul bildirimi gerekir", state: lead >= 48 ? "pass" : "warn" },
  ];

  const submit = () => {
    if (!t.subId || !t.fdrId) return;
    const o = createOutage({ kind: "planli", substationId: t.subId, regionId: t.reg, feederId: t.fdrId, transformerIds: t.trs.map((x) => x.id), start: slot, end, cause: cause ?? PLAN_CAUSES[0], crew: crewOf(t.reg), affected: t.impact.count || undefined });
    onPlan(o, shifted);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(x) => !x && onClose()}
      size="lg"
      title="Planlı Çalışma Planla"
      description="Tarih ve saat iş gününe ve mesaiye oturur; etkilenen aboneler fiderden hesaplanır."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button variant="primary" onClick={submit} disabled={!t.fdrId}>Planla ve Duyur</Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Tarih" type="date" value={date} min={dayKey(addDays(TODAY, 1))} onChange={(e) => setDate(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Başlangıç Saati" items={Array.from({ length: 10 }, (_, i) => String(i + 7).padStart(2, "0")).map((h) => ({ value: h, label: `${h}:00` }))} value={hour} onValueChange={(v) => v && setHour(v)} />
          <Select label="Süre" items={[2, 3, 4, 6, 8].map((h) => ({ value: String(h), label: `${h} Saat` }))} value={duration} onValueChange={(v) => v && setDuration(v)} />
        </div>
        <TopologyFields t={t} />
        <Select label="Neden" items={PLAN_CAUSES.map((c) => ({ value: c, label: c }))} value={cause} onValueChange={setCause} />
        <div className="rounded-lg bg-surface p-3 text-small sm:col-span-2">
          <p className="text-muted">Etki Simülasyonu</p>
          <p className="mt-0.5 text-read font-semibold text-strong tabular-nums">{fmtNum(t.impact.count)} abone <span className="text-small font-normal text-muted">· {t.trs.length} dağıtım trafosu</span></p>
          <PolicyChecks className="mt-3" title="Planlama Kontrolleri" checks={planChecks} />
        </div>
        <div className="sm:col-span-2">
          <p className="text-small text-muted">Abone Duyurusu Önizlemesi</p>
          <p className="mt-1 rounded-lg bg-surface p-3 text-small text-strong">{msg}</p>
        </div>
      </div>
    </Dialog>
  );
}

function feederOfTransformer(id: string) {
  for (const f of FEEDERS) {
    const tr = feederTransformers(f.id).find((x) => x.id === id);
    if (tr) return { regionId: f.regionId, feederId: f.id };
  }
  return undefined;
}

