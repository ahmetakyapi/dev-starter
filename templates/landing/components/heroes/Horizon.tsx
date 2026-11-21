import { HorizonScene } from "@/components/ui/horizon-scene";
import { Wallpaper } from "@/components/ui/wallpaper";
import { hero } from "@/lib/content";
import { HeroBoard } from "./HeroBoard";
import { HeroActions, HeroEyebrow, HeroTitle } from "./shared";

/**
 * horizon: ürünün canlı panosu arkada kısmen görünür, önüne manzara biner ve
 * aşağı doğru sayfa zeminine solar; ürün manzaradan doğuyormuş gibi durur.
 * Solma renk değil maske (`mask-image`): zemin hangi tema/palet ise o görünür.
 * Manzara "kağıt katmanları": güneş diski ve parlak bant yok, panonun metnini
 * yıkamaz; `.horizon-ground` (landing.css) sahnenin üst yarısını ayrıca açar
 * ve koyu temada parlaklığını kısar, pano verisi okunur kalır.
 *
 * Pano ve manzara süs katmanı (`aria-hidden`); bilgi başlıkta ve altındaki
 * bölümlerde. Başlık (LCP) ilk karede görünür (`HeroTitle`).
 */
export function HorizonHero() {
  return (
    <section id="ust" aria-label="Giriş" className="relative isolate">
      <HorizonScene
        frame={<HeroBoard board={hero.board} />}
        scene={
          <div className="horizon-ground size-full">
            <Wallpaper scene="paper" className="size-full" />
          </div>
        }
        peek="lg"
      >
        <HeroEyebrow>{hero.eyebrow}</HeroEyebrow>
        <HeroTitle lines={hero.title} className="text-display sm:text-hero" />
        <p className="mx-auto mt-6 max-w-xl text-lead text-soft">{hero.description}</p>
        <HeroActions primary={hero.primary} secondary={hero.secondary} className="mt-8 justify-center" />
      </HorizonScene>
    </section>
  );
}
