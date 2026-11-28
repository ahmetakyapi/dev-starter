import type { HeroVariant } from "@/lib/content";
import { AtmosphereHero } from "./Atmosphere";
import { BentoHero } from "./Bento";
import { CalmHero } from "./Calm";
import { CornerHero } from "./Corner";
import { DevicesHero } from "./Devices";
import { EditorialSplitHero } from "./EditorialSplit";
import { FloatingHero } from "./Floating";
import { FlowHero } from "./Flow";
import { FramedHero } from "./Framed";
import { GalleryHero } from "./Gallery";
import { HorizonHero } from "./Horizon";
import { LiveDataHero } from "./LiveData";
import { MinimalHero } from "./Minimal";
import { ProductFrameHero } from "./ProductFrame";
import { PromptHero } from "./Prompt";
import { ScrollStageHero } from "./ScrollStage";
import { ShowcaseHero } from "./Showcase";
import { StatementHero } from "./Statement";
import { VistaHero } from "./Vista";

/**
 * Hero kataloğu. Seçim `lib/content.ts` → `hero.variant`, tek satır.
 *
 * Ne zaman hangisi:
 *  - showcase         VARSAYILAN. Ürünün arayüzü gösterilebiliyorsa: iki tonlu sakin başlık + altında alta solan canlı pano
 *                     (`HeroBoard`, gerçek bileşen; iki kenar notu). Panonun verisi `hero.board`, ÖRNEK veri künyeli.
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
 *  - calm             Sakin Akış yönü (`sakin-akis`): ortalı iki tonlu başlık (degrade yok), koyu hap eylem, geniş gri kuyuda
 *                     canlı pano. Kişi/ekip sayfası, kütüphane kapağı, sakin ürün; gösteriş istenmiyorsa.
 *
 * Manzara turu (2026-11-28, `sergi` yönünün ekleri): ürün bir manzaranın içinde sergilenir;
 * sahne verisi `lib/content.ts` → `heroScenes`. Sayfada en çok iki manzara zemini.
 *  - gallery          API / geliştirici aracı: serif dev başlık, iki yanda yarım ton sanat, çizgili çerçeve ve
 *                     ilk ekranda denenen sorgu şeridi (`query-demo`). "Nasıl çağrılır" ilk ekranda cevaplanıyorsa.
 *  - framed           Kurumsal ama sakin ürün kataloğu: cetvel çizgili ızgara, solda metin, sağda sulu boya vadide
 *                     kırpık pano, altında çizgili araç satırı (`frame-rails`).
 *  - prompt           Girdisi doğal dil olan ürün (planlayıcı, otomasyon kurucu, arama): niyet çubuğu + kenarları
 *                     buğulu hazır şablon kartları (`prompt-bar`, `edge-blur`, `offer-card`).
 *  - vista            Marka havası önde, mesaj iki cümle: tam ekran zirve manzarası, dev serif başlık, iki köşede
 *                     cam künye. Ürün aşağıdaki bölümlerde anlatılır.
 *  - flow             Ürün işi kendisi yapıyorsa (ajan, otomasyon): çayır panelinde bir talebin iş akışı izi
 *                     (`workflow-trace`, görününce dolar) + asistan kartı.
 *  - devices          Mobil yüz satışı yapıyorsa: koyu gece sahnesi, üç telefon (`device-frame`), parlak ikon
 *                     yayı (`gloss-tile`).
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
  calm: CalmHero,
  gallery: GalleryHero,
  framed: FramedHero,
  prompt: PromptHero,
  vista: VistaHero,
  flow: FlowHero,
  devices: DevicesHero,
} as const satisfies Record<HeroVariant, () => React.JSX.Element>;

export function Hero({ variant }: { variant: HeroVariant }) {
  const Selected = HEROES[variant];
  return <Selected />;
}
