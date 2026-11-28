"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Yelpaze kartlar: 3-5 renkli kart üst üste, her biri biraz farklı açıyla
 * dizili; üzerine gelince ya da odakta yelpaze açılır (açılar büyür, kartlar
 * ayrılır), bir kartın üstüne gelince o kart öne çıkar. Kartın üstünde
 * başlık, altında küçük künye ("4 Aktif"), sağ altta hap. Bölüm başlığının
 * yanında süs ya da özet: "Koleksiyonlar", "Panolar", "Ekipler". Manzara
 * turu (28 Kasım 2026), yalnız davranış ve yapı.
 *
 * NE ZAMAN DEĞİL: kartların içeriği okunacaksa (açıklama, liste) ya da
 * altıdan fazla öğe varsa; üst üste binen kart bilgiyi saklar. Oralarda
 * düz ızgara ya da `option-cards`.
 *
 * NASIL: kartlar alt ortadan döner (`transform-origin`), açı ve kayma CSS
 * değişkeniyle (`--o`: kartın merkeze uzaklığı). Açılma yalnız `rotate`
 * ve `translate`; üzerine gelme yalnız ince işaretçide (`hover: hover` ve
 * `pointer: fine`), dokunmatikte klavye odağı ve `interactive` seçim yeter.
 * Kart genişliği telefonda 7rem, `sm` üstünde 9rem; beş kart `md`
 * yayılımda 390 pikselde taşmaz.
 *
 * `interactive`: kartlar buton olur, `onSelect(index)` çağrılır. Grup
 * `role="group"` + `label`; tek sekme durağı (roving tabindex), ← / →
 * komşu karta, Home / End uçlara geçer. Seçili kart `aria-pressed`;
 * `selected` verilmezse seçim bileşenin içinde tutulur (`defaultSelected`).
 *
 * İSTEMCİ BİLEŞENİ (klavye gezintisi durum ister); props'u düz veri
 * (`cards`, ReactNode `badge`) olduğu için sunucu bileşeninden de çağrılır,
 * `onSelect` isteğe bağlıdır (fonksiyon sunucudan geçemez, verilmezse
 * seçim yine çalışır). Yelpaze açılması ve öne çıkma yalnız CSS.
 * Değilse süs: `label` verilirse `role="img"` + `aria-label`, yoksa
 * `aria-hidden`.
 *
 * TONLAR token'dan: `primary`, `neutral`, `chart-1…6`, `success`,
 * `warning`, `danger`. Açık grafik tonlarında metin koyu mürekkep.
 * Hareketi azaltan kullanıcıda yelpaze açık ve durağan, geçiş yok.
 *
 *   <CardFan label="Dört koleksiyon" cards={[{ title: "Okuma", meta: "12 Kayıt", badge: "Yeni", tone: "chart-2" }, …]} />
 */

const TONES = {
  primary: { color: "var(--primary)", pale: false },
  neutral: { color: "var(--text-muted)", pale: false },
  "chart-1": { color: "var(--chart-1)", pale: true },
  "chart-2": { color: "var(--chart-2)", pale: false },
  "chart-3": { color: "var(--chart-3)", pale: false },
  "chart-4": { color: "var(--chart-4)", pale: false },
  "chart-5": { color: "var(--chart-5)", pale: true },
  "chart-6": { color: "var(--chart-6)", pale: true },
  success: { color: "var(--success)", pale: false },
  warning: { color: "var(--warning)", pale: false },
  danger: { color: "var(--danger)", pale: false },
} as const;

export type CardFanTone = keyof typeof TONES;

export type CardFanItem = {
  /** Title Case başlık: "Okuma Listesi". */
  title: string;
  /** Alttaki küçük künye: "4 Aktif". */
  meta?: string;
  /** Sağ alttaki hap: "Yeni". */
  badge?: ReactNode;
  tone: CardFanTone;
};

/** Kapalı ve açık yelpazenin açısı (derece) ve kayması (kart genişliğinin oranı). */
const SPREAD = {
  // Dinlenmede de her kartın başlığı okunur (kartlar ~%25 kayık); açılınca ayrılırlar.
  sm: { rest: 6, open: 10, restX: 0.18, openX: 0.3 },
  md: { rest: 8, open: 14, restX: 0.26, openX: 0.42 },
} as const;

const OPEN = (inner: string) => `.ui-fan:focus-within ${inner}`;

