"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Yarım ton görsel: fotoğrafı token renginde nokta, kare ya da ASCII
 * karakter ızgarasına çevirir. Gazete baskısı / terminal havası: ekip
 * fotoğrafı, kahraman görseli, ürünün "nasıl çalışır" çizimi, 404 sahnesi.
 * Fotoğraf markanın tek rengine iner; palet ve tema değişince yeniden
 * çizilir, her sayfada aynı fotoğraf başka paletle uyumlu durur.
 *
 * NASIL: görsel küçük bir tuvale ızgara çözünürlüğünde çizilir, her
 * hücrenin parlaklığı okunur; koyu hücre büyük nokta (ya da yoğun
 * karakter `@#%*+=-:.`). Renk `currentColor`: varsayılan `text-strong`,
 * `text-primary` ile marka tonu. `invert` açık zemin üstünde açık
 * hücreleri büyütür (koyu temada fotoğraf negatif görünmesin diye
 * tema koyuyken kendiliğinden ters çevrilir: `autoInvert`).
 *
 * İŞARETÇİ: ince işaretçide imlecin çevresindeki noktalar büyür (yalnız
 * hareket ederken çizilir, boşta CPU harcamaz). Hareketi azaltan
 * kullanıcıda etkileşim yok, görsel durağan.
 *
 * ERİŞİLEBİLİRLİK: tuval `role="img"` + `alt` (zorunlu). Görsel başka
 * kökenden geliyorsa CORS izni ister (`crossOrigin="anonymous"`); izin
 * yoksa piksel okunamaz ve bileşen boş kalır, `alt` yine okunur.
 *
 *   <HalftoneImage src="/ekip.jpg" alt="Ekip ofiste" mode="dots" cell={8} className="aspect-[4/3] w-full text-primary" />
 */

const RAMP = " .:-=+*#%@";
const POINTER_RADIUS = 90;

type HalftoneImageProps = {
  src: string;
  alt: string;
  mode?: "dots" | "squares" | "ascii";
  /** Hücre boyu (CSS pikseli). 6-14 arası. */
  cell?: number;
  /** Açık hücreleri büyüt (koyu zemin için). */
  invert?: boolean;
  /** Koyu temada kendiliğinden ters çevir. */
  autoInvert?: boolean;
  /** Kontrast eğrisi: 1 doğrusal, büyüdükçe orta tonlar söner. */
  contrast?: number;
  interactive?: boolean;
  className?: string;
};

export function HalftoneImage({
  src,
  alt,
  mode = "dots",
  cell = 8,
  invert = false,
  autoInvert = true,
  contrast = 1.25,
  interactive = true,
  className,
}: HalftoneImageProps) {
  const reduce = useReducedMotion();
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    let lum: Float32Array | null = null;
    let cols = 0;
    let rows = 0;
    let pointer: { x: number; y: number } | null = null;
    let raf = 0;
    const img = new Image();
    img.crossOrigin = "anonymous";

    function sample() {
      const w = el!.clientWidth;
      const h = el!.clientHeight;
      if (!img.complete || !img.naturalWidth || !w || !h) return;
      cols = Math.max(1, Math.floor(w / cell));
      rows = Math.max(1, Math.floor(h / cell));
      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const o = off.getContext("2d", { willReadFrequently: true });
      if (!o) return;
      // "cover" kırpması: kap oranına göre görselin ortası.
      const scale = Math.max(cols / img.naturalWidth, rows / img.naturalHeight);
      const sw = cols / scale;
      const sh = rows / scale;
      o.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, cols, rows);
      try {
        const data = o.getImageData(0, 0, cols, rows).data;
        lum = new Float32Array(cols * rows);
        for (let i = 0; i < cols * rows; i++) {
          lum[i] = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
        }
      } catch {
        lum = null; // CORS: piksel okunamaz
      }
      draw();
    }

    function draw() {
      raf = 0;
      if (!lum) return;
      const dpr = window.devicePixelRatio || 1;
      const w = el!.clientWidth;
      const h = el!.clientHeight;
      el!.width = Math.round(w * dpr);
      el!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, w, h);
      const style = getComputedStyle(el!);
      ctx!.fillStyle = style.color;
      const dark = document.documentElement.dataset.theme === "dark";
      const flip = invert !== (autoInvert && dark);
      if (mode === "ascii") {
        ctx!.font = `${cell * 1.1}px ${style.getPropertyValue("--font-mono") || "ui-monospace, monospace"}`;
        ctx!.textAlign = "center";
        ctx!.textBaseline = "middle";
      }
      const ox = (w - cols * cell) / 2;
      const oy = (h - rows * cell) / 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let v = lum[r * cols + c];
          v = flip ? v : 1 - v; // v: mürekkep miktarı
          v = Math.pow(v, contrast);
          const cx = ox + c * cell + cell / 2;
          const cy = oy + r * cell + cell / 2;
          if (pointer) {
            const d = Math.hypot(cx - pointer.x, cy - pointer.y);
            if (d < POINTER_RADIUS) v = Math.min(1, v + (1 - d / POINTER_RADIUS) * 0.45);
          }
          if (v < 0.04) continue;
          if (mode === "dots") {
            ctx!.beginPath();
            ctx!.arc(cx, cy, (cell / 2) * Math.sqrt(v) * 0.95, 0, Math.PI * 2);
            ctx!.fill();
          } else if (mode === "squares") {
            const s = cell * Math.sqrt(v) * 0.9;
            ctx!.fillRect(cx - s / 2, cy - s / 2, s, s);
          } else {
            ctx!.fillText(RAMP[Math.min(RAMP.length - 1, Math.floor(v * RAMP.length))], cx, cy);
          }
        }
      }
    }

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    img.onload = sample;
    img.src = src;

    const ro = new ResizeObserver(sample);
    ro.observe(el);
    // Tema ya da palet değişince renk yeniden okunur.
    const mo = new MutationObserver(schedule);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette", "class"] });

    const fine = window.matchMedia("(pointer: fine)").matches;
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      schedule();
    };
    const onLeave = () => {
      pointer = null;
      schedule();
    };
    const live = interactive && fine && !reduce;
    if (live) {
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
    }
    return () => {
      ro.disconnect();
      mo.disconnect();
      cancelAnimationFrame(raf);
      img.onload = null;
      if (live) {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      }
    };
  }, [autoInvert, cell, contrast, interactive, invert, mode, reduce, src]);

  return <canvas ref={canvas} role="img" aria-label={alt} className={cn("block h-full w-full text-strong", className)} />;
}
