import { Reveal } from "@/components/motion/Reveal";
import { testimonials } from "@/lib/content";
import { SectionHeading } from "./SectionHeading";
import { TestimonialPicker } from "./TestimonialPicker";

/*
 * Görüşler: FERAH bölüm. Kart yok, kuyu yok: alıntı sayfa zemininde büyük
 * puntoyla, kişiler altta sekme. Yoğun bento (Özellikler) ve gri bant (Nasıl
 * Çalışır) arasında sayfanın sesini alçaltan yer. Avatar fotoğrafı yoksa
 * baş harfler pastel veri renginde (sahte yüz yok).
 */
export function Testimonials() {
  return (
    <section aria-labelledby="gorusler-baslik" className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <SectionHeading id="gorusler-baslik" title={testimonials.title} />
      <Reveal className="mt-12">
        <TestimonialPicker items={testimonials.items} label={testimonials.pick} />
      </Reveal>
    </section>
  );
}
