"use client";

import { useId, useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { REGIONS } from "./_data";
import { MAP_SHAPES } from "./_harita";

/**
 * Kartografik bölge haritası (26 Kasım 2026). Sahibi: "gerçek bir harita gibi yap, çok iyi
 * dursun; güzel harita yapmayacaksan koyma bile". Kuzeyova kurgusal: gerçek karo servisi
 * (OSM, MapLibre) kurgusal coğrafyaya uymaz, ağ ve anahtar ister. Bu yüzden harita SVG'de,
 * gerçek haritanın katmanlarıyla çizilir:
 *   - Kıvrımlı sınırlar: her kenar, iki ucuna göre tohumlanmış gürültüyle bölünür; komşu iki
 *     bölge aynı kenarı (ters yönde) AYNI noktalardan geçer: aralarında boşluk/bindirme yok.
 *   - Kıyı ve deniz (güney), derinlik çizgileri; arazi kabartması (`feDiffuseLighting`).
 *   - Nehir, otoyol ve kıyı yolu (Catmull-Rom), ilçe noktaları, trafo merkezleri.
 *   - Ölçek çubuğu ve kuzey oku.
 * Üç görünüm (`look`): `topo` (açık, kağıt üstünde kabartma), `gece` (koyu uydu; yollar ve
 * trafolar ışıklı), `kroki` (sade, düz pastel). Renkler token'dan; `gece` iki temada da koyu.
 *
 * Erişilebilirlik: bölgeler buton (Enter/Boşluk seçer, `aria-pressed`), aynı bilgi `sr-only`
 * tabloda; süs katmanları `aria-hidden`. Hareket: yalnız arızalı trafonun nabzı (hareket
 * azaltmada durağan).
 */

export type CartoTone = "danger" | "warning" | "success" | "neutral";
export type CartoRegion = { id: string; label: string; value: string; note?: string; tone: CartoTone };
export type CartoMarker = { id: string; regionId: string; label: string; tone: CartoTone };
export type CartoLook = "topo" | "gece" | "kroki";

const W = 420;
const H = 340;
type P = readonly [number, number];

const parse = (d: string): P[] =>
  [...d.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])] as const);

/** Uçlara göre tohumlanan sözde rastgele: aynı kenar her iki bölgede aynı sayıları üretir. */
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Kenarı doğal sınıra çevirir: kanonik yönde (küçük uçtan büyüğe) üretilir, gerekirse ters çevrilir. */
function wiggle(a: P, b: P, amp: number, steps = 12): P[] {
  const flip = a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]);
  const [p, q] = flip ? [b, a] : [a, b];
  const rand = rng(Math.round(p[0] * 7919 + p[1] * 104729 + q[0] * 1299709 + q[1] * 15485863));
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const ph1 = rand() * Math.PI * 2;
  const ph2 = rand() * Math.PI * 2;
  const pts: P[] = [p];
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    // İki oktav: geniş kıvrım + ince pürüz; uçlarda sıfıra iner (köşe noktaları sabit).
    const env = Math.sin(Math.PI * t);
    const off = (Math.sin(t * Math.PI * 2 + ph1) * 0.65 + Math.sin(t * Math.PI * 6 + ph2) * 0.35 + (rand() - 0.5) * 0.35) * amp * env * Math.min(1, len / 60);
    pts.push([p[0] + dx * t + nx * off, p[1] + dy * t + ny * off]);
  }
  pts.push(q);
  return flip ? pts.reverse() : pts;
}

const fmt = (n: number) => n.toFixed(1);
const poly = (pts: readonly P[]) => `M${pts.map((p) => `${fmt(p[0])} ${fmt(p[1])}`).join("L")}Z`;

/** Catmull-Rom → kübik Bézier: yol ve nehir için yumuşak çizgi. */
function smooth(pts: readonly P[]) {
  let d = `M${fmt(pts[0][0])} ${fmt(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${fmt(c1[0])} ${fmt(c1[1])} ${fmt(c2[0])} ${fmt(c2[1])} ${fmt(p2[0])} ${fmt(p2[1])}`;
  }
  return d;
}

/* Coğrafya: sınırlar MAP_SHAPES'ten. Kıyı, Kıyı bölgesinin GÜNEY kenarları (iki ucu da y ≥ 262):
   bu kenarlar daha kıvrımlı üretilir ve denizin üst sınırı tam bu noktalardan geçer. */
