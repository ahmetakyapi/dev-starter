// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { X } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Duyuru destesi: köşede üst üste duran birkaç küçük kart; öndeki belli
 * aralıkla arkaya kayar, sıradaki öne gelir, sayaç "2 / 3" der (offscreen.wtf'in
 * sol alttaki sponsor destesi). Arkadaki kartların kenarları görünür: tek
 * bir toast değil, "birkaç duyuru var" bilgisini yer kaplamadan verir.
 * Duyuru, sürüm notu, etkinlik, sponsor yeri. Hata ve sonuç bildirimi için
 * DEĞİL (onlar `toast`); kullanıcının işini kesmez, kapatılınca kapanır.
 *
 * DAVRANIŞ:
 *   - Kendiliğinden dönme `interval` ms'de bir; üzerine gelince ya da odak
 *     içerideyken durur, hareketi azaltan kullanıcıda hiç dönmez (sayaca
 *     dokunarak geçilir). Sonsuz otomatik dönüş WCAG 2.2.2: durdurulabilir.
 *   - Kart değişimi kısa yukarı kayma + solma; arkadaki kartlar 6 px aşağıda
 *     ve %3 küçük, en çok iki tanesi görünür.
 *   - Kapat: bütün desteyi kapatır (`onDismiss` ile kalıcı kıl, ör. çerez).
 *
 * ERİŞİLEBİLİRLİK: `role="region"` + ad; öndeki kart okunur, arkadakiler
 * `aria-hidden`. Değişim canlı bölgeye BİLDİRİLMEZ (kendiliğinden dönen içerik
 * ekran okuyucuyu sürekli bölerdi); sayaç düğmesi elle geçişi sağlar.
 *
 *   <NoticeDeck label="Duyurular" items={[{ id: "v3", eyebrow: "Yeni sürüm", title: "3.1 yayında", action: <a href="/surum">Notlar</a> }]} />
 */

export type Notice = { id: string; eyebrow?: string; title: ReactNode; body?: ReactNode; action?: ReactNode };

type NoticeDeckProps = {
  items: readonly Notice[];
  label?: string;
  /** Otomatik dönüş aralığı, ms. 0 kapatır. */
  interval?: number;
  onDismiss?: () => void;
  className?: string;
};

const CSS = `
@keyframes ui-deck-in { from { opacity: 0; transform: translateY(10px) scale(0.98); } }
.ui-deck-front { animation: ui-deck-in 420ms var(--ease-brand) both; }
@media (prefers-reduced-motion: reduce) { .ui-deck-front { animation: none; } }`;

export function NoticeDeck({ items, label = "Duyurular", interval = 6000, onDismiss, className }: NoticeDeckProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!interval || paused || reduce || items.length < 2) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % items.length), interval);
    return () => window.clearInterval(t);
  }, [interval, paused, reduce, items.length]);

  if (!open || items.length === 0) return null;
  const current = items[index % items.length];
  const behind = Math.min(items.length - 1, 2);

  return (
    <section
      role="region"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
      className={cn("relative w-80 max-w-[calc(100vw-2rem)]", className)}
    >
      <style href="ui-notice-deck" precedence="default">
        {CSS}
      </style>
      {/* Arkadaki kartların kenarları: içeriksiz, yalnız deste hissi. */}
      {Array.from({ length: behind }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute inset-x-0 top-0 h-full rounded-2xl bg-overlay ring-1 ring-line"
          style={{ transform: `translateY(${(i + 1) * 6}px) scale(${1 - (i + 1) * 0.03})`, zIndex: -1 - i, opacity: 0.9 - i * 0.25 }}
        />
      ))}
      <div key={current.id} className="ui-deck-front relative rounded-2xl bg-overlay p-4 pr-11 shadow-floating ring-1 ring-line">
        {current.eyebrow ? (
          <p className="flex items-center gap-1.5 text-micro font-semibold tracking-[0.12em] text-muted uppercase">
            <span aria-hidden className="size-1.5 rounded-full bg-success" />
            {current.eyebrow}
          </p>
        ) : null}
        <p className="mt-1 text-read font-semibold text-strong">{current.title}</p>
        {current.body ? <p className="mt-1 text-small text-soft">{current.body}</p> : null}
        {current.action ? <div className="mt-3 text-small font-medium">{current.action}</div> : null}
        <div className="absolute top-2 right-2 flex flex-col items-center gap-0.5">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDismiss?.();
            }}
            aria-label={`${label}: kapat`}
            className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface hover:text-strong [&_svg]:size-4"
          >
            <X aria-hidden />
          </button>
          {items.length > 1 ? (
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % items.length)}
              aria-label={`${(index % items.length) + 1}/${items.length} · Sıradaki duyuru`}
              className="min-h-8 rounded-full px-1.5 text-micro font-semibold text-muted tabular-nums hover:text-strong"
            >
              {(index % items.length) + 1}/{items.length}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
