// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Medya ışıklığı ("spotlight"): galerideki bir kareyi sayfanın üstünde büyük
 * gösterir; önceki/sonraki ile aynı yerden gezilir. Görsel, sessiz video ya
 * da token'la çizilmiş bir sahne (ReactNode) olabilir.
 *
 * NE ZAMAN: portfolyo akışı, vaka galerisi, ürün ekran görüntüleri; kartta
 * küçük duran işin ayrıntısı. NE ZAMAN DEĞİL: kart yerinden büyüyüp metin
 * de taşıyorsa → `expandable-card`; form ya da onay → `dialog`; tek görseli
 * yakınlaştırmak için ayrı sayfa daha iyi (paylaşılabilir adres).
 *
 * NASIL: yerel `<dialog>` + `showModal()`: odak tuzağı, Escape ve üst katman
 * tarayıcıdan (gerekçe `dialog.tsx`). Zemin 0 → 1 solar, kart 0,97 ölçek ve
 * 8 px aşağıdan yerine yükselir (320 ms, `--ease-brand`); kare değişince
 * yalnız medya kısa bir solmayla gelir. ← / → tuşları gezinir (odak videonun
 * kendi kontrollerindeyse tuşlar videoya kalır), `loop` ile uçlar birleşir.
 * Odak kapanınca açan öğeye döner; sayaçlı kaydırma kilidi.
 *
 * ERİŞİLEBİLİRLİK: diyaloğun adı karenin başlığı; "3 / 12" konumu gizli
 * olmayan canlı bölgede (polite). Önceki/Sonraki ve Kapat adlı ikon
 * butonlar, 44 px. Video `controls` taşır, sessiz başlar; hareket azaltmada
 * kendiliğinden oynamaz ve açılış animasyonu yoktur. Görselin `alt`ı verilmeli
 * (başlık görseli anlatmıyorsa).
 *
 * Kaynak: Sakin Akış turu (kişisel portfolyo dili, Kasım 2026); yalnız davranış, kod alınmadı.
 *
 *   const box = useLightbox(items.length);
 *   <button onClick={() => box.show(2)}>…</button>
 *   <MediaLightbox items={items} {...box.props} />
 */

export type LightboxItem = {
  id: string;
  title: string;
  description?: ReactNode;
  /** Görsel ya da video adresi. `node` verilirse yok sayılır. */
  src?: string;
  kind?: "image" | "video";
  alt?: string;
  poster?: string;
  /** Token'la çizilmiş sahne, canlı bileşen. */
  node?: ReactNode;
};

type MediaLightboxProps = {
  items: readonly LightboxItem[];
  index: number;
  onIndexChange: (index: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Uçlarda başa/sona sarsın mı. */
  loop?: boolean;
  closeLabel?: string;
  prevLabel?: string;
  nextLabel?: string;
  className?: string;
};

const CSS = `
@keyframes ui-ml-dim { from { opacity: 0; } }
@keyframes ui-ml-rise { from { opacity: 0; transform: scale(.97) translateY(8px); } }
@keyframes ui-ml-fade { from { opacity: 0; } }
.ui-ml[open]::backdrop { animation: ui-ml-dim 320ms var(--ease-brand) both; }
.ui-ml[open] .ui-ml-card { animation: ui-ml-rise 320ms var(--ease-brand) both; }
.ui-ml-media { animation: ui-ml-fade 220ms ease both; }
@media (prefers-reduced-motion: reduce) {
  .ui-ml[open]::backdrop, .ui-ml[open] .ui-ml-card, .ui-ml-media { animation: none; }
}`;

let lockCount = 0;
function lockScroll() {
  lockCount += 1;
  if (lockCount === 1) {
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    if (gap > 0) document.documentElement.style.paddingRight = `${gap}px`;
  }
}
function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.documentElement.style.removeProperty("overflow");
    document.documentElement.style.removeProperty("padding-right");
  }
}

/** Kolay kullanım: açık/kapalı ve sıra durumu tek yerde. */
export function useLightbox(count: number) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const show = useCallback(
    (i: number) => {
      setIndex(Math.min(Math.max(0, i), Math.max(0, count - 1)));
      setOpen(true);
    },
    [count],
  );
  return { open, index, show, props: { open, onOpenChange: setOpen, index, onIndexChange: setIndex } };
}

const BTN =
  "inline-grid size-11 shrink-0 place-items-center rounded-full text-muted transition-colors duration-200 hover:bg-surface hover:text-strong disabled:pointer-events-none disabled:opacity-40";

