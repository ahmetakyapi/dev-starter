// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Children, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Kenar buğusu: yatay kayan şeridin (kart karuseli, logo sırası, galeri)
 * iki kenarında KADEMELİ buğu. Kenara yaklaştıkça artan `backdrop-filter:
 * blur()` katmanları ve hafif bir zemin solması: kartlar kenarda kesilmez,
 * sisin içine girer. Düz maske solmasından farkı, kenardaki kartın şekli
 * kalır ama okunmaz; "daha var" sinyali verir.
 *
 * NE ZAMAN DEĞİL: dikey liste (orada maske solması yeter), okunacak metin
 * tablosu, tek kartlık şerit. Arkasında hareket eden ağır içerik varsa
 * (video) backdrop-filter her karede yeniden çizer: kenar sayısını ve
 * `size`ı küçük tut.
 *
 * NASIL: her kenarda `layers` (3-4) katman; her biri bir öncekinin iki katı
 * buğu taşır ve `mask-image` ile kenardan içeri bir dilime kırpılır
 * (dilimler üst üste biner, geçiş kesintisiz). En üstte `fadeColor` ile
 * solma. Kendi kaydırıcın varsa onu sar: `<EdgeBlur>{şerit}</EdgeBlur>`.
 * `scrollable` verirsen çocukları kendisi yatay kayan listeye koyar (snap,
 * gizli kaydırma çubuğu) ve kenarları KONUMA göre ayrı ayrı gösterir: iki
 * uçtaki görünmez işaretçiyi IntersectionObserver izler (kaydırma olayına
 * dinleyici yok). Başlangıçta sol kenar buğusu gizlidir.
 *
 * Tarayıcı `backdrop-filter`ı desteklemiyorsa ya da kullanıcı saydamlığı
 * azaltmışsa (`prefers-reduced-transparency`) buğu katmanları çizilmez,
 * yalnız solma kalır.
 *
 * ERİŞİLEBİLİRLİK: katmanlar `aria-hidden` ve `pointer-events: none`
 * (altındaki kart tıklanır). `scrollable` bölge klavyeyle odaklanır
 * (`tabIndex=0`, ok tuşları kaydırır) ve `label` adını taşır.
 *
 * DİKKAT: `scrollable` olmadan iki kenar HEP buğuludur (kaydırma konumunu
 * bilmez). Kendi kayan listesi olan bir şeridi (`OfferRow`) sarmalama: ilk ve
 * son kartın yarısı daima bulanık kalır; `scrollable` ile kartları doğrudan ver.
 *
 * Manzara turundan (tanıtım sitesi kart şeridi; yalnız davranış ve yapı).
 *
 *   <EdgeBlur scrollable label="Öne çıkan konaklamalar" itemClassName="w-72">
 *     {offers.map((o) => <OfferCard key={o.id} {...o} />)}
 *   </EdgeBlur>
 */

const CSS = `
.ui-edge-layer { position: absolute; inset: 0; -webkit-backdrop-filter: blur(var(--eb-blur)); backdrop-filter: blur(var(--eb-blur)); }
.ui-edge-side { transition: opacity 0.3s var(--ease-brand); }
.ui-edge-side[data-hidden="true"] { opacity: 0; }
.ui-edge-scroller { scrollbar-width: none; }
.ui-edge-scroller::-webkit-scrollbar { display: none; }
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) { .ui-edge-layer { display: none; } }
@media (prefers-reduced-transparency: reduce) { .ui-edge-layer { display: none; } }
@media (prefers-reduced-motion: reduce) { .ui-edge-side { transition: none; } }`;

type Side = "left" | "right";

type EdgeBlurProps = {
  children: ReactNode;
  side?: "both" | Side;
  /** Buğulu bandın genişliği (CSS uzunluğu). */
  size?: string;
  /** En dıştaki katmanın buğusu, piksel; içe doğru yarıya iner. */
  strength?: number;
  /** Katman sayısı (3-4); fazlası maliyet, azı basamak görünür. */
  layers?: 3 | 4;
  /** Solma rengi: şeridin oturduğu zemin. Varsayılan sayfa zemini. */
  fadeColor?: string;
  /** Kenarda solmanın yoğunluğu, yüzde (0 solma yok). */
  fade?: number;
  /** Çocukları kendi yatay kayan listesine koyar, kenarları konuma göre gösterir. */
  scrollable?: boolean;
  /** `scrollable` bölgenin ekran okuyucu adı. */
  label?: string;
  /** `scrollable` listenin sınıfı (boşluk, iç kenar). */
  listClassName?: string;
  /**
   * `scrollable`: şeridin iki yan iç boşluğu (CSS uzunluğu, ör.
   * `max(1rem, calc((100vw - 72rem) / 2))`). Hem listeye dolgu hem kaydırma
   * kabına `scroll-padding` olarak verilir: yapışma (snap) ilk kartı sayfa
   * kenarına değil bu boşluğa hizalar; kahramanda kartlar içerik sütunuyla
   * aynı çizgiden başlar, sağda kenara taşar.
   */
  inset?: string;
  /** `scrollable` her öğenin sınıfı (genişlik). */
  itemClassName?: string;
  className?: string;
};

