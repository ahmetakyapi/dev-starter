import type { ReactNode } from "react";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Grafik hikâyelerinin sahnesi. `ChartCard` kendisi gri bir kuyu
 * (`bg-surface`); onu bir de `Frame` kuyusuna koymak iki aynı gri yaratır,
 * sınır kaybolur. Bu yüzden grafik sayfa zemininde, yalnızca genişliği
 * sınırlı durur: boardui vitrinindeki gibi beyaz sayfa, gri kart, beyaz karo.
 */
export function Sahne({ children, width = "md", className }: { children: ReactNode; width?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const w = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl", xl: "max-w-5xl" }[width];
  return <div className={cn("mx-auto w-[min(100vw-2rem,64rem)]", className)}><div className={cn("mx-auto w-full", w)}>{children}</div></div>;
}

/** Galeri hücresi: `Cell` gibi etiketli, ama zeminsiz (kart kendi kuyusunu getirir). */
export function GrafikHucre({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <figure className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="min-w-0">{children}</div>
      <figcaption className="px-1 text-small font-medium text-muted">{label}</figcaption>
    </figure>
  );
}

const DONEMLER = [
  { value: "7g", label: "Son 7 Gün" },
  { value: "30g", label: "Son 30 Gün" },
  { value: "90g", label: "Son 90 Gün" },
  { value: "yil", label: "Bu Yıl" },
] as const;

/** Kartın sağ üstündeki dönem seçici (`select.tsx`), görünür etiketsiz. */
export function Donem({ label = "Dönem", defaultValue = "7g" }: { label?: string; defaultValue?: string }) {
  return <Select label={label} hideLabel items={DONEMLER} defaultValue={defaultValue} />;
}

/**
 * Lejant karosunun noktasız eşi: grafiğin özet sayıları ("En İyi Ay",
 * "Günlük Ortalama"). Seri rengi yok, çünkü bir seriyi açıklamıyor.
 */
export function OzetKarolari({ items, columns = 2 }: { items: readonly { label: string; value: string }[]; columns?: 2 | 4 }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-1.5 px-1 pb-1", columns === 4 && "sm:grid-cols-4")}>
      {items.map((item) => (
        <div key={item.label} className="rounded-lg bg-overlay px-3 py-2.5 shadow-raised">
          <dt className="truncate text-small text-muted">{item.label}</dt>
          <dd className="mt-0.5 text-base font-semibold text-strong tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
