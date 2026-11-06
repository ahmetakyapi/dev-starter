"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ElementType } from "react";
import { cn } from "@/lib/utils";

/**
 * Çözülen metin: harfler rastgele karakterlerden geçerek soldan sağa yerine
 * oturur, şifre çözülüyormuş gibi. Kısa display metninde bir kez: geliştirici
 * aracının kahraman satırı, "Bağlantı kuruldu" anı, bölüm etiketi. Gövde
 * metninde, uzun cümlede ve her yeniden çizimde KULLANMA; okumayı geciktirir.
 *
 * TETİK: `inView` (varsayılan, görünür olunca bir kez), `mount`, `hover`
 * (fare üstüne gelince ve klavye odağında yeniden çözülür) ya da metin
 * değişince (`text` değişir değişmez her tetikte). Süre metnin boyundan
 * bağımsız (`duration`), her kare `requestAnimationFrame`.
 *
 * GENİŞLİK: geçiş karakterleri aynı aileden seçilir (Türkçe büyük harf +
 * rakam); eşit enli yazı için `font-mono` ver, satır hiç kımıldamaz.
 * Boşluk ve noktalama hiç karışmaz.
 *
 * Ekran okuyucu yalnız gerçek metni okur (`sr-only`), karışan karakterler
 * `aria-hidden`. Hareketi azaltan kullanıcıda metin doğrudan çizilir.
 *
 *   <ScrambleText text="Bağlantı kuruldu" className="font-mono" />
 */

const GLYPHS = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ0123456789#%&*+=<>/";
const FIXED = /[\s.,;:!?'"()\-–—…]/;

type ScrambleTextProps = {
  text: string;
  trigger?: "inView" | "mount" | "hover";
  /** Bütün metnin çözülme süresi (ms). */
  duration?: number;
  as?: ElementType;
  className?: string;
};

export function ScrambleText({ text, trigger = "inView", duration = 900, as: Tag = "span", className }: ScrambleTextProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const [shown, setShown] = useState(text);
  const frame = useRef<number | undefined>(undefined);

  const run = useCallback(() => {
    if (reduce) {
      setShown(text);
      return;
    }
    cancelAnimationFrame(frame.current ?? 0);
    const chars = [...text];
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const settled = Math.floor(t * chars.length);
      setShown(
        chars
          .map((ch, i) => (i < settled || FIXED.test(ch) ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join(""),
      );
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [duration, reduce, text]);

  useEffect(() => {
    if (trigger === "mount" || (trigger === "inView" && inView)) run();
    else setShown(text);
  }, [inView, run, text, trigger]);

  useEffect(() => () => cancelAnimationFrame(frame.current ?? 0), []);

  const hover = trigger === "hover" ? { onPointerEnter: run, onFocus: run } : {};

  return (
    <Tag ref={ref} className={cn("inline-block whitespace-pre-wrap", className)} {...hover}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{shown}</span>
    </Tag>
  );
}
