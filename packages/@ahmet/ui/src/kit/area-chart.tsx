// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { m, useInView, useReducedMotion } from "motion/react";
import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "../utils";
import { SERIES_BG, type Series } from "./chart-card";

/**
 * Alan grafiği: sıralı bir eksende (gün, ay) bir ya da iki seri; yumuşak
 * eğri, altında serinin kendi renginden hafif bir dolgu. Fareyle ya da
 * parmakla gezince dikey imleç, noktalar ve değer balonu. "Bu yıl / geçen
 * yıl" gibi iki dönemi üst üste koymak için; tek bir sayı okunacaksa
 * `ChartCard` başlığı, kategori kıyası için `track-bar-chart.tsx`.
 *
 * EĞRİ MONOTON KÜBİK (Fritsch–Carlson): noktalardan geçer ve iki nokta
 * arasında AŞMAZ. Sıradan bir yumuşatma (Catmull-Rom) tepe öncesinde ve
 * sıfıra yakın yerde çizgiyi verinin dışına taşır; grafik olmayan bir
 * değeri ("-40 ziyaretçi") çizmiş olur.
 *
 * Dolgu DEGRADE DEĞİL, düz: serinin `--chart-*` rengi `color-mix` ile
 * %18 (Tailwind `fill-chart-N/18`). Veri yüzeyi degrade taşımaz
 * (globals.css → Degrade Disiplini); iki seri üst üste binince düz dolgu
 * kesişimi de dürüst gösterir.
 *
 * ÇİZİM SVG, İŞARETLER HTML: eğri esneyen bir viewBox'ta
 * (`preserveAspectRatio="none"` + `non-scaling-stroke`), böylece kap ölçmeye
 * gerek yok ve sunucu ile istemci aynı HTML'i basar. Nokta, imleç ve
 * etiketler ise HTML: esnemede yamulmasınlar diye. İmleç katmanı tam
 * genişlikte bir öğe ve `translateX(%)` ile kayar (kendi genişliği = kabın
 * genişliği), yani konum değişimi düzen değil dönüşüm animasyonu.
 *
 * Hareket: ekrana girince çizgi soldan çizilir, dolgu ardından belirir
 * (bir kez). Çizim `pathLength` İLE DEĞİL bir kırpma perdesiyle
 * (`scaleX`): `non-scaling-stroke` kesik deseni ekran pikselinde ölçer,
 * `pathLength` ise kullanıcı biriminde; esneyen viewBox'ta ikisi tutmaz ve
 * çizgi yarıda kalır. Hareketi azaltan kullanıcıda süre 0: son hal
 * doğrudan gelir (`initial` sunucuda da aynı basılır, hidrasyon farkı yok).
 *
 * Etkileşim: fare, dokunma (`touch-action: pan-y`, dikey kaydırma bozulmaz)
 * ve klavye (odaklan, ← → Home End). Erişilebilirlik: veri `sr-only`
 * TABLODA; çizim `aria-hidden`; klavyeyle seçilen nokta canlı bölgede okunur.
 *
 * Biçim `Intl.NumberFormatOptions` olarak gelir, fonksiyon değil: bu bir
 * istemci bileşeni ve sunucu sayfasından fonksiyon prop'u geçemez.
 *
 * DÖNEM BANTLARI (`bands`, Assetora turu 2026-11): adı olan dönemleri
 * KALICI işaretler: "En İyi Gün", "Kampanya Haftası". Gezinen balon bir
 * noktayı sorulunca söyler; bant okuyucu sormadan önce "şuraya bak" der.
 * Bant tam boy bir sütun (tonun yıkanmış rengi, `success`/`danger`/
 * `neutral`), üstünde ve altında birer çip: bandın adı + ilk serinin
 * değeri, altta ikinci serinin değeri (aralık birden çok noktaysa
 * TOPLAM). Banda düşen eksen etiketi aynı tonda. En çok iki üç bant: her
 * şeyi işaretleyen grafik hiçbir şeyi işaretlemez. Ekran okuyucu bantları
 * tablonun altındaki cümlede, klavyeyle banda girince canlı bölgede duyar.
 */

