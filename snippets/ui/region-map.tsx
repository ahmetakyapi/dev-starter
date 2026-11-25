"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * Bölge haritası: bağımlılıksız SVG, şematik. Bölgeler (şube bölgesi,
 * dağıtım bölgesi, satış bölgesi) kendi `path`leriyle çizilir; renk ya bir
 * DEĞER ölçeğinden (koyu = çok) ya da açık bir DURUM tonundan (`tone`:
 * eşiği aşan kırmızı) gelir. Gerçek coğrafya DEĞİL: çağıran stilize
 * poligonlarını verir (sınır dosyası, harita sağlayıcısı, anahtar yok).
 * Gerçek harita gerekirse bu bileşenin yerine bir harita kitaplığı.
 *
 * NE ZAMAN: "nerede" sorusunun cevabı bir bar listeden daha çabuk okunuyorsa
 * (bölgeye göre kayıp, arıza yoğunluğu, şube cirosu), 4-12 bölge. Bölge
 * sıralaması asıl iş ise `bar-list.tsx`; zamana göre dağılım için `heatmap`.
 *
 * `scale`: değer renk basamakları (5). `tone` verilen bölge ölçeği atlar.
 * Renk TEK işaret değil: değer fareyle/odakla balonda, her zaman `sr-only`
 * tabloda; eşiği aşan bölgeye ayrıca çizgili kenar (`tone="danger"`).
 *
 * ETKİLEŞİM: `onSelect` verilirse her bölge odaklanabilir bir butondur
 * (Enter/Boşluk seçer, `aria-pressed`); verilmezse bölgeler yalnız gösterir
 * ve odak almaz. Balon yalnız ince işaretçide hover/odakla görünür; dokunmatikte
 * değer tabloda ve seçimde. İçine etkileşimli öğe koyma.
 *
 * Şematik SVG `aria-hidden` değil: `role="group"` + ad; ama okuyucu için
 * asıl veri `sr-only` tablodadır (bölge, değer). Etiketler (`label`) çizimde
 * metin olarak yazılır; kısa tut (en çok ~10 karakter).
 *
 * İŞARETLER (`markers`, 25 Kasım 2026): bölgenin içindeki noktalar (trafo
 * merkezi, şube, depo); durum tonuyla dolu daire, `danger` olan yavaşça
 * nabız atar (hareket azaltmada durağan). Haritanın "boş poligon" gibi
 * durmasını önler: bölge rengi ÖZETİ, işaret NEREDE olduğunu söyler.
 * `showValues`: bölge adının altında biçimli değer (balonu beklemeden okunur).
 * `legendTones`: bölgeler ölçekle değil tonla boyanıyorsa ölçek şeridi yerine
 * ton numuneleri (eskiden tonlu haritanın altında yanlış bir mavi ölçek
 * duruyordu). Zemin: viewBox içinde hafif nokta ızgarası (kartografik iz).
 *
 *   <RegionMap
 *     title="Bölgeye göre kayıp"
 *     regions={[{ id: "kiyi", label: "Kıyı", path: "M…Z", at: [120, 90], value: 7.4 }]}
 *     format={(v) => `%${v.toFixed(1).replace(".", ",")}`}
 *     selectedId={sel}
 *     onSelect={setSel}
 *   />
 */

export type MapRegion = {
  id: string;
  label: string;
  /** SVG `d` verisi, `viewBox` koordinatlarında. */
  path: string;
  /** Etiketin konumu `[x, y]`. */
  at: readonly [number, number];
  value: number;
  /** Ölçek yerine açık durum tonu. */
  tone?: "danger" | "warning" | "success" | "neutral";
  /** Balonda ve tabloda ek satır: "hedef %6,0". */
  note?: string;
};

type Tone = "danger" | "warning" | "success" | "neutral";

export type MapMarker = {
  id: string;
  /** Konum `[x, y]`, `viewBox` koordinatlarında. */
  at: readonly [number, number];
  label: string;
  tone?: Tone;
};

