// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { DigitRoll } from "./digit-roll";
import { cn } from "../utils";

/**
 * Döner düğme: dairesel kadranda sürekli değer. Ses düzeyi, sıcaklık,
 * yoğunluk, karışım oranı: elle "biraz daha" ayarlanan, kesin rakamdan çok
 * hissin önemli olduğu değer. Kesin küçük sayıda `number-field`, düz
 * aralıkta `slider` daha hızlıdır; kadran, birkaç ayarın yan yana durduğu
 * kontrol panelinde (stüdyo, kahve makinesi, aydınlatma) yer kazandırır.
 *
 * KADRAN 270°: -135°'ten +135°'e çentikler, değer yayı birincil renkte
 * dolar, düğme gövdesi beyaz karo ve üstündeki işaret değeri gösterir.
 * Ortada değer `digit-roll` ile: yalnız değişen rakam yuvarlanır.
 *
 * SÜRÜKLEME DOĞRUSAL: yukarı ya da sağa çekmek artırır (müzik
 * yazılımlarının alışkanlığı); daire çizmek gerekmez. 160 piksel tüm aralık,
 * Shift ile on kat ince. Tekerlek yalnız düğme ODAKTAYKEN çalışır: sayfayı
 * kaydıran kullanıcının değeri yanlışlıkla değişmesin.
 *
 * KLAVYE (`role="slider"`): ← ↓ azaltır, → ↑ artırır, PageUp/PageDown on
 * adım, Home/End uçlar. `aria-valuetext` birimle ("22 °C"). Dokunmatikte
 * 44 pikselden büyük; `touch-action: none` yalnız kadranın üstünde.
 *
 *   <Dial label="Sıcaklık" min={16} max={30} defaultValue={22} unit="°C" />
 */

const SWEEP = 135;
const TICKS = 28;
const DRAG_RANGE_PX = 160;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function polar(c: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: c + r * Math.sin(a), y: c - r * Math.cos(a) };
}

type DialProps = {
  label: string;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  format?: Intl.NumberFormatOptions;
  /** Piksel. 112-160 arası. */
  size?: number;
  disabled?: boolean;
  className?: string;
};

export function Dial({
  label,
  value: controlled,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  format,
  size = 136,
  disabled = false,
  className,
}: DialProps) {
  const labelId = useId();
  const knob = useRef<HTMLDivElement>(null);
  const [own, setOwn] = useState(defaultValue ?? min);
  const value = clamp(controlled ?? own, min, max);
  const drag = useRef<{ x: number; y: number; from: number } | null>(null);
  const latest = useRef({ value, set: (_: number) => {} });

  const snap = (v: number) => clamp(Math.round((v - min) / step) * step + min, min, max);
  function set(next: number) {
    const v = Number(snap(next).toFixed(6));
    if (v === value) return;
    if (controlled === undefined) setOwn(v);
    onValueChange?.(v);
  }
  latest.current = { value, set };

  // Tekerlek: yalnız odaktayken ve `passive: false` (React'in onWheel'i pasif, sayfayı durduramaz).
  useEffect(() => {
    const el = knob.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (document.activeElement !== el) return;
      event.preventDefault();
      latest.current.set(latest.current.value + (event.deltaY < 0 ? step : -step));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [step]);

  const ratio = (value - min) / (max - min || 1);
  const angle = -SWEEP + ratio * SWEEP * 2;
  const c = size / 2;
  const rTrack = c - 11;
  const start = polar(c, rTrack, -SWEEP);
  const end = polar(c, rTrack, SWEEP);
  const arc = `M ${start.x} ${start.y} A ${rTrack} ${rTrack} 0 1 1 ${end.x} ${end.y}`;
  const text = new Intl.NumberFormat("tr-TR", format).format(value);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const big = step * 10;
    const map: Record<string, number> = {
      ArrowUp: value + step,
      ArrowRight: value + step,
      ArrowDown: value - step,
      ArrowLeft: value - step,
      PageUp: value + big,
      PageDown: value - big,
      Home: min,
      End: max,
    };
    if (!(event.key in map)) return;
    event.preventDefault();
    set(map[event.key]);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, from: value };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const px = event.clientX - d.x + (d.y - event.clientY);
    const fine = event.shiftKey ? 0.1 : 1;
    set(d.from + (px / DRAG_RANGE_PX) * (max - min) * fine);
  }

  return (
    <div className={cn("inline-grid justify-items-center gap-2", disabled && "opacity-50", className)}>
      <span id={labelId} className="text-small font-medium text-body">
        {label}
      </span>
      <div
        ref={knob}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-labelledby={labelId}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={unit ? `${text} ${unit}` : text}
        aria-disabled={disabled || undefined}
        onKeyDown={disabled ? undefined : onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        className="relative cursor-grab touch-none rounded-full select-none active:cursor-grabbing"
        style={{ width: size, height: size }}
      >
        <svg aria-hidden width={size} height={size} className="absolute inset-0">
          {Array.from({ length: TICKS }, (_, i) => {
            const deg = -SWEEP + (i / (TICKS - 1)) * SWEEP * 2;
            const lit = deg <= angle + 0.01;
            const a = polar(c, c - 1, deg);
            const b = polar(c, c - (i % 3 === 0 ? 6 : 3.5), deg);
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                strokeWidth={1.5}
                strokeLinecap="round"
                className={lit ? "stroke-primary" : "stroke-line-strong"}
              />
            );
          })}
          <path d={arc} fill="none" strokeWidth={3} strokeLinecap="round" className="stroke-chart-track" pathLength={100} />
          <path
            d={arc}
            fill="none"
            strokeWidth={3}
            strokeLinecap="round"
            className="stroke-primary transition-[stroke-dasharray] duration-150"
            pathLength={100}
            strokeDasharray={`${ratio * 100} 100`}
          />
        </svg>
        <div
          aria-hidden
          className="absolute rounded-full bg-overlay shadow-raised transition-[rotate] duration-150"
          style={{ inset: size * 0.19, rotate: `${angle}deg` }}
        >
          <span className="absolute top-[9%] left-1/2 h-[14%] w-1 -translate-x-1/2 rounded-full bg-primary" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <DigitRoll value={value} format={format} className="text-title font-semibold tracking-tight text-strong" />
          {unit ? <span className="text-micro text-muted">{unit}</span> : null}
        </div>
      </div>
    </div>
  );
}
