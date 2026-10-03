import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Yalnızca ikon taşıyan düğme. `aria-label` TİPTE ZORUNLU: metinsiz bir
 * düğmenin adı yoksa ekran okuyucu "düğme" der ve susar. Etiketi Title Case
 * yaz ("Ayarları Aç"); `title` aynı metni fareyle üzerine gelene gösterir.
 * Daha zengin bir ipucu için `tooltip.tsx` → `<Tooltip>` ile sar.
 *
 * DOKUNMA HEDEFİ: dokunmatikte her boy 44 piksel. `sm` yalnızca hassas
 * işaretçide (fare) 36'ya iner; görsel küçülse de parmak hedefi küçülmez.
 *
 * Base UI tetikleyicisi olarak kullanılabilir (`render={<IconButton … />}`):
 * ref ve gelen bütün prop'lar düğmeye yayılıyor (React 19, ref bir prop).
 */

const VARIANTS = {
  ghost: "text-body hover:bg-primary-wash hover:text-strong",
  secondary: "border border-line bg-surface text-body hover:border-line-strong hover:text-strong",
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  danger: "text-danger hover:bg-danger-wash",
} as const;

const SIZES = {
  sm: "size-11 rounded-md pointer-fine:size-9 [&_svg]:size-4",
  md: "size-11 rounded-md [&_svg]:size-[1.125rem]",
  lg: "size-12 rounded-lg [&_svg]:size-5",
} as const;

type IconButtonProps = Omit<ComponentProps<"button">, "aria-label" | "children"> & {
  /** Zorunlu: düğmenin tek adı bu. */
  "aria-label": string;
  icon: LucideIcon;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  /** Fareyle üzerine gelince aynı etiketi göster. Tooltip ile sarılıysa kapat. */
  showTitle?: boolean;
};

export function IconButton({
  icon: Glyph,
  variant = "ghost",
  size = "md",
  showTitle = true,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      title={showTitle ? props["aria-label"] : undefined}
      className={cn(
        "inline-grid shrink-0 place-items-center transition-[background-color,color,border-color,transform] active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      <Glyph aria-hidden strokeWidth={1.75} />
    </button>
  );
}
