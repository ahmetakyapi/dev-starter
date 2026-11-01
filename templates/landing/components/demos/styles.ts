/**
 * Ürün demolarının ortak sınıfları ("board" dili). "use client" DEĞİL:
 * sunucu ve istemci bileşenleri aynı dizgileri okur.
 *
 * Kuyu → karo, TEK seviye: kart `bg-surface` gri kuyu, içindeki her parça
 * `bg-overlay` beyaz karo + kısa gölge. Karo içinde karo yok; ayrım kıl
 * çizgisi (`border-line-soft`) ve puntoyla.
 */
export const TILE = "rounded-lg bg-overlay shadow-raised";

/**
 * Seri renkleri YALNIZCA `--chart-1..6` (dolgu, metin değil). Sınıf adları
 * tam yazılır: Tailwind dinamik birleştirilen adı (`bg-chart-${n}`) görmez.
 */
export const CHART_BG = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5", "bg-chart-6"] as const;

export function chartBg(index: number): string {
  return CHART_BG[((index % CHART_BG.length) + CHART_BG.length) % CHART_BG.length];
}

/** Ad → iki harf (avatar). Türkçe büyük harf kuralıyla. */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toLocaleUpperCase("tr-TR");
}
