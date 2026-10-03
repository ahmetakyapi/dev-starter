import type { LucideIcon, LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * lucide-react sarmalayıcısı: tek boyut ölçeği, tek çizgi kalınlığı.
 *
 * VARSAYILAN `aria-hidden`. İkonların çoğu yanındaki metnin süsü; ekran
 * okuyucu "görüntü" diye okumamalı. İkon TEK BAŞINA anlam taşıyorsa (tablo
 * hücresindeki onay işareti) `label` ver: o zaman `role="img"` ile adı okunur.
 * Düğmenin tek içeriği ikonsa etiketi ikona değil DÜĞMEYE ver
 * (`icon-button.tsx`, `aria-label` zorunlu).
 *
 * Boyut ölçeği metinle eşleşir: sm → text-small/base satırı, md → read,
 * lg → başlık. Piksel yazma; ölçeği büyütmek gerekirse buraya ekle.
 */

export const ICON_SIZES = { sm: 16, md: 20, lg: 24 } as const;
export type IconSize = keyof typeof ICON_SIZES;

/* İnce çizgi (1.75) token'lı arayüzde daha sakin; lucide varsayılanı 2. */
const STROKE = 1.75;

type IconProps = Omit<LucideProps, "size" | "ref"> & {
  icon: LucideIcon;
  size?: IconSize;
  /** Verilirse ikon anlam taşır ve ekran okuyucu bu adı okur. */
  label?: string;
};

export function Icon({ icon: Glyph, size = "sm", label, className, strokeWidth = STROKE, ...props }: IconProps) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };
  return (
    <Glyph
      size={ICON_SIZES[size]}
      strokeWidth={strokeWidth}
      className={cn("shrink-0", className)}
      focusable="false"
      {...a11y}
      {...props}
    />
  );
}
