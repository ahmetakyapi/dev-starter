"use client";

import { Eraser, Undo2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * İmza alanı: teslim tutanağı, sözleşme onayı, fatura imzası. Parmakla,
 * kalemle ya da fareyle çizilir; çizgi basınç taklidiyle hıza göre incelir.
 *
 * İKİ YOL, BİR DEĞER: çizim yalnız işaretçiyle yapılabilir, bu yüzden
 * "Yazarak İmzala" sekmesi klavye ve ekran okuyucu kullanıcısına aynı işi
 * yaptırır (WCAG 2.1.1). Yazılan ad el yazısı taklidi bir yüzle önizlenir.
 * Değer çağırana `{ kind: "drawn", svg }` ya da `{ kind: "typed", name }`
 * olarak gider; formda gizli alanlar `<name>` (SVG ya da ad) ve
 * `<name>-kind`.
 *
 * SVG, PNG DEĞİL: çizgiler nokta listesi olarak tutulur ve SVG yoluna
 * çevrilir; boyuttan bağımsız, birkaç KB, sunucuda olduğu gibi saklanır.
 * Yol `currentColor` ile çizilir: belgeye gömülünce siyah, ekranda temanın
 * metin rengi. Tuval de noktalardan YENİDEN çizilir: tema değişince ya da
 * kutu yeniden boyutlanınca imza kaybolmaz, yeni renge döner.
 *
 * DOKUNMATİK: tuval `touch-action: none` (çizerken sayfa kaymaz); dışarıda
 * sayfa normal kayar. Geri Al son çizgiyi, Temizle hepsini siler.
 *
 *   <SignaturePad label="Teslim Alan İmzası" name="imza" onValueChange={setSig} />
 */

type Point = [x: number, y: number, t: number];
type Stroke = Point[];

export type SignatureValue = { kind: "drawn"; svg: string } | { kind: "typed"; name: string } | null;

type SignaturePadProps = {
  label: string;
  /** Form alanı adı: gizli alanlar `<name>` ve `<name>-kind`. */
  name?: string;
  onValueChange?: (value: SignatureValue) => void;
  /** Çizim alanının boyu (px). */
  height?: number;
  className?: string;
};

/** Çizgileri yumuşatılmış SVG yoluna çevirir (orta noktalardan ikinci derece eğri). */
function toPath(strokes: readonly Stroke[]) {
  return strokes
    .map((s) => {
      if (s.length === 1) return `M${s[0][0].toFixed(1)} ${s[0][1].toFixed(1)}h0.1`;
      let d = `M${s[0][0].toFixed(1)} ${s[0][1].toFixed(1)}`;
      for (let i = 1; i < s.length - 1; i++) {
        const mx = (s[i][0] + s[i + 1][0]) / 2;
        const my = (s[i][1] + s[i + 1][1]) / 2;
        d += `Q${s[i][0].toFixed(1)} ${s[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
      }
      const last = s[s.length - 1];
      return `${d}L${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
    })
    .join("");
}

export function SignaturePad({ label, name, onValueChange, height = 160, className }: SignaturePadProps) {
  const id = useId();
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [typed, setTyped] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef<Stroke | null>(null);
  const size = useRef({ w: 0, h: height });

  const draw = useCallback(
    (list: readonly Stroke[]) => {
      const c = canvas.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size.current.w, size.current.h);
      // Renk temadan: tuvalin kendi `color` değeri (text-strong).
      ctx.strokeStyle = getComputedStyle(c).color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const s of list) {
        for (let i = 1; i < s.length; i++) {
          const [x0, y0, t0] = s[i - 1];
          const [x1, y1, t1] = s[i];
          const speed = Math.hypot(x1 - x0, y1 - y0) / Math.max(1, t1 - t0);
          ctx.lineWidth = Math.max(1.2, 3.2 - speed * 1.4);
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }
        if (s.length === 1) {
          ctx.beginPath();
          ctx.arc(s[0][0], s[0][1], 1.5, 0, Math.PI * 2);
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fill();
        }
      }
    },
    [],
  );

  // Boyut ve tema değişince noktalardan yeniden çiz.
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const resize = () => {
      const w = c.clientWidth;
      const dpr = window.devicePixelRatio || 1;
      size.current = { w, h: height };
      c.width = Math.round(w * dpr);
      c.height = Math.round(height * dpr);
      draw(strokes);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    const mo = new MutationObserver(() => draw(strokes));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette"] });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [draw, strokes, height]);

  function emit(next: SignatureValue) {
    onValueChange?.(next);
  }

  function point(event: PointerEvent<HTMLCanvasElement>): Point {
    const r = event.currentTarget.getBoundingClientRect();
    return [event.clientX - r.left, event.clientY - r.top, event.timeStamp];
  }

  function down(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    live.current = [point(event)];
    draw([...strokes, live.current]);
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (!live.current) return;
    live.current.push(point(event));
    draw([...strokes, live.current]);
  }

  function up() {
    if (!live.current) return;
    const next = [...strokes, live.current];
    live.current = null;
    setStrokes(next);
    emit({ kind: "drawn", svg: svgOf(next) });
  }

  function svgOf(list: readonly Stroke[]) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.round(size.current.w)} ${height}"><path d="${toPath(list)}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function undo() {
    const next = strokes.slice(0, -1);
    setStrokes(next);
    emit(next.length ? { kind: "drawn", svg: svgOf(next) } : null);
  }

  function clear() {
    setStrokes([]);
    emit(null);
  }

  const empty = mode === "draw" ? strokes.length === 0 : typed.trim() === "";
  const value = mode === "draw" ? (strokes.length ? svgOf(strokes) : "") : typed.trim();

  return (
    <div role="group" aria-labelledby={`${id}-label`} className={cn("grid gap-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <span id={`${id}-label`} className="text-small font-semibold text-strong">
          {label}
        </span>
        <div role="group" aria-label="İmza Yolu" className="flex gap-0.5 rounded-md bg-surface-sunken p-0.5 shadow-well">
          {(
            [
              ["draw", "Çizerek"],
              ["type", "Yazarak"],
            ] as const
          ).map(([m, text]) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => {
                setMode(m);
                emit(m === "draw" ? (strokes.length ? { kind: "drawn", svg: svgOf(strokes) } : null) : typed.trim() ? { kind: "typed", name: typed.trim() } : null);
              }}
              className={cn(
                "min-h-8 rounded-sm px-2.5 text-small font-medium transition-[background-color,color,box-shadow] duration-150",
                mode === m ? "bg-overlay text-strong shadow-raised" : "text-muted hover:text-strong",
              )}
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl bg-overlay shadow-raised">
        {mode === "draw" ? (
          <>
            <canvas
              ref={canvas}
              aria-label={`${label}: çizim alanı. Klavyeyle imzalamak için Yazarak sekmesi.`}
              role="img"
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={up}
              className="block w-full cursor-crosshair touch-none text-strong"
              style={{ height }}
            />
            <div aria-hidden className="pointer-events-none absolute inset-x-6 bottom-9 border-b border-dashed border-line-strong" />
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-3 text-center text-small text-muted transition-opacity duration-200",
                !empty && "opacity-0",
              )}
            >
              Buraya İmzala
            </span>
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                type="button"
                onClick={undo}
                disabled={empty}
                aria-label="Son Çizgiyi Geri Al"
                title="Geri Al"
                className="inline-grid size-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface-raised hover:text-strong disabled:opacity-0"
              >
                <Undo2 aria-hidden className="size-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={clear}
                disabled={empty}
                aria-label="İmzayı Temizle"
                title="Temizle"
                className="inline-grid size-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface-raised hover:text-strong disabled:opacity-0"
              >
                <Eraser aria-hidden className="size-4" strokeWidth={2} />
              </button>
            </div>
          </>
        ) : (
          <div className="grid gap-3 p-4" style={{ minHeight: height }}>
            <label className="grid gap-1.5">
              <span className="text-small text-muted">Adın ve soyadın</span>
              <input
                value={typed}
                onChange={(event) => {
                  setTyped(event.target.value);
                  const v = event.target.value.trim();
                  emit(v ? { kind: "typed", name: v } : null);
                }}
                autoComplete="name"
                className="min-h-11 rounded-md border border-line-strong bg-surface-sunken px-3 text-base text-strong shadow-well transition-[border-color,box-shadow] outline-none focus-visible:border-line-focus focus-visible:shadow-focus"
              />
            </label>
            <p
              aria-hidden
              className="truncate border-b border-dashed border-line-strong pb-1 text-center text-heading text-strong italic"
              style={{ fontFamily: '"Snell Roundhand", "Segoe Script", "Brush Script MT", cursive' }}
            >
              {typed.trim() || " "}
            </p>
          </div>
        )}
      </div>

      {name ? (
        <>
          <input type="hidden" name={name} value={value} />
          <input type="hidden" name={`${name}-kind`} value={empty ? "" : mode === "draw" ? "drawn" : "typed"} />
        </>
      ) : null}
    </div>
  );
}
