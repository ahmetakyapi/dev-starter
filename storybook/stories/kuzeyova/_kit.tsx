"use client";

import { AlertTriangle, ArrowRight, Check, Lock, SlidersHorizontal, TrendingDown, TrendingUp } from "lucide-react";
import { useContext, useEffect, useId, useState, type ReactNode, type RefObject } from "react";
import { ActiveFilters, type ActiveFilter } from "@/components/ui/active-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSheet, type FilterGroup, type FilterValue } from "@/components/ui/filter-sheet";
import { SavedViews, type SavedView } from "@/components/ui/saved-views";
import { SearchField } from "@/components/ui/search-field";
import { Sparkline } from "@/components/ui/sparkline";
import { cn } from "@/lib/utils";
import { useDerived } from "./_core";
import { CURRENT_PERIOD, TODAY, customer, daysBetween, parseDay, region, regionLoss } from "./_data";
import { getAuditLog } from "./_audit";
import { ROLES, useCan, useRole } from "./_permissions";
import {
  disputeSlaBreaches,
  commsLostMeters,
  dataRequestsDue,
  faultCandidates,
  flaggedReadings,
  openCalls,
  openLeaks,
  openOutages,
  overdueInvoices,
  overdueTotal,
  pendingApprovals,
  pendingReadings,
  reconnectBreaches,
  workOrderSlaBreaches,
} from "./_selectors";
import { AppContext, href, type Page } from "./_ui";

/*
 * KUZEYOVA PORTALI KİTİ: sayfaların ortak dili. Wave 2 sayfaları buradan kurar.
 *
 * ── SEMANTİK RENK KURALI (UX denetimi: "dekoratif renk") ─────────────────────
 *   · RENK YALNIZ ANLAM TAŞIR: kötü = `danger`, bekleyen/dikkat = `warning`,
 *     iyi = `success`, nötr = `muted`/`strong`. Süs için renk yok.
 *   · Seri renkleri YALNIZ `chart-1…6` token'ları (`kuzeyova.css` bunları palet
 *     ailesine bağlar: birinci seri vurgu, ikincisi onun yıkanmışı, üçüncüsü
 *     mürekkep, kalan üçü uyarı/başarı/tehlike). Kahverengi, hardal, ham
 *     palet ya da hex YOK.
 *   · "İyi mi kötü mü" yönü `goodWhen` ile AÇIKÇA söylenir: tüketim düşüşü
 *     tek başına kötü değildir (tahsilat düşüşü kötü, kayıp düşüşü iyi).
 *   · Renk TEK işaret değil: her durumun yanında metin ("Kritik", "Bekliyor",
 *     "hedefi aştı"), ok ya da ikon vardır.
 *
 * ── SATIR KURALI ─────────────────────────────────────────────────────────────
 *   Bir listede satırın TAMAMI tıklanabilir olacaksa `RowLink` + `RowAnchor`
 *   (gerilmiş bağlantı: imleç, odak halkası, hover). Olmayacaksa altyazı
 *   "satıra basınca açılır" DEMEZ ve yalnız bir hücrede bağlantı bulunur.
 *   İkisi karışmaz: yarı tıklanır satır en kötü seçenek.
 *
 * ── SAYI BİÇİMİ ──────────────────────────────────────────────────────────────
 *   Ondalık virgül, binlik nokta, birim her zaman yazılır. Sayfalar kendi
 *   `toFixed`/`toLocaleString`ını yazmaz: `fmt*` ailesi (aşağıda).
 */

/* ── Sayı biçimi ─────────────────────────────────────────────────────────── */

