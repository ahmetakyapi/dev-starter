// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Seçim çubuğu: tabloda ya da listede birden çok satır seçilince ekranın
 * altından yükselen toplu işlem adası ("3 talep seçildi · Bana Ata ·
 * Çözüldü · Arşivle"). Seçim yokken DOM'da yok; işlemler satırın kendi
 * menüsünde de durur (çubuk hızlandırıcıdır, tek yol değil).
 *
 * TERS ADA: zemin metin rengi (`bg-strong`), metin sayfa rengi: iki temada
 * da sayfanın üstünde ayrı bir katman olarak okunur ve sayfadaki kartlarla
 * karışmaz (açıkta koyu, koyuda açık ada). Yıkıcı eylem dolgulu tehlike
 * hapı: ters zeminde tehlike metni AA tutmazdı.
 *
 * KLAVYE (WAI-ARIA toolbar): Tab çubuğa bir kez girer, ← → düğmeler
 * arasında gezer; Escape seçimi bırakır. Sayı değişince gizli canlı bölge
 * "3 talep seçildi" der; düğmelere odak zorla taşınmaz (kullanıcı satır
 * seçmeye devam ediyor olabilir).
 *
 * HAREKET: 16 px aşağıdan ve 0,96 ölçekten yayla gelir, sayı değişince
 * yeniden canlanmaz. Hareketi azaltanda yalnız solar (MotionConfig).
 *
 *   <SelectionBar count={ids.length} noun="talep" onClear={() => setIds([])}>
 *     <SelectionAction icon={<Check />} onClick={resolve}>Çözüldü</SelectionAction>
 *     <SelectionAction tone="danger" icon={<Archive />} onClick={archive}>Arşivle</SelectionAction>
 *   </SelectionBar>
 */

type SelectionBarProps = {
  count: number;
  /** Seçilen şeyin adı, küçük harf: "talep", "dosya". */
  noun?: string;
  onClear: () => void;
  children: ReactNode;
  /** `fixed` (varsayılan) ekranın altında; `sticky` kendi kabının altında. */
  position?: "fixed" | "sticky";
  className?: string;
};

export function SelectionBar({ count, noun = "öğe", onClear, children, position = "fixed", className }: SelectionBarProps) {
  const bar = useRef<HTMLDivElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClear();
      return;
    }
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const buttons = [...(bar.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])];
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    event.preventDefault();
    buttons[(i + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
  }

  return (
    <>
      <span role="status" className="sr-only">
        {count > 0 ? `${count} ${noun} seçildi` : ""}
      </span>
      <AnimatePresence>
        {count > 0 ? (
          <m.div
            key="bar"
            ref={bar}
            role="toolbar"
            aria-label={`Seçili ${noun} işlemleri`}
            onKeyDown={onKeyDown}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className={cn(
              "z-40 flex max-w-[calc(100vw-1.5rem)] items-center gap-1 overflow-x-auto rounded-2xl bg-strong p-1.5 text-page shadow-modal [scrollbar-width:none]",
              position === "fixed" ? "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2" : "sticky bottom-4 mx-auto w-fit",
              className,
            )}
          >
            <span className="flex shrink-0 items-center gap-2 py-1 pr-2 pl-2.5">
              <span className="grid h-6 min-w-6 place-items-center rounded-full bg-page px-1.5 text-small font-bold text-strong tabular-nums">{count}</span>
              <span className="text-base font-medium whitespace-nowrap">{noun} seçildi</span>
            </span>
            <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-page/20" />
            {children}
            <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-page/20" />
            <SelectionAction onClick={onClear} icon={<X />} label="Seçimi Bırak" />
          </m.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

type SelectionActionProps = {
  children?: ReactNode;
  icon?: ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
  /** Yalnız ikonlu düğmede ad (zorunlu). */
  label?: string;
  disabled?: boolean;
};

export function SelectionAction({ children, icon, onClick, tone = "default", label, disabled }: SelectionActionProps) {
  const iconOnly = !children;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl text-base font-medium whitespace-nowrap transition-[background-color,scale] duration-150 active:scale-95 disabled:opacity-40 [&_svg]:size-4",
        iconOnly ? "w-10 justify-center" : "px-3",
        tone === "danger" ? "bg-danger text-on-primary hover:brightness-110" : "hover:bg-page/12",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
