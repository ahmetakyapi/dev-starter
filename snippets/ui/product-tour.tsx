"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Ürün turu: yeni kullanıcıya ekranın önemli parçalarını sırayla gösterir.
 * Sayfa karartılır, hedef öğe bir "pencere" ile açıkta kalır; yanında kısa
 * başlık + bir cümle, "2 / 4" ve Geri / İleri. Dört-beş adımı geçme: uzun
 * tur okunmaz, atlanır. Tur bir kez gösterilir; tekrar açma yolu (bir
 * "Turu Başlat" düğmesi) ekranda kalır.
 *
 * HEDEF `data-tour` ya da seçici: `target: "ozet"` → `[data-tour="ozet"]`;
 * `target: "a[href*=inbox]"` gibi seçici de olur. Bulunamayan adım
 * atlanır (ekran değişmiş olabilir).
 *
 * PENCERE tek bir sabit kutu: `box-shadow` ile çevresi karartılır, hedef
 * karartmanın DIŞINDA kalır. Konum ve boy adımlar arasında 300 ms ile kayar;
 * bu tek öğe ve kısa bir geçiş, düzen hesabı yalnız onda. Hedef önce
 * görünür alana kaydırılır, ölçü kaydırma bitince (`scrollend`, yedek
 * zamanlayıcı) ve boyut değişince yeniden alınır.
 *
 * KART bir diyalog (`role="dialog"`, ad başlık): açılınca odak karta
 * gelir, Tab kartın içinde döner, ← → adım değiştirir, Escape turu kapatır
 * ve odak turu açan öğeye döner. Telefonda kart ekranın altına yaslanır.
 * Karartma tıklamayı yutar: tur sırasında sayfa kazara değişmez.
 *
 *   const [open, setOpen] = useState(false);
 *   <ProductTour open={open} onOpenChange={setOpen} steps={[{ target: "ozet", title: "Özet", body: "…" }]} />
 */

export type TourStep = { target: string; title: string; body: string };

type ProductTourProps = {
  steps: readonly TourStep[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Son adımda "Bitir"e basılınca (Escape ya da Geç ile kapatmada değil). */
  onFinish?: () => void;
  /** Turun adı (ekran okuyucu): "Pano Turu". */
  label?: string;
};

type Box = { top: number; left: number; width: number; height: number };

const PAD = 8;
const find = (target: string) =>
  document.querySelector<HTMLElement>(/^[a-z0-9-]+$/i.test(target) ? `[data-tour="${target}"]` : target);

export function ProductTour({ steps, open, onOpenChange, onFinish, label = "Ürün Turu" }: ProductTourProps) {
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [vw, setVw] = useState(0);
  const card = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const step = steps[index];

  const measure = useCallback(() => {
    if (!step) return;
    const el = find(step.target);
    setVw(window.innerWidth);
    if (!el) {
      setBox(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setBox({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
  }, [step]);

  // Açılış: açanı hatırla, ilk adıma dön. Kapanış: odağı geri ver.
  useEffect(() => {
    if (open) {
      opener.current = document.activeElement as HTMLElement | null;
      setIndex(0);
    } else {
      opener.current?.focus?.();
      setBox(null);
    }
  }, [open]);

  // Adım değişince hedefi görünür alana getir, kaydırma bitince ölç.
  useLayoutEffect(() => {
    if (!open || !step) return;
    const el = find(step.target);
    if (!el) {
      // Hedef yok: bu adımı atla (son adımsa turu kapat).
      if (index < steps.length - 1) setIndex((i) => i + 1);
      else onOpenChange(false);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    measure();
    const done = () => measure();
    window.addEventListener("scrollend", done, { capture: true, passive: true });
    const fallback = window.setTimeout(done, 450);
    const ro = new ResizeObserver(done);
    ro.observe(el);
    window.addEventListener("resize", done);
    return () => {
      window.removeEventListener("scrollend", done, { capture: true });
      window.removeEventListener("resize", done);
      window.clearTimeout(fallback);
      ro.disconnect();
    };
  }, [open, step, index, steps.length, measure, onOpenChange]);

  useEffect(() => {
    if (open) card.current?.focus();
  }, [open, index]);

  function next() {
    if (index < steps.length - 1) setIndex(index + 1);
    else {
      onFinish?.();
      onOpenChange(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onOpenChange(false);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      setIndex(index - 1);
    } else if (event.key === "Tab") {
      const items = [...(card.current?.querySelectorAll<HTMLElement>("button:not(:disabled)") ?? [])];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === card.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  if (!open || !step || typeof document === "undefined") return null;

  // Kart: yer varsa hedefin altına, yoksa üstüne; telefonda alta yaslı.
  const narrow = vw > 0 && vw < 640;
  const below = box ? window.innerHeight - (box.top + box.height) > 220 : true;
  const cardStyle: CSSProperties | undefined =
    narrow || !box
      ? undefined
      : {
          top: below ? box.top + box.height + 12 : undefined,
          bottom: below ? undefined : window.innerHeight - box.top + 12,
          left: Math.min(Math.max(16, box.left), vw - 16 - 352),
        };
  const titleId = `tour-title-${index}`;

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      {/* Karartma: tıklamayı yutar. Pencere varsa karartmayı o çizer. */}
      <div aria-hidden className={cn("absolute inset-0", box ? "bg-transparent" : "bg-scrim")} />
      {box ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-xl outline-2 outline-offset-0 outline-primary transition-[top,left,width,height] duration-300 ease-(--ease-brand) motion-reduce:transition-none"
          style={{ ...box, boxShadow: "0 0 0 200vmax var(--scrim)" }}
        />
      ) : null}
      <div
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={`${titleId}-body`}
        aria-roledescription={label}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        style={cardStyle}
        className={cn(
          "fixed w-[min(22rem,calc(100vw-2rem))] rounded-2xl bg-overlay p-5 text-body shadow-modal outline-none",
          narrow || !box ? "inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] mx-auto w-auto max-w-md" : "",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="font-mono text-small text-muted tabular-nums">
            {index + 1} / {steps.length}
          </span>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Turu Kapat"
            className="-mt-1.5 -mr-1.5 grid size-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface-raised hover:text-strong"
          >
            <X aria-hidden className="size-4" strokeWidth={2} />
          </button>
        </div>
        <h2 id={titleId} className="mt-1 text-title font-semibold text-strong">
          {step.title}
        </h2>
        <p id={`${titleId}-body`} className="mt-1.5 text-base">
          {step.body}
        </p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div aria-hidden className="flex gap-1">
            {steps.map((s, i) => (
              <span key={s.title} className={cn("h-1.5 rounded-full transition-[width,background-color] duration-300", i === index ? "w-4 bg-primary" : "w-1.5 bg-line-strong")} />
            ))}
          </div>
          <div className="flex gap-2">
            {index > 0 ? (
              <button
                type="button"
                onClick={() => setIndex(index - 1)}
                className="min-h-10 rounded-md px-3 text-base font-medium text-body transition-colors hover:bg-surface-raised hover:text-strong"
              >
                Geri
              </button>
            ) : null}
            <button
              type="button"
              onClick={next}
              className="min-h-10 rounded-md bg-primary px-4 text-base font-semibold text-on-primary shadow-cta transition-[background-color,scale] duration-150 hover:bg-primary-hover active:scale-[0.98]"
            >
              {index === steps.length - 1 ? "Bitir" : "İleri"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
