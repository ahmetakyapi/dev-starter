"use client";

import { Slider as Base } from "@base-ui/react/slider";
import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Kaydırıcı: bir aralıkta YAKLAŞIK değer (ses, yarıçap, fiyat aralığı).
 * Kesin sayı yazılacaksa `number-field.tsx`; kullanıcı "tam 1.250" diyorsa
 * kaydırıcıyla onu bulmak eziyettir.
 *
 * `value` tek sayıysa tek tutamak, `[alt, üst]` dizisiyse ARALIK (iki
 * tutamak, aralarındaki iz dolar). Klavye, sürükleme, dokunma, form
 * gönderimi (gizli `input type="range"`) ve ARIA Base UI'dan
 * (`@base-ui/react/slider`); biz yalnızca görünüşü ve tr-TR biçimi veriyoruz.
 *
 * NEDEN DEĞER BALONU: sürüklerken parmak tutamağı örter. Balon tutamağın
 * ÜSTÜNDE belirir, yalnız SÜRÜKLENEN tutamakta (aralıkta öteki susar:
 * `data-dragging` her tutamakta; hangisinin sürüklendiğini
 * `activeThumbIndex` söyler) ya da klavye
 * odağındayken; dururken
 * sayı başlıktaki değerde okunur (iki kopya ekranda yarışmaz). Balon
 * 0.9'dan büyür, hareket azaltanda yalnız solarak gelir.
 *
 * Adım işaretleri (`marks`) iz üstünde nokta, altta isteğe bağlı etiket.
 * Konumları değerden hesaplanır, bu yüzden `style` ile verilir (renk değil).
 * Aralıkta tutamaklar çakışmasın: `minStepsBetweenValues`.
 *
 *   <Slider label="Fiyat Aralığı" defaultValue={[1500, 4500]} min={0} max={10000}
 *     step={250} format={{ style: "currency", currency: "TRY", maximumFractionDigits: 0 }}
 *     thumbLabels={["En Düşük Fiyat", "En Yüksek Fiyat"]} />
 */

type SliderValue = number | readonly number[];

type SliderProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  value?: SliderValue;
  defaultValue?: SliderValue;
  onValueChange?: (value: number | number[]) => void;
  /** Sürükleme bitince bir kez: ağ isteği burada yapılır, `onValueChange`de değil. */
  onValueCommitted?: (value: number | number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Shift + ok ve PageUp/PageDown adımı. */
  largeStep?: number;
  minStepsBetweenValues?: number;
  /** İz üstünde işaret noktaları (değer cinsinden). */
  marks?: readonly number[];
  /** İşaretlerin altında değer etiketi yazılsın mı. */
  showMarkLabels?: boolean;
  format?: Intl.NumberFormatOptions;
  /** Aralıkta her tutamağın ekran okuyucu adı. */
  thumbLabels?: readonly [string, string];
  /** Başlıkta güncel değer gösterilsin mi. */
  showValue?: boolean;
  name?: string;
  disabled?: boolean;
  className?: string;
};

const LOCALE = "tr-TR";

function toArray(value: SliderValue) {
  return typeof value === "number" ? [value] : [...value];
}