const grouped = (digits: number) => new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: digits });
const fixed = (digits: number) => new Intl.NumberFormat("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** 12.345 (binlik nokta); `digits` en çok ondalık. */
export const fmtNum = (n: number, digits = 0) => grouped(digits).format(n);
/** Sabit ondalık: 25,4 (virgül). SAIDI/SAIFI dahil her ondalık sayı bunu kullanır. */
export const fmtDec = (n: number, digits = 1) => fixed(digits).format(n);
/** %94,4 */
export const fmtPct = (n: number, digits = 1) => `${n < 0 ? "-" : ""}%${fixed(digits).format(Math.abs(n))}`;
/** 1.273 kWh · 12,4 MWh · 2,6 GWh */
export const fmtKwh = (kwh: number) => (kwh >= 1_000_000 ? `${fixed(1).format(kwh / 1_000_000)} GWh` : kwh >= 10_000 ? `${fixed(1).format(kwh / 1_000)} MWh` : `${grouped(0).format(kwh)} kWh`);
/** Kuruş tamsayıdan ₺6.202,37 */
export const fmtTl = (kurus: number, digits = 2) => `₺${fixed(digits).format(kurus / 100)}`;
/** ₺11,3 milyon · ₺420 bin: "B" harfi belirsizdi (milyar mı bin mi). */
export const fmtTlCompact = (kurus: number) => {
  const tl = kurus / 100;
  const abs = Math.abs(tl);
  if (abs >= 1_000_000_000) return `₺${fixed(1).format(tl / 1_000_000_000)} milyar`;
  if (abs >= 1_000_000) return `₺${fixed(1).format(tl / 1_000_000)} milyon`;
  if (abs >= 10_000) return `₺${grouped(0).format(tl / 1_000)} bin`;
  return `₺${grouped(0).format(tl)}`;
};
/** 85 dk → "1 sa 25 dk"; 40 → "40 dk". */
export const fmtDur = (minutes: number) => {
  const m = Math.round(Math.max(0, minutes));
  const h = Math.floor(m / 60);
  return h ? `${h} sa${m % 60 ? ` ${m % 60} dk` : ""}` : `${m} dk`;
};

/* ── Yönlendirme yardımcısı: bağlam yoksa (Kit hikayesi) sessiz ──────────── */

type To = { page: Page; params?: Record<string, string | undefined> };

function useNav() {
  const ctx = useContext(AppContext);
  return (to: To) => ctx?.navigate(to.page, to.params);
}

function NavLink({ to, className, children, ...rest }: { to: To; className?: string; children: ReactNode } & Omit<React.ComponentProps<"a">, "href">) {
  const go = useNav();
  return (
    <a
      {...rest}
      href={href(to.page, to.params)}
      className={className}
      onClick={(event) => {
        // Uygulama içinde belge düzeyindeki yakalayıcı çalışır; bağlam yoksa (hikaye) adres değişmesin.
        event.preventDefault();
        go(to);
      }}
    >
      {children}
    </a>
  );
}

/* ── Metric, PageHero ────────────────────────────────────────────────────── */

export type MetricProps = {
  label: string;
  value: ReactNode;
  unit?: string;
  /** Önceki döneme göre değişim yüzdesi. */
  delta?: number;
  deltaLabel?: string;
  /** Hangi yön İYİ: renk kuralı. `neutral`: renk yok (yalnız ok). */
  goodWhen?: "up" | "down" | "neutral";
  /** Eğilim çizgisi: bir şeritte HEPSİNDE ya da HİÇBİRİNDE olsun. */
  spark?: readonly number[];
  /** Tek satır alt metin (taşmaz, kırpılır; tam metin `title`). */
  foot?: string;
  icon?: ReactNode;
  /** Kartın ALT kısmını dolduran görsel (yaş dağılımı, mini grafik); kahraman kartta boş alan bırakmaz. */
  visual?: ReactNode;
  /** Verilirse tüm hücre tek bağlantı. */
  to?: To;
  size?: "md" | "lg";
  /** Sıkı hücre (kahraman ızgarası): ikon ve boş delta satırı yok, eğilim değerin yanında. */
  dense?: boolean;
  className?: string;
};

function Delta({ value, goodWhen = "neutral", label }: { value: number; goodWhen?: "up" | "down" | "neutral"; label?: string }) {
  const up = value > 0;
  const flat = value === 0;
  const good = goodWhen === "neutral" || flat ? null : goodWhen === "up" ? up : !up;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-small font-medium tabular-nums",
        good === null && "bg-surface text-body",
        good === true && "bg-success-wash text-success",
        good === false && "bg-danger-wash text-danger",
      )}
    >
      {flat ? null : <Icon aria-hidden className="size-3.5" />}
      <span className="sr-only">{flat ? "Değişmedi" : up ? "Arttı" : "Azaldı"} </span>
      {value > 0 ? "+" : ""}
      {fmtPct(value)}
      {label ? <span className="sr-only"> {label}</span> : null}
    </span>
  );
}

