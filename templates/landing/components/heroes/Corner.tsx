import { CornerLabel } from "@/components/ui/corner-label";
import { Wallpaper } from "@/components/ui/wallpaper";
import { hero } from "@/lib/content";
import { HeroActions } from "./shared";

/**
 * corner: koyu tam ekran sahne (kutup ışığı), sol altta köşe ayraçlı etiket
 * ve dev başlık: editoryal, "kapak sayfası" gibi. Etiket sayfada tek:
 * `hero.eyebrow`. İçerik karanlık gölün üstünde durur, ışık perdesi üstte
 * kalır: başlıkla ufuk çizgisi çakışmaz, gökyüzü boş değil sahnenin kendisi.
 *
 * Zemin illüstrasyon ve temayla dönmez; yazı sabit açık, örtü `bg-scrim`
 * (kontrast iki temada aynı). Başlık (LCP) düz metin, ilk karede görünür.
 * İlk ekranı aşmaz: yükseklik `min(44rem, 100dvh)`.
 */
export function CornerHero() {
  return (
    <section id="ust" aria-label="Giriş" className="relative isolate overflow-hidden bg-strong">
      <Wallpaper scene="aurora" className="absolute inset-0 -z-10" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-scrim" />
      <div className="mx-auto flex min-h-[min(44rem,100dvh)] max-w-6xl flex-col justify-end px-4 pt-24 pb-12 sm:px-6 sm:pb-16">
        {hero.eyebrow ? <CornerLabel tone="media" className="self-start">{hero.eyebrow}</CornerLabel> : null}
        <h1 className="mt-6 max-w-4xl text-display font-semibold text-balance text-on-brand sm:text-hero">
          {hero.title.map((line) => line.text).join(" ")}
        </h1>
        <p className="mt-5 max-w-xl text-lead text-on-brand/85">{hero.description}</p>
        <HeroActions primary={hero.primary} secondary={hero.secondary} tone="media" className="mt-8" />
      </div>
    </section>
  );
}
