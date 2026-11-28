import { ArrowRight, BookOpen, MessageCircle, NotebookPen, Truck } from "lucide-react";
import type { ReactNode } from "react";
import { buttonClass } from "@/components/ui/Button";
import { FrameRails, RuledCell, RuledRow } from "@/components/ui/frame-rails";
import { Wallpaper } from "@/components/ui/wallpaper";
import { hero, heroScenes } from "@/lib/content";
import { HeroBoard } from "./HeroBoard";

/** Araç hücrelerinin ikonu (içerikte ikon tutulmaz: düz veri kalır). */
const TOOL_ICONS: Record<string, ReactNode> = {
  Defter: <BookOpen aria-hidden />,
  Kargoya: <Truck aria-hidden />,
  "Not Kutusu": <NotebookPen aria-hidden />,
  Sohbet: <MessageCircle aria-hidden />,
};

/**
 * framed: sayfa cetvel çizgileriyle çerçeveli (`FrameRails`), ilk ekran iki
 * hücreye bölünmüş: solda künye hapı + başlık + iki eylem, sağda sulu boya
 * vadide canlı pano (alt kenardan kırpılmış). Altında çizgili araç satırı
 * (`RuledRow`). Düzenli, mimari bir "ürün kataloğu" hissi; ürün ekranı
 * gösterilebiliyor ve sayfa sakin ama kurumsal görünmeli. Manzara turu.
 *
 * NEDEN BÖYLE: çizgiler bir ızgara vaat eder; altındaki bölümler aynı
 * genişliği (`max-w-7xl`) kullanırsa raylar sayfa boyunca kesintisiz iner.
 * Pano manzaranın İÇİNDE ve kırpık: ekran görüntüsü değil, sergilenen bir
 * nesne; kırpık alt kenar "devamı aşağıda" der. Telefonda hücreler alt alta,
 * pano paneli alçalır; çizgi dili korunur.
 *
 * Pano süs (`HeroBoard` kendi `aria-label`ını taşır, ÖRNEK veri künyeli).
 * Başlık (LCP) düz metin, ilk karede görünür.
 */
export function FramedHero() {
  const { badge, toolsLabel, tools, more } = heroScenes.framed;
  return (
    <section id="ust" aria-label="Giriş" className="relative isolate">
      <FrameRails top bottom marks width="max-w-7xl" className="mt-4 sm:mt-6">
        <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="flex flex-col justify-center px-5 py-12 sm:px-10 sm:py-16 lg:py-20">
            <p className="self-start rounded-md px-3 py-1 text-small text-primary-ink ring-1 ring-primary/30 ring-inset">{badge}</p>
            <h1 className="mt-6 text-display font-medium text-balance text-strong sm:text-hero">
              {hero.title.map((line) => (
                <span key={line.text} className="block">
                  {line.text}
                </span>
              ))}
            </h1>
            <p className="mt-6 max-w-md text-lead text-muted text-pretty">{hero.description}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href={hero.primary.href} className={buttonClass({ variant: "calm", size: "lg" })}>
                {hero.primary.label}
                <ArrowRight aria-hidden />
              </a>
              {hero.secondary ? (
                <a href={hero.secondary.href} className={buttonClass({ variant: "ghost", size: "lg", className: "rounded-full ring-1 ring-line ring-inset" })}>
                  {hero.secondary.label}
                </a>
              ) : null}
            </div>
          </div>
          <div className="relative isolate min-h-[26rem] overflow-hidden border-t border-line sm:min-h-[32rem] lg:min-h-[36rem] lg:border-t-0 lg:border-l">
            <Wallpaper scene="valley" className="scene-dim absolute inset-0 -z-10" />
            <div className="absolute inset-x-4 top-24 sm:inset-x-10 sm:top-32 lg:right-[-6rem] lg:left-12">
              <div className="rounded-xl bg-overlay/70 p-1.5 shadow-floating ring-1 ring-line-soft backdrop-blur-md ring-inset">
                <HeroBoard board={hero.board} />
              </div>
            </div>
          </div>
        </div>
      </FrameRails>
      <FrameRails bottom marks width="max-w-7xl">
        <RuledRow label={toolsLabel} edges="none">
          {tools.map((tool) => (
            <RuledCell key={tool} icon={TOOL_ICONS[tool]}>
              {tool}
            </RuledCell>
          ))}
          <RuledCell href={more.href}>{more.label}</RuledCell>
        </RuledRow>
      </FrameRails>
    </section>
  );
}
