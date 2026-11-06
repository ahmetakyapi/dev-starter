// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { CSSProperties } from "react";
import { cn } from "../utils";

/**
 * Düşünme küresi: asistanın durumunu gösteren canlı küre. Sesli asistan
 * ekranı, sohbetin boş durumu, ajan kartının avatarı. Üç hal:
 *
 *   - `idle`: yavaş, sönük döner; asistan hazır, bekliyor.
 *   - `thinking`: hızlanır, nefes alır; yanıt hazırlanıyor.
 *   - `speaking`: `level` (0-1, ses düzeyi) küreyi o an büyütür; sesli yanıt.
 *
 * İÇİNDE ÜÇ LEKE: paletin birincil ailesi (`--primary`, `--primary-hover`,
 * `--primary-soft`) bulanık lekeler halinde, farklı hızlarda döner; üstte
 * yumuşak bir ışık lekesi cama derinlik verir. Renk paletle döner, tek aile.
 * Gölge yok: küre zeminden ton farkıyla ayrılır.
 *
 * Bilgi küre değil METİN: `label` verilirse `role="status"` + gizli metin
 * ("Asistan düşünüyor"); hal değişince okunur. Küre tek başına süstür
 * (`aria-hidden`). Hareketi azaltan kullanıcıda lekeler durur, hal yine
 * opaklık ve boyla ayrışır. Sunucu bileşeni: yalnız CSS.
 *
 *   <ThinkingOrb state="thinking" size={96} label="Asistan düşünüyor" />
 */

const CSS = `
@keyframes ui-orb-spin { to { rotate: 360deg; } }
@keyframes ui-orb-breathe { 0%, 100% { scale: 1; } 50% { scale: 1.06; } }
.ui-orb { position: relative; display: inline-block; flex-shrink: 0; border-radius: 9999px; overflow: hidden;
  background: color-mix(in oklab, var(--primary) 18%, var(--surface)); isolation: isolate;
  transition: scale 0.18s var(--ease-brand), opacity 0.4s var(--ease-brand); }
.ui-orb-blob { position: absolute; border-radius: 9999px; filter: blur(calc(var(--orb-size) * 0.12)); mix-blend-mode: normal;
  animation: ui-orb-spin var(--orb-speed) linear infinite; transform-origin: 50% 50%; }
.ui-orb-blob:nth-child(1) { inset: -10% 30% 35% -15%; background: var(--primary); }
.ui-orb-blob:nth-child(2) { inset: 35% -20% -10% 25%; background: var(--primary-hover); animation-duration: calc(var(--orb-speed) * 1.6); animation-direction: reverse; }
.ui-orb-blob:nth-child(3) { inset: 20% 10% 10% 15%; background: var(--primary-soft); opacity: 0.85; animation-duration: calc(var(--orb-speed) * 2.3); }
.ui-orb::after { content: ""; position: absolute; inset: 8% 22% 52% 18%; border-radius: 9999px;
  background: radial-gradient(closest-side, color-mix(in oklab, white 55%, transparent), transparent); }
.ui-orb[data-state="idle"] { opacity: 0.72; --orb-speed: 14s; }
.ui-orb[data-state="thinking"] { --orb-speed: 4s; animation: ui-orb-breathe 1.8s var(--ease-brand) infinite; }
.ui-orb[data-state="speaking"] { --orb-speed: 6s; scale: calc(1 + var(--orb-level) * 0.14); }
@media (prefers-reduced-motion: reduce) {
  .ui-orb, .ui-orb-blob { animation: none !important; }
  .ui-orb[data-state="speaking"] { scale: 1; }
}`;

export type OrbState = "idle" | "thinking" | "speaking";

type ThinkingOrbProps = {
  state?: OrbState;
  /** Piksel. 24 (satır içi) · 48 (avatar) · 96-160 (sesli asistan ekranı). */
  size?: number;
  /** `speaking` halinde anlık ses düzeyi, 0-1. Saniyede birkaç kez güncellemek yeter. */
  level?: number;
  /** Verilirse `role="status"` ile okunur ("Asistan düşünüyor"). */
  label?: string;
  className?: string;
};

export function ThinkingOrb({ state = "idle", size = 48, level = 0, label, className }: ThinkingOrbProps) {
  const orb = (
    <span
      aria-hidden
      data-state={state}
      className={cn("ui-orb", className)}
      style={
        {
          width: size,
          height: size,
          "--orb-size": `${size}px`,
          "--orb-level": Math.min(1, Math.max(0, level)),
        } as CSSProperties
      }
    >
      <span className="ui-orb-blob" />
      <span className="ui-orb-blob" />
      <span className="ui-orb-blob" />
    </span>
  );

  return (
    <>
      <style href="ui-thinking-orb" precedence="default">
        {CSS}
      </style>
      {label ? (
        <span role="status" className="inline-flex">
          {orb}
          <span className="sr-only">{label}</span>
        </span>
      ) : (
        orb
      )}
    </>
  );
}
