import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { FrameRails } from "@/components/ui/frame-rails";
import { QueryDemo } from "@/components/ui/query-demo";
import { Wallpaper } from "@/components/ui/wallpaper";
import { hero, heroScenes, SAMPLE_NOTE } from "@/lib/content";

/**
 * gallery: müze kapısı. Cetvel çizgili çerçevede (`FrameRails`) ortalı dev
 * SERİF başlık, iki yanda yarım tonla (nokta ızgarası) basılmış manzara
 * sütunları, altta bulut denizi; başlığın altında ürünün KENDİSİ denenir:
 * sorgu şeridi (`QueryDemo`, çip seç → istek satırı anında değişir →
 * Çalıştır → örnek sonuçlar). API, geliştirici aracı, veri ürünü: "nasıl
 * çağrılır" sorusu ilk ekranda cevaplanıyorsa. Manzara turu (2026-11-28).
 *
 * NEDEN BÖYLE: klasik bir afiş ciddiyeti (serif, simetri, çerçeve) ile
 * canlı bir geliştirici demosu yan yana; ikisi birbirini dengeler. Sanat
 * katmanları süs ve yarım ton maskesiyle SOLUK: başlık ve demo her zaman
 * önde (`.halftone-art`, landing.css: renk illüstrasyondan, desen maskeden,
 * görsel dosyası yok). Yan sütunlar `lg` altında yok (başlığın arkasına
 * düşerdi), bulut bandı telefonda da var ama alçak.
 *
 * Başlık (LCP) düz metin, ilk karede görünür; serif yüz yüklenmezse display
 * yüzüne düşer. Demo verisi ÖRNEK (`heroScenes.gallery.sample`).
 */
export function GalleryHero() {
  const g = heroScenes.gallery;
  return (
    <section id="ust" aria-label="Giriş" className="relative isolate overflow-clip">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[46%] min-h-60">
        <Wallpaper scene="clouds" className="halftone-art halftone-fade-b size-full" />
      </div>
      <div aria-hidden className="pointer-events-none absolute top-[14%] bottom-[18%] left-0 -z-10 hidden w-[24%] lg:block">
        <Wallpaper scene="summit" className="gallery-flank size-full" />
      </div>
      <div aria-hidden className="pointer-events-none absolute top-[14%] right-0 bottom-[18%] -z-10 hidden w-[24%] lg:block">
        <Wallpaper scene="sunset" className="gallery-flank gallery-flank-end size-full" />
      </div>

      <FrameRails top marks width="max-w-6xl">
        <div className="grid justify-items-center px-4 pt-16 pb-24 text-center sm:px-8 sm:pt-24 sm:pb-32">
          <h1 className="hero-serif hero-serif-xl max-w-5xl text-balance text-strong">
            {hero.title.map((line) => (
              <span key={line.text} className="block">
                {line.text}
              </span>
            ))}
          </h1>
          <p className="mt-7 max-w-2xl text-lead text-body text-pretty">{hero.description}</p>
          <a href={hero.primary.href} className={buttonClass({ variant: "calm", size: "lg", className: "mt-9 rounded-lg" })}>
            {hero.primary.label}
            <ArrowRight aria-hidden />
          </a>
          <QueryDemo
            className="mt-14 w-full max-w-4xl min-w-0 text-left"
            fields={g.input}
            presetsLabel={g.presetsLabel}
            presets={g.presets}
            request={g.request}
            results={g.results}
            runLabel={g.runLabel}
            sample={SAMPLE_NOTE}
          />
        </div>
      </FrameRails>
    </section>
  );
}
