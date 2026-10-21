'use client'

import { useSyncExternalStore } from 'react'

/**
 * Gerçek bir fare var mı: `(hover: hover) and (pointer: fine)`.
 *
 * Mıknatıs, eğim ve parlaklık yalnızca bunda anlamlı. iOS dokunuşta da
 * `mousemove` gönderir, `mouseleave` ise ancak başka yere dokununca gelir:
 * kapısız efekt dokunulan yerde takılı kalır (mistakes.md #94). Eşik
 * genişlik değil işaretçi türü. Sorgu theme/index.css'teki imleç kuralıyla
 * aynı. Kaynak: landing şablonu `hooks/useFinePointer.ts`.
 */
const QUERY = '(hover: hover) and (pointer: fine)'

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

const getSnapshot = () => window.matchMedia(QUERY).matches
// Sunucu işaretçiyi bilemez: efektsiz çizilir, hidrasyonda açılır.
const getServerSnapshot = () => false

export function useFinePointer(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
