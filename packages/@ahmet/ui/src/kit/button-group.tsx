// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { ComponentProps } from 'react'
import { cn } from "../utils"

/**
 * Birbirine bağlı düğmeler: "Önceki / Bugün / Sonraki", "Kopyala | ⌄" gibi.
 * Grup bir `role="group"` ve ADI var (`aria-label`); ekran okuyucu düğmeleri
 * neyin parçası olduğunu bilerek okur.
 *
 * İKİ GÖRÜNÜŞ ("board" dili, 2026-11):
 *   `attached` (varsayılan): kenarlar komşusuyla üst üste biner (`-ml-px`),
 *     iç köşeler düzleşir; tek parça bir satır. Çocuklar şablonun `Button`ı
 *     (`variant="secondary"`) ya da `IconButton`.
 *   `well`: gri kuyuda kaynaşmış satır; çocuklar `variant="ghost"`. Basılı
 *     (`aria-pressed="true"`) düğme BEYAZ KARO olur (`bg-overlay` +
 *     `shadow-raised`): araç çubuğundaki "Kalın / İtalik" gibi aç-kapa
 *     düğmeleri için.
 *
 * Seçim TEK ise (biri seçili, ötekiler değil) bu değil `segmented-control.tsx`:
 * orada seçili durum `aria-checked` ile söylenir ve gösterge kayar. Bu
 * bileşende her düğme kendi işini yapar; `aria-pressed` bağımsız aç-kapa.
 *
 * Odak halkası komşunun altında kalmasın diye odaklı düğme öne alınır (`z-10`).
 */

type ButtonGroupProps = ComponentProps<'div'> & {
  'aria-label': string
  orientation?: 'horizontal' | 'vertical'
  variant?: 'attached' | 'well'
}

export function ButtonGroup({
  orientation = 'horizontal',
  variant = 'attached',
  className,
  ...props
}: ButtonGroupProps) {
  return (
    <div
      role="group"
      className={cn(
        'inline-flex isolate [&>*]:relative [&>*:focus-visible]:z-10 [&>*:hover]:z-[1]',
        orientation === 'vertical' && 'flex-col',
        variant === 'attached' &&
          (orientation === 'horizontal'
            ? '[&>*:not(:first-child)]:-ml-px [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none'
            : '[&>*:not(:first-child)]:-mt-px [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none'),
        variant === 'attached' &&
          '[&>[aria-pressed=true]]:bg-surface-raised! [&>[aria-pressed=true]]:text-strong!',
        variant === 'well' &&
          'gap-0.5 rounded-md bg-surface-sunken shadow-well p-1 [&>*]:rounded-sm! [&>[aria-pressed=true]]:bg-overlay! [&>[aria-pressed=true]]:text-strong! [&>[aria-pressed=true]]:shadow-raised!',
        className,
      )}
      {...props}
    />
  )
}
