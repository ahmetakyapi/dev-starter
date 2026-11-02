import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Radyo grubu: birbirini dışlayan 2-6 seçenek, hepsi aynı anda görünür.
 * Yedi ve üstü seçenekte `select.tsx`; 2-4 kısa seçenekte ve anında etki
 * ediyorsa `segmented-control.tsx`.
 *
 * YEREL: `<fieldset>` + `<legend>` + aynı `name`li radyolar. Tarayıcı ok
 * tuşu gezinmesini, tek Tab durağını ve form gönderimini kendisi yapar;
 * JavaScript'siz çalışır, sunucu bileşeninde çizilir. Ekran okuyucu grubun
 * adını (legend) ve "3 seçenekten 2." bilgisini kendisi söyler.
 *
 * İÇ NOKTA YAYLA GELİR ("board" dili, 2026-11): seçilince halka vurguyla
 * dolar, ortadaki beyaz nokta 0,4'ten yayla büyür (yoktan değil: nesne
 * sıfır ölçekten patlamaz) ve hafifçe aşıp oturur. Yay CSS `linear()` ile
 * örneklenmiş bir spring; sunucu bileşeni kalır. Basılıyken halka 0,92'ye
 * çöker. Hareketi azaltan kullanıcıda nokta anında belirir (globals.css).
 *
 * Kontrollü kullanım gerekiyorsa (`value` + `onChange`) bu dosyayı istemci
 * bileşeninde çağır; giriş prop'ları olduğu gibi geçer.
 */

/* Örneklenmiş yay (stiffness 420, damping 26); checkbox.tsx ve switch.tsx
   aynı bloğu taşır, React aynı `href`i bir kez basar. */
const SPRING_CSS = `
.ui-spring {
  transition-duration: 460ms;
  transition-timing-function: var(--ease-brand);
  transition-timing-function: linear(0, 0.07, 0.232, 0.427, 0.618, 0.78, 0.905, 0.992, 1.044, 1.07, 1.076, 1.07, 1.057, 1.042, 1.028, 1.016, 1.007, 1, 0.996, 0.995, 0.994, 0.995, 0.996, 0.997, 1);
}
`

export type RadioOption = { value: string; label: ReactNode; hint?: ReactNode; disabled?: boolean }

type RadioGroupProps = {
  name: string
  /** Grubun adı (legend): Title Case. */
  legend: ReactNode
  options: readonly RadioOption[]
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
  /** Legend'ı görsel olarak gizle (adı başka bir başlık zaten söylüyorsa). */
  hideLegend?: boolean
  orientation?: 'vertical' | 'horizontal'
  required?: boolean
  className?: string
}

export function RadioGroup({
  name,
  legend,
  options,
  defaultValue,
  value,
  onChange,
  hideLegend = false,
  orientation = 'vertical',
  required,
  className,
}: RadioGroupProps) {
  return (
    <fieldset className={cn('min-w-0', className)}>
      <style href="ui-spring" precedence="default">
        {SPRING_CSS}
      </style>
      <legend className={hideLegend ? 'sr-only' : 'mb-1 text-small font-semibold text-strong'}>
        {legend}
      </legend>
      <div className={cn('flex', orientation === 'vertical' ? 'flex-col' : 'flex-wrap gap-x-6')}>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex min-h-11 cursor-pointer items-start gap-3 py-2.5',
              option.disabled ? 'cursor-not-allowed opacity-50' : 'group/radio',
            )}
          >
            <span className="ui-spring relative mt-[0.1875rem] grid size-[1.125rem] shrink-0 place-items-center transition-[scale] group-active/radio:scale-[0.92]">
              <input
                type="radio"
                name={name}
                value={option.value}
                disabled={option.disabled}
                required={required}
                defaultChecked={value === undefined ? option.value === defaultValue : undefined}
                checked={value === undefined ? undefined : option.value === value}
                onChange={onChange ? () => onChange(option.value) : undefined}
                className="peer absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-full border border-line-strong bg-overlay shadow-raised transition-colors checked:border-primary checked:bg-primary hover:border-primary-soft disabled:cursor-not-allowed"
              />
              <span
                aria-hidden
                className="ui-spring pointer-events-none relative size-[0.4375rem] scale-[0.4] rounded-full bg-on-primary opacity-0 transition-[scale,opacity] peer-checked:scale-100 peer-checked:opacity-100"
              />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-medium text-strong">{option.label}</span>
              {option.hint ? (
                <span className="mt-0.5 block text-small text-muted">{option.hint}</span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
