import type { ElementType, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Özellik karosu: bir yeteneği başlık + tek cümle + altta kırpılan sahneyle
 * anlatır. "Derinlemesine yetenekler", "Performans için tasarlandı" gibi
 * bento bölümlerinin parçası; dört karo `BentoGrid`de 2/3 + 3/2 asimetrik
 * oturur. Referans: Socialscale, Respan ve Axon tanıtım bölümlerinin karo
 * dili (yalnız yapı ve oran; kod, metin ve görsel alınmadı).
 *
 * `tone`:
 *  - `light`  gri kuyu (`bg-surface`), metin koyu. Sayfa açıkken sakin karo.
 *  - `dark`   birincil renge çalan koyu yüzey; iki temada da koyu, metin
 *             `text-on-brand` (AA). Panoya ya da koda dayalı sahne için.
 *  - `brand`  `bg-cta` (marka degradesinin koyu yarısı, beyaz metin her
 *             noktada AA). Sayfada en çok bir ya da iki tane: vurgu karosu.
 *  - `sky`    metin karonun ALTINDA, sahne üstte açık gökyüzü degradesinde
 *             (birincil rengin beyazla karışımı). Üç sütunluk "özellikler"
 *             sırası için; karo zemini yok, yalnız sahne yuvarlak.
 *
 * `media` sahne yuvası. `mediaAlign="bottom-bleed"` (varsayılan): sahne
 * alt kenara taşar, karo onu kırpar; yarım görünen pano "devamı var"
 * hissi verir. `center`: sahne ortalanır, kırpılmaz. Sahne süstür, anlam
 * metinde; bu yüzden `aria-hidden` (içinde gerçek bağlantı olacaksa
 * `mediaHidden={false}`).
 *
 * `href`: karonun tamamı tek bağlantı olur (başlık bağlantısı kartı
 * kaplar; iç içe ikinci bağlantı üretmez). Gerilme `article`a göre: `copy`
 * ile aralarında `relative` bir ata YOKTUR (oku bu yüzden başlıkla aynı
 * satıra koyduk). Düz `<a>`: `render` yok, kit `next/*`e bağlanmaz;
 * `next/link` isteyen proje dosyayı kendi bağlantısıyla uyarlar.
 *
 * `headingLevel`: başlığın düzeyi (varsayılan 3; sayfada bölüm başlığı `h2`).
 *
 * `GlassFrame`: sahnenin içindeki cam çerçeveli kart. Dışta yarı saydam
 * halka, içte beyaz yüzey: "arayüz parçası bu zeminin üstünde duruyor".
 * Gölge ve halka token'dan; koyu temada yüzey `bg-overlay`.
 *
 * Degrade kuralı (`rules/design-tokens.md`): zeminler birincil rengin
 * `color-mix` türevi, elle degrade yok; `sky` ve `dark` için düz renk
 * yedeği ilk bildirimdir, degrade desteklenmeyen yerde de metin okunur.
 * `dark` birincil rengi `black` ile karıştırır: BİLİNÇLİ istisna, bu karo
 * temadan bağımsız her zaman koyu kalmalı (ham siyah sınıfı değil, kuralın
 * yasakladığı şey temayla dönmeyen yüzey; burada istenen tam bu).
 *
 *   <BentoGrid>
 *     <FeatureTile tone="brand" title="Otomatik İş Akışları" description="…" media={<GlassFrame>…</GlassFrame>} />
 *     <FeatureTile tone="dark" title="Panel" description="…" />
 *   </BentoGrid>
 */

type Tone = "light" | "dark" | "brand" | "sky";

const SURFACE: Record<Exclude<Tone, "sky">, string> = {
  light: "bg-surface edge-lit text-strong",
  // Düz renk yedeği önce, degrade üstüne: desteksiz yerde de koyu zemin.
  "dark": "bg-[color-mix(in_srgb,var(--primary)_10%,black)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_16%,black),color-mix(in_srgb,var(--primary)_6%,black))] text-on-brand",
  brand: "bg-cta text-on-brand",
};

const SKY_STAGE =
  "bg-[color-mix(in_srgb,var(--primary)_35%,var(--overlay))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_62%,var(--overlay))_0%,color-mix(in_srgb,var(--primary)_14%,var(--overlay))_100%)]";

export type FeatureTileProps = {
  tone?: Tone;
  title: ReactNode;
  description?: ReactNode;
  /** Sahne yuvası (genellikle `GlassFrame`). */
  media?: ReactNode;
  mediaAlign?: "bottom-bleed" | "center";
  /** Sahnenin yüksekliği: Tailwind sınıfı. Varsayılan `h-56`. */
  mediaHeight?: string;
  /** Sahne içinde bağlantı/buton varsa `false` (`true` iken sahne `inert`: odak girmez). */
  mediaHidden?: boolean;
  /** Başlık düzeyi, 2-4. Varsayılan 3. */
  headingLevel?: 2 | 3 | 4;
  /** Karonun tamamını tek bağlantı yapar. */
  href?: string;
  /** Bağlantının ekran okuyucu eki: "Daha fazla bilgi". */
  hrefLabel?: string;
  className?: string;
};

export function FeatureTile({
  tone = "light",
  title,
  description,
  media,
  mediaAlign = "bottom-bleed",
  mediaHeight = "h-56",
  mediaHidden = true,
  headingLevel = 3,
  href,
  hrefLabel = "Ayrıntılar",
  className,
}: FeatureTileProps) {
  const inverse = tone === "dark" || tone === "brand";
  const H = `h${headingLevel}` as ElementType;
  const heading = href ? (
    <a href={href} className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-line-focus">
      {title}
      <span className="sr-only"> ({hrefLabel})</span>
      <ArrowUpRight aria-hidden className={cn("ml-1.5 inline-block size-4 align-[-0.1em]", inverse ? "text-on-brand/70" : "text-muted")} />
    </a>
  ) : (
    title
  );

  const copy = (
    <div className={tone === "sky" ? "pt-5" : "px-6 pt-6 sm:px-7 sm:pt-7"}>
      <H className={cn("text-title font-medium", inverse ? "text-on-brand" : "text-strong")}>{heading}</H>
      {description ? (
        <p className={cn("mt-2 max-w-md text-base", inverse ? "text-on-brand/75" : tone === "sky" ? "text-muted" : "text-body")}>{description}</p>
      ) : null}
    </div>
  );

  const stage = media ? (
    <div
      aria-hidden={mediaHidden || undefined}
      inert={mediaHidden || undefined}
      className={cn(
        "relative min-h-0",
        tone === "sky" ? cn("order-first overflow-hidden rounded-2xl", SKY_STAGE) : "mt-auto pt-8",
        tone === "sky" ? mediaHeight : null,
        mediaAlign === "center" ? "flex items-center justify-center p-6" : "px-6 sm:px-7",
        tone !== "sky" && mediaAlign === "bottom-bleed" ? cn(mediaHeight, "overflow-hidden") : null,
      )}
    >
      {mediaAlign === "bottom-bleed" && tone === "sky" ? <div className="absolute inset-x-6 top-8 bottom-0">{media}</div> : media}
    </div>
  ) : null;

  return (
    <article
      className={cn(
        "relative flex h-full min-w-0 flex-col",
        tone === "sky" ? "gap-0" : cn("overflow-hidden rounded-2xl", SURFACE[tone]),
        className,
      )}
    >
      {copy}
      {stage}
    </article>
  );
}

/** Sahnenin içindeki cam çerçeveli kart: dışta halka, içte yüzey. */
export function GlassFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-on-brand/20 p-1.5 ring-1 ring-on-brand/35 backdrop-blur-sm", className)}>
      <div className="h-full rounded-xl bg-overlay p-4 text-strong shadow-raised">{children}</div>
    </div>
  );
}

/**
 * Dört karolu asimetrik ızgara: üst sıra 2fr / 3fr, alt sıra 3fr / 2fr.
 * Telefonda tek sütun, sırayla. Dörtten fazla karo aynı ritmi sürdürür.
 */
export function BentoGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-4 md:grid-cols-5",
        "md:[&>*]:col-span-2 md:[&>:nth-child(4n+2)]:col-span-3 md:[&>:nth-child(4n+3)]:col-span-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
