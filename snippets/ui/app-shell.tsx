"use client";

import { Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { openCommandPalette } from "@/components/ui/command-palette";
import { KbdCombo } from "@/components/ui/kbd";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Uygulama kabuğu: solda kenar çubuğu (logo, arama/⌘K tetikleyici, gruplu
 * gezinme, altta kullanıcı), sağda içerik. Panel, gelen kutusu, sohbet gibi
 * oturum açılmış her ekranın iskeleti. Tanıtım sayfası için DEĞİL (orada
 * üst gezinme çubuğu).
 *
 * DİL ("board"): kabuğun tamamı gri bir kuyu (`bg-surface`), içerik onun
 * içinde beyaz bir karo (`bg-overlay`). Seçili gezinme öğesi aynı beyaz
 * karo + kıl halkası: "bu sayfa öne çıkmış" ton farkıyla okunur, renkli
 * şeritle değil. Gezinme rengi vurgu ailesinden ALMAZ; palet değişince
 * kabuk sakin kalır, yalnız eylemler renklenir.
 *
 * Daraltma: masaüstünde kenar çubuğu ikon sütununa iner (⌘B / Ctrl+B ya da
 * düğme). Genişlik ANİMASYONLA DEĞİŞMEZ: `width` geçişi her karede düzeni
 * yeniden hesaplatır; sütun anında değişir, etiketler kısa bir solmayla
 * gelir. Daralmışken etiket `sr-only` kalır (ekran okuyucu yine okur) ve
 * `title` ile görünür ipucu olur.
 *
 * Telefonda (< lg) kenar çubuğu yok: üstte ince bir çubuk ve menü düğmesi;
 * gezinme alttan açılan `Sheet`te (başparmağın eriştiği yer). Bağlantıya
 * dokununca çekmece kapanır.
 *
 * İkonlar `ReactNode` (`icon: <Inbox />`), bileşen tipi değil: sunucu
 * bileşeni istemci bileşenine fonksiyon geçiremez, öğe geçirebilir.
 * Etkin öğe `current` ile `href`in birebir eşitliği; alt sayfalar da etkin
 * sayılsın istiyorsan `current`i çağıran tarafta üst yola indir.
 */

export type ShellNavItem = { href: string; label: string; icon: ReactNode; badge?: ReactNode };
export type ShellNavGroup = { label?: string; items: readonly ShellNavItem[] };

type AppShellProps = {
  brand: { name: string; href: string; logo: ReactNode };
  groups: readonly ShellNavGroup[];
  /** Etkin yol (`usePathname()`), `aria-current="page"` buna göre. */
  current: string;
  user: { name: string; detail?: string; avatarSrc?: string | null };
  /** Kullanıcı satırının sağı: çıkış, menü… */
  userAction?: ReactNode;
  /** Arama tetikleyici; verilmezse `command-palette.tsx` açılır. */
  onSearch?: () => void;
  searchLabel?: string;
  defaultCollapsed?: boolean;
  /** İçerik öğesi. Kabuk sayfanın kökü değilse (vitrin, gömülü önizleme) `div`: sayfada tek `main` olur. */
  contentAs?: "main" | "div";
  /** Kabuğun yüksekliği; varsayılan tam ekran. */
  className?: string;
  children: ReactNode;
};

export function AppShell({
  brand,
  groups,
  current,
  user,
  userAction,
  onSearch = openCommandPalette,
  searchLabel = "Ara",
  defaultCollapsed = false,
  contentAs: Content = "main",
  className,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sidebarId = useId();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "b") return;
      // Metin alanında ⌘B kalın yazıdır; orada araya girme.
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      event.preventDefault();
      setCollapsed((value) => !value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleLabel = collapsed ? "Kenar Çubuğunu Genişlet" : "Kenar Çubuğunu Daralt";

  return (
    <div className={cn("flex min-h-dvh flex-col bg-surface lg:flex-row", className)}>
      {/* Telefon üst çubuğu */}
      <header className="flex h-14 shrink-0 items-center gap-2 px-3 lg:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="Gezinmeyi Aç"
          aria-haspopup="dialog"
          className="inline-grid size-11 place-items-center rounded-md text-body transition-colors hover:bg-surface-raised hover:text-strong [&_svg]:size-5"
        >
          <Menu aria-hidden strokeWidth={1.75} />
        </button>
        <Link href={brand.href} className="flex min-h-11 items-center gap-2 rounded-md font-semibold text-strong">
          <span aria-hidden className="inline-grid size-7 place-items-center [&_svg]:size-full">
            {brand.logo}
          </span>
          {brand.name}
        </Link>
        <button
          type="button"
          onClick={onSearch}
          aria-label={searchLabel}
          className="ml-auto inline-grid size-11 place-items-center rounded-md text-body transition-colors hover:bg-surface-raised hover:text-strong [&_svg]:size-5"
        >
          <Search aria-hidden strokeWidth={1.75} />
        </button>
      </header>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title={brand.name}>
        <ShellNav groups={groups} current={current} collapsed={false} onNavigate={() => setSheetOpen(false)} />
        <div className="mt-4 border-t border-line-soft pt-3">
          <UserRow user={user} action={userAction} collapsed={false} />
        </div>
      </Sheet>

      {/* Masaüstü kenar çubuğu */}
      <aside
        id={sidebarId}
        aria-label="Kenar Çubuğu"
        className={cn("hidden shrink-0 flex-col gap-4 p-3 lg:flex", collapsed ? "w-[4.25rem]" : "w-64")}
      >
        <div className={cn("flex items-center gap-1", collapsed && "flex-col")}>
          <Link
            href={brand.href}
            title={collapsed ? brand.name : undefined}
            className="flex min-h-10 min-w-0 flex-1 items-center gap-2.5 rounded-md px-1.5 font-semibold text-strong"
          >
            <span aria-hidden className="inline-grid size-7 shrink-0 place-items-center [&_svg]:size-full">
              {brand.logo}
            </span>
            <span className={cn("truncate", collapsed && "sr-only")}>{brand.name}</span>
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={toggleLabel}
            title={`${toggleLabel} (⌘B)`}
            aria-expanded={!collapsed}
            aria-controls={sidebarId}
            className="inline-grid size-10 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface-raised hover:text-strong [&_svg]:size-[1.125rem]"
          >
            {collapsed ? <PanelLeftOpen aria-hidden strokeWidth={1.75} /> : <PanelLeftClose aria-hidden strokeWidth={1.75} />}
          </button>
        </div>

        <button
          type="button"
          onClick={onSearch}
          aria-label={collapsed ? searchLabel : undefined}
          title={collapsed ? searchLabel : undefined}
          className={cn(
            "flex h-10 shrink-0 items-center gap-2.5 rounded-md border border-line bg-overlay text-base text-muted shadow-raised transition-colors hover:border-line-strong hover:text-strong [&_svg]:size-4 [&_svg]:shrink-0",
            collapsed ? "justify-center" : "px-3",
          )}
        >
          <Search aria-hidden strokeWidth={1.75} />
          {collapsed ? null : (
            <>
              <span className="flex-1 text-start">{searchLabel}</span>
              <KbdCombo keys={["⌘", "K"]} label="Komut K" />
            </>
          )}
        </button>

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          <ShellNav groups={groups} current={current} collapsed={collapsed} />
        </div>

        <UserRow user={user} action={collapsed ? null : userAction} collapsed={collapsed} />
      </aside>

      {/* İçerik: kuyunun içinde beyaz karo */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-2 pb-2 lg:py-2 lg:pr-2 lg:pl-0">
        <Content
          id={Content === "main" ? "icerik" : undefined}
          className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-overlay shadow-raised ring-1 ring-line"
        >
          {children}
        </Content>
      </div>
    </div>
  );
}

function ShellNav({
  groups,
  current,
  collapsed,
  onNavigate,
}: {
  groups: readonly ShellNavGroup[];
  current: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const baseId = useId();
  return (
    <nav aria-label="Ana Gezinme" className="grid gap-4">
      {groups.map((group, groupIndex) => {
        const headingId = `${baseId}-${groupIndex}`;
        return (
          <div key={group.label ?? groupIndex} className="grid gap-1">
            {group.label ? (
              collapsed ? (
                <>
                  <span id={headingId} className="sr-only">
                    {group.label}
                  </span>
                  {groupIndex > 0 ? <span aria-hidden className="mx-3 mb-1 h-px bg-line" /> : null}
                </>
              ) : (
                <span id={headingId} className="px-2.5 pb-0.5 text-micro font-semibold text-muted">
                  {group.label}
                </span>
              )
            ) : null}
            <ul aria-labelledby={group.label ? headingId : undefined} className="grid gap-0.5">
              {group.items.map((item) => {
                const active = item.href === current;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      onClick={onNavigate}
                      className={cn(
                        "flex min-h-11 items-center gap-2.5 rounded-md text-base transition-[background-color,color,box-shadow] duration-150 pointer-fine:min-h-9 [&_svg]:size-[1.125rem] [&_svg]:shrink-0",
                        collapsed ? "justify-center" : "px-2.5",
                        active
                          ? "bg-overlay font-medium text-strong shadow-raised ring-1 ring-line"
                          : "text-body hover:bg-surface-raised hover:text-strong",
                      )}
                    >
                      <span aria-hidden className={cn("inline-grid place-items-center", active ? "text-strong" : "text-muted")}>
                        {item.icon}
                      </span>
                      <span className={cn("min-w-0 flex-1 truncate", collapsed && "sr-only")}>{item.label}</span>
                      {item.badge !== undefined && !collapsed ? (
                        <span className="rounded-full bg-surface-raised px-1.5 text-micro font-semibold text-body tabular-nums">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function UserRow({
  user,
  action,
  collapsed,
}: {
  user: AppShellProps["user"];
  action?: ReactNode;
  collapsed: boolean;
}) {
  return (
    <div className={cn("flex min-h-12 items-center gap-2.5 rounded-md", collapsed ? "justify-center" : "px-1.5")}>
      <Avatar name={user.name} src={user.avatarSrc} size="sm" />
      <div className={cn("min-w-0 flex-1", collapsed && "sr-only")}>
        <p className="truncate text-base font-medium text-strong">{user.name}</p>
        {user.detail ? <p className="truncate text-small text-muted">{user.detail}</p> : null}
      </div>
      {action}
    </div>
  );
}
