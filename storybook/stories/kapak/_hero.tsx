"use client";

import { ArrowRight, Bell, Check, FileText, Pause, Play, Search, Star } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { AvatarGroup } from "@/components/ui/avatar";
import { SlotText } from "@/components/ui/slot-text";
import { DUR, EASE, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { palettes } from "../../../packages/@ahmet/theme/tokens";
import uiPackage from "../../../packages/@ahmet/ui/package.json";
import { PALETTES } from "../../.storybook/palettes";

/**
 * Tanıtım kahramanı: FENER. Sahnede katalogdan on altı farklı, gerçek
 * bileşen durur; dinlenirken soluk ve renksiz (başlık tek odak), imlecin
 * fenerinin değdiği yerde renkleriyle belirir. Fener imleci yumuşak bir
 * gecikmeyle izler; imleç yoksa sahnede yavaşça kendi dolaşır.
 *
 * Seçim: 18 Kasım 2026, on yedi yön içinden (yelpaze, şerit, küre, dergi,
 * müze...). Sahibi Fener'i seçti, "mantık bu, çok daha iyi hali" dedi.
 * Ayrıntı: knowledge/decisions.md → "Tanıtım Kahramanı: Fener".
 *
 * Palet turu: on palet 3,6 sn'de bir bölümü yeniden boyar (rol değişkenleri
 * satır içi, katalog yerinde kalır); şeritte üstüne gelince önizler,
 * tıklayınca bütün kataloğa geçer; tur her an durur (WCAG 2.2.2).
 * Hareket azaltmada ve otomasyonda (OG görseli, play testleri) tur ve
 * gezinti kapalı, fener sabit bir köşede.
 */

type ThemeName = "light" | "dark";
type PaletteName = keyof typeof palettes;

const TOUR = PALETTES.map((p) => p.value as PaletteName);
const TITLE = Object.fromEntries(PALETTES.map((p) => [p.value, p.title])) as Record<PaletteName, string>;
const TOUR_MS = 3600;
const AUTOMATED = typeof navigator !== "undefined" && navigator.webdriver === true;
const to = (id: string) => `./?path=/story/${id}`;
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page";
const PRESS = "transition-[translate,scale,box-shadow,background-color] duration-200 active:scale-[0.98]";

function paletteVars(p: PaletteName, theme: ThemeName): CSSProperties {
  const v = palettes[p][theme];
  return {
    "--primary": v.primary,
    "--primary-hover": v.primaryHover,
    "--primary-soft": v.primarySoft,
    "--primary-wash": v.primaryWash,
    "--primary-ink": v.primaryInk,
    "--on-primary": v.onPrimary,
    "--line-focus": v.primary,
    "--app-glow": v.appGlow,
    "--display-gradient": v.displayGradient,
    "--display-gradient-tight": v.displayGradientTight,
    "--brand-gradient": v.brandGradient,
    "--cta-gradient": v.ctaGradient,
  } as CSSProperties;
}

const CSS = `
@layer base {
  .kf-tour, .kf-tour * { transition-property: color, background-color, border-color, fill, stroke, box-shadow; transition-duration: 600ms; transition-timing-function: cubic-bezier(.22,1,.36,1); }
}
/* Dinlenme: renksiz ve soluk; başlığın okunurluğunu bozmaz. */
.kf-rest { opacity: .22; filter: grayscale(1); }
.dark .kf-rest, [data-theme="dark"] .kf-rest { opacity: .18; }
.kf-tile { transition: translate .5s cubic-bezier(.22,1,.36,1); }`;

function usePaletteTour(palette: PaletteName, onPalette: (p: PaletteName) => void, still: boolean) {
  const [playing, setPlaying] = useState(!still);
  const [index, setIndex] = useState(() => Math.max(0, TOUR.indexOf(palette)));
  const [hover, setHover] = useState<PaletteName | null>(null);
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const running = playing && !hover && inView;
  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % TOUR.length), TOUR_MS);
    return () => window.clearTimeout(id);
  }, [running, index]);
  useEffect(() => {
    if (!playing) setIndex(Math.max(0, TOUR.indexOf(palette)));
  }, [palette, playing]);
  const shown: PaletteName = hover ?? (playing ? TOUR[index] : palette);
  return {
    ref,
    shown,
    playing,
    previewing: shown !== palette,
    togglePlay: () => setPlaying((v) => !v),
    preview: setHover,
    apply: (p: PaletteName) => {
      setPlaying(false);
      setHover(null);
      onPalette(p);
    },
  };
}