export function MediaLightbox({
  items,
  index,
  onIndexChange,
  open,
  onOpenChange,
  loop = true,
  closeLabel = "Kapat",
  prevLabel = "Önceki",
  nextLabel = "Sonraki",
  className,
}: MediaLightboxProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const pressedBackdrop = useRef(false);
  const titleId = useId();
  const reduce = useReducedMotion();
  const count = items.length;
  const item = items[index];
  const canPrev = loop ? count > 1 : index > 0;
  const canNext = loop ? count > 1 : index < count - 1;

  const go = useCallback(
    (dir: 1 | -1) => {
      if (count < 2) return;
      const next = index + dir;
      if (loop) onIndexChange((next + count) % count);
      else if (next >= 0 && next < count) onIndexChange(next);
    },
    [count, index, loop, onIndexChange],
  );

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    lockScroll();
    return () => {
      dialog.close();
      unlockScroll();
      const back = opener.current;
      if (back?.isConnected) back.focus();
    };
  }, [open]);

  return (
    <>
      <style href="ui-media-lightbox" precedence="default">
        {CSS}
      </style>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onCancel={(e) => {
          e.preventDefault();
          onOpenChange(false);
        }}
        onClose={(e) => {
          if (open && !e.currentTarget.open) onOpenChange(false);
        }}
        onKeyDown={(e) => {
          // Escape'i biz de dinleriz: tarayıcının kendi kapatması yalnız güvenilir tuş olayında çalışır
          // (otomasyon ve bazı yardımcı teknolojiler sentetik olay gönderir).
          if (e.key === "Escape") {
            e.preventDefault();
            onOpenChange(false);
            return;
          }
          const t = e.target as HTMLElement;
          if (t.closest("video, input, textarea, [role='slider']")) return;
          if (e.key === "ArrowRight") {
            e.preventDefault();
            go(1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            go(-1);
          }
        }}
        onPointerDown={(e) => {
          pressedBackdrop.current = e.target === e.currentTarget;
        }}
        onClick={(e) => {
          const backdrop = pressedBackdrop.current && e.target === e.currentTarget;
          pressedBackdrop.current = false;
          if (backdrop) onOpenChange(false);
        }}
        className={cn(
          "ui-ml m-auto max-h-[calc(100dvh-2rem)] w-[min(calc(100%-2rem),64rem)] overflow-visible bg-transparent p-0 text-body backdrop:bg-scrim",
          className,
        )}
      >
        {item ? (
          <div className="ui-ml-card flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border border-line bg-overlay shadow-modal">
            <div className="relative grid min-h-0 flex-1 place-items-center bg-surface p-3 sm:p-5">
              <div key={item.id} className="ui-ml-media grid max-h-[70dvh] w-full place-items-center overflow-hidden rounded-xl">
                {item.node ? (
                  item.node
                ) : item.kind === "video" && item.src ? (
                  <video
                    src={item.src}
                    poster={item.poster}
                    className="max-h-[70dvh] w-full rounded-xl object-contain"
                    controls
                    muted
                    loop
                    playsInline
                    autoPlay={!reduce}
                    aria-label={item.alt ?? item.title}
                  />
                ) : item.src ? (
                  // <picture>: kit next/* taşımaz; projede next/image ile değiştirilebilir.
                  <picture className="contents">
                    <img src={item.src} alt={item.alt ?? ""} className="max-h-[70dvh] w-auto rounded-xl object-contain" />
                  </picture>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-line-soft px-3 py-2 sm:px-4">
              <div className="min-w-0 flex-1 px-1 py-1.5">
                <h2 id={titleId} className="truncate text-base font-medium text-strong">
                  {item.title}
                </h2>
                {item.description ? <p className="mt-0.5 line-clamp-2 text-small text-muted">{item.description}</p> : null}
              </div>
              {count > 1 ? (
                <>
                  <p aria-live="polite" className="shrink-0 px-1 text-small text-muted tabular-nums">
                    {index + 1} / {count}
                  </p>
                  <button type="button" className={BTN} aria-label={prevLabel} disabled={!canPrev} onClick={() => go(-1)}>
                    <ChevronLeft aria-hidden className="size-5" />
                  </button>
                  <button type="button" className={BTN} aria-label={nextLabel} disabled={!canNext} onClick={() => go(1)}>
                    <ChevronRight aria-hidden className="size-5" />
                  </button>
                </>
              ) : null}
              <button type="button" className={BTN} aria-label={closeLabel} onClick={() => onOpenChange(false)}>
                <X aria-hidden className="size-5" />
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
