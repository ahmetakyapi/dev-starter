// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { ReactNode } from "react";
import { cn } from "../utils";

/**
 * Çentikli süre/iş çubuğu: "tahmin ve harcanan" ya da "kaç görev bitti" gibi
 * BİRİMİ SAYILABİLEN işin gidişatı. Her çentik bir birim (gün, görev); göz
 * satırları çentik sayarak karşılaştırır, çubuk uzunluğunu kestirmez. Pano
 * ölçü karolarında ve tablodaki "harcanan / tahmin" sütununda kullanılır.
 *
 * `meter.tsx` `look="ticks"` ile farkı: o bir DOLULUK ölçer (kota, depolama),
 * eşikle renk değiştirir. Bu ise bir İŞİN gidişatı: tahmini AŞAN kısım ayrı
 * renkle çentik olarak uzar (`over`, `danger`), henüz tahmine girmemiş ama
 * planlanan iş çizgili çentik olarak sona eklenir (`planned`), istenirse bir
 * eşik işaretçisi (`marker`, ör. ekip yükünde %95) çubuğun üstünden geçer.
 *
 * Sırası: dolu (primary) · kalan (iz) · aşan (danger, yalnız `value > max`) ·
 * planlanan (çizgili). Aşım yalnız renkle söylenmez: `valueText` ("9 / 6 gün,
 * 3 gün aştı") ekran okuyucuya gider ve görünen metin `danger` tonunda.
 *
 * ÇENTİK SAYISI: varsayılan `max` (üst sınır 40; `ticks` verilirse en çok 60);
 * `max` büyükse çentik `max`a oranlanır (1 çentik = birden çok birim).
 * Aşan ve planlanan çentikler de en çok `ticks` kadardır (1e6 gibi bir
 * değer tarayıcıyı dondurmaz). Sayı olmayan (`NaN`, `Infinity`) girdi 0
 * sayılır, sayfa çökmez. Dar karoda `ticks` ile azalt. Eşik işaretçisi
 * (`marker`) varsayılan okunan cümleye de yazılır ("eşik %95").
 *
 * Sunucu bileşeni, SVG yok. `role="meter"`; ad `label` ile verilir (görünmez).
 *
 *   <TickMeter label="Biten Görev" value={31} max={50} text="%62" valueText="31 / 50 görev, %62" />
 *   <TickMeter label="iOS Ödeme" value={9} max={6} planned={2} text="9 / 6g" />
 */

export type TickMeterProps = {
  /** Ekran okuyucu adı: "Biten Görev". Görünmez. */
  label: string;
  value: number;
  /** Tahmin (üst sınır), `value > max` ise aşım vardır. */
  max: number;
  /** Tahmine girmemiş ama planlanan ek birim: çizgili çentik. */
  planned?: number;
  /** Çentik sayısı; verilmezse `max` (en çok 40). */
  ticks?: number;
  /** 0–1: çubuğun üstünden geçen dikey işaretçi (eşik, hedef). */
  marker?: number;
  /** Sağdaki görünen metin (mono): "%62", "9 / 6g". Verilmezse "value / max". */
  text?: ReactNode;
  /** Ekran okuyucuya okunan tam cümle; verilmezse "value / max". */
  valueText?: string;
  size?: "sm" | "md";
  className?: string;
};

export function TickMeter({
  label,
  value,
  max,
  planned = 0,
  ticks,
  marker,
  text,
  valueText,
  size = "sm",
  className,
}: TickMeterProps) {
  const num = (n: number, fallback = 0) => (Number.isFinite(n) ? n : fallback);
  const val = Math.max(num(value), 0);
  const cap = Math.max(num(max, 1), 1);
  const plan = Math.max(num(planned), 0);
  const base = Math.max(1, Math.min(Math.round(num(ticks ?? Math.min(cap, 40), 1)), 60));
  const scale = base / cap;
  const over = Math.max(0, val - cap);
  // %99,9 dolu çubuk tam dolu görünmesin: eşiğe varmadıkça son çentik boş kalır.
  const filled = val >= cap ? base : Math.min(Math.round(val * scale), Math.max(base - 1, 0));
  const overTicks = over > 0 ? Math.min(Math.max(1, Math.round(over * scale)), base) : 0;
  const rest = over > 0 ? 0 : Math.max(0, base - filled);
  const plannedTicks = plan > 0 ? Math.min(Math.max(1, Math.round(plan * scale)), base) : 0;
  const total = filled + rest + overTicks + plannedTicks;

  const cells: ("fill" | "rest" | "over" | "plan")[] = [
    ...Array<"fill">(filled).fill("fill"),
    ...Array<"rest">(rest).fill("rest"),
    ...Array<"over">(overTicks).fill("over"),
    ...Array<"plan">(plannedTicks).fill("plan"),
  ];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={Math.max(cap, val)}
        aria-valuenow={val}
        aria-valuetext={
          valueText ??
          `${val} / ${cap}${over > 0 ? `, ${over} fazla` : ""}${marker !== undefined && Number.isFinite(marker) ? `, eşik %${Math.round(Math.min(Math.max(marker, 0), 1) * 100)}` : ""}`
        }
        className={cn("relative flex min-w-0 flex-1 items-stretch gap-[2px]", size === "md" ? "h-4" : "h-3")}
      >
        {cells.map((kind, i) => (
          <span
            key={i}
            aria-hidden
            className={cn(
              "min-w-px flex-1 rounded-[1px]",
              kind === "fill" && "bg-primary",
              kind === "rest" && "bg-chart-track",
              kind === "over" && "bg-danger",
              kind === "plan" && "tick-meter-plan",
            )}
          />
        ))}
        {marker !== undefined && Number.isFinite(marker) && total > 0 ? (
          <span
            aria-hidden
            className="pointer-events-none absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 rounded-full bg-strong"
            style={{ left: `${Math.min(Math.max(marker, 0), 1) * 100}%` }}
          />
        ) : null}
      </div>
      <span
        aria-hidden
        className={cn("shrink-0 font-mono text-micro tabular-nums", over > 0 ? "text-danger" : "text-muted")}
      >
        {text ?? `${val} / ${cap}`}
      </span>
      <style href="ui-tick-meter" precedence="default">{`
        .tick-meter-plan{background:repeating-linear-gradient(135deg,var(--text-muted) 0 1px,transparent 1px 3px);opacity:.7}
      `}</style>
    </div>
  );
}
