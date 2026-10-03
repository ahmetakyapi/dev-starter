"use client";

import { Popover as Base } from "@base-ui/react/popover";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Açılır kutu: bir düğmeye bağlı, sayfayı kilitlemeyen küçük katman
 * (filtre seçenekleri, kısa açıklama, paylaşım bağlantısı).
 *
 * Başsız katman Base UI (`@base-ui/react`, kararı guides/10): konumlama
 * (Floating UI), dış tıklama ve Escape ile kapanma, odağın tetikleyiciye
 * dönmesi, `aria-expanded`/`aria-controls` bağları ondan. Biz yalnızca
 * görünüşü veriyoruz; görünüş token sınıfı.
 *
 *   <Popover>
 *     <PopoverTrigger className={buttonClass({ variant: "secondary" })}>Filtre</PopoverTrigger>
 *     <PopoverContent title="Filtreler">…</PopoverContent>
 *   </Popover>
 *
 * Tetikleyici kendi düğmeni taşıyacaksa: `<PopoverTrigger render={<Button />}>`.
 * İçinde form varsa ve odak dışarı kaçmamalıysa: `<Popover modal="trap-focus">`
 * ve içeride bir `PopoverClose` (dokunmatik ekran okuyucu çıkış bulsun).
 *
 * Konum: Positioner `z-50` taşır. Sayfa kökünde `isolation: isolate` yoksa
 * başka bir yığın bağlamının altında kalabilir; kök layout'taki gövde
 * sarmalayıcısına `isolate` ver.
 */

export const Popover = Base.Root;
export const PopoverTrigger = Base.Trigger;
export const PopoverClose = Base.Close;

/* Base UI katmanlarının ortak yüzeyi; menü ve seçim kutusu aynı dizeyi taşır
   (her dosya tek başına kopyalansın diye paylaşılmıyor). */
const FLOATING_SURFACE =
  "rounded-lg border border-line-strong bg-overlay text-body shadow-modal outline-none origin-(--transform-origin) transition-[opacity,scale] duration-150 data-starting-style:scale-[0.97] data-starting-style:opacity-0 data-ending-style:scale-[0.97] data-ending-style:opacity-0";

type PopoverContentProps = Omit<ComponentProps<typeof Base.Popup>, "title" | "className"> & {
  title?: ReactNode;
  description?: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
};

export function PopoverContent({
  title,
  description,
  side = "bottom",
  align = "center",
  sideOffset = 8,
  className,
  children,
  ...props
}: PopoverContentProps) {
  return (
    <Base.Portal>
      <Base.Positioner side={side} align={align} sideOffset={sideOffset} collisionPadding={12} className="z-50">
        <Base.Popup
          className={cn(FLOATING_SURFACE, "w-[min(20rem,var(--available-width))] p-4", className)}
          {...props}
        >
          {title ? <Base.Title className="text-base font-semibold text-strong">{title}</Base.Title> : null}
          {description ? (
            <Base.Description className="mt-1 text-small text-soft">{description}</Base.Description>
          ) : null}
          {title || description ? <div className="mt-3">{children}</div> : children}
        </Base.Popup>
      </Base.Positioner>
    </Base.Portal>
  );
}
