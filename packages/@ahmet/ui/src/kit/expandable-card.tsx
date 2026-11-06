// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { AnimatePresence, LazyMotion, domMax, m, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { DUR, EASE, SPRING } from "../variants";
import { cn } from "../utils";

/**
 * Genişleyen kart: tıklanan kart yerinden büyüyerek pencereye dönüşür;
 * görseli ve başlığı aynı öğe olarak yeni yerine akar, ayrıntı sonra
 * belirir. Kapatınca kart yerine geri döner. Ürün, proje, ekip üyesi,
 * tarif: önce kısa kart, istenirse bütün hikâye. Göz bağlamı kaybetmez:
 * pencere başka bir yerden açılmadı, kartın kendisi büyüdü.
 *
 * PAYLAŞILAN ÖĞE (`layoutId`): kabuk, görsel ve başlık aynı kimlikle iki
 * yerde çizilir, motion aradaki yolu canlandırır. Düzen animasyonu
 * `domMax` ister; bileşen kendi ağacında açar (segmented-control ile aynı
 * yol, dosya başı notuna bak).
 *
 * PENCERE KURALLARI: `role="dialog"` + `aria-modal`, adı başlıktan; açılınca
 * odak Kapat düğmesine, Tab pencere içinde döner, Escape ve zemin tıklaması
 * kapatır, odak karta geri döner; sayfa kaydırması kilitli. Telefonda
 * pencere ekranın altına yaslı tam genişlik.
 *
 * Hareketi azaltan kullanıcıda büyüme yok: pencere yerinde solarak gelir.
 *
 *   <ExpandableCard title="Kıyı Harmanı" summary="Orta kavrum, 1 kg" media={<img … />}>Uzun açıklama…</ExpandableCard>
 */

type ExpandableCardProps = {
  title: string;
  summary?: string;
  /** Kartın üstündeki görsel; pencerede büyür. Dekoratifse `alt=""`. */
  media?: ReactNode;
  /** Penceredeki ayrıntı. */
  children: ReactNode;
  closeLabel?: string;
  className?: string;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function ExpandableCard({ title, summary, media, children, closeLabel = "Kapat", className }: ExpandableCardProps) {
  const id = useId();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  // Portal yalnız açıkken ve kapanış animasyonu bitene dek: sunucu çiziminde yok, hidrasyon farkı yok.
  const [present, setPresent] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const titleId = `${id}-title`;

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    const t = window.setTimeout(() => panel.current?.querySelector<HTMLElement>("[data-close]")?.focus(), 30);
    return () => {
      root.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== "Tab" || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const layout = (part: string) => (reduce ? undefined : `${id}-${part}`);
  const shell = reduce ? { duration: DUR.fast } : SPRING.soft;

  return (
    <LazyMotion features={domMax}>
      <m.button
        ref={trigger}
        type="button"
        layoutId={layout("shell")}
        transition={shell}
        onClick={() => {
          setPresent(true);
          setOpen(true);
        }}
        aria-haspopup="dialog"
        className={cn(
          "group grid w-full overflow-hidden rounded-xl bg-overlay text-left shadow-raised transition-[translate] duration-200 hover:-translate-y-0.5",
          className,
        )}
      >
        {media ? (
          <m.span layoutId={layout("media")} transition={shell} className="block aspect-[4/3] overflow-hidden bg-surface-sunken [&_img]:size-full [&_img]:object-cover">
            {media}
          </m.span>
        ) : null}
        <span className="grid gap-1 p-4">
          <m.span layoutId={layout("title")} transition={shell} className="text-base font-semibold text-strong">
            {title}
          </m.span>
          {summary ? <span className="text-small text-muted">{summary}</span> : null}
        </span>
      </m.button>

      {present
        ? createPortal(
            <AnimatePresence onExitComplete={() => setPresent(false)}>
              {open ? (
                <div className="fixed inset-0 z-50 grid items-end sm:place-items-center sm:p-6" onKeyDown={onKeyDown}>
                  <m.div
                    aria-hidden
                    className="absolute inset-0 bg-scrim"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: DUR.base, ease: EASE }}
                    onClick={close}
                  />
                  <m.div
                    ref={panel}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    layoutId={layout("shell")}
                    transition={shell}
                    initial={reduce ? { opacity: 0 } : undefined}
                    animate={reduce ? { opacity: 1 } : undefined}
                    exit={reduce ? { opacity: 0 } : undefined}
                    className="relative grid max-h-[88dvh] w-full overflow-hidden rounded-t-2xl bg-overlay shadow-modal sm:max-w-xl sm:rounded-2xl"
                  >
                    <div className="overflow-y-auto overscroll-contain">
                      {media ? (
                        <m.div layoutId={layout("media")} transition={shell} className="aspect-[16/9] overflow-hidden bg-surface-sunken [&_img]:size-full [&_img]:object-cover">
                          {media}
                        </m.div>
                      ) : null}
                      <div className="grid gap-3 p-6">
                        <m.h2 id={titleId} layoutId={layout("title")} transition={shell} className="pr-10 text-title font-semibold text-strong">
                          {title}
                        </m.h2>
                        <m.div
                          className="text-read text-body"
                          initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                          animate={{ opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE, delay: reduce ? 0 : 0.12 } }}
                          exit={{ opacity: 0, transition: { duration: DUR.fast } }}
                        >
                          {children}
                        </m.div>
                      </div>
                    </div>
                    <button
                      type="button"
                      data-close
                      onClick={close}
                      aria-label={closeLabel}
                      className="absolute top-3 right-3 grid size-11 place-items-center rounded-full bg-overlay/80 text-strong backdrop-blur-md hover:bg-surface"
                    >
                      <X aria-hidden className="size-4" />
                    </button>
                  </m.div>
                </div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </LazyMotion>
  );
}
