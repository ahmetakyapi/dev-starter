"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Kaydırmaya bağlı ürün filmi: sahne ekranda SABİT kalır (sticky), okur
 * kaydırdıkça sahneler sırayla değişir ve altta her sahnenin tek cümlelik
 * başlığı sözcük sözcük buğudan netleşir. gethoy.app'in ana sayfasından
 * öğrenildi (kod alınmadı): orada bütün sayfa tek film; "Hold to talk.",
 * "Drop a file on a face." gibi beş cümle, her biri kendi sahnesiyle.
 *
 * NE ZAMAN: ürünün 3-6 temel eylemini sırayla göstermek (tanıtım sayfasının
 * "nasıl çalışır" bölümü); her sahne bir maket (`AppWindow`, `PhoneFrame`,
 * token'lı çizim), başlık tek kısa cümle.
 * NE ZAMAN DEĞİL: okunacak uzun içerik (kaydırmayı ele geçirmiş gibi
 * hissettirir); sahnede tıklanacak öğe olan demo (sahne `inert`; canlı demo
 * için normal bölüm); sayfa başına birden fazla.
 *
 * NASIL: dış kap `sahne sayısı × length` ekran boyu; içteki sahne `sticky`.
 * İlerleme `useScroll` ile okunur, durum yalnız SAHNE DEĞİŞİNCE güncellenir
 * (her karede değil). Geçişler CSS: sahne `opacity` + `transform` + buğu,
 * başlık sözcükleri `--i` gecikmesiyle sırayla (gethoy: 55 ms).
 *
 * ERİŞİLEBİLİRLİK: görsel sahne bütünüyle `aria-hidden`; bunun yerine
 * `narration` ZORUNLU: filmin baştan sona tek paragraflık anlatımı ("Kaydırınca
 * sayfa şunu gösterir: …"), ekran okuyucu onu okur (gethoy'un `sr` paragrafı).
 * Başlıklar ayrıca gizli bir listede. Hareketi azaltan kullanıcıda sabitleme
 * KALKAR: sahneler başlıklarıyla alt alta, durağan dizilir (yalnız CSS;
 * sunucu ve istemci aynı HTML'i basar). Telefonda da aynı film çalışır,
 * `svh` ile adres çubuğu boyu dalgalanmaz.
 *
 *   <ScrollScenes
 *     narration="Kaydırınca sayfa şunu gösterir: önce gelen kutusu, sonra…"
 *     scenes={[
 *       { id: "tut", caption: "Basılı tut, konuş.", content: <VoiceMock /> },
 *       { id: "birak", caption: "Dosyayı yüzün üstüne bırak.", content: <DropMock /> },
 *     ]}
 *   />
 */

export type Scene = { id: string; caption: string; content: ReactNode };

type ScrollScenesProps = {
  scenes: readonly Scene[];
  /** Filmin düz anlatımı; ekran okuyucu görsel yerine bunu okur. */
  narration: string;
  /** Sahne başına kaydırma boyu, ekran yüksekliği cinsinden (1 = bir ekran). */
  length?: number;
  /** Bölümün adı (gizli başlık). */
  label?: string;
  className?: string;
};

const CSS = `
.ui-scenes { position: relative; height: calc(100svh * (var(--scene-count) * var(--scene-length) + 1)); }
.ui-scenes-pin { position: sticky; top: 0; height: 100svh; overflow: clip; display: grid; grid-template-rows: 1fr auto; }
.ui-scenes-stage { position: relative; display: grid; place-items: center; }
.ui-scene { position: absolute; inset: 0; display: grid; place-items: center; padding: 1.5rem;
  transition: opacity 520ms var(--ease-brand), transform 620ms var(--ease-brand), filter 520ms var(--ease-brand); }
.ui-scene[data-state="before"] { opacity: 0; transform: translateY(-28px) scale(0.98); filter: blur(8px); }
.ui-scene[data-state="after"] { opacity: 0; transform: translateY(28px) scale(0.98); filter: blur(8px); }
.ui-scene-cap { display: block; min-height: 2lh; }
.ui-scene-cap .ui-w { display: inline-block; white-space: pre; opacity: 0; filter: blur(0.18em); translate: 0 0.12em;
  transition: opacity 0.55s var(--ease-brand), filter 0.55s var(--ease-brand), translate 0.55s var(--ease-brand); }
.ui-scene-cap[data-on] .ui-w { opacity: 1; filter: none; translate: 0 0; transition-delay: calc(var(--i) * 55ms); }
.ui-scenes-caps { display: grid; padding: 0 1rem clamp(1.5rem, 6vh, 4rem); text-align: center; }
.ui-scenes-caps > * { grid-area: 1 / 1; }
@media (prefers-reduced-motion: reduce) {
  .ui-scenes { height: auto; }
  .ui-scenes-pin { position: static; height: auto; display: block; overflow: visible; }
  .ui-scenes-stage, .ui-scenes-caps { display: none; }
  .ui-scenes-still { display: grid !important; }
}`;

export function ScrollScenes({ scenes, narration, length = 1, label = "Nasıl Çalışır", className }: ScrollScenesProps) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.min(scenes.length - 1, Math.max(0, Math.floor(value * scenes.length)));
    if (next !== active) setActive(next);
  });

  return (
    <section
      ref={ref}
      aria-label={label}
      style={{ "--scene-count": scenes.length, "--scene-length": length } as CSSProperties}
      className={cn("ui-scenes", className)}
    >
      <style href="ui-scroll-scenes" precedence="default">
        {CSS}
      </style>
      <p className="sr-only">{narration}</p>
      <ol className="sr-only">
        {scenes.map((scene) => (
          <li key={scene.id}>{scene.caption}</li>
        ))}
      </ol>

      <div aria-hidden className="ui-scenes-pin">
        <div className="ui-scenes-stage">
          {scenes.map((scene, index) => (
            <div
              key={scene.id}
              inert
              className="ui-scene"
              data-state={index === active ? "on" : index < active ? "before" : "after"}
            >
              {scene.content}
            </div>
          ))}
        </div>
        <div className="ui-scenes-caps">
          {scenes.map((scene, index) => (
            <p
              key={scene.id}
              data-on={index === active ? "" : undefined}
              className="ui-scene-cap font-display text-heading font-semibold text-balance text-strong sm:text-display"
            >
              {scene.caption.split(" ").map((word, i, words) => (
                <span key={i} className="ui-w" style={{ "--i": i } as CSSProperties}>
                  {i < words.length - 1 ? `${word} ` : word}
                </span>
              ))}
            </p>
          ))}
        </div>

        {/* Hareketi azaltan kullanıcı: sabitleme yok, sahneler başlıklarıyla alt alta. */}
        <div className="ui-scenes-still hidden gap-16 py-10">
          {scenes.map((scene) => (
            <figure key={scene.id} inert className="grid justify-items-center gap-6">
              {scene.content}
              <figcaption className="font-display text-heading font-semibold text-balance text-strong">{scene.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
