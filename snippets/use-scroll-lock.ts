/**
 * useScrollLock — katman açıkken arkadaki sayfanın kaymasını durdurur
 *
 * SAYAÇLI. Üst üste iki katman açıldığında (formun üstünde bir onay
 * diyaloğu) ilki kapanınca kilit erken çözülmez. Sayaçsız her katman
 * kapanışta `overflow = ''` yazıyordu: üstteki onay kapanınca alttaki modal
 * hâlâ açıkken sayfa kaymaya başlıyordu.
 *
 * Kilit `<html>`e kurulur, `body`ye değil: kaydırma kökte yaşıyor ve
 * `body { overflow: hidden }` bazı tarayıcılarda (iOS Safari) kökü durdurmaz.
 * Kaydırma çubuğu kaybolunca sayfa sağa sıçramasın diye çubuğun genişliği
 * `padding-right` olarak geri verilir.
 *
 * Kullanım:
 *   useScrollLock(open)
 */

'use client'

import { useEffect } from 'react'

let lockCount = 0
let previous: { overflow: string; paddingRight: string } | null = null

function lock() {
  lockCount += 1
  if (lockCount > 1) return
  const root = document.documentElement
  const scrollbar = window.innerWidth - root.clientWidth
  previous = { overflow: root.style.overflow, paddingRight: root.style.paddingRight }
  root.style.overflow = 'hidden'
  if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`
}

function unlock() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount > 0 || !previous) return
  const root = document.documentElement
  root.style.overflow = previous.overflow
  root.style.paddingRight = previous.paddingRight
  previous = null
}

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    lock()
    return unlock
  }, [active])
}
