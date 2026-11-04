"use client";

import { m, useReducedMotion } from "motion/react";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Rakam yuvarlanması: değer DEĞİŞİNCE her rakam kendi penceresinde dikey
 * kayarak yeni rakamına oturur (sayaç, toplam, seçilen saat). Yalnız değişen
 * basamak döner; "175,6 B" → "175,8 B"de yalnız son rakam hareket eder.
 *
 * ÜÇ SAYI, ÜÇ İŞ (tek kaynak, karışmasın):
 *   - `snippets/rolling-number.tsx`: İLK YÜKLEMEDE bir kez dönen display
 *     sayısı; JS'siz, sunucuda çizilir. Kahraman, landing.
 *   - `snippets/animated-number.tsx`: değeri ara sayılardan geçirerek SAYAR
 *     (1.000 → 1.250 arası 1.137'yi de gösterir).
 *   - bu dosya: ara sayı yok; değişen rakam doğrudan yeni rakamına yuvarlanır.
 *     Etkileşimde (cetvel, vurgulanan bölüm) değer saniyede onlarca kez
 *     değişebilir; sayan sayaç orada hiç oturmaz, rakam yuvarlanması oturur.
 *
 * İLK ÇİZİM DURAĞAN (`initial={false}`): sayfa açılırken dönmez; o iş
 * `rolling-number`ın. Yay `SPRING.snappy`: hafif aşar ve oturur, komşu
 * rakam pencerenin kenarında bir an görünür.
 *
 * GENİŞLİK SIÇRAMAZ: penceredeki görünmez kopya genişliği ve taban çizgisini
 * verir (`tabular-nums` ile her rakam aynı en); şerit onun üstünde mutlak.
 * Basamaklar SAĞDAN anahtarlanır: 99 → 100'de birler basamağı aynı öğe kalır,
 * soldan yeni basamak eklenir.
 *
 * Ekran okuyucu biçimlenmiş değerin tamamını tek metin olarak okur
 * (`sr-only`), şeritler `aria-hidden`. Değişimi duyurmak istenirse kap
 * `aria-live` taşır; bileşen kendiliğinden konuşmaz (sürüklerken her adımı
 * okumak gürültüdür). Hareketi azaltan kullanıcıda rakam yerinde değişir.
 *
 * Punto, ağırlık ve renk çağırandan: sakin büyük sayı için
 * `text-display font-medium tracking-tight`; birim yanında `text-muted`.
 *
 *   <DigitRoll value={175.6} format={{ maximumFractionDigits: 1 }} className="text-display font-medium" />
 *   <DigitRoll value="09:45" />   // biçimlenmiş metin de olur
 */

/** Satır yüksekliği em cinsinden: şeridin adımı ile pencerenin boyu aynı sayı olmalı. */
const LINE = 1.2;
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const isDigit = (char: string) => char >= "0" && char <= "9";

type DigitRollProps = {
  /** Sayı `format` ile `tr-TR` biçimlenir; metin olduğu gibi kullanılır. */
  value: number | string;
  format?: Intl.NumberFormatOptions;
  locale?: string;
  className?: string;
};

export function DigitRoll({ value, format, locale = "tr-TR", className }: DigitRollProps) {
  const reduce = useReducedMotion();
  const text = typeof value === "number" ? new Intl.NumberFormat(locale, format).format(value) : value;
  const chars = [...text];

  return (
    <span className={cn("inline-flex whitespace-nowrap tabular-nums", className)} style={{ lineHeight: LINE }}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-flex">
        {chars.map((char, index) => {
          const fromRight = chars.length - 1 - index;
          if (!isDigit(char)) {
            return (
              <span key={`s${fromRight}${char}`} className="inline-block whitespace-pre">
                {char}
              </span>
            );
          }
          const digit = Number(char);
          return (
            <span key={`d${fromRight}`} className="relative inline-block">
              <span className="invisible">{char}</span>
              <span className="absolute inset-0 overflow-hidden">
                <m.span
                  className="absolute inset-x-0 top-0 flex flex-col items-center"
                  initial={false}
                  animate={{ y: `${-digit * LINE}em` }}
                  transition={reduce ? { duration: 0 } : { ...SPRING.snappy, delay: Math.min(fromRight, 6) * 0.015 }}
                >
                  {DIGITS.map((d) => (
                    <span key={d} className="block" style={{ height: `${LINE}em` }}>
                      {d}
                    </span>
                  ))}
                </m.span>
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
