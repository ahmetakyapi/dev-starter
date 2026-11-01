"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Çekmece: telefonda alttan, masaüstünde istenirse yandan açılan katman
 * (filtreler, ayrıntı, kısa form). `dialog.tsx` ile aynı temel: yerel
 * `<dialog>` + `showModal()` (odak tuzağı, Escape, üst katman tarayıcıdan),
 * odak dönüşü ve sayaçlı kaydırma kilidi bizden. İki dosya bağımsız
 * kopyalanabilsin diye kilit burada da var; ikisi birlikte kullanılıyorsa
 * kilidi tek bir modüle (`use-scroll-lock.ts`) taşı.
 *
 * `side="bottom"` (varsayılan): tutamaçtan aşağı sürükleyince kapanır
 * (`DRAG_CLOSE` pikselden fazla). Sürükleme tek yol değil: Kapat düğmesi
 * ve Escape her zaman var; hareket kısıtı olan kullanıcı sürüklemek zorunda
 * kalmaz.
 *
 * Güvenli alan: alt kenardaki dolgu `env(safe-area-inset-bottom)` taşır;
 * yoksa ana ekran çubuğu son düğmenin üstüne biner.
 *
 * GÖRÜNÜŞ ("board" dili, 2026-11): beyaz karo, açık kenarlarda `rounded-2xl`,
 * kıl çizgisi ve `shadow-modal`. Kayma imza eğrisiyle (yaysız: büyük bir
 * yüzeyin aşıp geri gelmesi ekranı sallar); tutamak basılınca koyulaşır
 * ve hafifçe genişler, sürüklenebilir olduğunu söyler. Eylem satırı
 * diyalogdaki gibi hafif gri bir kuyu.
 *
 * İlk odak ve yerel kapanış `dialog.tsx` ile aynı: başka bir öğe için
 * `data-autofocus` (`autoFocus` istemcide işlemez), `<form method="dialog">`
 * gibi React'i atlayan kapanış da duruma yansır.
 */

/** Bu kadar aşağı sürüklenirse kapanır. */
const DRAG_CLOSE = 80;

let lockCount = 0;

function lockScroll() {
  lockCount += 1;
  if (lockCount === 1) {
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    // Kaydırma çubuğu kaybolunca sayfa yana kaymasın (yan panel masaüstünde açılır).
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

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** `right`: masaüstünde yan panel; telefonda da sağdan açılır. */
  side?: "bottom" | "right";
  closeLabel?: string;
  className?: string;
};

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = "bottom",
  closeLabel = "Kapat",
  className,
}: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const dragStart = useRef<number | null>(null);
  const pressedBackdrop = useRef(false);
  const [drag, setDrag] = useState(0);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    // Kapalı iç içe bir diyaloğun içeriği de DOM'da durur; ilk eşleşme onun
    // görünmez düğmesi olursa odak hiçbir yere gitmez. Yalnız bu diyaloğun kendi hedefi.
    [...dialog.querySelectorAll<HTMLElement>("[data-autofocus]")]
      .find((el) => el.closest("dialog") === dialog)
      ?.focus();
    lockScroll();
    return () => {
      dialog.close();
      unlockScroll();
      const back = opener.current;
      if (back?.isConnected) back.focus();
    };
  }, [open]);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    dragStart.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragStart.current === null) return;
    setDrag(Math.max(0, event.clientY - dragStart.current));
  }

  function onPointerUp() {
    if (dragStart.current === null) return;
    dragStart.current = null;
    if (drag > DRAG_CLOSE) onOpenChange(false);
    setDrag(0);
  }

  const bottom = side === "bottom";

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={(event) => {
        if (open && !event.currentTarget.open) onOpenChange(false);
      }}
      onPointerDown={(event) => {
        // Arka plan yalnızca basış ORADA başladıysa kapatır: içeride metin
        // seçip dışarıda bırakmak da diyaloğun kendisine `click` düşürür.
        pressedBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        const backdrop = pressedBackdrop.current && event.target === event.currentTarget;
        pressedBackdrop.current = false;
        if (backdrop) onOpenChange(false);
      }}
      style={drag ? { translate: `0 ${drag}px`, transition: "none" } : undefined}
      className={cn(
        "fixed m-0 max-w-none overflow-hidden border-line bg-overlay p-0 text-body shadow-modal",
        "transition-[translate,display,overlay] transition-discrete duration-300 ease-[var(--ease-brand)]",
        "backdrop:bg-scrim backdrop:opacity-0 backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete backdrop:duration-300 open:backdrop:opacity-100 starting:open:backdrop:opacity-0",
        bottom
          ? "inset-x-0 top-auto bottom-0 max-h-[85dvh] w-full rounded-t-2xl border-t translate-y-full open:translate-y-0 starting:open:translate-y-full"
          : "inset-y-0 right-0 left-auto h-dvh max-h-none w-[min(26rem,calc(100%-2rem))] rounded-l-2xl border-l translate-x-full open:translate-x-0 starting:open:translate-x-full",
        className,
      )}
    >
      <div className={cn("flex flex-col", bottom ? "max-h-[85dvh]" : "h-full")}>
        {bottom ? (
          <div
            aria-hidden
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="group/handle flex h-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
          >
            <span className="h-1 w-10 rounded-full bg-line-strong transition-[background-color,scale] group-active/handle:scale-x-125 group-active/handle:bg-muted" />
          </div>
        ) : null}
        <header className={cn("flex items-start gap-4 px-5", bottom ? "pt-1" : "pt-5")}>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-title font-semibold tracking-tight">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-base text-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={closeLabel}
            title={closeLabel}
            className="-mt-2 -mr-2 inline-grid size-11 shrink-0 place-items-center rounded-full text-muted transition-[background-color,color,scale] hover:bg-surface-raised hover:text-strong active:scale-95 [&_svg]:size-[1.125rem]"
          >
            <X aria-hidden strokeWidth={1.75} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {footer ? (
          <footer className="flex flex-col-reverse gap-2 border-t border-line-soft bg-surface px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
            {footer}
          </footer>
        ) : (
          <div className="h-[max(1rem,env(safe-area-inset-bottom))] shrink-0" />
        )}
      </div>
    </dialog>
  );
}
