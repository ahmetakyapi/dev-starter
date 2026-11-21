// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { useId, useState, type KeyboardEvent } from "react";
import { cn } from "../utils";

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
  className?: string;
};

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
  className,
}: RegionMapProps) {
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
                  className={cn(
                    "outline-none transition-[stroke-width] duration-150",
                    interactive && "cursor-pointer focus-visible:[stroke-width:3.5] focus-visible:[stroke:var(--line-focus)]",
                  )}
                />
                <text x={r.at[0]} y={r.at[1]} textAnchor="middle" aria-hidden className="pointer-events-none fill-strong text-[11px] font-semibold select-none">
                  {r.label}
                </text>
              </g>
            );
          })}
        </svg>

        {active ? (
          <div
            aria-hidden
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-strong px-2.5 py-1.5 text-small whitespace-nowrap text-page shadow-floating"
            style={{ left: `${((active.at[0] - vx) / vw) * 100}%`, top: `${((active.at[1] - vy) / vh) * 100 - 4}%` }}
          >
            <span className="font-semibold">{active.label}</span> · <span className="tabular-nums">{format(active.value)}</span>
            {active.note ? <span className="block text-micro opacity-80">{active.note}</span> : null}
          </div>
        ) : null}
      </div>

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
      </div>
    </figure>
  );
}
