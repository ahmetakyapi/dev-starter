"use client";

import { Menu as Base } from "@base-ui/react/menu";
import { Check, Circle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Açılır menü: bir düğmenin altındaki EYLEM listesi (Düzenle, Kopyala, Sil).
 * Seçim için değil; bir değer seçtiriyorsan `select.tsx`.
 *
 * Base UI Menu: WAI-ARIA menu düğme kalıbı tam. Ok tuşları öğeler arasında
 * gezer, Home/End uçlara gider, harf yazmak o harfle başlayan öğeye atlar,
 * Escape kapatır ve odak TETİKLEYİCİYE döner, Tab menüyü kapatıp sıradaki
 * öğeye geçer. Elle yazılan menülerin hemen hepsi bunlardan en az birini
 * unutuyor; o yüzden burada başsız kütüphane var.
 *
 *   <DropdownMenu>
 *     <DropdownMenuTrigger render={<Button variant="secondary" />}>Eylemler</DropdownMenuTrigger>
 *     <DropdownMenuContent>
 *       <DropdownMenuItem icon={<Pencil />} onClick={edit}>Düzenle</DropdownMenuItem>
 *       <DropdownMenuSeparator />
 *       <DropdownMenuItem tone="danger" onClick={remove}>Sil</DropdownMenuItem>
 *     </DropdownMenuContent>
 *   </DropdownMenu>
 *
 * Başka sayfaya giden öğe `DropdownMenuLinkItem` (gerçek `<a>`; orta tık ve
 * yeni sekme çalışır). Menüden diyalog açmak: diyaloğun durumunu dışarıda
 * tut, öğenin `onClick`inde aç (Base UI belgesindeki kalıp).
 */

export const DropdownMenu = Base.Root;
export const DropdownMenuTrigger = Base.Trigger;
export const DropdownMenuGroup = Base.Group;
export const DropdownMenuRadioGroup = Base.RadioGroup;

const SURFACE =
  "min-w-52 max-w-[var(--available-width)] rounded-lg border border-line-strong bg-overlay p-1 text-body shadow-modal outline-none origin-(--transform-origin) transition-[opacity,scale] duration-150 data-starting-style:scale-[0.97] data-starting-style:opacity-0 data-ending-style:scale-[0.97] data-ending-style:opacity-0";

/* Dokunmatikte 44, farede 36 piksel satır. Vurgu `data-highlighted`: fare
   ve klavye aynı durumu paylaşır, iki ayrı "seçili" görünmez. */
const ITEM =
  "flex min-h-11 cursor-default select-none items-center gap-2.5 rounded-md px-2.5 text-base outline-none pointer-fine:min-h-9 data-highlighted:bg-primary-wash data-highlighted:text-strong data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

type ContentProps = Omit<ComponentProps<typeof Base.Popup>, "className"> & {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  className?: string;
};

export function DropdownMenuContent({ side = "bottom", align = "start", className, ...props }: ContentProps) {
  return (
    <Base.Portal>
      <Base.Positioner side={side} align={align} sideOffset={6} collisionPadding={8} className="z-50 outline-none">
        <Base.Popup className={cn(SURFACE, className)} {...props} />
      </Base.Positioner>
    </Base.Portal>
  );
}

type ItemProps = Omit<ComponentProps<typeof Base.Item>, "className"> & {
  icon?: ReactNode;
  /** Sağda kısayol ipucu: "⌘D". Yalnızca görsel; kısayolu ayrıca bağla. */
  shortcut?: string;
  tone?: "default" | "danger";
  className?: string;
};

export function DropdownMenuItem({ icon, shortcut, tone = "default", className, children, ...props }: ItemProps) {
  return (
    <Base.Item
      className={cn(
        ITEM,
        tone === "danger" && "text-danger data-highlighted:bg-danger-wash data-highlighted:text-danger",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span aria-hidden className="text-muted">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut ? (
        <span aria-hidden className="font-mono text-micro text-muted">
          {shortcut}
        </span>
      ) : null}
    </Base.Item>
  );
}

type LinkItemProps = Omit<ComponentProps<typeof Base.LinkItem>, "className"> & { icon?: ReactNode; className?: string };

export function DropdownMenuLinkItem({ icon, className, children, ...props }: LinkItemProps) {
  return (
    <Base.LinkItem className={cn(ITEM, className)} {...props}>
      {icon ? (
        <span aria-hidden className="text-muted">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </Base.LinkItem>
  );
}

type CheckboxItemProps = Omit<ComponentProps<typeof Base.CheckboxItem>, "className"> & { className?: string };

export function DropdownMenuCheckboxItem({ className, children, ...props }: CheckboxItemProps) {
  return (
    <Base.CheckboxItem className={cn(ITEM, className)} {...props}>
      <span className="grid size-4 place-items-center">
        <Base.CheckboxItemIndicator>
          <Check aria-hidden strokeWidth={2} />
        </Base.CheckboxItemIndicator>
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </Base.CheckboxItem>
  );
}

type RadioItemProps = Omit<ComponentProps<typeof Base.RadioItem>, "className"> & { className?: string };

export function DropdownMenuRadioItem({ className, children, ...props }: RadioItemProps) {
  return (
    <Base.RadioItem className={cn(ITEM, className)} {...props}>
      <span className="grid size-4 place-items-center">
        <Base.RadioItemIndicator>
          <Circle aria-hidden className="!size-2 fill-current" />
        </Base.RadioItemIndicator>
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </Base.RadioItem>
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof Base.GroupLabel> & { className?: string }) {
  return <Base.GroupLabel className={cn("px-2.5 pt-2 pb-1 text-micro font-semibold text-muted", className)} {...props} />;
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <Base.Separator className={cn("mx-1 my-1 h-px bg-line-soft", className)} />;
}
