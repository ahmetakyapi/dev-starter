"use client";

import Link from "next/link";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Sekmeler, iki biçim:
 *
 * `Tabs`: AYNI SAYFADA içerik değiştiren sekmeler (WAI-ARIA tabs). Ok
 * tuşları sekmeler arasında gezer ve sekmeyi hemen etkinleştirir (otomatik
 * etkinleştirme: paneller hazır, yükleme yok). Tab tuşu sekme listesinden
 * PANELE geçer; sekme listesi tek durak. Paneller `hidden` ile saklanır,
 * DOM'dan atılmaz: içindeki form ya da kaydırma konumu sekme değişince
 * kaybolmaz.
 *
 * `TabLinks`: her sekme AYRI BİR ADRES (`/ayarlar/profil`, `/ayarlar/guvenlik`).
 * Bunlar sekme değil gezinme bağlantısı: `role="tab"` YOK, etkin olan
 * `aria-current="page"`. Paylaşılabilir, geri tuşu çalışır, sunucuda çizilir.
 * Ayrı adresli bir ekranı `Tabs` ile yapmak bağlantıyı paylaşılamaz kılar.
 *
 * Gösterge alt çizgi, sekmeyle birlikte yer değiştirir (CSS); `layoutId`
 * gerekmiyor, dolayısıyla `domMax` de.
 */

export type TabItem = { value: string; label: ReactNode; panel: ReactNode; disabled?: boolean };

type TabsProps = {
  items: readonly TabItem[];
  "aria-label": string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
};

const LIST = "flex max-w-full gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]";
const TAB =
  "relative -mb-px inline-flex min-h-11 shrink-0 items-center border-b-2 border-transparent px-3 text-base font-semibold whitespace-nowrap text-muted transition-colors hover:text-strong disabled:opacity-50 [&:focus-visible]:outline-offset-[-2px]";
const TAB_ACTIVE = "border-primary text-strong";

export function Tabs({ items, defaultValue, value, onValueChange, className, ...props }: TabsProps) {
  const id = useId();
  const [own, setOwn] = useState(defaultValue ?? items[0]?.value);
  const active = value ?? own;
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const enabled = items.filter((item) => !item.disabled);

  function activate(next: string) {
    setOwn(next);
    onValueChange?.(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = enabled.findIndex((item) => item.value === active);
    const last = enabled.length - 1;
    const target =
      event.key === "ArrowRight"
        ? enabled[index >= last ? 0 : index + 1]
        : event.key === "ArrowLeft"
          ? enabled[index <= 0 ? last : index - 1]
          : event.key === "Home"
            ? enabled[0]
            : event.key === "End"
              ? enabled[last]
              : undefined;
    if (!target) return;
    event.preventDefault();
    activate(target.value);
    refs.current.get(target.value)?.focus();
  }

  return (
    <div className={className}>
      <div role="tablist" aria-label={props["aria-label"]} onKeyDown={onKeyDown} className={LIST}>
        {items.map((item) => {
          const selected = item.value === active;
          return (
            <button
              key={item.value}
              ref={(node) => {
                if (node) refs.current.set(item.value, node);
                else refs.current.delete(item.value);
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${item.value}`}
              aria-selected={selected}
              aria-controls={`${id}-panel-${item.value}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => activate(item.value)}
              className={cn(TAB, selected && TAB_ACTIVE)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.value}
          role="tabpanel"
          id={`${id}-panel-${item.value}`}
          aria-labelledby={`${id}-tab-${item.value}`}
          hidden={item.value !== active}
          // Panelin içinde odaklanabilir öğe yoksa Tab'ın ineceği bir durak olsun.
          tabIndex={0}
          className="pt-5 [&:focus-visible]:outline-offset-4"
        >
          {item.panel}
        </div>
      ))}
    </div>
  );
}

export type TabLink = { href: string; label: ReactNode };

type TabLinksProps = {
  items: readonly TabLink[];
  /** Etkin adres; genellikle sayfanın kendi yolu. */
  current: string;
  "aria-label": string;
  className?: string;
};

export function TabLinks({ items, current, className, ...props }: TabLinksProps) {
  return (
    <nav aria-label={props["aria-label"]} className={cn(LIST, className)}>
      {items.map((item) => {
        const selected = item.href === current;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={selected ? "page" : undefined}
            scroll={false}
            className={cn(TAB, selected && TAB_ACTIVE)}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
