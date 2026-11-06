// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
/* token-ok-file: renk burada kullanıcı VERİSİ (seçilen değer, hazır renk), sistem rengi değil. */

import { useId, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Renk seçici: kullanıcının KENDİ rengi (etiket rengi, takvim kategorisi,
 * marka rengi). Satır içi durur; dar yerde bir `Popover` içine konur.
 * Sistemin kendi renkleri (vurgu, durum) bundan seçilmez, token'dır.
 *
 * Parçalar: doygunluk/parlaklık alanı (HSV), ton kaydırıcısı, hex alanı
 * ve isteğe bağlı hazır renk noktaları. Değer `#rrggbb`, küçük harf.
 *
 * NEDEN `style`: seçilen renk KULLANICI VERİSİ, token değil; alanın zemini,
 * tutamağın dolgusu ve noktalar bu yüzden satır içi stil. Alanın siyah/beyaz
 * katmanları ve ton şeridi renk uzayının kendisi; markadan gelen bir
 * degrade değil (gökkuşağı yasağı veri gösterimini kapsamaz).
 *
 * Erişilebilirlik: alan ve ton şeridi ayrı `role="slider"`. Alan iki eksenli:
 * ←/→ doygunluk, ↑/↓ parlaklık (Shift ile 10), PageUp/PageDown parlaklıkta
 * 10, Home/End doygunluk uçları; `aria-valuetext` iki değeri birlikte söyler.
 * Ton şeridi ←/→ 1°, Shift ile 10°, Home/End 0°/359°. Fareyle tıklanan
 * yer odağı da alır; klavyeyle devam edilebilir. Hex alanı Enter ya da
 * odak çıkışında uygulanır; geçersiz yazım eski renge döner, sessizce
 * yanlış renk kaydetmez.
 *
 *   <ColorPicker label="Etiket Rengi" defaultValue="#3b82f6"
 *     presets={[{ value: "#3b82f6", label: "Gök Mavisi" }, …]} name="renk" />
 */

type Preset = { value: string; label: string };

type ColorPickerProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (hex: string) => void;
  presets?: readonly Preset[];
  name?: string;
  className?: string;
};

type Hsv = { h: number; s: number; v: number };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function hsvToHex({ h, s, v }: Hsv) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    const c = (v / 100) * (1 - (s / 100) * Math.max(0, Math.min(k, 4 - k, 1)));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(5)}${f(3)}${f(1)}`;
}

function hexToHsv(hex: string): Hsv | null {
  const clean = parseHex(hex);
  if (!clean) return null;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(clean.slice(i + 1, i + 3), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: Math.round((h * 60 + 360) % 360), s: max ? Math.round((d / max) * 100) : 0, v: Math.round(max * 100) };
}

/** "#abc", "abc", "#AABBCC" → "#aabbcc"; geçersizse null. */
function parseHex(input: string) {
  const raw = input.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(raw)) return `#${[...raw].map((c) => c + c).join("")}`;
  if (/^[0-9a-f]{6}$/.test(raw)) return `#${raw}`;
  return null;
}

