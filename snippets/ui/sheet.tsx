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
 * (`DRAG_CLOSE` pikselden fazla). Sürükleme tek yol değil: Kapat butonu
 * ve Escape her zaman var; hareket kısıtı olan kullanıcı sürüklemek zorunda
 * kalmaz.
 *
 * Güvenli alan: alt kenardaki dolgu `env(safe-area-inset-bottom)` taşır;
 * yoksa ana ekran çubuğu son butonun üstüne biner.
 *
 * GÖRÜNÜŞ ("board" dili, 2026-11): beyaz karo, açık kenarlarda `rounded-2xl`,
 * ince çizgisi ve `shadow-modal`. Kayma imza eğrisiyle (yaysız: büyük bir
 * yüzeyin aşıp geri gelmesi ekranı sallar); tutamak basılınca koyulaşır
 * ve hafifçe genişler, sürüklenebilir olduğunu söyler. Eylem satırı
 * diyalogdaki gibi hafif gri bir kuyu.
 *
 * YAN PANEL ANATOMİSİ (2026-11, Auton referansı): `icon` başlığın solunda
 * yumuşak karo (nesnenin kimliği: kanal, entegrasyon), `status` başlık
 * satırının sağında durum hapı ("Bağlı", "Açık"), başlık bandı saç
 * çizgisiyle içerikten ayrılır. Alt çubukta `footerStart` sola yaslanır:
 * yıkıcı ya da ayrı türden eylem ("Bağlantıyı Kes", "Arşivle") onaylama
 * butonlarının yanına değil karşı kenara düşer, kazara basılmaz.
 * `size="lg"`: içinde liste ve ayar satırları olan ayrıntı paneli (36rem).
 * `size="xl"`: iki sütunlu form ya da kayıt dosyası (46rem); masaüstü iş ekranı.
 * İlk odak ve yerel kapanış `dialog.tsx` ile aynı: başka bir öğe için
 * `data-autofocus` (`autoFocus` istemcide işlemez), `<form method="dialog">`
 * gibi React'i atlayan kapanış da duruma yansır.
 */

/** Bu kadar aşağı sürüklenirse kapanır. */
const DRAG_CLOSE = 80;

/**
 * Kaydırma gövdesinin ortak stili: gövde kendi içinde kayar (başlık ve eylem
 * çubuğu sabit), arka sayfaya zincirlenmez (`overscroll-contain`), çubuk ince
 * ve token renkli, `scroll-smooth` yalnız programatik/odak sıçramalarında
 * (tekerlek ve dokunuş zaten doğrudan; hareket azaltmada kapalı),
 * `scroll-py` odaklanan alanı kenara yapıştırmaz. Taşan içeriğe üst/alt ince
 * gölge: `background-attachment: local` örtüleri kaydırıldıkça gölgeyi
 * kapatır, yani gölge yalnız o yönde içerik KALDIYSA görünür (JS, ölçüm ve
 * `animation-timeline` desteği gerekmez; her tarayıcıda aynı).
 */
const SCROLL_BODY =
  "min-h-0 overflow-y-auto overscroll-contain scroll-smooth focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary scroll-py-4 motion-reduce:scroll-auto [scrollbar-gutter:stable_both-edges] [scrollbar-width:thin] [scrollbar-color:var(--color-line-strong)_transparent]";

const SCROLL_SHADOW = {
  background: [
    "linear-gradient(var(--color-overlay) 30%, transparent) top / 100% 1.5rem no-repeat local",
    "linear-gradient(transparent, var(--color-overlay) 70%) bottom / 100% 1.5rem no-repeat local",
    "radial-gradient(farthest-side at 50% 0, color-mix(in oklab, var(--color-strong) 16%, transparent), transparent) top / 100% 0.5rem no-repeat scroll",
    "radial-gradient(farthest-side at 50% 100%, color-mix(in oklab, var(--color-strong) 16%, transparent), transparent) bottom / 100% 0.5rem no-repeat scroll",
  ].join(", "),
} as const;

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
  /** Alt çubuğun solu: yıkıcı ya da ayrı türden eylem ("Bağlantıyı Kes"). */
  footerStart?: ReactNode;
  /** Başlığın solunda kimlik karosu (ikon ya da logo). */
  icon?: ReactNode;
  /** Başlık satırının sağında, kapat butonundan önce: durum hapı. */
  status?: ReactNode;
  /** `right`: masaüstünde yan panel; telefonda da sağdan açılır. */
  side?: "bottom" | "right";
  /** Yan panel genişliği: `md` 26rem, `lg` 36rem (liste + ayar içeren ayrıntı). */
  size?: "md" | "lg" | "xl";
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
  footerStart,
  icon,
  status,
  side = "bottom",
  size = "md",
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
    // görünmez butonu olursa odak hiçbir yere gitmez. Yalnız bu diyaloğun kendi hedefi.
    [...dialog.querySelectorAll<HTMLElement>("[data-autofocus]")]
      .find((el) => el.closest("dialog") === dialog)
      ?.focus();
    const body = dialog.querySelector<HTMLElement>("[data-scroll-body]");
    if (body) {
      body.scrollTo({ top: 0, behavior: "instant" });
      // Taşan gövdede odaklanabilir öğe yoksa klavye kullanıcısı kaydıramaz
      // (axe `scrollable-region-focusable`); gövdenin kendisi Tab durağı olur.
      const focusable = body.querySelector("a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex='-1'])");
      if (body.scrollHeight > body.clientHeight && !focusable) body.tabIndex = 0;
    }
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
          : cn("inset-y-0 right-0 left-auto h-dvh max-h-none rounded-l-2xl border-l", size === "xl" ? "w-[min(46rem,calc(100%-1rem))]" : size === "lg" ? "w-[min(36rem,calc(100%-1rem))]" : "w-[min(26rem,calc(100%-2rem))]", " translate-x-full open:translate-x-0 starting:open:translate-x-full"),
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
        <header className={cn("flex items-start gap-3 px-5", bottom ? "pt-1" : "border-b border-line-soft pt-4 pb-4")}>
          {icon ? (
            <span aria-hidden className="inline-grid size-10 shrink-0 place-items-center rounded-lg bg-surface text-strong ring-1 ring-line [&_svg]:size-5">
              {icon}
            </span>
          ) : null}
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
          {status ? <div className="flex shrink-0 items-center pt-1">{status}</div> : null}
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
        <div data-scroll-body className={cn(SCROLL_BODY, "flex-1 px-5 py-4")} style={SCROLL_SHADOW}>
          {children}
        </div>
        {footer || footerStart ? (
          <footer className="flex flex-col-reverse gap-2 border-t border-line-soft bg-surface px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-end max-sm:[&>*]:w-full">
            {footerStart ? <div className="flex items-center sm:mr-auto max-sm:justify-center">{footerStart}</div> : null}
            {footer}
          </footer>
        ) : (
          <div className="h-[max(1rem,env(safe-area-inset-bottom))] shrink-0" />
        )}
      </div>
    </dialog>
  );
}
