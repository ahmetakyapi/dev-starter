"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import { useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/**
 * Biçim değiştiren menü: koyu ya da açık bir hap menü; bir başlığın üzerine
 * gelince altında TEK bir kabuk açılır ve başlıklar arasında gezerken aynı
 * kabuk yeni panelin boyuna esner, içerik buğulanarak yer değiştirir
 * (soldan sağa giderken sağdan gelir). Başlıkların arkasında tek bir vurgu
 * karosu kayar. scrolltide.co'nun "Morph Navbar" bileşeninden öğrenildi (kod
 * alınmadı); aynı fikir Stripe ve Vercel menülerinde.
 *
 * NE ZAMAN: ürünü, kaynakları, çözümleri olan tanıtım sitesinde birden çok
 * zengin alt menü (ikon + açıklama + öne çıkan kart).
 * NE ZAMAN DEĞİL: üç-dört düz bağlantı (`docking-nav` ya da `SiteHeader`);
 * uygulama içi gezinme (`app-shell`); eylem listesi (`dropdown-menu`).
 *
 * NEDEN TEK KABUK: her başlık kendi açılır kutusunu açınca kutu kapanıp
 * yeniden açılır, göz her seferinde yeniden bulur. Tek kabuk yerinde kalır,
 * yalnız boyu değişir: "aynı menüdeyim, başka bölümdeyim".
 *
 * HAREKET: kabuğun eni ve boyu 280 ms `--ease-brand` (tek öğe, içerik
 * mutlak konumlu olduğundan akış yeniden dizilmez; Base UI NavigationMenu
 * de aynı yolu kullanır); paneller `opacity` + `transform` + 6 px buğu;
 * vurgu karosu `transform` + `width`. Hareket azaltmada hepsi anında.
 *
 * ERİŞİLEBİLİRLİK: menü rolü YOK (gezinme bağlantılarıdır, uygulama menüsü
 * değil): `nav` + açma düğmeleri `aria-expanded` + `aria-controls`. Fareyle
 * üzerine gelince açılır (yalnız ince işaretçi), tıklamayla da açılır/kapanır.
 * ↓ panelin ilk bağlantısına, Esc kapatır ve odağı başlığa döndürür, odak
 * menüden çıkınca kapanır. Kapalı paneller `inert`. Telefonda menü düğmesi
 * bütün grupları alt alta açar (ince işaretçi yoksa hover hiç devrede değil).
 *
 *   <MorphNav
 *     brand={<a href="/">Akış</a>}
 *     items={[
 *       { label: "Ürün", content: <MorphNavGrid links={[{ href: "/x", title: "Gelen Kutusu", description: "…", icon: Inbox }]} /> },
 *       { label: "Fiyat", href: "/fiyat" },
 *     ]}
 *     action={<a href="/kayit" className="… bg-cta text-on-brand">Başla</a>}
 *   />
 */

export type MorphNavItem =
  | { label: string; href: string; content?: never }
  | { label: string; content: ReactNode; href?: never };

type MorphNavProps = {
  brand: ReactNode;
  items: readonly MorphNavItem[];
  /** Sağdaki birincil eylem (tek). */
  action?: ReactNode;
  label?: string;
  className?: string;
};

const CSS = `
.ui-morph-shell { transition: width 280ms var(--ease-brand), height 280ms var(--ease-brand), opacity 180ms var(--ease-brand), transform 280ms var(--ease-brand); }
.ui-morph-panel { transition: opacity 220ms var(--ease-brand), transform 280ms var(--ease-brand), filter 220ms var(--ease-brand); }
.ui-morph-panel[data-state="before"] { opacity: 0; transform: translateX(-24px); filter: blur(6px); }
.ui-morph-panel[data-state="after"] { opacity: 0; transform: translateX(24px); filter: blur(6px); }
.ui-morph-glide { transition: transform 280ms var(--ease-brand), width 280ms var(--ease-brand), opacity 160ms var(--ease-brand); }
.ui-morph[data-reduce] .ui-morph-shell, .ui-morph[data-reduce] .ui-morph-panel, .ui-morph[data-reduce] .ui-morph-glide { transition: none; }`;