export function ColorPicker({
  label,
  hint,
  error,
  value,
  defaultValue = "#3b82f6",
  onValueChange,
  presets,
  name,
  className,
}: ColorPickerProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  // HSV ve hex BİRLİKTE tutulur: tam sayı HSV'den geri çevrilen hex bir
  // basamak kayabilir (#3b82f6 → #3b82f5). Yazılan ya da seçilen hex olduğu
  // gibi kalır; yalnız alan/şerit oynatılınca HSV'den yeniden hesaplanır.
  // Ton, gri renkte (doygunluk 0) kaybolmasın diye HSV'de saklanır.
  const [color, setColor] = useState(() => {
    const start = parseHex(value ?? defaultValue) ?? "#3b82f6";
    return { hsv: hexToHsv(start) ?? { h: 217, s: 76, v: 96 }, hex: start };
  });
  const [draft, setDraft] = useState<string | null>(null);

  // Denetimli kullanımda dışarıdan gelen renk kazanır.
  const external = value ? parseHex(value) : null;
  const outside = external !== null && external !== color.hex;
  const hex = outside ? external : color.hex;
  const shown = outside ? (hexToHsv(external) ?? color.hsv) : color.hsv;

  function set(next: Hsv, exact?: string) {
    const bounded = { h: clamp(next.h, 0, 359), s: clamp(next.s, 0, 100), v: clamp(next.v, 0, 100) };
    const nextHex = exact ?? hsvToHex(bounded);
    setColor({ hsv: bounded, hex: nextHex });
    onValueChange?.(nextHex);
  }

  function fromArea(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    set({
      ...shown,
      s: Math.round(((event.clientX - rect.left) / rect.width) * 100),
      v: Math.round(100 - ((event.clientY - rect.top) / rect.height) * 100),
    });
  }

  function fromHue(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    set({ ...shown, h: Math.round(((event.clientX - rect.left) / rect.width) * 359) });
  }

  function drag(handler: (event: PointerEvent<HTMLDivElement>) => void) {
    return {
      onPointerDown(event: PointerEvent<HTMLDivElement>) {
        event.currentTarget.setPointerCapture(event.pointerId);
        (event.currentTarget.querySelector("[role=slider]") as HTMLElement | null)?.focus();
        event.preventDefault();
        handler(event);
      },
      onPointerMove(event: PointerEvent<HTMLDivElement>) {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) handler(event);
      },
    };
  }

  function areaKeys(event: KeyboardEvent) {
    const step = event.shiftKey ? 10 : 1;
    const moves: Record<string, Partial<Hsv>> = {
      ArrowLeft: { s: shown.s - step },
      ArrowRight: { s: shown.s + step },
      ArrowUp: { v: shown.v + step },
      ArrowDown: { v: shown.v - step },
      PageUp: { v: shown.v + 10 },
      PageDown: { v: shown.v - 10 },
      Home: { s: 0 },
      End: { s: 100 },
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    set({ ...shown, ...move });
  }

  function hueKeys(event: KeyboardEvent) {
    const step = event.shiftKey || event.key.startsWith("Page") ? 10 : 1;
    const moves: Record<string, number> = {
      ArrowLeft: shown.h - step,
      ArrowDown: shown.h - step,
      PageDown: shown.h - step,
      ArrowRight: shown.h + step,
      ArrowUp: shown.h + step,
      PageUp: shown.h + step,
      Home: 0,
      End: 359,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    set({ ...shown, h: moves[event.key] });
  }

  function applyDraft() {
    if (draft === null) return;
    const parsed = parseHex(draft);
    const next = parsed ? hexToHsv(parsed) : null;
    if (parsed && next) set(next, parsed);
    setDraft(null);
  }

  const hueColor = `hsl(${shown.h} 100% 50%)`;
  const draftInvalid = draft !== null && parseHex(draft) === null;

  return (
    <div role="group" aria-labelledby={labelId} aria-describedby={describedBy} className={cn("grid content-start gap-3", className)}>
      <span id={labelId} className="text-small font-semibold text-strong">
        {label}
      </span>

      <div
        {...drag(fromArea)}
        className="relative h-40 cursor-crosshair touch-none rounded-lg"
        style={{
          backgroundColor: hueColor,
          backgroundImage: "linear-gradient(to top, black, transparent), linear-gradient(to right, white, transparent)",
        }}
      >
        <div
          role="slider"
          tabIndex={0}
          aria-label="Doygunluk ve Parlaklık"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={shown.s}
          aria-valuetext={`Doygunluk %${shown.s}, parlaklık %${shown.v}`}
          onKeyDown={areaKeys}
          className="absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-on-brand shadow-floating ring-1 ring-line-strong"
          style={{ left: `${shown.s}%`, top: `${100 - shown.v}%`, backgroundColor: hex }}
        />
      </div>

      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="size-9 shrink-0 rounded-full shadow-raised ring-1 ring-line"
          style={{ backgroundColor: hex }}
        />
        <div
          {...drag(fromHue)}
          className="relative h-3 flex-1 cursor-pointer touch-none rounded-full"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(359 100% 50%))",
          }}
        >
          {/* Dokunmatikte ince şerit 44 px hedef ister: görünmez dolgu. */}
          <span aria-hidden className="absolute inset-x-0 -inset-y-4 pointer-fine:-inset-y-1.5" />
          <div
            role="slider"
            tabIndex={0}
            aria-label="Ton"
            aria-valuemin={0}
            aria-valuemax={359}
            aria-valuenow={shown.h}
            aria-valuetext={`Ton ${shown.h} derece`}
            onKeyDown={hueKeys}
            className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-on-brand shadow-floating ring-1 ring-line-strong"
            style={{ left: `${(shown.h / 359) * 100}%`, backgroundColor: hueColor }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label
          className={cn(
            "flex h-11 w-32 items-center gap-2 rounded-md border border-line-strong bg-surface-sunken shadow-well px-3 transition-[color,background-color,border-color,box-shadow] pointer-fine:h-9",
            "hover:border-primary-soft has-[input:focus-visible]:border-line-focus has-[input:focus-visible]:shadow-focus has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-line-focus",
            (draftInvalid || error) && "border-danger",
          )}
        >
          <span className="text-micro font-semibold text-muted">HEX</span>
          <input
            value={draft ?? hex.slice(1).toUpperCase()}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={applyDraft}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyDraft();
              } else if (event.key === "Escape") setDraft(null);
            }}
            aria-label="Onaltılık Renk Kodu"
            aria-invalid={draftInvalid || undefined}
            maxLength={7}
            spellCheck={false}
            autoComplete="off"
            className="w-full min-w-0 bg-transparent font-mono text-base text-strong uppercase outline-none"
          />
        </label>

        {presets?.length ? (
          <div role="group" aria-label="Hazır Renkler" className="flex flex-wrap gap-1.5">
            {presets.map((preset) => {
              const selected = parseHex(preset.value) === hex;
              return (
                <button
                  key={preset.value}
                  type="button"
                  aria-label={preset.label}
                  aria-pressed={selected}
                  title={preset.label}
                  onClick={() => {
                    const exact = parseHex(preset.value);
                    const next = exact ? hexToHsv(exact) : null;
                    if (exact && next) set(next, exact);
                  }}
                  className={cn(
                    "size-8 rounded-full ring-1 ring-line ring-inset transition-[scale] duration-150 hover:scale-110 motion-reduce:hover:scale-100 pointer-fine:size-6",
                    selected && "outline-2 outline-offset-2 outline-line-focus",
                  )}
                  style={{ backgroundColor: preset.value }}
                />
              );
            })}
          </div>
        ) : null}
      </div>

      {name ? <input type="hidden" name={name} value={hex} /> : null}
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
    </div>
  );
}
