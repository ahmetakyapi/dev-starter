"use client";

import { m, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Küre: kartın, kahramanın ya da boş ekranın odak nesnesi. İki biçim:
 *   - `swirl`: parlak cam küre; içinde renkler yavaşça döner (konik degrade,
 *     bulanık), üstte ışık parlaması, altta gölge yarımı ve yumuşak yer
 *     gölgesi. Ürünün "canlı" ama sakin işareti: yapay zeka, palet, marka.
 *   - `globe`: noktalı dünya; meridyenler döner gibi daralıp genişler,
 *     birkaç şehir noktası nabız atar. "Her yerde", küresel ödeme, ağ.
 * `OrbCarousel`: küreleri yatay sıralar; ortadaki büyük ve net, yandakiler
 *   küçülür, bulanıklaşır ve kenarda kesilir. Seçilince kayarak yer değişir.
 *
 * Referans turu 25 Kasım 2026: "Frontier meets reality" kartındaki küre
 * şeridi, KODOR kartındaki parlak küre, Grain videosundaki dönen dünya.
 * Görsel/3D varlık yok: hepsi CSS degrade ve SVG, renkler token'dan
 * (`colors` ile çağıran palet değerlerini verebilir: kahramandaki palet
 * küreleri gibi). Beyaz parlama `--on-brand` (iki temada beyaz).
 *
 * HAREKET: dönüş ve meridyen yalnız `transform`; hareketi azaltan
 * kullanıcıda küre durağan, görünüş aynı. Küre süstür (`aria-hidden`);
 * anlam taşıyorsa `label` verilir (`role="img"`). Karuselde her küre bir
 * buton (`onSelect` verilirse), seçili olan `aria-pressed`.
 */

export interface OrbProps {
  variant?: "swirl" | "globe";
  /** Çap (px). */
  size?: number;
  /** Dönen renkler (CSS değeri); varsayılan paletin birincil ailesi + kehribar. */
  colors?: readonly string[];
  /** Altında yer gölgesi. */
  shadow?: boolean;
  /** Anlam taşıyorsa erişilebilir ad. */
  label?: string;
  className?: string;
}

const DEFAULT = ["var(--primary)", "var(--primary-soft)", "var(--accent-warm)", "var(--primary-hover)"];

const CSS = `
@keyframes ui-orb-spin { to { transform: rotate(1turn); } }
.ui-orb-spin { animation: ui-orb-spin 14s linear infinite; }
@keyframes ui-orb-meridian { 0% { transform: scaleX(1); } 50% { transform: scaleX(0.04); } 100% { transform: scaleX(1); } }
.ui-orb-meridian { transform-box: fill-box; transform-origin: center; animation: ui-orb-meridian 9s ease-in-out infinite; }
@keyframes ui-orb-ping { 0% { transform: scale(1); opacity: .7; } 100% { transform: scale(3.2); opacity: 0; } }
.ui-orb-ping { transform-box: fill-box; transform-origin: center; animation: ui-orb-ping 2.6s cubic-bezier(.22,1,.36,1) infinite; }
@media (prefers-reduced-motion: reduce) { .ui-orb-spin, .ui-orb-meridian, .ui-orb-ping { animation: none; } .ui-orb-ping { opacity: 0; } }`;

function Swirl({ size, colors }: { size: number; colors: readonly string[] }) {
  const stops = [...colors, colors[0]].join(", ");
  return (
    <>
      {/* Dönen renk çekirdeği: kürenin dışına taşar, kap kırpar. */}
      <span className="ui-orb-spin absolute -inset-1/4" style={{ background: `conic-gradient(from 0deg, ${stops})`, filter: `blur(${Math.round(size * 0.09)}px)` }} />
      {/* Işık: sol üstte parlama, sağ altta gölge yarımı, kenarda ince ışık halkası. */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 32% 26%, color-mix(in srgb, var(--on-brand) 85%, transparent) 0, color-mix(in srgb, var(--on-brand) 18%, transparent) 22%, transparent 42%), radial-gradient(circle at 68% 82%, transparent 38%, color-mix(in srgb, var(--text-strong) 38%, transparent) 100%)`,
          boxShadow: `inset 0 0 0 1px color-mix(in srgb, var(--on-brand) 35%, transparent), inset 0 -${Math.round(size * 0.06)}px ${Math.round(size * 0.12)}px color-mix(in srgb, var(--text-strong) 22%, transparent)`,
        }}
      />
    </>
  );
}

function Globe({ size }: { size: number }) {
  const meridians = [0, 1, 2, 3, 4, 5];
  const cities: [number, number][] = [
    [34, 38],
    [61, 30],
    [52, 62],
    [72, 55],
  ];
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
      <defs>
        <pattern id={`ui-orb-dots-${size}`} width="3.2" height="3.2" patternUnits="userSpaceOnUse">
          <circle cx="1.6" cy="1.6" r="0.55" style={{ fill: "color-mix(in srgb, var(--primary) 55%, transparent)" }} />
        </pattern>
        <radialGradient id={`ui-orb-shade-${size}`} cx="34%" cy="30%" r="75%">
          <stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--primary-soft) 18%, var(--page-bg))" }} />
          <stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--primary) 30%, var(--page-bg))" }} />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#ui-orb-shade-${size})`} />
      <circle cx="50" cy="50" r="48" fill={`url(#ui-orb-dots-${size})`} opacity="0.7" />
      {[20, 35, 50, 65, 80].map((y) => {
        const half = Math.sqrt(48 * 48 - (y - 50) * (y - 50));
        return <ellipse key={y} cx="50" cy={y} rx={half} ry={half * 0.12} fill="none" style={{ stroke: "color-mix(in srgb, var(--primary) 40%, transparent)" }} strokeWidth="0.5" />;
      })}
      {meridians.map((i) => (
        <ellipse
          key={i}
          className="ui-orb-meridian"
          cx="50"
          cy="50"
          rx="48"
          ry="48"
          fill="none"
          style={{ stroke: "color-mix(in srgb, var(--primary) 55%, transparent)", animationDelay: `${-i * 1.5}s` }}
          strokeWidth="0.6"
        />
      ))}
      {cities.map(([x, y], i) => (
        <g key={i}>
          <circle className="ui-orb-ping" cx={x} cy={y} r="1.6" style={{ fill: "var(--primary)", animationDelay: `${i * 0.65}s` }} />
          <circle cx={x} cy={y} r="1.6" style={{ fill: "var(--primary)" }} />
        </g>
      ))}
      <circle cx="50" cy="50" r="48" fill="none" style={{ stroke: "color-mix(in srgb, var(--primary) 45%, transparent)" }} strokeWidth="0.8" />
    </svg>
  );
}

