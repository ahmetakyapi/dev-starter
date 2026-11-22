"use client";

import { ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Çalışma alanı değiştirici: kenar çubuğunun tepesinde, hangi hesap /
 * şirket / çalışma alanında olduğunu söyleyen ve bir tıkla başkasına
 * geçiren kart ("Dhowline Hospitality · Cari Hesaplar ⇅"). Birden çok
 * kuruluşu olan çok kiracılı ürünlerin ilk kontrolü. Clearbill, Noticeline
 * ve Paymie kenar çubuklarından alındı (yapı; kod, ad, logo alınmadı).
 *
 * `app-shell.tsx`in kenar çubuğuna `header` olarak takılır; bağımsız da
 * durur. Tetikleyici: logo karosu + ad + alt satır (rol ya da plan) +
 * yukarı/aşağı çift ok. Menü: çalışma alanları RADYO listesi (seçili
 * olan işaretli), altında isteğe bağlı eylemler (`footer`: "Yeni
 * Çalışma Alanı", "Hesap Ayarları").
 *
 * ERİŞİLEBİLİRLİK: `dropdown-menu.tsx` (Base UI Menu) üstünde: ok
 * tuşları gezer, harf atlar, Escape tetikleyiciye döner. Tetikleyici
 * adı içerikten gelir ("Çalışma Alanı: <ad> <alt satır>", WCAG 2.5.3:
 * görünen metin adın parçası); daraltılmışta yalnız logo kaldığı için
 * "Çalışma Alanı: <ad>, değiştir" etiketi verilir. Seçili olan `radio` +
 * işaret (renk tek işaret değil). Tek çalışma alanı varsa değiştirici SESSİZ
 * kalır: tıklanamaz düz kimlik kartı (`workspaces.length < 2`), ölü bir
 * açılır liste çizilmez.
 *
 * `collapsed`: daraltılmış kenar çubuğunda yalnız logo karosu (ad
 * `title` ve erişilebilir ad olarak kalır). Logo çağıranın işi
 * (`logo` yuvası; verilmezse adın baş harfi, Türkçe büyük harf).
 *
 *   <WorkspaceSwitcher
 *     value={current}
 *     onValueChange={setCurrent}
 *     workspaces={[
 *       { id: "dh", name: "Dhowline Hospitality", subtitle: "Cari Hesaplar" },
 *       { id: "nl", name: "Noticeline", subtitle: "Yönetici" },
 *     ]}
 *     footer={<DropdownMenuItem icon={<Plus />}>Yeni Çalışma Alanı</DropdownMenuItem>}
 *   />
 */

export type Workspace = { id: string; name: string; subtitle?: string; logo?: ReactNode };

function Tile({ workspace, size }: { workspace: Workspace; size: "sm" | "md" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-md bg-overlay font-semibold text-strong shadow-raised",
        size === "md" ? "size-9 text-small" : "size-7 text-micro",
      )}
    >
      {workspace.logo ?? workspace.name.trim().charAt(0).toLocaleUpperCase("tr-TR")}
    </span>
  );
}

export function WorkspaceSwitcher({
  workspaces,
  value,
  onValueChange,
  footer,
  collapsed = false,
  menuLabel = "Çalışma Alanları",
  className,
}: {
  workspaces: readonly Workspace[];
  value: string;
  onValueChange?: (id: string) => void;
  footer?: ReactNode;
  collapsed?: boolean;
  menuLabel?: string;
  className?: string;
}) {
  const current = workspaces.find((w) => w.id === value) ?? workspaces[0];
  if (!current) return null;

  const face = (
    <>
      <Tile workspace={current} size="md" />
      {collapsed ? null : (
        <>
          <span className="min-w-0 flex-1 text-start">
            <span className="block truncate text-base font-semibold text-strong">
              <span className="sr-only">Çalışma Alanı: </span>
              {current.name}
            </span>
            {current.subtitle ? <span className="block truncate text-small text-body">{current.subtitle}</span> : null}
          </span>
          {workspaces.length > 1 ? <ChevronsUpDown aria-hidden strokeWidth={1.75} className="size-4 shrink-0 text-muted" /> : null}
        </>
      )}
    </>
  );
  const shell = cn(
    "flex min-h-14 w-full items-center gap-3 rounded-xl bg-surface p-2.5 transition-colors",
    collapsed && "justify-center p-1.5",
    className,
  );

  // Tek çalışma alanı: ölü bir açılır liste çizme, düz kimlik kartı.
  if (workspaces.length < 2) {
    return (
      <div className={shell} title={collapsed ? current.name : undefined}>
        {face}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        // Görünen metin erişilebilir adın PARÇASI olmalı (WCAG 2.5.3): açıkken ad
        // içerikten gelir, daraltılmışta (yalnız logo) etiket verilir.
        aria-label={collapsed ? `Çalışma Alanı: ${current.name}, değiştir` : undefined}
        title={collapsed ? current.name : undefined}
        className={cn(shell, "cursor-pointer hover:bg-surface-raised")}
      >
        {face}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-64">
        <DropdownMenuRadioGroup value={current.id} onValueChange={(next) => onValueChange?.(String(next))}>
          <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
          {workspaces.map((w) => (
            <DropdownMenuRadioItem key={w.id} value={w.id} className="min-h-12 gap-3">
              <Tile workspace={w} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base text-strong">{w.name}</span>
                {w.subtitle ? <span className="block truncate text-small text-body">{w.subtitle}</span> : null}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {footer ? (
          <>
            <DropdownMenuSeparator />
            {footer}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
