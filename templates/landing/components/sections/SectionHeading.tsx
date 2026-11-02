import { Reveal } from "@/components/motion/Reveal";
import { Phrases } from "@/components/text/Phrases";
import { cn } from "@/lib/utils";

/**
 * Bölüm başlığı: h2 ve altında tek cümle, ÜST ÜSTE. Üst künye (eyebrow) yok;
 * sayfadaki tek künye hero'da. Başlık solda, açıklama sağda köşede duran
 * "bölünmüş başlık" düzeni de yok: bölümün tek mesajı var.
 *
 * Başlık büyük ve SIKI (`.section-title`, app/landing.css): board dilinde
 * hiyerarşiyi renk değil punto ve aralık kurar. Satırlar `Phrases` ile anlam
 * öbeklerinden kırılır ("Bir İşin / Başından Sonuna Kadar"), son satırda tek
 * kelime kalmaz.
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
      <h2 id={id} className="section-title font-semibold">
        <Phrases text={title} heading />
      </h2>
      {description ? <p className="mt-4 max-w-xl text-lead text-soft">{description}</p> : null}
    </Reveal>
  );
}
