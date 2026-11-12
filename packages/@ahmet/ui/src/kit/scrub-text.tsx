// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { useMotionValueEvent, useScroll } from "motion/react";
import { useRef, useState, type CSSProperties } from "react";
import { cn } from "../utils";

/**
 * Kaydırdıkça koyulaşan yazı: paragraf soluk başlar, okur aşağı indikçe
 * cümle cümle (`phrases`) tam renge döner; okunan yer kendiliğinden vurgulanır.
 * gethoy.app'in fiyat bölümünden öğrenildi (kod alınmadı): tablo yerine iki
 * cümle, "Hoy is free. Host up to 3 channels…", kaydırınca parça parça
 * koyulaşıyor. Az seçenekli fiyatı ve tek fikirli manifestoyu tablodan çok
 * daha sakin anlatır.
 *
 * NE ZAMAN: iki planlı fiyat ("Ücretsiz: üç kanal. Pro: sınırsız…"),
 * kapanıştan önceki manifesto, ürünün tek paragraflık özeti.
 * NE ZAMAN DEĞİL: karşılaştırılacak çok satırlı plan (`PricingPlans`
 * tablosu); uzun okuma metni; formun ya da veri ekranının içi.
 *
 * NASIL: bölümün görünüm boyunca ilerlemesi (`useScroll`, öğenin alt kenarı
 * ekranın %85'ine girdiğinden %40'ına çıktığına dek) parça sayısına bölünür;
 * durum yalnız yanan parça sayısı DEĞİŞİNCE güncellenir. Renk geçişi CSS,
 * parçanın sözcükleri `--i` ile sırayla (gethoy: 25 ms). Sabitlemek istersen
 * çağıran sarar: `<div className="h-[250svh]"><div className="sticky top-0 …">`.
 *
 * ERİŞİLEBİLİRLİK: metin GERÇEK metin, her an okunur ve seçilir; soluk hâli
 * `text-muted` (beyaz ve koyu zeminde AA). Renk yalnız süs; anlam taşımaz.
 * Hareketi azaltan kullanıcıda bütün metin baştan tam renkte.
 *
 *   <ScrubText
 *     as="p"
 *     className="text-display font-semibold"
 *     phrases={["Pusula ücretsiz.", "Üç kişiye kadar ekip.", "Pro ile sınırsız kanal,", "bir kez öde, yenileme yok."]}
 *   />
 */

type ScrubTextProps = {
  /** Sırayla yanacak parçalar; aralarına boşluk konur. */
  phrases: readonly string[];
  /** Baştan yanık gelen parça sayısı (ilk cümle başlık gibi hep koyu kalsın diye). */
  lead?: number;
  as?: "p" | "h2" | "h3" | "div";
  className?: string;
};

const CSS = `
.ui-scrub .ui-scrub-w { color: var(--text-muted); transition: color 0.4s var(--ease-brand); }
.ui-scrub [data-on] .ui-scrub-w { color: var(--text-strong); transition-duration: 0.28s; transition-delay: calc(var(--i) * 25ms); }
@media (prefers-reduced-motion: reduce) { .ui-scrub .ui-scrub-w { color: var(--text-strong); transition: none; } }`;

export function ScrubText({ phrases, lead = 0, as: Tag = "p", className }: ScrubTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [lit, setLit] = useState(lead);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["end 0.85", "end 0.4"] });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.max(lead, Math.min(phrases.length, Math.ceil(value * phrases.length)));
    if (next !== lit) setLit(next);
  });

  return (
    <Tag ref={ref as never} className={cn("ui-scrub", className)}>
      <style href="ui-scrub-text" precedence="default">
        {CSS}
      </style>
      {phrases.map((phrase, index) => (
        <span key={index} data-on={index < lit ? "" : undefined}>
          {phrase.split(" ").map((word, i) => (
            <span key={i} className="ui-scrub-w" style={{ "--i": i } as CSSProperties}>
              {word}{" "}
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}
