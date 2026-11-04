"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type WheelEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * Saat cetveli: saati bir cetvelin üstünde kaydırarak seç. Ortadaki ibre
 * sabit, cetvel altından akar; seçilen saat üstte büyük puntoda. Günün
 * akışında bir an seçerken (hatırlatma, günlük özet, sessiz saat başlangıcı)
 * yazılan `time-field`dan daha hızlı ve aralığı gösterir: 06.00 ile 22.00
 * arasında neredesin, bir bakışta.
 *
 * Kesin bir saat YAZILACAKSA (randevu formu, 14.37) `time-field`: cetvel
 * `step` dakikalık dilimlere oturur (varsayılan 15).
 *
 * DENETİM `role="slider"`: ← → bir dilim, PageUp/PageDown bir saat,
 * Home/End uçlar; değer metni "09.30" (Türkçe saat yazımı, nokta).
 * Sürükleme işaretçiyi yakalar (`setPointerCapture`), tekerlek ve
 * dokunmatik yatay kaydırma da çalışır. Bırakınca en yakın dilime oturur.
 *
 * HAREKET: cetvel `translate` ile kayar, sürüklerken geçiş yok (parmağın
 * altında durur), bırakınca 200 ms ile oturur. Hareketi azaltanda geçiş
 * yok; konum yine anında güncellenir.
 *
 *   <TimeScrubber label="Günlük Özet Saati" value={570} onValueChange={setMinutes} />
 */

const PX = 14; // bir dilimin genişliği
const pad = (n: number) => String(n).padStart(2, "0");
export const formatClock = (minutes: number) => `${pad(Math.floor(minutes / 60))}.${pad(minutes % 60)}`;

type TimeScrubberProps = {
  label: string;
  /** Gece yarısından beri dakika (09.30 = 570). */
  value: number;
  onValueChange: (minutes: number) => void;
  /** Dilim, dakika. */
  step?: number;
  min?: number;
  max?: number;
  /** Saatin altında küçük not: "Hafta içi her gün". */
  hint?: string;
  className?: string;
};

export function TimeScrubber({ label, value, onValueChange, step = 15, min = 6 * 60, max = 22 * 60, hint, className }: TimeScrubberProps) {
  const [drag, setDrag] = useState<{ x: number; from: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const wheel = useRef(0);

  const clamp = (m: number) => Math.min(max, Math.max(min, Math.round(m / step) * step));
  const steps = Math.floor((max - min) / step);
  const index = (value - min) / step;
  const shift = -(index * PX) + offset;

  function set(next: number) {
    const c = clamp(next);
    if (c !== value) onValueChange(c);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const map: Record<string, number> = {
      ArrowRight: step,
      ArrowUp: step,
      ArrowLeft: -step,
      ArrowDown: -step,
      PageUp: 60,
      PageDown: -60,
    };
    if (event.key === "Home") set(min);
    else if (event.key === "End") set(max);
    else if (map[event.key] !== undefined) set(value + map[event.key]);
    else return;
    event.preventDefault();
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ x: event.clientX, from: value });
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const target = clamp(drag.from - (dx / PX) * step);
    // Parmağın altında kalsın: dilime oturmamış artığı piksel olarak tut.
    const exact = drag.from - (dx / PX) * step;
    const rest = ((target - exact) / step) * PX;
    setOffset(target === min || target === max ? 0 : rest);
    if (target !== value) onValueChange(target);
  }

  function onPointerUp() {
    setDrag(null);
    setOffset(0);
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    wheel.current += Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(wheel.current) < PX) return;
    set(value + Math.sign(wheel.current) * step);
    wheel.current = 0;
  }

  const fade = "linear-gradient(90deg, transparent, currentColor 22%, currentColor 78%, transparent)";

  return (
    <div className={cn("grid justify-items-center gap-1 select-none", className)}>
      <p aria-hidden className="flex items-baseline gap-2">
        <span className="text-display font-semibold text-strong tabular-nums">{formatClock(value)}</span>
      </p>
      {hint ? <p className="text-small text-muted">{hint}</p> : null}
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={formatClock(value)}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        className={cn("relative mt-3 h-16 w-full max-w-80 touch-pan-y overflow-hidden rounded-md outline-offset-4", drag ? "cursor-grabbing" : "cursor-grab")}
      >
        <div className="absolute inset-0" style={{ maskImage: fade, WebkitMaskImage: fade }}>
          <div
            className={cn("absolute top-1 flex h-full", !drag && "transition-[translate] duration-200 ease-(--ease-brand)")}
            style={{ left: `calc(50% - ${PX / 2}px)`, translate: `${shift}px 0` } as CSSProperties}
          >
            {Array.from({ length: steps + 1 }, (_, i) => {
              const minutes = min + i * step;
              const hour = minutes % 60 === 0;
              const half = minutes % 30 === 0;
              return (
                <span key={minutes} className="relative flex shrink-0 justify-center" style={{ width: PX }}>
                  <span className={cn("w-px rounded-full", hour ? "h-6 bg-strong" : half ? "h-4 bg-line-strong" : "h-2.5 bg-line-strong")} />
                  {hour ? (
                    <span className="absolute top-8 text-micro font-medium whitespace-nowrap text-muted tabular-nums">{pad(minutes / 60)}.00</span>
                  ) : null}
                </span>
              );
            })}
          </div>
        </div>
        <span aria-hidden className="absolute top-0 left-1/2 h-8 w-0.5 -translate-x-1/2 rounded-full bg-primary" />
      </div>
    </div>
  );
}
