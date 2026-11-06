// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import type { ElementType } from "react";
import { DUR, EASE } from "../variants";
import { cn } from "../utils";

/**
 * Kayan metin: metin DEĞİŞİNCE harfler slot makinesi gibi yerine yuvarlanır.
 * Durum etiketi ("Taslak" → "Yayında"), sekme başlığı, düğmenin yeni hali
 * ("Kopyala" → "Kopyalandı"), dönen kahraman sözcüğü. Rakam için
 * `digit-roll` var (yalnız değişen basamak, ara sayı yok); bu dosya her
 * karakterde çalışır ve değişmeyen harfi YERİNDE bırakır: "Kaydet" →
 * "Kaydedildi"de "Kayde" kımıldamaz.
 *
 * HER KONUM BİR YUVA: yuvanın genişliğini görünmez güncel harf verir, eski
 * harf yukarı (`direction="up"`) çıkarken yenisi alttan gelir; ikisi de
 * yuvaya mutlak konumlu, satır zıplamaz. Harfler soldan sağa 25 ms arayla.
 *
 * İlk çizim durağan (`initial={false}`): sayfa açılışında yuvarlanmaz.
 * Ekran okuyucu tam metni tek parça okur (`sr-only`); değişimi duyurmak
 * için `live` (`role="status"`). Hareketi azaltan kullanıcıda metin
 * yerinde değişir.
 *
 *   <SlotText text={saved ? "Kaydedildi" : "Kaydet"} />
 */

const STEP = 0.025;

type SlotTextProps = {
  text: string;
  /** Eski harfin çıktığı yön. */
  direction?: "up" | "down";
  as?: ElementType;
  live?: boolean;
  className?: string;
};

export function SlotText({ text, direction = "up", as: Tag = "span", live = false, className }: SlotTextProps) {
  const reduce = useReducedMotion();
  const sign = direction === "up" ? 1 : -1;
  const chars = [...text];

  return (
    <Tag role={live ? "status" : undefined} className={cn("inline-flex whitespace-pre", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-flex">
        {chars.map((char, index) => (
          <span key={index} className="relative inline-block overflow-hidden align-bottom">
            <span className="invisible">{char}</span>
            <AnimatePresence initial={false}>
              <m.span
                key={char}
                className="absolute inset-0"
                initial={reduce ? false : { y: `${100 * sign}%`, opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { y: `${-100 * sign}%`, opacity: 0 }}
                transition={{ duration: DUR.base, ease: EASE, delay: reduce ? 0 : Math.min(index, 16) * STEP }}
              >
                {char}
              </m.span>
            </AnimatePresence>
          </span>
        ))}
      </span>
    </Tag>
  );
}
