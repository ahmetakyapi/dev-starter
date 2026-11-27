import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import { buttonClass } from "@/components/ui/Button";
import { hero } from "@/lib/content";
import { HeroBoard } from "./HeroBoard";

/**
 * calm: Sakin Akış kahramanı (`~/dev-starter/knowledge/design-directions.md` → `sakin-akis`).
 *
 * TASARIM GEREKÇESİ. Hiyerarşi boyla değil TONLA: başlığın ilk satırı güçlü,
 * kalan satırlar soluk (`text-muted`); degrade, ışıma ve parçacık sahnesi yok.
 * Ortalı ve büyük ama sakin: tek koyu hap birincil eylem (`calm` buton), ikincil
 * çerçeveli hap, altında kısa künye satırı. Ürün GENİŞ bir gri kuyuda (`rounded-xl`,
 * kıl halka, gölge yok) gerçek bileşenlerle çizilmiş pano olarak durur
 * (`HeroBoard`, ÖRNEK veri künyeli); ekran görüntüsü yok.
 *
 * Başlık (LCP) ilk karede GÖRÜNÜR: satırlar maskenin içinde kayar (`.line-mask`,
 * app/landing.css), opaklık değişmez. Hareket azaltmada satır kayması, metin
 * solması ve panonun döngüsü kapanır (landing.css ve HeroBoard bunu zaten okur).
 * `hero.scene` bu düzende okunmaz: sahne panodan dikkati çalardı. Başlıkta
 * virgül yok, Title Case (`hero.title`).
 */
export function CalmHero() {
  const meta = [hero.eyebrow, hero.meta].filter(Boolean).join(" · ");
  return (
    <section id="ust" aria-label="Giriş" className="relative isolate overflow-clip">
      <div className="mx-auto grid max-w-4xl justify-items-center px-4 pt-14 text-center sm:px-6 sm:pt-20">
        <h1 className="text-display font-semibold text-balance text-strong sm:text-hero">
          {hero.title.map((line, index) => (
            <span key={line.text} className="line-mask">
              <span className={index === 0 ? "line-rise" : "line-rise text-muted"} style={{ "--line": index } as CSSProperties}>
                {line.text}
              </span>
            </span>
          ))}
        </h1>
        <p className="hero-fade mt-7 max-w-2xl text-lead text-body text-pretty">{hero.description}</p>
        <div className="hero-fade mt-9 flex flex-wrap items-center justify-center gap-3">
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
        {meta ? <p className="hero-fade mt-6 text-small text-muted">{meta}</p> : null}
      </div>
      <div className="hero-fade mx-auto mt-14 max-w-6xl px-4 sm:mt-20 sm:px-6">
        <div className="rounded-xl bg-surface p-3 ring-1 ring-line-soft ring-inset sm:p-6 lg:p-10">
          <HeroBoard board={hero.board} />
        </div>
      </div>
    </section>
  );
}
