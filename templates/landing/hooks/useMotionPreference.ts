"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;
// Sunucu tercihi bilemez; ilk boyamayı CSS'teki reduced-motion bloğu karşılar.
const getServerSnapshot = () => false;

/**
 * "Hareketi azalt" tercihi. Motion'ın `useReducedMotion`u değeri bağlanma
 * anında okur; bu kanca sayfa açıkken değişen tercihi de yakalar.
 */
export function useMotionPreference(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
