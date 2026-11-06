// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "../utils";

/**
 * Parıltılı metin: süren bir işin kısa etiketi. "Asistan düşünüyor…",
 * "Rapor hazırlanıyor…", "Kaynaklar taranıyor…". Işık metnin üstünden soldan
 * sağa geçer; spinner'ın yerini değil, ETİKETİN yerini alır (iş metinle
 * anlatılıyorsa ayrıca dönen halka koyma).
 *
 * RENK DEĞİL MASKE: metin tek token renginde (`text-strong`) kalır; parıltı
 * bir alfa maskesinin (`mask-image`) kaymasıyla oluşur. Degrade metin
 * değildir (degrade disiplini üç yer kuralı korunur), palette ve temada
 * aynı çalışır. Maskenin en sönük yeri %60 opaklık: açıkta 5,7:1, koyuda
 * 7:1, metin hiçbir karede AA'nın altına düşmez.
 *
 * DURUM BİLDİRİMİ ÇAĞIRANDA: etiket değişince okunması gerekiyorsa
 * `live` ver (`role="status"`); tek seferlik etikette gerek yok. Parıltı
 * kendisi ekran okuyucuya bir şey söylemez.
 *
 * Hareketi azaltan kullanıcıda maske kalkar, düz metin kalır. Sunucu
 * bileşeni: istemci JavaScript'i yok, yalnız CSS.
 *
 *   <TextShimmer live>Asistan yanıt yazıyor…</TextShimmer>
 */

const CSS = `
@keyframes ui-shimmer { from { mask-position: 100% 0; -webkit-mask-position: 100% 0; } to { mask-position: 0 0; -webkit-mask-position: 0 0; } }
.ui-shimmer {
  --shimmer-dim: color-mix(in srgb, currentColor 60%, transparent);
  -webkit-mask-image: linear-gradient(100deg, var(--shimmer-dim) 35%, currentColor 50%, var(--shimmer-dim) 65%);
  mask-image: linear-gradient(100deg, var(--shimmer-dim) 35%, currentColor 50%, var(--shimmer-dim) 65%);
  -webkit-mask-size: 300% 100%;
  mask-size: 300% 100%;
  animation: ui-shimmer var(--shimmer-duration, 2s) linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .ui-shimmer { animation: none; -webkit-mask-image: none; mask-image: none; }
}`;

type TextShimmerProps = {
  children: ReactNode;
  /** Öğe türü; satır içi metin için `span` (varsayılan), başlık için `p`. */
  as?: ElementType;
  /** Bir geçişin saniyesi. */
  duration?: number;
  /** `role="status"`: etiket değişince okunur. */
  live?: boolean;
  className?: string;
};

export function TextShimmer({ children, as: Tag = "span", duration = 2, live = false, className }: TextShimmerProps) {
  return (
    <>
      <style href="ui-text-shimmer" precedence="default">
        {CSS}
      </style>
      <Tag
        role={live ? "status" : undefined}
        className={cn("ui-shimmer inline-block font-medium text-strong", className)}
        style={{ "--shimmer-duration": `${duration}s` } as CSSProperties}
      >
        {children}
      </Tag>
    </>
  );
}