type Spot = { x: number; y: number; node: ReactNode };
const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("rounded-[1rem] bg-overlay p-3 shadow-raised ring-1 ring-inset ring-line-soft", className)}>{children}</div>
);

/* On altı parça, hiçbiri tekrar etmez. Konumlar sahnenin yüzdesi: sol bant 2-24, sağ bant 72-90;
   orta sütun (başlık) boş. */
const MOSAIC: Spot[] = [
  { x: 3, y: 9, node: <Card><div className="grid grid-cols-7 gap-1 text-center text-[0.6rem] text-muted">{["P", "S", "Ç", "P", "C", "C", "P"].map((d, i) => <span key={i}>{d}</span>)}{Array.from({ length: 21 }, (_, i) => <span key={`d${i}`} className={cn("grid size-5 place-items-center rounded-md", i === 9 ? "bg-primary text-on-primary" : "text-body")}>{i + 1}</span>)}</div></Card> },
  { x: 19, y: 6, node: <Card className="w-44"><div className="grid gap-2 text-left"><span className="text-small font-semibold text-strong">Fiyat listesini güncelle</span><span className="flex items-center justify-between"><span className="rounded-full bg-primary-wash px-2 py-0.5 text-micro font-semibold text-primary-ink">Satış</span><AvatarGroup size="sm" label="Atanan" people={[{ name: "Mert Aksoy" }]} /></span></div></Card> },
  { x: 2, y: 40, node: <Card><span className="flex items-center gap-2 text-small font-medium text-strong"><span className="grid size-6 place-items-center rounded-full bg-success-wash text-success"><Check className="size-3.5" strokeWidth={3} /></span>Değişiklik kaydedildi</span></Card> },
  { x: 13, y: 29, node: <Card className="w-40"><svg viewBox="0 0 160 60" className="h-14 w-full" aria-hidden><polyline fill="none" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="0,48 22,40 44,44 66,26 88,32 110,14 132,20 160,6" /></svg><span className="mt-1 block text-left text-micro text-muted">Son 7 gün · +%12</span></Card> },
  { x: 4, y: 62, node: <Card><span className="flex gap-1.5">{["bg-primary", "bg-primary-soft", "bg-primary-wash", "bg-success", "bg-warning"].map((c) => <span key={c} className={cn("size-7 rounded-lg", c)} />)}</span></Card> },
  { x: 9, y: 55, node: <Card className="w-44"><span className="grid gap-2 text-left"><span className="flex justify-between text-micro text-muted"><span>Ses</span><span>64</span></span><span className="relative h-1.5 rounded-full bg-surface"><span className="absolute inset-y-0 left-0 w-[64%] rounded-full bg-primary" /><span className="absolute top-1/2 left-[64%] size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-overlay shadow-raised ring-1 ring-line" /></span></span></Card> },
  { x: 8, y: 80, node: <Card><span className="flex gap-1 rounded-lg bg-surface p-1 text-small">{["Genel", "Ekip", "Fatura"].map((x, i) => <span key={x} className={cn("rounded-md px-2.5 py-1", i === 1 ? "bg-overlay font-semibold text-strong shadow-raised" : "text-muted")}>{x}</span>)}</span></Card> },
  { x: 76, y: 7, node: <Card><span className="flex items-center gap-3"><AvatarGroup size="sm" label="Ekip" people={[{ name: "Zeynep Kaya" }, { name: "Selin Arslan" }, { name: "Can Demir" }]} /><span className="text-left text-micro leading-tight text-muted"><b className="block text-small text-strong">3 kişi</b>şu an burada</span></span></Card> },
  { x: 86, y: 22, node: <Card><span className="flex items-center gap-2 text-small"><FileText className="size-4 text-primary" /><span className="text-strong">rapor.pdf</span><span className="text-muted">2,4 MB</span></span></Card> },
  { x: 77, y: 31, node: <Card className="w-44"><span className="flex items-center gap-2 rounded-lg bg-surface px-2.5 py-2 text-small text-muted ring-1 ring-inset ring-line"><Search className="size-4" />Bileşen ara</span></Card> },
  { x: 87, y: 42, node: <Card><span className="flex gap-0.5 text-warning">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={cn("size-4", i < 4 && "fill-current")} />)}</span></Card> },
  { x: 76, y: 50, node: <Card><span className="flex items-center gap-3"><svg viewBox="0 0 36 36" className="size-11 -rotate-90" aria-hidden><circle cx="18" cy="18" r="15" fill="none" className="stroke-surface" strokeWidth="4" /><circle cx="18" cy="18" r="15" fill="none" className="stroke-primary" strokeWidth="4" strokeDasharray="94" strokeDashoffset="28" strokeLinecap="round" /></svg><span className="text-left text-micro leading-tight text-muted"><b className="block text-small text-strong">%70</b>tamamlandı</span></span></Card> },
  { x: 88, y: 62, node: <Card><span className="flex flex-wrap gap-1.5">{["Kargo", "Fatura"].map((x) => <span key={x} className="rounded-full bg-primary-wash px-2.5 py-1 text-micro font-semibold text-primary-ink">{x}</span>)}</span></Card> },
  { x: 74, y: 67, node: <Card className="w-52"><pre className="text-left font-mono text-[0.65rem] leading-5 text-body"><span className="text-primary-ink">--primary</span>: <span className="text-strong">#0D74C4</span>;{"\n"}<span className="text-primary-ink">--radius</span>: <span className="text-strong">12px</span>;</pre></Card> },
  { x: 86, y: 80, node: <Card><span className="flex items-center gap-2 text-small"><span className="relative grid size-7 place-items-center rounded-full bg-primary-wash text-primary-ink"><Bell className="size-3.5" /><span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-danger" /></span><span className="text-strong">2 yeni talep</span></span></Card> },
  { x: 74, y: 84, node: <Card><span className="flex gap-1 text-small">{["‹", "1", "2", "3", "›"].map((x, i) => <span key={i} className={cn("grid size-7 place-items-center rounded-md", x === "2" ? "bg-primary text-on-primary" : "text-body")}>{x}</span>)}</span></Card> },
];

function Spots({ items }: { items: Spot[] }) {
  return (
    <>
      {items.map((s, i) => (
        <div key={i} className="absolute" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
          {s.node}
        </div>
      ))}
    </>
  );
}

/** Fener: imleci yumuşak gecikmeyle izler (her karede kalan yolun %12'si); imleç 1,5 sn
 *  durunca yavaş bir Lissajous yoluna döner. Konum CSS değişkeni: yeniden çizim yok. */
function useLantern(stage: React.RefObject<HTMLDivElement | null>, still: boolean) {
  const target = useRef<{ x: number; y: number } | null>(null);
  const lastMove = useRef(0);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    if (still) {
      el.style.setProperty("--fx", "20%");
      el.style.setProperty("--fy", "42%");
      return;
    }
    let raf = 0;
    let x = el.clientWidth * 0.22;
    let y = el.clientHeight * 0.4;
    const start = performance.now();
    const tick = (now: number) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      let tx: number;
      let ty: number;
      if (target.current && now - lastMove.current < 1500) {
        tx = target.current.x;
        ty = target.current.y;
      } else {
        const s = (now - start) / 1000;
        tx = w * (0.5 + Math.sin(s * 0.23) * 0.36);
        ty = h * (0.46 + Math.sin(s * 0.41 + 1.2) * 0.28);
      }
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      el.style.setProperty("--fx", `${x.toFixed(1)}px`);
      el.style.setProperty("--fy", `${y.toFixed(1)}px`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage, still]);
  return (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = stage.current?.getBoundingClientRect();
    if (!r) return;
    target.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    lastMove.current = performance.now();
  };
}

