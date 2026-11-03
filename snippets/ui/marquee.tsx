"use client";

import { Pause, Play } from "lucide-react";
import { Children, useId, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Kayan şerit: müşteri logoları, entegrasyonlar, kısa alıntılar. Sayfada
 * TEK şerit (landing kuralı); iki şerit gözü ikiye böler.
 *
 * WCAG 2.2.2 (Durdur, Duraklat, Gizle): beş saniyeden uzun süren otomatik
 * hareketin durdurulabilmesi ZORUNLU. Üzerine gelmek ve odaklanmak şeridi
 * bekletir ama ikisi de tek yol olamaz (klavye ve dokunmatikte üzerine
 * gelinmez); bu yüzden görünür "Şeridi Durdur" düğmesi varsayılan açık.
 * Kapatmak yalnızca şerit beş saniyeden kısa sürüyorsa meşru.
 *
 * İÇERİK İKİ KEZ ÇİZİLİR, BİR KEZ OKUNUR: kesintisiz döngü için ikinci kopya
 * şart; o kopya `aria-hidden` + `inert` (içindeki bağlantılar Tab sırasına
 * girmez, ekran okuyucu listeyi iki kez okumaz). Gerçek liste `role="list"`.
 *
 * HAREKET CSS'TE ve yalnız `transform`: iz kendi genişliğinin yarısı kadar
 * kayar, süre içerik uzunluğundan bağımsız `duration` saniyesi. Hareketi
 * azaltan kullanıcıda şerit durağan, sarılan bir sıra olur ve düğme
 * gizlenir (durduracak hareket yok).
 *
 * KENARLAR SÖNER: maske alfa ile (`mask-image`), renk değil; zemin ne olursa
 * olsun öğeler kenarda kaybolur. Maske rengi `currentColor`, token kuralına
 * takılmaz, çizilmez.
 *
 *   <Marquee label="Müşterilerimiz">
 *     {logos.map((logo) => <Logo key={logo.name} {...logo} />)}
 *   </Marquee>
 */

const CSS = `
@keyframes ui-marquee { to { transform: translate3d(calc(-50% - var(--marquee-gap) / 2), 0, 0); } }
.ui-marquee-track { animation: ui-marquee var(--marquee-duration) linear infinite; animation-direction: var(--marquee-direction); }
.ui-marquee:where(:hover, :focus-within) .ui-marquee-track, .ui-marquee[data-paused] .ui-marquee-track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .ui-marquee-track { animation: none; flex-wrap: wrap; justify-content: center; width: auto; }
  .ui-marquee-clone, .ui-marquee-control { display: none; }
  .ui-marquee-mask { mask-image: none; -webkit-mask-image: none; }
}`;

const FADE = "linear-gradient(90deg, transparent, currentColor 8%, currentColor 92%, transparent)";

type MarqueeProps = {
  children: ReactNode;
  /** Listenin adı: "Müşterilerimiz", "Entegrasyonlar". */
  label: string;
  /** Bir tam turun saniyesi. Uzun liste daha uzun süre ister; 30-60 arası rahat okunur. */
  duration?: number;
  /** Sağdan sola (varsayılan) ya da soldan sağa. */
  reverse?: boolean;
  /** Görünür durdurma düğmesi. Yalnız 5 saniyeden kısa şeritte kapat. */
  control?: boolean;
  /** Öğeler arası boşluk (rem). */
  gap?: number;
  className?: string;
};

export function Marquee({ children, label, duration = 40, reverse = false, control = true, gap = 2.5, className }: MarqueeProps) {
  const [paused, setPaused] = useState(false);
  const id = useId();
  const items = Children.toArray(children);
  const style = {
    "--marquee-duration": `${duration}s`,
    "--marquee-direction": reverse ? "reverse" : "normal",
    "--marquee-gap": `${gap}rem`,
  } as CSSProperties;

  const row = (clone: boolean) => (
    <ul
      role={clone ? undefined : "list"}
      aria-label={clone ? undefined : label}
      aria-hidden={clone || undefined}
      inert={clone || undefined}
      className={cn("flex shrink-0 items-center", clone && "ui-marquee-clone")}
      style={{ gap: "var(--marquee-gap)" }}
    >
      {items.map((item, index) => (
        <li key={index} className="shrink-0">
          {item}
        </li>
      ))}
    </ul>
  );

  return (
    <div className={cn("grid justify-items-center gap-3", className)}>
      <style href="ui-marquee" precedence="default">
        {CSS}
      </style>
      <div
        id={id}
        className="ui-marquee ui-marquee-mask w-full overflow-hidden"
        data-paused={paused ? "" : undefined}
        style={{ ...style, maskImage: FADE, WebkitMaskImage: FADE }}
      >
        <div className="ui-marquee-track flex w-max" style={{ gap: "var(--marquee-gap)" }}>
          {row(false)}
          {row(true)}
        </div>
      </div>
      {control ? (
        <button
          type="button"
          aria-controls={id}
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
          className="ui-marquee-control inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-small font-medium text-muted transition-colors hover:bg-surface-raised hover:text-strong pointer-fine:min-h-8"
        >
          {paused ? <Play aria-hidden className="size-3.5" strokeWidth={2} /> : <Pause aria-hidden className="size-3.5" strokeWidth={2} />}
          Şeridi Durdur
        </button>
      ) : null}
    </div>
  );
}
