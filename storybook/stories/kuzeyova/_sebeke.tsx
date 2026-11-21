"use client";

import { useMemo, useRef } from "react";
import { Activity, AlertTriangle, Gauge as GaugeIcon, Network, Radio, SunMedium, Zap } from "lucide-react";
import { AreaChart } from "@/components/ui/area-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { GaugeChart } from "@/components/ui/gauge-chart";
import { ImpactBar } from "@/components/ui/impact-bar";
import { InsightCallout } from "@/components/ui/insight-callout";
import { RegionMap, type MapRegion } from "@/components/ui/region-map";
import { StatusList } from "@/components/ui/status-list";
import { TreeTable, type TreeTableRow } from "@/components/ui/tree-table";
import { useDerived } from "./_core";
import { FEEDERS, METERS, SYSTEMS, TRANSFORMERS, region, substation, transformer } from "./_data";
import { TRANSFORMER_LOADS } from "./_data-yeni";
import { buildGrid, customerOf, impactOf, isSensitive, loadOf, loadTone, transformerCurve, type GridNode } from "./_data-ops-sayfa";
import { MAP_SHAPES, MAP_VIEWBOX } from "./_harita";
import { EmptyStateX, PageHero, RowAnchor, RowLink, fmtDec, fmtNum, fmtPct, useListKeys } from "./_kit";
import { openOutages, overloadedTransformers } from "./_selectors";
import { useProducers } from "./_store";
import { useCan } from "./_permissions";
import { PageBody, PageHead, Panel, href, useApp, type PageProps } from "./_ui";

/* ------------------------------------------------------------------------ */
/* Ortak                                                                     */
/* ------------------------------------------------------------------------ */

const TONE_LABEL = { danger: "Aşırı yük", warning: "Yüksek", success: "Normal" } as const;
const LIMIT = 90;

function LoadCell({ pct }: { pct: number }) {
  const tone = loadTone(pct);
  return (
    <span className="relative inline-flex items-center gap-2">
      <span aria-hidden className="relative block h-2 w-14 overflow-hidden rounded-full bg-chart-track">
        <span className={tone === "danger" ? "absolute inset-y-0 left-0 bg-danger" : tone === "warning" ? "absolute inset-y-0 left-0 bg-warning" : "absolute inset-y-0 left-0 bg-chart-1"} style={{ width: `${Math.min(100, pct)}%` }} />
      </span>
      <span className="font-medium text-strong tabular-nums">{fmtPct(pct)}</span>
      <span className="sr-only">{TONE_LABEL[tone]}</span>
    </span>
  );
}

function rowOf(n: GridNode, feedersWithOutage: ReadonlySet<string>, selected: string | null): TreeTableRow {
  const outage = n.kind === "fider" && feedersWithOutage.has(n.id);
  return {
    id: n.id,
    cells: {
      ad:
        n.kind === "dtr" ? (
          <a href={href("grid", { id: n.id })} className={`font-medium hover:underline ${selected === n.id ? "text-primary-ink" : "text-strong"}`}>
            {n.label}
          </a>
        ) : (
          <span className="inline-flex flex-wrap items-center gap-2 font-medium text-strong">
            {n.kind === "fider" ? n.label.split(" · ")[1] : n.label}
            {n.extra ? <span className="text-small font-normal text-muted">{n.extra}</span> : null}
            {outage ? <Badge tone="danger" dot>Kesinti</Badge> : null}
          </span>
        ),
      kva: <span className="tabular-nums">{fmtNum(n.kva)}</span>,
      kw: <span className="tabular-nums">{fmtDec(n.kw)}</span>,
      doluluk: <LoadCell pct={n.pct} />,
      abone: <span className="tabular-nums">{fmtNum(n.customers)}</span>,
    },
    children: n.children?.map((c) => rowOf(c, feedersWithOutage, selected)),
  };
}

/* ------------------------------------------------------------------------ */
/* Sayfa                                                                     */
/* ------------------------------------------------------------------------ */

