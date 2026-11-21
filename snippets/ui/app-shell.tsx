"use client";

import { Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
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
 * Daraltma: masaüstünde kenar çubuğu ikon rayına iner. Üç yol: kenar
 * çubuğunun altındaki "Daralt" satırı, ⌘B / Ctrl+B ve kenardaki ince tutamaç
 * (tıkla). Genişlik YUMUŞAK değişir: yalnız dış kap animasyonlu `width`
 * değiştirir; iç düzen sabittir (ikon her durumda aynı x'te, etiketler
 * kırpılır ve solar), yani öğeler yeniden akmaz. `prefers-reduced-motion`ta
 * geçiş yok. Daralmışken etiket DOM'da kalır (ekran okuyucu okur), `title`
 * görünür ipucu olur. `peek` (varsayılan açık): daralmış rayın üzerine gelince
 * (ince işaretçi) kenar çubuğu içeriği itmeden üstüne açılır, çıkınca kapanır.
 *
 * Durum `localStorage` + çerezde (`<storageKey>=collapsed|open`) saklanır.
 * Sunucu bileşeninde çerezi okuyup `defaultCollapsed`e ver: ilk boyamada
 * sıçrama olmaz (`cookies().get(SHELL_SIDEBAR_COOKIE)?.value === "collapsed"`).
 *
 * Telefonda (< lg) kenar çubuğu yok: üstte ince bir çubuk ve menü butonu;
 * gezinme alttan açılan `Sheet`te (başparmağın eriştiği yer). Bağlantıya
 * dokununca çekmece kapanır.
 *
 * İkonlar `ReactNode` (`icon: <Inbox />`), bileşen tipi değil: sunucu
 * bileşeni istemci bileşenine fonksiyon geçiremez, öğe geçirebilir.
 * Etkin öğe `current` ile `href`in birebir eşitliği; alt sayfalar da etkin
 * sayılsın istiyorsan `current`i çağıran tarafta üst yola indir.
 */

/** Varsayılan çerez/anahtar adı (`storageKey`). */
export const SHELL_SIDEBAR_COOKIE = "shell-sidebar";
const DEFAULT_STORAGE_KEY = "shell-sidebar";

function persistCollapsed(collapsed: boolean, key: string) {
  const value = collapsed ? "collapsed" : "open";
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Özel pencere / engelli depolama: tercih yalnız çerezde kalır.
  }
  document.cookie = `${key}=${value}; path=/; max-age=31536000; samesite=lax`;
}

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
  /** Daralmış rayın üzerine gelince geçici açılma (ince işaretçi). Varsayılan: açık. */
  peek?: boolean;
  /** Tercihin saklandığı anahtar (localStorage ve çerez adı); `false`: saklama. */
  storageKey?: string | false;
  /** İçerik öğesi. Kabuk sayfanın kökü değilse (vitrin, gömülü önizleme) `div`: sayfada tek `main` olur. */
  contentAs?: "main" | "div";
  /** Telefon üst çubuğunun sağı (arama butonunden önce): bildirim zili gibi. */
  mobileActions?: ReactNode;
  /**
   * Telefonda alt sekme çubuğu (< lg). `openMenu` gezinme çekmecesini açar
   * ("Menü" sekmesi). Çubuğu sen `fixed inset-x-0 bottom-0 lg:hidden` ile
   * konumlarsın; kabuk içerik karosuna alttan 5 rem boşluk bırakır, son satır
   * çubuğun altında kalmaz.
   */
  bottomBar?: (api: { openMenu: () => void }) => ReactNode;
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
  peek = true,
  storageKey = DEFAULT_STORAGE_KEY,
  contentAs: Content = "main",
  mobileActions,
  bottomBar,
  className,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsedState] = useState(defaultCollapsed);
  const [peeking, setPeeking] = useState(false);
  const [ready, setReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sidebarId = useId();
  const peekTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const setCollapsed = useCallback((next: boolean | ((value: boolean) => boolean)) => {
    setPeeking(false);
    setCollapsedState((value) => {
      const result = typeof next === "function" ? next(value) : next;
      if (storageKey) persistCollapsed(result, storageKey);
      return result;
    });
  }, [storageKey]);

  // Kayıtlı tercihi uygula (çerezsiz kurulumlarda); sonra geçişleri aç: ilk boyamada animasyon olmasın.
  useEffect(() => {
    try {
      const saved = storageKey ? window.localStorage.getItem(storageKey) : null;
      if (saved === "collapsed" || saved === "open") setCollapsedState(saved === "collapsed");
    } catch {
      // depolama kapalı: varsayılan geçerli
    }
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, [storageKey]);

  // Rota değişince telefon çekmecesi kapanır.
  useEffect(() => {
    setSheetOpen(false);
  }, [current]);

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
  }, [setCollapsed]);

  useEffect(() => () => clearTimeout(peekTimer.current), []);

  const open = !collapsed || peeking;
  const toggleLabel = collapsed ? "Kenar Çubuğunu Genişlet" : "Kenar Çubuğunu Daralt";
  const motion = ready ? "transition-[width] duration-200 ease-out motion-reduce:transition-none" : "";

  const startPeek = (event: React.PointerEvent) => {
    if (!peek || !collapsed || event.pointerType !== "mouse") return;
    clearTimeout(peekTimer.current);
    peekTimer.current = setTimeout(() => setPeeking(true), 140);
  };
  const endPeek = () => {
    clearTimeout(peekTimer.current);
    setPeeking(false);
  };

  return (
    // KAYDIRMA: masaüstünde kabuk ekran boyunda (`lg:h-dvh`), kenar çubuğu yerinde
    // durur ve içerik karosu KENDİ içinde kayar; telefonda sayfa pencereyle kayar.
    // Önceki `min-h-dvh` + her boyda `overflow-y-auto` içeriği hiç kaydırmıyordu
    // ama kaydırma kabı yapıyordu: içerideki `sticky` öğeler (bölüm gezintisi,
    // yapışkan tablo başlığı) yapışmıyor, uzun sayfada kenar çubuğu kayboluyordu.
    <div className={cn("flex min-h-dvh flex-col bg-surface lg:h-dvh lg:flex-row", className)}>
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
        <div className="ml-auto flex items-center gap-1">
          {mobileActions}
          <button
            type="button"
            onClick={onSearch}
            aria-label={searchLabel}
            className="inline-grid size-11 place-items-center rounded-md text-body transition-colors hover:bg-surface-raised hover:text-strong [&_svg]:size-5"
          >
            <Search aria-hidden strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title={brand.name}>
        <ShellNav groups={groups} current={current} collapsed={false} onNavigate={() => setSheetOpen(false)} />
        <div className="mt-4 border-t border-line-soft pt-3">
          <UserRow user={user} action={userAction} collapsed={false} />
        </div>
      </Sheet>

      {/* Masaüstü kenar çubuğu: dış kap yer ayırır (animasyonlu genişlik), iç kap sabit düzenli */}
      <div className={cn("relative hidden shrink-0 lg:block", motion, collapsed ? "w-[4.25rem]" : "w-64")}>
        <aside
          id={sidebarId}
          aria-label="Kenar Çubuğu"
          onPointerEnter={startPeek}
          onPointerLeave={endPeek}
          className={cn(
            "absolute inset-y-0 left-0 z-20 flex flex-col gap-4 overflow-hidden bg-surface p-3",
            motion,
            open ? "w-64" : "w-[4.25rem]",
            peeking && "rounded-r-xl bg-overlay shadow-floating ring-1 ring-line",
          )}
        >
          <Link
            href={brand.href}
            title={open ? undefined : brand.name}
            className="flex min-h-10 shrink-0 items-center gap-2.5 rounded-md px-2 font-semibold text-strong"
          >
            <span aria-hidden className="inline-grid size-7 shrink-0 place-items-center [&_svg]:size-full">
              {brand.logo}
            </span>
            <Fade open={open} className="truncate">
              {brand.name}
            </Fade>
          </Link>

          <button
            type="button"
            onClick={onSearch}
            title={open ? undefined : searchLabel}
            aria-label={open ? undefined : searchLabel}
            className="flex h-10 shrink-0 items-center gap-2.5 overflow-hidden rounded-md border border-line bg-overlay px-[0.8125rem] text-base text-muted shadow-raised transition-colors hover:border-line-strong hover:text-strong [&_svg]:size-4 [&_svg]:shrink-0"
          >
            <Search aria-hidden strokeWidth={1.75} />
            <Fade open={open} className="flex flex-1 items-center gap-2">
              <span className="flex-1 text-start">{searchLabel}</span>
              <span aria-hidden className="inline-flex"><KbdCombo keys={["⌘", "K"]} label="Komut K" /></span>
            </Fade>
          </button>

          <div className="-mx-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 [scrollbar-width:thin]">
            <ShellNav groups={groups} current={current} collapsed={!open} />
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={toggleLabel}
            title={`${toggleLabel} (⌘B)`}
            aria-expanded={!collapsed}
            aria-controls={sidebarId}
            className="flex min-h-10 shrink-0 items-center gap-2.5 overflow-hidden rounded-md px-[0.8125rem] text-base text-muted transition-colors hover:bg-surface-raised hover:text-strong [&_svg]:size-[1.125rem] [&_svg]:shrink-0"
          >
            {collapsed ? <PanelLeftOpen aria-hidden strokeWidth={1.75} /> : <PanelLeftClose aria-hidden strokeWidth={1.75} />}
            <Fade open={open} className="flex-1 text-start">
              {collapsed ? "Genişlet" : "Daralt"}
            </Fade>
          </button>

          <UserRow user={user} action={open ? userAction : null} collapsed={!open} />
        </aside>

        {/* Kenar tutamacı: tıkla, aç/kapa */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={() => setCollapsed((value) => !value)}
          title={`${toggleLabel} (⌘B)`}
          className={cn(
            "group/rail absolute inset-y-0 -right-1.5 z-30 w-3 cursor-col-resize",
            "after:absolute after:inset-y-3 after:left-1/2 after:w-px after:-translate-x-1/2 after:rounded-full after:bg-transparent after:transition-colors hover:after:bg-line-strong",
          )}
        />
      </div>

      {/* İçerik: kuyunun içinde beyaz karo */}
      <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col px-2 pb-2 lg:py-2 lg:pr-2 lg:pl-0", bottomBar && "max-lg:pb-20")}>
        <Content
          id={Content === "main" ? "icerik" : undefined}
          className="min-h-0 flex-1 rounded-xl bg-overlay shadow-raised ring-1 ring-line lg:overflow-y-auto lg:overscroll-contain"
        >
          {children}
        </Content>
      </div>

      {bottomBar ? bottomBar({ openMenu: () => setSheetOpen(true) }) : null}
    </div>
  );
}

