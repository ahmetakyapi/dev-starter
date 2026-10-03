import type { HeroVariant } from "@/lib/content";
import { BentoHero } from "./Bento";
import { EditorialSplitHero } from "./EditorialSplit";
import { LiveDataHero } from "./LiveData";
import { MinimalHero } from "./Minimal";
import { ProductFrameHero } from "./ProductFrame";
import { ScrollStageHero } from "./ScrollStage";
import { StatementHero } from "./Statement";

/**
 * Hero kataloğu. Seçim `lib/content.ts` → `hero.variant`, tek satır.
 *
 * Ne zaman hangisi:
 *  - editorial-split  Gösterecek gerçek bir ürün ekranı ya da fotoğraf varsa; varsayılan güvenli seçim.
 *  - statement        Mesajın kendisi yeterince güçlüyse (lansman, manifesto); görsel gerekmez.
 *  - product-frame    Ürünün arayüzü satışı yapıyorsa; geniş bir ekran görüntüsü şart.
 *  - live-data        Ürün ölçülebilir bir sonuç vaat ediyorsa ve sayıların gerçek kaynağı varsa.
 *  - bento            Tek cümleye sığmayan, eşit ağırlıkta 3-5 güçlü yön varsa (sayfada ikinci bir bento açma).
 *  - minimal          İçerik ağırlıklı sayfalar (belge, blog, değişiklik günlüğü); hero geri çekilmeli.
 *  - scroll-stage     Hikâye üç adımda anlatılabiliyorsa ve okuyucunun yavaşlaması isteniyorsa.
 *
 * Ortak kurallar `./shared.tsx` başında.
 */
const HEROES = {
  "editorial-split": EditorialSplitHero,
  statement: StatementHero,
  "product-frame": ProductFrameHero,
  "live-data": LiveDataHero,
  bento: BentoHero,
  minimal: MinimalHero,
  "scroll-stage": ScrollStageHero,
} as const satisfies Record<HeroVariant, () => React.JSX.Element>;

export function Hero({ variant }: { variant: HeroVariant }) {
  const Selected = HEROES[variant];
  return <Selected />;
}