/** Grafikte kalıcı işaretli dönem; `from`/`to` etiket dizisindeki sıra (dahil). */
export type ChartBand = {
  from: number;
  to?: number;
  /** Kısa ad: "En İyi Gün". Çipte ve ekran okuyucuda. */
  label: string;
  tone?: "success" | "danger" | "neutral";
};

const BAND_BG = { success: "bg-success-wash", danger: "bg-danger-wash", neutral: "bg-surface-raised" } as const;
const BAND_TEXT = { success: "text-success", danger: "text-danger", neutral: "text-strong" } as const;

type AreaSeries = {
  /** Lejant ve balon adı: "Bu Yıl". */
  label: string;
  values: readonly number[];
  series?: Series;
};

const STROKE = ["stroke-chart-1", "stroke-chart-2", "stroke-chart-3", "stroke-chart-4", "stroke-chart-5", "stroke-chart-6"] as const;
const FILL = ["fill-chart-1/18", "fill-chart-2/18", "fill-chart-3/18", "fill-chart-4/18", "fill-chart-5/18", "fill-chart-6/18"] as const;

const W = 600;
const H = 200;
const EASE = [0.22, 1, 0.36, 1] as const;

type Point = readonly [number, number];

/** Monoton kübik eğri (d3 `curveMonotoneX` ile aynı teğetler). Saf; test edilebilir. */
export function monotonePath(points: readonly Point[]): string {
  const n = points.length;
  if (n === 0) return "";
  const f = (v: number) => Math.round(v * 100) / 100;
  if (n === 1) return `M${f(points[0][0])},${f(points[0][1])}`;
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1][0] - points[i][0];
    slope[i] = dx[i] === 0 ? 0 : (points[i + 1][1] - points[i][1]) / dx[i];
  }
  const tangent: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    const a = slope[i - 1];
    const b = slope[i];
    // Yön değişiyorsa (tepe ya da dip) teğet yatay: eğri noktayı aşmaz.
    tangent[i] = a * b <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / a + (dx[i] + 2 * dx[i - 1]) / b);
  }
  tangent[n - 1] = slope[n - 2];
  let d = `M${f(points[0][0])},${f(points[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const h = dx[i] / 3;
    d += `C${f(x0 + h)},${f(y0 + tangent[i] * h)},${f(x1 - h)},${f(y1 - tangent[i + 1] * h)},${f(x1)},${f(y1)}`;
  }
  return d;
}

/** Eğriyi tabana kapatan alan yolu. */
export function areaPath(points: readonly Point[], baseline: number): string {
  if (points.length < 2) return "";
  return `${monotonePath(points)}L${points.at(-1)![0]},${baseline}L${points[0][0]},${baseline}Z`;
}

/** 0'dan başlayan "yuvarlak" eksen değerleri: 1, 2, 2,5, 5 × 10ⁿ adımlarla. */
export function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const raw = max / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].find((s) => s * pow >= raw) ?? 10) * pow;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => Math.round(i * step * 1e6) / 1e6);
}

export function AreaChart({
  labels,
  series,
  title,
  valueFormat,
  unit,
  height = "h-52",
  bands = [],
  className,
}: {
  /** X ekseni etiketleri, kısa: "Oca", "12 Eki". Seri değerleriyle aynı uzunlukta. */
  labels: readonly string[];
  /** Bir ya da iki seri; ilki önde çizilir. */
  series: readonly AreaSeries[];
  /** Grafiğin ve tablonun adı: "Aylık Ziyaretçi". */
  title: string;
  /** Balon ve tablo biçimi: `{ style: "currency", currency: "TRY", maximumFractionDigits: 0 }`. */
  valueFormat?: Intl.NumberFormatOptions;
  /** Değerin ardına: "ziyaret". */
  unit?: string;
  /** Çizim alanı yüksekliği: Tailwind sınıfı. */
  height?: string;
  /** Kalıcı işaretli dönemler (en iyi gün, kampanya haftası); en çok iki üç tane. */
  bands?: readonly ChartBand[];
  className?: string;
}) {
  const clip = `area-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const reduce = useReducedMotion();
  // Gözlemci kapta: `<defs>` içindeki kırpma dikdörtgeni boyutsuz, onu gözlemlemek güvenilmez.
  const frame = useRef<HTMLElement>(null);
  // Hareket azaltmada görünür olmayı BEKLEME: son hal hemen çizilir. Yoksa
  // ekran dışındaki grafik baskıda, tam sayfa görüntüde ve kaydırmadan önce boş kalır.
  const seen = useInView(frame, { once: true, amount: 0.3 }) || reduce === true;
  const [active, setActive] = useState<number | null>(null);
  const [live, setLive] = useState("");

  const full = new Intl.NumberFormat("tr-TR", valueFormat);
  const compact = new Intl.NumberFormat("tr-TR", { ...valueFormat, notation: "compact", maximumFractionDigits: 1 });
  const fmt = (v: number) => full.format(v) + (unit ? ` ${unit}` : "");

  const n = labels.length;
  const max = Math.max(...series.flatMap((s) => s.values), 0);
  const ticks = niceTicks(max);
  const top = ticks.at(-1) || 1;
  const x = (i: number) => (n < 2 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => H - (v / top) * H;
  const pct = (i: number) => (n < 2 ? 50 : (i / (n - 1)) * 100);

  // Etiket seyreltme: telefonda en çok ~5, geniş ekranda ~10 etiket.
  const stepSm = Math.max(1, Math.ceil(n / 4));
  const stepMd = Math.max(1, Math.ceil(n / 6));
  const stepLg = Math.max(1, Math.ceil(n / 10));
  // Son etiket hep görünür; ona bir tam adımdan yakın düşen etiket gizlenir. Son etiket sağa
  // yaslı (ortalı değil), yani yarım etiket kadar sola taşar: 0,8 adımda telefonda "28 Eki2 Kas" diye bitişiyordu.
  // Uçtaki etiketler kenara yaslı (ortalı değil), yani bir tam etiket enini kaplar: komşusu
  // en az 1,5 adım uzakta olmalı, yoksa "15 Kas 00:0016 Kas 02:00" diye bitişir (26 Kasım 2026).
  const showTick = (i: number, step: number) => i === 0 || i === n - 1 || (i % step === 0 && i >= step * 1.5 && n - 1 - i >= step * 1.5);

  // Bantlar: sıralar sınırlanır, değer aralığın toplamı. Sütun bir noktanın yarım adım iki yanına uzanır.
  const half = n < 2 ? 50 : 50 / (n - 1);
  const marked = bands.map((b) => {
    const from = Math.max(0, Math.min(n - 1, b.from));
    const to = Math.max(from, Math.min(n - 1, b.to ?? b.from));
    const sum = (s: AreaSeries) => s.values.slice(from, to + 1).reduce((a, v) => a + (v ?? 0), 0);
    const left = Math.max(0, pct(from) - half);
    const right = Math.min(100, pct(to) + half);
    const center = (left + right) / 2;
    const where = from === to ? labels[from] : `${labels[from]} – ${labels[to]}`;
    return { ...b, from, to, left, right, center, where, tone: b.tone ?? "neutral", totals: series.map(sum) };
  });
  const bandAt = (i: number) => marked.find((b) => i >= b.from && i <= b.to);

  const nearest = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    return Math.round(ratio * (n - 1));
  };

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const map: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    let next: number | null = null;
    if (event.key in map) next = Math.min(n - 1, Math.max(0, (active ?? (map[event.key] > 0 ? -1 : n)) + map[event.key]));
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = n - 1;
    else if (event.key === "Escape") return setActive(null);
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    const band = bandAt(next);
    setLive(`${labels[next]}${band ? ` (${band.label})` : ""}: ${series.map((s) => `${s.label} ${fmt(s.values[next] ?? 0)}`).join(", ")}`);
  }

  const draw = (delay: number) => ({ duration: reduce ? 0 : 1.1, delay: reduce ? 0 : delay, ease: EASE });

  return (
    <figure ref={frame} className={cn("w-full", className)}>
      <div className="sr-only">
        {/* sr-only kap DIŞTA: <table> width: 1px'i yok sayar, uzun etiketle sayfayı yana taşırır. */}
        <table>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Dönem</th>
            {series.map((s) => (
              <th key={s.label} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((label, i) => (
            <tr key={label + i}>
              <th scope="row">{label}</th>
              {series.map((s) => (
                <td key={s.label}>{fmt(s.values[i] ?? 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
        {marked.length ? (
          <p>
            İşaretli dönemler: {marked.map((b) => `${b.label}, ${b.where}: ${series.map((s, si) => `${s.label} ${fmt(b.totals[si])}`).join(", ")}`).join("; ")}.
          </p>
        ) : null}
      </div>

      <div className="flex gap-2">
        {/* Y ekseni: değer gerçek konumunda, çizgisiz */}
        <div aria-hidden className={cn("relative w-9 shrink-0 text-micro text-muted tabular-nums", height)}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 translate-y-1/2" style={{ bottom: `${(t / top) * 100}%` }}>
              {compact.format(t)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div
            role="group"
            aria-label={`${title}: ok tuşlarıyla noktalar arasında gezin`}
            tabIndex={0}
            onKeyDown={onKey}
            onBlur={() => setActive(null)}
            onPointerMove={(e) => setActive(nearest(e))}
            onPointerDown={(e) => setActive(nearest(e))}
            onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
            className={cn("relative touch-pan-y rounded-sm select-none", height)}
          >
            {marked.map((b) => (
              <div key={`${b.label}-${b.from}`} aria-hidden className="pointer-events-none absolute inset-y-0" style={{ left: `${b.left}%`, width: `${b.right - b.left}%` }}>
                <span className={cn("absolute inset-0 rounded-sm", BAND_BG[b.tone])} />
              </div>
            ))}
            <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
              <defs>
                <clipPath id={clip}>
                  {/* Taşan nokta/çizgi kalınlığı kesilmesin diye perde biraz geniş */}
                  <m.rect
                    x={-8}
                    y={-8}
                    width={W + 16}
                    height={H + 16}
                    style={{ originX: 0 }}
                    initial={{ scaleX: 0 }}
                    animate={seen ? { scaleX: 1 } : undefined}
                    transition={draw(0)}
                  />
                </clipPath>
              </defs>
              {ticks.map((t) => (
                <line
                  key={t}
                  x1={0}
                  x2={W}
                  y1={y(t)}
                  y2={y(t)}
                  strokeDasharray={t === 0 ? undefined : "3 4"}
                  vectorEffect="non-scaling-stroke"
                  className={t === 0 ? "stroke-line" : "stroke-line-soft"}
                />
              ))}
              {/* Arkadaki seri önce: ilk seri üstte kalsın */}
              {[...series].reverse().map((s, ri) => {
                const si = series.length - 1 - ri;
                const tone = (s.series ?? ((si + 1) as Series)) - 1;
                const pts = s.values.map((v, i) => [x(i), y(v)] as const);
                return (
                  <g key={s.label} clipPath={`url(#${clip})`}>
                    <m.path
                      d={areaPath(pts, H)}
                      className={FILL[tone]}
                      initial={{ opacity: 0 }}
                      animate={seen ? { opacity: 1 } : undefined}
                      transition={draw(0.45 + si * 0.12)}
                    />
                    <path
                      d={monotonePath(pts)}
                      fill="none"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      className={STROKE[tone]}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Bant çipleri çizginin ÜSTÜNDE (okunur kalsın), balonun altında. Kenara yakın çip içeri yaslanır. */}
            {marked.map((b) => {
              const align = b.center < 14 ? "left-0" : b.center > 86 ? "right-0" : "-translate-x-1/2";
              const at = b.center < 14 || b.center > 86 ? undefined : { left: `${b.center}%` };
              const chip = "pointer-events-none absolute flex items-center gap-1.5 whitespace-nowrap rounded-md bg-overlay px-2 py-1 text-micro shadow-raised ring-1 ring-line";
              return (
                <div key={`chip-${b.label}-${b.from}`} aria-hidden>
                  {/* İmleç bu bantta: balon aynı değeri söylüyor, üst çip çekilir (üst üste binmesin). */}
                  <span className={cn(chip, "top-1.5 transition-opacity duration-150", align, active !== null && bandAt(active) === b && "opacity-0")} style={at}>
                    <span className={cn("font-medium", BAND_TEXT[b.tone])}>{b.label}</span>
                    <span className="font-semibold text-strong tabular-nums">{compact.format(b.totals[0] ?? 0)}</span>
                  </span>
                  {series[1] ? (
                    <span className={cn(chip, "bottom-1.5", align)} style={at}>
                      <span className={cn("size-1.5 rounded-full", SERIES_BG[(series[1].series ?? 2) - 1])} />
                      <span className="text-muted">{series[1].label}</span>
                      <span className="font-semibold text-strong tabular-nums">{compact.format(b.totals[1] ?? 0)}</span>
                    </span>
                  ) : null}
                </div>
              );
            })}

            {/* İmleç katmanı: tam genişlik, translateX(%) ile kayar */}
            {active !== null ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-10 transition-transform duration-150 ease-out motion-reduce:transition-none"
                style={{ transform: `translateX(${pct(active)}%)` }}
              >
                <span className="absolute inset-y-0 left-0 w-px -translate-x-1/2 bg-line-strong" />
                {series.map((s, si) => {
                  const tone = (s.series ?? ((si + 1) as Series)) - 1;
                  const v = s.values[active] ?? 0;
                  return (
                    <span key={s.label} className="absolute top-0 left-0 h-full w-0" style={{ transform: `translateY(${(1 - v / top) * 100}%)` }}>
                      <span className={cn("absolute top-0 left-0 size-2.5 -translate-1/2 rounded-full ring-2 ring-overlay", SERIES_BG[tone])} />
                    </span>
                  );
                })}
                <div
                  className={cn(
                    "absolute top-1 left-0 min-w-32 rounded-md bg-overlay px-2.5 py-2 shadow-floating",
                    pct(active) > 62 ? "-translate-x-[calc(100%+10px)]" : "translate-x-2.5",
                  )}
                >
                  <p className="text-micro text-muted">{labels[active]}</p>
                  <ul className="mt-1 space-y-0.5">
                    {series.map((s, si) => (
                      <li key={s.label} className="flex items-center gap-1.5 text-small whitespace-nowrap">
                        <span className={cn("size-2 shrink-0 rounded-[3px]", SERIES_BG[(s.series ?? ((si + 1) as Series)) - 1])} />
                        <span className="text-muted">{s.label}</span>
                        <span className="ml-auto pl-3 font-semibold text-strong tabular-nums">{fmt(s.values[active] ?? 0)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>

          {/* X ekseni */}
          {/* Etiket sayısı GRAFİĞİN genişliğine göre (container query), pencereye göre değil:
              yan sütunlu 600 px'lik kartta on "16 Kas 08:00" etiketi üst üste biniyordu. */}
          <div aria-hidden className="@container mt-2">
          <div className="relative h-4 text-micro text-muted">
            {labels.map((label, i) => (
              <span
                key={label + i}
                className={cn(
                  "absolute top-0 whitespace-nowrap",
                  i === 0 ? "left-0" : i === n - 1 ? "right-0" : "-translate-x-1/2",
                  !showTick(i, stepSm) && "@max-lg:hidden",
                  !showTick(i, stepMd) && "@lg:@max-4xl:hidden",
                  !showTick(i, stepLg) && "@4xl:hidden",
                  bandAt(i) && cn("font-semibold", BAND_TEXT[bandAt(i)!.tone]),
                )}
                style={i === 0 || i === n - 1 ? undefined : { left: `${pct(i)}%` }}
              >
                {label}
              </span>
            ))}
          </div>
          </div>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {live}
      </p>
    </figure>
  );
}
