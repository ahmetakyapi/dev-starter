// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { ComponentProps } from 'react'
import { cn } from "../utils"

/**
 * Rozet: kısa durum ya da kategori etiketi ("Taslak", "Tamamlandı",
 * "Bekliyor"). Etkileşimsiz; tıklanan bir etiket gerekiyorsa düğme ya da
 * bağlantı yap.
 *
 * Metin Title Case ve kısa (bir-iki kelime). Durum rozetinde renk TEK
 * işaret olmasın: `dot` küçük bir nokta ekler, ama asıl ayırt edici
 * metnin kendisi ("Hata" / "Tamam"); renk yalnızca hızlandırır.
 *
 * İKİ AİLE ("board" dili, 2026-11):
 *   DURUM tonları (`success` "Tamamlandı", `warning` "Bekliyor", `danger`,
 *     `primary`, `neutral`): yıkanmış zemin + aynı ailenin mürekkebi.
 *     Mürekkepler globals.css'te kendi wash'ı üstünde AA ölçülmüş.
 *   KATEGORİ tonları (`chart-1…6`): grafik paletinin pastel yıkaması
 *     (%22). Grafik rengi METİN rengi olamaz (açık zeminde AA tutmaz), bu
 *     yüzden yazı `text-strong`; renk zeminde ve noktada. Etiketleri
 *     grafikteki seriyle eşleştirmek için (aynı sıra, aynı renk).
 *
 * `variant`: `soft` (varsayılan) yıkanmış zemin; `outline` yalnızca çizgi,
 * yoğun tablolarda daha sessiz. `shape`: `pill` (varsayılan) ya da
 * `rounded` (8 piksel köşe; 24 piksel boyda 12 piksel zaten hap olurdu).
 */

const TONES = {
  neutral: {
    soft: 'bg-surface-raised text-body',
    outline: 'border-line-strong text-body',
    dot: 'bg-muted',
  },
  primary: {
    soft: 'bg-primary-wash text-primary-ink',
    outline: 'border-primary/40 text-primary-ink',
    dot: 'bg-primary',
  },
  success: {
    soft: 'bg-success-wash text-success',
    outline: 'border-success/40 text-success',
    dot: 'bg-success',
  },
  warning: {
    soft: 'bg-warning-wash text-warning',
    outline: 'border-warning/40 text-warning',
    dot: 'bg-warning',
  },
  danger: {
    soft: 'bg-danger-wash text-danger',
    outline: 'border-danger/40 text-danger',
    dot: 'bg-danger',
  },
  'chart-1': {
    soft: 'bg-chart-1/22 text-strong',
    outline: 'border-chart-1 text-strong',
    dot: 'bg-chart-1',
  },
  'chart-2': {
    soft: 'bg-chart-2/22 text-strong',
    outline: 'border-chart-2 text-strong',
    dot: 'bg-chart-2',
  },
  'chart-3': {
    soft: 'bg-chart-3/22 text-strong',
    outline: 'border-chart-3 text-strong',
    dot: 'bg-chart-3',
  },
  'chart-4': {
    soft: 'bg-chart-4/22 text-strong',
    outline: 'border-chart-4 text-strong',
    dot: 'bg-chart-4',
  },
  'chart-5': {
    soft: 'bg-chart-5/22 text-strong',
    outline: 'border-chart-5 text-strong',
    dot: 'bg-chart-5',
  },
  'chart-6': {
    soft: 'bg-chart-6/22 text-strong',
    outline: 'border-chart-6 text-strong',
    dot: 'bg-chart-6',
  },
} as const

type BadgeProps = ComponentProps<'span'> & {
  tone?: keyof typeof TONES
  variant?: 'soft' | 'outline'
  shape?: 'pill' | 'rounded'
  dot?: boolean
}

export function Badge({
  tone = 'neutral',
  variant = 'soft',
  shape = 'pill',
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 border border-transparent px-2.5 text-small font-medium whitespace-nowrap',
        shape === 'pill' ? 'rounded-full' : 'rounded-sm px-2',
        TONES[tone][variant],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', TONES[tone].dot)} />
      ) : null}
      {children}
    </span>
  )
}
