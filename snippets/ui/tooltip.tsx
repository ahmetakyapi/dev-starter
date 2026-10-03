"use client";

import { Popover } from "@base-ui/react/popover";
import { Tooltip as Base } from "@base-ui/react/tooltip";
import { Info } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * İki bileşen, iki ayrı iş:
 *
 * `Tooltip`: GÖRSEL ETİKET. İkon düğmenin adını fareyle üzerine gelene ve
 * klavyeyle odaklanana gösterir. Base UI tooltip'i dokunmatikte BİLEREK
 * açmaz: uzun basma tarayıcının bağlam menüsüyle çakışır ve keşfedilemez.
 * Bu yüzden tooltip'e hiçbir zaman önemli bilgi konmaz; düğmenin adı zaten
 * `aria-label`da durur, tooltip yalnızca onu görünür kılar.
 *
 * `InfoTip`: AÇIKLAMA. "Bu sayı ne demek?" sorusunun cevabı gibi okunması
 * gereken metin. Popover üzerine kurulu: farede üzerine gelince, dokunmatikte
 * TIKLAYINCA açılır (uzun basma değil), Escape ve dış tıklama kapatır,
 * ekran okuyucu düğmenin ardından içeriği okur.
 *
 *   <Tooltip label="Ayarları Aç">
 *     <IconButton icon={Settings} aria-label="Ayarları Aç" showTitle={false} />
 *   </Tooltip>
 *   <InfoTip label="F/K Nedir">Fiyatın hisse başına kâra oranı.</InfoTip>
 *
 * Aynı satırda çok sayıda tooltip varsa `TooltipProvider` ile sar: ilki
 * açıldıktan sonra komşulara geçerken gecikme beklenmez.
 */

export const TooltipProvider = Base.Provider;

const SURFACE =
  "z-50 rounded-md border border-line-strong bg-overlay text-strong shadow-floating origin-(--transform-origin) transition-[opacity,scale] duration-150 data-starting-style:scale-[0.97] data-starting-style:opacity-0 data-ending-style:scale-[0.97] data-ending-style:opacity-0";

type TooltipProps = {
  /** Görünen etiket. Tetikleyicinin `aria-label`ı ile aynı metin olmalı. */
  label: ReactNode;
  /** Tetikleyici: ref'i ve prop'ları DOM'a yayan tek bir öğe (Button, IconButton). */
  children: ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  /** Açılma gecikmesi (ms). Kısa tutmak her geçişte ekranı kırpıştırır. */
  delay?: number;
};

export function Tooltip({ label, children, side = "top", delay = 500 }: TooltipProps) {
  return (
    <Base.Root>
      <Base.Trigger delay={delay} render={children} />
      <Base.Portal>
        <Base.Positioner side={side} sideOffset={8} collisionPadding={8} className="z-50">
          <Base.Popup className={cn(SURFACE, "px-2.5 py-1.5 text-small font-medium")}>{label}</Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}

type InfoTipProps = {
  /** Düğmenin adı ve açılan kutunun başlığı: "F/K Nedir". */
  label: string;
  /** Açıklama metni: cümle düzeninde, birkaç satır. */
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
};

export function InfoTip({ label, children, side = "top", className }: InfoTipProps) {
  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={200}
        aria-label={label}
        className={cn(
          // Görsel 20 piksel, dokunma alanı 44: negatif kenar boşluğu satırı itmez.
          "-m-3 inline-grid size-11 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-primary-ink data-popup-open:text-primary-ink [&_svg]:size-4",
          className,
        )}
      >
        <Info aria-hidden strokeWidth={1.75} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side={side} sideOffset={4} collisionPadding={12} className="z-50">
          <Popover.Popup className={cn(SURFACE, "w-[min(18rem,var(--available-width))] p-3.5 text-body")}>
            <Popover.Title className="text-small font-semibold text-strong">{label}</Popover.Title>
            <Popover.Description className="mt-1 text-small text-soft">{children}</Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