export function Slider({
  label,
  hint,
  error,
  value,
  defaultValue,
  onValueChange,
  onValueCommitted,
  min = 0,
  max = 100,
  step = 1,
  largeStep,
  minStepsBetweenValues,
  marks,
  showMarkLabels = false,
  format,
  thumbLabels = ["En Düşük", "En Yüksek"],
  showValue = true,
  name,
  disabled,
  className,
}: SliderProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  // Balon ve başlık değeri için değeri biz de tutuyoruz; denetimli kullanımda
  // `value` kazanır.
  const [inner, setInner] = useState<SliderValue>(defaultValue ?? min);
  const [activeThumb, setActiveThumb] = useState(0);
  const current = toArray(value ?? inner);
  const range = current.length > 1;
  const formatter = new Intl.NumberFormat(LOCALE, format);
  const percent = (v: number) => ((v - min) / (max - min)) * 100;
  const inRange = (v: number) =>
    range ? v >= current[0] && v <= current[current.length - 1] : v <= current[0];

  return (
    <Base.Root
      value={value === undefined ? undefined : typeof value === "number" ? value : [...value]}
      defaultValue={defaultValue === undefined ? undefined : typeof defaultValue === "number" ? defaultValue : [...defaultValue]}
      onValueChange={(next, details) => {
        setInner(next);
        setActiveThumb(details.activeThumbIndex);
        onValueChange?.(next);
      }}
      onValueCommitted={onValueCommitted ? (next) => onValueCommitted(next) : undefined}
      min={min}
      max={max}
      step={step}
      largeStep={largeStep}
      minStepsBetweenValues={minStepsBetweenValues}
      format={format}
      locale={LOCALE}
      name={name}
      disabled={disabled}
      className={cn("group/slider grid content-start gap-2 data-disabled:opacity-50", className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <Base.Label className="text-small font-semibold text-strong">{label}</Base.Label>
        {showValue ? (
          <Base.Value className="text-small font-semibold text-strong tabular-nums">
            {(formatted) => formatted.join(" – ")}
          </Base.Value>
        ) : null}
      </div>

      {/* Yatay iç boşluk: tutamak iz ucunda yarı taşar, kabın dışına çıkmasın. */}
      <Base.Control className="flex min-h-11 touch-none items-center px-2.5 select-none pointer-fine:min-h-8">
        <Base.Track className="relative h-1.5 w-full rounded-full bg-surface-raised">
          <Base.Indicator className="rounded-full bg-primary" />

          {marks?.map((mark) => (
            <span
              key={mark}
              aria-hidden
              className={cn(
                "absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full",
                inRange(mark) ? "bg-on-primary opacity-70" : "bg-line-strong",
              )}
              style={{ left: `${percent(mark)}%` }}
            />
          ))}

          {current.map((thumbValue, index) => (
            <Base.Thumb
              key={index}
              index={index}
              aria-describedby={describedBy}
              getAriaLabel={range ? (i) => thumbLabels[i] ?? thumbLabels[0] : undefined}
              // Base UI'ın varsayılanı İngilizce ("start range"); değer + ad Türkçe.
              getAriaValueText={(formatted, _value, i) => (range ? `${formatted}, ${thumbLabels[i] ?? ""}` : formatted)}
              className={cn(
                "group/thumb size-5 rounded-full border border-line-strong bg-overlay shadow-floating outline-none",
                "transition-[scale,box-shadow] duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-line-focus",
                "active:scale-110 data-dragging:scale-110 motion-reduce:active:scale-100 motion-reduce:data-dragging:scale-100",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 rounded-sm bg-strong px-2 py-1",
                  "text-micro font-semibold whitespace-nowrap text-page tabular-nums shadow-floating",
                  "origin-bottom scale-90 opacity-0 transition-[opacity,scale] duration-150 motion-reduce:scale-100",
                  "group-active/thumb:scale-100 group-active/thumb:opacity-100",
                  index === activeThumb && "group-data-dragging/thumb:scale-100 group-data-dragging/thumb:opacity-100",
                  "group-has-[:focus-visible]/thumb:scale-100 group-has-[:focus-visible]/thumb:opacity-100",
                )}
              >
                {formatter.format(thumbValue)}
              </span>
            </Base.Thumb>
          ))}
        </Base.Track>
      </Base.Control>

      {marks && showMarkLabels ? (
        <div aria-hidden className="relative mx-2.5 h-4 text-micro text-muted tabular-nums">
          {marks.map((mark) => (
            <span key={mark} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${percent(mark)}%` }}>
              {formatter.format(mark)}
            </span>
          ))}
        </div>
      ) : null}

      {hint && !error ? (
        <p id={hintId} className="text-small text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-small text-danger">
          {error}
        </p>
      ) : null}
    </Base.Root>
  );
}
