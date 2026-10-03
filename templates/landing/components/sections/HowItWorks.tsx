import { RevealItem } from "@/components/motion/Reveal";
import { steps } from "@/lib/content";
import { SectionHeading } from "./SectionHeading";

/*
 * Nasıl çalışır: solda yapışkan başlık, sağda adımlar ve aralarından geçen
 * dikey çizgi. Çizgi kaydırdıkça dolar (CSS `animation-timeline: view()`,
 * app/landing.css → `.steps-rail`); desteklemeyen tarayıcıda dolu durur.
 * Telefonda başlık üstte, yapışkanlık yok.
 */
export function HowItWorks() {
  return (
    <section aria-labelledby="nasil-baslik" id="nasil" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <div className="grid gap-12 lg:grid-cols-12">
        <SectionHeading
          id="nasil-baslik"
          title={steps.title}
          description={steps.description}
          className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start"
        />
        <ol className="relative lg:col-span-6 lg:col-start-7">
          <span aria-hidden className="absolute top-2 bottom-2 left-[0.6875rem] w-px bg-line" />
          <span aria-hidden className="steps-rail absolute top-2 bottom-2 left-[0.6875rem] w-px bg-primary" />
          {steps.items.map((step, index) => (
            <RevealItem key={step.title} as="li" index={index} className="relative grid grid-cols-[1.5rem_1fr] gap-5 pb-12 last:pb-0">
              <span aria-hidden className="mt-1 grid size-6 place-items-center rounded-full border border-line-strong bg-page">
                <span className="size-2 rounded-full bg-primary" />
              </span>
              <div className="min-w-0">
                <h3 className="text-title font-semibold">{step.title}</h3>
                <p className="mt-2 text-read text-soft">{step.body}</p>
              </div>
            </RevealItem>
          ))}
        </ol>
      </div>
    </section>
  );
}
