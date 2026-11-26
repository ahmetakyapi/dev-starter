"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, BookOpenCheck, ClipboardList, Gauge, Lightbulb, Receipt, Route, UserPlus, Users, WifiOff, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { AreaChart } from "@/components/ui/area-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { ChartCard } from "@/components/ui/chart-card";
import { ComboChart } from "@/components/ui/combo-chart";
import { ScheduleList, type ScheduleItem } from "@/components/ui/schedule-list";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  CURRENT_PERIOD,
  FLAG_LABEL,
  INVOICES,
  PERIODS,
  PERIODS_12,
  SYSTEMS,
  SUBSTATIONS,
  TODAY,
  balanceOf,
  clock,
  collectionIn,
  type Invoice,
  customer,
  daysBetween,
  loadCurve,
  meterById,
  monthShort,
  num,
  parseDay,
  pct,
  periodLabel,
  regionLoss,
  tl,
  windowPeriods,
  type Period,
} from "./_data";
import { useDerived } from "./_core";
import { activeInvoices, commsLostMeters, flaggedReadings, openOutages, overdueInvoices, openWorkOrders, useLiveStats } from "./_selectors";
import { effectiveMeters } from "./_ops";
import { WORK_TYPE_LABEL as WORK_LABEL_X, type WorkType } from "./_store";
import { CartoLegend, CartoMap, type CartoMarker, type CartoRegion } from "./_harita-carto";
import { useRole } from "./_permissions";
import { COLLECTION_SCOPE, flaggedReadings as flagged, overdueTotal, useBadges } from "./_selectors";
import { useAging } from "./_data-pano";
import { AgingBars, BarTarget, Metric, NavLink, RowAnchor, RowLink, todayItems, fmtDec, fmtKwh, fmtNum, fmtPct, fmtTl, fmtTlCompact, type MetricProps } from "./_kit";
import { PageBody, PageHead, Panel, useApp, type PageProps } from "./_ui";

