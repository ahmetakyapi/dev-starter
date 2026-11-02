import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { buttonClass } from "@/components/ui/Button";
import { faq } from "@/lib/content";
import { SectionHeading } from "./SectionHeading";

/*
 * SSS: yerel `<details>`. JavaScript yok, klavye ve ekran okuyucu desteği
 * tarayıcıdan, sayfa içi aramada (Ctrl+F) kapalı yanıt da bulunur.
 *
 * Sorular TEK gri kuyuda, aralarında kıl çizgi (her soru ayrı kart olsa
 * kart yığını olurdu). Açılan yanıt hafifçe belirir (`.faq-answer`,
 * app/landing.css); yükseklik canlandırılmaz. Solda başlığın altında
 * doğrudan soru sorma yolu: SSS bir çıkmaz sokak olmasın.
 */
export function Faq() {
  return (
    <section aria-labelledby="sss-baslik" id="sss" className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-28">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading id="sss-baslik" title={faq.title} description={faq.description} />
          <a href={faq.contact.href} className={buttonClass({ variant: "secondary", size: "md", className: "mt-6" })}>
            {faq.contact.label}
          </a>
        </div>
        <Reveal className="lg:col-span-7">
          <div className="divide-y divide-line rounded-2xl bg-surface px-5 sm:px-7">
            {faq.items.map((item) => (
              <details key={item.question} className="faq-item group">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-5 text-read font-semibold text-strong [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-overlay shadow-raised">
                    <ChevronDown aria-hidden className="size-4 text-muted transition-transform duration-300 group-open:rotate-180" />
                  </span>
                </summary>
                <p className="faq-answer -mt-1 max-w-xl pb-6 text-read text-soft">{item.answer}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
