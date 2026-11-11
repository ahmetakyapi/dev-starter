"use client";

import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Kavisli galeri: kartlar büyük bir çemberin üst yayına dizilir; ortadaki
 * dik ve tam parlak durur, kenara doğru eğilir, küçülür ve söner. Altında
 * ortadaki kartın adı, kısa künyesi ve bağlantısı. scrolltide.co'nun "Arc
 * Wave" ve "Flow Tunnel" bileşenlerinden öğrenildi (kod alınmadı; onlar
 * WebGL, bu CSS dönüşümü).
 *
 * NE ZAMAN: portfolyo, ekip, koleksiyon, şablon vitrini: 5-15 görsel,
 * her biri bir başlık taşıyor ve biri öne çıkıyor.
 * NE ZAMAN DEĞİL: karşılaştırılacak içerik (yan yana ızgara); ürün
 * listesi (`carousel`); tek görsel; metin ağırlıklı kart.
 *
 * NASIL: her kart aynı noktada durur, `transform-origin` çemberin MERKEZİ
 * (kartın çok altında). Kartın açısı `(sıra − etkin) × adım`; döndürünce kart
 * yay üstünde kayar. Küçülme İÇ katmanda (kendi ortasından): aynı öğede
 * ölçeklense uzak merkezden ölçeklenir ve kart yaydan aşağı düşer. Yarıçap ve adım telefonda küçük (560 px, 14°),
 * masaüstünde büyük (1000 px, 11.5°). Yalnız `transform` + `opacity`.
 *
 * ETKİLEŞİM: ok düğmeleri, galeri odaktayken ←/→ ve Home/End, yan karta
 * tıklamak onu ortaya getirir, yatay sürükleme (dokunmatikte de; dikey
 * kaydırma serbest, `touch-action: pan-y`). Tekerlek DİNLENMEZ: sayfa
 * kaydırmasını ele geçirmez. Kendiliğinden dönmez.
 *
 * ERİŞİLEBİLİRLİK: `region` + `aria-roledescription="carousel"`; değişim
 * `aria-live="polite"` ile "3 / 9: Kıyı Yolu" diye okunur. Yan kartlar
 * "…, öne getir" adlı düğmeler; görünür pencerenin dışındakiler
 * `aria-hidden` + `tabIndex=-1`. Hareketi azaltan kullanıcıda geçiş anında.
 *
 *   <ArcCarousel
 *     label="Seçilmiş İşler"
 *     items={works.map((w) => ({ id: w.slug, title: w.name, meta: w.year, href: `/is/${w.slug}`,
 *       media: <img src={w.cover} alt="" className="size-full object-cover" /> }))}
 *   />
 */

export type ArcItem = {
  id: string;
  title: string;
  /** Başlığın altında tek satır: yıl, rol, kategori. */
  meta?: string;
  /** Kart yüzü: `img` (alt boş, ad `title`dan) ya da token'lı çizim. */
  media: ReactNode;
  href?: string;
};

type ArcCarouselProps = {
  items: readonly ArcItem[];
  label: string;
  /** Başlangıçta ortadaki kart; varsayılan ortadaki sıra. */
  initialIndex?: number;
  /** Ortanın iki yanında kaç kart görünür. */
  visible?: number;
  /** Bağlantı düğmesinin metni. */
  linkLabel?: string;
  className?: string;
};

const CSS = `
.ui-arc { --arc-r: 560px; --arc-step: 14deg; --arc-w: 116px; --arc-h: 148px; }
@media (min-width: 768px) { .ui-arc { --arc-r: 1000px; --arc-step: 11.5deg; --arc-w: 168px; --arc-h: 212px; } }
.ui-arc-stage { position: relative; height: calc(3.5rem + var(--arc-h) + var(--arc-r) * (1 - cos(var(--arc-step) * var(--arc-visible))) + var(--arc-w) * 0.5 * sin(var(--arc-step) * var(--arc-visible))); overflow-x: clip; touch-action: pan-y; }
.ui-arc-card { position: absolute; left: 50%; top: 2.5rem; width: var(--arc-w); height: var(--arc-h); margin-left: calc(var(--arc-w) / -2);
  transform-origin: 50% calc(100% + var(--arc-r));
  transform: rotate(calc(var(--arc-offset) * var(--arc-step)));
  opacity: calc(1 - var(--arc-dist) * 0.16);
  transition: transform 520ms var(--ease-brand), opacity 360ms var(--ease-brand); }
.ui-arc-face { display: block; width: 100%; height: 100%; transform: scale(calc(1 - var(--arc-dist) * 0.06));
  transition: transform 520ms var(--ease-brand), box-shadow 360ms var(--ease-brand); }
.ui-arc-card[data-out] { opacity: 0; pointer-events: none; }
.ui-arc[data-reduce] .ui-arc-card, .ui-arc[data-reduce] .ui-arc-face { transition: none; }`;