const finePointer = () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export function MorphNav({ brand, items, action, label = "Ana menü", className }: MorphNavProps) {
  const reduce = useReducedMotion();
  const baseId = useId();
  const [active, setActive] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [glide, setGlide] = useState<{ x: number; w: number } | null>(null);
  const root = useRef<HTMLElement>(null);
  const triggers = useRef<(HTMLElement | null)[]>([]);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const closeTimer = useRef<number | undefined>(undefined);

  const panelIndexes = items.flatMap((item, index) => (item.content ? [index] : []));

  const open = useCallback((index: number) => {
    window.clearTimeout(closeTimer.current);
    setActive(index);
  }, []);
  const scheduleClose = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setActive(null), 140);
  }, []);
  const close = useCallback((focusIndex?: number) => {
    window.clearTimeout(closeTimer.current);
    setActive(null);
    if (focusIndex !== undefined) triggers.current[focusIndex]?.focus();
  }, []);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Fareyle açılan panelde odak menüde olmayabilir: Esc belge düzeyinde de kapatır.
  useEffect(() => {
    if (active === null) return;
    const onKey = (event: globalThis.KeyboardEvent) => event.key === "Escape" && setActive(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);

  // Açık panelin ölçüsü kabuğa yazılır; panel içeriği değişirse (resim yüklendi) yeniden ölçülür.
  useLayoutEffect(() => {
    if (active === null) return;
    const node = panels.current[active];
    if (!node) return;
    const measure = () => setSize({ w: node.offsetWidth, h: node.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [active]);

  // Vurgu karosu açık başlığın altında.
  useLayoutEffect(() => {
    const trigger = active === null ? null : triggers.current[active];
    if (!trigger) return;
    setGlide({ x: trigger.offsetLeft, w: trigger.offsetWidth });
  }, [active]);

  const onTriggerKey = (event: KeyboardEvent, index: number) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      open(index);
      requestAnimationFrame(() => panels.current[index]?.querySelector<HTMLElement>("a, button")?.focus());
    } else if (event.key === "Escape") {
      close(index);
    }
  };

  const onRootKey = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    if (active !== null) close(active);
    if (mobileOpen) setMobileOpen(false);
  };

  return (
    <nav
      ref={root}
      aria-label={label}
      data-reduce={reduce ? "" : undefined}
      onKeyDown={onRootKey}
      onPointerLeave={(event) => event.pointerType === "mouse" && scheduleClose()}
      onPointerEnter={() => window.clearTimeout(closeTimer.current)}
      onBlur={(event) => {
        if (!root.current?.contains(event.relatedTarget as Node | null)) {
          setActive(null);
          setMobileOpen(false);
        }
      }}
      className={cn("ui-morph relative mx-auto w-full max-w-5xl", className)}
    >
      <style href="ui-morph-nav" precedence="default">
        {CSS}
      </style>

      <div className="flex h-14 items-center gap-2 rounded-full bg-overlay py-2 pr-2 pl-5 shadow-raised ring-1 ring-line">
        <div className="mr-auto flex min-w-0 shrink-0 items-center text-title font-bold text-strong md:mr-4">{brand}</div>

        <div className="relative hidden md:block">
          <span
            aria-hidden
            className="ui-morph-glide absolute inset-y-0 left-0 rounded-full bg-surface"
            style={{
              transform: `translateX(${glide?.x ?? 0}px)`,
              width: glide?.w ?? 0,
              opacity: active === null ? 0 : 1,
            }}
          />
          <ul className="relative flex items-center">
          {items.map((item, index) => (
            <li key={item.label}>
              {item.content ? (
                <button
                  ref={(node) => {
                    triggers.current[index] = node;
                  }}
                  type="button"
                  aria-expanded={active === index}
                  aria-controls={`${baseId}-panel-${index}`}
                  onPointerEnter={(event) => event.pointerType === "mouse" && finePointer() && open(index)}
                  onClick={() => (active === index ? close() : open(index))}
                  onKeyDown={(event) => onTriggerKey(event, index)}
                  className="flex h-10 items-center gap-1 rounded-full px-3.5 text-base font-medium text-soft transition-colors hover:text-strong aria-expanded:text-strong"
                >
                  {item.label}
                  <ChevronDown
                    aria-hidden
                    className={cn("size-3.5 transition-transform duration-200", active === index && "rotate-180")}
                    strokeWidth={2.25}
                  />
                </button>
              ) : (
                <a
                  ref={(node) => {
                    triggers.current[index] = node;
                  }}
                  href={item.href}
                  onPointerEnter={() => active !== null && setActive(null)}
                  className="flex h-10 items-center rounded-full px-3.5 text-base font-medium text-soft transition-colors hover:text-strong"
                >
                  {item.label}
                </a>
              )}
            </li>
          ))}
          </ul>
        </div>

        <div className="ml-auto hidden shrink-0 md:block">{action}</div>

        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls={`${baseId}-mobile`}
          aria-label={mobileOpen ? "Menüyü Kapat" : "Menüyü Aç"}
          onClick={() => setMobileOpen((value) => !value)}
          className="grid size-11 place-items-center rounded-full text-strong transition-colors hover:bg-surface md:hidden"
        >
          {mobileOpen ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        </button>
      </div>

      {/* Masaüstü: tek kabuk, içinde bütün paneller üst üste; yalnız açık olan görünür ve ölçülür. */}
      <div
        className="ui-morph-shell absolute top-full left-1/2 z-50 mt-2 hidden overflow-hidden rounded-2xl bg-overlay shadow-floating ring-1 ring-line md:block"
        style={
          {
            width: size?.w ?? 0,
            height: size?.h ?? 0,
            opacity: active === null ? 0 : 1,
            transform: `translateX(-50%) translateY(${active === null ? -6 : 0}px)`,
            pointerEvents: active === null ? "none" : undefined,
          } as CSSProperties
        }
      >
        {panelIndexes.map((index) => {
          const state = active === index ? "open" : active === null || index > active ? "after" : "before";
          return (
            <div
              key={index}
              id={`${baseId}-panel-${index}`}
              ref={(node) => {
                panels.current[index] = node;
              }}
              data-state={state}
              inert={active !== index}
              onKeyDown={(event) => event.key === "Escape" && close(index)}
              className="ui-morph-panel absolute top-0 left-0 w-max max-w-[min(56rem,calc(100vw-2rem))] p-3"
            >
              {items[index].content}
            </div>
          );
        })}
      </div>

      {/* Telefon: gruplar alt alta, düz bağlantılar en altta. */}
      {mobileOpen ? (
        <div
          id={`${baseId}-mobile`}
          className="absolute inset-x-0 top-full z-50 mt-2 grid max-h-[calc(100dvh-6rem)] gap-4 overflow-y-auto rounded-2xl bg-overlay p-4 shadow-floating ring-1 ring-line md:hidden"
        >
          {items.map((item) =>
            item.content ? (
              <section key={item.label} aria-label={item.label} className="grid gap-2">
                <p className="px-2 text-small font-semibold text-muted">{item.label}</p>
                {item.content}
              </section>
            ) : null,
          )}
          <div className="grid gap-1 border-t border-line pt-3">
            {items.map((item) =>
              item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex h-11 items-center rounded-lg px-2 text-base font-medium text-strong hover:bg-surface"
                >
                  {item.label}
                </a>
              ) : null,
            )}
            {action ? <div className="pt-2">{action}</div> : null}
          </div>
        </div>
      ) : null}
    </nav>
  );
}

type GridLink = {
  href: string;
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
};

/**
 * Panel içeriği için hazır ızgara: ikon karosu + başlık + tek satır açıklama;
 * isteğe bağlı sağda öne çıkan alan (`feature`: kapak, son yazı, sürüm notu).
 * Masaüstünde iki sütun, telefonda tek.
 */
export function MorphNavGrid({
  links,
  feature,
  className,
}: {
  links: readonly GridLink[];
  feature?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 md:flex-row", className)}>
      <ul className={cn("grid gap-1", links.length > 3 && "md:grid-cols-2", "md:w-max")}>
        {links.map(({ href, title, description, icon: Icon }) => (
          <li key={href}>
            <a
              href={href}
              className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-surface focus-visible:bg-surface md:w-64"
            >
              {Icon ? (
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-strong shadow-raised ring-1 ring-line-soft transition-colors group-hover:bg-overlay">
                  <Icon aria-hidden className="size-4" strokeWidth={2} />
                </span>
              ) : null}
              <span className="grid min-w-0 gap-0.5">
                <span className="text-base font-semibold text-strong">{title}</span>
                {description ? <span className="text-small text-muted">{description}</span> : null}
              </span>
            </a>
          </li>
        ))}
      </ul>
      {feature ? <div className="md:w-60">{feature}</div> : null}
    </div>
  );
}
