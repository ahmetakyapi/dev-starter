import { existsSync } from "node:fs";
import path from "node:path";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { Magnetic } from "@/components/motion/Magnetic";
import { RollingNumber } from "@/components/motion/RollingNumber";
import { SceneLayer } from "@/components/scene/SceneLayer";
import { buttonClass } from "@/components/ui/Button";
import type { HeroImage, HeroLine, HeroStat, Link } from "@/lib/content";
import { cn } from "@/lib/utils";

/*
 * Yedi hero düzeninin ortak parçaları. Kurallar her düzende aynı:
 *
 *  - LCP başlığı ilk karede GÖRÜNÜR: opaklıkla değil maske + transform ile
 *    açılır (`.line-mask`, app/landing.css). Reveal'e sarılmaz.
 *  - En fazla bir üst künye, en fazla iki eylem; birincisi `brand` (degrade
 *    disiplininin "ekranın tek birincil eylemi").
 *  - Hero yüksekliği ilk ekranı aşmaz; başlıkla eylem arasında kaydırma yok.
 */

/** Sayfanın tek h1'i: satır satır maskeli açılış. */
export function HeroTitle({
  lines,
  className,
  inkAll = false,
}: {
  lines: readonly HeroLine[];
  className?: string;
  /** statement düzeni: her satır mürekkep. */
  inkAll?: boolean;
}) {
  return (
    <h1 className={cn("font-bold", className)}>
      {lines.map((line, index) => (
        <span key={line.text} className="line-mask">
          {/* `.display-ink` HAREKET EDEN öğenin kendisinde: kapsayıcıya konup
              çocuğa transform verilseydi metin kırpma bölgesinden çıkıp kaybolurdu. */}
          <span
            className={cn("line-rise", (inkAll || line.ink) && "display-ink")}
            style={{ "--line": index } as CSSProperties}
          >
            {line.text}
          </span>
        </span>
      ))}
    </h1>
  );
}

export function HeroEyebrow({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="mb-5 font-mono text-small text-primary-ink">{children}</p>;
}

/** Birincil (brand, fareyle mıknatıslı) ve isteğe bağlı ikincil eylem. */
export function HeroActions({
  primary,
  secondary,
  className,
}: {
  primary: Link;
  secondary: Link | null;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Magnetic>
        <a href={primary.href} className={buttonClass({ variant: "brand", size: "lg" })}>
          {primary.label}
          <ArrowRight aria-hidden />
        </a>
      </Magnetic>
      {secondary ? (
        <a href={secondary.href} className={buttonClass({ variant: "ghost", size: "lg" })}>
          {secondary.label}
        </a>
      ) : null}
    </div>
  );
}

/**
 * Hero bölümünün kabı: kimlik (`#ust`), zemin ışıması ve isteğe bağlı
 * parçacık sahnesi. Sahne yalnızca ilk ekranın arkasında; uzun düzenlerde
 * (scroll-stage) aşağıya taşmaz.
 */
export function HeroShell({
  children,
  scene,
  className,
}: {
  children: ReactNode;
  scene: boolean;
  className?: string;
}) {
  return (
    <section id="ust" aria-label="Giriş" className={cn("relative isolate", className)}>
      {/* Zemin yapışkan başlığın da ALTINA uzanır (-4rem): başlık saydamken
          ışıma onun sınırında kesik bir çizgi bırakmasın. */}
      <div aria-hidden className="hero-backdrop pointer-events-none absolute inset-x-0 -top-16 -z-10 h-[calc(100dvh+4rem)] overflow-clip">
        <div className="hero-glow" />
        {scene ? <SceneLayer /> : null}
      </div>
      {children}
    </section>
  );
}

/**
 * Ürün görseli. Dosya `public/` altında yoksa DÜZ bir yüzey basılır:
 * "görsel buraya" yazan bir yer tutucu değil, sessiz bir alan. Gerçek
 * ekran görüntüsü eklenince kendiliğinden görünür.
 *
 * Görselin etrafında çerçeve yok: görsel kutunun kendisi (`overflow-hidden`
 * + köşe yarıçapı). Kenarlık yalnızca görsel OLMAYAN yer tutucuda.
 */
export function HeroMedia({
  image,
  className,
  sizes,
}: {
  image: HeroImage | null;
  className?: string;
  sizes: string;
}) {
  const exists = image ? existsSync(path.join(process.cwd(), "public", image.src)) : false;

  if (!image || !exists) {
    return <div aria-hidden className={cn("rounded-xl border border-line bg-surface-raised", className)} />;
  }

  return (
    <div className={cn("overflow-hidden rounded-xl", className)}>
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        // Ekranın en büyük görseli: tembel yüklenmesin.
        loading="eager"
        fetchPriority="high"
        className="size-full object-cover"
      />
    </div>
  );
}

/** Rakam şeridi: yüklemede yuvarlanır, sonra durur (JavaScript'siz). */
export function HeroStats({
  items,
  className,
  figureClassName = "text-display",
}: {
  items: readonly HeroStat[];
  className?: string;
  figureClassName?: string;
}) {
  return (
    <dl className={className}>
      {items.map((item, index) => (
        // Etiket bir satır da olsa iki satır da olsa rakamlar AYNI HATTA biter:
        // ızgara satırı hücreleri eşit boya gerer, rakam dibe yaslanır.
        <div key={item.label} className="flex min-w-0 flex-col">
          <dt className="text-small text-muted">{item.label}</dt>
          <dd className={cn("mt-auto pt-1 font-bold tracking-tight text-strong tabular-nums", figureClassName)}>
            <RollingNumber value={item.value} delayMs={index * 120} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** "1 Ekim 2026 İtibarıyla": sayının hangi güne ait olduğu, saat uydurmadan. */
export function asOfLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const formatted = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
  return `${formatted} İtibarıyla`;
}
