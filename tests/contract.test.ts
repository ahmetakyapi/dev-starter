/**
 * Ekosistem sözleşme testleri.
 *
 * Buradaki her assertion, sessizce bozulduğunda HER projeyi etkileyen bir
 * değeri korur. Kapsam genişliği değil, kırılganlık önceliklidir:
 * `rules/bugfix-protocol.md` bir failing test ister ve `gate-agent.md` Pass 4
 * `npm test` çalıştırır — bu dosya ikisini de icra edilebilir kılar.
 */
import { describe, it, expect } from 'vitest'
import { EASE, fadeUp, fadeIn, staggerContainer } from '../packages/@ahmet/ui/src/variants'
import { cn } from '../packages/@ahmet/ui/src/utils'
import { animation, gradients, colors } from '../packages/@ahmet/theme/tokens'

describe('imza ease eğrisi', () => {
  // Ekosistemin tek geçiş eğrisi. Değişirse her projedeki her animasyonun
  // karakteri sessizce kayar — hiçbir build hatası vermeden.
  it('[0.22, 1, 0.36, 1] sabit kalır', () => {
    expect(EASE).toEqual([0.22, 1, 0.36, 1])
  })

  it('theme tokenı ile ui varyantları aynı eğriyi paylaşır', () => {
    expect([...animation.ease]).toEqual([...EASE])
  })

  it('tüm hazır varyantlar imza eğrisini kullanır', () => {
    for (const v of [fadeUp, fadeIn]) {
      const t = (v.visible as { transition?: { ease?: unknown } }).transition
      expect(t?.ease).toEqual(EASE)
    }
  })

  it('staggerContainer bir fabrikadır ve stagger değerini geçirir', () => {
    const made = staggerContainer(0.2)
    expect(made.visible.transition.staggerChildren).toBe(0.2)
    expect(staggerContainer().visible.transition.staggerChildren).toBe(0.12)
  })
})

describe('cn()', () => {
  it('çakışan Tailwind sınıflarında sonuncusu kazanır', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('koşullu ve falsy değerleri eler', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c')
  })

  it('çakışmayan sınıfları korur', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center')
  })
})

describe('imza degradesi', () => {
  // Elle yazılan degradeler "aynı sanılan farklı degradeler" biriktirir —
  // dev-starter'da 5 varyant, onepiece-hub'da 109 token'sız kullanım bulundu.
  // Tek kaynak burası.
  it('tek bir yerden gelir', () => {
    expect(gradients.signature).toBe(
      'linear-gradient(135deg, rgb(99,102,241), rgb(59,130,246), rgb(34,211,238))'
    )
  })

  it('deprecated logo aliası hâlâ çözülür (geriye dönük uyumluluk)', () => {
    expect(gradients.logo).toBeTruthy()
  })
})

describe('palet', () => {
  it('marka vurgu renkleri tanımlı', () => {
    for (const key of ['indigo', 'cyan', 'emerald', 'blue'] as const) {
      expect(colors.accent[key]?.DEFAULT).toBeTruthy()
    }
  })

  it('dark zemin ekosistem değeri #04070d', () => {
    expect(colors.bg.dark).toBe('#04070d')
  })
})
