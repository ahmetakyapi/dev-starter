"use client";

import { Play } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Çalışma kartı (portfolyo akışı): büyük yuvarlak gri kuyunun ortasında
 * bir sahne — görsel, sessiz döngü video ya da token'la çizilmiş gerçek
 * bileşen sahnesi — altında başlık, tek cümle açıklama ve künye (yıl,
 * rol). Sakin Akış turu (kişisel portfolyo dili); yalnız davranış, kod
 * alınmadı.
 *
 * NE ZAMAN: portfolyo / vaka akışı, "son işler" vitrini, sürüm notunda
 * ekran kaydı, tasarım sisteminin "canlı örnekler" sayfası.
 * NE ZAMAN DEĞİL: ürün içi liste satırı (`record-list`), ızgara karo
 * (`category-card`), tıklayınca yerinden büyüyen kart (`expandable-card`).
 *
 * MEDYA: `media={{ type: "image", src, alt }}` ya da
 * `media={{ type: "video", src, poster, label }}`. `children` verilirse
 * medya yerine o sahne çizilir (Storybook'taki gibi gerçek bileşenler).
 * Video sessiz + döngü + `playsInline`, YALNIZ görünümdeyken oynar
 * (IntersectionObserver, %35 eşik), dışına çıkınca durur: on kartlık akış
 * on videoyu birden çözmez. Hareketi azaltan kullanıcıda otomatik oynamaz;
 * poster durur, ortada "Oynat" butonu çıkar (sonra Duraklat). Medya
 * yüklenene kadar iskelet ışıltısı, gelince 400 ms'de solarak açılır.
 *
 * TIKLAMA: `onOpen` verilirse sahne bir butondur (adı başlıktan:
 * "Aç: Rezervasyon Bağlantıları"); büyütülmüş görünüm çağıranın
 * (`media-lightbox`). Eylem yuvası (`actions`: beğen, paylaş) sahnenin
 * dışında, künye satırının sağında; iç içe buton olmaz.
 *
 * ERİŞİLEBİLİRLİK: kart `article` + başlık (`titleAs`, varsayılan h2);
 * görselin `alt`ı zorunlu (süs ise ""), videonun `label`ı `aria-label`
 * olur. Oynat/Duraklat butonu yalnız video otomatik oynamadığında görünür.
 *
 *   <ShotCard title="Rezervasyon Bağlantıları" description="Üç süreli toplantı bağlantısı."
 *     meta={["2026", "Ürün tasarımı"]} onOpen={() => open(0)}>
 *     <BookingScene />
 *   </ShotCard>
 */

const CSS = `
@keyframes ui-shot-shimmer { from { background-position: 180% 0; } to { background-position: -80% 0; } }
.ui-shot-skel {
  background-color: var(--color-surface-sunken);
  background-image: linear-gradient(100deg, transparent 30%, color-mix(in oklab, var(--color-overlay) 70%, transparent) 50%, transparent 70%);
  background-size: 200% 100%;
  animation: ui-shot-shimmer 1.4s linear infinite;
}
.ui-shot-media { opacity: 0; transition: opacity 400ms var(--ease-brand); }
.ui-shot-media[data-ready] { opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  .ui-shot-skel { animation: none; }
  .ui-shot-media { transition: none; }
}`;

export type ShotMedia =
  | { type: "image"; src: string; alt: string; width?: number; height?: number }
  | { type: "video"; src: string; poster?: string; label: string };

type ShotCardProps = {
  title: string;
  description?: ReactNode;
  /** Künye: ["2026", "Ürün tasarımı"]; ortadaki noktayla birleşir. */
  meta?: readonly string[];
  media?: ShotMedia;
  /** Medya yerine çizilecek sahne (gerçek bileşenler). */
  children?: ReactNode;
  /** Sahnenin en-boy oranı; masonry'de kartın kendi oranı. Varsayılan 16 / 10. */
  ratio?: number;
  /** Sahneye tıklayınca (büyüt). Verilirse sahne buton olur. */
  onOpen?: () => void;
  actions?: ReactNode;
  titleAs?: "h2" | "h3" | "h4";
  className?: string;
};

const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useReducedMotionPref = () =>
  useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

function ShotVideo({ media }: { media: Extract<ShotMedia, { type: "video" }> }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotionPref();
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const userPlay = useRef(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && (!reduced || userPlay.current)) {
          video.play().catch(() => {});
        } else if (!entry.isIntersecting) {
          video.pause();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [reduced]);

  function toggle() {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      userPlay.current = true;
      video.play().catch(() => {});
    } else {
      userPlay.current = false;
      video.pause();
    }
  }

  return (
    <>
      {!ready && <span aria-hidden className="ui-shot-skel absolute inset-0" />}
      <video
        ref={ref}
        src={media.src || undefined}
        poster={media.poster || undefined}
        aria-label={media.label}
        muted
        loop
        playsInline
        preload="metadata"
        onLoadedData={() => setReady(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        data-ready={ready || undefined}
        className="ui-shot-media absolute inset-0 size-full object-cover"
      />
      {reduced && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          aria-label={playing ? "Duraklat" : "Oynat"}
          className="absolute top-1/2 left-1/2 grid size-11 -translate-1/2 place-items-center rounded-full bg-strong/70 text-page shadow-floating backdrop-blur"
        >
          {playing ? <span aria-hidden className="flex gap-1"><span className="h-3.5 w-1 rounded-sm bg-current" /><span className="h-3.5 w-1 rounded-sm bg-current" /></span> : <Play aria-hidden className="size-4 translate-x-px fill-current" />}
        </button>
      )}
    </>
  );
}

function ShotImage({ media }: { media: Extract<ShotMedia, { type: "image" }> }) {
  const [ready, setReady] = useState(false);
  return (
    <>
      {!ready && <span aria-hidden className="ui-shot-skel absolute inset-0" />}
      {/* Sade <img>: kit next/image'e bağlanmasın; projede next/image ile değiştirilebilir. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={media.src || undefined}
        alt={media.alt}
        width={media.width}
        height={media.height}
        loading="lazy"
        decoding="async"
        ref={(el) => {
          if (el?.complete && el.naturalWidth > 0) setReady(true);
        }}
        onLoad={() => setReady(true)}
        data-ready={ready || undefined}
        className="ui-shot-media absolute inset-0 size-full object-cover"
      />
    </>
  );
}

export function ShotCard({
  title,
  description,
  meta,
  media,
  children,
  ratio = 16 / 10,
  onOpen,
  actions,
  titleAs: Title = "h2",
  className,
}: ShotCardProps) {
  const stage = (
    <>
      {children ? (
        <div className="absolute inset-0 grid place-items-center overflow-hidden p-[6%]">{children}</div>
      ) : media?.type === "video" ? (
        <ShotVideo media={media} />
      ) : media?.type === "image" ? (
        <ShotImage media={media} />
      ) : null}
    </>
  );

  const stageClass =
    "relative block w-full overflow-hidden rounded-2xl bg-surface ring-1 ring-line-soft transition-[box-shadow] duration-300";

  return (
    <article className={cn("group/shot grid gap-3", className)}>
      <style href="ui-shot-card" precedence="default">
        {CSS}
      </style>
      {onOpen ? (
        <div className="relative">
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Aç: ${title}`}
            className={cn(stageClass, "cursor-zoom-in text-left hover:shadow-raised")}
            style={{ aspectRatio: ratio }}
          >
            {children ? <div className="pointer-events-none">{stage}</div> : media?.type === "video" ? null : stage}
          </button>
          {/* Video, buton içinde iç içe buton (Oynat) olmasın diye üst katmanda. */}
          {!children && media?.type === "video" && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl [&_button]:pointer-events-auto">{stage}</div>
          )}
        </div>
      ) : (
        <div className={stageClass} style={{ aspectRatio: ratio }}>
          {stage}
        </div>
      )}
      <div className="flex items-start justify-between gap-4 px-1">
        <div className="min-w-0">
          <Title className="text-body font-medium text-strong">{title}</Title>
          {description && <p className="mt-0.5 text-small text-muted text-pretty">{description}</p>}
          {meta && meta.length > 0 && (
            <p className="mt-1 text-micro text-soft">
              {meta.map((part, i) => (
                <span key={part}>
                  {i > 0 && <span aria-hidden> · </span>}
                  {part}
                </span>
              ))}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
    </article>
  );
}
