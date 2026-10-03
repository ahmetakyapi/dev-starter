"use client";

import { m } from "motion/react";
import type { ReactNode } from "react";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import { DUR, EASE, STAGGER } from "@/lib/motion";

/**
 * Görünüme girince beliren sarmalayıcı.
 *
 * TUZAK: hareketi azaltan kullanıcıda `initial={false}` YAZMA. Sunucu HTML'i
 * `opacity: 0` ile gelir; `initial={false}` Motion'a "zaten hedefte" dedirtir,
 * `whileInView` hiç tetiklenmez ve içerik kalıcı olarak görünmez kalır.
 * Doğrusu `initial` HEDEFİNİ değiştirmek.
 *
 * Kahraman başlığı ve LCP öğesi Reveal'e sarılmaz: ilk boyamayı geciktirir.
 * JavaScript kapalıyken `data-reveal` taşıyan öğeler kök layout'taki
 * `<noscript>` kuralıyla görünür olur.
 */

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Saniye. Liste içinde `index * STAGGER` vermek için `RevealItem` kullan. */
  delay?: number;
  /** Başlangıç kayması, piksel. */
  y?: number;
  as?: "div" | "li" | "section";
};

export function Reveal({ children, className, delay = 0, y = 16, as = "div" }: RevealProps) {
  const reduce = useMotionPreference();
  const Tag = m[as];
  return (
    <Tag
      data-reveal=""
      className={className}
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: reduce ? 0 : DUR.slow, delay: reduce ? 0 : delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

/** Liste öğesi: sırası kadar gecikmeyle gelir. `<ul>` içinde `as="li"` ile. */
export function RevealItem({
  index,
  ...props
}: Omit<RevealProps, "delay"> & { index: number }) {
  return <Reveal delay={index * STAGGER} {...props} />;
}
