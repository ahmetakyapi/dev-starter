import { Reveal, RevealItem } from "@/components/motion/Reveal";
import { testimonials, type Testimonial } from "@/lib/content";
import { SectionHeading } from "./SectionHeading";

/*
 * Görüşler: bir büyük alıntı, yanında iki küçük. Kart yok; alıntılar sayfa
 * zemininde, ayrım çizgi ve puntoyla. Avatar fotoğrafı yoksa baş harfler
 * düz bir yüzeyde (degrade ya da sahte yüz yok).
 */
function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toLocaleUpperCase("tr-TR");
}

function Person({ person }: { person: Testimonial }) {
  return (
    <figcaption className="mt-5 flex items-center gap-3">
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-raised text-small font-bold text-strong">
        {initials(person.name)}
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold text-strong">{person.name}</span>
        <span className="block text-small text-muted">{person.role}</span>
      </span>
    </figcaption>
  );
}

export function Testimonials() {
  const [featured, ...rest] = testimonials.items;
  return (
    <section aria-labelledby="gorusler-baslik" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <SectionHeading id="gorusler-baslik" title={testimonials.title} />
      <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
        {featured ? (
          <Reveal className="lg:col-span-7">
            <figure className="border-l-2 border-primary pl-6 sm:pl-8">
              <blockquote className="text-title font-semibold text-strong sm:text-heading">“{featured.quote}”</blockquote>
              <Person person={featured} />
            </figure>
          </Reveal>
        ) : null}
        <ul className="divide-y divide-line-soft lg:col-span-5">
          {rest.map((person, index) => (
            <RevealItem key={person.name} as="li" index={index + 1} className="py-6 first:pt-0 last:pb-0">
              <figure>
                <blockquote className="text-read text-body">“{person.quote}”</blockquote>
                <Person person={person} />
              </figure>
            </RevealItem>
          ))}
        </ul>
      </div>
    </section>
  );
}
