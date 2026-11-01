"use client";

import { AnimatePresence, m } from "motion/react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { chartBg, initials } from "@/components/demos/styles";
import type { Testimonial } from "@/lib/content";
import { DUR, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/*
 * Görüşler: TEK büyük alıntı, altında kişiler sekme olarak. Üç eşit kart
 * yerine tek ses: alıntı sayfanın en büyük gövde puntosunda okunur, ferah
 * bir bölüm olarak yoğun fiyat bölümünden önce nefes aldırır.
 *
 * Kendiliğinden dönmez: okuyucu cümlenin ortasındayken değişen metin
 * okunmaz (WCAG 2.2.2). Klavye: ok tuşları, Home/End (WAI-ARIA sekme deseni,
 * otomatik etkinleştirme). Alıntı geçişi yalnızca opaklık + 8 px kayma.
 * JavaScript'siz ilk alıntı görünür.
 */
export function TestimonialPicker({ items, label }: { items: readonly Testimonial[]; label: string }) {
  const [active, setActive] = useState(0);
  const base = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = items[active];

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const last = items.length - 1;
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? active === last ? 0 : active + 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? active === 0 ? last : active - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }

  if (!current) return null;

  return (
    <div>
      <div
        id={`${base}-panel`}
        role="tabpanel"
        aria-labelledby={`${base}-tab-${active}`}
        className="grid min-h-[11rem] sm:min-h-[8.5rem]"
      >
        <AnimatePresence mode="wait" initial={false}>
          <m.blockquote
            key={active}
            className="quote-text max-w-4xl font-medium text-strong"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: DUR.base, ease: EASE }}
          >
            “{current.quote}”
          </m.blockquote>
        </AnimatePresence>
      </div>

      <div role="tablist" aria-label={label} onKeyDown={onKey} className="mt-8 grid gap-2 sm:grid-cols-3">
        {items.map((person, index) => {
          const selected = index === active;
          return (
            <button
              key={person.name}
              ref={(node) => {
                tabs.current[index] = node;
              }}
              id={`${base}-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${base}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              className={cn(
                "flex min-h-16 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-[background-color,box-shadow,opacity] duration-200",
                selected ? "bg-overlay shadow-raised" : "opacity-70 hover:bg-surface hover:opacity-100",
              )}
            >
              <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-full text-small font-semibold text-chart-ink", chartBg(index + 2))}>
                {initials(person.name)}
              </span>
              <span className="min-w-0">
                <span className="block text-base font-semibold text-strong">{person.name}</span>
                <span className="block truncate text-small text-muted">{person.role}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
