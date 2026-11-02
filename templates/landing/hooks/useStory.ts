"use client";

import { useInView } from "motion/react";
import { useEffect, useState, type RefObject } from "react";
import { useMotionPreference } from "@/hooks/useMotionPreference";

/**
 * Ürün demolarının tek saati (guides/04-motion.md § 14).
 *
 * `tick` 0'da başlar ve 0 TASARIMIN KENDİSİDİR (dinlenme karesi): sunucu
 * çizimi, hareketi azaltan okuyucu ve ekran dışındaki kart hep onu görür.
 * Saat yalnızca kartın %30'u görünürken işler; ekrandan çıkınca durur,
 * dönünce kaldığı yerden sürer (kaydırma dinleyicisi yok, gözlemci var).
 *
 * `startDelay`: aynı ekrandaki kartlar aynı anda oynamasın diye ilk adımın
 * gecikmesi (okuma sırasına göre kaydırılır).
 */
export function useStory(
  ref: RefObject<Element | null>,
  { interval, startDelay = 0 }: { interval: number; startDelay?: number },
): number {
  const visible = useInView(ref, { amount: 0.3 });
  const reduce = useMotionPreference();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!visible || reduce) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      setTick((value) => value + 1);
      timer = setInterval(() => setTick((value) => value + 1), interval);
    }, startDelay || interval);
    return () => {
      clearTimeout(start);
      if (timer) clearInterval(timer);
    };
  }, [visible, reduce, interval, startDelay]);

  return reduce ? 0 : tick;
}
