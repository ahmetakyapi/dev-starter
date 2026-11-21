// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Odak yığını: dikey bir listede aynı anda biri odakta. Ortadaki öğe büyük
 * ve net; uzaklaştıkça küçülür, solar, bulanıklaşır (Forge kahramanındaki
 * "Sales Agent" yığını). Birkaç benzer öğenin (ajan, şablon, paket, ekip
 * üyesi) bir arada durduğunu ve sırayla öne geldiğini gösterir. Tanıtım sayfası
 * içindir; gerçek seçim listesi için `select`, `tabs` ya da `radio-group`.
 *
 * DAVRANIŞ:
 *   - `interval` ms'de bir sıradaki öğe odağa gelir, sonunda başa döner
 *     (en az 4 öğe; daha azında dönüş akıcı görünmez).
 *   - Üzerine gelince, odak içerideyken ya da kullanıcı bir ok tuşuna / öğeye
 *     bastıktan sonra dönüş DURUR (WCAG 2.2.2); yeniden başlamaz.
 *   - ↑ ↓ önceki/sonraki, Home / End ilk/son. Görünen komşuya tıklamak onu
 *     odağa getirir.
 *   - Hareketi azaltan kullanıcıda kendiliğinden dönmez ve geçiş anlıktır;
 *     yığın yine ok ve tıklamayla gezilir.
 *
 * ERİŞİLEBİLİRLİK: `role="region"` + ad + `aria-roledescription`; öğeler
 * gerçek `ul`; odaktaki öğe `aria-current`. Görünmeyen (en çok iki uzakta
 * olmayan) öğeler `aria-hidden` VE `inert` (içlerindeki bağlantı/buton
 * odaklanmaz). `renderItem` içindeki alanlar (input) ok tuşlarını
 * kendine alır. Fare ile odak birbirinden bağımsız durdurur. Değişim ekran okuyucuya BİLDİRİLMEZ
 * (kendiliğinden dönen içerik okuyucuyu sürekli bölerdi).
 *
 *   <FocusStack label="Ajanlar" items={[{ id: "satis", icon: <Sparkles />, title: "Satış Ajanı", subtitle: "Aday araştırma ve ilk mesaj" }, …]} />
 */

export type FocusItem = { id: string; icon?: ReactNode; title: ReactNode; subtitle?: ReactNode };

type FocusStackProps = {
  items: readonly FocusItem[];
  /** Bölge adı ekran okuyucuya: "Ajanlar". */
  label: string;
  /** Kendi içeriğini çiz; verilmezse ikon + başlık + alt başlık. `active` odaktaki öğe mi. */
  renderItem?: (item: FocusItem, state: { active: boolean; distance: number }) => ReactNode;
  /** Otomatik dönüş aralığı, ms. 0 kapatır. */
  interval?: number;
  /** Tek öğenin yüksekliği, piksel (odaktaki öğe). */
  itemHeight?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  className?: string;
};

const CSS = `
.ui-focus-item { transition: transform 600ms var(--ease-brand), opacity 600ms var(--ease-brand), filter 600ms var(--ease-brand); }
@media (prefers-reduced-motion: reduce) { .ui-focus-item { transition: none; } }`;

/** Dairesel en kısa işaretli uzaklık: -n/2 … n/2. */
function distance(i: number, active: number, n: number) {
  let d = i - active;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
}

