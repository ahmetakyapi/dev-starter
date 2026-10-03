/**
 * TabUnderline — seçili sekmenin altında kayan çizgi (`layoutId`)
 *
 * Çizgi tek bir öğe: sekme değişince eski konumundan yenisine KAYAR,
 * birinde söner ötekinde yanmaz. Bunu `layoutId` yapar ve layout
 * animasyonu `domAnimation`da YOK, `domMax`ta var. Uygulamanın
 * MotionProvider'ı domAnimation yüklüyor; bu bileşen kendi alt ağacına
 * domMax'ı iç içe bir LazyMotion ile ekler, böylece paketin geri kalanı
 * layout özelliğini taşımaz.
 *
 * `layoutId` sayfa genelinde TEKİL olmalı: aynı sayfada iki sekme çubuğu
 * aynı kimliği paylaşırsa çizgi bir çubuktan ötekine uçar. Kimlik
 * `useId` ile her örneğe ayrı üretilir.
 *
 * Erişilebilirlik: `tablist` / `tab` rolleri, `aria-selected`, ok tuşlarıyla
 * gezinme (yalnızca seçili sekme Tab sırasında). Hareketi azaltan okuyucuda
 * MotionConfig reducedMotion="user" kaymayı anlık konum değişimine çevirir.
 *
 * Kullanım:
 *   const [tab, setTab] = useState('genel')
 *   <TabUnderline
 *     tabs={[{ id: 'genel', label: 'Genel' }, { id: 'ayarlar', label: 'Ayarlar' }]}
 *     value={tab}
 *     onChange={setTab}
 *   />
 */

'use client'

import { useId, useRef } from 'react'
import { LazyMotion, domMax, m } from 'motion/react'

const SPRING = { type: 'spring', stiffness: 500, damping: 40 } as const

type Tab = { id: string; label: string }

type TabUnderlineProps = {
  tabs: readonly Tab[]
  value: string
  onChange: (id: string) => void
  className?: string
}

export function TabUnderline({ tabs, value, onChange, className }: TabUnderlineProps) {
  const layoutId = `tab-underline-${useId()}`
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const nextIndex = (index + step + tabs.length) % tabs.length
    onChange(tabs[nextIndex].id)
    refs.current[nextIndex]?.focus()
  }

  return (
    <LazyMotion features={domMax}>
      <div role="tablist" className={`flex gap-1 border-b border-line ${className ?? ''}`}>
        {tabs.map((tab, index) => {
          const selected = tab.id === value
          return (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[index] = el
              }}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={`relative h-11 px-4 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-line-focus ${
                selected ? 'text-strong' : 'text-muted hover:text-body'
              }`}
            >
              {tab.label}
              {selected && (
                <m.span
                  layoutId={layoutId}
                  transition={SPRING}
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
                />
              )}
            </button>
          )
        })}
      </div>
    </LazyMotion>
  )
}
