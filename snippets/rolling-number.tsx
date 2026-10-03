/**
 * RollingNumber — kilometre sayacı gibi yuvarlanarak gelen display sayısı
 *
 * JAVASCRIPT YOK, SUNUCUDA ÇİZİLİR. Sayı biçimlendirilmiş hâliyle gelir
 * ("54.114,33 ₺"); her rakam kendi penceresinde 0–9 şeridinin iki turu
 * olarak basılır ve şerit CSS'le son rakamına kayar. İstemci sayacı
 * (değeri kare kare artırıp yeniden biçimlendiren) hem hidrasyonu bekler
 * hem ara karelerde "54.1" gibi yarım biçimler basar; burada son hâl
 * zaten HTML'de.
 *
 * GENİŞLİK SIÇRAMAZ (CLS 0): pencerenin genişliğini son rakamın akıştaki
 * kopyası belirler, şerit onun üstünde mutlak konumludur.
 *
 * Ekran okuyucu sayının tamamını düz metin olarak duyar (`sr-only`);
 * şeritler `aria-hidden`. Hareketi azaltan okuyucu son kareyi görür.
 *
 * YALNIZCA İLK EKRANDA. Animasyon yüklemede oynar, görünüme girişte değil;
 * ekranın altındaki bir sayıya konursa okuyucu oraya indiğinde dönüş
 * çoktan bitmiş olur. Değer DEĞİŞİNCE sayan sayaç ayrı bir iş:
 * `animated-number.tsx`.
 *
 * Stil: yanındaki `rolling-number.module.css` (birlikte kopyala).
 *
 * Kullanım:
 *   <RollingNumber value={formatTRY(total)} className="text-hero font-bold" />
 */

import type { CSSProperties } from 'react'
import styles from './rolling-number.module.css'

// Şerit iki tur: ilk tur dönüşün yolu, ikinci turdaki rakam son konum
const DIGIT_CYCLE = Array.from({ length: 20 }, (_, index) => index % 10)

type RollingNumberProps = {
  /** Biçimlendirilmiş değer, ör. "1.234,56 ₺" */
  value: string
  className?: string
  /** Aynı kahramandaki ikinci sayı birincinin ardından dönsün diye (ms) */
  delayMs?: number
}

const isDigit = (char: string) => char >= '0' && char <= '9'

export function RollingNumber({ value, className, delayMs = 0 }: RollingNumberProps) {
  const chars = [...value]
  const digitCount = chars.filter(isDigit).length
  let seen = 0

  return (
    <span className={`${styles.figure} ${className ?? ''}`}>
      <span className="sr-only">{value}</span>
      <span aria-hidden className={styles.track}>
        {chars.map((char, index) => {
          if (!isDigit(char)) {
            return (
              <span key={index} className={styles.glyph}>
                {char}
              </span>
            )
          }
          // Sağdaki rakam önce durur, soldaki en uzun döner: sayaç en küçük
          // basamaktan oturuyormuş gibi okunur
          const order = digitCount - seen
          seen += 1
          return (
            <span
              key={index}
              className={styles.window}
              style={
                {
                  '--digit': Number(char),
                  '--order': order,
                  '--delay': `${delayMs}ms`,
                } as CSSProperties
              }
            >
              <span className={styles.sizer}>{char}</span>
              <span className={styles.strip}>
                {DIGIT_CYCLE.map((digit, step) => (
                  <span key={step}>{digit}</span>
                ))}
              </span>
            </span>
          )
        })}
      </span>
    </span>
  )
}