const isCoast = (id: string, a: P, b: P) => id === "kiyi" && a[1] >= 262 && b[1] >= 262;
const SHAPES = MAP_SHAPES.map((s) => {
  const pts = parse(s.path);
  const out: P[] = [];
  pts.forEach((a, i) => {
    const b = pts[(i + 1) % pts.length];
    const coast = isCoast(s.id, a, b);
    out.push(...wiggle(a, b, coast ? 8 : 5.5, coast ? 22 : 12).slice(0, -1));
  });
  return { id: s.id, at: s.at, d: poly(out) };
});
/* Kıyı zinciri: aynı wiggle çağrıları (aynı tohum) → sınırla birebir aynı noktalar; batıdan doğuya. */
const KIYI_PTS = parse(MAP_SHAPES.find((s) => s.id === "kiyi")!.path);
const COAST: P[] = KIYI_PTS.flatMap((a, i) => {
  const b = KIYI_PTS[(i + 1) % KIYI_PTS.length];
  return isCoast("kiyi", a, b) ? wiggle(a, b, 8, 22) : [];
}).sort((p, q) => p[0] - q[0]);
const COAST_PTS = COAST.map((p) => `${fmt(p[0])} ${fmt(p[1])}`).join("L");
/** Deniz: kıyıdan aşağısı; uzaklaştırınca (pad) yanlara ve aşağı taşar. */
const seaPath = (pad: number) => `M${-pad - 2} ${fmt(COAST[0][1])}L0 ${fmt(COAST[0][1])}L${COAST_PTS}L${W} ${fmt(COAST.at(-1)![1])}L${W + pad + 2} ${fmt(COAST.at(-1)![1])}L${W + pad + 2} ${H + pad * 1.2 + 2}L${-pad - 2} ${H + pad * 1.2 + 2}Z`;
const coastLine = (pad: number) => `M${-pad - 2} ${fmt(COAST[0][1])}L0 ${fmt(COAST[0][1])}L${COAST_PTS}L${W} ${fmt(COAST.at(-1)![1])}L${W + pad + 2} ${fmt(COAST.at(-1)![1])}`;

const RIVER = smooth([[140, -60], [150, -4], [168, 40], [176, 92], [158, 140], [166, 190], [150, 236], [132, 286], [128, 312], [124, 400]]);
const HIGHWAY = smooth([[-70, 206], [-6, 196], [60, 182], [130, 170], [212, 176], [300, 150], [360, 118], [430, 104], [490, 96]]);
const NORTH_ROAD = smooth([[88, -70], [92, -6], [96, 60], [140, 120], [212, 176], [236, 228], [226, 300]]);
const COAST_ROAD = smooth([[-70, 236], [-6, 250], [70, 262], [150, 272], [230, 278], [320, 270], [430, 246], [490, 232]]);

/* İlçeler: her bölgenin ilk iki ilçesi, etiketin iki yanında. */
const TOWNS = MAP_SHAPES.flatMap((s) => {
  const r = REGIONS.find((x) => x.id === s.id);
  if (!r) return [];
  return r.districts.slice(0, 2).map((name, k) => {
    const x = s.at[0] + (k ? 34 : -36);
    // Sağ kenara yakın ilçe adı sola yazılır (kesilmesin).
    return { name, at: [x, s.at[1] + (k ? -20 : 22)] as P, end: x > W - 70 };
  });
});

const LOOK = {
  topo: {
    land: "color-mix(in oklab, var(--accent-warm) 9%, var(--page-bg))",
    sea: "color-mix(in oklab, var(--primary-soft) 30%, var(--page-bg))",
    seaLine: "color-mix(in oklab, var(--primary) 22%, transparent)",
    border: "color-mix(in oklab, var(--text-strong) 38%, transparent)",
    road: "var(--page-bg)",
    roadCase: "color-mix(in oklab, var(--text-strong) 22%, transparent)",
    river: "color-mix(in oklab, var(--primary) 55%, var(--page-bg))",
    label: "var(--text-strong)",
    town: "var(--text-body)",
    halo: "var(--page-bg)",
    relief: 0.55,
    fill: 30,
  },
  gece: {
    land: "color-mix(in oklab, var(--primary-hover) 12%, var(--kz-night))",
    sea: "color-mix(in oklab, var(--primary-hover) 30%, var(--kz-night))",
    seaLine: "color-mix(in oklab, var(--primary-soft) 30%, transparent)",
    border: "color-mix(in oklab, var(--primary-soft) 55%, transparent)",
    road: "color-mix(in oklab, var(--primary-soft) 70%, var(--kz-night-ink))",
    roadCase: "color-mix(in oklab, var(--primary) 40%, transparent)",
    river: "color-mix(in oklab, var(--primary-soft) 70%, transparent)",
    label: "var(--kz-night-ink)",
    town: "color-mix(in oklab, var(--kz-night-ink) 72%, transparent)",
    halo: "color-mix(in oklab, var(--primary-hover) 12%, var(--kz-night))",
    relief: 0.38,
    fill: 42,
  },
  kroki: {
    land: "color-mix(in oklab, var(--text-strong) 4%, var(--page-bg))",
    sea: "color-mix(in oklab, var(--primary-soft) 16%, var(--page-bg))",
    seaLine: "transparent",
    border: "var(--page-bg)",
    road: "var(--page-bg)",
    roadCase: "transparent",
    river: "color-mix(in oklab, var(--primary-soft) 45%, var(--page-bg))",
    label: "var(--text-strong)",
    town: "var(--text-muted)",
    halo: "transparent",
    relief: 0,
    fill: 22,
  },
} as const;