function EdgeSide({
  side,
  size,
  strength,
  layers,
  fadeColor,
  fade,
  hidden,
}: {
  side: Side;
  size: string;
  strength: number;
  layers: number;
  fadeColor: string;
  fade: number;
  hidden: boolean;
}) {
  // Maskenin 0 noktası bandın İÇ kenarı, %100'ü dış kenar (şeridin ucu).
  const dir = side === "left" ? "to left" : "to right";
  const step = 100 / layers;
  return (
    <div
      aria-hidden
      data-hidden={hidden}
      className={cn("ui-edge-side pointer-events-none absolute inset-y-0 z-10", side === "left" ? "left-0" : "right-0")}
      style={{ width: size }}
    >
      {Array.from({ length: layers }, (_, i) => {
        const stops = [`transparent ${i * step}%`, `black ${(i + 1) * step}%`];
        if (i < layers - 2) stops.push(`black ${(i + 2) * step}%`, `transparent ${(i + 3) * step}%`);
        const mask = `linear-gradient(${dir}, ${stops.join(", ")})`;
        return (
          <div
            key={i}
            className="ui-edge-layer"
            style={
              {
                "--eb-blur": `${(strength / 2 ** (layers - 1 - i)).toFixed(2)}px`,
                maskImage: mask,
                WebkitMaskImage: mask,
              } as CSSProperties
            }
          />
        );
      })}
      {fade > 0 ? (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(${dir}, transparent, color-mix(in oklab, ${fadeColor} ${fade}%, transparent))` }}
        />
      ) : null}
    </div>
  );
}

export function EdgeBlur({
  children,
  side = "both",
  size = "8rem",
  strength = 16,
  layers = 4,
  fadeColor = "var(--color-page)",
  fade = 60,
  scrollable = false,
  label = "Kaydırılabilir liste",
  listClassName,
  inset,
  itemClassName,
  className,
}: EdgeBlurProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const start = useRef<HTMLSpanElement>(null);
  const end = useRef<HTMLSpanElement>(null);
  // Başlangıç: şerit en solda, sol uç görünür (buğu gizli), sağda devamı var.
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    if (!scrollable || !scroller.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === start.current) setAtStart(entry.isIntersecting);
          if (entry.target === end.current) setAtEnd(entry.isIntersecting);
        }
      },
      { root: scroller.current, threshold: 0 },
    );
    if (start.current) observer.observe(start.current);
    if (end.current) observer.observe(end.current);
    return () => observer.disconnect();
  }, [scrollable]);

  const shared = { size, strength, layers, fadeColor, fade };
  const showLeft = side !== "right";
  const showRight = side !== "left";
  const items = scrollable ? Children.toArray(children) : [];

  return (
    <div className={cn("relative isolate", className)}>
      <style href="ui-edge-blur" precedence="default">
        {CSS}
      </style>
      {scrollable ? (
        <div
          ref={scroller}
          role="region"
          aria-label={label}
          tabIndex={0}
          style={inset ? { scrollPaddingInline: inset } : undefined}
          className="ui-edge-scroller snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-xl outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus focus-visible:outline-solid"
        >
          <ul className={cn("flex w-max gap-4", listClassName)} style={inset ? { paddingInline: inset } : undefined}>
            {items.map((child, i) => (
              <li key={i} className={cn("relative shrink-0 snap-start", itemClassName)}>
                {i === 0 ? <span ref={start} aria-hidden className="absolute inset-y-0 left-0 w-px" /> : null}
                {child}
                {i === items.length - 1 ? <span ref={end} aria-hidden className="absolute inset-y-0 right-0 w-px" /> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        children
      )}
      {showLeft ? <EdgeSide side="left" hidden={scrollable && atStart} {...shared} /> : null}
      {showRight ? <EdgeSide side="right" hidden={scrollable && atEnd} {...shared} /> : null}
    </div>
  );
}
