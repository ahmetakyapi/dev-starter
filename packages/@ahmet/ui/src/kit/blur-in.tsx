// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Children, Fragment, isValidElement, type CSSProperties, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Bulanıktan netleşen başlık: sözcükler sırayla, buğudan çıkıp yerine oturur
 * (Ribbon'ın kahraman başlığı: 10 px bulanıklık, 36 px aşağıdan, 0'dan 1'e).
 * Sayfanın TEK kahraman başlığı için. Bölüm başlıklarında `Reveal` yeter;
 * her başlık buğudan çıkarsa sayfa sisli bir slayt gösterisine döner.
 *
 * EDİTORYAL VURGU: çocuklar arasındaki öğe (genelde `<em>`) bölünmez, tek
 * parça gelir. Serif başlıkta tek sözcüğü italik yapmak (Ribbon: "instead of
 * *shrinking* them") başlığın bütün kimliğini taşır; `editorial` font
 * presetiyle (Instrument Serif) birebir. Bir başlıkta EN ÇOK BİR vurgu.
 *
 *   <BlurIn as="h1" className="font-display text-hero text-strong">
 *     Pencereleri <em>küçültmeden</em> kaydır.
 *   </BlurIn>
 *
 * NEDEN CSS, NEDEN JS DEĞİL: kahraman başlığı çoğu zaman LCP öğesi.
 * Hidrasyonu bekleyen bir giriş (Motion `initial`) başlığı JavaScript
 * inene kadar görünmez tutar; CSS animasyonu ilk boyamayla başlar ve
 * JavaScript kapalıyken de biter. Toplam süre kısa tutulur: son sözcük
 * ~700 ms + sözcük × 50 ms'de yerinde; uzun başlıkta (12+ sözcük) `step`
 * düşür ya da `by="block"` kullan.
 *
 * ERİŞİLEBİLİRLİK: sözcüklere bölünmüş metin bazı ekran okuyucularda
 * parça parça okunur. Bu yüzden görünen kopya `aria-hidden`, okunan kopya
 * `sr-only` ve bütün halinde. Hareketi azaltan kullanıcıda doğrudan net.
 */

const CSS = `
@keyframes ui-blur-in { from { opacity: 0; filter: blur(var(--blur-from)); transform: translateY(var(--blur-y)); } }
.ui-blur-in .ui-blur-unit { display: inline-block; animation: ui-blur-in var(--blur-dur) var(--ease-brand) both;
  animation-delay: calc(var(--blur-delay) + var(--i, 0) * var(--blur-step)); }
@media (prefers-reduced-motion: reduce) { .ui-blur-in .ui-blur-unit { animation: none; } }`;

type BlurInProps = {
  children: ReactNode;
  as?: "h1" | "h2" | "p" | "span" | "div";
  /** `word`: sözcük sözcük (varsayılan). `block`: bütün metin tek parça. */
  by?: "word" | "block";
  /** İlk sözcükten önce bekleme, ms. Kahramanda 0-150 arası; menü ve görsel önce otursun istersen artır. */
  delay?: number;
  /** Sözcükler arası kademe, ms. */
  step?: number;
  /** Tek sözcüğün süresi, ms. */
  duration?: number;
  /** Başlangıç bulanıklığı, piksel. */
  blur?: number;
  /** Başlangıç kayması, piksel. */
  y?: number;
  className?: string;
};

type Unit = { node: ReactNode; gapAfter: boolean };

/** Metni sözcüklere, öğeleri tek parçaya böler; boşluk düz metin kalır (satır oradan kırılır). */
function units(children: ReactNode, by: "word" | "block"): Unit[] {
  if (by === "block") return [{ node: children, gapAfter: false }];
  const out: Unit[] = [];
  for (const child of Children.toArray(children)) {
    if (typeof child === "string" || typeof child === "number") {
      for (const piece of String(child).split(/(\s+)/)) {
        if (!piece) continue;
        if (/^\s+$/.test(piece)) {
          if (out.length) out[out.length - 1].gapAfter = true;
        } else out.push({ node: piece, gapAfter: false });
      }
    } else if (isValidElement(child)) out.push({ node: child, gapAfter: false });
  }
  return out;
}

export function BlurIn({
  children,
  as: Tag = "h1",
  by = "word",
  delay = 80,
  step = 50,
  duration = 700,
  blur = 10,
  y = 28,
  className,
}: BlurInProps) {
  const parts = units(children, by);
  const vars = {
    "--blur-delay": `${delay}ms`,
    "--blur-step": `${step}ms`,
    "--blur-dur": `${duration}ms`,
    "--blur-from": `${blur}px`,
    "--blur-y": `${y}px`,
  } as CSSProperties;

  return (
    <Tag className={cn("ui-blur-in", className)} style={vars}>
      <style href="ui-blur-in" precedence="default">
        {CSS}
      </style>
      <span className="sr-only">{children}</span>
      <span aria-hidden>
        {parts.map((part, i) => (
          <Fragment key={i}>
            <span className="ui-blur-unit" style={{ "--i": i } as CSSProperties}>
              {part.node}
            </span>
            {part.gapAfter ? " " : null}
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}
