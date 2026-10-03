"use client";

import { m, useMotionValue, useSpring } from "motion/react";
import type { MouseEvent, ReactNode } from "react";
import { useFinePointer } from "@/hooks/useFinePointer";
import { useMotionPreference } from "@/hooks/useMotionPreference";

/**
 * Fareyle hafifçe eğilen kart. Eğim küçük (en fazla 4 derece): kartın bir
 * yüzey olduğunu hissettirir, okumayı bozmaz. Parlama ya da ışık izi yok;
 * degrade disiplini kart yüzeyine degrade koymayı yasaklıyor.
 *
 * Dokunmatikte ve hareketi azaltanda düz `div`.
 */
const MAX_TILT = 4;
const SPRING = { stiffness: 260, damping: 26 } as const;

export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const fine = useFinePointer();
  const reduce = useMotionPreference();
  const rotateX = useSpring(useMotionValue(0), SPRING);
  const rotateY = useSpring(useMotionValue(0), SPRING);

  if (!fine || reduce) return <div className={className}>{children}</div>;

  function onMove(event: MouseEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const nx = (event.clientX - box.left) / box.width - 0.5;
    const ny = (event.clientY - box.top) / box.height - 0.5;
    rotateX.set(-ny * MAX_TILT);
    rotateY.set(nx * MAX_TILT);
  }

  function onLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <m.div
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
    >
      {children}
    </m.div>
  );
}
