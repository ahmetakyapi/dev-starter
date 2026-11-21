import { Check } from "lucide-react";
import type { CSSProperties } from "react";
import { FloatCard, FloatCards } from "@/components/ui/float-cards";
import { ToneText } from "@/components/ui/tone-text";
import { hero, type HeroLine } from "@/lib/content";
import { units } from "@/lib/text";
import { HeroBoard } from "./HeroBoard";
import { HeroActions } from "./shared";

/**
 * showcase (VARSAYILAN): "tezgâh". Başlık sakin ve iki tonlu, altında ürünün
 * CANLI panosu; panonun iki kenarına, panodaki talebin adımlarından iki not asılı.
 *
 * TASARIM GEREKÇESİ. Okur, bir ekip aracını değerlendiren kişi; beş saniyede
 * iki şeyi görmeli: ne çözdüğü (başlık) ve bunun gerçek olduğu (çalışan pano).
 * Tek güçlü fikir "problem soluk, çözüm net": başlığın ink'siz satırları
 * soluk (`ToneText.Soft`), ink'li satır güçlü ve degrade; cümlenin anlamı
 * renk kontrastıyla okunur, ek süs yok. Pano tezgâh gibi durur: üst yarısı
 * görünür, alt kenarı sayfa zeminine solar; hero ilk ekranı aşmaz ve alttaki
 * bölüm sert bir çizgi olmadan devralır. Hareket tek dilde: başlık satırları
 * maskeden yükselir, pano yükselir, çubuklar dolar; notlar yavaş süzülür.
 *
 * Başlık (LCP) ilk karede GÖRÜNÜR: opaklık hiç değişmez, satırlar maskenin
 * içinde yarım satır aşağıdan kayar (`.line-mask`, app/landing.css). Satır
 * içi kırılma `units()` ile anlam öbeklerinden: birlik içindeki boşluk
 * bölünmez boşluk olur, son satırda tek kelime kalmaz. Metin DOM'da düz;
 * soluk kısım yalnızca renk farkıdır, ekran okuyucu tek cümle okur.
 *
 * Zemin sakin ve nötr: tepeden ışıma + kıl çizgi ızgarası (ikisi maskeyle
 * söner), parçacık sahnesi YOK; renk paneldeki veriden gelir (board dili).
 * `hero.scene` bu düzende okunmaz: sahne dikkati panodan çalardı.
 * Notlar `aria-hidden` süs ve `xl` altında gizli; verinin kendisi panoda
 * (notlar panonun metriklerini tekrarlamaz, yalnız talebin adımlarını anar).
 */
const NBSP = " ";

function lineText(text: string): string {
  return units(text.split(" "), { keepLastPair: true, maxChars: 16 })
    .map((unit) => unit.join(NBSP))
    .join(" ");
}

function ShowcaseTitle({ lines }: { lines: readonly HeroLine[] }) {
  // Soluk olan, ink'li (çözüm) satırdan ÖNCEKİ satırlar. Ink'li satır yoksa
  // hiçbir satır solmaz: başlığın tamamını silikleştirmek anlamı yok eder.
  const inkAt = lines.findIndex((line) => line.ink);
  return (
    <ToneText as="h1" className="showcase-title mx-auto max-w-4xl font-semibold">
      {lines.map((line, index) => {
        const style = { "--line": index } as CSSProperties;
        const soft = inkAt > 0 && index < inkAt;
        return (
          <span key={line.text} className="line-mask">
            {/* `.display-ink` HAREKET EDEN öğenin kendisinde (shared.tsx'teki not). */}
            {line.ink ? (
              <span className="line-rise display-ink" style={style}>
                {lineText(line.text)}
              </span>
            ) : (
              <span className="line-rise" style={style}>
                {soft ? <ToneText.Soft>{lineText(line.text)}</ToneText.Soft> : lineText(line.text)}
              </span>
            )}
          </span>
        );
      })}
    </ToneText>
  );
}

export function ShowcaseHero() {
  const { thread } = hero.board;
  const first = thread.steps[0];
  const last = thread.steps[thread.steps.length - 1];

  return (
    <section id="ust" aria-label="Giriş" className="relative isolate overflow-clip">
      <div aria-hidden className="showcase-backdrop" />
      <div className="mx-auto max-w-6xl px-4 pt-10 text-center sm:px-6 sm:pt-14 lg:pt-14">
        {/* Künye: hap, solda canlı nokta ("pano gerçek, çalışıyor"). Mono
            künye geliştirici aracı hissi verir; burada sakin sans. */}
        {hero.eyebrow ? (
          <p className="hero-fade mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-overlay px-3.5 py-1.5 text-small font-medium text-body shadow-raised">
            <span aria-hidden className="step-pulse size-1.5 rounded-full bg-primary" />
            {hero.eyebrow}
          </p>
        ) : null}
        <ShowcaseTitle lines={hero.title} />
        <p className="hero-fade mx-auto mt-6 max-w-xl text-lead text-soft sm:mt-7">{hero.description}</p>
        <HeroActions primary={hero.primary} secondary={hero.secondary} className="hero-fade mt-8 justify-center" />
        {hero.meta ? <p className="hero-fade mt-5 text-small text-muted">{hero.meta}</p> : null}
      </div>

      <FloatCards className="mt-8 pt-6 sm:mt-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="showcase-stage">
            <HeroBoard board={hero.board} />
          </div>
        </div>
        {/* Notlar panonun kenarına asılı: ikisi de panonun kendi verisi. */}
        {first ? (
          <FloatCard at={{ left: "calc(50% - 37rem)", top: "0.25rem" }} rotate={-1.5} depth={1} lift={6} duration={8} className="w-56 max-xl:hidden">
            <p className="flex items-center gap-2 text-small font-medium text-strong">
              <span className="size-2 rounded-full bg-primary" />
              {first.label}
            </p>
            <p className="mt-1 text-micro text-muted tabular-nums">
              {thread.title} · {first.time}
            </p>
          </FloatCard>
        ) : null}
        {last ? (
          <FloatCard at={{ right: "calc(50% - 40rem)", top: "2.75rem" }} rotate={1.5} depth={1} lift={8} duration={9} delay={3} className="w-48 max-xl:hidden">
            <p className="flex items-center gap-2 text-small font-medium text-strong">
              <span className="grid size-5 place-items-center rounded-full bg-success-wash text-success [&_svg]:size-3">
                <Check strokeWidth={3} />
              </span>
              {last.label}
            </p>
            <p className="mt-1 text-micro text-muted tabular-nums">
              {thread.title} · {last.time}
            </p>
          </FloatCard>
        ) : null}
      </FloatCards>
    </section>
  );
}
