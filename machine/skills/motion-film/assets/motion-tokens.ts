/**
 * Hareket token'ları — tek dosya, her yerde içe aktarılır, satır içi sayı yok.
 *
 * Sayılar `reference/sayilar.md`den (Florence, "Opus 5.5 Motion Lab"; Easings,
 * Material 3, NN/g, WCAG). Projenin kendi eğrisi varsa (Açılış Zili:
 * `--ease-brand` = ease-out-quint) ENTER onu gösterir; `--ease-spring`
 * gibi taşan eğri yalnız POP'tur ve yalnız tek küçük öğede.
 *
 * Her fonksiyon zamanın SAF fonksiyonudur: N. kare 0..N−1 hesaplanmadan
 * çizilir (render sözleşmesi, `reference/video-uretimi.md`).
 */

/** cubic-bezier dörtlüleri (CSS'te `cubic-bezier(${EASE.enter})`). */
export const EASE = {
  /** Yazı ve logo açılışı — ease-out-expo. */
  reveal: [0.16, 1, 0.3, 1],
  /** Premium giriş — ease-out-quint (Açılış Zili `--ease-brand`). */
  enter: [0.22, 1, 0.36, 1],
  /** Ekran boyunca taşıma, kamera itişi — ease-in-out-quart. */
  move: [0.76, 0, 0.24, 1],
  /** Hızlı çıkış — ease-in-expo. */
  exit: [0.7, 0, 0.84, 0],
  /** Taşan pop — ease-out-back. YALNIZ tek küçük öğe; opaklık ve renkte asla. */
  pop: [0.34, 1.56, 0.64, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export const cssEase = (k: keyof typeof EASE) => `cubic-bezier(${EASE[k].join(", ")})`;

/** Süreler (ms). Çıkış girişin %50–60'ı. */
export const MS = { feedback: 150, move: 400, hero: 750, exit: 240 } as const;
/** Kademe (ms): harf 1 kare, kelime 60–120, liste 40–80. */
export const STAGGER = { letter: 30, word: 90, item: 60 } as const;

/** Herhangi bir kütüphanenin sayılarından sönüm oranı ζ: 1 zıplamaz, 0,7–0,85 premium, 0,4–0,6 oyuncu. */
export const dampingRatio = (k: number, c: number, m = 1) => c / (2 * Math.sqrt(k * m));

/**
 * Kapalı biçim yay, 0 → 1. `zeta` sönüm oranı, `f` hız (Hz). Benzetim yok:
 * t verilince ilerleme doğrudan gelir. Konum ve boyut için; opaklık ve renk
 * için ζ ≥ 1 ver (zıplamasın).
 */
export function spring(t: number, zeta = 0.7, f = 2) {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * f;
  if (zeta >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const wd = w * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + ((zeta * w) / wd) * Math.sin(wd * t));
}

/** cubic-bezier'i JS'te değerlendir (Newton + ikiye bölme). `element.animate` CSS değişkenini çözmez. */
export function bezier([x1, y1, x2, y2]: readonly [number, number, number, number]) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u: number) => ((ax * u + bx) * u + cx) * u;
  const sy = (u: number) => ((ay * u + by) * u + cy) * u;
  const dx = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 6; i++) { const d = dx(u); if (Math.abs(d) < 1e-6) break; u -= (sx(u) - x) / d; }
    let lo = 0, hi = 1;
    for (let i = 0; i < 20 && Math.abs(sx(u) - x) > 1e-5; i++) { if (sx(u) < x) lo = u; else hi = u; u = (lo + hi) / 2; }
    return sy(u);
  };
}

/** n. vuruşun karesi — HER vuruş zamandan hesaplanır ve tek tek yuvarlanır (eklenen yuvarlama 32 vuruşta 2 kare kayar). */
export const beatFrame = (n: number, bpm: number, fps: number) => Math.round((n * 60 * fps) / bpm);

/**
 * Ekrandaki yazının asgari bekleme süresi (sn): boşluksuz harf ÷ 15 + 1,5.
 * Kelime değil harf: Türkçe kelime uzun, kelime sayısı süreyi kısa tahmin eder.
 * `scripts/film-read.mjs` aynı kuralla denetler.
 */
export const holdFor = (text: string) => text.replace(/\s+/g, '').length / 15 + 1.5;

/**
 * Hiyerarşi: ikincil hareket kahramanın yolunun %50–70'i kadar gider ve
 * 100–200 ms sonra başlar; ortam %5'in altında, yavaş sinüste.
 */
export const RANK = {
  secondary: { travel: 0.6, delayMs: 150 },
  ambient: { travel: 0.04, periodS: 6 },
} as const;

/** Sonraki öğe öncekinin %30–50'si bitince başlasın: kademe = süre × overlap. */
export const cascade = (durationMs: number, overlap = 0.4) => durationMs * overlap;

/** Döngü fazı: N kare, 0..N−1; N. kare 0. karedir — ikisini birden gösterme. */
export const loopPhase = (frame: number, frames: number) => (((frame % frames) + frames) % frames) / frames;
