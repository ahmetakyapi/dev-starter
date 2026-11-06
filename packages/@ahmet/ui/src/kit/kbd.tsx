// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { ComponentProps } from "react";
import { cn } from "../utils";

/**
 * Klavye tuşu. `<kbd>` anlamı taşır; ekran okuyucu içeriği okur.
 *
 * Simgeli tuşlar (⌘ ⇧ ⌥ ↵) ekran okuyucuda ya hiç ya da garip okunur; simge
 * kullanırken `label` ver ("Command"). Ad görünmez METİN olarak yazılır,
 * simge gizlenir: `<kbd>`nin rolü yok ve rolsüz öğeye `aria-label` konamaz
 * (ARIA 1.2), ekran okuyucu onu yok sayıp yine simgeyi okurdu. `KbdCombo`
 * tuşları "+" ile değil boşlukla dizer; kısayolun tamamı için tek bir
 * `aria-label` taşır (`role="img"` sayesinde geçerli).
 *
 * GÖRÜNÜŞ ("board" dili, 2026-11): beyaz küçük karo (`bg-overlay`), kıl
 * çizgisi ve kısa gölge; eski kalın alt kenar (`border-b-2`) daktilo tuşu
 * gibi ağırdı. Yazı mono değil gövde fontu: ↑ ↓ ↵ ⌘ gibi simgeler Inter'de
 * daha dengeli, harfler aynı genişlikte görünür (`tabular-nums`).
 *
 * Dokunmatik ekranda klavye kısayolu anlamsız: kısayol ipuçlarını
 * `pointer-fine:` ya da `hidden sm:inline-flex` ile gizlemek çoğu zaman
 * doğru karar.
 */

export function Kbd({ label, className, children, ...props }: ComponentProps<"kbd"> & { label?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[0.3125rem] border border-line bg-overlay px-1.5 font-sans text-micro font-medium text-muted tabular-nums shadow-raised",
        className,
      )}
      {...props}
    >
      {label ? (
        <>
          <span aria-hidden>{children}</span>
          <span className="sr-only">{label}</span>
        </>
      ) : (
        children
      )}
    </kbd>
  );
}

type KbdComboProps = {
  /** Görünen tuşlar: ["⌘", "K"]. */
  keys: readonly string[];
  /** Kısayolun okunan adı: "Command K". */
  label: string;
  className?: string;
};

export function KbdCombo({ keys, label, className }: KbdComboProps) {
  return (
    <span role="img" aria-label={label} className={cn("inline-flex items-center gap-1", className)}>
      {keys.map((key) => (
        <Kbd key={key} aria-hidden>
          {key}
        </Kbd>
      ))}
    </span>
  );
}
