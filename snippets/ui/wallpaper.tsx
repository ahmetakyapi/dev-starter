import { useId, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Duvar kâğıdı: paletin rengiyle çizilen, çözünürlükten bağımsız (SVG)
 * masaüstü ve telefon arka planları. Altı hazır sahne: kum tepesi, gelgit,
 * sıradağ, kutup ışığı, eş yükselti, çiçeklenme. İki işi var:
 *
 *   1. Maket sahnesi: `app-window` + `dock` ile kurulan masaüstü demosunun
 *      arkası (Ribbon'ın sahil fotoğrafı yerine, temaya ve palete uyan).
 *   2. İndirilebilir duvar kâğıdı: `downloadWallpaper()` sahneyi o anki
 *      paletin renkleriyle PNG'ye çevirir (2880×1800 Retina masaüstü,
 *      1290×2796 telefon). Storybook → Tanıtım/Duvar Kâğıdı.
 *
 * RENK: hepsi token'dan (`--primary`, `--warning`, `--success`,
 * `--accent-warm`), beyaz ve siyahla `color-mix` edilerek; sabit hex yok.
 * Sahnenin karakteri sabittir (gece sahnesi açık temada da gece, kum tepesi
 * koyu temada da gün batımı); renk paletle döner (`data-palette="verdant"`
 * gökyüzünü ve gölgeleri yeşil aileye çeker). Token'ların koyu temadaki
 * değeri daha açık olduğundan iki temada ton hafifçe değişir; indirilen PNG
 * o anki palet + temanın rengidir.
 *
 * TEKNİK: `viewBox="0 0 1600 1000"` + `preserveAspectRatio="xMidYMid slice"`:
 * kap hangi oranda olursa olsun boşluksuz doldurur (telefon dikeyinde de).
 * Rastgelelik (yıldız, eş yükselti çizgisi) sabit tohumlu: sunucu ve
 * istemci aynı resmi çizer. Filtre kimlikleri `useId` ile tekil.
 * Süstür: `aria-hidden`. Hareket yok.
 *
 *   <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
 *     <Wallpaper scene="tide" className="absolute inset-0" />
 *   </div>
 */

export const WALLPAPER_SCENES = ["dunes", "tide", "ridge", "aurora", "contour", "bloom"] as const;
export type WallpaperScene = (typeof WALLPAPER_SCENES)[number];

/** Storybook ve seçici arayüzler için Türkçe adlar. */
export const WALLPAPER_NAMES: Record<WallpaperScene, string> = {
  dunes: "Kum Tepesi",
  tide: "Gelgit",
  ridge: "Sıradağ",
  aurora: "Kutup Işığı",
  contour: "Eş Yükselti",
  bloom: "Çiçeklenme",
};

/** `var(--x)`i beyaz (+) ya da siyahla (−) karıştırır. */
const tint = (token: string, amount: number, base: "white" | "black" = "white") =>
  `color-mix(in oklab, var(--${token}) ${amount}%, ${base})`;

const fill = (color: string): CSSProperties => ({ fill: color });
const stop = (color: string): CSSProperties => ({ stopColor: color });

/** Sabit tohumlu sözde rastgele (mulberry32). */
function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tepe çizgisi: yumuşak sinüs toplamı, alt kenara kapanan yol. */
function hills(base: number, amp: number, freq: number, phase: number, steps = 32) {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 1600;
    const y = base + Math.sin(i * freq + phase) * amp + Math.sin(i * freq * 2.3 + phase * 1.7) * amp * 0.35;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `${pts.join(" ")} L1600 1000 L0 1000 Z`;
}

/** Sivri sırt: tohumlu kırık çizgi. */
function ridgeLine(base: number, amp: number, seed: number, steps = 26) {
  const rnd = seeded(seed);
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 1600;
    const y = base - (i % 2 === 0 ? rnd() * amp : rnd() * amp * 0.35);
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `${pts.join(" ")} L1600 1000 L0 1000 Z`;
}

