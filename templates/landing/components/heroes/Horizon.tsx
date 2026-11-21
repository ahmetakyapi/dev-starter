import { HorizonScene } from "@/components/ui/horizon-scene";
import { Wallpaper } from "@/components/ui/wallpaper";
import { hero } from "@/lib/content";
import { HeroBoard } from "./HeroBoard";
import { HeroActions, HeroEyebrow, HeroTitle } from "./shared";

/**
 * horizon: ürünün canlı panosu arkada kısmen görünür, önüne manzara biner ve
 * aşağı doğru sayfa zeminine solar; ürün manzaradan doğuyormuş gibi durur.
 * Solma renk değil maske (`mask-image`): zemin hangi tema/palet ise o görünür.
 *
 * Pano ve manzara süs katmanı (`aria-hidden`); bilgi başlıkta ve altındaki
 * bölümlerde. Başlık (LCP) ilk karede görünür (`HeroTitle`).
 */
export function HorizonHero() {
  return (
    <section id="ust" aria-label="Giriş" className="relative isolate">
      <HorizonScene
        frame={<HeroBoard board={hero.board} />}
        scene={<Wallpaper scene="dunes" className="size-full" />}
        peek="md"
      >
        <HeroEyebrow>{hero.eyebrow}</HeroEyebrow>
        <HeroTitle lines={hero.title} className="text-display sm:text-hero" />
        <p className="mx-auto mt-6 max-w-xl text-lead text-soft">{hero.description}</p>
        <HeroActions primary={hero.primary} secondary={hero.secondary} className="mt-8 justify-center" />
      </HorizonScene>
    </section>
  );
}