type RegionMapProps = {
  title: string;
  regions: readonly MapRegion[];
  viewBox?: string;
  /** Değer biçimi; verilmezse tr-TR sayı. */
  format?: (value: number) => string;
  /** Ölçeğin uçları; verilmezse verinin en küçük ve en büyüğü. */
  scale?: { min: number; max: number };
  /** Ölçeğin anlamı: "Düşük" / "Yüksek". */
  legend?: readonly [string, string];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Bölge içi noktalar (trafo, şube); durum tonlu. */
  markers?: readonly MapMarker[];
  /** İşaret listesinin adı: "Trafo merkezleri". */
  markerLabel?: string;
  /** İşaret açıklaması: ton başına numune ("Çalışıyor", "Arıza"). */
  markerLegend?: readonly { tone: Tone; label: string }[];
  /** Bölge adının altında değer. */
  showValues?: boolean;
  /** Tonlu harita için ölçek yerine ton numuneleri. */
  legendTones?: readonly { tone: Tone; label: string }[];
  className?: string;
};

const TONE_VAR: Record<Tone, string> = {
  danger: "var(--danger)",
  warning: "var(--warning)",
  success: "var(--success)",
  neutral: "var(--text-muted)",
};
const MARKER_CSS = `
@keyframes ui-map-pulse { 0% { transform: scale(1); opacity: .55; } 100% { transform: scale(2.6); opacity: 0; } }
.ui-map-pulse { transform-box: fill-box; transform-origin: center; animation: ui-map-pulse 2.2s cubic-bezier(.22,1,.36,1) infinite; }
@media (prefers-reduced-motion: reduce) { .ui-map-pulse { animation: none; opacity: 0; } }`;

const num = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });
const STEPS = [8, 22, 38, 56, 76] as const;

