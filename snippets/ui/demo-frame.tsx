import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Lab kartı: canlı bir bileşeni noktalı zeminli yuvarlak bir kuyuda
 * sergiler, altında tek paragraf künye ("**Kalın başlık.** soluk açıklama")
 * ve isteğe küçük bir "Devamı" hapı. Etkileşim denemesi, bileşen vitrini,
 * kişisel sitenin "Lab" sekmesi, tasarım sisteminin desen sayfası.
 *
 * NE ZAMAN DEĞİL: ürünün kendisini anlatan özellik bölümü (`feature-tile`),
 * ekran görüntüsü/video vitrini (`shot-card`), belge içi kod örneği
 * (`code-block`). Kuyunun içindeki şey GERÇEK ve dokunulabilir olmalı;
 * hareketsiz görsel için bu çerçeve fazla.
 *
 * NASIL: sahne `bg-surface` kuyu + `--color-line` renginde 1 px nokta ızgarası
 * (16 px aralık, radial-gradient; tema token'la döner). İçerik ortalanır;
 * `controls` sol üst köşeye oturur (sahne seçici, varyant menüsü) ve sahne
 * üstten ona yer açar. `size`: `sm` kısa (anahtar, buton), `md` varsayılan,
 * `lg` pencere/düzen denemesi. Sunucu bileşeni: JavaScript indirmez, içindeki
 * istemci bileşenleri kendi sınırını taşır.
 *
 * ERİŞİLEBİLİRLİK: `figure` + `figcaption`; künye sahnenin adıdır. Noktalı
 * zemin süs (CSS arka planı). "Devamı" `href` ile bağlantı, `onMore` ile
 * buton; adı `moreLabel` ("Devamı: Kayan Seçim" gibi bağlamlı ad verilebilir).
 *
 * Sakin Akış turu (kişisel portfolyo dili, Lab sekmesi); yalnız davranış,
 * kod alınmadı.
 *
 *   <DemoFrame title="Kayan seçim." description="Seçim yeni yerine kayar, sıçramaz." href="/lab/segmented">
 *     <SegmentedControl … />
 *   </DemoFrame>
 */

const CSS = `
.ui-demo-stage {
  background-color: var(--color-surface);
  background-image: radial-gradient(circle at 1px 1px, var(--color-line) 1px, transparent 0);
  background-size: 16px 16px;
  background-position: 8px 8px;
}`;

const SIZES = {
  sm: "min-h-48 p-6",
  md: "min-h-72 p-8",
  lg: "min-h-96 p-4 sm:p-5",
} as const;

type DemoFrameProps = {
  /** Künyenin kalın ilk cümlesi; nokta ile bitir ("Kayan seçim."). */
  title: ReactNode;
  /** Soluk devam cümlesi. */
  description?: ReactNode;
  /** Sahnedeki canlı bileşen. */
  children: ReactNode;
  /** Sol üst köşe yuvası: sahne seçici, varyant menüsü. */
  controls?: ReactNode;
  size?: keyof typeof SIZES;
  /** "Devamı" bağlantısı. */
  href?: string;
  /** "Devamı" butonu (href yoksa). */
  onMore?: () => void;
  moreLabel?: string;
  className?: string;
  stageClassName?: string;
};

export function DemoFrame({
  title,
  description,
  children,
  controls,
  size = "md",
  href,
  onMore,
  moreLabel = "Devamı",
  className,
  stageClassName,
}: DemoFrameProps) {
  const more =
    "mt-3 inline-flex min-h-8 items-center rounded-full px-3 text-small text-strong ring-1 ring-line transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-focus";
  return (
    <figure className={cn("m-0", className)}>
      <style href="ui-demo-frame" precedence="default">
        {CSS}
      </style>
      <div
        className={cn(
          "ui-demo-stage relative grid place-items-center overflow-hidden rounded-2xl ring-1 ring-line-soft",
          SIZES[size],
          controls && "pt-16",
          stageClassName,
        )}
      >
        {controls && <div className="absolute top-3 left-3 z-10">{controls}</div>}
        <div className="w-full min-w-0 [&>*]:mx-auto">{children}</div>
      </div>
      <figcaption className="mt-3 text-base leading-relaxed text-pretty text-muted">
        <span className="font-medium text-strong">{title}</span>
        {description && <> {description}</>}
      </figcaption>
      {href ? (
        <a href={href} className={more}>
          {moreLabel}
        </a>
      ) : onMore ? (
        <button type="button" onClick={onMore} className={more}>
          {moreLabel}
        </button>
      ) : null}
    </figure>
  );
}
