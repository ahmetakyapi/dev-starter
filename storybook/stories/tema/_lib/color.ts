/**
 * WCAG 2.x kontrast hesabı — tests/contract.test.ts ile aynı formül.
 * Yarı saydam renk (`rgb(0 0 0 / 0.03)`) önce zemine BİNDİRİLİR, sonra
 * ölçülür: gözün gördüğü renk odur.
 */

export type RGBA = { r: number; g: number; b: number; a: number };

const NUM = /-?\d*\.?\d+%?/g;

/** `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()` / `rgba()` (virgüllü ya da boşluklu). */
export function parseColor(input: string): RGBA | null {
  const s = input.trim().toLowerCase();
  if (s.startsWith("#")) {
    let h = s.slice(1);
    if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
  }
  if (s.startsWith("rgb")) {
    const parts = s.match(NUM);
    if (!parts || parts.length < 3) return null;
    const ch = (v: string) => (v.endsWith("%") ? (parseFloat(v) / 100) * 255 : parseFloat(v));
    const alpha = parts[3] === undefined ? 1 : parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    return { r: ch(parts[0]), g: ch(parts[1]), b: ch(parts[2]), a: alpha };
  }
  return null;
}

/** Üstteki rengi alttakine bindirir (alfa birleştirme). Alt renk opak sayılır. */
export function composite(top: RGBA, bottom: RGBA): RGBA {
  const a = top.a;
  return {
    r: top.r * a + bottom.r * (1 - a),
    g: top.g * a + bottom.g * (1 - a),
    b: top.b * a + bottom.b * (1 - a),
    a: 1,
  };
}

function channel(v: number) {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance({ r, g, b }: RGBA) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: RGBA, b: RGBA) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Değer (zemine bindirilerek) ile zemin arasındaki oran. Çözülemezse null. */
export function ratioOn(value: string, background: string, middle?: string): number | null {
  const bg = parseColor(background);
  const fg = parseColor(value);
  if (!bg || !fg) return null;
  let base = bg;
  if (middle) {
    const mid = parseColor(middle);
    if (!mid) return null;
    base = composite(mid, bg);
  }
  return contrast(composite(fg, base), base);
}

/** Degradenin duraklarından en kötü oranı: `linear-gradient(…, #1673c4 0%, #0b3f86 100%)`. */
export function worstOnGradient(text: string, gradient: string): number | null {
  const stops = gradient.match(/#[0-9a-f]{3,8}\b/gi);
  const fg = parseColor(text);
  if (!stops || !fg) return null;
  return Math.min(...stops.map((s) => contrast(fg, parseColor(s) as RGBA)));
}

export function sameColor(a: string, b: string, tolerance = 0.012) {
  const x = parseColor(a);
  const y = parseColor(b);
  if (!x || !y) return a.replace(/\s/g, "") === b.replace(/\s/g, "");
  return (
    Math.abs(x.r - y.r) < 1.5 && Math.abs(x.g - y.g) < 1.5 && Math.abs(x.b - y.b) < 1.5 && Math.abs(x.a - y.a) <= tolerance
  );
}

const fmt = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatRatio = (r: number) => `${fmt.format(r)}:1`;

export type Verdict = { label: string; tone: "success" | "warning" | "danger" | "neutral" };

/** Metin için WCAG düzeyi. */
export function textVerdict(r: number): Verdict {
  if (r >= 7) return { label: "AAA", tone: "success" };
  if (r >= 4.5) return { label: "AA", tone: "success" };
  if (r >= 3) return { label: "Büyük Metin", tone: "warning" };
  return { label: "Metin Değil", tone: "danger" };
}
