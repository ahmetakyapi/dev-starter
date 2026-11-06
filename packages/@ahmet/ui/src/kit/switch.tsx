// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { ComponentProps, ReactNode } from 'react'
import { cn } from "../utils"

/**
 * Anahtar: ANINDA etki eden aç/kapa ayarı ("Bildirimler", "Koyu Tema").
 * Kaydet düğmesine bağlı bir seçimse `checkbox.tsx`: kullanıcı anahtarın
 * çevrildiği anda bir şey olmasını bekler.
 *
 * YEREL GİRİŞ: `<input type="checkbox" role="switch">`. JavaScript'siz
 * çalışır, formla birlikte gönderilir (`name`, `value`), sunucu eylemine
 * doğrudan bağlanır ve sunucu bileşeninde çizilebilir. Ekran okuyucu
 * "anahtar, açık" der. Giriş görünmez ama ERİŞİLEBİLİR (`sr-only`, `hidden`
 * değil); görünen ray onun `peer` durumunu izler.
 *
 * HİS ("board" dili, 2026-11): tutamak YAYLA kayar, hafifçe aşıp oturur;
 * basılı tutarken gideceği yöne doğru UZAR (iOS'taki gibi: kapalıyken
 * sağa, açıkken sola). Uzama `scale-x`, genişlik değil: genişlik geçişi
 * her karede düzen hesaplatır. Yay CSS `linear()` ile örneklenmiş bir
 * spring (SPRING.snappy'nin hissi); bileşen sunucuda kalabilsin diye
 * motion/react'e gerek yok. Hareketi azaltan kullanıcıda tutamak sıçrar.
 *
 * KONTRAST (WCAG 1.4.11, 3:1): tutamak her durumda rayından ayrışmalı.
 * Kapalı ray `bg-muted` (açıkta 5,3:1, koyuda 3,4:1 beyaz tutamağa karşı);
 * kapalı tutamak `bg-on-brand` (her temada beyaz). Açıkken ray vurgu,
 * tutamak `on-primary`: koyu temada açık mavi raya beyaz tutamak 2,1:1
 * kalırdı. Boardui'nin açık gri rayı bu yüzden alınmadı.
 *
 * Dokunma hedefi etiketin tamamı (en az 44 piksel yükseklik); rayın kendisi
 * küçük kalabilir.
 */

/* Örneklenmiş yay (stiffness 420, damping 26); checkbox.tsx ve
   radio-group.tsx aynı bloğu taşır, React aynı `href`i bir kez basar. */
const SPRING_CSS = `
.ui-spring {
  transition-duration: 460ms;
  transition-timing-function: var(--ease-brand);
  transition-timing-function: linear(0, 0.07, 0.232, 0.427, 0.618, 0.78, 0.905, 0.992, 1.044, 1.07, 1.076, 1.07, 1.057, 1.042, 1.028, 1.016, 1.007, 1, 0.996, 0.995, 0.994, 0.995, 0.996, 0.997, 1);
}
`

type SwitchProps = Omit<ComponentProps<'input'>, 'type' | 'role' | 'size'> & {
  label: ReactNode
  /** Etiketin altında cümle düzeninde açıklama. */
  hint?: ReactNode
  /** Ray solda mı sağda mı. Ayar listelerinde sağda, satır içinde solda. */
  placement?: 'start' | 'end'
}

export function Switch({
  label,
  hint,
  placement = 'end',
  className,
  disabled,
  ...props
}: SwitchProps) {
  return (
    <label
      className={cn(
        'group/switch relative flex min-h-11 cursor-pointer items-center gap-3 py-1.5',
        placement === 'end' && 'justify-between',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <style href="ui-spring" precedence="default">
        {SPRING_CSS}
      </style>
      <input
        type="checkbox"
        role="switch"
        disabled={disabled}
        className="peer sr-only"
        {...props}
      />
      <span className={cn('min-w-0', placement === 'start' && 'order-2')}>
        <span className="block text-base font-medium text-strong">{label}</span>
        {hint ? <span className="mt-0.5 block text-small text-muted">{hint}</span> : null}
      </span>
      <span
        aria-hidden
        className={cn(
          'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full bg-muted p-0.5 transition-colors duration-200',
          'peer-checked:bg-primary',
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-line-focus peer-focus-visible:outline-solid',
          placement === 'start' && 'order-1',
        )}
      >
        <span
          className={cn(
            'ui-spring block size-5 origin-left rounded-full bg-on-brand shadow-raised transition-[translate,scale,background-color]',
            'group-has-[:checked]/switch:translate-x-4 group-has-[:checked]/switch:origin-right group-has-[:checked]/switch:bg-on-primary',
            !disabled && 'group-active/switch:scale-x-[1.2]',
          )}
        />
      </span>
    </label>
  )
}
