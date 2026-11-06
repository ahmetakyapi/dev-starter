import type { ComponentType, CSSProperties, SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Canlı ikon: lucide ikonu, sahibi olan düğmenin ya da kartın üzerine
 * gelince (ve klavye odağında) anlamına uygun küçük bir hareket yapar.
 * Zil sallanır, ok dürter, yenile döner, kalp atar. Hareket İKONUN
 * ANLAMINI söyler; her ikona aynı zıplamayı verme.
 *
 * TETİK `group`: en yakın `.group` öğesi (düğme, bağlantı, kart) üzerine
 * gelinince ya da `:focus-visible` olunca. Düğmeye `group` sınıfı ver.
 * `self`: ikonun kendi üstüne gelince. `always`: süren durumda (yenileniyor)
 * sürekli; `loop` ile yalnız `spin` ve `ring` mantıklı.
 *
 * Üzerine gelme yalnız ince işaretçide (`hover: hover`): dokunmatikte ilk
 * dokunuş takılı kalan bir hover bırakmasın. Süreler 450-650 ms, eğri
 * `--ease-brand`; `pop` 1,18'e büyür, 0'dan değil.
 *
 * İkon her zaman `aria-hidden` (adı düğmenin). Hareketi azaltan kullanıcıda
 * hiç oynamaz. Sunucu bileşeni: yalnız CSS.
 *
 *   <button className="group …"><AnimatedIcon icon={Bell} motion="ring" /> Bildirimler</button>
 */

const CSS = `
@keyframes ui-ai-nudge { 0%, 100% { translate: 0 0; } 45% { translate: 3px 0; } }
@keyframes ui-ai-bounce { 0%, 100% { translate: 0 0; } 40% { translate: 0 -3px; } 70% { translate: 0 1px; } }
@keyframes ui-ai-ring { 0%, 100% { rotate: 0deg; } 15% { rotate: 14deg; } 35% { rotate: -11deg; } 55% { rotate: 7deg; } 75% { rotate: -3deg; } }
@keyframes ui-ai-wiggle { 0%, 100% { rotate: 0deg; } 25% { rotate: -8deg; } 75% { rotate: 8deg; } }
@keyframes ui-ai-spin { from { rotate: 0deg; } to { rotate: 360deg; } }
@keyframes ui-ai-pop { 0%, 100% { scale: 1; } 40% { scale: 1.18; } 70% { scale: 0.96; } }
.ui-ai { flex-shrink: 0; }
.ui-ai[data-motion="ring"] { transform-origin: 50% 8%; }
.ui-ai[data-run="always"] { animation: var(--ai-anim) var(--ai-dur) var(--ai-ease) var(--ai-count); }
@media (hover: hover) {
  .group:hover .ui-ai[data-run="group"], .ui-ai[data-run="self"]:hover { animation: var(--ai-anim) var(--ai-dur) var(--ai-ease) var(--ai-count); }
}
.group:focus-visible .ui-ai[data-run="group"] { animation: var(--ai-anim) var(--ai-dur) var(--ai-ease) var(--ai-count); }
@media (prefers-reduced-motion: reduce) { .ui-ai { animation: none !important; } }`;

const MOTIONS = {
  nudge: { anim: "ui-ai-nudge", dur: "0.45s" },
  bounce: { anim: "ui-ai-bounce", dur: "0.5s" },
  ring: { anim: "ui-ai-ring", dur: "0.65s" },
  wiggle: { anim: "ui-ai-wiggle", dur: "0.45s" },
  spin: { anim: "ui-ai-spin", dur: "0.6s" },
  pop: { anim: "ui-ai-pop", dur: "0.45s" },
} as const;

export type IconMotion = keyof typeof MOTIONS;

type AnimatedIconProps = {
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>;
  motion: IconMotion;
  trigger?: "group" | "self" | "always";
  /** Yalnız `trigger="always"` ile: sonsuz döngü (yenileniyor, çalıyor). */
  loop?: boolean;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export function AnimatedIcon({
  icon: Icon,
  motion,
  trigger = "group",
  loop = false,
  size = 18,
  strokeWidth = 2,
  className,
}: AnimatedIconProps) {
  const m = MOTIONS[motion];
  const linear = motion === "spin" && loop;
  return (
    <>
      <style href="ui-animated-icon" precedence="default">
        {CSS}
      </style>
      <Icon
        aria-hidden
        data-motion={motion}
        data-run={trigger}
        size={size}
        strokeWidth={strokeWidth}
        className={cn("ui-ai", className)}
        style={
          {
            "--ai-anim": m.anim,
            "--ai-dur": linear ? "1s" : m.dur,
            "--ai-ease": linear ? "linear" : "var(--ease-brand)",
            "--ai-count": trigger === "always" && loop ? "infinite" : "1",
          } as CSSProperties
        }
      />
    </>
  );
}
