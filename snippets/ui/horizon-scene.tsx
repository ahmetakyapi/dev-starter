import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Ufuk sahnesi: kahraman bölümünde ürün çerçevesi arkada kısmen görünür,
 * önüne manzara (görsel katman) biner ve aşağı doğru sayfa zeminine solar
 * (StatiQ ana sayfasının yapısı). Başlık ve eylem üstte, çocuk olarak.
 * Ürün "manzaranın içinden doğuyor" gibi durur; çerçevenin alt kenarı hiç
 * görünmez, sayfa bölümsüz akar.
 *
 * `frame`: ürün çerçevesi (ör. `AppWindow`). `scene`: manzara; `Wallpaper`
 * ya da çağıranın görseli (kendi içinde `aria-hidden` olmalı). `peek`:
 * çerçevenin ne kadarı görünsün (manzara o kadar kısalır). `fade`: manzaranın
 * alt solma uzunluğu.
 *
 * SOLMA RENK DEĞİL MASKE: manzara `mask-image` ile şeffaflaşır, arkasındaki
 * sayfa zemini ne ise (açık, koyu, palet) o görünür; sabit renge solmaz.
 * Üst kenar da yumuşar, manzara dikdörtgen gibi durmaz.
 *
 * Süs katmanları `aria-hidden`; telefonda sahne alçalır. Sunucu bileşeni.
 *
 *   <HorizonScene frame={<AppWindow …/>} scene={<Wallpaper scene="dunes" />}>
 *     <h1>Başlık</h1>
 *   </HorizonScene>
 */

export function HorizonScene({
  children,
  frame,
  scene,
  peek = "md",
  fade = "md",
  className,
}: {
  children: ReactNode;
  frame: ReactNode;
  scene: ReactNode;
  peek?: "sm" | "md" | "lg";
  fade?: "md" | "lg";
  className?: string;
}) {
  return (
    <section data-peek={peek} data-fade={fade} className={cn("ui-horizon relative isolate overflow-hidden", className)}>
      <style href="ui-horizon-scene" precedence="default">{`
.ui-horizon { --hz-stage: 24rem; --hz-scene: 13rem; --hz-fade: 55%; }
.ui-horizon[data-peek="sm"] { --hz-scene: 15rem; }
.ui-horizon[data-peek="lg"] { --hz-scene: 10rem; }
.ui-horizon[data-fade="lg"] { --hz-fade: 75%; }
@media (min-width: 48rem) {
  .ui-horizon { --hz-stage: 34rem; --hz-scene: 20rem; }
  .ui-horizon[data-peek="sm"] { --hz-scene: 23rem; }
  .ui-horizon[data-peek="lg"] { --hz-scene: 16rem; }
}
.ui-horizon-scene {
  height: var(--hz-scene);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 28%), linear-gradient(to bottom, black calc(100% - var(--hz-fade)), transparent);
  -webkit-mask-composite: source-in;
  mask-image: linear-gradient(to bottom, transparent, black 28%), linear-gradient(to bottom, black calc(100% - var(--hz-fade)), transparent);
  mask-composite: intersect;
}
`}</style>
      <div className="relative z-10 mx-auto max-w-3xl px-4 pt-12 text-center sm:px-6 sm:pt-16">{children}</div>
      <div className="relative mt-10 sm:mt-12" style={{ height: "var(--hz-stage)" }}>
        <div aria-hidden className="mx-auto max-w-5xl px-4 sm:px-6">
          {frame}
        </div>
        <div aria-hidden className="ui-horizon-scene pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden">
          {scene}
        </div>
      </div>
    </section>
  );
}
