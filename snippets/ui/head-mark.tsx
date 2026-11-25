import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Başlık işareti: büyük başlığın İÇİNDE, bir kelimeye eşlik eden küçük
 * işaret. Üç biçim:
 *   - `tile`: kelimenin önünde, satır yüksekliğinde çizgi ikonlu kare
 *     ("From [▣] site to"). Ürünün nesnesini gösterir: site, ödeme, rapor.
 *   - `highlight`: kelimenin arkasında fosforlu kalem şeridi; açılışta
 *     soldan sağa çekilir (yalnız `transform`, CSS).
 *   - `dotted`: noktalı alt çizgi; kelime bir varlık adı (toplantı, kişi,
 *     proje), üstüne gelinince ayrıntı açılacağını ima eder.
 *
 * Referans turu 25 Kasım 2026: Synaps (yeşil vurgulu "site" + ikon karesi),
 * Lasso (başlık içinde çizim ve kart ikonu), Lindy (noktalı alt çizgili
 * "Design Sync"). Yalnız yapı; renkler paletten.
 *
 * KURAL: başlık başına EN ÇOK BİR işaret; iki işaret başlığı süs yığınına
 * çevirir. İkon `aria-hidden`: başlığın metni işaretsiz de tam okunur
 * (ekran okuyucu ve arama motoru aynı cümleyi görür). Vurgu rengi
 * `primary-soft` karışımı: metin rengi değişmez, kontrast korunur.
 * Hareketi azaltan kullanıcıda kalem şeridi baştan çizili.
 * Sunucu bileşeni.
 */

const CSS = `
@keyframes ui-headmark-draw { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.ui-headmark-hl::before { content: ""; position: absolute; inset: 0.08em -0.06em 0.02em; z-index: -1; border-radius: 0.08em; background: color-mix(in srgb, var(--primary-soft) 26%, transparent); transform-origin: left; animation: ui-headmark-draw .9s cubic-bezier(.22,1,.36,1) var(--hm-delay, .35s) both; }
@media (prefers-reduced-motion: reduce) { .ui-headmark-hl::before { animation: none; } }`;

export interface HeadMarkProps {
  variant?: "tile" | "highlight" | "dotted";
  /** `tile` için ikon (lucide); `highlight` ile birlikte de verilebilir. */
  icon?: ReactNode;
  children?: ReactNode;
  /** Kalem şeridinin çekilmeye başlama gecikmesi (sn); başlık harf harf açılıyorsa onun bitişine. */
  delay?: number;
  className?: string;
}

export function HeadMark({ variant = "tile", icon, children, delay, className }: HeadMarkProps) {
  // Kalem şeridinin içinde ikon çerçevesiz (şerit zaten bir zemin); düz başlıkta kare çerçeveli.
  const framed = variant === "tile";
  const tile = icon ? (
    <span
      aria-hidden
      className={cn(
        "mr-[0.1em] inline-grid translate-y-[0.04em] place-items-center text-primary-ink",
        framed ? "size-[0.78em] rounded-[0.18em] ring-[0.03em] ring-current ring-inset [&_svg]:size-[0.52em] [&_svg]:stroke-[2]" : "size-[0.7em] [&_svg]:size-[0.7em] [&_svg]:stroke-[1.75]",
      )}
    >
      {icon}
    </span>
  ) : null;
  if (variant === "dotted") {
    return (
      <span className={cn("underline decoration-dotted decoration-[0.08em] underline-offset-[0.14em] [text-decoration-color:color-mix(in_srgb,currentColor_55%,transparent)]", className)}>
        {children}
      </span>
    );
  }
  if (variant === "highlight") {
    return (
      <>
        <style href="ui-head-mark" precedence="default">
          {CSS}
        </style>
        <span className={cn("ui-headmark-hl relative isolate inline-block whitespace-nowrap px-[0.04em]", className)} style={delay !== undefined ? ({ "--hm-delay": `${delay}s` } as CSSProperties) : undefined}>
          {tile}
          {children}
        </span>
      </>
    );
  }
  return (
    <span className={cn("whitespace-nowrap", className)}>
      {tile}
      {children}
    </span>
  );
}
