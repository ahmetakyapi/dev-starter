import type { CSSProperties } from "react";
import { hero, type HeroLine } from "@/lib/content";
import { units } from "@/lib/text";
import { cn } from "@/lib/utils";
import { HeroBoard } from "./HeroBoard";
import { HeroActions } from "./shared";

/**
 * showcase (VARSAYILAN): büyük, sıkı başlık; altında ürünün CANLI panosu.
 *
 * Neden varsayılan: açılış sayfasının en ikna edici kanıtı ürünün kendisi.
 * Ekran görüntüsü yüklenip öylece durur, burada pano gerçek bileşen: çubuklar
 * dolar, sayı yuvarlanır, bir talep adım adım ilerler.
 *
 * Başlık (LCP) ilk karede GÖRÜNÜR: opaklık hiç değişmez, satırlar maskenin
 * içinde yarım satır aşağıdan kayar (`.line-mask`, app/landing.css). Satır
 * içi kırılma `units()` ile anlam öbeklerinden: birlik içindeki boşluk
 * bölünmez boşluk olur, son satırda tek kelime kalmaz. Metin DOM'da düz.
 *
 * Zemin sakin ve nötr: ışıma ya da parçacık sahnesi YOK; renk paneldeki
 * veriden gelir (board dili). `hero.scene` bu düzende okunmaz.
 */
const NBSP = " ";

function lineText(text: string): string {
  return units(text.split(" "), { keepLastPair: true, maxChars: 16 })
    .map((unit) => unit.join(NBSP))
    .join(" ");
}

function ShowcaseTitle({ lines }: { lines: readonly HeroLine[] }) {
  return (
    <h1 className="hero-display mx-auto max-w-5xl font-semibold">
      {lines.map((line, index) => (
        <span key={line.text} className="line-mask">
          {/* `.display-ink` HAREKET EDEN öğenin kendisinde (shared.tsx'teki not). */}
          <span className={cn("line-rise", line.ink && "display-ink")} style={{ "--line": index } as CSSProperties}>
            {lineText(line.text)}
          </span>
        </span>
      ))}
    </h1>
  );
}

export function ShowcaseHero() {
  return (
    <section id="ust" aria-label="Giriş" className="relative isolate">
      <div className="mx-auto max-w-6xl px-4 pt-10 text-center sm:px-6 sm:pt-16 lg:pt-20">
        {/* Künye sakin: sans, soluk, noktasız. Mono künye geliştirici
            aracı hissi verir; board dilinde başlık kendi sesini taşır. */}
        {hero.eyebrow ? <p className="mb-5 text-base font-medium text-muted">{hero.eyebrow}</p> : null}
        <ShowcaseTitle lines={hero.title} />
        <p className="hero-fade mx-auto mt-6 max-w-2xl text-lead text-soft sm:mt-7">{hero.description}</p>
        <HeroActions primary={hero.primary} secondary={hero.secondary} className="hero-fade mt-8 justify-center" />
        {hero.meta ? <p className="hero-fade mt-5 text-small text-muted">{hero.meta}</p> : null}
      </div>
      <div className="mx-auto mt-12 max-w-6xl px-4 pb-6 sm:mt-16 sm:px-6">
        <HeroBoard board={hero.board} />
      </div>
    </section>
  );
}
