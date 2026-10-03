"use client";

import { m, useMotionValue, useSpring } from "motion/react";
import type { MouseEvent, ReactNode } from "react";
import { useFinePointer } from "@/hooks/useFinePointer";
import { useMotionPreference } from "@/hooks/useMotionPreference";

/**
 * İmlece doğru hafifçe çekilen sarmalayıcı: birincil eylemi "dokunulabilir"
 * gösterir. Konum motion value'da, React durumunda DEĞİL; fare her
 * kıpırdadığında ağaç yeniden çizilmez.
 *
 * Yalnızca `(hover: hover) and (pointer: fine)` ve hareket serbestken.
 * Aksi hâlde düz bir `span`: sunucu çizimi ile aynı, hidrasyon farkı yok.
 */
const PULL = 0.22;
const SPRING = { stiffness: 180, damping: 18, mass: 0.6 } as const;

export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const fine = useFinePointer();
  const reduce = useMotionPreference();
  const x = useSpring(useMotionValue(0), SPRING);
  const y = useSpring(useMotionValue(0), SPRING);

  if (!fine || reduce) return <span className={className ?? "inline-flex"}>{children}</span>;

  function onMove(event: MouseEvent<HTMLSpanElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - box.left - box.width / 2) * PULL);
    y.set((event.clientY - box.top - box.height / 2) * PULL);
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <m.span style={{ x, y }} onMouseMove={onMove} onMouseLeave={onLeave} className={className ?? "inline-flex"}>
      {children}
    </m.span>
  );
}