export function Hero({ palette, theme, onPalette, showcase }: { palette: PaletteName; theme: ThemeName; onPalette: (next: PaletteName) => void; showcase: ReactNode }) {
  const reduce = useReducedMotion();
  const still = !!reduce || AUTOMATED;
  const t = usePaletteTour(palette, onPalette, still);
  const stage = useRef<HTMLDivElement>(null);
  const onMove = useLantern(stage, still);
  const enter = (step: number, y = 16) =>
    still ? {} : { initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 }, transition: { duration: DUR.slow, ease: EASE, delay: step * STAGGER } };
  const R = 300;
  const lens = `radial-gradient(${R}px circle at var(--fx) var(--fy), var(--text-strong) 0%, var(--text-strong) 36%, transparent 72%)`;
  const ogCounts = `141 bileşen · 781 hikaye · ${PALETTES.length} palet · 2 tema`;
  return (
    <section
      ref={t.ref}
      aria-labelledby="kapak-baslik"
      style={t.previewing ? paletteVars(t.shown, theme) : undefined}
      className={cn("relative isolate grid grid-cols-[minmax(0,1fr)] gap-y-16", !still && "kf-tour")}
    >
      <style href="kapak-fener" precedence="default">
        {CSS}
      </style>
      <div
        ref={stage}
        onPointerMove={onMove}
        onPointerDown={onMove}
        className="relative isolate grid w-full justify-items-center overflow-hidden rounded-[2.5rem] bg-surface px-4 py-28 ring-1 ring-inset ring-line-soft sm:py-36"
        style={{ "--fx": "22%", "--fy": "40%" } as CSSProperties}
      >
        {/* 1 · Dinlenen sahne: bütün parçalar, renksiz ve soluk. */}
        <div aria-hidden className="kf-rest pointer-events-none absolute inset-0 -z-10 hidden md:block">
          <Spots items={MOSAIC} />
        </div>
        {/* 2 · Işık: fenerin altında paletin yumuşak yıkaması, mercekten geniş. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden md:block" style={{ background: `radial-gradient(${R * 1.5}px circle at var(--fx) var(--fy), var(--primary-wash), transparent 70%)` }} />
        {/* 3 · Fener: aynı parçalar aynı yerde, yalnız merceğin içinde ve renkli. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden md:block" style={{ maskImage: lens, WebkitMaskImage: lens }}>
          <Spots items={MOSAIC} />
        </div>
        {/* 4 · Başlığın arkası: zeminin kendisiyle sakinleşir (fener başlığın altından geçerken okunurluk korunur). */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse 30% 40% at 50% 50%, var(--surface) 35%, transparent 100%)" }} />

        <div className="grid justify-items-center text-center">
          <m.p
            {...enter(1)}
            data-og-counts={ogCounts}
            className="inline-flex items-center gap-2 rounded-full bg-overlay/85 py-1 pr-3.5 pl-1.5 text-small text-body shadow-raised ring-1 ring-inset ring-line-soft backdrop-blur"
          >
            <span className="rounded-full bg-primary-wash px-2 py-0.5 font-semibold text-primary-ink">v{uiPackage.version}</span>
            Next 16 · React 19 · Tailwind v4
          </m.p>
          <h1 id="kapak-baslik" className="mt-7 font-display text-[clamp(3.25rem,8vw,7.5rem)] leading-[0.9] font-bold tracking-[-0.06em] text-strong">
            <m.span className="block" initial={still ? false : { opacity: 0, y: 28, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.85, ease: EASE, delay: 0.1 }}>
              Tek Kimlik,
            </m.span>{" "}
            <m.span className="display-ink block pb-[0.08em]" initial={still ? false : { opacity: 0, y: 28, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.85, ease: EASE, delay: 0.22 }}>
              On Palet
            </m.span>
          </h1>
          <m.p {...enter(4)} className="mt-7 max-w-[44ch] text-lead text-pretty text-body">
            Next 16 projeleri için kopyalanabilir bileşenler, desenler ve ekranlar. Her parça token&apos;dan çizilir; paleti değiştir, hepsi birlikte döner.
          </m.p>
          <m.div {...enter(5)} className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <a
              href={to("showcase--all-in-one")}
              target="_top"
              className={cn("group relative inline-flex min-h-12 items-center gap-2 overflow-hidden rounded-full bg-cta px-6 text-base font-semibold text-on-brand shadow-cta hover:-translate-y-px", PRESS, FOCUS)}
            >
              <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full skew-x-[-20deg] bg-on-brand/25 blur-sm transition-[translate] duration-700 ease-out group-hover:translate-x-[380%]" />
              Bileşenleri Gez
              <ArrowRight aria-hidden strokeWidth={2.25} className="size-4 transition-[translate] duration-200 group-hover:translate-x-0.5" />
            </a>
            <a href={to("demo-app--overview")} target="_top" className={cn("inline-flex min-h-12 items-center rounded-full bg-overlay px-6 text-base font-semibold text-strong shadow-raised hover:-translate-y-px hover:shadow-floating", PRESS, FOCUS)}>
              Pusula&apos;yı Aç
            </a>
          </m.div>
          {/* Palet şeridi: turun göstergesi ve kumandası. */}
          <m.div {...enter(6)} className="mt-8 grid justify-items-center gap-3">
            <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-overlay/85 p-1.5 shadow-raised ring-1 ring-inset ring-line-soft backdrop-blur [scrollbar-width:none]" onPointerLeave={() => t.preview(null)}>
              {TOUR.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-label={`${TITLE[p]} paletini kataloğa uygula`}
                  aria-pressed={p === palette}
                  onPointerEnter={(e) => e.pointerType === "mouse" && t.preview(p)}
                  onFocus={() => t.preview(p)}
                  onBlur={() => t.preview(null)}
                  onClick={() => t.apply(p)}
                  className={cn("grid size-7 shrink-0 place-items-center rounded-full sm:size-8", FOCUS)}
                >
                  <span className={cn("block rounded-full transition-[width,height] duration-300", p === t.shown ? "size-5 ring-2 ring-strong ring-offset-2 ring-offset-overlay" : "size-3.5")} style={{ backgroundImage: palettes[p][theme].brandGradient }} />
                </button>
              ))}
              <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-line" />
              <span className="hidden min-w-[6.5rem] items-baseline gap-1.5 text-left text-small sm:flex" aria-live="polite">
                <SlotText text={TITLE[t.shown]} className="font-semibold text-strong" />
                <span className="text-muted">{t.previewing ? "önizleme" : "seçili"}</span>
              </span>
              {!still ? (
                <button type="button" onClick={t.togglePlay} aria-label={t.playing ? "Palet turunu durdur" : "Palet turunu başlat"} className={cn("grid size-9 shrink-0 place-items-center rounded-full text-body hover:bg-surface hover:text-strong", FOCUS)}>
                  {t.playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
                </button>
              ) : null}
            </div>
            <p className="hidden text-small text-muted md:block">İmleci gezdir: sahnede 141 bileşenden on altısı bekliyor</p>
          </m.div>
        </div>
      </div>
      {/* build-og.mjs bu sarmalayıcıyı (`> div.mt-14`) yakalar: sınıfı ve yeri sabit. */}
      <div className="col-span-full mt-14 w-full">{showcase}</div>
    </section>
  );
}
