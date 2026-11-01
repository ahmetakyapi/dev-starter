import { AccessDemo } from "@/components/demos/AccessDemo";
import { DecisionsDemo } from "@/components/demos/DecisionsDemo";
import { DigestDemo } from "@/components/demos/DigestDemo";
import { InboxDemo } from "@/components/demos/InboxDemo";
import { RulesDemo } from "@/components/demos/RulesDemo";
import { RevealItem } from "@/components/motion/Reveal";
import { features, type FeatureDemo } from "@/lib/content";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

/*
 * Özellikler: vitrin bentosu ("board" dili).
 *
 * NEDEN İKON KARESİ YOK: her başlığın üstündeki ikon karesi şablon hissinin
 * en tanınır izi (rules/design-tokens.md → AI-Slop). Yerine her kartın
 * üstünde o özelliği OYNAYAN küçük canlı demo var: ürün kendini anlatır.
 *
 * Kart = gri kuyu (`bg-surface rounded-2xl`), demo parçaları içinde beyaz
 * karo; kart içinde kart yok. Başlık + tek cümle demonun ALTINDA: göz önce
 * ürünü görür, sonra adını okur (boardui vitrin sırası).
 *
 * Izgara: masaüstünde üstte geniş + dar, altta üç eşit; tablette iki sütun
 * (geniş kart tam satır), telefonda tek sütun. Demo sahnesi SABİT YÜKSEKLİK:
 * hikâye oynarken kart boyu ve sayfa kaymaz.
 *
 * Kartlar aynı anda oynamaz (guides/04 § 14 kural 5): başlangıçları okuma
 * sırasına göre kaydırılmış.
 */
const SPANS = ["sm:col-span-2", "", "", "", ""] as const;
const START_DELAYS = [0, 900, 500, 0, 1400] as const;

function Demo({ demo, delay }: { demo: FeatureDemo; delay: number }) {
  switch (demo.kind) {
    case "inbox":
      return <InboxDemo demo={demo} startDelay={delay} />;
    case "rules":
      return <RulesDemo demo={demo} startDelay={delay} />;
    case "digest":
      return <DigestDemo demo={demo} startDelay={delay} />;
    case "decisions":
      return <DecisionsDemo demo={demo} />;
    case "access":
      return <AccessDemo demo={demo} startDelay={delay} />;
  }
}

export function Features() {
  return (
    <section aria-labelledby="ozellikler-baslik" id="ozellikler" className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <SectionHeading id="ozellikler-baslik" title={features.title} description={features.description} />
      <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.items.map((feature, index) => (
          <RevealItem key={feature.title} as="li" index={index} className={cn("min-w-0", SPANS[index])}>
            <article className="flex h-full flex-col rounded-2xl bg-surface p-2">
              {/* Demo süs değil ama BİLGİ de değil: aynı bilgi başlık ve
                  cümlede. Ekran okuyucu hareketli listeyi duymasın. */}
              <div aria-hidden className="h-60 overflow-hidden rounded-xl p-3 sm:p-4">
                <Demo demo={feature.demo} delay={START_DELAYS[index] ?? 0} />
              </div>
              <div className="px-4 pt-3 pb-5 sm:px-5">
                <h3 className="text-title font-semibold tracking-[-0.015em]">{feature.title}</h3>
                <p className="mt-1.5 max-w-md text-base text-soft">{feature.body}</p>
              </div>
            </article>
          </RevealItem>
        ))}
      </ul>
    </section>
  );
}