export function FocusStack({ items, label, renderItem, interval = 2800, itemHeight = 84, defaultIndex = 0, onIndexChange, className }: FocusStackProps) {
  const n = items.length;
  const reduce = useReducedMotion();
  // `prev`: bir önceki sıra. İşaret değiştiren (yığının öbür ucuna atlayan) öğe
  // geçişsiz oturur; yoksa görünmezken yığının ortasından süzülerek geçerdi.
  const [pos, setPos] = useState(() => {
    const start = ((defaultIndex % Math.max(n, 1)) + Math.max(n, 1)) % Math.max(n, 1);
    return { index: start, prev: start };
  });
  const [stopped, setStopped] = useState(false);
  // Fare ile odak AYRI: biri bitince öbürü dönüşü başlatmasın.
  const [hovered, setHovered] = useState(false);
  const [focusedWithin, setFocusedWithin] = useState(false);
  const radius = n >= 6 ? 2 : 1;
  const index = Math.min(pos.index, Math.max(n - 1, 0));

  // Geri çağrı ref'te: satır içi fonksiyon verilirse aralık her render'da sıfırlanmaz,
  // state güncelleyicinin içinde çağrılmaz (üst bileşen render sırasında güncellenmez).
  const notify = useRef(onIndexChange);
  useEffect(() => {
    notify.current = onIndexChange;
  });
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    notify.current?.(index);
  }, [index]);

  const go = (next: number, byUser = true) => {
    const clamped = ((next % n) + n) % n;
    setPos((p) => ({ index: clamped, prev: Math.min(p.index, n - 1) }));
    if (byUser) setStopped(true);
  };

  const paused = stopped || hovered || focusedWithin;
  useEffect(() => {
    if (!interval || paused || reduce || n < 4) return;
    const t = window.setInterval(() => {
      setPos((p) => ({ index: (Math.min(p.index, n - 1) + 1) % n, prev: Math.min(p.index, n - 1) }));
    }, interval);
    return () => window.clearInterval(t);
  }, [interval, paused, reduce, n]);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    // renderItem içindeki alan/menü ok tuşlarını kendi kullanır.
    if ((e.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return;
    const map: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: n - 1 };
    if (e.key in map) {
      e.preventDefault();
      go(map[e.key]);
    }
  };

  if (n === 0) return null;
  const step = itemHeight * 1.04;
  const height = step * (radius * 2 + 1);

  return (
    <section
      role="region"
      aria-label={label}
      aria-roledescription="odak yığını"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocusedWithin(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocusedWithin(false);
      }}
      className={cn("relative w-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-line-focus", className)}
      style={{ height }}
    >
      <style href="ui-focus-stack" precedence="default">
        {CSS}
      </style>
      <ul className="relative size-full">
        {items.map((item, i) => {
          const d = distance(i, index, n);
          const a = Math.abs(d);
          const visible = a <= radius;
          const y = Math.sign(d) * (a === 0 ? 0 : step * (1 + (a - 1) * 0.78));
          const scale = 1 - a * 0.1;
          const flipped = distance(i, pos.prev, n) * d < 0;
          return (
            <li
              key={item.id}
              aria-hidden={visible ? undefined : true}
              inert={visible ? undefined : true}
              aria-current={d === 0 ? "true" : undefined}
              onClick={() => visible && d !== 0 && go(i)}
              className={cn("ui-focus-item absolute inset-x-0 top-1/2 origin-center", visible && d !== 0 && "cursor-pointer", !visible && "pointer-events-none")}
              style={
                {
                  height: itemHeight,
                  marginTop: -itemHeight / 2,
                  transform: `translateY(${y}px) scale(${scale})`,
                  opacity: visible ? 1 - a * 0.45 : 0,
                  filter: a ? `blur(${a * 1.5}px)` : undefined,
                  zIndex: 10 - a,
                  transition: flipped ? "none" : undefined,
                } as CSSProperties
              }
            >
              {renderItem ? (
                renderItem(item, { active: d === 0, distance: d })
              ) : (
                <div className={cn("flex size-full items-center gap-4 rounded-xl bg-overlay px-5 ring-1 ring-line", d === 0 ? "shadow-modal" : "shadow-raised")}>
                  {item.icon ? (
                    <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-lg border border-line bg-surface text-strong [&_svg]:size-5">
                      {item.icon}
                    </span>
                  ) : null}
                  <div className="min-w-0">
                    <p className="truncate text-read font-semibold text-strong">{item.title}</p>
                    {item.subtitle ? <p className="truncate text-base text-soft">{item.subtitle}</p> : null}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
