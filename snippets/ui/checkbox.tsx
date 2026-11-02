import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Onay kutusu: kaydet düğmesine bağlı ya da çoklu seçim. Anında etki eden
 * ayar için `switch.tsx`.
 *
 * YEREL GİRİŞ, `appearance-none` ile çizilmiş: JavaScript'siz çalışır,
 * formla gönderilir, sunucu bileşeninde çizilir, tarayıcının `:checked`,
 * `:indeterminate`, `:disabled`, `:focus-visible` durumları doğrudan stil
 * olur.
 *
 * TİK ÇİZİLEREK GELİR ("board" dili, 2026-11): yol `pathLength="1"` ile
 * normalleşir, `stroke-dashoffset` 1'den 0'a iner; işaret kalemle atılmış
 * gibi soldan sağa akar. Değer SVG'de KALITIMLA geçer: geçiş `<svg>`de,
 * yol onu miras alır, bu yüzden `peer-checked:` yeter (seçici gerekmez).
 * Kutu basılıyken hafifçe çöker (0,92), bırakınca yayla döner. Yay, CSS
 * `linear()` ile örneklenmiş bir spring (SPRING.snappy'nin hissi) ve
 * sunucu bileşeni kalabilsin diye motion/react'e ihtiyaç duymaz.
 * Desteklemeyen tarayıcı imza eğrisine düşer; hareketi azaltan kullanıcıda
 * globals.css süreleri sıfırlar, tik anında belirir.
 *
 * Belirsiz durum (`indeterminate`) yalnızca DOM özelliği, HTML özniteliği
 * yok: gerekiyorsa istemci bileşeninde `ref` ile `el.indeterminate = true`.
 * Çizgi de aynı yolla çizilir.
 *
 * Kutu 18 piksel ama dokunma hedefi etiketin tamamı (en az 44 piksel).
 * Etiketsiz kullanma; tablo satırı seçimi gibi görünür etiketin olmadığı
 * yerde `aria-label` ver.
 */

/* Örneklenmiş yay (stiffness 420, damping 26): %7,6 aşma, 460 ms'de oturur.
   switch.tsx ve radio-group.tsx aynı bloğu taşır; `href` aynı olduğundan
   React sayfaya bir kez basar. */
const SPRING_CSS = `
.ui-spring {
  transition-duration: 460ms;
  transition-timing-function: var(--ease-brand);
  transition-timing-function: linear(0, 0.07, 0.232, 0.427, 0.618, 0.78, 0.905, 0.992, 1.044, 1.07, 1.076, 1.07, 1.057, 1.042, 1.028, 1.016, 1.007, 1, 0.996, 0.995, 0.994, 0.995, 0.996, 0.997, 1);
}
`

type CheckboxProps = Omit<ComponentProps<'input'>, 'type' | 'size'> & {
  label?: ReactNode
  hint?: ReactNode
}

/* İşaret katmanı: girişin ÜSTÜNDE ama tıklamayı geçirir. Çizgi başta
   gizli (offset 1), görünürken 0. Opaklık da eşlik eder: yuvarlak uç sıfır
   uzunluktaki çizgide bile nokta bırakırdı. */
const MARK =
  'pointer-events-none absolute inset-0 m-auto size-3 text-on-primary opacity-0 [stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset,opacity] duration-200 ease-[var(--ease-brand)]'

export function Checkbox({ label, hint, className, disabled, ...props }: CheckboxProps) {
  const box = (
    <span className="ui-spring relative grid size-[1.125rem] shrink-0 place-items-center transition-[scale] has-[input:enabled:active]:scale-[0.92] group-active/check:scale-[0.92]">
      <style href="ui-spring" precedence="default">
        {SPRING_CSS}
      </style>
      <input
        type="checkbox"
        disabled={disabled}
        className={cn(
          'peer absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-[0.3125rem] border border-line-strong bg-overlay shadow-raised transition-[background-color,border-color]',
          'checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary',
          'hover:border-primary-soft disabled:cursor-not-allowed',
          !label && className,
        )}
        {...props}
      />
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className={cn(
          MARK,
          'peer-checked:opacity-100 peer-checked:[stroke-dashoffset:0] peer-checked:delay-75 peer-indeterminate:opacity-0',
        )}
      >
        <path
          d="m3.5 8.5 3 3 6-7"
          pathLength={1}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className={cn(
          MARK,
          'peer-indeterminate:opacity-100 peer-indeterminate:[stroke-dashoffset:0]',
        )}
      >
        <path
          d="M4 8h8"
          pathLength={1}
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )

  if (!label) return box

  return (
    <label
      className={cn(
        'flex min-h-11 cursor-pointer items-start gap-3 py-2.5',
        disabled ? 'cursor-not-allowed opacity-50' : 'group/check',
        className,
      )}
    >
      <span className="mt-[0.1875rem]">{box}</span>
      <span className="min-w-0">
        <span className="block text-base font-medium text-strong">{label}</span>
        {hint ? <span className="mt-0.5 block text-small text-muted">{hint}</span> : null}
      </span>
    </label>
  )
}
