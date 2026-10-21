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
 * Aynı dosyada `useLayer`: katman yığını, Escape ve odak (aşağıda). Modal,
 * Drawer ve Confirm ikisini birlikte çağırır; sayaç da yığın da modül
 * düzeyinde tek olmalı, bu yüzden aynı dosyadalar.
 *
 * Kullanım:
 *   useScrollLock(open)
 *   useLayer(open, onClose, panelRef)              // panel: tabIndex={-1}
 *   useLayer(open, onCancel, panelRef, cancelRef)  // ilk odak belirli bir düğmede
 */

'use client'

import { useEffect, useEffectEvent, type RefObject } from 'react'

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

// Açık katmanların panelleri, açılış sırasıyla; sonuncusu en üstte
const layers: Element[] = []

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[contenteditable]',
  '[tabindex]',
].join(',')

/**
 * useLayer — açık katmanın klavye ve odak sözleşmesi
 *
 * `aria-modal="true"` ekran okuyucuya "arkası yok" der; odak arkada kalırsa
 * bu vaat boşa düşer. Hook üç şeyi tutar:
 *
 *   1. Açılışta odak panele (`tabIndex={-1}`) ya da `initialFocus`a gider,
 *      kapanınca açan öğeye döner (o öğe sayfadan kalktıysa tarayıcıya kalır).
 *   2. Tab ve Shift+Tab panelin içinde döner, arkadaki sayfaya kaçmaz.
 *   3. Escape ve Tab yalnızca EN ÜSTTEKİ katmanda işler. Her katman kendi
 *      dinleyicisini koşulsuz kurunca modalın üstündeki onayda tek Escape
 *      yanlış katmanı (ya da ikisini birden) kapatıyor, modaldaki yazılmış
 *      form gidiyordu.
 *
 * İlk odağı `autoFocus` ile değil `initialFocus` ile ver: autoFocus odağı bu
 * hook açanı kaydetmeden taşır, kapanışta odağın döneceği yer kaybolur.
 * Yerel `<dialog>` (`snippets/ui/dialog.tsx`) bu yığına girmez; ikisini üst
 * üste açma.
 */
export function useLayer(
  open: boolean,
  onClose: () => void,
  panel: RefObject<HTMLElement | null>,
  initialFocus?: RefObject<HTMLElement | null>,
) {
  // Satır içi `onClose={() => setOpen(false)}` her çizimde yeni fonksiyon;
  // bağımlılıkta dursa etki her çizimde yeniden kurulur ve odağı başa çeker.
  // `useEffectEvent` React 19.2'de; daha eskisinde etkide güncellenen bir ref.
  const close = useEffectEvent(onClose)

  useEffect(() => {
    const node = panel.current
    if (!open || !node) return
    layers.push(node)
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!node.contains(opener)) (initialFocus?.current ?? node).focus()

    const onKey = (e: KeyboardEvent) => {
      // İçteki bir bileşen (açılır liste, popover) tuşu kendisi işlediyse dokunma
      if (e.defaultPrevented || layers[layers.length - 1] !== node) return
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== 'Tab') return
      // Görünmeyen öğe (`hidden md:block`, kapalı `<details>`) sekme sırasında
      // yok sayılır; listede kalırsa "son öğe" o olur ve Tab panelden kaçar.
      // Sıra seçiciden değil öğenin gerçek `tabIndex`inden okunur: gezici
      // sekmeli gruplar (segmented control, sekmeler) pasif düğmelerine
      // `tabIndex={-1}` verir; seçici onları sayarsa "son öğe" tarayıcının hiç
      // uğramadığı düğme olur ve Tab yine panelden kaçar.
      // Düzen hesaplamayan ortamda (jsdom testleri) hiçbir öğenin kutusu
      // yoktur: süzgeç her şeyi atacaksa yalnız sekme sırası süzülür.
      const all = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
      const tabbable = all.filter((el) => el.tabIndex >= 0)
      const visible = tabbable.filter((el) => el.getClientRects().length > 0)
      const items = visible.length > 0 ? visible : tabbable
      if (items.length === 0) {
        e.preventDefault()
        node.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      const inside = active !== node && node.contains(active)
      if (e.shiftKey ? !inside || active === first : !inside || active === last) {
        e.preventDefault()
        ;(e.shiftKey ? last : first).focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      layers.splice(layers.indexOf(node), 1)
      // Panel çıkış animasyonunda hâlâ DOM'da; odak oradaki bir öğeye dönmesin.
      // Açan öğe aynı anda kapanan alttaki katmandaysa da (onaylanınca modal da
      // kapanır) dönmez: kardeş sırasında bu temizlik modalınkinden SONRA
      // çalışır ve odağı kaybolacak düğmeye geri çekerdi.
      const host = opener?.closest('[aria-modal="true"]')
      if (opener?.isConnected && !node.contains(opener) && (!host || layers.includes(host))) {
        opener.focus()
      }
    }
  }, [open, panel, initialFocus])
}
