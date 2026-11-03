"use client";

import { ChevronsLeftRight } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Önce / sonra karşılaştırma: iki katman üst üste, aradaki çizgi sürüklenir.
 * Görsel (eski ve yeni ekran görüntüsü, rötuş) ama yalnız görsel değil:
 * iki taslak metin, iki tasarım varyantı, ham ve işlenmiş tablo. İki katman
 * aynı ızgara hücresinde durur; kabın yüksekliği uzun olandan gelir.
 *
 * DENETİM YEREL `<input type="range">`: kabı kaplayan görünmez kaydırıcı
 * klavye (oklar, Home/End, PageUp/Down), dokunmatik ve ekran okuyucuyu
 * bedavaya getirir; ad ve değer metni ("Önce %40, sonra %60") ondan okunur.
 * Görünür tutamak yalnız süs; odak halkası tutamağa çizilir
 * (`has-[input:focus-visible]`). Sayfa dikey kaydırılabilsin diye kaydırıcı
 * `touch-action: pan-y`: yatay sürükleme karşılaştırır, dikey kaydırır.
 *
 * ÖNCEKİ KATMAN OPAK: kendi zemini yarı saydam olabilir (`bg-surface`
 * gibi tonlar katmandır); altındaki "sonra" metni sızmasın diye kap
 * `bg-page` taşır. İki katman da `grid` ile hücreyi doldurur: kısa olan
 * içerik uzun olanın boyuna uzar, alt kenarda şerit kalmaz.
 *
 * KIRPMA `clip-path` ile, genişlikle değil: önceki katman yerinde durur,
 * yalnız görünen kısmı değişir; içerik yeniden düzenlenmez ve metin satır
 * kırılımı sabit kalır. Değer bir CSS değişkeninde (`--pos`), yeniden çizim
 * yalnız kırpma ve tutamak.
 *
 * İKİ KATMAN DA OKUNUR: ekran okuyucu önce "önce" katmanını, sonra
 * "sonra"yı okur; görsel kırpma içeriği gizlemez. Görsellerde iki `alt`
 * metni farkı anlatmalı ("Eski panel: üç sütun" / "Yeni panel: tek akış").
 *
 * Hareketi azaltan kullanıcı için ayrı bir şey gerekmez: hareket kendiliğinden
 * değil, kullanıcının elinde.
 *
 *   <CompareSlider before={<img alt="Eski" …/>} after={<img alt="Yeni" …/>} />
 */

type CompareSliderProps = {
  before: ReactNode;
  after: ReactNode;
  beforeLabel?: string;
  afterLabel?: string;
  /** Başlangıç konumu, yüzde. */
  defaultValue?: number;
  /** Kaydırıcının adı. */
  label?: string;
  /** Konum değişince (yüzde). */
  onValueChange?: (value: number) => void;
  className?: string;
};

export function CompareSlider({
  before,
  after,
  beforeLabel = "Önce",
  afterLabel = "Sonra",
  defaultValue = 50,
  label = "Karşılaştırma",
  onValueChange,
  className,
}: CompareSliderProps) {
  const [value, setValue] = useState(defaultValue);
  const style = { "--pos": `${value}%` } as CSSProperties;

  return (
    <div
      className={cn("group/compare relative isolate grid overflow-hidden rounded-lg bg-surface select-none", className)}
      style={style}
    >
      <div className="grid [grid-area:1/1]">{after}</div>
      <div className="grid bg-page [grid-area:1/1] [clip-path:inset(0_calc(100%_-_var(--pos))_0_0)]">{before}</div>

      <span className="pointer-events-none absolute top-3 left-3 z-10 rounded-full bg-overlay px-2.5 py-1 text-micro font-semibold text-strong shadow-raised">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute top-3 right-3 z-10 rounded-full bg-overlay px-2.5 py-1 text-micro font-semibold text-strong shadow-raised">
        {afterLabel}
      </span>

      <div aria-hidden className="pointer-events-none absolute inset-y-0 z-10 w-px -translate-x-1/2 bg-overlay shadow-floating [left:var(--pos)]">
        <span className="absolute top-1/2 left-1/2 grid size-9 -translate-1/2 place-items-center rounded-full bg-overlay text-strong shadow-floating transition-[scale] duration-150 group-active/compare:scale-95 group-has-[input:focus-visible]/compare:outline-2 group-has-[input:focus-visible]/compare:outline-offset-2 group-has-[input:focus-visible]/compare:outline-line-focus">
          <ChevronsLeftRight className="size-4" strokeWidth={2} />
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        aria-label={label}
        aria-valuetext={`${beforeLabel} %${value}, ${afterLabel} %${100 - value}`}
        onChange={(event) => {
          const next = Number(event.target.value);
          setValue(next);
          onValueChange?.(next);
        }}
        className="absolute inset-0 z-20 size-full cursor-ew-resize touch-pan-y opacity-0"
      />
    </div>
  );
}