export function SebekePage({ params, go }: PageProps) {
  const grid = useMemo(() => buildGrid(), []);
  const producerKw = useProducers().reduce((s, p) => s + p.installedKw, 0);
  const outages = useDerived(() => openOutages());
  const feedersWithOutage = useMemo(() => new Set(outages.map((o) => o.feederId).filter(Boolean) as string[]), [outages]);
  const over = overloadedTransformers(LIMIT);
  const selected = params.id && TRANSFORMERS.some((t) => t.id === params.id) ? params.id : null;
  const listRef = useRef<HTMLUListElement>(null);
  useListKeys(listRef);

  const total = TRANSFORMER_LOADS.length;
  const avg = TRANSFORMER_LOADS.reduce((s, l) => s + l.loadPct, 0) / total;
  const high = TRANSFORMER_LOADS.filter((l) => l.loadPct >= 75).length;
  const scada = SYSTEMS.find((s) => s.id === "scada");
  const alarm = [...TRANSFORMER_LOADS].filter((l) => l.loadPct >= 80).sort((a, b) => b.loadPct - a.loadPct).slice(0, 8);

  const regionMap: MapRegion[] = MAP_SHAPES.map((s) => {
    const ids = new Set(TRANSFORMERS.filter((t) => t.regionId === s.id).map((t) => t.id));
    const loads = TRANSFORMER_LOADS.filter((l) => ids.has(l.id));
    const pct = loads.length ? loads.reduce((x, l) => x + l.loadPct, 0) / loads.length : 0;
    const hot = loads.filter((l) => l.loadPct >= LIMIT).length;
    return { id: s.id, label: region(s.id).name, path: s.path, at: s.at, value: Math.round(pct * 10) / 10, tone: hot ? "danger" : undefined, note: `${loads.length} DTR${hot ? ` · ${hot} aşırı yüklü` : ""}` };
  });

  const expanded = useMemo(() => {
    const base = grid.map((g) => g.id);
    if (!selected) return base;
    const tr = transformer(selected);
    return [...base, tr.feederId];
  }, [grid, selected]);
  const rows = useMemo(() => grid.map((g) => rowOf(g, feedersWithOutage, selected)), [grid, feedersWithOutage, selected]);

  return (
    <>
      <PageHead title="Şebeke ve Trafo" description="Trafo merkezi, fider ve dağıtım trafosu yükü: doluluk, alarm ve etkilenen aboneler." />
      <PageBody>
        <PageHero
          primary={{ label: "Aşırı Yüklü DTR", value: fmtNum(over.length), foot: over.length ? `%${LIMIT} üstü doluluk · kapasite artırımı ya da yük aktarımı gerekir` : `%${LIMIT} üstü trafo yok`, icon: <AlertTriangle /> }}
          secondary={[
            { label: "Dağıtım Trafosu", value: fmtNum(total), foot: `${fmtNum(FEEDERS.length)} fider · ${new Set(TRANSFORMERS.map((t) => t.substationId)).size} TM`, icon: <Network /> },
            { label: "Ortalama Doluluk", value: fmtPct(avg), foot: "Modellenen yük ÷ kullanılabilir kapasite", icon: <GaugeIcon /> },
            { label: "Yüksek Yük (%75+)", value: fmtNum(high), foot: "İzlemeye alınacak trafolar", icon: <Activity /> },
            { label: "Kesintideki Fider", value: fmtNum(feedersWithOutage.size), foot: `${fmtNum(outages.length)} açık arıza`, icon: <Zap />, to: { page: "outages", params: { tab: "acik" } } },
            { label: "Net Ölçüm Üretimi", value: fmtNum(producerKw), unit: "kW", foot: "Kurulu güç, çift yönlü sayaç", icon: <SunMedium /> },
            { label: "SCADA Aktarımı", value: scada?.status === "operational" ? "Çalışıyor" : "Bakımda", foot: "Yük değerleri son aktarımdan", icon: <Radio /> },
          ]}
        />

        <div className="grid gap-5 xl:grid-cols-5">
          <Panel id="sebeke-agac" title="Şebeke Hiyerarşisi" note="TM > fider > dağıtım trafosu. Trafo adına basınca ayrıntısı açılır." className="xl:col-span-3">
            <div className="p-3 sm:p-4">
              <TreeTable
                caption="Trafo merkezi, fider ve dağıtım trafosu yükü"
                minWidth="38rem"
                defaultExpanded={expanded}
                columns={[
                  { key: "ad", header: "Düğüm" },
                  { key: "kva", header: "Kapasite (kVA)", numeric: true },
                  { key: "kw", header: "Yük (kW)", numeric: true },
                  { key: "doluluk", header: "Doluluk", width: "9.5rem" },
                  { key: "abone", header: "Abone", numeric: true },
                ]}
                rows={rows}
              />
            </div>
          </Panel>
          <div className="grid content-start gap-5 xl:sticky xl:top-4 xl:col-span-2 xl:self-start">
            <Panel id="sebeke-harita" title="Bölgeye Göre Doluluk" note="Bölgedeki dağıtım trafolarının ortalama doluluğu.">
              <div className="p-4 sm:p-5">
                <RegionMap title="Bölgeye Göre Ortalama Trafo Doluluğu" regions={regionMap} viewBox={MAP_VIEWBOX} format={(v) => fmtPct(v)} scale={{ min: 30, max: 80 }} legend={["Düşük yük", "Yüksek yük"]} onSelect={(id) => { const worst = [...TRANSFORMER_LOADS].filter((l) => transformer(l.id).regionId === id).sort((a, b) => b.loadPct - a.loadPct)[0]; if (worst) go("grid", { id: worst.id }); }} />
              </div>
            </Panel>
            <Panel id="sebeke-alarm" title="Yük Alarmları" note={`%80 üstü; en yüksek ${alarm.length} trafo.`} actions={<Badge tone={over.length ? "danger" : "success"} dot>{over.length} aşırı yük</Badge>}>
              {alarm.length ? (
                <ul ref={listRef} role="list" className="divide-y divide-line-soft">
                  {alarm.map((l) => {
                    const t = transformer(l.id);
                    const tone = loadTone(l.loadPct);
                    return (
                      <li key={l.id}>
                        <RowLink className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                          <span className="min-w-0 flex-1">
                            <RowAnchor to={{ page: "grid", params: { id: l.id } }}>{t.name}</RowAnchor>
                            <span className="block truncate text-small text-muted">{substation(t.substationId).name} · {fmtNum(l.customers)} abone</span>
                          </span>
                          <Badge tone={tone} dot>{fmtPct(l.loadPct)} · {TONE_LABEL[tone]}</Badge>
                        </RowLink>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyStateX title="Alarm Yok" hint="Hiçbir trafo %80 doluluğun üstünde değil." />
              )}
            </Panel>
          </div>
        </div>

        {selected ? <TransformerDetail id={selected} go={go} /> : <p className="rounded-xl bg-surface p-4 text-small text-muted">Ayrıntı için ağaçtaki bir dağıtım trafosuna ya da alarm listesindeki bir satıra bas: yük eğrisi, bağlı aboneler, üreticiler ve planlı çalışma etkisi burada açılır.</p>}

        <Panel id="sebeke-sistem" title="Veri Akışı" note="Yük değerlerinin geldiği sistemler.">
          <div className="p-4 sm:p-5">
            <StatusList title="Baş Uç ve Haberleşme" headingLevel={3} items={SYSTEMS.filter((s) => ["scada", "ami", "gsm"].includes(s.id)).map((s) => ({ id: s.id, label: s.label, status: s.status }))} incident={scada?.status !== "operational" ? "SCADA aktarımı bakımda: trafo yükleri son başarılı aktarım değeriyle gösterilir." : undefined} />
          </div>
        </Panel>
      </PageBody>
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Trafo ayrıntısı                                                           */
/* ------------------------------------------------------------------------ */

function TransformerDetail({ id, go }: { id: string; go: PageProps["go"] }) {
  const { notify } = useApp();
  const canPlan = useCan("sayac") || useCan("musteri");
  const t = transformer(id);
  const l = loadOf(id);
  const producers = useProducers();
  const meters = METERS.filter((m) => m.transformerId === id);
  const customers = meters.map((m) => customerOf(m.customerId));
  const mine = producers.filter((p) => meters.some((m) => m.id === p.meterId));
  const installed = mine.reduce((s, p) => s + p.installedKw, 0);
  const impact = impactOf([id]);
  const outage = openOutages().find((o) => (o.transformerIds ?? []).includes(id));
  const pct = l?.loadPct ?? 0;
  const tone = loadTone(pct);
  const labels = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);
  const today = transformerCurve(id, 0);
  const yest = transformerCurve(id, 1);
  const peakHour = today.indexOf(Math.max(...today));
  const sameFeeder = TRANSFORMER_LOADS.filter((x) => transformer(x.id).feederId === t.feederId && x.id !== id).sort((a, b) => a.loadPct - b.loadPct);
  const transfer = sameFeeder[0];

  return (
    <section aria-labelledby="trafo-baslik" className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="trafo-baslik" className="text-heading font-semibold text-strong">
          {t.name} <span className="text-base font-normal text-muted">· {substation(t.substationId).name} · {FEEDERS.find((f) => f.id === t.feederId)?.name.split(" · ")[1]} · {fmtNum(t.kva)} kVA</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => go("grid")}>Seçimi Kaldır</Button>
          {canPlan ? <Button size="sm" variant="secondary" onClick={() => go("outages", { tab: "planli", plan: id })}>Planlı Çalışma Oluştur</Button> : null}
        </div>
      </div>

      {outage ? (
        <InsightCallout kind="warning" label="Açık Arıza" title={`${outage.id} Arızasının İçinde`} headingLevel={3} icon={Zap}>
          Bu trafo <a href={href("outages", { id: outage.id })} className="font-semibold underline-offset-2 hover:underline">{outage.id}</a> arızasının içinde: {fmtNum(outage.affected)} abone enerjisiz.
        </InsightCallout>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-5">
        <Panel id="trafo-doluluk" title="Doluluk" note={`Kullanılabilir kapasite ${fmtDec(t.kva * 0.9, 0)} kVA (güç faktörü 0,9 varsayımı)`} className="lg:col-span-2">
          <div className="grid gap-3 p-4 sm:p-5">
            <GaugeChart title={`${t.name} doluluğu`} parts={[{ label: "Doluluk", value: pct, series: 1 }]} max={Math.max(100, pct)} label="Doluluk" />
            <p className="text-center text-small text-muted"><Badge tone={tone} dot>{TONE_LABEL[tone]}</Badge> · yük {fmtDec(l?.loadKw ?? 0)} kW · bağlı {fmtNum(l?.connectedKva ?? 0)} kVA</p>
            <ImpactBar label="Kapasite Kullanımı" current={l?.loadKw ?? 0} added={0} limit={t.kva * 0.9} warnAt={LIMIT} format={(n) => `${fmtDec(n, 0)} kW`} />
            {pct >= LIMIT ? (
              <InsightCallout kind="warning" label="Öneri" title="Yük Dengeleme Öner" headingLevel={3}>
                Doluluk %{LIMIT} sınırının üstünde. {transfer ? `Yük aktarımı için aynı fiderdeki ${transformer(transfer.id).name} (${fmtPct(transfer.loadPct)}) uygun görünüyor.` : "Aynı fiderde aktarım için boş trafo yok."}
              </InsightCallout>
            ) : null}
          </div>
        </Panel>
        <Panel id="trafo-egri" title="24 Saatlik Yük" note={`Tepe saat ${String(peakHour).padStart(2, "0")}:00 · kapasiteye oran (%)`} className="lg:col-span-3">
          <div className="p-4 sm:p-5">
            <AreaChart title={`${t.name} gün içi doluluk`} labels={labels} series={[{ label: "Bugün", values: today, series: 1 }, { label: "Dün", values: yest, series: 3 }]} unit="%" valueFormat={{ maximumFractionDigits: 1 }} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel id="trafo-aboneler" title="Bağlı Aboneler" note={`${fmtNum(customers.length)} modellenen abone · hassas aboneler etiketli`}>
          {customers.length ? (
            <ul role="list" className="divide-y divide-line-soft">
              {customers.slice(0, 8).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                  <a href={href("customers", { id: c.id })} className="min-w-0 flex-1 truncate text-base font-medium text-strong hover:underline">{c.name}</a>
                  {isSensitive(c) ? <Badge tone="danger">Hassas</Badge> : null}
                  <span className="text-small text-muted tabular-nums">{c.voltage} · {fmtNum(c.baseKwh)} kWh/ay</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyStateX title="Modellenen Abone Yok" hint="Bu trafoya bağlı abonelerin çoğu pilot veride yer almıyor." />
          )}
        </Panel>
        <Panel id="trafo-uretici" title="Net Ölçüm Üreticileri" note="Çift yönlü sayaçlı lisanssız üretim etkisi.">
          <div className="grid gap-3 p-4 sm:p-5">
            {mine.length ? (
              <>
                <p className="flex items-center gap-2 text-base text-strong"><SunMedium aria-hidden className="size-4 text-warning" /> {mine.length} üretici · toplam {fmtNum(installed)} kW kurulu güç</p>
                <p className="text-small text-muted">Öğle saatlerinde şebekeye verilen enerji trafo yükünü düşürür; akşam tepesinde katkı yoktur. Kurulu güç trafo kapasitesinin %{fmtDec((installed / t.kva) * 100, 1)}'i.</p>
                <ul role="list" className="grid gap-1 text-small">
                  {mine.map((p) => (
                    <li key={p.id} className="flex justify-between gap-3"><a href={href("producers", { id: p.id })} className="font-medium text-strong hover:underline">{customerOf(p.customerId).name}</a><span className="text-muted tabular-nums">{p.installedKw} kW</span></li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-small text-muted">Bu trafoya bağlı net ölçüm üreticisi yok.</p>
            )}
          </div>
        </Panel>
      </div>

      <Panel id="trafo-etki" title="Planlı Çalışma Etki Simülasyonu" note="Bu trafoyu devre dışı bırakırsan:">
        <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
          {[
            ["Etkilenen abone", fmtNum(impact.count), "Bağlı sayaçlardan türeyen"],
            ["Hassas abone", fmtNum(impact.sensitive), impact.sensitive ? "Alternatif besleme planı gerekir" : "Hassas abone yok"],
            ["Aynı fiderde aktarım", transfer ? `${transformer(transfer.id).name} (${fmtPct(transfer.loadPct)})` : "Yok", transfer ? "En düşük dolulukta komşu trafo" : "Komşu trafo yok"],
          ].map(([k, v, f]) => (
            <div key={k} className="rounded-lg bg-surface p-3">
              <p className="text-small text-muted">{k}</p>
              <p className="mt-0.5 text-read font-semibold text-strong tabular-nums">{v}</p>
              <p className="text-small text-muted">{f}</p>
            </div>
          ))}
        </div>
        {canPlan ? (
          <div className="border-t border-line-soft p-4 sm:px-5">
            <Button size="sm" variant="primary" onClick={() => { notify({ title: "Planlı Çalışma Formu Açıldı", body: `${t.name} önceden seçili`, tone: "info" }); go("outages", { tab: "planli", plan: id }); }}>
              Bu Trafo İçin Çalışma Planla
            </Button>
          </div>
        ) : null}
      </Panel>
    </section>
  );
}

