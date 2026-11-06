// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Atlıkarınca: yan yana kaydırılan kartlar (müşteri yorumları, ürün
 * görselleri, "Yeni Neler Var"). İçeriğin ÇOĞU görünmüyorsa kullanıcı onu
 * görmez; asıl mesaj atlıkarıncanın 2. slaytına konmaz.
 *
 * KAYDIRMA JS'SİZ: yatay `overflow-x-auto` + `scroll-snap`. Parmak, iz
 * paneli, Shift+tekerlek tarayıcının kendi fiziğiyle çalışır; JavaScript
 * yalnızca okları, noktaları ve klavyeyi bağlar. JS yüklenmeden de kayar.
 *
 * DURUM GÖZLEMCİYLE, KAYDIRMA DİNLEYİCİSİZ: hangi slaytın göründüğünü
 * `IntersectionObserver` söyler (her karede çalışan scroll dinleyicisi
 * slop listesinde). Etkin nokta = görünen ilk slayt; ok düğmeleri ilk/son
 * slayt tam görünürken `aria-disabled` (gerçek `disabled` odağı sayfanın
 * başına atardı: sona kadar "Sonraki"ye basan klavye kullanıcısı yerini kaybeder).
 *
 * NOKTA: etkin nokta uzayan bir hap. Genişlik animasyonu (düzen) yerine
 * her nokta 24 piksellik sabit bir yuvada durur ve `clip-path: inset(…
 * round)` ile 8 pikselden 24'e açılır: yuvarlak uç her karede doğru, düzen
 * hesaplanmaz. Nokta sayısı = kaydırılabilir konum sayısı (ekranda üç kart
 * varsa son iki nokta hiç etkin olamazdı, o yüzden gösterilmez).
 *
 * ERİŞİLEBİLİRLİK (WAI-ARIA carousel): kap `section` +
 * `aria-roledescription="carousel"` + ad; her slayt `role="group"` +
 * `aria-roledescription="slide"` + "2 / 5". Kaydırma alanı odaklanabilir
 * (klavyeyle kaydırılabilir bölge kuralı); ←/→ bir slayt, Home/End uçlar.
 * Konum değişimi düğmeyle ya da klavyeyle yapıldıysa gizli canlı bölge
 * "Slayt 3 / 5" der; parmakla kaydırırken susar. Otomatik oynatma YOK:
 * kendi kendine dönen içerik okunmaz ve WCAG 2.2.2 durdurma düğmesi ister.
 *
 * Hareketi azaltan kullanıcıda düğme ve klavye anında atlar (`behavior:
 * "auto"`), nokta ve ok geçişleri de kapanır.
 */

type CarouselProps = {
  /** Erişilebilir ad: "Müşteri Yorumları". */
  label: string;
  slides: readonly ReactNode[];
  /** Slayt genişliği; varsayılan telefonda %85, tablette yarım, masaüstünde üçte bir. */
  slideClassName?: string;
  className?: string;
};

export function Carousel({
  label,
  slides,
  slideClassName = "basis-[85%] sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)]",
  className,
}: CarouselProps) {
  const id = useId();
  const reduce = useReducedMotion();
  const viewport = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const [visible, setVisible] = useState<ReadonlySet<number>>(() => new Set([0]));
  const [announce, setAnnounce] = useState("");
  const count = slides.length;

  useEffect(() => {
    const root = viewport.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setVisible((prev) => {
          const next = new Set(prev);
          for (const entry of entries) {
            const index = Number((entry.target as HTMLElement).dataset.index);
            if (entry.intersectionRatio >= 0.9) next.add(index);
            else next.delete(index);
          }
          return next;
        });
      },
      { root, threshold: [0, 0.9, 1] },
    );
    for (const node of items.current) if (node) observer.observe(node);
    return () => observer.disconnect();
  }, [count]);

  const first = visible.size ? Math.min(...visible) : 0;
  const perView = Math.max(1, visible.size);
  const positions = Math.max(1, count - perView + 1);
  const active = Math.min(first, positions - 1);
  const canPrev = !visible.has(0);
  const canNext = !visible.has(count - 1);

  function go(index: number, speak = true) {
    const target = items.current[Math.max(0, Math.min(count - 1, index))];
    if (!target) return;
    /* scrollIntoView `scroll-padding` ve snap'e uyar; `block: "nearest"`
       sayfayı dikeyde oynatmaz. */
    target.scrollIntoView({ inline: "start", block: "nearest", behavior: reduce ? "auto" : "smooth" });
    if (speak) setAnnounce(`Slayt ${Math.min(index, positions - 1) + 1} / ${positions}`);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const map: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: positions - 1,
    };
    if (!(event.key in map)) return;
    event.preventDefault();
    go(Math.max(0, Math.min(positions - 1, map[event.key])));
  }

  const arrow =
    "grid size-11 cursor-pointer place-items-center rounded-full border border-line bg-overlay text-strong shadow-raised transition-[opacity,transform,border-color] duration-150 hover:border-line-strong active:scale-95 aria-disabled:cursor-default aria-disabled:opacity-35 aria-disabled:active:scale-100 motion-reduce:transition-none pointer-fine:size-9";

  return (
    <section aria-roledescription="carousel" aria-label={label} className={cn("grid gap-4", className)}>
      <div
        ref={viewport}
        id={`${id}-viewport`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label={`${label}, kaydırılabilir`}
        className="relative -mx-1 flex snap-x rounded-xl snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-1 px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            ref={(node) => {
              items.current[index] = node;
            }}
            data-index={index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} / ${count}`}
            className={cn("shrink-0 snap-start", slideClassName)}
          >
            {slide}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center" role="group" aria-label="Slayt Seç">
          {Array.from({ length: positions }, (_, index) => {
            const current = index === active;
            return (
              <button
                key={index}
                type="button"
                aria-label={`Slayt ${index + 1} / ${positions}`}
                aria-current={current ? "true" : undefined}
                aria-controls={`${id}-viewport`}
                onClick={() => go(index)}
                className="group grid h-11 w-6 cursor-pointer place-items-center pointer-fine:h-6"
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-2 w-6 rounded-full transition-[clip-path,background-color] duration-300 motion-reduce:transition-none",
                    current
                      ? "bg-strong [clip-path:inset(0_0_round_999px)]"
                      : "bg-line-strong [clip-path:inset(0_8px_round_999px)] group-hover:bg-muted",
                  )}
                />
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button type="button" aria-label="Önceki Slayt" aria-disabled={!canPrev} onClick={() => canPrev && go(active - 1)} className={arrow}>
            <ChevronLeft aria-hidden className="size-4" strokeWidth={2} />
          </button>
          <button type="button" aria-label="Sonraki Slayt" aria-disabled={!canNext} onClick={() => canNext && go(active + 1)} className={arrow}>
            <ChevronRight aria-hidden className="size-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </section>
  );
}