/** Eş yükselti halkası: merkez etrafında dalgalı kapalı eğri. */
function contourRing(cx: number, cy: number, r: number, seed: number) {
  const rnd = seeded(seed);
  const k = [rnd() * 6, rnd() * 6, rnd() * 6];
  const pts: string[] = [];
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const rr = r * (1 + 0.09 * Math.sin(a * 3 + k[0]) + 0.05 * Math.sin(a * 5 + k[1]) + 0.03 * Math.sin(a * 7 + k[2]));
    pts.push(`${i === 0 ? "M" : "L"}${(cx + Math.cos(a) * rr * 1.25).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `${pts.join(" ")} Z`;
}

function Scene({ scene, id }: { scene: WallpaperScene; id: string }) {
  const g = (n: string) => `${id}-${n}`;
  const url = (n: string) => `url(#${g(n)})`;

  switch (scene) {
    case "dunes":
      return (
        <>
          <defs>
            <linearGradient id={g("sky")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={stop(tint("primary", 30))} />
              <stop offset="0.55" style={stop(tint("accent-warm", 28))} />
              <stop offset="1" style={stop(tint("warning", 35))} />
            </linearGradient>
            <filter id={g("glow")} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="40" />
            </filter>
          </defs>
          <rect width="1600" height="1000" fill={url("sky")} />
          <circle cx="1110" cy="470" r="190" style={fill(tint("warning", 45))} filter={url("glow")} opacity="0.8" />
          <circle cx="1110" cy="470" r="110" style={fill(tint("warning", 30))} />
          <path d={hills(600, 26, 0.32, 0.4)} style={fill(tint("accent-warm", 42))} />
          <path d={hills(660, 34, 0.24, 2.1)} style={fill(tint("accent-warm", 58))} />
          <path d={hills(740, 40, 0.2, 4.2)} style={fill(tint("accent-warm", 82, "black"))} opacity="0.9" />
          <path d={hills(830, 46, 0.16, 1.3)} style={fill(tint("accent-warm", 66, "black"))} />
          <path d={hills(920, 30, 0.22, 3.3)} style={fill(tint("accent-warm", 50, "black"))} />
        </>
      );

    case "tide":
      return (
        <>
          <defs>
            <linearGradient id={g("sky")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={stop(tint("primary", 38))} />
              <stop offset="1" style={stop(tint("accent-warm", 16))} />
            </linearGradient>
            <linearGradient id={g("sea")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={stop(tint("primary", 70, "black"))} />
              <stop offset="1" style={stop(tint("primary", 55))} />
            </linearGradient>
          </defs>
          <rect width="1600" height="1000" fill={url("sky")} />
          <circle cx="430" cy="300" r="64" style={fill(tint("accent-warm", 12))} />
          <rect y="540" width="1600" height="460" fill={url("sea")} />
          {[580, 620, 668, 724].map((y, i) => (
            <path key={y} d={`M0 ${y} Q 400 ${y - 8 - i * 2} 800 ${y} T 1600 ${y}`} fill="none" stroke="white" strokeOpacity={0.18 + i * 0.06} strokeWidth={1.5 + i} />
          ))}
          <path d={hills(820, 22, 0.18, 0.8)} style={fill(tint("warning", 22))} />
          <path d={hills(812, 22, 0.18, 0.8).replace(/ L1600 1000 L0 1000 Z$/, "")} fill="none" stroke="white" strokeOpacity="0.85" strokeWidth="6" strokeLinecap="round" />
          <path d={hills(900, 18, 0.2, 2.4)} style={fill(tint("warning", 32))} />
        </>
      );

    case "ridge":
      return (
        <>
          <defs>
            <linearGradient id={g("sky")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={stop(tint("primary", 18))} />
              <stop offset="1" style={stop(tint("primary", 42))} />
            </linearGradient>
          </defs>
          <rect width="1600" height="1000" fill={url("sky")} />
          <circle cx="1180" cy="330" r="80" style={fill(tint("accent-warm", 20))} />
          <path d={ridgeLine(560, 170, 11)} style={fill(tint("primary", 52))} />
          <path d={ridgeLine(650, 160, 23)} style={fill(tint("primary", 66))} />
          <path d={ridgeLine(740, 150, 37)} style={fill(tint("primary", 82))} />
          <path d={ridgeLine(830, 130, 41)} style={fill(tint("primary", 72, "black"))} />
          <path d={ridgeLine(930, 110, 53)} style={fill(tint("primary", 45, "black"))} />
        </>
      );

    case "aurora": {
      const rnd = seeded(7);
      const stars = Array.from({ length: 140 }, () => ({ x: rnd() * 1600, y: rnd() * 620, r: rnd() * 1.4 + 0.3, o: rnd() * 0.7 + 0.2 }));
      return (
        <>
          <defs>
            <linearGradient id={g("sky")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={stop(tint("primary", 14, "black"))} />
              <stop offset="1" style={stop(tint("primary", 34, "black"))} />
            </linearGradient>
            <filter id={g("soft")} x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="38" />
            </filter>
          </defs>
          <rect width="1600" height="1000" fill={url("sky")} />
          {stars.map((s, i) => (
            <circle key={i} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={s.r.toFixed(2)} fill="white" opacity={s.o.toFixed(2)} />
          ))}
          <g filter={url("soft")} opacity="0.85">
            <path d="M-100 420 C 300 240, 640 520, 980 300 S 1500 200, 1720 330" fill="none" strokeWidth="90" style={{ stroke: tint("success", 80) }} />
            <path d="M-100 520 C 360 380, 700 600, 1080 420 S 1540 360, 1720 460" fill="none" strokeWidth="60" style={{ stroke: tint("primary", 75) }} />
          </g>
          <path d={hills(840, 40, 0.22, 1.1)} style={fill(tint("primary", 18, "black"))} />
          <path d={hills(910, 28, 0.3, 3.4)} style={fill(tint("primary", 8, "black"))} />
        </>
      );
    }

    case "contour":
      return (
        <>
          <rect width="1600" height="1000" style={fill(tint("primary", 7))} />
          {Array.from({ length: 13 }, (_, i) => (
            <path
              key={`a${i}`}
              d={contourRing(520, 420, 40 + i * 34, 100 + i)}
              fill="none"
              strokeWidth={i === 7 ? 2.2 : 1.2}
              style={{ stroke: i === 7 ? tint("primary", 85) : tint("primary", 32) }}
            />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <path key={`b${i}`} d={contourRing(1250, 700, 30 + i * 36, 300 + i)} fill="none" strokeWidth={1.2} style={{ stroke: tint("primary", 26) }} />
          ))}
        </>
      );

    case "bloom":
      return (
        <>
          <defs>
            <filter id={g("blur")} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="110" />
            </filter>
            <filter id={g("grain")}>
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
              <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.09 0" />
            </filter>
          </defs>
          <rect width="1600" height="1000" style={fill(tint("primary", 10))} />
          <g filter={url("blur")}>
            <circle cx="360" cy="300" r="300" style={fill(tint("primary", 70))} />
            <circle cx="1180" cy="260" r="260" style={fill(tint("accent-warm", 60))} />
            <circle cx="900" cy="780" r="320" style={fill(tint("warning", 45))} />
            <circle cx="220" cy="860" r="220" style={fill(tint("success", 40))} />
          </g>
          <rect width="1600" height="1000" filter={url("grain")} />
        </>
      );
  }
}

type WallpaperProps = {
  scene: WallpaperScene;
  className?: string;
  /** Sahnenin üstüne (ör. masaüstü maketinin pencereleri). */
  children?: ReactNode;
};

export function Wallpaper({ scene, className, children }: WallpaperProps) {
  const id = `ui-wp-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const svg = (
    <svg
      aria-hidden
      data-wallpaper={scene}
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMid slice"
      className={cn("block size-full", children ? "absolute inset-0" : className)}
    >
      <Scene scene={scene} id={id} />
    </svg>
  );
  if (!children) return svg;
  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      {svg}
      <div className="relative">{children}</div>
    </div>
  );
}

/**
 * Sahneyi PNG olarak indirir (yalnız tarayıcıda, kullanıcı tıklamasıyla çağır).
 * Token renkleri o anki palet ve temadan çözülüp SVG'ye gömülür, sonra tuvale
 * çizilir. `width × height` oranı sahneden farklıysa sahne kırpılarak doldurur.
 */
export async function downloadWallpaper(svg: SVGSVGElement, width: number, height: number, name = "duvar-kagidi") {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  // CSS değişkeni tuvalde çözülmez: her öğenin hesaplanmış rengini satıra yaz.
  const source = svg.querySelectorAll<SVGElement>("*");
  clone.querySelectorAll<SVGElement>("*").forEach((el, i) => {
    const cs = getComputedStyle(source[i]);
    if (el.style.fill) el.style.fill = cs.fill;
    if (el.style.stroke) el.style.stroke = cs.stroke;
    if (el.style.stopColor) el.style.stopColor = cs.stopColor;
  });
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.removeAttribute("class");
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" });
  const src = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!png) throw new Error("PNG üretilemedi");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(png);
    a.download = `${name}-${width}x${height}.png`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } finally {
    URL.revokeObjectURL(src);
  }
}