export function RegionMap({
  title,
  regions,
  viewBox = "0 0 400 300",
  format = (v) => num.format(v),
  scale,
  legend = ["Düşük", "Yüksek"],
  selectedId = null,
  onSelect,
  markers = [],
  markerLabel = "Noktalar",
  markerLegend = [],
  showValues = false,
  legendTones,
  className,
}: RegionMapProps) {
  const patternId = `${useId().replace(/:/g, "")}-dots`;
  const [hover, setHover] = useState<string | null>(null);
  const tableId = useId();
  const min = scale?.min ?? Math.min(...regions.map((r) => r.value), 0);
  const max = scale?.max ?? Math.max(...regions.map((r) => r.value), 1);
  const [vx, vy, vw, vh] = viewBox.split(" ").map(Number);
  const active = regions.find((r) => r.id === hover);

  const fill = (r: MapRegion) => {
    if (r.tone === "danger") return "color-mix(in oklab, var(--danger) 38%, var(--surface-solid, var(--page-bg)))";
    if (r.tone === "warning") return "color-mix(in oklab, var(--warning) 38%, var(--surface-solid, var(--page-bg)))";
    if (r.tone === "success") return "color-mix(in oklab, var(--success) 34%, var(--surface-solid, var(--page-bg)))";
    if (r.tone === "neutral") return "color-mix(in oklab, var(--text-strong) 8%, var(--surface-solid, var(--page-bg)))";
    const t = max === min ? 0.5 : Math.min(1, Math.max(0, (r.value - min) / (max - min)));
    const pct = STEPS[Math.min(STEPS.length - 1, Math.floor(t * STEPS.length))];
    return `color-mix(in oklab, var(--primary) ${pct}%, var(--surface-solid, var(--page-bg)))`;
  };

  const onKey = (event: KeyboardEvent, id: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect?.(id);
    }
  };

  return (
    <figure className={cn("relative w-full", className)}>
      <div className="relative">
        <svg viewBox={viewBox} role="group" aria-label={title} aria-describedby={tableId} className="block h-auto w-full">
          <defs>
            <pattern id={patternId} width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" style={{ fill: "color-mix(in oklab, var(--text-strong) 16%, transparent)" }} />
            </pattern>
          </defs>
          <rect x={vx} y={vy} width={vw} height={vh} fill={`url(#${patternId})`} aria-hidden />
          {regions.map((r) => {
            const selected = r.id === selectedId;
            const interactive = !!onSelect;
            return (
              <g key={r.id}>
                <path
                  d={r.path}
                  fill={fill(r)}
                  stroke={selected ? "var(--text-strong)" : "var(--surface-solid, var(--page-bg))"}
                  strokeWidth={selected ? 2.5 : 1.5}
                  strokeLinejoin="round"
                  strokeDasharray={r.tone === "danger" ? "5 3" : undefined}
                  role={interactive ? "button" : "img"}
                  aria-label={`${r.label}: ${format(r.value)}${r.note ? `, ${r.note}` : ""}`}
                  aria-pressed={interactive ? selected : undefined}
                  tabIndex={interactive ? 0 : undefined}
                  onClick={interactive ? () => onSelect(r.id) : undefined}
                  onKeyDown={interactive ? (e) => onKey(e, r.id) : undefined}
                  onPointerEnter={(e) => e.pointerType === "mouse" && setHover(r.id)}
                  onPointerLeave={() => setHover((h) => (h === r.id ? null : h))}
                  onFocus={() => setHover(r.id)}
                  onBlur={() => setHover((h) => (h === r.id ? null : h))}
                  className={cn("outline-none transition-[stroke-width] duration-150", interactive && "cursor-pointer focus-visible:[stroke-width:3.5] focus-visible:[stroke:var(--line-focus)]")}
                />
                <text x={r.at[0]} y={r.at[1]} textAnchor="middle" aria-hidden className="pointer-events-none fill-strong text-micro font-semibold select-none">
                  {r.label}
                </text>
                {showValues ? (
                  <text x={r.at[0]} y={r.at[1] + 13} textAnchor="middle" aria-hidden className="pointer-events-none fill-body text-micro tabular-nums select-none">
                    {format(r.value)}
                  </text>
                ) : null}
              </g>
            );
          })}
          {markers.length ? (
            <g aria-hidden className="pointer-events-none">
              <style href="ui-region-map" precedence="default">
                {MARKER_CSS}
              </style>
              {markers.map((mk) => {
                const color = TONE_VAR[mk.tone ?? "neutral"];
                return (
                  <g key={mk.id}>
                    {mk.tone === "danger" ? <circle cx={mk.at[0]} cy={mk.at[1]} r="5" className="ui-map-pulse" style={{ fill: color }} /> : null}
                    <circle cx={mk.at[0]} cy={mk.at[1]} r="4.5" style={{ fill: color, stroke: "var(--surface-solid, var(--page-bg))" }} strokeWidth="2" />
                  </g>
                );
              })}
            </g>
          ) : null}
        </svg>

        {active ? (
          <div
            aria-hidden
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-strong px-2.5 py-1.5 text-small whitespace-nowrap text-page shadow-floating"
            style={{
              left: `${((active.at[0] - vx) / vw) * 100}%`,
              top: `${((active.at[1] - vy) / vh) * 100 - 4}%`,
            }}
          >
            <span className="font-semibold">{active.label}</span> · <span className="tabular-nums">{format(active.value)}</span>
            {active.note ? <span className="block text-micro opacity-80">{active.note}</span> : null}
          </div>
        ) : null}
      </div>

      {legendTones ? (
        <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-small text-muted">
          {legendTones.map((t) => (
            <span key={t.label} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-3 rounded-[3px]"
                style={{
                  background: fill({
                    id: "",
                    label: "",
                    path: "",
                    at: [0, 0],
                    value: 0,
                    tone: t.tone,
                  }),
                }}
              />
              {t.label}
            </span>
          ))}
          {markerLegend.map((t) => (
            <span key={t.label} className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: TONE_VAR[t.tone] }} />
              {t.label}
            </span>
          ))}
        </figcaption>
      ) : (
        <figcaption className="mt-3 flex items-center gap-2 text-micro text-muted">
          <span>{legend[0]}</span>
          <span
            aria-hidden
            className="h-2 flex-1 rounded-full"
            style={{
              backgroundImage: `linear-gradient(90deg, ${STEPS.map((p) => `color-mix(in oklab, var(--primary) ${p}%, var(--surface-solid, var(--page-bg)))`).join(", ")})`,
            }}
          />
          <span>{legend[1]}</span>
          <span className="sr-only">
            {" "}
            Ölçek {format(min)} ile {format(max)} arası.
          </span>
        </figcaption>
      )}

      <div className="sr-only">
        <table id={tableId}>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">Bölge</th>
              <th scope="col">Değer</th>
            </tr>
          </thead>
          <tbody>
            {regions.map((r) => (
              <tr key={r.id}>
                <th scope="row">{r.label}</th>
                <td>
                  {format(r.value)}
                  {r.note ? `, ${r.note}` : ""}
                  {r.tone === "danger" ? ", eşik aşıldı" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {markers.length ? (
          <ul aria-label={markerLabel}>
            {markers.map((mk) => (
              <li key={mk.id}>{mk.label}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </figure>
  );
}
