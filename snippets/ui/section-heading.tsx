import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Bölüm başlığı: mono büyük harf künye + uzayan kesik çizgi, altında iki
 * tonlu başlık (ilk satır güçlü, ikinci satır soluk), isteğe bağlı yanda
 * kısa açıklama. Tanıtım sayfasının "nasıl çalışır", "neden biz",
 * "özellikler" bölümlerini aynı sesle açar.
 *
 * Referans turu 25 Kasım 2026: Synaps ("HOW IT WORKS ------", iki tonlu
 * "Start with / what you already have."), Finance ve Veridical ("Why you
 * should / choose us", sağda açıklama), Grain (iki satırlı sakin başlık).
 * Yalnız yapı; metin ve renk alınmadı.
 *
 * NEDEN İKİ SATIR: güçlü satır iddia, soluk satır bağlam. Okur önce güçlü
 * satırı okur; soluk satır cümleyi tamamlar ama göz çekmez. Başlıkta virgül
 * yok (design-directions temel kural 5); iki fikir iki satırdır.
 *
 * `eyebrow`: kesik çizgili künye. Sayfada en çok iki bölümde; her bölüme
 *   künye koymak hepsini sıradanlaştırır (taste-skill eyebrow tavanı).
 *   Türkçe büyük harf `toLocaleUpperCase("tr-TR")` ile (i → İ).
 * `layout`:
 *   - `stack` (varsayılan): künye, başlık, açıklama alt alta, sola yaslı.
 *   - `split`: başlık solda, açıklama sağda alta yaslı (geniş ekranda).
 *   - `center`: ortalı; künyenin kesik çizgisi iki yana uzar.
 * `size`: `section` (bölüm) ya da `hero` (sayfanın tek h1'i).
 *
 * Soluk satır metnin %55'i: yalnız büyük puntoda (≥ 24 px) okunur kalır.
 * Sunucu bileşeni; hareket yok (çağıran `Reveal` ile sarabilir).
 */

export interface SectionHeadingProps {
  title: ReactNode;
  /** İkinci, soluk satır. */
  soft?: ReactNode;
  eyebrow?: string;
  description?: ReactNode;
  layout?: "stack" | "split" | "center";
  size?: "section" | "hero";
  as?: "h1" | "h2" | "h3";
  id?: string;
  className?: string;
}

const SIZE = {
  section: "text-[clamp(2rem,4.2vw,3.5rem)] leading-[1.02] tracking-[-0.045em]",
  hero: "text-[clamp(2.75rem,7vw,6rem)] leading-[0.95] tracking-[-0.055em]",
} as const;

/** Künye. `index`: başında mono numara çipi ("01", "COD1"): bölümler sıralı bir anlatıysa.
 *  `upper={false}`: kart künyesinde düz yazı (numara çipi zaten işaret). */
export function Eyebrow({ children, line = "end", index, upper = true, className }: { children: string; line?: "end" | "both" | "none"; index?: string; upper?: boolean; className?: string }) {
  const rule = <span aria-hidden className="h-px min-w-8 flex-1 border-t border-dashed border-line-strong" />;
  return (
    <p className={cn("flex items-center gap-4 font-mono text-small tracking-[0.14em] text-muted", className)}>
      {line === "both" ? rule : null}
      {index ? <span className="shrink-0 rounded-md bg-surface-raised px-1.5 py-0.5 text-micro tracking-normal text-strong tabular-nums">{index}</span> : null}
      <span className="shrink-0">{upper ? children.toLocaleUpperCase("tr-TR") : children}</span>
      {line !== "none" ? rule : null}
    </p>
  );
}

export function SectionHeading({ title, soft, eyebrow, description, layout = "stack", size = "section", as: Tag = "h2", id, className }: SectionHeadingProps) {
  const center = layout === "center";
  const heading = (
    <Tag id={id} className={cn("font-display font-semibold text-balance text-strong", SIZE[size])}>
      <span className="block">{title}</span>
      {soft ? <span className="block text-[color-mix(in_srgb,currentColor_55%,transparent)]">{soft}</span> : null}
    </Tag>
  );
  const desc = description ? (
    <p className={cn("max-w-[44ch] text-lead text-pretty text-body", center && "mx-auto", layout === "split" && "lg:justify-self-end lg:text-right")}>{description}</p>
  ) : null;
  return (
    <header className={cn("grid gap-6", center && "justify-items-center text-center", className)}>
      {eyebrow ? <Eyebrow line={center ? "both" : "end"} className="w-full">{eyebrow}</Eyebrow> : null}
      {layout === "split" ? (
        <div className="grid items-end gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          {heading}
          {desc}
        </div>
      ) : (
        <>
          {heading}
          {desc}
        </>
      )}
    </header>
  );
}
