import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Hikâye çerçeveleri — boardui vitrini gibi: büyük yuvarlak gri kuyu, içinde
 * bileşen, altında ad + tek cümle. Bütün hikâyeler bunları kullanır ki katalog
 * tek bir el çıkmış gibi dursun.
 */

/** Tek bileşeni kuyunun ortasında gösterir. `width`: içeriğin en geniş hali. */
export function Frame({
  children,
  width = "md",
  className,
}: {
  children: ReactNode;
  width?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}) {
  const w = { sm: "max-w-xs", md: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl", full: "max-w-none" }[width];
  return (
    <div className={cn("w-[min(100vw-2rem,64rem)] rounded-2xl bg-surface p-6 sm:p-10", className)}>
      <div className={cn("mx-auto w-full", w)}>{children}</div>
    </div>
  );
}

/** Varyant galerisi: her hücre bir durum, altında küçük etiket. */
export function Gallery({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const c = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[cols];
  return <div className={cn("grid w-[min(100vw-2rem,72rem)] gap-4", c)}>{children}</div>;
}

export function Cell({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <figure className="flex flex-col gap-3">
      <div className={cn("grid min-h-40 place-items-center rounded-2xl bg-surface p-6", className)}>{children}</div>
      <figcaption className="px-1 text-small font-medium text-muted">{label}</figcaption>
    </figure>
  );
}

/** Tam sayfa ekranlar için: kenar boşluğu yok, sayfa zemini. */
export function Screen({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh w-full bg-page text-body">{children}</div>;
}