export function ArcCarousel({
  items,
  label,
  initialIndex,
  visible = 3,
  linkLabel = "İncele",
  className,
}: ArcCarouselProps) {
  const reduce = useReducedMotion();
  const id = useId();
  const [active, setActive] = useState(() =>
    Math.min(items.length - 1, Math.max(0, initialIndex ?? Math.floor((items.length - 1) / 2))),
  );
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const current = items[active];

  const go = (index: number) => setActive(Math.min(items.length - 1, Math.max(0, index)));

  const onKey = (event: KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: items.length - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    go(keys[event.key]);
  };

  if (!current) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      data-reduce={reduce ? "" : undefined}
      style={{ "--arc-visible": visible } as CSSProperties}
      className={cn("ui-arc grid gap-4", className)}
    >
      <style href="ui-arc-carousel" precedence="default">
        {CSS}
      </style>

      <div
        role="group"
        tabIndex={0}
        aria-label={`${label}: ←/→ ile gez`}
        onKeyDown={onKey}
        onPointerDown={(event) => {
          drag.current = { x: event.clientX, moved: false };
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (!start) return;
          const dx = event.clientX - start.x;
          if (Math.abs(dx) < 48) return;
          go(active + (dx < 0 ? 1 : -1));
          drag.current = { x: event.clientX, moved: true };
        }}
        onPointerUp={() => {
          // Sürükleme bitti; tıklama olayı `moved` bayrağına bakıp yutulur.
          window.setTimeout(() => (drag.current = null), 0);
        }}
        onPointerCancel={() => (drag.current = null)}
        className="ui-arc-stage rounded-2xl outline-offset-4"
      >
        {items.map((item, index) => {
          const offset = index - active;
          const dist = Math.abs(offset);
          const hidden = dist > visible;
          const isActive = offset === 0;
          return (
            <button
              key={item.id}
              type="button"
              aria-hidden={hidden || isActive || undefined}
              tabIndex={hidden || isActive ? -1 : undefined}
              aria-label={`${item.title}, öne getir`}
              data-out={hidden ? "" : undefined}
              onClick={(event) => {
                if (drag.current?.moved) {
                  event.preventDefault();
                  return;
                }
                go(index);
              }}
              style={
                {
                  "--arc-offset": offset,
                  "--arc-dist": Math.min(dist, visible + 1),
                  zIndex: 100 - dist,
                  visibility: dist > visible + 1 ? "hidden" : undefined,
                } as CSSProperties
              }
              className={cn("ui-arc-card rounded-xl", isActive ? "cursor-default" : "cursor-pointer")}
            >
              {/* Döndüren dış katman (merkez çemberin altında), küçülten iç katman (kendi ortası). */}
              <span
                className={cn(
                  "ui-arc-face overflow-hidden rounded-xl bg-surface ring-1 ring-line [&_img]:pointer-events-none [&_img]:select-none",
                  isActive ? "shadow-floating" : "shadow-raised",
                )}
              >
                {item.media}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mx-auto grid w-full max-w-md grid-cols-[auto_1fr_auto] items-center gap-3 px-2">
        <button
          type="button"
          aria-label="Önceki"
          onClick={() => go(active - 1)}
          disabled={active === 0}
          className="grid size-11 place-items-center rounded-full bg-overlay text-strong shadow-raised ring-1 ring-line transition-colors hover:bg-surface disabled:opacity-40"
        >
          <ChevronLeft aria-hidden className="size-4" strokeWidth={2.25} />
        </button>

        <div className="grid min-w-0 justify-items-center gap-1 text-center">
          <p id={`${id}-now`} aria-live="polite" className="max-w-full truncate text-title font-semibold text-strong">
            <span className="sr-only">
              {active + 1} / {items.length}:{" "}
            </span>
            {current.title}
          </p>
          {current.meta ? <p className="text-small text-muted">{current.meta}</p> : null}
          {current.href ? (
            <a
              href={current.href}
              className="mt-1 inline-flex h-9 items-center gap-1 rounded-full bg-cta px-4 text-small font-semibold text-on-brand shadow-cta"
            >
              {linkLabel}
              <span className="sr-only">: {current.title}</span>
              <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={2.25} />
            </a>
          ) : null}
        </div>

        <button
          type="button"
          aria-label="Sonraki"
          onClick={() => go(active + 1)}
          disabled={active === items.length - 1}
          className="grid size-11 place-items-center rounded-full bg-overlay text-strong shadow-raised ring-1 ring-line transition-colors hover:bg-surface disabled:opacity-40"
        >
          <ChevronRight aria-hidden className="size-4" strokeWidth={2.25} />
        </button>
      </div>
    </section>
  );
}
