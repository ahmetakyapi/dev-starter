"use client";

import { m } from "motion/react";
import { useSyncExternalStore, type ReactNode } from "react";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import { DUR, EASE, STAGGER } from "@/lib/motion";

/**
 * Görünüme girince beliren wrapper.
 *
 * TUZAK: hareketi azaltan kullanıcıda `initial={false}` YAZMA. Sunucu HTML'i
 * `opacity: 0` ile gelir; `initial={false}` Motion'a "zaten hedefte" dedirtir,
 * `whileInView` hiç tetiklenmez ve içerik kalıcı olarak görünmez kalır.
 * Doğrusu `initial` HEDEFİNİ değiştirmek.
 *
 * Kahraman başlığı ve LCP öğesi Reveal'e sarılmaz: ilk boyamayı geciktirir.
 * JavaScript kapalıyken `data-reveal` taşıyan öğeler kök layout'taki
 * `<noscript>` kuralıyla görünür olur.
 *
 * `viewport`ta negatif `margin` YOK: Motion onu IntersectionObserver
 * `rootMargin`i yapar ve "-80px" kökü DÖRT kenardan daraltır. Sayfanın ilk ya
 * da son 80 pikseline düşen (alt bilgi satırı, son kart) ya da telefonda
 * kenara yaslı küçük öğe hiç kesişmez ve opacity 0'da kalır. `amount` eşiği
 * de çözüm değil: ekranın birkaç katı uzun blok o oranı hiç göremez.
 */

/**
 * Kademe tavanı: toplam ≤ 400 ms (guides/04-motion.md § 5). Her öğenin kendi
 * gözlemcisi var; tavansız uzun listede 40. öğe görünüme girdikten 2,4 s
 * sonra belirirdi.
 */
const MAX_STAGGER_STEPS = 6;

/**
 * Canlı önizleme (iframe) yerleştiyse: köprü kökte `data-preview-settled`
 * açar. Panelde yazdıkça eklenen öğe giriş hareketini baştan oynatıp
 * saniyelerce gizli kalmasın, doğrudan görünür. Hidrasyonda sunucu değeri
 * (false) kullanılır; etki yalnız sonradan bağlanan öğede.
 */
const noop = () => () => {};
const usePreviewSettled = () =>
  useSyncExternalStore(noop, () => document.documentElement.dataset.previewSettled !== undefined, () => false);

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Saniye. Liste içinde sıraya göre kademe için `RevealItem` kullan (tavanlı). */
  delay?: number;
  /** Başlangıç kayması, piksel. */
  y?: number;
  as?: "div" | "li" | "section";
};

export function Reveal({ children, className, delay = 0, y = 16, as = "div" }: RevealProps) {
  const prefersReduced = useMotionPreference();
  const settled = usePreviewSettled();
  const reduce = prefersReduced || settled;
  const Tag = m[as];
  return (
    <Tag
      data-reveal=""
      className={className}
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: reduce ? 0 : DUR.slow, delay: reduce ? 0 : delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

/** Liste öğesi: sırası kadar (en fazla 6 basamak) gecikmeyle gelir. `<ul>` içinde `as="li"` ile. */
export function RevealItem({
  index,
  ...props
}: Omit<RevealProps, "delay"> & { index: number }) {
  return <Reveal delay={Math.min(index, MAX_STAGGER_STEPS) * STAGGER} {...props} />;
}
