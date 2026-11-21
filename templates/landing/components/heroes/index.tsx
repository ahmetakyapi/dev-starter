import type { HeroVariant } from "@/lib/content";
import { AtmosphereHero } from "./Atmosphere";
import { BentoHero } from "./Bento";
import { CornerHero } from "./Corner";
import { EditorialSplitHero } from "./EditorialSplit";
import { FloatingHero } from "./Floating";
import { HorizonHero } from "./Horizon";
import { LiveDataHero } from "./LiveData";
import { MinimalHero } from "./Minimal";
import { ProductFrameHero } from "./ProductFrame";
import { ScrollStageHero } from "./ScrollStage";
import { ShowcaseHero } from "./Showcase";
import { StatementHero } from "./Statement";

/**
 * Hero kataloğu. Seçim `lib/content.ts` → `hero.variant`, tek satır.
 *
 * Ne zaman hangisi:
 *  - showcase         VARSAYILAN. Ürünün arayüzü gösterilebiliyorsa: büyük sıkı başlık + altında canlı pano
 *                     (`HeroBoard`, gerçek bileşen). Panonun verisi `hero.board`, ÖRNEK veri künyeli.
 *  - editorial-split  Gösterecek gerçek bir ürün ekranı ya da fotoğraf varsa; varsayılan güvenli seçim.
 *  - statement        Mesajın kendisi yeterince güçlüyse (lansman, manifesto); görsel gerekmez.
 *  - product-frame    Ürünün arayüzü satışı yapıyorsa; geniş bir ekran görüntüsü şart.
 *  - live-data        Ürün ölçülebilir bir sonuç vaat ediyorsa ve sayıların gerçek kaynağı varsa.
 *  - bento            Tek cümleye sığmayan, eşit ağırlıkta 3-5 güçlü yön varsa (sayfada ikinci bir bento açma).
 *  - minimal          İçerik ağırlıklı sayfalar (belge, blog, değişiklik günlüğü); hero geri çekilmeli.
 *  - scroll-stage     Hikaye üç adımda anlatılabiliyorsa ve okuyucunun yavaşlaması isteniyorsa.
 *  - atmosphere       Marka havası ürün ekranından önde: tam genişlik görsel zemin, solan başlık (güven şeridi hemen altındaki Logos bölümünde).
 *  - floating         "Bu ürün çok şey yapıyor" duygusu: başlık çevresinde süzülen ürün kartları (telefonda yok).
 *  - horizon          Ürün panosu manzaradan doğar ve sayfa zeminine solar; ürün gösterilebiliyor ama ekran görüntüsü sıkıcıysa.
 *  - corner           Editoryal, koyu tam ekran sahne: köşe etiketi + sol altta dev başlık; mesaj kısa ve iddialıysa.
 *
 * Ortak kurallar `./shared.tsx` başında.
 */
const HEROES = {
  showcase: ShowcaseHero,
  "editorial-split": EditorialSplitHero,
  statement: StatementHero,
  "product-frame": ProductFrameHero,
  "live-data": LiveDataHero,
  bento: BentoHero,
  minimal: MinimalHero,
  "scroll-stage": ScrollStageHero,
  atmosphere: AtmosphereHero,
  floating: FloatingHero,
  horizon: HorizonHero,
  corner: CornerHero,
} as const satisfies Record<HeroVariant, () => React.JSX.Element>;

export function Hero({ variant }: { variant: HeroVariant }) {
  const Selected = HEROES[variant];
  return <Selected />;
}
