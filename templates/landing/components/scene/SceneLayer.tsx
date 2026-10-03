"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { useMotionPreference } from "@/hooks/useMotionPreference";

/**
 * Hero'nun parçacık sahnesi için kapı. Sahne (three + R3F, ~230 KB) yalnızca
 * gerçekten oynayacaksa indirilir:
 *
 *  - hareket serbest (`prefers-reduced-motion` yok),
 *  - hassas işaretçi VE en az 768 piksel genişlik.
 *
 * Telefonda ve hareketi azaltanda paket hiç inmez; altta duran `.hero-glow`
 * CSS ışıması tek görünen olur. Sunucu çiziminde de o var: sahne gelince
 * üstüne biner, gelmezse sayfa eksik görünmez.
 *
 * `ssr: false` bir istemci bileşeninin içinde olmak zorunda (Next 16), bu
 * yüzden kapı da istemcide.
 */
const ParticleField = dynamic(() => import("./ParticleField"), { ssr: false, loading: () => null });

const QUERY = "(pointer: fine) and (min-width: 768px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function SceneLayer() {
  const capable = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
  const reduce = useMotionPreference();
  if (!capable || reduce) return null;
  return <ParticleField />;
}