export function Metric({ label, value, unit, delta, deltaLabel, goodWhen, spark, foot, icon, visual, to, size = "md", dense = false, className }: MetricProps) {
  if (dense) {
    return (
      <div className={cn("relative flex min-w-0 flex-col justify-between gap-1 px-4 py-3", to && "transition-colors hover:bg-surface focus-within:bg-surface", className)}>
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-small font-medium text-muted" title={label}>
            {to ? (
              <NavLink to={to} className="outline-none after:absolute after:inset-0 focus-visible:after:rounded-[inherit] focus-visible:after:ring-2 focus-visible:after:ring-line-focus focus-visible:after:ring-inset">
                {label}
              </NavLink>
            ) : (
              label
            )}
          </p>
          {delta !== undefined ? <Delta value={delta} goodWhen={goodWhen} label={deltaLabel} /> : null}
        </div>
        <div className="flex items-end justify-between gap-3">
          <p className="flex flex-wrap items-baseline gap-x-1.5 text-heading leading-tight font-semibold tracking-tight text-strong tabular-nums">
            <span>{value}</span>
            {unit ? <span className="text-base font-medium text-muted">{unit}</span> : null}
          </p>
          {spark ? <Sparkline values={spark} title={`${label} eğilimi`} width={72} height={24} className="shrink-0" /> : null}
        </div>
        {foot ? (
          <p className="truncate text-small text-muted" title={foot}>
            {foot}
          </p>
        ) : null}
      </div>
    );
  }
  return (
    <div className={cn("relative flex min-w-0 flex-col gap-1.5 p-4 sm:p-5", to && "transition-colors hover:bg-surface focus-within:bg-surface", className)}>
      {size === "lg" && icon && !visual ? (
        <span aria-hidden className="grid size-9 place-items-center rounded-lg bg-surface text-strong ring-1 ring-line-soft [&_svg]:size-[1.125rem]">
          {icon}
        </span>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-small font-medium text-muted" title={label}>
          {to ? (
            <NavLink to={to} className="outline-none after:absolute after:inset-0 focus-visible:after:rounded-[inherit] focus-visible:after:ring-2 focus-visible:after:ring-line-focus focus-visible:after:ring-inset">
              {label}
            </NavLink>
          ) : (
            label
          )}
        </p>
        {icon && !(size === "lg" && !visual) ? <span aria-hidden className="shrink-0 text-muted [&_svg]:size-4">{icon}</span> : null}
      </div>
      <p className={cn("flex flex-wrap items-baseline gap-x-1.5 font-semibold tracking-tight text-strong tabular-nums", size === "lg" ? "text-display" : "text-heading")}>
        <span>{value}</span>
        {unit ? <span className="text-base font-medium text-muted">{unit}</span> : null}
      </p>
      {delta !== undefined || deltaLabel ? (
        <div className="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1">
          {delta !== undefined ? <Delta value={delta} goodWhen={goodWhen} label={deltaLabel} /> : null}
          {deltaLabel ? <span aria-hidden className="text-small text-muted">{deltaLabel}</span> : null}
        </div>
      ) : null}
      {spark ? <Sparkline values={spark} title={`${label} eğilimi`} width={size === "lg" ? 220 : 120} height={size === "lg" ? 44 : 28} className="mt-auto max-w-full" /> : null}
      {foot ? (
        <p className={cn("text-small text-muted", size === "lg" ? "text-balance" : "truncate", size !== "lg" && !spark && !visual && "mt-auto pt-1")} title={foot}>
          {foot}
        </p>
      ) : null}
      {visual ? <div className="relative mt-auto pt-3">{visual}</div> : null}
    </div>
  );
}

/** Yaş dağılımı (vadesi geçmiş alacak): tek yığılı çubuk + dört kova, sol kahraman kartın altını doldurur. */
export type AgingBucket = { id: string; label: string; value: number; count: number };
export function AgingBars({ buckets, format, className }: { buckets: readonly AgingBucket[]; format: (value: number) => string; className?: string }) {
  const total = buckets.reduce((s, b) => s + b.value, 0) || 1;
  const tones = ["bg-warning/45", "bg-warning", "bg-danger/70", "bg-danger"];
  const summary = buckets.map((b) => `${b.label}: ${format(b.value)}, ${b.count} fatura`).join("; ");
  return (
    <div className={cn("grid gap-3", className)}>
      <div role="img" aria-label={`Yaş dağılımı. ${summary}`} className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-chart-track">
        {buckets.map((b, i) => (
          <span key={b.id} className={cn("h-full min-w-1 first:rounded-s-full last:rounded-e-full", tones[i] ?? "bg-muted")} style={{ width: `${Math.max((b.value / total) * 100, b.value > 0 ? 3 : 0)}%` }} />
        ))}
      </div>
      <dl aria-hidden className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-small">
        {buckets.map((b, i) => (
          <div key={b.id} className="min-w-0" title={`${b.label}: ${format(b.value)} · ${b.count} fatura`}>
            <dt className="flex items-center gap-1.5 truncate text-muted">
              <span className={cn("size-2 shrink-0 rounded-full", tones[i] ?? "bg-muted")} />
              <span className="truncate">{b.label}</span>
            </dt>
            <dd className="truncate ps-3.5 font-semibold text-strong tabular-nums">{format(b.value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Sayfa kahramanı: TEK büyük sayı (sayfanın sorusu) + yanında ikincil ölçüler.
 * Altı eşit kutu şablonu yerine hiyerarşi: önce bu, sonra gerisi. Telefonda
 * kahraman üstte, ikincil ölçüler 2 sütun.
 */
export function PageHero({ primary, secondary, className }: { primary: MetricProps; secondary: readonly MetricProps[]; className?: string }) {
  return (
    <section aria-label="Öne çıkan ölçüler" className={cn("grid overflow-hidden rounded-xl bg-overlay shadow-raised ring-1 ring-line lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]", className)}>
      <Metric {...primary} size="lg" className={cn("border-b border-line-soft p-4 sm:p-5 lg:border-r lg:border-b-0", !primary.visual && !primary.spark && "lg:justify-center")} />
      <div className="grid grid-cols-2 sm:grid-cols-3 [&>*]:border-line-soft [&>*:nth-child(n+3)]:border-t sm:[&>*:nth-child(n+4)]:border-t sm:[&>*:nth-child(3)]:border-t-0 [&>*:not(:nth-child(2n+1))]:border-l sm:[&>*:not(:nth-child(2n+1))]:border-l-0 sm:[&>*:not(:nth-child(3n+1))]:border-l">
        {secondary.slice(0, 6).map((m) => (
          <Metric key={m.label} {...m} dense />
        ))}
      </div>
    </section>
  );
}

/* ── TodayBand: role göre "Bugün benim işim" ─────────────────────────────── */

type TodayItem = { id: string; count: number; label: string; hint?: string; tone: "danger" | "warning" | "neutral"; to: To; cta: string };

function todayItems(role: string): TodayItem[] {
  const month = CURRENT_PERIOD;
  const overdue = overdueInvoices();
  const oldest = overdue.reduce<(typeof overdue)[number] | null>((o, i) => (!o || i.due < o.due ? i : o), null);
  const oldestHint = oldest ? `En eskisi: ${customer(oldest.customerId).name}, ${daysBetween(parseDay(oldest.due), TODAY)} gün` : undefined;
  const affected = openOutages().reduce((s, o) => s + o.affected, 0);
  const lossOver = regionLoss(month).filter((r) => r.lossPct > region(r.region.id).lossTarget).length;
  const denied = getAuditLog().filter((a) => !a.ok && a.origin === "portal").length;
  const approvals = pendingApprovals().length;
  switch (role) {
    case "okuma":
      return [
        { id: "supheli", count: flaggedReadings(month).length, label: "şüpheli okuma onay bekliyor", tone: "danger", to: { page: "readings", params: { status: "supheli" } }, cta: "İncele" },
        { id: "bekleyen", count: pendingReadings(month).length, label: "sayaç henüz okunmadı", hint: "Tur planında", tone: "warning", to: { page: "readings", params: { tab: "tur" } }, cta: "Turu Aç" },
        { id: "iletisim", count: commsLostMeters().length, label: "sayaçta haberleşme yok", tone: "warning", to: { page: "meters", params: { tab: "kesik" } }, cta: "Sayaçlara Bak" },
        { id: "kacak", count: openLeaks().length, label: "açık kaçak vakası", tone: "neutral", to: { page: "leaks" }, cta: "Vakalar" },
      ];
    case "tahsilat":
      return [
        { id: "geciken", count: overdue.length, label: `vadesi geçmiş fatura · ${fmtTlCompact(overdueTotal())}`, hint: oldestHint, tone: "danger", to: { page: "invoices", params: { status: "gecikti" } }, cta: "Kuyruğu Aç" },
        { id: "itiraz", count: disputeSlaBreaches().length, label: "itiraz süresi aşıldı", tone: "warning", to: { page: "disputes" }, cta: "İtirazlar" },
        { id: "baglama", count: reconnectBreaches().length, label: "bağlama süresi aşıldı", tone: "danger", to: { page: "workorders" }, cta: "İş Emirleri" },
      ];
    case "musteri":
      return [
        { id: "ariza", count: openOutages().length, label: `açık arıza · ${fmtNum(affected)} abone etkilendi`, tone: "danger", to: { page: "outages", params: { status: "acik" } }, cta: "Arızalar" },
        { id: "aday", count: faultCandidates().length, label: "arıza adayı trafo (3+ çağrı)", tone: "warning", to: { page: "calls", params: { tab: "aday" } }, cta: "Çağrıları Gör" },
        { id: "cagri", count: openCalls().length, label: "açık çağrı", tone: "neutral", to: { page: "calls" }, cta: "Çağrı Merkezi" },
      ];
    case "denetci":
      return [
        { id: "red", count: denied, label: "reddedilen deneme", tone: "warning", to: { page: "compliance", params: { tab: "denetim" } }, cta: "Günlüğü Aç" },
        { id: "kvkk", count: dataRequestsDue().length, label: "KVKK talebinin süresi yaklaşıyor", tone: "warning", to: { page: "compliance", params: { tab: "kvkk" } }, cta: "Talepler" },
        { id: "onay", count: approvals, label: "iki göz onayı bekliyor", tone: "neutral", to: { page: "compliance", params: { tab: "onaylar" } }, cta: "Onaylar" },
      ];
    default:
      return [
        { id: "onay", count: approvals, label: "iki göz onayı bekliyor", tone: "warning", to: { page: "compliance", params: { tab: "onaylar" } }, cta: "Onayla" },
        { id: "sla", count: workOrderSlaBreaches().length, label: "iş emrinde süre aşıldı", tone: "danger", to: { page: "workorders" }, cta: "İş Emirleri" },
        { id: "kayip", count: lossOver, label: "bölgede kayıp/kaçak hedefi aşıldı", tone: "danger", to: { page: "dashboard", params: { focus: "kayip" } }, cta: "Haritayı Aç" },
        { id: "kvkk", count: dataRequestsDue().length, label: "KVKK talebinin süresi yaklaşıyor", tone: "warning", to: { page: "compliance", params: { tab: "kvkk" } }, cta: "Talepler" },
      ];
  }
}

const TONE_TEXT = { danger: "Kritik", warning: "Bekliyor", neutral: "Takipte" } as const;

export function TodayBand({ className }: { className?: string }) {
  const role = useRole();
  const items = useDerived(() => todayItems(role), [role]);
  const label = ROLES.find((r) => r.id === role)?.label ?? "";
  const labelId = useId();
  const open = items.filter((i) => i.count > 0);
  const clear = items.filter((i) => i.count === 0);
  const cols = ["", "", "sm:grid-cols-2", "sm:grid-cols-2 xl:grid-cols-3", "sm:grid-cols-2 xl:grid-cols-4"][Math.min(open.length, 4)] ?? "";
  return (
    <section aria-labelledby={labelId} className={cn("rounded-xl bg-overlay p-1.5 shadow-raised ring-1 ring-line", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-2 pb-2">
        <h2 id={labelId} className="text-read font-semibold text-strong">
          Bugün Senin İşin
        </h2>
        <span className="text-small text-muted">
          {label} · {open.length === 0 ? "bekleyen iş yok" : `${open.length} başlık`}
        </span>
      </div>
      {open.length > 0 ? (
        <ul role="list" className={cn("grid grid-cols-1 gap-1.5", cols)}>
          {open.map((i) => (
            <li
              key={i.id}
              className={cn(
                "relative grid min-w-0 grid-cols-[auto_1fr] items-center gap-x-3.5 rounded-lg px-3.5 py-3 transition-colors focus-within:ring-2 focus-within:ring-line-focus hover:brightness-[0.98]",
                i.tone === "danger" && "bg-danger-wash",
                i.tone === "warning" && "bg-warning-wash",
                i.tone === "neutral" && "bg-surface",
              )}
            >
              <span className={cn("min-w-9 text-center text-display leading-none font-semibold tabular-nums", i.tone === "danger" && "text-danger", i.tone === "warning" && "text-warning", i.tone === "neutral" && "text-strong")}>{fmtNum(i.count)}</span>
              <span className="grid min-w-0 content-center gap-0.5">
                <span className="block text-base leading-snug font-medium text-strong">{i.label}</span>
                <span className="block truncate text-small text-muted" title={i.hint}>
                  <span className="font-medium">{TONE_TEXT[i.tone]}</span>
                  {i.hint ? ` · ${i.hint}` : ""}
                </span>
                <NavLink to={i.to} className="mt-1 inline-flex items-center gap-1 text-small font-semibold text-strong outline-none after:absolute after:inset-0">
                  <span className="sr-only">{`${i.cta}: ${fmtNum(i.count)} ${i.label}`}</span>
                  <span aria-hidden>{i.cta}</span>
                  <ArrowRight aria-hidden className="size-3.5" />
                </NavLink>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {clear.length > 0 ? (
        <ul role="list" aria-label="Bekleyen işi olmayan başlıklar" className={cn("flex flex-wrap gap-1.5", open.length > 0 && "mt-1.5")}>
          {clear.map((i) => (
            <li key={i.id} className="relative inline-flex min-h-9 items-center gap-2 rounded-full bg-surface px-3 text-small text-muted transition-colors focus-within:ring-2 focus-within:ring-line-focus hover:bg-surface-raised">
              <Check aria-hidden className="size-4 shrink-0 text-success" />
              <span className="font-medium text-body">{i.label}</span>
              <span>· Şu an yok</span>
              <NavLink to={i.to} className="outline-none after:absolute after:inset-0 after:rounded-full">
                <span className="sr-only">{`${i.cta}: ${i.label}`}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/* ── BarTarget: etiket solda, değer sağda, hedef çizgisi ─────────────────── */

export type BarRow = { id: string; label: string; value: number; target?: number; note?: string };

export function BarTarget({ rows, format, targetLabel = "hedef", className, "aria-label": ariaLabel }: { rows: readonly BarRow[]; format: (value: number) => string; targetLabel?: string; className?: string; "aria-label": string }) {
  const max = Math.max(...rows.flatMap((r) => [r.value, r.target ?? 0]), 1) * 1.08;
  return (
    <ul role="list" aria-label={ariaLabel} className={cn("grid gap-3", className)}>
      {rows.map((r) => {
        const over = r.target !== undefined && r.value > r.target;
        return (
          <li key={r.id} className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-x-3 gap-y-0.5 sm:grid-cols-[minmax(0,10rem)_1fr_auto]">
            <span className="truncate text-base text-body" title={r.label}>
              {r.label}
            </span>
            <span aria-hidden className="relative h-2.5 rounded-full bg-chart-track">
              <span className={cn("absolute inset-y-0 left-0 rounded-full", over ? "bg-danger" : "bg-chart-1")} style={{ width: `${(r.value / max) * 100}%` }} />
              {r.target !== undefined ? <span className="absolute -inset-y-1 w-0.5 rounded-full bg-strong" style={{ left: `${(r.target / max) * 100}%` }} /> : null}
            </span>
            <span className="text-right text-base font-semibold text-strong tabular-nums">{format(r.value)}</span>
            {r.target !== undefined || r.note ? (
              <span className="col-start-2 col-end-4 text-small text-muted">
                {r.target !== undefined ? `${targetLabel} ${format(r.target)}` : null}
                {over ? <span className="font-medium text-danger"> · hedefi aştı</span> : null}
                {r.note ? ` · ${r.note}` : ""}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/* ── StepCountChart: ayrık sayım için basamaklı çizgi ────────────────────── */

export function StepCountChart({ data, title, unit = "", height = 150, className }: { data: readonly { label: string; value: number }[]; title: string; unit?: string; height?: number; className?: string }) {
  const W = 320;
  const pad = { l: 26, r: 8, t: 10, b: 20 };
  const max = Math.max(...data.map((d) => d.value), 1);
  const top = Math.max(2, Math.ceil(max));
  const x = (i: number) => pad.l + (i / Math.max(1, data.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / top) * (height - pad.t - pad.b);
  const step = data.map((d, i) => `${i === 0 ? "M" : "H"}${x(i).toFixed(1)}${i === 0 ? ` ${y(d.value).toFixed(1)}` : ""} V${y(d.value).toFixed(1)}`).join(" ");
  const area = `${step} V${(height - pad.b).toFixed(1)} H${x(0).toFixed(1)} Z`;
  const ticks = Array.from(new Set([0, Math.round(top / 2), top]));
  const labelEvery = Math.ceil(data.length / 6);
  const last = data.at(-1);
  const shown = data.map((d, i) => ((i % labelEvery === 0 && data.length - 1 - i >= labelEvery) || i === data.length - 1 ? { d, i } : null)).filter((v): v is { d: { label: string; value: number }; i: number } => v !== null);
  // Çizim SVG (esner), etiketler HTML: SVG ölçeklenince yazı büyümesin ve kesilmesin.
  return (
    <figure className={cn("relative", className)} style={{ height }}>
      <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" role="img" aria-label={`${title}. Son değer ${last?.value ?? 0}${unit}.`} className="block size-full">
        {ticks.map((t) => (
          <line key={t} x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line-soft)" strokeDasharray={t === 0 ? undefined : "3 3"} vectorEffect="non-scaling-stroke" />
        ))}
        <path d={area} fill="var(--chart-1)" opacity={0.12} />
        <path d={step} fill="none" stroke="var(--chart-1)" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div aria-hidden className="pointer-events-none absolute inset-0 text-micro tabular-nums text-muted">
        {ticks.map((t) => (
          <span key={t} className="absolute start-0 -translate-y-1/2" style={{ top: `${(y(t) / height) * 100}%` }}>
            {t}
          </span>
        ))}
        {shown.map(({ d, i }) => (
          <span key={d.label} className="absolute bottom-0 whitespace-nowrap" style={{ left: `${(x(i) / W) * 100}%`, transform: i === data.length - 1 ? "translateX(-100%)" : i === 0 ? "none" : "translateX(-50%)" }}>
            {d.label}
          </span>
        ))}
      </div>
      <figcaption className="sr-only">
        <table>
          <caption>{title}</caption>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <th scope="row">{d.label}</th>
                <td>
                  {d.value}
                  {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}

/** Birimli lejant: renk kutusu + ad + değer (`unit` değerin içinde yazılı). */
export function UnitLegend({ items, className }: { items: readonly { label: string; series: 1 | 2 | 3 | 4 | 5 | 6; value?: string }[]; className?: string }) {
  const bg = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5", "bg-chart-6"] as const;
  return (
    <ul role="list" className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-small text-body", className)}>
      {items.map((i) => (
        <li key={i.label} className="inline-flex items-center gap-1.5">
          <span aria-hidden className={cn("size-2.5 rounded-sm", bg[i.series - 1])} />
          {i.label}
          {i.value ? <span className="font-medium text-strong tabular-nums">{i.value}</span> : null}
        </li>
      ))}
    </ul>
  );
}

/* ── Boş / hata / yetkisiz ───────────────────────────────────────────────── */

export function EmptyStateX({ title, hint, action, className }: { title: string; hint?: ReactNode; action?: ReactNode; className?: string }) {
  return <EmptyState title={title} hint={hint} action={action} className={className} />;
}

export function ErrorState({ title = "Veri yüklenemedi", hint = "Bağlantıyı kontrol edip yeniden dene.", onRetry, className }: { title?: string; hint?: ReactNode; onRetry?: () => void; className?: string }) {
  return (
    <EmptyState
      icon={<AlertTriangle />}
      title={title}
      hint={hint}
      className={className}
      action={
        onRetry ? (
          <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center rounded-md bg-cta px-4 text-base font-semibold text-on-brand shadow-cta pointer-fine:min-h-9">
            Yeniden Dene
          </button>
        ) : undefined
      }
    />
  );
}

export function Forbidden({ what = "Bu sayfa", permission, className }: { what?: string; permission?: string; className?: string }) {
  const role = useRole();
  const label = ROLES.find((r) => r.id === role)?.label ?? "Bu rol";
  return (
    <div role="alert" className={cn("mx-auto grid max-w-md justify-items-center gap-2 px-4 py-16 text-center", className)}>
      <span aria-hidden className="grid size-11 place-items-center rounded-xl bg-surface text-muted ring-1 ring-line [&_svg]:size-5">
        <Lock />
      </span>
      <p className="text-read font-semibold text-strong">{what} için yetkin yok</p>
      <p className="text-base text-muted">
        {label} rolünün {permission ? `"${permission}" izni` : "bu izni"} yok. Yöneticiden izin iste ya da Ayarlar'da rolü değiştir.
      </p>
    </div>
  );
}

/** İzni olmayana `Forbidden`, olana içerik. Sayfanın kökünü sar. */
export function Gate({ permission, what, children }: { permission: string; what?: string; children: ReactNode }) {
  const ok = useCan(permission);
  return ok ? <>{children}</> : <Forbidden what={what} permission={permission} />;
}

/* ── RowLink: satırın tamamı tek bağlantı ────────────────────────────────── */

export function RowLink({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("relative cursor-pointer transition-colors hover:bg-surface focus-within:bg-surface", className)}>{children}</div>;
}
/** `RowLink` içindeki TEK bağlantı (adı): `after` satırı kaplar. `data-row` j/k gezinme içindir. */
export function RowAnchor({ to, children, className }: { to: To; children: ReactNode; className?: string }) {
  return (
    <NavLink to={to} data-row className={cn("font-medium text-strong outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-line-focus focus-visible:after:ring-inset", className)}>
      {children}
    </NavLink>
  );
}

export { DemoBadge } from "./_ui";

/* ── FilterBar ───────────────────────────────────────────────────────────── */

export type FilterBarProps = {
  search?: { value: string; onChange: (value: string) => void; placeholder?: string; label?: string };
  filters: readonly ActiveFilter[];
  onRemoveFilter: (id: string) => void;
  onClearFilters: () => void;
  views?: { items: readonly SavedView[]; value: string; onChange: (id: string) => void; onSave?: (name: string) => void; onDelete?: (id: string) => void };
  /** Süzgeç çekmecesi: telefonda alt sayfa, masaüstünde yan panel. */
  drawer?: { groups: readonly FilterGroup[]; value: FilterValue; onChange: (value: FilterValue) => void; resultCount: number; resultLabel?: (count: number) => string };
  actions?: ReactNode;
  summary?: ReactNode;
  className?: string;
};

/**
 * Liste süzgeç çubuğu: arama + "Süzgeçler" butonu (çekmece) tek satır; altında
 * kayıtlı görünümler ve etkin süzgeç çipleri. Açılır liste yığını yok:
 * telefonda ilk satıra inene kadar 330 piksel süzgeç olmaz.
 */
export function FilterBar({ search, filters, onRemoveFilter, onClearFilters, views, drawer, actions, summary, className }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("grid gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {search ? (
          <SearchField
            label={search.label ?? "Ara"}
            placeholder={search.placeholder ?? "Ara"}
            value={search.value}
            onValueChange={search.onChange}
            debounce={0}
            className="min-w-[min(100%,16rem)] flex-1"
            landmark
          />
        ) : null}
        {drawer ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-line bg-overlay px-3 text-base font-medium text-body shadow-raised hover:border-line-strong hover:text-strong pointer-fine:min-h-10 [&_svg]:size-4"
          >
            <SlidersHorizontal aria-hidden />
            Süzgeçler
            {filters.length ? <span className="grid min-w-5 place-items-center rounded-full bg-primary-wash px-1.5 text-small font-semibold text-primary-ink tabular-nums">{filters.length}</span> : null}
          </button>
        ) : null}
        {actions}
      </div>
      {views ? <SavedViews views={views.items} value={views.value} onValueChange={views.onChange} onSave={views.onSave} onDelete={views.onDelete} /> : null}
      <ActiveFilters filters={filters} onRemove={onRemoveFilter} onClear={onClearFilters} summary={summary} />
      {drawer ? (
        <FilterSheet
          open={open}
          onOpenChange={setOpen}
          groups={drawer.groups}
          value={drawer.value}
          onValueChange={drawer.onChange}
          resultCount={drawer.resultCount}
          resultLabel={drawer.resultLabel}
          onClear={onClearFilters}
          canClear={filters.length > 0}
        />
      ) : null}
    </div>
  );
}

/* ── useListKeys: j/k ile satır gezinme ──────────────────────────────────── */

/**
 * `j` sonraki, `k` önceki satıra odaklanır; Enter odaktaki bağlantıyı açar
 * (doğal). Satırlar `data-row` işaretli bağlantılar (`RowAnchor`). Metin
 * alanında, değiştirici tuşla ya da bir diyalog açıkken çalışmaz.
 */
export function useListKeys(root: RefObject<HTMLElement | null>, selector = "[data-row]") {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "j" && event.key !== "k") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const t = event.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (document.querySelector("dialog[open]")) return;
      const box = root.current;
      if (!box) return;
      const rows = [...box.querySelectorAll<HTMLElement>(selector)];
      if (rows.length === 0) return;
      const at = rows.findIndex((r) => r === document.activeElement);
      const next = event.key === "j" ? Math.min(rows.length - 1, at + 1) : Math.max(0, at <= 0 ? 0 : at - 1);
      event.preventDefault();
      rows[next].focus();
      rows[next].scrollIntoView({ block: "nearest" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [root, selector]);
}

