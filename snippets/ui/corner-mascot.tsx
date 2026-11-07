"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DUR, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Köşe maskotu: sağ altta duran, gözleri imleci izleyen, ara sıra göz
 * kırpan küçük bir yüz. Dokununca kısa bir balon konuşur. Ribbon'ın sayfa
 * boyunca köşede bekleyen maskotu, ciddi bir araç sitesine sıcaklık katan
 * tek oyunbaz öğe. Markanın kişiliği olan tanıtım sayfası için; uygulama
 * içinde, form akışında ve ödeme sayfasında KULLANMA (dikkat dağıtır,
 * düğmelerin üstüne biner).
 *
 * YÜZ: iki yuvarlak pencere, içlerinde göz bebekleri ve iki yanak; token'la
 * çizilir, paletle döner. Markanın kendi maskotu varsa `face` ile ver;
 * göz takibi yalnız yerleşik yüzde çalışır.
 *
 * DAVRANIŞ:
 *   - Göz takibi `pointermove` + `requestAnimationFrame` (karede bir ölçüm),
 *     bebekler en çok 2,5 px kayar. Dokunmatikte ve hareketi azaltanda yok.
 *   - Göz kırpma CSS animasyonu, 5,2 s'de bir; hareketi azaltanda yok.
 *   - Balon `role="status"`: söylediği ekran okuyucuya da ulaşır. 3,2 s sonra
 *     kapanır; her dokunuşta sıradaki mesaj.
 *   - Düğme 76 px (telefonda 64), sayfanın sağ alt köşesinde; çerez bandı
 *     ya da sohbet balonu aynı köşedeyse `className` ile kaydır.
 *
 *   <CornerMascot messages={["Merhaba!", "Fiyatlar aşağıda.", "Demoyu denedin mi?"]} />
 */

type CornerMascotProps = {
  messages?: readonly string[];
  /** Düğmenin erişilebilir adı. */
  label?: string;
  /** Yerleşik yüz yerine markanın maskotu (göz takibi olmaz). */
  face?: ReactNode;
  className?: string;
};

const CSS = `
@keyframes ui-mascot-blink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
.ui-mascot-eye { transform-box: fill-box; transform-origin: center; animation: ui-mascot-blink 5.2s infinite; }
.ui-mascot-eye + .ui-mascot-eye { animation-delay: 40ms; }
@media (prefers-reduced-motion: reduce) { .ui-mascot-eye { animation: none; } }`;

function Face({ look }: { look: { x: number; y: number } }) {
  const eye = (cx: number, cy: number) => (
    <g className="ui-mascot-eye">
      <circle cx={cx + look.x} cy={cy + look.y} r={5} className="fill-strong" />
      <circle cx={cx + look.x + 1.7} cy={cy + look.y - 1.7} r={1.6} className="fill-overlay" />
    </g>
  );
  const dots = (x: number, y: number) => (
    <>
      <circle cx={x} cy={y} r={1.5} className="fill-danger" />
      <circle cx={x + 4.5} cy={y} r={1.5} className="fill-warning" />
      <circle cx={x + 9} cy={y} r={1.5} className="fill-success" />
    </>
  );
  return (
    <svg viewBox="0 0 64 48" aria-hidden className="w-[86%] overflow-visible">
      {/* İki küçük pencere, hafif eğik: biri sola, biri sağa yatık. */}
      <g transform="rotate(-6 17 25)">
        <rect x="4" y="8" width="26" height="33" rx="8" className="fill-overlay stroke-line-strong" strokeWidth={1.2} />
        {dots(9.5, 13.5)}
      </g>
      <g transform="rotate(6 47 24)">
        <rect x="34" y="6" width="26" height="34" rx="8" className="fill-overlay stroke-line-strong" strokeWidth={1.2} />
        {dots(39.5, 11.5)}
      </g>
      {eye(17, 27)}
      {eye(47, 25)}
      <ellipse cx="9" cy="36" rx="3.6" ry="1.9" className="fill-primary opacity-35" />
      <ellipse cx="55" cy="34" rx="3.6" ry="1.9" className="fill-primary opacity-35" />
      <path d="M27.5 40 q4.5 3.6 9 0" fill="none" strokeWidth={1.8} strokeLinecap="round" className="stroke-strong" />
    </svg>
  );
}

export function CornerMascot({
  messages = ["Merhaba!", "Bir şey sormak istersen buradayım."],
  label = "Maskota merhaba de",
  face,
  className,
}: CornerMascotProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [say, setSay] = useState<string | null>(null);
  const turn = useRef(0);

  useEffect(() => {
    if (face || reduce || !window.matchMedia("(pointer: fine)").matches) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const box = ref.current?.getBoundingClientRect();
        if (!box) return;
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        const dist = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, dist / 240) * 2.5;
        setLook({ x: (dx / dist) * reach, y: (dy / dist) * reach });
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [face, reduce]);

  useEffect(() => {
    if (!say) return;
    const t = window.setTimeout(() => setSay(null), 3200);
    return () => window.clearTimeout(t);
  }, [say]);

  function greet() {
    if (!messages.length) return;
    setSay(messages[turn.current % messages.length]);
    turn.current += 1;
  }

  return (
    <div className={cn("pointer-events-none fixed right-4 bottom-4 z-30 sm:right-6 sm:bottom-6", className)}>
      <style href="ui-corner-mascot" precedence="default">
        {CSS}
      </style>
      <div className="pointer-events-auto relative flex flex-col items-end gap-2">
        <div role="status" className="absolute right-0 bottom-full mb-2">
          <AnimatePresence>
            {say ? (
              <m.p
                key={say}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.base, ease: EASE }}
                className="w-max max-w-56 origin-bottom-right rounded-2xl rounded-br-md bg-overlay px-3.5 py-2 text-small font-medium text-strong shadow-floating ring-1 ring-line"
              >
                {say}
              </m.p>
            ) : null}
          </AnimatePresence>
        </div>
        <button
          ref={ref}
          type="button"
          aria-label={label}
          onClick={greet}
          className="grid size-16 place-items-center rounded-[1.25rem] bg-overlay/75 shadow-floating ring-2 ring-overlay backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 sm:size-[4.75rem] sm:rounded-[1.35rem]"
        >
          {face ?? <Face look={look} />}
        </button>
      </div>
    </div>
  );
}
