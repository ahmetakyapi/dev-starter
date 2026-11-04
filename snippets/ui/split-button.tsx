"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Bölünmüş düğme: en sık seçilen eylem ve aynı işin kardeşleri tek hapta
 * ("CSV Olarak İndir" + ▾ Excel, PDF). Kardeşler GERÇEKTEN aynı işin
 * biçimleriyse kullan; farklı işler (Düzenle, Sil, Paylaş) tek düğmeye
 * sıkıştırılmaz, onlar `dropdown-menu`.
 *
 * İKİ AYRI DÜĞME, TEK GÖRÜNÜŞ: sol yarı ana eylemi hemen yapar, sağdaki ok
 * menüyü açar. Ekran okuyucu ikisini ayrı duyar: ana düğme kendi adıyla,
 * ok "Diğer Biçimler" (değiştirilebilir) + menü düğmesi bilgisiyle (Base UI
 * Menu: oklar, Home/End, harfle atlama, Escape, odak dönüşü).
 *
 * GÖRÜNÜŞ: iki yarı arasında 1 px'lik aralık (dolgunun kendi tonunda
 * soluk çizgi), dış köşeler yuvarlak, iç köşeler düz. Menü açıkken ok
 * döner (`data-popup-open`). Dokunmatikte ikisi de 44 px.
 *
 *   <SplitButton onClick={csv} items={[{ label: "Excel (.xlsx)", onSelect: xlsx }]}>CSV Olarak İndir</SplitButton>
 */

export type SplitItem = { label: string; onSelect: () => void; icon?: ReactNode; tone?: "default" | "danger"; disabled?: boolean };

const TONES = {
  primary: {
    face: "bg-primary text-on-primary hover:bg-primary-hover",
    seam: "bg-on-primary/25",
    shadow: "shadow-cta",
  },
  secondary: {
    face: "bg-overlay text-strong hover:bg-surface-raised",
    seam: "bg-line",
    shadow: "shadow-raised",
  },
} as const;

type SplitButtonProps = {
  children: ReactNode;
  onClick: () => void;
  items: readonly SplitItem[];
  /** Ok düğmesinin adı. */
  menuLabel?: string;
  variant?: keyof typeof TONES;
  disabled?: boolean;
  /** Ana eylemin ikonu (metnin solunda). */
  icon?: ReactNode;
  className?: string;
};

export function SplitButton({ children, onClick, items, menuLabel = "Diğer Biçimler", variant = "primary", disabled = false, icon, className }: SplitButtonProps) {
  const t = TONES[variant];
  const half =
    "inline-flex min-h-11 items-center justify-center gap-2 font-semibold transition-[background-color,scale] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 pointer-fine:min-h-10 [&_svg]:size-4";
  return (
    <div role="group" aria-label={typeof children === "string" ? children : undefined} className={cn("inline-flex items-stretch rounded-md", t.shadow, className)}>
      <button type="button" disabled={disabled} onClick={onClick} className={cn(half, "rounded-l-md px-4 text-base", t.face)}>
        {icon}
        {children}
      </button>
      <span aria-hidden className={cn("w-px", t.seam)} />
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled}
          aria-label={menuLabel}
          className={cn(half, "group rounded-r-md px-2.5", t.face)}
        >
          <ChevronDown aria-hidden className="transition-[rotate] duration-200 group-data-popup-open:rotate-180" strokeWidth={2.25} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {items.map((item) => (
            <DropdownMenuItem key={item.label} icon={item.icon} tone={item.tone} disabled={item.disabled} onClick={item.onSelect}>
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
