// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Hareketli renk zemini: dört yumuşak, bulanık leke kahramanın, kapanış
 * bölümünün ya da tanıtım kartının ARKASINDA çok yavaş süzülür. Sayfaya ışık
 * ve derinlik verir; içerik değil, zemindir. scrolltide.co'nun "Motion behind
 * everything" rafından öğrenildi (kod alınmadı): onlar WebGL shader'ı ve MP4
 * veriyor, biz aynı duyguyu CSS ile, paletin kendi renkleriyle kuruyoruz
 * (shader reddi: `knowledge/references.md` → secki.dev satırı).
 *
 * NE ZAMAN: kahraman ve kapanış eylemi (`FinalCta`), boş durumun arkası,
 * tanıtım kartının kapak alanı. Sayfa başına BİR tane.
 * NE ZAMAN DEĞİL: veri ekranı, form, tablo arkası (göz harekete kayar);
 * okunacak uzun metnin arkası; zaten fotoğraflı kahraman.
 *
 * RENK TEK AİLE (kimlik kuralı 5): `tone="primary"` paletin birincil
 * ailesinden (`--primary`, `--primary-hover`, `--primary-soft`), `neutral`
 * metin rengiyle zeminin karışımından. On palet × iki temada kendiliğinden
 * döner; gökkuşağı yok. Varsayılan `intensity="soft"`: lekeler zemin rengiyle
 * karışık (yarıya yakın), çünkü koyu temada birincil renk AÇIK, açık temada
 * KOYU; tam doygun lekenin üstünde `text-strong` iki temanın birinde mutlaka
 * düşer (Pusula kapanışında ölçüldü). `vivid` tam doygun.
 *
 * DOKU: `grain` ince film greni (SVG gürültüsü MASKE olarak, karışım modu
 * yok; `knowledge/patterns.md` → Film greni). `halftone` lekeleri eşit
 * aralıklı nokta ekranından gösterir: baskı dokusu, kâğıt zemin üstünde.
 * Gerçek yarım ton (nokta boyu parlaklıkla değişen) fotoğraf için
 * `halftone-image.tsx`.
 *
 * HAREKET: yalnız `transform` (bileşimci), 18-30 sn, ileri-geri; nedeni
 * "zemin canlı, sayfa açık" (guides/04 → Ortam). Görünümden çıkınca DURUR
 * (IntersectionObserver); hareketi azaltan kullanıcıda hiç oynamaz, son kare
 * değil başlangıç düzeni kalır. Sunucu ilk karede düzeni basar: JS gelmeden
 * de zemin doğru görünür.
 *
 * ERİŞİLEBİLİRLİK: katman `aria-hidden` ve `pointer-events: none`. Üstteki
 * metnin kontrastını lekenin EN YOĞUN yerinde ölç; yetmiyorsa `scrim`
 * içeriğin arkasına zemin renginde yumuşak bir örtü serer.
 * Küçük metin (`text-small`) `text-muted` değil `text-body`: soluk gri
 * lekenin üstünde AA'nın altına iner (Pusula kapanışında 3,4:1 ölçüldü).
 *
 *   <MeshGradient className="rounded-2xl px-6 py-24" texture="grain" scrim>
 *     <h2 className="text-display font-bold text-strong">Hemen Başla</h2>
 *   </MeshGradient>
 */

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const CSS = `
@keyframes ui-mesh-a { 0% { transform: translate3d(0,0,0) scale(1); } 100% { transform: translate3d(18%,12%,0) scale(1.18); } }
@keyframes ui-mesh-b { 0% { transform: translate3d(0,0,0) scale(1.1); } 100% { transform: translate3d(-16%,10%,0) scale(0.92); } }
@keyframes ui-mesh-c { 0% { transform: translate3d(0,0,0) scale(0.95); } 100% { transform: translate3d(12%,-14%,0) scale(1.15); } }
@keyframes ui-mesh-d { 0% { transform: translate3d(0,0,0) scale(1); } 100% { transform: translate3d(-12%,-10%,0) scale(1.1); } }
.ui-mesh { position: relative; isolation: isolate; overflow: hidden; background: var(--mesh-base); }
.ui-mesh-layer { position: absolute; inset: -15%; z-index: -2; pointer-events: none; }
.ui-mesh-blob { position: absolute; width: 62%; aspect-ratio: 1; border-radius: 9999px; filter: blur(var(--mesh-blur, 56px));
  animation: var(--mesh-anim) var(--mesh-dur) ease-in-out infinite alternate; }
.ui-mesh-blob:nth-child(1) { left: -8%; top: -12%; background: var(--mesh-1); --mesh-anim: ui-mesh-a; --mesh-dur: 22s; }
.ui-mesh-blob:nth-child(2) { right: -10%; top: 4%; background: var(--mesh-2); --mesh-anim: ui-mesh-b; --mesh-dur: 26s; }
.ui-mesh-blob:nth-child(3) { left: 18%; bottom: -22%; background: var(--mesh-3); --mesh-anim: ui-mesh-c; --mesh-dur: 30s; }
.ui-mesh-blob:nth-child(4) { right: 12%; bottom: -8%; width: 40%; background: var(--mesh-4); --mesh-anim: ui-mesh-d; --mesh-dur: 18s; }
.ui-mesh[data-paused] .ui-mesh-blob { animation-play-state: paused; }
.ui-mesh[data-tone="primary"] {
  --mesh-base: color-mix(in oklab, var(--primary) 10%, var(--page-bg));
  --mesh-1: color-mix(in oklab, var(--primary) 46%, var(--page-bg));
  --mesh-2: color-mix(in oklab, var(--primary-soft) 40%, var(--page-bg));
  --mesh-3: color-mix(in oklab, var(--primary-hover) 34%, var(--page-bg));
  --mesh-4: color-mix(in oklab, var(--primary) 18%, var(--page-bg)); }
.ui-mesh[data-tone="primary"][data-intensity="vivid"] {
  --mesh-base: color-mix(in oklab, var(--primary) 16%, var(--page-bg));
  --mesh-1: var(--primary); --mesh-2: var(--primary-soft); --mesh-3: var(--primary-hover);
  --mesh-4: color-mix(in oklab, var(--primary) 30%, var(--page-bg)); }
.ui-mesh[data-tone="neutral"] {
  --mesh-base: var(--surface);
  --mesh-1: color-mix(in oklab, var(--text-strong) 34%, var(--page-bg));
  --mesh-2: color-mix(in oklab, var(--text-strong) 10%, var(--page-bg));
  --mesh-3: color-mix(in oklab, var(--text-strong) 52%, var(--page-bg));
  --mesh-4: var(--page-bg); }
.ui-mesh[data-texture="halftone"] { background: var(--page-bg); }
.ui-mesh[data-texture="halftone"] .ui-mesh-layer {
  -webkit-mask: radial-gradient(circle, black 1.6px, transparent 2.1px) 0 0 / 7px 7px;
  mask: radial-gradient(circle, black 1.6px, transparent 2.1px) 0 0 / 7px 7px; --mesh-blur: 40px; }
.ui-mesh-grain { position: absolute; inset: 0; z-index: -1; pointer-events: none; background: var(--text-strong); opacity: 0.07;
  -webkit-mask: ${GRAIN} 0 0 / 160px 160px; mask: ${GRAIN} 0 0 / 160px 160px; }
.ui-mesh-scrim { position: absolute; inset: 0; z-index: -1; pointer-events: none;
  background: radial-gradient(ellipse 75% 70% at 50% 50%, color-mix(in oklab, var(--page-bg) 78%, transparent), transparent 82%); }
@media (prefers-reduced-motion: reduce) { .ui-mesh-blob { animation: none; } }`;