export function Orb({ variant = "swirl", size = 96, colors = DEFAULT, shadow = false, label, className }: OrbProps) {
  return (
    <span className={cn("relative inline-grid shrink-0 place-items-center", className)} style={{ width: size, height: shadow ? size * 1.18 : size }} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <style href="ui-orb" precedence="default">
        {CSS}
      </style>
      {shadow ? (
        <span
          className="absolute bottom-0 left-1/2 h-[12%] w-[70%] -translate-x-1/2 rounded-full"
          style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--text-strong) 28%, transparent), transparent)", filter: "blur(4px)" }}
        />
      ) : null}
      <span className="absolute top-0 left-0 overflow-hidden rounded-full" style={{ width: size, height: size }}>
        {variant === "globe" ? <Globe size={size} /> : <Swirl size={size} colors={colors} />}
      </span>
    </span>
  );
}

export interface OrbCarouselItem {
  id: string;
  label: string;
  colors?: readonly string[];
  variant?: "swirl" | "globe";
}

export interface OrbCarouselProps {
  items: readonly OrbCarouselItem[];
  /** Seçili kürenin kimliği. */
  value: string;
  onSelect?: (id: string) => void;
  /** Ortadaki kürenin çapı (px); yandakiler bundan türer. */
  size?: number;
  /** Karuselin erişilebilir adı. */
  label: string;
  className?: string;
}

/** Kenarlarda solma maskesi: yalnız saydamlık okunur, renk değeri önemsiz. */
const MASK = "linear-gradient(90deg, transparent, currentColor 18%, currentColor 82%, transparent)";

export function OrbCarousel({ items, value, onSelect, size = 120, label, className }: OrbCarouselProps) {
  const reduce = useReducedMotion();
  const n = items.length;
  const active = Math.max(0, items.findIndex((it) => it.id === value));
  const gap = size * 1.08;
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ height: size * 1.2, maskImage: MASK, WebkitMaskImage: MASK } as CSSProperties}
    >
      {items.map((it, i) => {
        let d = i - active;
        if (d > n / 2) d -= n;
        if (d < -n / 2) d += n;
        const far = Math.abs(d);
        if (far > 2) return null;
        const scale = far === 0 ? 1 : far === 1 ? 0.62 : 0.42;
        const Tag = onSelect ? m.button : m.span;
        return (
          <Tag
            key={it.id}
            {...(onSelect ? { type: "button" as const, onClick: () => onSelect(it.id), "aria-pressed": far === 0, "aria-label": it.label, tabIndex: far > 1 ? -1 : 0 } : { "aria-hidden": far !== 0 || undefined })}
            className="absolute top-1/2 left-1/2 grid place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-4 focus-visible:ring-offset-page"
            style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, zIndex: 10 - far }}
            initial={false}
            animate={{ x: d * gap * (far === 2 ? 0.86 : 1), scale, opacity: far === 2 ? 0.55 : 1, filter: `blur(${far * 2.5}px)` }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 20 }}
          >
            <Orb size={size} variant={it.variant} colors={it.colors} />
          </Tag>
        );
      })}
    </div>
  );
}
