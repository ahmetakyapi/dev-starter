// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Bookmark, Star } from "lucide-react";
import { Children, useId, useState, type ElementType, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Teklif kartı: görselin tamamen kapladığı koyu yuvarlak kart. Üstte solda
 * cam künye hapı ("Otel"), sağda kaydet (yer imi) toggle'ı; altta koyu
 * örtünün üstünde başlık, meta çipleri (puan "4,8 (674 Yorum)", ülke),
 * fiyat satırı ("₺2.400'den / gece") ve tam genişlik açık hap eylem.
 * Konaklama, şehir, etkinlik, tur, şablon galerisi: seçimi görselin
 * yaptırdığı ve fiyatın karar verdirdiği vitrin.
 *
 * NE ZAMAN DEĞİL: karşılaştırmalı liste (fiyat ve özellik yan yana
 * okunacaksa tablo ya da `pricing-*`), görselsiz içerik (`category-card`),
 * ekran görüntüsü vitrini (`shot-card`). Kartın içine ikinci bağlantı koyma:
 * tek eylem alttaki hap, kaydet bir toggle.
 *
 * NASIL: görsel `media` yuvasından (img, `Wallpaper`, video) ya da
 * `image {src, alt}` ile gelir ve kartı kaplar. Alt yarıda örtü: üç kat
 * `--color-scrim` degradesi (iki temada da siyah tabanlı; `--color-strong`
 * koyu temada açık döneceği için kullanılmadı). Metin bu yüzden iki temada
 * da sabit açık: `text-on-brand`. Eylem hapı açık zemin (`bg-on-brand`),
 * metni `text-chart-ink` (iki temada sabit koyu mürekkep; açık hap koyu
 * temada da açık kaldığı için `text-strong` okunmaz olurdu). İnce
 * işaretçide üzerine gelince görsel hafifçe yakınlaşır (yalnız transform);
 * hareketi azaltan kullanıcıda yakınlaşma yok.
 *
 * ERİŞİLEBİLİRLİK: kart `article`, başlık düzeyi `headingLevel` (varsayılan
 * 3). Kaydet butonu `aria-pressed`, adı "Kaydet: Kıyı Evleri". Eylem hapının
 * adı başlıkla bağlamlı ("İncele, Kıyı Evleri"; ekte görünmez başlık).
 * Puan yıldızı süs; metin "4,8 (674 Yorum)" okunur. `image.alt` boş
 * verilebilir (başlık zaten kartın adı); bilgi taşıyan görselde doldur.
 *
 * `OfferRow`: kartları yatay kayan sıraya dizer; `EdgeBlur` ile sarılabilir,
 * ona bağımlı değildir.
 *
 * Manzara turundan (tanıtım sitesi konaklama kartları; yalnız davranış ve yapı).
 *
 *   <OfferCard
 *     media={<Wallpaper scene="lagoon" className="size-full" />}
 *     tag="Otel" title="Kıyı Evleri" rating={{ value: 4.8, reviews: 674 }} meta={["Türkiye"]}
 *     price="₺2.400'den" priceUnit="/ gece" action={{ label: "İncele", href: "/konaklama/kiyi-evleri" }}
 *   />
 */

const CSS = `
.ui-offer-shade {
  background:
    linear-gradient(to top, var(--color-scrim), transparent 55%),
    linear-gradient(to top, var(--color-scrim), transparent 75%),
    linear-gradient(to top, var(--color-scrim) 20%, transparent 95%);
}`;

type OfferAction = {
  label: string;
  /** Verilirse bağlantı; yoksa buton. */
  href?: string;
  onClick?: () => void;
};

type OfferCardProps = {
  title: string;
  /** Kartı kaplayan görsel: img, `Wallpaper`, video. `image`tan önce gelir. */
  media?: ReactNode;
  image?: { src: string; alt: string };
  /** Sol üst cam künye ("Otel"). */
  tag?: ReactNode;
  /** Puan; Türkçe biçimlenir: "4,8 (674 Yorum)". */
  rating?: { value: number; reviews?: number };
  /** Ek meta çipleri (ülke, mesafe, süre). */
  meta?: readonly ReactNode[];
  /** Büyük fiyat değeri ("₺2.400'den"). */
  price?: ReactNode;
  /** Soluk birim ("/ gece"). */
  priceUnit?: ReactNode;
  action?: OfferAction;
  /** Kaydet toggle'ı çizilsin mi (varsayılan evet). `saved` verilmezse kendi durumunu tutar. */
  saveable?: boolean;
  saved?: boolean;
  defaultSaved?: boolean;
  onSavedChange?: (saved: boolean) => void;
  saveLabel?: string;
  reviewsLabel?: string;
  headingLevel?: 2 | 3 | 4;
  className?: string;
};

const fmt = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtInt = new Intl.NumberFormat("tr-TR");

export function OfferCard({
  title,
  media,
  image,
  tag,
  rating,
  meta = [],
  price,
  priceUnit,
  action,
  saveable = true,
  saved,
  defaultSaved = false,
  onSavedChange,
  saveLabel = "Kaydet",
  reviewsLabel = "Yorum",
  headingLevel = 3,
  className,
}: OfferCardProps) {
  const H = `h${headingLevel}` as ElementType;
  const titleId = useId();
  const [own, setOwn] = useState(defaultSaved);
  const isSaved = saved ?? own;

  function toggleSaved() {
    const next = !isSaved;
    if (saved === undefined) setOwn(next);
    onSavedChange?.(next);
  }

  const pill =
    "inline-flex items-center gap-1 rounded-full bg-scrim px-2.5 py-1 text-small font-medium text-on-brand ring-1 ring-inset ring-on-brand/20 backdrop-blur-md [&_svg]:size-3.5";
  const actionClass =
    "mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-on-brand px-5 text-base font-semibold text-chart-ink transition-[opacity,translate] hover:opacity-90 active:translate-y-px";
  const actionContent = action ? (
    <>
      {action.label}
      <span className="sr-only">, {title}</span>
    </>
  ) : null;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "group/offer relative isolate flex aspect-[4/5] min-w-0 flex-col justify-between overflow-hidden rounded-xl bg-surface-sunken text-on-brand",
        className,
      )}
    >
      <style href="ui-offer-card" precedence="default">
        {CSS}
      </style>

      <div className="absolute inset-0 -z-10 transition-transform duration-700 motion-reduce:transition-none motion-safe:pointer-fine:group-hover/offer:scale-[1.04] [&>*]:size-full [&>img]:object-cover [&>video]:object-cover">
        {/* Sade <img> `picture` içinde (shot-card ile aynı): kit next/image'e bağlanmasın; projede next/image ile değiştirilebilir. */}
        {media ??
          (image ? (
            <picture className="contents">
              <img src={image.src} alt={image.alt} loading="lazy" decoding="async" className="size-full object-cover" />
            </picture>
          ) : null)}
      </div>
      <div aria-hidden className="ui-offer-shade pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-3/4" />

      <div className="flex items-start justify-between gap-2 p-3">
        {tag ? <span className={pill}>{tag}</span> : <span />}
        {saveable ? (
          <button
            type="button"
            aria-pressed={isSaved}
            aria-label={`${saveLabel}: ${title}`}
            title={saveLabel}
            onClick={toggleSaved}
            className="inline-grid size-11 shrink-0 place-items-center rounded-full bg-on-brand/15 text-on-brand ring-1 ring-inset ring-on-brand/20 backdrop-blur-md transition-[opacity,translate] hover:bg-on-brand/25 active:translate-y-px [&_svg]:size-[1.125rem]"
          >
            <Bookmark aria-hidden strokeWidth={1.75} className={cn(isSaved && "fill-current")} />
          </button>
        ) : null}
      </div>

      <div className="p-4 pt-10">
        <H id={titleId} className="text-title font-semibold tracking-tight [overflow-wrap:anywhere] text-on-brand">
          {title}
        </H>

        {rating || meta.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {rating ? (
              <li className={pill}>
                <Star aria-hidden className="fill-current" strokeWidth={0} />
                <span className="tabular-nums">
                  {fmt.format(rating.value)}
                  {rating.reviews !== undefined ? ` (${fmtInt.format(rating.reviews)} ${reviewsLabel})` : null}
                </span>
              </li>
            ) : null}
            {Children.toArray(meta).map((item, i) => (
              <li key={i} className={pill}>
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        {price ? (
          <p className="mt-3 flex items-baseline gap-1.5">
            <span className="text-title font-semibold tracking-tight tabular-nums text-on-brand">{price}</span>
            {priceUnit ? <span className="text-base text-on-brand/75">{priceUnit}</span> : null}
          </p>
        ) : null}

        {action ? (
          action.href ? (
            <a href={action.href} onClick={action.onClick} className={actionClass}>
              {actionContent}
            </a>
          ) : (
            <button type="button" onClick={action.onClick} className={actionClass}>
              {actionContent}
            </button>
          )
        ) : null}
      </div>
    </article>
  );
}

/**
 * Kartları yatay kayan sıraya dizer: snap, klavyeyle odaklanır, gizli
 * kaydırma çubuğu yok (sistem çubuğu kalır; gizlemek istersen `EdgeBlur
 * scrollable` kullan). `itemClassName` kart genişliği.
 */
export function OfferRow({
  children,
  label = "Teklifler",
  itemClassName = "w-[min(18rem,80vw)]",
  className,
}: {
  children: ReactNode;
  /** Bölgenin ekran okuyucu adı. */
  label?: string;
  itemClassName?: string;
  className?: string;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        "snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-xl outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus focus-visible:outline-solid",
        className,
      )}
    >
      <ul className="flex w-max gap-4 pb-1">
        {Children.toArray(children).map((child, i) => (
          <li key={i} className={cn("shrink-0 snap-start", itemClassName)}>
            {child}
          </li>
        ))}
      </ul>
    </div>
  );
}
