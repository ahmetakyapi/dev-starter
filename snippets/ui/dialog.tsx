"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Diyalog: yerel `<dialog>` + `showModal()`. Başsız kütüphane GEREKMİYOR,
 * çünkü tarayıcı en zor üç işi kendisi yapıyor:
 *   - odak tuzağı: modal açıkken sayfanın geri kalanı `inert` (Tab dışarı
 *     kaçmaz, ekran okuyucu arkadaki içeriği okumaz);
 *   - Escape: `cancel` olayı; burada yakalanıp kontrollü duruma çevriliyor;
 *   - üst katman (top layer): z-index savaşı yok, `overflow: hidden` bir ata
 *     diyaloğu kesemez.
 * Bizim eklediklerimiz: arka plana tıklayınca kapanma, odağın açan düğmeye
 * DÖNMESİ (tarayıcılar bunu tutarlı yapmıyor) ve sayfa kaydırma kilidi.
 *
 * Kaydırma kilidi `html:has(dialog[open])` ile YAPILMAZ: kökteki `:has()`
 * her DOM değişikliğinde bütün belgenin stilini yeniden hesaplatıyor
 * (ölçülmüş bir yavaşlık). Kilit sayaçlı: üst üste açılan iki diyalogdan
 * ilki kapanınca kilit çözülmez.
 *
 * Açılış animasyonu yalnızca CSS (`@starting-style` + `transition-discrete`).
 * Desteklemeyen tarayıcıda diyalog animasyonsuz açılır, bozulmaz.
 *
 * İlk odak: tarayıcı ilk odaklanabilir öğeye gider. Başka bir öğe istiyorsan
 * ona `autoFocus` ver. Yıkıcı bir onayda ilk odak "Vazgeç"te olmalı.
 */

let lockCount = 0;

function lockScroll() {
  lockCount += 1;
  if (lockCount === 1) {
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    // Kaydırma çubuğu kaybolunca sayfa yana kaymasın.
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

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Title Case başlık; diyaloğun adı (`aria-labelledby`). */
  title: ReactNode;
  /** Tek cümlelik açıklama (`aria-describedby`). */
  description?: ReactNode;
  children?: ReactNode;
  /** Alttaki eylemler; sağa yaslanır, telefonda tam genişlik. */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Arka plana tıklayınca kapansın mı. Form doldururken kapatmak veri kaybettirir. */
  dismissible?: boolean;
  closeLabel?: string;
  className?: string;
};

const SIZES = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" } as const;

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
  closeLabel = "Kapat",
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    lockScroll();
    return () => {
      dialog.close();
      unlockScroll();
      // Odak açan öğeye döner; o öğe artık sayfada yoksa tarayıcıya bırakılır.
      const back = opener.current;
      if (back?.isConnected) back.focus();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        // Escape: tarayıcının kendi kapatması yerine kontrollü durum.
        event.preventDefault();
        onOpenChange(false);
      }}
      onClick={(event) => {
        // Diyaloğun kendisine (iç kabın dışına, yani arka plana) tıklandı.
        if (dismissible && event.target === event.currentTarget) onOpenChange(false);
      }}
      className={cn(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-hidden rounded-xl border border-line-strong bg-overlay p-0 text-body shadow-modal",
        "translate-y-2 opacity-0 transition-[opacity,translate,display,overlay] transition-discrete duration-200 open:translate-y-0 open:opacity-100 starting:open:translate-y-2 starting:open:opacity-0",
        "backdrop:bg-scrim backdrop:opacity-0 backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete backdrop:duration-200 open:backdrop:opacity-100 starting:open:backdrop:opacity-0",
        SIZES[size],
        className,
      )}
    >
      {/* İçerik kapalıyken de DOM'da: kapanış animasyonu boş bir kutuyu
          küçültmesin. Kapalı `<dialog>` zaten `display: none` ve erişilebilirlik
          ağacının dışında. Her açılışta sıfırlanması gereken bir form varsa
          ona `key` ver. */}
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <header className="flex items-start gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-title font-semibold">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1.5 text-base text-soft">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={closeLabel}
            title={closeLabel}
            className="-mt-2 -mr-2 inline-grid size-11 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-primary-wash hover:text-strong [&_svg]:size-[1.125rem]"
          >
            <X aria-hidden strokeWidth={1.75} />
          </button>
        </header>
        {children ? <div className="min-h-0 overflow-y-auto px-5 py-4 sm:px-6">{children}</div> : null}
        {footer ? (
          <footer className="flex flex-col-reverse gap-2 border-t border-line-soft px-5 py-4 sm:flex-row sm:justify-end sm:px-6 [&>*]:w-full sm:[&>*]:w-auto">
            {footer}
          </footer>
        ) : (
          <div className="h-5 sm:h-6" />
        )}
      </div>
    </dialog>
  );
}
