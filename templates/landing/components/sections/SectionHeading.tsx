import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

/**
 * Bölüm başlığı: h2 ve altında tek cümle, ÜST ÜSTE. Üst künye (eyebrow) yok;
 * sayfadaki tek künye hero'da. Başlık solda, açıklama sağda köşede duran
 * "bölünmüş başlık" düzeni de yok: bölümün tek mesajı var.
 */
export function SectionHeading({
  id,
  title,
  description,
  className,
}: {
  id: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <Reveal className={cn("max-w-2xl", className)}>
      <h2 id={id} className="text-heading font-bold sm:text-display">
        {title}
      </h2>
      {description ? <p className="mt-4 text-lead text-soft">{description}</p> : null}
    </Reveal>
  );
}