/** Dönem seçici: panonun bütün ölçülerini ve grafiklerini birlikte değiştirir. */
export function PeriodControl({ size = "md" }: { size?: "sm" | "md" }) {
  const { period, setPeriod } = useApp();
  return (
    <SegmentedControl<Period>
      aria-label="Dönem"
      size={size}
      value={period}
      onValueChange={setPeriod}
      options={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
    />
  );
}

type Attention = {
  id: string;
  kind: "okuma" | "fatura" | "sayac" | "ariza";
  /** Ne olduğu: tek cümle. */
  what: string;
  /** Kime/neye ait. */
  who: string;
  /** Ne kadar süredir / tutar. */
  detail: string;
  to: { page: "readings" | "invoices" | "meters" | "outages"; params: Record<string, string> };
  sort: number;
};

/** Dikkat gerektirenler: aynı listelerden süzülen dört kaynak, tek tabloda. */
function buildAttention(): Attention[] {
  const rows: Attention[] = [];
  flaggedReadings(CURRENT_PERIOD)
    .slice(0, 4)
    .forEach((r) =>
      rows.push({
        id: r.id,
        kind: "okuma",
        what: r.flags[0] ? FLAG_LABEL[r.flags[0]] : "Şüpheli okuma",
        who: customer(r.customerId).name,
        detail: `${meterById(r.meterId)?.serial ?? r.meterId}`,
        to: { page: "readings", params: { id: r.id } },
        sort: 3,
      }),
    );
  overdueInvoices()
    .sort((a, b) => balanceOf(b) - balanceOf(a))
    .slice(0, 4)
    .forEach((i) =>
      rows.push({
        id: i.id,
        kind: "fatura",
        what: `${daysBetween(parseDay(i.due), TODAY)} gün gecikmiş fatura`,
        who: customer(i.customerId).name,
        detail: tl(balanceOf(i)),
        to: { page: "invoices", params: { id: i.id } },
        sort: 2,
      }),
    );
  commsLostMeters()
    .sort((a, b) => a.lastSeen.getTime() - b.lastSeen.getTime())
    .slice(0, 3)
    .forEach((m) =>
      rows.push({
        id: m.id,
        kind: "sayac",
        what: `${daysBetween(m.lastSeen, TODAY)} gündür iletişim yok`,
        who: customer(m.customerId).name,
        detail: m.serial,
        to: { page: "meters", params: { id: m.id } },
        sort: 1,
      }),
    );
  openOutages().slice(0, 2).forEach((o) =>
    rows.push({
      id: o.id,
      kind: "ariza",
      what: `Açık arıza · ${o.cause}`,
      who: `${o.substationId} trafo merkezi`,
      detail: `${num.format(o.affected)} abone etkileniyor`,
      to: { page: "outages", params: { id: o.id } },
      sort: 4,
    }),
  );
  return rows.sort((a, b) => b.sort - a.sort);
}

const KIND = {
  okuma: { label: "Okuma", icon: <BookOpenCheck />, tone: "danger" as const },
  fatura: { label: "Fatura", icon: <Receipt />, tone: "warning" as const },
  sayac: { label: "Sayaç", icon: <WifiOff />, tone: "warning" as const },
  ariza: { label: "Arıza", icon: <Zap />, tone: "danger" as const },
};

const WORK_COLOR: Record<WorkType, 1 | 2 | 3 | 4 | 5 | 6> = { kesme: 6, baglama: 5, "sayac-degisim": 3, "okuma-turu": 1, kontrol: 4, sokum: 3, kesif: 2, montaj: 2, ariza: 6 };

/** Tek katmanlı kart: Panel ile aynı yüzey (iç içe kart yok). */
const FLAT = "bg-overlay shadow-raised ring-1 ring-line";
const SYSTEM_DOT = { operational: "bg-success", degraded: "bg-warning", outage: "bg-danger", maintenance: "bg-muted" } as const;
const SYSTEM_TEXT = { operational: "Çalışıyor", degraded: "Yavaş", outage: "Kesinti", maintenance: "Bakımda" } as const;

const ROLE_HERO: Record<string, string> = { okuma: "supheli", tahsilat: "tahsilat", musteri: "ariza", denetci: "tahsilat", yonetici: "tahsilat" };

const TONE_DOT = { danger: "bg-danger", warning: "bg-warning", neutral: "bg-muted" } as const;
const TONE_INK = { danger: "text-danger", warning: "text-warning", neutral: "text-muted" } as const;
const TONE_WORD = { danger: "Kritik", warning: "Bekliyor", neutral: "Takipte" } as const;

/* ── Brifing: Pano'nun ilk ekranı ─────────────────────────────────────────
   Sahibinin geri bildirimi (26 Kasım 2026): ilk sürümde karşılama kartı, dünya küresi, nabız
   halkaları ve ayrı "Bugün Senin İşin" kutusu üst üste binmiş katmanlar gibiydi ("hiç olmamış",
   "dünyayı kaldır", "aradaki mesafe çok fazla"). Şimdi TEK kart: kişiye seslenen iki tonlu başlık,
   başlığın sözünü ettiği işlerin KENDİSİ (aynı kartta, ayrı kutu değil), öneri ve kısayollar.
   Süs nesnesi yok; görsel ağırlığı yanındaki spot kartının gerçek verisi taşır. */
function Brief({ go, tip }: { go: PageProps["go"]; tip: ReactNode }) {
  const role = useRole();
  const items = useDerived(() => todayItems(role), [role]);
  const open = items.filter((i) => i.count > 0);
  const clear = items.filter((i) => i.count === 0);
  const day = new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long" }).format(TODAY);
  const actions = [
    { label: "Okuma Turu", icon: <Route />, page: "field" as const },
    { label: "Arıza Kaydı", icon: <Zap />, page: "outages" as const },
    { label: "Tahakkuk", icon: <ClipboardList />, page: "invoices" as const },
    { label: "Yeni Abone", icon: <UserPlus />, page: "register" as const },
  ];
  return (
    <section aria-labelledby="pano-brief" className="grid content-start overflow-hidden rounded-xl bg-overlay shadow-raised ring-1 ring-line">
      <div className="grid gap-1.5 px-5 pt-5 pb-4 sm:px-6">
        <p className="text-base text-muted">Günaydın Aylin · {day}</p>
        <h2 id="pano-brief" className="font-display text-[clamp(1.625rem,2.4vw,2.125rem)] leading-[1.08] font-semibold tracking-[-0.03em] text-strong">
          {open.length ? (
            <>
              Bugün {fmtNum(open.length)} Başlık <span className="text-[color-mix(in_srgb,currentColor_48%,transparent)]">Seni Bekliyor</span>
            </>
          ) : (
            <>
              Bugün Her Şey <span className="text-[color-mix(in_srgb,currentColor_48%,transparent)]">Yolunda</span>
            </>
          )}
        </h2>
      </div>
      {open.length ? (
        <ul role="list" aria-label="Bugün senin işin" className="divide-y divide-line-soft border-y border-line-soft">
          {open.map((i) => (
            <li key={i.id} className="relative flex min-w-0 items-center gap-3 px-5 py-3 transition-colors focus-within:bg-surface hover:bg-surface sm:px-6">
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg text-read font-semibold tabular-nums", i.tone === "danger" ? "bg-danger-wash text-danger" : i.tone === "warning" ? "bg-warning-wash text-warning" : "bg-surface text-strong")}>
                {fmtNum(i.count)}
              </span>
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-base font-medium text-strong">{i.label}</span>
                <span className="truncate text-small text-muted">
                  <span className={cn("font-medium", TONE_INK[i.tone])}>
                    <span aria-hidden className={cn("mr-1.5 inline-block size-1.5 -translate-y-px rounded-full", TONE_DOT[i.tone])} />
                    {TONE_WORD[i.tone]}
                  </span>
                  {i.hint ? ` · ${i.hint}` : ""}
                </span>
              </span>
              <NavLink to={i.to} className="inline-flex shrink-0 items-center gap-1 text-small font-medium text-body outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-line-focus focus-visible:after:ring-inset">
                <span className="sr-only">{`${i.cta}: ${fmtNum(i.count)} ${i.label}`}</span>
                <span aria-hidden className="max-sm:hidden">{i.cta}</span>
                <ArrowRight aria-hidden className="size-3.5" />
              </NavLink>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="grid gap-3 px-5 py-4 sm:px-6">
        {tip ? <div className="text-small text-body">{tip}</div> : null}
        {clear.length ? (
          <p className="text-small text-muted">
            <span className="font-medium text-body">Temiz:</span> {clear.map((i) => i.label).join(" · ")}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          {actions.map((a) => (
            <Button key={a.label} variant="secondary" size="sm" onClick={() => go(a.page)}>
              <span aria-hidden className="[&_svg]:size-4">{a.icon}</span>
              {a.label}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Spot kartı: rolün bugünkü en önemli sayısı ──────────────────────────
   Yönetici ve tahsilat rolünde Vadesi Geçmiş Alacak: büyük tutar, yaşlandırma DÖRT SÜTUN (tutara
   göre yükseklik; 90 gün üstü kırmızı), her sütunda tutar ve fatura sayısı, en eski borçlu ve
   listeye giden eylem. Eskiden 17rem'lik hücrede ince bir şerit + 2×2 küçük açıklamaydı. Diğer
   rollerde aynı kart o rolün sayısını büyük gösterir. */
function Spotlight({ metric, go }: { metric: MetricProps; go: PageProps["go"] }) {
  const aging = useAging();
  const overdue = useDerived(overdueInvoices);
  const isDebt = metric.label === "Vadesi Geçmiş Alacak";
  const oldest = overdue.reduce<(typeof overdue)[number] | null>((o, i) => (!o || i.due < o.due ? i : o), null);
  const max = Math.max(1, ...aging.map((b) => b.value));
  // Tek tırmanış: taze borç sakin gri, yaşlandıkça uyarıdan kırmızıya (renk yaş anlamı taşır, kategori değil).
  const tones = ["bg-line-strong", "bg-warning/70", "bg-danger/55", "bg-danger"];
  const bucketLabel = (l: string) => l.replace(" gün", " gün").replace("Daha eski", "90 gün +");
  return (
    <section aria-labelledby="pano-spot" className="grid content-between gap-5 rounded-xl bg-overlay p-5 shadow-raised ring-1 ring-line sm:p-6">
      <div className="grid gap-1">
        <h2 id="pano-spot" className="flex items-center gap-2 text-base font-medium text-body">
          <span aria-hidden className="text-muted [&_svg]:size-4">{metric.icon}</span>
          {metric.label}
        </h2>
        <p className="font-display text-[clamp(2.25rem,3.4vw,3rem)] leading-none font-semibold tracking-[-0.04em] text-strong tabular-nums">{metric.value}</p>
        {isDebt && oldest ? (
          <p className="text-small text-muted">
            {fmtNum(overdue.length)} fatura · en eskisi {customer(oldest.customerId).name}, {fmtNum(daysBetween(parseDay(oldest.due), TODAY))} gün
          </p>
        ) : metric.foot ? (
          <p className="text-small text-muted">{metric.foot}</p>
        ) : null}
      </div>
      {isDebt ? (
        <ul role="list" aria-label="Alacak yaşlandırması" className="grid grid-cols-4 gap-3">
          {aging.map((b, i) => (
            <li key={b.id} className="grid gap-2">
              <span aria-hidden className="relative block h-20 overflow-hidden rounded-md bg-surface">
                <span className={cn("absolute inset-x-0 bottom-0 rounded-md", tones[i] ?? "bg-muted")} style={{ height: `${Math.max(6, (b.value / max) * 100)}%` }} />
              </span>
              <span className="grid">
                <span className="text-base font-semibold text-strong tabular-nums">{fmtTlCompact(b.value)}</span>
                <span className="text-small text-muted tabular-nums">{fmtNum(b.count)} fatura</span>
                <span className={cn("font-mono text-micro", i === 3 ? "text-danger" : "text-muted")}>{bucketLabel(b.label)}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {metric.to ? (
        <div>
          <Button variant="secondary" size="sm" onClick={() => go(metric.to!.page, metric.to!.params)}>
            Listeyi Aç
            <ArrowRight aria-hidden />
          </Button>
        </div>
      ) : null}
    </section>
  );
}

export function PanoPage({ go, params }: PageProps) {
  const { period } = useApp();
  const role = useRole();
  const stats = useLiveStats(period);
  const badges = useBadges();
  const meters = useDerived(effectiveMeters);
  const outagesNow = useDerived(openOutages);
  const owed = useDerived(overdueTotal);
  const aging = useAging();
  const flaggedNow = useDerived(() => flagged(CURRENT_PERIOD).length);
  const upcoming = useDerived(() =>
    openWorkOrders()
      .filter((w) => w.status !== "tamamlandi" && w.scheduled >= new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate()))
      .sort((a, b) => a.scheduled.getTime() - b.scheduled.getTime()),
  );
  const label = PERIODS.find((p) => p.value === period)!.label;
  const prevLabel = period === "1" ? "önceki aya göre" : `önceki ${period} aya göre`;
  const [selected, setSelected] = useState<string | null>(null);

  const liveInv = useDerived(activeInvoices);

  /* Grafik dönemi: seçili pencere, en az üç ay. */
  const chartPeriods = useMemo(() => {
    const w = windowPeriods(period);
    return w.length >= 3 ? w : PERIODS_12.slice(8, 11);
  }, [period]);
  const monthLabels = chartPeriods.map((p) => monthShort.format(parseDay(p)).replace(".", ""));
  const billedBars = chartPeriods.map((p) => Math.round(INVOICES.filter((i) => i.period === p).reduce((s, i) => s + i.total, 0) / 100));
  const rateLine = chartPeriods.map((p) => collectionIn(p, liveInv as Invoice[]) / 100);

  /* Bölge kayıp/kaçak: pencere ortalaması, giriş enerjisi ağırlıklı. */
  const losses = useMemo(() => {
    const rows = stats.periods.flatMap((p) => regionLoss(p));
    return [...new Set(rows.map((r) => r.region.id))].map((id) => {
      const mine = rows.filter((r) => r.region.id === id);
      const input = mine.reduce((s, r) => s + r.input, 0);
      const lossKwh = mine.reduce((s, r) => s + r.lossKwh, 0);
      return { region: mine[0].region, lossPct: pct(lossKwh, input), target: mine[0].region.lossTarget, lossKwh };
    });
  }, [stats.periods]);
  const overRegions = losses.filter((l) => l.lossPct > l.target);
  const mapRegions: CartoRegion[] = losses.map((l) => ({
    id: l.region.id,
    label: l.region.name,
    value: `Kayıp ${fmtPct(l.lossPct)}`,
    note: `hedef %${l.target}`,
    tone: l.lossPct > l.target ? "danger" : "success",
  }));
  const picked = losses.find((l) => l.region.id === selected);
  const downSubs = new Set(outagesNow.map((o) => o.substationId));
  const mapMarkers: CartoMarker[] = SUBSTATIONS.map((x) => ({ id: x.id, regionId: x.regionId, label: `${x.name}: ${downSubs.has(x.id) ? "arızalı" : "çalışıyor"}`, tone: downSubs.has(x.id) ? "danger" : "success" }));

  /* "Haritayı aç" (Bugün bandı) bu bölüme kaydırır. */
  useEffect(() => {
    if (params.focus === "kayip") document.getElementById("pano-kayip")?.scrollIntoView({ block: "start" });
  }, [params.focus]);

  const peak = (curve: number[]) => Math.max(...curve);
  const yesterday = loadCurve(1);
  const lastWeek = loadCurve(7);

  const attention = useDerived(buildAttention);

  const schedule: ScheduleItem[] = upcoming.slice(0, 6).map((w) => {
    const days = daysBetween(TODAY, w.scheduled);
    return {
      id: w.id,
      at: `${w.scheduled.getFullYear()}-${String(w.scheduled.getMonth() + 1).padStart(2, "0")}-${String(w.scheduled.getDate()).padStart(2, "0")}T${clock.format(w.scheduled)}`,
      time: clock.format(w.scheduled),
      day: days === 0 ? "Bugün" : days === 1 ? "Yarın" : new Intl.DateTimeFormat("tr-TR", { weekday: "short", day: "numeric" }).format(w.scheduled),
      title: WORK_LABEL_X[w.type],
      detail: w.customerId ? `${customer(w.customerId).name} · ${w.reason}` : w.reason,
      color: WORK_COLOR[w.type],
    };
  });

  const openOutageSub = outagesNow.reduce((s, o) => s + o.affected, 0);
  const commsLost = meters.filter((m) => m.status === "iletisim-yok").length;
  const faulty = meters.filter((m) => m.status === "arizali").length;
  const pctChange = (now: number, before: number) => (before ? Math.round(((now - before) / before) * 1000) / 10 : undefined);

  /* Kahraman: rolün bugünkü en önemli sayısı; ikincil ölçüler her rolde aynı altı ölçü, kahraman olan hariç.
     Eğilim çizgisi yok: hepsi aynı satır düzeninde (etiket, değer, değişim). */
  const metrics: Record<string, MetricProps> = {
    supheli: { label: "Onay Bekleyen Şüpheli Okuma", value: fmtNum(flaggedNow), foot: `${fmtNum(badges.readings)} bu dönemde · önce bunları onayla`, to: { page: "readings", params: { status: "supheli" } }, icon: <BookOpenCheck /> },
    tahsilat: { label: "Vadesi Geçmiş Alacak", value: fmtTlCompact(owed), foot: `${fmtNum(badges.invoices)} fatura · listeyi aç`, visual: <AgingBars buckets={aging} format={fmtTlCompact} />, to: { page: "invoices", params: { status: "gecikti" } }, icon: <Receipt /> },
    ariza: { label: "Açık Arızada Etkilenen Abone", value: fmtNum(openOutageSub), foot: `${fmtNum(stats.openOutages)} açık arıza · listeyi aç`, to: { page: "outages", params: { status: "acik" } }, icon: <Zap /> },
    abone: { label: "Aktif Abone", value: fmtNum(stats.active), foot: `${fmtNum(meters.length)} sayaç`, to: { page: "customers" }, icon: <Users /> },
    tuketim: { label: `Tüketim · ${label}`, value: fmtKwh(stats.usage), delta: pctChange(stats.usage, stats.usageBefore), goodWhen: "neutral", deltaLabel: prevLabel, icon: <Zap /> },
    oran: { label: "Tahsilat Oranı", value: fmtPct(stats.collectionRate), delta: Math.round((stats.collectionRate - stats.collectionBefore) * 10) / 10, goodWhen: "up", deltaLabel: prevLabel, to: { page: "payments" }, icon: <Receipt /> },
    kayip: { label: "Kayıp / Kaçak", value: fmtPct(stats.lossPct), delta: Math.round((stats.lossPct - stats.lossBefore) * 10) / 10, goodWhen: "down", deltaLabel: prevLabel, foot: `${overRegions.length} bölge hedef üstü`, to: { page: "dashboard", params: { focus: "kayip" } }, icon: <Gauge /> },
    ariza2: { label: "Açık Arıza", value: fmtNum(stats.openOutages), foot: `${fmtNum(openOutageSub)} abone etkileniyor`, to: { page: "outages", params: { status: "acik" } }, icon: <Zap /> },
    okunamayan: { label: "Okunamayan Sayaç", value: fmtNum(stats.unreadable), foot: `${commsLost} iletişim yok · ${faulty} arızalı`, to: { page: "meters", params: { tab: "kesik" } }, icon: <WifiOff /> },
  };
  const heroKey = ROLE_HERO[role] ?? "tahsilat";
  const order = ["abone", "tuketim", "oran", "kayip", "ariza2", "okunamayan"].filter((k) => !(heroKey === "ariza" && k === "ariza2"));
  const secondary = order.slice(0, heroKey === "ariza" ? 5 : 6).map((k) => metrics[k]);

  const tip =
    commsLost > 0 ? (
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5">
          <Lightbulb aria-hidden className="size-3.5 text-primary-ink" />
          <span className="font-semibold text-strong">Öneri</span>
        </span>
        <span className="min-w-0 flex-1 basis-64 text-muted">{fmtNum(commsLost)} sayaç iletişim kurmuyor. Tahakkuk tahmine düşmeden saha ekibine iş emri aç.</span>
        <Button size="sm" variant="ghost" onClick={() => go("meters", { tab: "kesik" })}>
          Sayaçları Aç
        </Button>
      </p>
    ) : null;

  return (
    <>
      <PageHead
        title="Pano"
        description={`Pilot Bölge · ${fmtNum(stats.active)} aktif abone · ${fmtNum(meters.length)} sayaç · ${periodLabel(CURRENT_PERIOD)} okumaları sürüyor`}
        actions={
          <>
            <PeriodControl />
            <Button variant="secondary" size="sm" onClick={() => go("reports")}>
              Raporlar
            </Button>
            <Button variant="primary" size="sm" onClick={() => go("register")}>
              Yeni Abone
            </Button>
          </>
        }
      />
      <PageBody>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <Brief go={go} tip={tip} />
          <Spotlight metric={metrics[heroKey]} go={go} />
        </div>

        {/* Ölçü şeridi: kahraman sayı yukarıdaki spot kartında; burada kalan altı ölçü tek kartta. */}
        <section aria-label="Öne Çıkan Ölçüler" className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line-soft shadow-raised ring-1 ring-line md:grid-cols-3 2xl:grid-cols-6">
          {secondary.map((m) => (
            <Metric key={m.label} {...m} className="bg-overlay" />
          ))}
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <Panel
            id="pano-dikkat"
            title="Dikkat Gerektirenler"
            note="En acil olan üstte"
            className="xl:col-span-3"
            actions={
              <Badge tone="danger" dot>
                {attention.length} kayıt
              </Badge>
            }
          >
            <ul role="list" aria-label="Dikkat Gerektirenler" className="divide-y divide-line-soft">
              {attention.slice(0, 7).map((r) => (
                <li key={r.id}>
                  <RowLink className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                    <span aria-hidden className={`size-2 shrink-0 rounded-full ${KIND[r.kind].tone === "danger" ? "bg-danger" : "bg-warning"}`} />
                    <div className="grid min-w-0 flex-1">
                      <RowAnchor to={{ page: r.to.page, params: r.to.params }} className="truncate text-base">
                        {r.what}
                      </RowAnchor>
                      <p className="truncate text-small text-muted">
                        {KIND[r.kind].label} · {r.who}
                      </p>
                    </div>
                    <span className="shrink-0 text-small text-body tabular-nums max-sm:hidden">{r.detail}</span>
                    <ArrowRight aria-hidden className="size-3.5 shrink-0 text-muted" />
                  </RowLink>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel id="pano-sirada" title="Sıradaki İşler" note={`${fmtNum(upcoming.length)} planlı iş`} className="xl:col-span-2">
            <div className="p-4 sm:p-5">
              <ScheduleList label="Planlı İş Emirleri" items={schedule} />
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <ChartCard
            id="pano-yuk"
            className={`${FLAT} xl:col-span-3`}
            label="Günlük Yük Eğrisi"
            value={`${fmtDec(peak(yesterday), 2)} MW`}
            change={Math.round(((peak(yesterday) - peak(lastWeek)) / peak(lastWeek)) * 1000) / 10}
            changeLabel="geçen haftaya göre (dünün tepe yükü)"
            action={<Badge tone="neutral">Saatlik · MW</Badge>}
          >
            <AreaChart
              title="Günlük Yük Eğrisi: Dün ve Geçen Hafta Aynı Gün"
              labels={yesterday.map((_, h) => String(h).padStart(2, "0"))}
              series={[
                { label: "Dün", values: yesterday, series: 1 },
                { label: "Geçen Hafta Aynı Gün", values: lastWeek, series: 3 },
              ]}
              unit="MW"
              valueFormat={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            />
          </ChartCard>

          <ChartCard
            id="pano-tahsilat"
            className={`${FLAT} xl:col-span-2`}
            label="Tahakkuk ve Tahsilat"
            value={fmtTl(stats.billed, 0)}
            change={pctChange(stats.billed, stats.billedBefore) ?? null}
            changeLabel={prevLabel}
          >
            <ComboChart
              title="Aylık Tahakkuk (sütun TL) ve Tahsilat Oranı (çizgi %)"
              labels={monthLabels}
              bars={{ label: "Tahakkuk", values: billedBars, series: 1, unit: "₺", format: { notation: "compact", maximumFractionDigits: 1 } }}
              line={{ label: "Tahsilat Oranı", values: rateLine, series: 2, format: { style: "percent", maximumFractionDigits: 1 } }}
            />
            <p className="px-2 pt-2 text-small text-muted">{COLLECTION_SCOPE}.</p>
          </ChartCard>
        </div>

        <div id="pano-kayip" className="grid scroll-mt-4 grid-cols-1 gap-5 xl:grid-cols-5">
          <ChartCard id="pano-harita" className={`${FLAT} xl:col-span-3`} label="Bölge Haritası · Kayıp / Kaçak" value={fmtPct(stats.lossPct)} change={null} action={<Badge tone={overRegions.length ? "danger" : "success"} dot>{overRegions.length ? `${overRegions.length} bölge hedefin üstünde` : "Bütün bölgeler hedefte"}</Badge>}>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem] md:items-center">
              <div className="grid gap-3">
                <CartoMap title="Bölgeye Göre Kayıp ve Kaçak Oranı" regions={mapRegions} markers={mapMarkers} selectedId={selected} onSelect={(id) => setSelected((cur) => (cur === id ? null : id))} />
                <CartoLegend
                  items={[
                    { tone: "success", label: "Hedefte", kind: "area" },
                    { tone: "danger", label: "Hedef Üstü", kind: "area" },
                    { tone: "success", label: "Trafo Çalışıyor", kind: "station" },
                    { tone: "danger", label: "Trafoda Arıza", kind: "station" },
                  ]}
                />
              </div>
              <div className="border-line-soft text-base md:border-l md:pl-4">
                {picked ? (
                  <>
                    <p className="font-semibold text-strong">{picked.region.name}</p>
                    <p className="mt-1 text-body">Kayıp / kaçak {fmtPct(picked.lossPct)} · hedef {fmtPct(picked.target, 0)}</p>
                    <p className="text-small text-muted">{fmtKwh(picked.lossKwh)} kayıp enerji ({label.toLocaleLowerCase("tr-TR")})</p>
                    <Button className="mt-2" size="sm" variant="secondary" onClick={() => go("reports")}>Bölge Raporu</Button>
                  </>
                ) : (
                  <p className="text-small text-muted">Bir bölgeye dokun: kayıp oranı, hedef ve kayıp enerji burada açılır. Kırmızı bölgeler hedefi aşıyor.</p>
                )}
              </div>
            </div>
          </ChartCard>

          <ChartCard id="pano-kayip-liste" className={`${FLAT} xl:col-span-2`} label="Hedefe Göre Sıralama" value={`${overRegions.length} / ${losses.length} bölge hedef üstünde`} change={null} action={<Badge tone="neutral">{label}</Badge>}>
            <BarTarget
              aria-label="Bölgeye Göre Kayıp ve Kaçak Oranı"
              rows={[...losses].sort((a, b) => b.lossPct - b.target - (a.lossPct - a.target)).map((l) => ({ id: l.region.id, label: l.region.name, value: l.lossPct, target: l.target }))}
              format={(v) => fmtPct(v)}
            />
          </ChartCard>
        </div>

        <section aria-labelledby="pano-sistem" className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-overlay px-4 py-3 text-small shadow-raised ring-1 ring-line sm:px-5">
          <h2 id="pano-sistem" className="font-semibold text-strong">
            Sistem Durumu
          </h2>
          <ul role="list" className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-1.5">
            {SYSTEMS.map((sys) => (
              <li key={sys.id} className="inline-flex items-center gap-1.5 text-body">
                <span aria-hidden className={`size-2 rounded-full ${SYSTEM_DOT[sys.status]}`} />
                {sys.label}
                <span className="text-muted">· {SYSTEM_TEXT[sys.status]}</span>
              </li>
            ))}
          </ul>
          <p className="text-muted">Son olay: 20 Kas · GSM ağ geçidi yavaşlığı</p>
        </section>
      </PageBody>
    </>
  );
}
