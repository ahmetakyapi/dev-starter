// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import {
  animate,
  m,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  type AnimationPlaybackControls,
} from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { DigitRoll } from "./digit-roll";
import { cn } from "../utils";

/**
 * Cetvel seçici: değer, ortadaki sabit göstergenin altından kayan bir
 * cetvelle seçilir (saat, süre, sıcaklık, kilo). Değer büyük ve sakin
 * yukarıda, birimi yanında sönük; altta büyük çentiklerin etiketleri.
 *
 * NE ZAMAN: değer bir sürekliliğin üstünde ve kullanıcı "aşağı yukarı
 * şurası" diye arıyor (toplantı saati, termostat). Kesin sayı yazılacaksa
 * `number-field`, iki uçlu aralık ya da formda kısa alan `slider`, saat
 * yazılacaksa `time-field`. Çentik sayısı ~500'ü geçmesin (hepsi DOM'da).
 *
 * ÜÇ GİRDİ, TEK KAYNAK: sürükleme, yatay tekerlek (dokunmatik yüzey ya da
 * Shift + tekerlek) ve klavye aynı hareket değerini (`x`) sürer; değer
 * ondan türer. Bırakınca hıza göre biraz daha kayar, en yakın adıma YAYLA
 * oturur. Uçta lastik gibi direnir, geri döner. Dikey tekerlek sayfada
 * kalır; dokunmada `pan-y` ile dikey kaydırma sayfanındır.
 *
 * ERİŞİLEBİLİRLİK: kap `role="slider"`; `aria-valuenow`, `aria-valuetext`
 * ("09:45" değil "09.45" okunmasın diye `valueText` ile özelleşir). Oklar
 * bir adım, PageUp/PageDown bir büyük çentik, Home/End uçlar. Klavyede
 * değer HEMEN kesinleşir (ekran okuyucu ara değerleri duymaz), cetvel
 * arkadan kayar. Odak halkası kabın kendisinde (maske iç katmanda; maske
 * halkayı da sildirirdi).
 *
 * HAREKET: hareketi azaltan kullanıcıda cetvel kaymaz, adıma atlar; büyük
 * sayı yerinde değişir (`digit-roll`). Kenarlar alfa maskesiyle söner,
 * renk değil: zemin ne olursa olsun çalışır.
 *
 *   <TickRuler label="Toplantı Saati" min={480} max={1200} step={15}
 *     majorEvery={4} defaultValue={585} format={hhmm} />
 */

type TickRulerProps = {
  /** Title Case ad: "Toplantı Saati". */
  label: string;
  min: number;
  max: number;
  step?: number;
  /** Kaç adımda bir büyük çentik (ve PageUp/PageDown adımı). */
  majorEvery?: number;
  /** Kaç adımda bir etiket; verilmezse her büyük çentikte. */
  labelEvery?: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Büyük değerin metni. Varsayılan `tr-TR` sayı. */
  format?: (value: number) => string;
  /** Çentik etiketi; verilmezse `format`. */
  formatTick?: (value: number) => string;
  /** Ekran okuyucunun okuyacağı değer; verilmezse `format` + birim. */
  valueText?: (value: number) => string;
  /** Sönük birim: "°C", "kg". */
  unit?: string;
  /** İki adım arası piksel. */
  spacing?: number;
  className?: string;
};

const number = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });
const SETTLE = { type: "spring", stiffness: 320, damping: 32 } as const;

