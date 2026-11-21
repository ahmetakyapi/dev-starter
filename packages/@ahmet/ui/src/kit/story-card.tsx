// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "../utils";

/**
 * Müşteri hikayesi karosu: logo + alıntı + kim söyledi, ya da tek bir büyük
 * sonuç rakamı. "En hızlı büyüyen markalar bizi kullanıyor" bölümünün
 * parçası; dört karo `StoryGrid`de 3/2 + 2/3 asimetrik oturur. Referans:
 * Socialscale müşteri bölümü (yalnız yapı; kod, metin, logo ve fotoğraf
 * alınmadı).
 *
 * `tone`:
 *  - `photo`  `background` yuvası (fotoğraf, video karesi, `Wallpaper`) tam
 *             kaplar, üstüne zeminden bağımsız koyu örtü biner: metin
 *             `text-on-brand`, AA örtü sayesinde, fotoğrafa bağlı değil.
 *  - `plain`  gri kuyu; logo solda üstte, ok butonu sağda üstte, alıntı
 *             ve kişi altta. En sakin karo, çoğunluk bu olmalı.
 *  - `stat`   `bg-cta` zemin (ya da `background`), büyük rakam + etiket;
 *             rakam alıntının sonucudur ve KAYNAKLI olmalı.
 *
 * VERİ DÜRÜSTLÜĞÜ (`guides/08`): alıntı, kişi adı, unvan ve rakam gerçek
 * olmalı ve kişinin onayı alınmış olmalı. Uydurma müşteri sözü, sahte
 * logo ya da "50x" gibi doğrulanamayan çarpan YAZILMAZ. Henüz gerçek
 * hikaye yoksa bölümü hiç koyma; geliştirme sırasında örnek veri
 * `sample` ile "ÖRNEK" künyeli gösterilir ve yayına çıkmadan kalkar.
 *
 * BAĞLANTI: `href` varsa karonun tamamı TEK bağlantıdır (`photo`/`stat`
 * tonunda "Tam hikâyeyi oku" hapı, `plain`de ok butonu; ikisi de karoyu
 * kaplar). Karo içinde ikinci bir bağlantı üretilmez. `href` yoksa
 * eylem hiç çizilmez.
 *
 * Anlamsal: `<article>` içinde `<figure>` + `<blockquote>` + `<figcaption>`; logo yuvası
 * çağıranda adlanır (görsel logoda `alt`, metin logoda yazının kendisi).
 *
 *   <StoryGrid>
 *     <StoryCard tone="photo" background={<Wallpaper scene="dunes" />} logo={<Logo />} quote="…" href="/hikayeler/a" />
 *     <StoryCard tone="plain" logo={<Logo />} quote="…" author={{ name: "…", role: "…" }} href="/hikayeler/b" />
 *   </StoryGrid>
 */

type Author = { name: string; role?: string; avatar?: ReactNode };

export type StoryCardProps = {
  tone?: "photo" | "plain" | "stat";
  logo?: ReactNode;
  quote: ReactNode;
  author?: Author;
  /** `stat` tonunda büyük rakam: `{ value: "2×", label: "Haftalık içerik" }`. */
  stat?: { value: ReactNode; label: ReactNode };
  /** `photo`/`stat` için zemin katmanı. `stat`ta yoksa `bg-cta`. */
  background?: ReactNode;
  href?: string;
  /** Bağlantının adı. */
  ctaLabel?: string;
  /** Geliştirme verisi: köşeye "ÖRNEK" künyesi. */
  sample?: boolean;
  className?: string;
};

export function StoryCard({
  tone = "plain",
  logo,
  quote,
  author,
  stat,
  background,
  href,
  ctaLabel = "Tam hikâyeyi oku",
  sample = false,
  className,
}: StoryCardProps) {
  const inverse = tone !== "plain";
  const stretch = "outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-line-focus";

  const cta = href ? (
    tone === "plain" ? (
      <a
        href={href}
        className={cn(stretch, "grid size-9 shrink-0 place-items-center rounded-full bg-overlay text-strong shadow-raised")}
      >
        <ArrowRight aria-hidden className="size-4" />
        <span className="sr-only">{ctaLabel}</span>
      </a>
    ) : (
      <a
        href={href}
        className={cn(stretch, "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-on-brand/15 px-4 py-2 text-small font-medium text-on-brand backdrop-blur-sm")}
      >
        {ctaLabel}
        <ArrowUpRight aria-hidden className="size-3.5" />
      </a>
    )
  ) : null;

  return (
    <article
      className={cn(
        "relative isolate flex h-full min-h-72 min-w-0 flex-col justify-between gap-8 overflow-hidden rounded-2xl p-6 sm:p-7",
        tone === "plain" ? "bg-surface edge-lit text-strong" : tone === "stat" && !background ? "bg-cta text-on-brand" : "bg-surface-solid text-on-brand",
        className,
      )}
    >
      {inverse && background ? (
        <div aria-hidden className="absolute inset-0 -z-20 [&>*]:size-full">
          {background}
        </div>
      ) : null}
      {tone === "photo" || (tone === "stat" && background) ? (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[color-mix(in_srgb,black_38%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,black_10%,transparent)_0%,color-mix(in_srgb,black_78%,transparent)_100%)]"
        />
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div className={cn("min-w-0 text-title font-medium", inverse ? "text-on-brand" : "text-strong")}>{logo}</div>
        {tone === "plain" ? cta : null}
        {sample ? (
          <span className={cn("rounded-full px-2 py-0.5 text-micro font-medium", inverse ? "bg-on-brand/20 text-on-brand backdrop-blur-sm" : "bg-warning-wash text-warning")}>ÖRNEK</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-5">
        {stat ? (
          <p className="text-display font-medium tabular-nums">
            {stat.value}
            <span className="mt-1 block text-base font-normal text-on-brand/75">{stat.label}</span>
          </p>
        ) : null}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <figure className="flex min-w-0 flex-col gap-4">
            <blockquote>
              <p className={cn("max-w-prose text-read", inverse ? "text-on-brand/90" : "text-body")}>“{quote}”</p>
            </blockquote>
            {author ? (
              <figcaption className="flex min-w-0 items-center gap-3">
                {author.avatar ? <span className="shrink-0 overflow-hidden rounded-md">{author.avatar}</span> : null}
                <span className="min-w-0">
                  <span className="block truncate text-base font-medium">{author.name}</span>
                  {author.role ? <span className={cn("block truncate text-small", inverse ? "text-on-brand/70" : "text-muted")}>{author.role}</span> : null}
                </span>
              </figcaption>
            ) : null}
          </figure>
          {tone !== "plain" ? cta : null}
        </div>
      </div>
    </article>
  );
}

/**
 * Dört karolu asimetrik ızgara: üst sıra 3fr / 2fr, alt sıra 2fr / 3fr.
 * Telefonda tek sütun, sırayla.
 */
export function StoryGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-4 md:grid-cols-5",
        "md:[&>*]:col-span-3 md:[&>:nth-child(4n+2)]:col-span-2 md:[&>:nth-child(4n+3)]:col-span-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
