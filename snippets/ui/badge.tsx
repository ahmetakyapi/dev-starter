import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Rozet: kısa durum ya da kategori etiketi ("Taslak", "Yayında", "Yeni").
 * Etkileşimsiz; tıklanan bir etiket gerekiyorsa düğme ya da bağlantı yap.
 *
 * Metin Title Case ve kısa (bir-iki kelime). Durum rozetinde renk TEK
 * işaret olmasın: `dot` küçük bir nokta ekler, ama asıl ayırt edici
 * metnin kendisi ("Hata" / "Tamam"); renk yalnızca hızlandırır.
 *
 * `soft` (varsayılan): yıkanmış zemin + koyu mürekkep, açık temada AA.
 * `outline`: yalnızca çizgi; yoğun tablolarda daha sessiz.
 */

const TONES = {
  neutral: { soft: "bg-surface-raised text-body", outline: "border-line-strong text-body", dot: "bg-muted" },
  primary: { soft: "bg-primary-wash text-primary-ink", outline: "border-primary/40 text-primary-ink", dot: "bg-primary" },
  success: { soft: "bg-success-wash text-success", outline: "border-success/40 text-success", dot: "bg-success" },
  warning: { soft: "bg-warning-wash text-warning", outline: "border-warning/40 text-warning", dot: "bg-warning" },
  danger: { soft: "bg-danger-wash text-danger", outline: "border-danger/40 text-danger", dot: "bg-danger" },
} as const;

type BadgeProps = ComponentProps<"span"> & {
  tone?: keyof typeof TONES;
  variant?: "soft" | "outline";
  dot?: boolean;
};

export function Badge({ tone = "neutral", variant = "soft", dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border border-transparent px-2.5 text-small font-semibold whitespace-nowrap",
        TONES[tone][variant],
        className,
      )}
      {...props}
    >
      {dot ? <span aria-hidden className={cn("size-1.5 rounded-full", TONES[tone].dot)} /> : null}
      {children}
    </span>
  );
}