export function TickRuler({
  label,
  min,
  max,
  step = 1,
  majorEvery = 5,
  labelEvery,
  value,
  defaultValue,
  onValueChange,
  format = (v) => number.format(v),
  formatTick,
  valueText,
  unit,
  spacing = 12,
  className,
}: TickRulerProps) {
  const labelId = useId();
  const reduce = useReducedMotion();
  const count = Math.max(1, Math.round((max - min) / step) + 1);
  const last = count - 1;
  const every = labelEvery ?? majorEvery;

  const clampIndex = (i: number) => Math.min(last, Math.max(0, i));
  const indexOf = (v: number) => clampIndex(Math.round((v - min) / step));
  // Kayan noktayı yuvarla: 0,1 adımda 21,000000004 °C görünmesin.
  const valueAt = (i: number) => Number((min + i * step).toFixed(6));

  const [inner, setInner] = useState(() => indexOf(defaultValue ?? value ?? min));
  const index = value === undefined ? inner : indexOf(value);
  const current = valueAt(index);

  const x = useMotionValue(-index * spacing);
  const shown = useRef(index); // hareket değerinin şu an gösterdiği adım
  const follow = useRef(true); // değer hareketten mi türesin (klavyede hayır)
  const run = useRef<AnimationPlaybackControls | null>(null);
  const dragRef = useRef<{ startX: number; startOffset: number } | null>(null);
  const viewport = useRef<HTMLDivElement>(null);

  const commit = (i: number) => {
    shown.current = i;
    setInner(i);
    onValueChange?.(valueAt(i));
  };

  useMotionValueEvent(x, "change", (latest) => {
    if (!follow.current) return;
    const i = clampIndex(Math.round(-latest / spacing));
    if (i !== shown.current) commit(i);
  });

  const settleTo = (i: number, velocity = 0) => {
    run.current?.stop();
    const to = -i * spacing;
    if (reduce) {
      x.set(to);
      follow.current = true;
      return;
    }
    run.current = animate(x, to, { ...SETTLE, velocity });
    run.current.finished.then(() => {
      follow.current = true;
    });
  };

  // Dışarıdan gelen değer (denetimli kullanım): kendi yaydığımız değilse oraya kay.
  useEffect(() => {
    if (value === undefined) return;
    const i = indexOf(value);
    if (i !== shown.current) {
      follow.current = false;
      shown.current = i;
      settleTo(i);
    }
    // Bağımlılık yalnız dış değer: kendi yaydığımız değer buraya geri döner ve atlanır.
  }, [value]);

  const bound = (raw: number) => {
    const lo = -last * spacing;
    // Uçta lastik: taşan mesafenin üçte biri kadar gider.
    if (raw > 0) return raw / 3;
    if (raw < lo) return lo + (raw - lo) / 3;
    return raw;
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    run.current?.stop();
    follow.current = true;
    dragRef.current = { startX: e.clientX, startOffset: x.get() };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    x.set(bound(d.startOffset + e.clientX - d.startX));
  };
  const onPointerUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    const velocity = x.getVelocity();
    // Hız biraz daha taşır (atış), sonra en yakın adıma yayla oturur.
    const projected = x.get() + velocity * 0.12;
    settleTo(clampIndex(Math.round(-projected / spacing)), velocity);
  };

  // Tekerlek: yalnız yatay (ya da Shift); dikey kaydırma sayfanın.
  // preventDefault gerektiği için pasif olamaz; iş tek `x.set`, kare başına hesap yok.
  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    let idle: ReturnType<typeof setTimeout> | undefined;
    const onWheel = (e: WheelEvent) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!horizontal && !e.shiftKey) return;
      e.preventDefault();
      run.current?.stop();
      follow.current = true;
      const delta = horizontal ? e.deltaX : e.deltaY;
      x.set(bound(x.get() - delta));
      clearTimeout(idle);
      idle = setTimeout(() => settleTo(clampIndex(Math.round(-x.get() / spacing))), 120);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      clearTimeout(idle);
      node.removeEventListener("wheel", onWheel);
    };
    // Dinleyici ölçü değişince yeniden kurulur; okuduğu geri kalan her şey ref.
  }, [spacing, last, reduce]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const base = index;
    const next = {
      ArrowRight: base + 1,
      ArrowUp: base + 1,
      ArrowLeft: base - 1,
      ArrowDown: base - 1,
      PageUp: base + majorEvery,
      PageDown: base - majorEvery,
      Home: 0,
      End: last,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const i = clampIndex(next);
    follow.current = false;
    if (i !== index) commit(i);
    settleTo(i);
  };

  const spoken = valueText?.(current) ?? (unit ? `${format(current)} ${unit}` : format(current));

  return (
    <div className={cn("grid gap-3", className)}>
      <span id={labelId} className="text-base font-medium text-strong">
        {label}
      </span>
      <p aria-hidden className="flex items-baseline gap-1.5 text-strong">
        <DigitRoll value={format(current)} className="text-display font-medium tracking-tight" />
        {unit ? <span className="text-base text-muted">{unit}</span> : null}
      </p>

      <div
        role="slider"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-orientation="horizontal"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={current}
        aria-valuetext={spoken}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="group/ruler relative h-16 cursor-grab touch-pan-y rounded-lg select-none active:cursor-grabbing"
      >
        <div
          ref={viewport}
          className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]"
        >
          <m.div aria-hidden className="absolute inset-y-0 left-1/2" style={{ x }}>
            {Array.from({ length: count }, (_, i) => {
              const major = i % majorEvery === 0;
              return (
                <span key={i}>
                  <span
                    className={cn(
                      "absolute top-1 w-px -translate-x-1/2 rounded-full transition-colors duration-150",
                      major ? "h-7" : "h-4",
                      i <= index ? "bg-strong" : "bg-line-strong",
                    )}
                    style={{ left: i * spacing }}
                  />
                  {i % every === 0 ? (
                    <span
                      className="absolute top-10 -translate-x-1/2 text-micro whitespace-nowrap text-muted tabular-nums"
                      style={{ left: i * spacing }}
                    >
                      {(formatTick ?? format)(valueAt(i))}
                    </span>
                  ) : null}
                </span>
              );
            })}
          </m.div>
        </div>
        {/* Gösterge sabit: cetvel onun altından kayar. Basınca hafif küçülür. */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 left-1/2 h-9 w-0.5 -translate-x-1/2 rounded-full bg-primary transition-[scale] duration-150 group-active/ruler:scale-y-90"
        />
      </div>
    </div>
  );
}
