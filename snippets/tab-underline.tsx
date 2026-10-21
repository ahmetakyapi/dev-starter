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
 * Erişilebilirlik: `tablist` / `tab` rolleri, `aria-selected`, ok tuşları
 * ve Home/End ile gezinme (yalnızca seçili sekme Tab sırasında). Sekme
 * paneline `idPrefix` + `tabPanelProps` ile bağlanır (`aria-controls` ↔
 * `aria-labelledby`); bağlanmayan sekme ekran okuyucuda hiçbir şeyi
 * denetlemeyen bir sekmedir. Hareketi azaltan okuyucuda MotionConfig
 * reducedMotion="user" kaymayı anlık konum değişimine çevirir.
 *
 * Panelleri de kendisi çizen, `domMax` gerektirmeyen tam sekme bileşeni:
 * `snippets/ui/tabs.tsx`. Bu dosya kayan çizginin kendisi gerektiğinde.
 *
 * Kullanım:
 *   const [tab, setTab] = useState('genel')
 *   <TabUnderline
 *     tabs={[{ id: 'genel', label: 'Genel' }, { id: 'ayarlar', label: 'Ayarlar' }]}
 *     value={tab}
 *     onChange={setTab}
 *     idPrefix="profil"
 *   />
 *   <div {...tabPanelProps('profil', tab)}>…</div>
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
  /** Panelleri bağlar; aynı önek `tabPanelProps`a verilir. Sayfada tekil olmalı. */
  idPrefix?: string
  className?: string
}

/** Seçili sekmenin paneli: `<div {...tabPanelProps(idPrefix, value)}>` */
export function tabPanelProps(idPrefix: string, id: string) {
  return {
    role: 'tabpanel',
    id: `${idPrefix}-panel-${id}`,
    'aria-labelledby': `${idPrefix}-tab-${id}`,
    // Odaklanabilir içerik yoksa panel Tab sırasında kendisi durak olur
    tabIndex: 0,
  } as const
}

export function TabUnderline({ tabs, value, onChange, idPrefix, className }: TabUnderlineProps) {
  const uid = useId()
  const layoutId = `tab-underline-${uid}`
  const prefix = idPrefix ?? uid
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const last = tabs.length - 1
    const nextIndex =
      e.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : -1
    if (nextIndex < 0) return
    e.preventDefault()
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
              id={`${prefix}-tab-${tab.id}`}
              // Panel yokken var olmayan kimliğe işaret etmesin: yalnızca önek verilince
              aria-controls={idPrefix ? `${idPrefix}-panel-${tab.id}` : undefined}
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
