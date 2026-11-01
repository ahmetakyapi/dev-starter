"use client";

import { ContextMenu as Base } from "@base-ui/react/context-menu";
import { Check, ChevronRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

/**
 * Bağlam menüsü: bir NESNENİN (dosya kartı, tablo satırı, tuval öğesi)
 * üzerinde sağ tık ya da dokunmatikte uzun basma ile açılan eylem listesi.
 *
 * GİZLİ BİR KAPIDIR, TEK KAPI OLAMAZ. Sağ tık keşfedilmez; klavyede
 * Shift+F10 / Menü tuşu ancak tarayıcı `contextmenu` olayı üretirse ve
 * tetikleyici odaklanabilirse çalışır, menü de imleç yerine köşede açılabilir.
 * Aynı eylemler nesnenin üzerinde görünür bir "Daha Fazla" düğmesiyle
 * (`dropdown-menu.tsx`) de sunulmalı; bu menü hızlandırıcıdır.
 *
 * Base UI ContextMenu: imleç konumunda açılır, uzun basmayı (dokunmatik)
 * kendisi tanır, ekran kenarında çarpışmayı çözer; menü klavye haritası
 * (oklar, Home/End, harfle atlama, Escape, sağ ok alt menüyü açar, sol ok
 * kapatır) `dropdown-menu.tsx` ile aynı.
 *
 * YIKICI ÖĞE AYRI GRUPTA: "Sil" listenin sonunda, ayırıcıdan sonra ve
 * `tone="danger"` ile kırmızı. Sık eylemlerin arasında durursa yanlışlıkla
 * tıklanır; rengi tek işaret değil, konum da ayırır.
 *
 * KISAYOL: sağda `Kbd` tuşları (görsel ipucu, `aria-hidden`). Kısayolu
 * klavyeye ayrıca bağlamak çağıranın işi; menü yalnızca hatırlatır.
 * Dokunmatikte kısayol anlamsız, `pointer-fine:` dışında gizlenir.
 *
 * Yüzey `dropdown-menu.tsx` ile aynı dizeyi taşır (dosyalar tek başına
 * kopyalansın diye paylaşılmıyor).
 *
 *   <ContextMenu>
 *     <ContextMenuTrigger className="rounded-xl …">Q3 raporu.pdf</ContextMenuTrigger>
 *     <ContextMenuContent>
 *       <ContextMenuItem icon={<Eye />} shortcut={["⌘", "O"]}>Aç</ContextMenuItem>
 *       <ContextMenuSub label="Taşı" icon={<FolderInput />}>…</ContextMenuSub>
 *       <ContextMenuSeparator />
 *       <ContextMenuGroup><ContextMenuItem tone="danger">Sil</ContextMenuItem></ContextMenuGroup>
 *     </ContextMenuContent>
 *   </ContextMenu>
 */

export const ContextMenu = Base.Root;
export const ContextMenuTrigger = Base.Trigger;
export const ContextMenuGroup = Base.Group;
export const ContextMenuRadioGroup = Base.RadioGroup;

const SURFACE =
  "min-w-56 max-w-[var(--available-width)] rounded-lg border border-line-strong bg-overlay p-1 text-body shadow-modal outline-none origin-(--transform-origin) transition-[opacity,scale] duration-150 data-starting-style:scale-[0.97] data-starting-style:opacity-0 data-ending-style:scale-[0.97] data-ending-style:opacity-0";

/* Dokunmatikte 44, farede 36 piksel satır; fare ve klavye aynı vurguyu paylaşır. */
const ITEM =
  "flex min-h-11 cursor-default select-none items-center gap-2.5 rounded-md px-2.5 text-base outline-none pointer-fine:min-h-9 data-highlighted:bg-primary-wash data-highlighted:text-strong data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

type ContentProps = Omit<ComponentProps<typeof Base.Popup>, "className"> & { className?: string };

export function ContextMenuContent({ className, ...props }: ContentProps) {
  return (
    <Base.Portal>
      <Base.Positioner collisionPadding={8} className="z-50 outline-none">
        <Base.Popup className={cn(SURFACE, className)} {...props} />
      </Base.Positioner>
    </Base.Portal>
  );
}

function Shortcut({ keys }: { keys: readonly string[] }) {
  return (
    <span aria-hidden className="ml-auto hidden shrink-0 items-center gap-0.5 pl-3 pointer-fine:inline-flex">
      {keys.map((key) => (
        <Kbd key={key} className="bg-transparent">
          {key}
        </Kbd>
      ))}
    </span>
  );
}

function Glyph({ children }: { children?: ReactNode }) {
  return children ? (
    <span aria-hidden className="text-muted group-data-highlighted:text-current">
      {children}
    </span>
  ) : null;
}

type ItemProps = Omit<ComponentProps<typeof Base.Item>, "className"> & {
  icon?: ReactNode;
  /** Görsel kısayol ipucu: ["⌘", "D"]. */
  shortcut?: readonly string[];
  tone?: "default" | "danger";
  className?: string;
};

export function ContextMenuItem({ icon, shortcut, tone = "default", className, children, ...props }: ItemProps) {
  return (
    <Base.Item
      className={cn(
        ITEM,
        "group",
        tone === "danger" && "text-danger data-highlighted:bg-danger-wash data-highlighted:text-danger",
        className,
      )}
      {...props}
    >
      {tone === "danger" && icon ? (
        <span aria-hidden>{icon}</span>
      ) : (
        <Glyph>{icon}</Glyph>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut ? <Shortcut keys={shortcut} /> : null}
    </Base.Item>
  );
}

type CheckboxItemProps = Omit<ComponentProps<typeof Base.CheckboxItem>, "className"> & {
  shortcut?: readonly string[];
  className?: string;
};

export function ContextMenuCheckboxItem({ shortcut, className, children, ...props }: CheckboxItemProps) {
  return (
    <Base.CheckboxItem className={cn(ITEM, className)} {...props}>
      <span className="grid size-4 place-items-center text-primary-ink">
        <Base.CheckboxItemIndicator>
          <Check aria-hidden strokeWidth={2.25} />
        </Base.CheckboxItemIndicator>
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut ? <Shortcut keys={shortcut} /> : null}
    </Base.CheckboxItem>
  );
}

type SubProps = {
  /** Alt menüyü açan satırın metni: "Taşı". */
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  children: ReactNode;
};

/**
 * Alt menü: fareyle üstünde beklemek, sağ ok ya da tıklama açar. Bir
 * düzeyden derin alt menü kullanma; dokunmatikte ve dar ekranda zor gezilir.
 */
export function ContextMenuSub({ label, icon, disabled, children }: SubProps) {
  return (
    <Base.SubmenuRoot>
      <Base.SubmenuTrigger
        disabled={disabled}
        className={cn(ITEM, "group data-popup-open:bg-primary-wash data-popup-open:text-strong")}
      >
        <Glyph>{icon}</Glyph>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ChevronRight aria-hidden className="ml-auto text-muted" />
      </Base.SubmenuTrigger>
      <Base.Portal>
        <Base.Positioner sideOffset={2} alignOffset={-5} collisionPadding={8} className="z-50 outline-none">
          <Base.Popup className={cn(SURFACE, "min-w-48")}>{children}</Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.SubmenuRoot>
  );
}

export function ContextMenuLabel({ className, ...props }: ComponentProps<typeof Base.GroupLabel> & { className?: string }) {
  return <Base.GroupLabel className={cn("px-2.5 pt-2 pb-1 text-micro font-semibold text-muted", className)} {...props} />;
}

export function ContextMenuSeparator({ className }: { className?: string }) {
  return <Base.Separator className={cn("mx-1 my-1 h-px bg-line-soft", className)} />;
}
