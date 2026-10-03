import type { CSSProperties } from "react";
import styles from "./rolling-number.module.css";

/**
 * Kilometre sayacı gibi yuvarlanarak gelen display sayısı.
 * Kaynak: dev-starter `snippets/rolling-number.tsx` (gerekçeler orada).
 *
 * JAVASCRIPT YOK, SUNUCUDA ÇİZİLİR: son hâl zaten HTML'de, her rakamın
 * şeridi CSS'le yerine kayar. Genişlik sıçramaz (CLS 0), ekran okuyucu
 * sayıyı düz metin olarak duyar, hareketi azaltan okuyucu son kareyi görür.
 *
 * YALNIZCA İLK EKRANDA: animasyon yüklemede oynar, görünüme girişte değil.
 * Sayfanın aşağısındaki bir sayıya konursa okuyucu oraya indiğinde dönüş
 * çoktan bitmiş olur. Bu yüzden şablonda yalnızca hero'larda kullanılıyor.
 */

// Şerit iki tur: ilk tur dönüşün yolu, ikinci turdaki rakam son konum.
const DIGIT_CYCLE = Array.from({ length: 20 }, (_, index) => index % 10);

const isDigit = (char: string) => char >= "0" && char <= "9";

type RollingNumberProps = {
  /** Biçimlendirilmiş değer: "2.418", "%38", "4,7". */
  value: string;
  className?: string;
  /** Aynı ekrandaki ikinci sayı birincinin ardından dönsün diye (ms). */
  delayMs?: number;
};

export function RollingNumber({ value, className, delayMs = 0 }: RollingNumberProps) {
  const chars = [...value];
  const digitCount = chars.filter(isDigit).length;
  let seen = 0;

  return (
    <span className={`${styles.figure} ${className ?? ""}`}>
      <span className="sr-only">{value}</span>
      <span aria-hidden className={styles.track}>
        {chars.map((char, index) => {
          if (!isDigit(char)) {
            return (
              <span key={index} className={styles.glyph}>
                {char}
              </span>
            );
          }
          // Sağdaki rakam önce durur: sayaç en küçük basamaktan oturuyormuş gibi.
          const order = digitCount - seen;
          seen += 1;
          return (
            <span
              key={index}
              className={styles.window}
              style={{ "--digit": Number(char), "--order": order, "--delay": `${delayMs}ms` } as CSSProperties}
            >
              <span className={styles.sizer}>{char}</span>
              <span className={styles.strip}>
                {DIGIT_CYCLE.map((digit, step) => (
                  <span key={step}>{digit}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
