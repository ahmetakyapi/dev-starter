import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Görsel zemin taklidi: cam ve buğu bükecek bir şey görsün diye birincil
 * renk ailesinin lekeleri ve ince çizgiler. Gerçek projede fotoğraf ya da çizim.
 */
export function Media({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative isolate grid min-h-80 place-items-center overflow-hidden rounded-2xl p-10", className)}>
      <div aria-hidden className="absolute inset-0 -z-10 bg-primary">
        <div className="absolute -top-16 left-[6%] size-64 rounded-full bg-primary-hover opacity-90 blur-2xl" />
        <div className="absolute right-[4%] bottom-[-3rem] size-72 rounded-full bg-primary-soft opacity-60 blur-2xl" />
        <div className="absolute inset-0 [background-image:repeating-linear-gradient(90deg,transparent_0_18px,color-mix(in_oklab,var(--on-brand)_16%,transparent)_18px_20px)]" />
      </div>
      {children}
    </div>
  );
}
