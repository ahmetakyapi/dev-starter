import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { faq } from "@/lib/content";
import { SectionHeading } from "./SectionHeading";

/*
 * SSS: yerel `<details>`. JavaScript yok, klavye ve ekran okuyucu desteği
 * tarayıcıdan, sayfa içi aramada (Ctrl+F) kapalı yanıt da bulunur.
 */
export function Faq() {
  return (
    <section aria-labelledby="sss-baslik" id="sss" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-12">
        <SectionHeading id="sss-baslik" title={faq.title} className="lg:col-span-4" />
        <Reveal className="lg:col-span-8">
          <div className="divide-y divide-line border-y border-line">
            {faq.items.map((item) => (
              <details key={item.question} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-read font-semibold text-strong [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronDown aria-hidden className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <p className="pb-5 text-read text-soft">{item.answer}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
