import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Kategori kartı: yardım merkezi, belge ya da kaynak kütüphanesinin
 * konu karoları. Renkli yumuşak ikon karosu, başlık, iki satır açıklama,
 * altta "12 makale →". MailPulse yardım merkezinden alındı (yapı).
 *
 * TEK BAĞLANTI: bağlantı başlığın üstünde, `after:absolute after:inset-0`
 * ile kartın tamamına gerilir; kart tıklanır, ekran okuyucu tek bağlantı
 * duyar ("Başlangıç, 12 makale"). Kartın içine ikinci bir bağlantı koyma.
 * Odak halkası kartın tamamında (`focus-within`).
 *
 * `tone`: ikon karosunun yumuşak zemini; DURUM tonları (primary, success,
 * warning, danger, neutral) ve grafik ailesi (`chart-1…6`). Ton süs: konuyu
 * başlık söyler. Grafik rengi METİN olamaz, ikon `text-strong`.
 *
 * Sunucu bileşeni; `href` alan her bağlantı bileşeni için `render` yok,
 * düz `<a>`; Next projesinde `next/link`e sarmak çağıranın işi.
 *
 *   <CategoryGrid><CategoryCard href="/yardim/baslangic" title="Başlangıç" description="…" meta="12 makale" icon={<Rocket />} tone="chart-3" /></CategoryGrid>
 */

const TONES = {
  neutral: "bg-surface-raised",
  primary: "bg-primary-wash text-primary-ink",
  success: "bg-success-wash text-success",
  warning: "bg-warning-wash text-warning",
  danger: "bg-danger-wash text-danger",
  "chart-1": "bg-chart-1/22 text-strong",
  "chart-2": "bg-chart-2/22 text-strong",
  "chart-3": "bg-chart-3/22 text-strong",
  "chart-4": "bg-chart-4/22 text-strong",
  "chart-5": "bg-chart-5/22 text-strong",
  "chart-6": "bg-chart-6/22 text-strong",
} as const;

export type CategoryTone = keyof typeof TONES;

export function CategoryCard({
  href,
  title,
  description,
  meta,
  icon,
  tone = "neutral",
  className,
}: {
  href: string;
  title: string;
  description: ReactNode;
  /** Altta okla birlikte: "12 makale". */
  meta: ReactNode;
  icon: ReactNode;
  tone?: CategoryTone;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group/cat relative flex min-w-0 gap-3.5 rounded-xl border border-line bg-overlay p-4 shadow-raised transition-colors hover:bg-surface",
        "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-line-focus focus-within:outline-solid",
        className,
      )}
    >
      <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-md [&_svg]:size-5", TONES[tone])}>
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-read font-semibold text-strong">
          <a href={href} className="outline-none after:absolute after:inset-0 after:rounded-xl">
            {title}
            <span className="sr-only">, {meta}</span>
          </a>
        </h3>
        <p className="text-small leading-relaxed text-muted">{description}</p>
        <p aria-hidden className="mt-auto flex items-center gap-1 pt-2 text-small text-body">
          {meta}
          <ArrowRight className="size-3.5 transition-transform group-hover/cat:translate-x-0.5 motion-reduce:transition-none" />
        </p>
      </div>
    </article>
  );
}

/** Üç sütun, tablette iki, telefonda bir. */
export function CategoryGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>{children}</div>;
}
