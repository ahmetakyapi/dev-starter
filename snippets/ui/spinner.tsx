import { cn } from "@/lib/utils";

/**
 * Spinner: küçük, satır içi bekleme işareti (düğme içi, tek hücre, kısa
 * istek). Sayfa ya da panel düzeyinde bekleme için `skeleton.tsx`: yapıyı
 * tutan iskelet, dönen bir halkadan daha az zıplatır.
 *
 * Ekran okuyucu `label`i duyar (`role="status"`). Düğme içinde kullanırken
 * düğmenin kendi metni zaten bir şey söylüyorsa `label={null}` ver; aynı
 * cümle iki kez okunmasın.
 *
 * Hareketi azaltan kullanıcıda dönmez; yay olarak durur. Durağan yay da
 * "bitmedi" der, ama gözü yormaz.
 */

const SIZES = { sm: "size-4", md: "size-5", lg: "size-8" } as const;

type SpinnerProps = {
  size?: keyof typeof SIZES;
  /** Ekran okuyucu metni. `null`: yalnızca görsel (çevredeki metin anlatıyor). */
  label?: string | null;
  className?: string;
};

export function Spinner({ size = "md", label = "Yükleniyor", className }: SpinnerProps) {
  const svg = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn(SIZES[size], "shrink-0 animate-spin text-primary motion-reduce:animate-none", className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );

  if (label === null) return svg;

  return (
    <span role="status" className="inline-flex items-center">
      {svg}
      <span className="sr-only">{label}</span>
    </span>
  );
}