const CSS = `
.ui-fan { --cw: 7rem; position: relative; display: block; flex: none; width: calc(var(--cw) * (1.25 + var(--fan-span) * var(--open-x)));
  height: calc(var(--cw) * 1.75); }
@media (min-width: 40rem) { .ui-fan { --cw: 9rem; } }
.ui-fan-card[data-ink="dark"] { color: color-mix(in oklab, var(--tone) 20%, black); }
.ui-fan-card { position: absolute; left: 50%; bottom: 6%; width: var(--cw); height: calc(var(--cw) * 1.3); margin-left: calc(var(--cw) / -2);
  transform-origin: 50% 100%; --lift: 0%; z-index: var(--z);
  background: var(--tone); background-image: linear-gradient(165deg, color-mix(in oklab, var(--tone) 78%, white), var(--tone) 60%);
  box-shadow: inset 0 1px 0 color-mix(in oklab, white 40%, transparent), var(--shadow-md);
  rotate: calc(var(--o) * var(--rest-r) * 1deg);
  translate: calc(var(--o) * var(--rest-x) * 100%) calc(var(--ao) * 2% + var(--lift));
  transition: rotate 0.45s var(--ease-brand), translate 0.45s var(--ease-brand); }
${OPEN(".ui-fan-card")} { rotate: calc(var(--o) * var(--open-r) * 1deg); translate: calc(var(--o) * var(--open-x) * 100%) calc(var(--ao) * 5% + var(--lift)); }
.ui-fan-card:focus-visible, .ui-fan-card[aria-pressed="true"] { --lift: -9%; z-index: 20; }
@media (hover: hover) and (pointer: fine) {
  .ui-fan:hover .ui-fan-card { rotate: calc(var(--o) * var(--open-r) * 1deg); translate: calc(var(--o) * var(--open-x) * 100%) calc(var(--ao) * 5% + var(--lift)); }
  .ui-fan .ui-fan-card:hover { --lift: -9%; z-index: 20; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-fan .ui-fan-card { rotate: calc(var(--o) * var(--open-r) * 1deg); translate: calc(var(--o) * var(--open-x) * 100%) calc(var(--ao) * 5% + var(--lift)); transition: none; }
}`;

export type CardFanProps = {
  /** 3-5 kart; fazlası kesilir. */
  cards: readonly CardFanItem[];
  spread?: "sm" | "md";
  /** Erişilebilir ad. Süste verilirse `role="img"`, `interactive`te grup adı. */
  label?: string;
  /** Kartlar buton olur; `onSelect` ile seçim. */
  interactive?: boolean;
  onSelect?: (index: number) => void;
  /** Seçili kartın sırası (denetimli; `aria-pressed`). Verilmezse bileşen seçimi kendisi tutar. */
  selected?: number;
  /** Denetimsiz başlangıç seçimi (sunucu bileşeninden callback'siz kullanım). */
  defaultSelected?: number;
  className?: string;
};

export function CardFan({ cards, spread = "md", label, interactive, onSelect, selected, defaultSelected, className }: CardFanProps) {
  const list = cards.slice(0, 5);
  const s = SPREAD[spread];
  const mid = (list.length - 1) / 2;
  const [picked, setPicked] = useState(defaultSelected);
  const current = selected ?? picked;
  const [active, setActive] = useState(current ?? Math.round(mid));
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (to: number) => {
    const next = (to + list.length) % list.length;
    setActive(next);
    refs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const keys: Record<string, number> = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: list.length - 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    move(keys[e.key]);
  };

  const rootStyle = {
    "--fan-span": list.length - 1,
    "--rest-r": s.rest,
    "--open-r": s.open,
    "--rest-x": s.restX,
    "--open-x": s.openX,
  } as CSSProperties;

  const a11y = interactive
    ? { role: "group", "aria-label": label }
    : label
      ? { role: "img", "aria-label": label }
      : { "aria-hidden": true };

  return (
    <div className={cn("ui-fan", className)} style={rootStyle} {...a11y}>
      <style href="ui-card-fan" precedence="default">
        {CSS}
      </style>
      {list.map((card, i) => {
        const t = TONES[card.tone];
        const o = i - mid;
        const cardStyle = { "--o": o, "--ao": Math.abs(o), "--tone": t.color, "--z": 1 + i } as CSSProperties; // basamaklı deste: sağdaki üstte, soldakilerin başlığı sol üstte görünür
        const face = cn(
          "ui-fan-card flex flex-col justify-between rounded-lg p-3 text-left sm:p-3.5",
          t.pale ? null : "text-on-brand",
        );
        const ink = t.pale ? "dark" : "light";
        const content = (
          <>
            <span className="line-clamp-2 text-small leading-snug font-semibold sm:text-base">{card.title}</span>
            <span className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-1.5">
              <span className="truncate text-micro opacity-85">{card.meta}</span>
              {card.badge ? (
                <span
                  className={cn(
                    "inline-flex min-h-5 items-center rounded-full px-2 text-micro font-medium ring-1",
                    t.pale ? "bg-[color-mix(in_oklab,white_45%,transparent)] ring-[color-mix(in_oklab,black_12%,transparent)]" : "bg-on-brand/20 ring-on-brand/35",
                  )}
                >
                  {card.badge}
                </span>
              ) : null}
            </span>
          </>
        );
        return interactive ? (
          <button
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            tabIndex={i === active ? 0 : -1}
            aria-pressed={current === i}
            onFocus={() => setActive(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            onClick={() => {
              setPicked(i);
              onSelect?.(i);
            }}
            data-ink={ink}
            className={cn(face, "cursor-pointer outline-offset-2")}
            style={cardStyle}
          >
            {content}
          </button>
        ) : (
          <span key={i} data-ink={ink} className={face} style={cardStyle}>
            {content}
          </span>
        );
      })}
    </div>
  );
}
