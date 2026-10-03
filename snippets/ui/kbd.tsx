import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Klavye tuşu. `<kbd>` anlamı taşır; ekran okuyucu içeriği okur.
 *
 * Simgeli tuşlar (⌘ ⇧ ⌥ ↵) ekran okuyucuda ya hiç ya da garip okunur; simge
 * kullanırken `label` ver ("Command"). `KbdCombo` tuşları "+" ile değil
 * boşlukla dizer; kısayolun tamamı için tek bir `aria-label` taşır.
 *
 * Dokunmatik ekranda klavye kısayolu anlamsız: kısayol ipuçlarını
 * `pointer-fine:` ya da `hidden sm:inline-flex` ile gizlemek çoğu zaman
 * doğru karar.
 */

export function Kbd({ label, className, children, ...props }: ComponentProps<"kbd"> & { label?: string }) {
  return (
    <kbd
      aria-label={label}
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[0.3125rem] border border-line-strong border-b-2 bg-surface px-1 font-mono text-micro font-medium text-soft",
        className,
      )}
      {...props}
    >
      {children}
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
