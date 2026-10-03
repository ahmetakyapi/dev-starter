import { RevealItem } from "@/components/motion/Reveal";
import { TiltCard } from "@/components/motion/TiltCard";
import { features, type Feature } from "@/lib/content";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

/*
 * Özellikler: beş hücreli bento. Masaüstünde üst satırda geniş + dar,
 * altta üç hücre; tablette iki sütun (geniş hücre tam satır), telefonda tek
 * sütun. Hücre sayısı içerikle aynı; boş hücre yok.
 *
 * Yüzeyler bilerek farklı: ilki vurgu yıkaması, ikincisi nokta dokusu,
 * kalanı düz yüzey. Hepsi ton farkıyla; degrade yok.
 */
const SPANS = ["sm:col-span-2", "", "", "", ""] as const;
const TONES = ["bg-primary-wash border border-line", "surface dot-grid", "surface", "surface", "surface"] as const;

function FeatureCard({ feature, big }: { feature: Feature; big: boolean }) {
  const Icon = feature.icon;
  return (
    <>
      <span className="grid size-11 place-items-center rounded-md bg-surface-raised text-primary-ink [&_svg]:size-5">
        <Icon aria-hidden />
      </span>
      <h3 className={cn("mt-6 font-semibold", big ? "text-heading" : "text-title")}>{feature.title}</h3>
      <p className={cn("mt-2 text-soft", big ? "max-w-md text-read" : "text-base")}>{feature.body}</p>
      {feature.tags ? (
        <ul className="mt-6 flex flex-wrap gap-2">
          {feature.tags.map((tag) => (
            <li key={tag} className="rounded-full border border-line bg-page px-3 py-1 text-small font-semibold text-strong">
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

export function Features() {
  return (
    <section aria-labelledby="ozellikler-baslik" id="ozellikler" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <SectionHeading id="ozellikler-baslik" title={features.title} description={features.description} />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.items.map((feature, index) => (
          <RevealItem key={feature.title} as="li" index={index} className={cn("min-w-0", SPANS[index])}>
            <TiltCard className={cn("h-full rounded-lg p-6 sm:p-7", TONES[index])}>
              <FeatureCard feature={feature} big={index === 0} />
            </TiltCard>
          </RevealItem>
        ))}
      </ul>
    </section>
  );
}
