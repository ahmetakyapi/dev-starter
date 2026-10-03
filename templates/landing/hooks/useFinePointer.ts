"use client";

import { useSyncExternalStore } from "react";

/*
 * Mıknatıs ve eğim yalnızca GERÇEK bir fareyle anlamlı. Dokunmatikte
 * "üzerine gelme" yok; dokunuş öğeyi bir kez çekip bırakır ve düğme
 * parmağın altından kayar. Eşik genişlik değil işaretçi türü.
 */
const QUERY = "(hover: hover) and (pointer: fine)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;
// Sunucu işaretçiyi bilemez: efektsiz çizilir, hidrasyonda açılır.
const getServerSnapshot = () => false;

export function useFinePointer(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
