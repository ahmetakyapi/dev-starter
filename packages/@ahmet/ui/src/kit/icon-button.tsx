// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "../utils";

/**
 * Yalnızca ikon taşıyan düğme. `aria-label` TİPTE ZORUNLU: metinsiz bir
 * düğmenin adı yoksa ekran okuyucu "düğme" der ve susar. Etiketi Title Case
 * yaz ("Ayarları Aç"); `title` aynı metni fareyle üzerine gelene gösterir.
 * Daha zengin bir ipucu için `tooltip.tsx` → `<Tooltip>` ile sar.
 *
 * DOKUNMA HEDEFİ: dokunmatikte her boy 44 piksel. `sm` yalnızca hassas
 * işaretçide (fare) 36'ya iner; görsel küçülse de parmak hedefi küçülmez.
 *
 * GÖRÜNÜŞ ("board" dili, 2026-11): `ghost` üzerine gelince yumuşak gri
 * (vurgu yıkaması değil: ikon düğmeler çoğunlukla araç çubuğunda dizilir,
 * renkli hover sırayla yanıp sönerdi); `secondary` beyaz karo + kıl
 * çizgisi. Basılınca 0,95'e çöker (aşağı itme yerine: kare düğmede kayma
 * hizayı bozuyordu).
 *
 * Base UI tetikleyicisi olarak kullanılabilir (`render={<IconButton … />}`):
 * ref ve gelen bütün prop'lar düğmeye yayılıyor (React 19, ref bir prop).
 */

const VARIANTS = {
  ghost: "text-body hover:bg-surface-raised hover:text-strong data-popup-open:bg-surface-raised aria-expanded:bg-surface-raised",
  secondary: "border border-line bg-overlay text-body shadow-raised hover:bg-surface hover:text-strong",
  primary: "bg-primary text-on-primary shadow-cta hover:bg-primary-hover",
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
        "inline-grid shrink-0 place-items-center transition-[background-color,color,border-color,scale] duration-150 active:scale-95 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
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