const TONE: Record<CartoTone, string> = { danger: "var(--danger)", warning: "var(--warning)", success: "var(--success)", neutral: "var(--text-muted)" };

const CSS = `
/* Gece görünümü iki temada da koyu: açık temada metin rengi (koyu), koyu temada sayfa rengi zemin olur. */
.kz-carto { --kz-night: var(--text-strong); --kz-night-ink: var(--page-bg); }
:root[data-theme="dark"] .kz-carto { --kz-night: var(--page-bg); --kz-night-ink: var(--text-strong); }
@keyframes kz-map-pulse { 0% { transform: scale(1); opacity: .6; } 100% { transform: scale(3); opacity: 0; } }
.kz-map-pulse { transform-box: fill-box; transform-origin: center; animation: kz-map-pulse 2.2s cubic-bezier(.22,1,.36,1) infinite; }
@media (prefers-reduced-motion: reduce) { .kz-map-pulse { animation: none; opacity: 0; } }`;

export function CartoMap({
  title,
  regions,
  markers = [],
  look = "topo",
  selectedId = null,
  onSelect,
  zoom = 0,
  className,
}: {
  /** Uzaklaştırma (viewBox birimi): çevredeki komşu arazi ve deniz görünür, harita küçülür. */
  zoom?: number;
  title: string;
  regions: readonly CartoRegion[];
  markers?: readonly CartoMarker[];
  look?: CartoLook;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const id = (s: string) => `${uid}-${s}`;
  const L = LOOK[look];
  const [hover, setHover] = useState<string | null>(null);
  const byId = useMemo(() => new Map(regions.map((r) => [r.id, r])), [regions]);
  const fillOf = (tone: CartoTone, sel: boolean) =>
    tone === "neutral" ? "transparent" : `color-mix(in oklab, ${TONE[tone]} ${(tone === "success" ? 0.55 : 1) * (sel ? L.fill + 14 : L.fill)}%, transparent)`;
  const placed = markers.map((m) => {
    const shape = SHAPES.find((s) => s.id === m.regionId);
    const siblings = markers.filter((x) => x.regionId === m.regionId);
    const k = siblings.indexOf(m);
    const below = (shape?.at[1] ?? 0) + 30 < 286;
    const at: P = shape ? (below ? [shape.at[0] + (k - (siblings.length - 1) / 2) * 15, shape.at[1] + 30] : [shape.at[0] + 52 + k * 14, shape.at[1] - 4]) : [0, 0];
    return { ...m, at };
  });
  const active = regions.find((r) => r.id === hover);
  const activeAt = SHAPES.find((s) => s.id === hover)?.at;
  const onKey = (e: KeyboardEvent, rid: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(rid);
    }
  };
  const night = look === "gece";
  const SEA = seaPath(zoom);
  const COAST_LINE = coastLine(zoom);
  const vx = -zoom;
  const vy = -zoom * 0.6;
  const vw = W + zoom * 2;
  const vh = H + zoom * 1.2;
  return (
    <figure className={cn("kz-carto relative overflow-hidden rounded-lg", className)} style={{ background: L.land } as CSSProperties}>
      <style href="kz-carto" precedence="default">
        {CSS}
      </style>
      <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} role="group" aria-label={title} className="block h-auto w-full select-none">
        <defs>
          {/* Arazi kabartması: fraktal gürültüden ışıklı yüzey, kuzeybatıdan ışık. */}
          <filter id={id("relief")} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={5} seed={4} result="h" />
            <feDiffuseLighting in="h" surfaceScale={night ? 5 : 7} diffuseConstant={1.1} style={{ lightingColor: "var(--on-brand)" } as CSSProperties} result="lit">
              <feDistantLight azimuth={315} elevation={42} />
            </feDiffuseLighting>
            <feColorMatrix in="lit" type="saturate" values="0" />
          </filter>
          <clipPath id={id("land")}>
            <rect width={W} height={H} />
          </clipPath>
          <mask id={id("landmask")}>
            <rect x={vx} y={vy} width={vw} height={vh} fill="white" />
            <path d={SEA} fill="black" />
          </mask>
          <pattern id={id("hatch")} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: "color-mix(in oklab, var(--danger) 45%, transparent)" }} strokeWidth="1.4" />
          </pattern>
        </defs>

        {/* Deniz ve derinlik çizgileri */}
        <path d={SEA} style={{ fill: L.sea }} aria-hidden />
        {[10, 22, 36].map((o) => (
          <path key={o} d={COAST_LINE} transform={`translate(0 ${o})`} fill="none" style={{ stroke: L.seaLine }} strokeWidth="0.8" strokeDasharray={o > 20 ? "2 4" : undefined} aria-hidden />
        ))}
        <path d={COAST_LINE} fill="none" style={{ stroke: L.border }} strokeWidth="1.2" aria-hidden />

        {/* Kabartma yalnız karada */}
        {L.relief ? <rect x={vx} y={vy} width={vw} height={vh} filter={`url(#${id("relief")})`} mask={`url(#${id("landmask")})`} style={{ mixBlendMode: night ? "screen" : "multiply", opacity: L.relief * (night ? 0.35 : 1) }} aria-hidden /> : null}

        {/* Bölgeler: durum dolgusu, seçili olan koyu, eşik aşan çizgili */}
        {SHAPES.map((s) => {
          const r = byId.get(s.id);
          if (!r) return null;
          const sel = selectedId === s.id;
          const dim = selectedId && !sel;
          return (
            <g key={s.id} style={{ opacity: dim ? 0.55 : 1 }} className="transition-opacity duration-300">
              <path d={s.d} style={{ fill: fillOf(r.tone, sel) }} aria-hidden />
              {r.tone === "danger" ? <path d={s.d} fill={`url(#${id("hatch")})`} opacity="0.55" aria-hidden /> : null}
              <path
                d={s.d}
                fill="transparent"
                style={{ stroke: sel ? (night ? "var(--kz-night-ink)" : "var(--text-strong)") : L.border }}
                strokeWidth={sel ? 2.2 : look === "kroki" ? 2.5 : 0.9}
                strokeDasharray={sel || look === "kroki" ? undefined : "4 2.5"}
                strokeLinejoin="round"
                role={onSelect ? "button" : "img"}
                tabIndex={onSelect ? 0 : undefined}
                aria-pressed={onSelect ? sel : undefined}
                aria-label={`${r.label}: ${r.value}${r.note ? `, ${r.note}` : ""}`}
                onClick={onSelect ? () => onSelect(s.id) : undefined}
                onKeyDown={onSelect ? (e) => onKey(e, s.id) : undefined}
                onPointerEnter={(e) => e.pointerType === "mouse" && setHover(s.id)}
                onPointerLeave={() => setHover((h) => (h === s.id ? null : h))}
                onFocus={() => setHover(s.id)}
                onBlur={() => setHover((h) => (h === s.id ? null : h))}
                className={cn("outline-none", onSelect && "cursor-pointer focus-visible:[stroke-width:3] focus-visible:[stroke:var(--line-focus)]")}
              />
            </g>
          );
        })}

        {/* Nehir, yollar (kılıf + yol), kıyı yolu */}
        <g aria-hidden fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={RIVER} style={{ stroke: L.river }} strokeWidth="2.6" />
          {[HIGHWAY, NORTH_ROAD, COAST_ROAD].map((d, i) => (
            <g key={i}>
              <path d={d} style={{ stroke: L.roadCase }} strokeWidth={i === 0 ? 4.6 : 3.4} />
              <path d={d} style={{ stroke: L.road, filter: night ? "drop-shadow(0 0 2px color-mix(in oklab, var(--primary-soft) 80%, transparent))" : undefined }} strokeWidth={i === 0 ? 2.6 : 1.7} />
            </g>
          ))}
        </g>

        {/* İlçeler */}
        <g aria-hidden>
          {TOWNS.map((t) => (
            <g key={t.name}>
              <circle cx={t.at[0]} cy={t.at[1]} r="1.8" style={{ fill: L.town }} />
              <text x={t.end ? t.at[0] - 4 : t.at[0] + 4} y={t.at[1] + 3} textAnchor={t.end ? "end" : "start"} fontSize={7} className="italic" style={{ fill: L.town, paintOrder: "stroke", stroke: L.halo, strokeWidth: 2.4 } as CSSProperties}>
                {t.name}
              </text>
            </g>
          ))}
        </g>

        {/* Bölge adları ve değerleri (kartografik: büyük harf, aralıklı) */}
        <g aria-hidden>
          {SHAPES.map((s) => {
            const r = byId.get(s.id);
            if (!r) return null;
            return (
              <g key={s.id}>
                <text x={s.at[0]} y={s.at[1]} textAnchor="middle" fontSize={9.5} className="font-semibold tracking-[0.16em]" style={{ fill: L.label, paintOrder: "stroke", stroke: L.halo, strokeWidth: 3 } as CSSProperties}>
                  {r.label.toLocaleUpperCase("tr-TR")}
                </text>
                <text x={s.at[0]} y={s.at[1] + 11} textAnchor="middle" fontSize={8} className="font-medium tabular-nums" style={{ fill: r.tone === "danger" ? "var(--danger)" : L.town, paintOrder: "stroke", stroke: L.halo, strokeWidth: 2.6 } as CSSProperties}>
                  {r.value}
                </text>
              </g>
            );
          })}
        </g>

        {/* Trafo merkezleri: kare simge, durum renginde; arızalı nabız atar */}
        <g aria-hidden>
          {placed.map((m) => (
            <g key={m.id}>
              {m.tone === "danger" ? <rect className="kz-map-pulse" x={m.at[0] - 4} y={m.at[1] - 4} width="8" height="8" rx="2" style={{ fill: TONE.danger }} /> : null}
              <rect x={m.at[0] - 4} y={m.at[1] - 4} width="8" height="8" rx="2" style={{ fill: TONE[m.tone], stroke: L.halo === "transparent" ? "var(--page-bg)" : L.halo }} strokeWidth="1.6" />
            </g>
          ))}
        </g>

        {/* Ölçek ve kuzey oku */}
        <g aria-hidden transform={`translate(${vx + 14} ${vy + vh - 18})`} style={{ fill: L.town } as CSSProperties}>
          <rect width="40" height="3" style={{ fill: L.label }} />
          <rect x="20" width="20" height="3" style={{ fill: L.halo === "transparent" ? "var(--page-bg)" : L.halo, stroke: L.label }} strokeWidth="0.6" />
          <text y="-3" fontSize={7}>0</text>
          <text x="36" y="-3" fontSize={7}>5 km</text>
        </g>
        <g aria-hidden transform={`translate(${vx + vw - 22} ${vy + 22})`}>
          <circle r="11" style={{ fill: L.halo === "transparent" ? "var(--page-bg)" : L.halo, stroke: L.border }} strokeWidth="0.8" />
          <path d="M0 -8 L4 4 L0 1.5 L-4 4 Z" style={{ fill: L.label }} />
          <text y="-13.5" textAnchor="middle" fontSize={7} className="font-semibold" style={{ fill: L.label }}>
            K
          </text>
        </g>
      </svg>

      {active && activeAt ? (
        <div
          aria-hidden
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-strong px-2.5 py-1.5 text-small whitespace-nowrap text-page shadow-floating"
          style={{ left: `${((activeAt[0] - vx) / vw) * 100}%`, top: `${((activeAt[1] - vy) / vh) * 100 - 4}%` }}
        >
          <span className="font-semibold">{active.label}</span> · <span className="tabular-nums">{active.value}</span>
          {active.note ? <span className="block text-micro opacity-80">{active.note}</span> : null}
        </div>
      ) : null}

      <div className="sr-only">
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">Bölge</th>
              <th scope="col">Durum</th>
            </tr>
          </thead>
          <tbody>
            {regions.map((r) => (
              <tr key={r.id}>
                <th scope="row">{r.label}</th>
                <td>
                  {r.value}
                  {r.note ? `, ${r.note}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {markers.length ? (
          <ul aria-label="Trafo merkezleri">
            {markers.map((m) => (
              <li key={m.id}>{m.label}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </figure>
  );
}

/** Harita açıklaması: bölge dolgusu (kare) ve trafo simgesi (yuvarlatılmış kare) aynı satırda. */
export function CartoLegend({ items, className }: { items: readonly { tone: CartoTone; label: string; kind: "area" | "station" }[]; className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-small text-muted", className)}>
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn(it.kind === "area" ? "size-3 rounded-[3px]" : "size-2.5 rounded-[2px]")}
            style={{ background: it.kind === "area" ? (it.tone === "neutral" ? "var(--line-strong)" : `color-mix(in oklab, ${TONE[it.tone]} ${it.tone === "success" ? 30 : 45}%, transparent)`) : TONE[it.tone] }}
          />
          {it.label}
        </span>
      ))}
    </p>
  );
}
