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
 *
 * GÖRÜNÜŞ ("board" dili, 2026-11): ince iz halkası + çeyrek yay, 0,75 sn'de
 * bir tur (1 sn üstü ağır, 0,5 altı telaşlı görünür). `tone="current"`
 * düğmenin metin rengini alır: `bg-cta` düğmede beyaz, ikincilde koyu;
 * düğme içinde vurgu mavisi sırıtırdı.
 */

const SIZES = { sm: "size-4", md: "size-5", lg: "size-8" } as const;
const TONES = { primary: "text-primary", current: "text-current", muted: "text-muted" } as const;

type SpinnerProps = {
  size?: keyof typeof SIZES;
  /** Ekran okuyucu metni. `null`: yalnızca görsel (çevredeki metin anlatıyor). */
  label?: string | null;
  tone?: keyof typeof TONES;
  className?: string;
};

export function Spinner({ size = "md", label = "Yükleniyor", tone = "primary", className }: SpinnerProps) {
  const svg = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn(SIZES[size], TONES[tone], "shrink-0 animate-spin [animation-duration:0.75s] motion-reduce:animate-none", className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.16" strokeWidth="2.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
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
