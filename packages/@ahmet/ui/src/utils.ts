import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Tema paketinin rol adlı punto ölçeği (theme.css → `--text-*`).
 *
 * tailwind-merge bu adları tanımazsa `text-small`ı RENK sınıfı sanar ve
 * `cn('text-small', 'text-strong')` puntoyu sessizce siler: ikisi de
 * "text-color" grubuna düşer, sonuncu kazanır. Kayıt şart.
 */
const FONT_SIZES = ['micro', 'small', 'base', 'read', 'lead', 'title', 'heading', 'display', 'hero'] as const

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [...FONT_SIZES],
      // Kaydedilmeyen gölge adı gölge RENGİ sanılır ve `shadow-md` ile çakışmaz.
      // raised/floating/modal şablonlarla ortak adlar (theme.css köprüsü).
      shadow: ['overlay', 'raised', 'floating', 'modal'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