type MeshGradientProps = {
  children?: ReactNode;
  /** Renk ailesi: paletin birincil rengi ya da nötr (metin + zemin). */
  tone?: "primary" | "neutral";
  /**
   * `soft` (varsayılan): lekeler zeminle karışık, üstünde `text-strong` iki
   * temada okunur. `vivid`: tam doygun; yalnız büyük başlık ve ölçülmüş kontrastla.
   */
  intensity?: "soft" | "vivid";
  /** `grain` film greni, `halftone` nokta ekranı. */
  texture?: "none" | "grain" | "halftone";
  /** İçeriğin arkasına zemin renginde yumuşak örtü (kontrast yetmezse). */
  scrim?: boolean;
  /** Etiket; varsayılan `div`. Bölüm için `section`. */
  as?: "div" | "section" | "header" | "footer";
  className?: string;
};

export function MeshGradient({
  children,
  tone = "primary",
  intensity = "soft",
  texture = "none",
  scrim = false,
  as: Tag = "div",
  className,
}: MeshGradientProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "120px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      data-tone={tone}
      data-intensity={intensity}
      data-texture={texture}
      data-paused={visible ? undefined : ""}
      className={cn("ui-mesh", className)}
    >
      <style href="ui-mesh-gradient" precedence="default">
        {CSS}
      </style>
      <span aria-hidden className="ui-mesh-layer">
        <span className="ui-mesh-blob" />
        <span className="ui-mesh-blob" />
        <span className="ui-mesh-blob" />
        <span className="ui-mesh-blob" />
      </span>
      {texture === "grain" ? <span aria-hidden className="ui-mesh-grain" /> : null}
      {scrim ? <span aria-hidden className="ui-mesh-scrim" /> : null}
      {children}
    </Tag>
  );
}