/** Etiket: DOM'da kalır (ekran okuyucu), görsel olarak solar; kap genişliği kırpar. */
function Fade({ open, className, children }: { open: boolean; className?: string; children: ReactNode }) {
  return (
    <span className={cn("min-w-0 whitespace-nowrap transition-opacity duration-150 motion-reduce:transition-none", open ? "opacity-100 delay-75" : "opacity-0", className)}>
      {children}
    </span>
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
                <span id={headingId} className="whitespace-nowrap px-2.5 pb-0.5 text-micro font-semibold text-muted">
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
                        "flex min-h-11 items-center gap-2.5 overflow-hidden rounded-md px-[0.8125rem] text-base transition-[background-color,color,box-shadow] duration-150 pointer-fine:min-h-9 [&_svg]:size-[1.125rem] [&_svg]:shrink-0",
                        active
                          ? "bg-overlay font-medium text-strong shadow-raised ring-1 ring-line"
                          : "text-body hover:bg-surface-raised hover:text-strong",
                      )}
                    >
                      <span aria-hidden className={cn("inline-grid place-items-center", active ? "text-strong" : "text-muted")}>
                        {item.icon}
                      </span>
                      <Fade open={!collapsed} className="flex-1 truncate">
                        {item.label}
                      </Fade>
                      {item.badge !== undefined ? (
                        <Fade open={!collapsed}>
                          <span className="rounded-full bg-surface-raised px-1.5 text-micro font-semibold text-body tabular-nums">
                            {item.badge}
                          </span>
                        </Fade>
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
    <div className="flex min-h-12 shrink-0 items-center gap-2.5 overflow-hidden rounded-md px-1.5">
      <Avatar name={user.name} src={user.avatarSrc} size="sm" />
      <div className={cn("min-w-0 flex-1 whitespace-nowrap transition-opacity duration-150 motion-reduce:transition-none", collapsed && "opacity-0")}>
        <p className="truncate text-base font-medium text-strong">{user.name}</p>
        {user.detail ? <p className="truncate text-small text-muted">{user.detail}</p> : null}
      </div>
      {action}
    </div>
  );
}
