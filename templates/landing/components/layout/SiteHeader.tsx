"use client";

import { Layers, Menu, X } from "lucide-react";
import { AnimatePresence, m, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useId, useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { nav } from "@/lib/content";
import { DUR, EASE } from "@/lib/motion";
import { SITE_NAME } from "@/lib/site";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/*
 * Yapışkan başlık. Sayfanın başında zeminle bir, kaydırınca örtü tonuna ve
 * alt çizgiye geçer: içeriğin altından aktığı anlaşılır.
 *
 * Kaydırma `useScroll` ile izlenir (scroll dinleyicisi yok). Durum yalnızca
 * EŞİK geçildiğinde değişir; aynı değeri yeniden yazmak React'te çizim
 * tetiklemez, yani her kaydırma karesinde ağaç yeniden çizilmez.
 */
const SCROLL_THRESHOLD = 8;

export function SiteHeader({ initialTheme }: { initialTheme: Theme }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useMotionValueEvent(scrollY, "change", (value) => setScrolled(value > SCROLL_THRESHOLD));

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toned = scrolled || open;

  return (
    <header
      data-scrolled={toned}
      className={cn(
        "site-header sticky top-0 z-30 pt-[env(safe-area-inset-top)]",
        // Telefonda en üstte de opak: saydam üst katmanda iOS 26 Safari durum
        // çubuğunun altını bulanıklaştırıyor ("buğulu üst", mistakes.md #94).
        toned ? "bg-overlay" : "bg-page md:bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#ust" className="flex min-h-11 items-center gap-2.5 rounded-md">
          {/* Marka karosu: degradenin izinli üç yerinden biri. */}
          <span aria-hidden className="grid size-8 place-items-center rounded-sm bg-brand text-on-brand [&_svg]:size-4">
            <Layers />
          </span>
          <span className="text-read font-bold text-strong">{SITE_NAME}</span>
        </a>

        <nav aria-label="Ana menü" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {nav.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="inline-flex min-h-11 items-center rounded-md px-3 text-base font-medium text-body transition-colors hover:text-strong"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle initialTheme={initialTheme} />
          <a href={nav.cta.href} className={buttonClass({ variant: "primary", size: "sm", className: "hidden sm:inline-flex" })}>
            {nav.cta.label}
          </a>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            className="inline-grid size-11 place-items-center rounded-full text-body hover:text-strong md:hidden [&_svg]:size-5"
          >
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <m.nav
            id={menuId}
            aria-label="Mobil menü"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: DUR.base, ease: EASE }}
            className="absolute inset-x-0 top-full border-b border-line-soft bg-page px-4 pb-4 shadow-floating md:hidden"
          >
            <ul className="divide-y divide-line-soft">
              {nav.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center text-read font-semibold text-strong"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <a
              href={nav.cta.href}
              onClick={() => setOpen(false)}
              className={buttonClass({ variant: "primary", size: "lg", className: "mt-3 w-full" })}
            >
              {nav.cta.label}
            </a>
          </m.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
