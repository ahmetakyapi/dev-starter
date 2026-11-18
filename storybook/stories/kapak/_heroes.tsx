"use client";

/**
 * GEÇİCİ: Tanıtım kahramanı için beş yeni yön (?hero=f|g|h|i|j). Sahibi
 * seçince kazanan Kapak.stories.tsx'e taşınır, bu dosya silinir.
 *
 *   F Prizma        dev yazının harfleri on paletin akışına pencere
 *   G Sonsuz Duvar  gerçek bileşenlerden eğik, kayan duvar
 *   H Fener         soluk bileşen ızgarası, imleç çevresini renklendirir
 *   I Dergi         palet bantlı dev "10" + içindekiler listesi
 *   J Küre          paletin ışığında küre, çevresinde dönen on palet
 *
 * Hepsi aynı turu kullanır: on palet sırayla bölümü boyar (rol değişkenleri
 * satır içi), üstüne gelince önizler, tıklayınca kataloğa geçer; hareket
 * azaltmada ve otomasyonda tur ve hareket kapalı.
 */
import { ArrowRight, Bell, Check, FileText, Pause, Play, Search, Star } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SlotText } from "@/components/ui/slot-text";
import { Switch } from "@/components/ui/switch";
import { DUR, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { palettes } from "../../../packages/@ahmet/theme/tokens";
import uiPackage from "../../../packages/@ahmet/ui/package.json";
import { PALETTES } from "../../.storybook/palettes";

type ThemeName = "light" | "dark";
type PaletteName = keyof typeof palettes;
type HeroProps = { palette: PaletteName; theme: ThemeName; onPalette: (next: PaletteName) => void; showcase: ReactNode };

const TOUR = PALETTES.map((p) => p.value as PaletteName);
const TITLE = Object.fromEntries(PALETTES.map((p) => [p.value, p.title])) as Record<PaletteName, string>;
const TOUR_MS = 3600;
const AUTOMATED = typeof navigator !== "undefined" && navigator.webdriver === true;
const to = (id: string) => `./?path=/story/${id}`;
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page";
const PRESS = "transition-[translate,scale,box-shadow,background-color] duration-200 active:scale-[0.98]";

const channel = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
function luminance(hex: string) {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(n.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const ratioText = (r: number) => `${r.toFixed(1).replace(".", ",")}:1`;

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
  .hx-tour, .hx-tour * { transition-property: color, background-color, border-color, fill, stroke, box-shadow; transition-duration: 600ms; transition-timing-function: cubic-bezier(.22,1,.36,1); }
}
@keyframes hx-flow { to { background-position: -200% 0; } }
@keyframes hx-up { to { transform: translateY(-50%); } }
@keyframes hx-down { from { transform: translateY(-50%); } to { transform: translateY(0); } }
@keyframes hx-spin { to { transform: rotate(360deg); } }
@keyframes hx-counter { to { transform: rotate(-360deg); } }
@keyframes hx-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.025); } }
.hx-flow { animation: hx-flow 18s linear infinite; }
.hx-up { animation: hx-up var(--dur, 40s) linear infinite; }
.hx-down { animation: hx-down var(--dur, 40s) linear infinite; }
.hx-spin { animation: hx-spin 60s linear infinite; }
.hx-counter { animation: hx-counter 60s linear infinite; }
.hx-breathe { animation: hx-breathe 7s ease-in-out infinite; }
.hx-paused, .hx-paused * { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) { .hx-flow, .hx-up, .hx-down, .hx-spin, .hx-counter, .hx-breathe { animation: none; } }`;

/* ── Ortak tur ──────────────────────────────────────────────────────── */
function usePaletteTour(palette: PaletteName, theme: ThemeName, onPalette: (p: PaletteName) => void) {
  const reduce = useReducedMotion();
  const still = !!reduce || AUTOMATED;
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
    still,
    shown,
    sw: palettes[shown][theme],
    title: TITLE[shown],
    previewing: shown !== palette,
    playing,
    togglePlay: () => setPlaying((v) => !v),
    preview: (p: PaletteName | null) => setHover(p),
    apply: (p: PaletteName) => {
      setPlaying(false);
      setHover(null);
      onPalette(p);
    },
    sectionStyle: shown !== palette ? paletteVars(shown, theme) : undefined,
  };
}
type Tour = ReturnType<typeof usePaletteTour>;

/** Swatch butonu için ortak olaylar. */
const swatchProps = (t: Tour, p: PaletteName, palette: PaletteName) => ({
  type: "button" as const,
  "aria-label": `${TITLE[p]} paletini kataloğa uygula`,
  "aria-pressed": p === palette,
  onPointerEnter: (e: ReactPointerEvent) => e.pointerType === "mouse" && t.preview(p),
  onFocus: () => t.preview(p),
  onBlur: () => t.preview(null),
  onClick: () => t.apply(p),
});

function Ctas({ className, center = false }: { className?: string; center?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center gap-3 sm:flex-row", center ? "sm:justify-center" : "lg:items-start", className)}>
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
    </div>
  );
}

function PlayButton({ t }: { t: Tour }) {
  if (t.still) return null;
  return (
    <button type="button" onClick={t.togglePlay} aria-label={t.playing ? "Palet turunu durdur" : "Palet turunu başlat"} className={cn("grid size-9 shrink-0 place-items-center rounded-full text-body hover:bg-surface hover:text-strong", FOCUS)}>
      {t.playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
    </button>
  );
}

const Lead = ({ className }: { className?: string }) => (
  <p className={cn("max-w-[44ch] text-lead text-pretty text-body", className)}>Next 16 projeleri için kopyalanabilir bileşenler, desenler ve ekranlar. Her parça token&apos;dan çizilir; paleti değiştir, hepsi birlikte döner.</p>
);

const Pill = ({ className }: { className?: string }) => (
  <p className={cn("inline-flex items-center gap-2 rounded-full bg-overlay/80 py-1 pr-3.5 pl-1.5 text-small text-body shadow-raised ring-1 ring-inset ring-line-soft", className)}>
    <span className="rounded-full bg-primary-wash px-2 py-0.5 font-semibold text-primary-ink">v{uiPackage.version}</span>
    Next 16 · React 19 · Tailwind v4
  </p>
);

function Shell({ t, className, children, showcase }: { t: Tour; className?: string; children: ReactNode; showcase: ReactNode }) {
  return (
    <section ref={t.ref} aria-labelledby="kapak-baslik" style={t.sectionStyle} className={cn("relative isolate grid grid-cols-[minmax(0,1fr)] gap-y-16", !t.still && "hx-tour", className)}>
      <style href="kapak-heroes" precedence="default">
        {CSS}
      </style>
      {children}
      <div className="col-span-full mt-6 w-full">{showcase}</div>
    </section>
  );
}

/* Bileşen numuneleri (duvar ve fener için): katalogdaki gerçek parçalar, küçük. */
function Tile({ k }: { k: number }) {
  const kinds: ReactNode[] = [
    <span key="b" className="inline-flex min-h-9 items-center rounded-full bg-cta px-4 text-small font-semibold text-on-brand shadow-cta">Kaydet</span>,
    <div key="s" className="w-44 text-left">
      <Switch label="Bildirimler" defaultChecked />
    </div>,
    <span key="bd" className="flex gap-1.5">
      <Badge tone="success">Yayında</Badge>
      <Badge tone="primary">Yeni</Badge>
    </span>,
    <AvatarGroup key="a" size="sm" label="Ekip" people={[{ name: "Zeynep Kaya" }, { name: "Mert Aksoy" }, { name: "Selin Arslan" }]} />,
    <span key="k" className="flex items-center gap-1.5 text-small text-muted">
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd> ara
    </span>,
    <div key="c" aria-hidden className="flex h-12 w-36 items-end gap-1">
      {[40, 62, 48, 75, 58, 88, 70].map((h, i) => (
        <span key={i} className={cn("flex-1 rounded-t-[0.25rem]", i === 5 ? "bg-primary" : "bg-primary-wash")} style={{ height: `${h}%` }} />
      ))}
    </div>,
    <span key="p" className="grid w-40 gap-1.5 text-left">
      <span className="flex justify-between text-micro text-muted">
        <span>Yükleniyor</span>
        <span>%68</span>
      </span>
      <span className="h-1.5 overflow-hidden rounded-full bg-surface">
        <span className="block h-full w-[68%] rounded-full bg-primary" />
      </span>
    </span>,
    <span key="i" className="flex w-44 items-center gap-2 rounded-lg bg-surface px-3 py-2 text-left text-small text-muted ring-1 ring-inset ring-line">ad@ornek.com.tr</span>,
    <span key="ch" className="flex gap-1.5">
      {["Kargo", "Fatura"].map((x) => (
        <span key={x} className="rounded-full bg-primary-wash px-2.5 py-1 text-micro font-semibold text-primary-ink">
          {x}
        </span>
      ))}
    </span>,
    <span key="t" className="flex items-center gap-2 text-small font-medium text-strong">
      <span className="grid size-6 place-items-center rounded-full bg-success-wash text-success">
        <Check className="size-3.5" strokeWidth={3} />
      </span>
      Kaydedildi
    </span>,
  ];
  return <div className="rounded-[1rem] bg-overlay p-3 shadow-raised ring-1 ring-inset ring-line-soft">{kinds[k % kinds.length]}</div>;
}

/* ── F · Prizma ─────────────────────────────────────────────────────── */
export function HeroPrism({ palette, theme, onPalette, showcase }: HeroProps) {
  const t = usePaletteTour(palette, theme, onPalette);
  // On paletin birincil rengi art arda, iki tur (akarken dikiş görünmesin).
  const spectrum = `linear-gradient(90deg, ${[...TOUR, ...TOUR, TOUR[0]].map((p, i, a) => `${palettes[p][theme].primary} ${((i / (a.length - 1)) * 100).toFixed(2)}%`).join(", ")})`;
  const fixed = t.previewing && !t.playing;
  const ink: CSSProperties = t.playing && !fixed ? { backgroundImage: spectrum, backgroundSize: "200% 100%" } : { backgroundImage: t.sw.displayGradient };
  return (
    <Shell t={t} showcase={showcase} className="justify-items-center text-center">
      <div className="relative grid w-full justify-items-center pt-6">
        <Pill />
        <h1 id="kapak-baslik" className="mt-8 font-display font-bold tracking-[-0.06em] text-strong">
          <span className="block text-[clamp(2rem,4.2vw,3.5rem)] leading-none tracking-[-0.04em] text-body">Tek Kimlik,</span>{" "}
          <span className="relative mt-2 block text-[clamp(4.5rem,17vw,15.5rem)] leading-[0.82]">
            {/* Arkadaki parıltı: aynı akış, buğulu. */}
            <span aria-hidden className={cn("pointer-events-none absolute inset-0 bg-clip-text text-transparent opacity-35 blur-2xl select-none", t.playing && !t.still && "hx-flow")} style={ink}>
              On Palet
            </span>
            <span className={cn("relative bg-clip-text pb-[0.06em] text-transparent", t.playing && !t.still && "hx-flow")} style={ink}>
              On Palet
            </span>
          </span>
        </h1>
        <Lead className="mt-8 text-center" />
        <Ctas center className="mt-9" />
      </div>
      {/* Spektrum lejantı: her palet bir renk çubuğu ve adı. */}
      <div className="grid w-full max-w-5xl gap-3" onPointerLeave={() => t.preview(null)}>
        <div role="group" aria-label="Paletler" className="grid grid-cols-5 gap-x-2 gap-y-4 sm:grid-cols-10">
          {TOUR.map((p) => {
            const active = p === t.shown;
            return (
              <button key={p} {...swatchProps(t, p, palette)} className={cn("group grid gap-2 text-left", FOCUS)}>
                <span className={cn("h-2 rounded-full transition-[height] duration-300", active ? "h-3.5" : "group-hover:h-3")} style={{ backgroundImage: palettes[p][theme].brandGradient }} />
                <span className={cn("truncate text-small", active ? "font-semibold text-strong" : "text-muted")}>{TITLE[p]}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-2 text-small text-muted">
          <span aria-live="polite">
            <SlotText text={t.title} className="font-semibold text-strong" /> {t.previewing ? "önizleme" : "seçili"} · tıkla, katalog o paletle döner
          </span>
          <PlayButton t={t} />
        </div>
      </div>
    </Shell>
  );
}

/* ── G · Sonsuz Duvar ───────────────────────────────────────────────── */
export function HeroWall({ palette, theme, onPalette, showcase }: HeroProps) {
  const t = usePaletteTour(palette, theme, onPalette);
  const [paused, setPaused] = useState(false);
  const cols = 6;
  return (
    <Shell t={t} showcase={showcase} className="justify-items-center text-center">
      <div className="relative grid w-full min-w-0 grid-cols-[minmax(0,1fr)] justify-items-center overflow-hidden rounded-[2.5rem] py-24 sm:py-32 lg:py-40">
        {/* Duvar: altı sütun, karşılıklı yönlerde ve farklı hızlarda kayar; düzlem eğik, kenarlar söner. */}
        <div
          aria-hidden
          className={cn("pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_70%_75%_at_50%_50%,var(--text-strong)_35%,transparent_80%)]", paused && "hx-paused")}
        >
          <div className="absolute top-1/2 left-1/2 grid w-[150%] gap-5 [transform:translate(-50%,-50%)_perspective(1400px)_rotateX(38deg)_rotateZ(-14deg)]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }, (_, c) => (
              <div key={c} className="overflow-hidden">
                <div className={cn("grid gap-5", !t.still && (c % 2 ? "hx-down" : "hx-up"))} style={{ "--dur": `${34 + c * 7}s` } as CSSProperties}>
                  {Array.from({ length: 16 }, (_, r) => (
                    <div key={r} className="grid justify-items-center">
                      <Tile k={c * 3 + r} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Örtü: başlığın arkası sakin; duvar kenarlarda yaşar. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_42%_46%_at_50%_50%,var(--page-bg)_45%,transparent_100%)]" />
        <Pill className="backdrop-blur" />
        <h1 id="kapak-baslik" className="mt-7 font-display text-[clamp(3.25rem,8vw,7.5rem)] leading-[0.9] font-bold tracking-[-0.06em] text-strong">
          <span className="block">Tek Kimlik,</span> <span className="display-ink block pb-[0.08em]">On Palet</span>
        </h1>
        <Lead className="mt-7 text-center" />
        <Ctas center className="mt-9" />
        <div className="mt-8 flex max-w-full min-w-0 items-center gap-1 overflow-x-auto rounded-full bg-overlay/90 p-1.5 shadow-raised ring-1 ring-inset ring-line-soft [scrollbar-width:none]" onPointerLeave={() => t.preview(null)}>
          {TOUR.map((p) => (
            <button key={p} {...swatchProps(t, p, palette)} className={cn("grid size-7 shrink-0 place-items-center rounded-full sm:size-8", FOCUS)}>
              <span className={cn("block rounded-full transition-[width,height] duration-300", p === t.shown ? "size-5 ring-2 ring-strong ring-offset-2 ring-offset-overlay" : "size-3.5")} style={{ backgroundImage: palettes[p][theme].brandGradient }} />
            </button>
          ))}
          <span aria-hidden className="mx-1 h-6 w-px bg-line" />
          {!t.still ? (
            <button type="button" onClick={() => setPaused((v) => !v)} className={cn("hidden shrink-0 rounded-full px-3 py-1.5 text-small text-body hover:bg-surface sm:block", FOCUS)}>
              {paused ? "Duvarı Oynat" : "Duvarı Durdur"}
            </button>
          ) : null}
          <PlayButton t={t} />
        </div>
      </div>
    </Shell>
  );
}

/* ── H · Fener ──────────────────────────────────────────────────────── */
export function HeroLantern({ palette, theme, onPalette, showcase }: HeroProps) {
  const t = usePaletteTour(palette, theme, onPalette);
  const stage = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(false);
  // Fener: imleç yoksa (dokunmatik, ilk açılış) yavaşça kendi dolaşır.
  useEffect(() => {
    if (t.still || lit) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const el = stage.current;
      if (el) {
        const s = (now - start) / 1000;
        el.style.setProperty("--fx", `${50 + Math.sin(s * 0.45) * 34}%`);
        el.style.setProperty("--fy", `${48 + Math.sin(s * 0.7) * 26}%`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [t.still, lit]);
  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (t.still || e.pointerType !== "mouse") return;
    const el = stage.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setLit(true);
    el.style.setProperty("--fx", `${e.clientX - r.left}px`);
    el.style.setProperty("--fy", `${e.clientY - r.top}px`);
  }
  const grid = (
    <div className="grid grid-cols-3 gap-6 sm:grid-cols-5 lg:grid-cols-7">
      {Array.from({ length: 28 }, (_, i) => (
        <div key={i} className={cn("grid place-items-center", i % 2 ? "translate-y-6" : "")}>
          <Tile k={i * 7} />
        </div>
      ))}
    </div>
  );
  return (
    <Shell t={t} showcase={showcase} className="justify-items-center text-center">
      <div
        ref={stage}
        onPointerMove={onMove}
        onPointerLeave={() => setLit(false)}
        className="relative grid w-full justify-items-center overflow-hidden rounded-[2.5rem] bg-surface px-4 py-24 ring-1 ring-inset ring-line-soft sm:py-32"
        style={{ "--fx": "50%", "--fy": "45%" } as CSSProperties}
      >
        {/* Karanlık katman: bütün ızgara gri ve soluk. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-6 inset-y-10 -z-10 opacity-[0.18] grayscale">
          {grid}
        </div>
        {/* Aydınlık katman: aynı ızgara, yalnız fenerin dairesinde ve renkli. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 inset-y-10 -z-10"
          style={{ maskImage: "radial-gradient(320px circle at var(--fx) var(--fy), var(--text-strong) 35%, transparent 72%)", WebkitMaskImage: "radial-gradient(320px circle at var(--fx) var(--fy), var(--text-strong) 35%, transparent 72%)" }}
        >
          {grid}
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: "radial-gradient(420px circle at var(--fx) var(--fy), var(--primary-wash), transparent 70%)" }} />
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_40%_44%_at_50%_50%,var(--page-bg)_55%,transparent_100%)] opacity-90" />
        <div className="grid justify-items-center rounded-[2rem] px-6 py-10 sm:px-12">
          <Pill />
          <h1 id="kapak-baslik" className="mt-7 font-display text-[clamp(3.25rem,8vw,7.5rem)] leading-[0.9] font-bold tracking-[-0.06em] text-strong">
            <span className="block">Tek Kimlik,</span> <span className="display-ink block pb-[0.08em]">On Palet</span>
          </h1>
          <Lead className="mt-7 text-center" />
          <Ctas center className="mt-9" />
          <p className="mt-6 flex items-center gap-2 text-small text-muted">
            İmleci gezdir: karanlıkta 141 bileşen var · <SlotText text={t.title} className="font-semibold text-strong" />
            <PlayButton t={t} />
          </p>
        </div>
      </div>
    </Shell>
  );
}

/* ── I · Dergi Kapağı ───────────────────────────────────────────────── */
export function HeroMagazine({ palette, theme, onPalette, showcase }: HeroProps) {
  const t = usePaletteTour(palette, theme, onPalette);
  // On bant: rakamın içi on paletin birincil rengi, sert duraklarla (yatay şeritler).
  const bands = `linear-gradient(180deg, ${TOUR.map((p, i) => `${palettes[p][theme].primary} ${i * 10}% ${(i + 1) * 10}%`).join(", ")})`;
  return (
    <Shell t={t} showcase={showcase}>
      <div className="grid gap-y-10 border-y border-line py-10 lg:grid-cols-12 lg:gap-x-12 lg:py-14">
        {/* Künye şeridi: derginin üst satırı. */}
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4 font-mono text-micro tracking-wide text-muted uppercase lg:col-span-12">
          <span>dev-starter · Görsel Katalog</span>
          <span>Sayı {uiPackage.version} · Kasım 2026</span>
          <span>Next 16 · React 19 · Tailwind v4</span>
        </div>
        <div className="relative lg:col-span-5">
          <span
            aria-hidden
            className="block bg-clip-text font-display text-[clamp(14rem,34vw,30rem)] leading-[0.78] font-bold tracking-[-0.08em] text-transparent select-none"
            style={{ backgroundImage: bands }}
          >
            10
          </span>
          {/* Etkin paletin bandı rakamın yanında işaretli. */}
          <span aria-hidden className="absolute top-0 -right-2 hidden h-full w-1 lg:block">
            <span className="absolute w-1 rounded-full bg-strong transition-[top] duration-500 ease-out" style={{ top: `${TOUR.indexOf(t.shown) * 10}%`, height: "10%" }} />
          </span>
        </div>
        <div className="grid content-between gap-10 lg:col-span-7">
          <div>
            <h1 id="kapak-baslik" className="font-display text-[clamp(3rem,6.4vw,6rem)] leading-[0.92] font-bold tracking-[-0.055em] text-strong">
              <span className="block">Tek Kimlik,</span> <span className="display-ink block pb-[0.08em]">On Palet</span>
            </h1>
            <Lead className="mt-6" />
            <Ctas className="mt-8" />
          </div>
          {/* İçindekiler: on palet, noktalı kılavuzla kodu; satır önizler, tıklama uygular. */}
          <div onPointerLeave={() => t.preview(null)}>
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="font-mono text-micro tracking-wide text-muted uppercase">İçindekiler</span>
              <PlayButton t={t} />
            </div>
            <ol className="grid sm:grid-cols-2 sm:gap-x-8">
              {TOUR.map((p, i) => {
                const active = p === t.shown;
                return (
                  <li key={p}>
                    <button {...swatchProps(t, p, palette)} className={cn("flex w-full items-baseline gap-3 border-b border-line-soft py-2 text-left", FOCUS)}>
                      <span className="w-6 font-mono text-micro text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                      <span className={cn("text-base transition-[color]", active ? "font-semibold text-strong" : "text-body")}>{TITLE[p]}</span>
                      <span aria-hidden className="mb-1 flex-1 border-b border-dotted border-line-strong" />
                      <span className="flex items-center gap-2 font-mono text-micro text-muted">
                        <span className={cn("size-2.5 rounded-full transition-[scale]", active && "scale-150")} style={{ backgroundColor: palettes[p][theme].primary }} />
                        {palettes[p][theme].primary.toUpperCase()}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/** Küre yörüngesi: elips üzerinde on palet. 3B dönüşüm yerine her karede
 *  açı hesaplanır: öndeki nokta (elipsin alt yarısı) kürenin önünde, büyük ve
 *  net; arkadaki küçük ve soluk, kürenin arkasında. Halka da iki yarı: arka
 *  yarı kürenin altında, ön yarı üstünde. */
function Orbit({ t, palette, theme }: { t: Tour; palette: PaletteName; theme: ThemeName }) {
  const dots = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    let raf = 0;
    let angle = 0;
    let last = performance.now();
    const place = () => {
      dots.current.forEach((el, i) => {
        if (!el) return;
        const a = angle + (i / TOUR.length) * Math.PI * 2;
        const depth = Math.sin(a); // -1 arka, +1 ön
        const k = (depth + 1) / 2;
        el.style.left = `${50 + Math.cos(a) * 47}%`;
        el.style.top = `${50 + depth * 15}%`;
        el.style.zIndex = depth > 0 ? "20" : "0";
        el.style.opacity = String(0.45 + 0.55 * k);
        el.style.transform = `translate(-50%, -50%) scale(${0.7 + 0.35 * k})`;
      });
    };
    const tick = (now: number) => {
      angle += ((now - last) / 1000) * 0.12;
      last = now;
      place();
      raf = requestAnimationFrame(tick);
    };
    place();
    if (!t.still) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [t.still]);
  const ring = (half: "back" | "front") => (
    <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className={cn("pointer-events-none absolute inset-0 size-full overflow-visible", half === "front" ? "z-20" : "z-0")}>
      <path d={half === "back" ? "M 3 50 A 47 15 0 0 1 97 50" : "M 97 50 A 47 15 0 0 1 3 50"} fill="none" className="stroke-line-strong" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
  return (
    <>
      {ring("back")}
      {ring("front")}
      <div className="absolute inset-0" onPointerLeave={() => t.preview(null)}>
        {TOUR.map((p, i) => {
          const active = p === t.shown;
          return (
            <span key={p} ref={(el) => { dots.current[i] = el; }} className="absolute">
              <button {...swatchProps(t, p, palette)} className={cn("grid size-11 place-items-center rounded-full", FOCUS)}>
                <span className={cn("block rounded-full shadow-floating transition-[width,height] duration-300", active ? "size-8 ring-2 ring-strong ring-offset-2 ring-offset-page" : "size-5")} style={{ backgroundImage: palettes[p][theme].brandGradient }} />
              </button>
            </span>
          );
        })}
      </div>
    </>
  );
}

/* ── J · Küre ───────────────────────────────────────────────────────── */
export function HeroOrb({ palette, theme, onPalette, showcase }: HeroProps) {
  const t = usePaletteTour(palette, theme, onPalette);
  const orb = useRef<HTMLDivElement>(null);
  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (t.still || e.pointerType !== "mouse") return;
    const el = orb.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--lx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--ly", `${((e.clientY - r.top) / r.height) * 100}%`);
  }
  const ratio = contrast(t.sw.onPrimary, t.sw.primary);
  return (
    <Shell t={t} showcase={showcase}>
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]" onPointerMove={onMove}>
        <div className="grid justify-items-center text-center lg:justify-items-start lg:text-left">
          <Pill />
          <h1 id="kapak-baslik" className="mt-7 font-display text-[clamp(3.25rem,7vw,6.75rem)] leading-[0.9] font-bold tracking-[-0.06em] text-strong">
            <span className="block">Tek Kimlik,</span> <span className="display-ink block pb-[0.08em]">On Palet</span>
          </h1>
          <Lead className="mt-7" />
          <Ctas className="mt-9" />
        </div>
        <div className="relative mx-auto grid aspect-square w-full max-w-[34rem] place-items-center">
          <Orbit t={t} palette={palette} theme={theme} />
          {/* Küre: paletin üç tonu, imleci izleyen parlama; renk değişiminde yumuşak geçiş. */}
          <div ref={orb} className="hx-breathe relative z-10 size-[54%] rounded-full" style={{ "--lx": "32%", "--ly": "28%" } as CSSProperties}>
            <AnimatePresence initial={false}>
              <m.div
                key={t.shown}
                className="absolute inset-0 rounded-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.slow * 1.6, ease: EASE }}
                style={{
                  backgroundImage: `radial-gradient(circle at var(--lx) var(--ly), ${t.sw.primarySoft} 0%, ${t.sw.primary} 38%, ${t.sw.primaryInk} 72%)`,
                  boxShadow: `inset -24px -32px 60px rgb(0 0 0 / .28), inset 18px 22px 40px rgb(255 255 255 / .18), 0 40px 120px -20px ${t.sw.primary}`,
                }}
              />
            </AnimatePresence>
            <div aria-hidden className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_var(--lx)_var(--ly),rgb(255_255_255/.55),transparent_32%)] mix-blend-soft-light" />
            <div className="absolute inset-0 grid place-items-center text-center" style={{ color: t.sw.onPrimary }}>
              <div className="grid gap-1">
                <SlotText text={t.title} className="justify-center font-display text-heading font-bold tracking-tight" />
                <span className="font-mono text-small opacity-85">
                  {t.sw.primary.toUpperCase()} · {ratioText(ratio)}
                </span>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-2 flex items-center gap-2 text-small text-muted">
            Noktaya tıkla, katalog o renge bürünür
            <PlayButton t={t} />
          </div>
        </div>
      </div>
    </Shell>
  );
}

export const HEROES_FJ = { f: HeroPrism, g: HeroWall, h: HeroLantern, i: HeroMagazine, j: HeroOrb } as const;

/* ── K ve L: müze / atölye tarzı ─────────────────────────────────────────
   Tek renkli sıcak taş tonları, ince serif başlık, mono künye, soluk ASCII
   dokusu, ortada fiziksel bir nesne (metal kart). Renk yalnız kartın şeridinde
   ve palet noktalarında: gerisi taş. Taş tonları token karışımı (page + strong
   + accent-warm), sabit renk yok. */
const SERIF = "font-[family-name:var(--font-serif-face),serif] font-normal";
const stone = (pct: number) => `color-mix(in oklab, color-mix(in oklab, var(--text-strong) ${pct}%, var(--page-bg)) 94%, var(--accent-warm))`;

/** ASCII alanı: dalga biçimli karakter yoğunluğu, tohumsuz ama sabit (sinüs). */
const ASCII = (() => {
  const chars = " .·:-=+*%#";
  const rows: string[] = [];
  for (let y = 0; y < 34; y++) {
    let line = "";
    for (let x = 0; x < 150; x++) {
      const v = Math.sin(x / 11 + y / 5) * Math.cos(y / 7 - x / 23) + Math.sin((x + y * 2) / 17) * 0.6;
      const i = Math.max(0, Math.min(chars.length - 1, Math.floor(((v + 1.6) / 3.2) * chars.length)));
      line += chars[i];
    }
    rows.push(line);
  }
  return rows.join("\n");
})();

function AsciiField({ className }: { className?: string }) {
  return (
    <pre aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden font-mono text-[9px] leading-[11px] text-muted select-none [mask-image:radial-gradient(ellipse_75%_70%_at_50%_60%,var(--text-strong)_15%,transparent_80%)]", className)}>
      {ASCII}
    </pre>
  );
}

const DarkPill = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_top" className={cn("group inline-flex min-h-11 items-center gap-2 rounded-full px-5 font-mono text-small text-page shadow-raised ring-1 ring-inset ring-line-strong hover:-translate-y-px", PRESS, FOCUS)} style={{ backgroundColor: "var(--text-strong)" }}>
    {children}
    <ArrowRight aria-hidden className="size-3.5 transition-[translate] duration-200 group-hover:translate-x-0.5" />
  </a>
);
const LightPill = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_top" className={cn("inline-flex min-h-11 items-center rounded-full bg-surface px-5 font-mono text-small text-strong ring-1 ring-inset ring-line hover:-translate-y-px hover:bg-overlay", PRESS, FOCUS)}>
    {children}
  </a>
);

/** Metal kart: fırçalanmış yüzey, çip, sağda paletin şeridi; imleçle eğilir, parlaması kayar, tıklayınca döner. */
function MetalCard({ t, theme, flippable = false, className }: { t: Tour; theme: ThemeName; flippable?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [back, setBack] = useState(false);
  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (t.still || e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 14}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 18}deg`);
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
  }
  function onLeave() {
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  }
  // Kart iki temada da koyu grafit: koyu temada --text-strong açık olduğu için oran ters çevrilir.
  const g = (pct: number) => stone(theme === "dark" ? 100 - pct : pct);
  const metal = `linear-gradient(135deg, ${g(62)} 0%, ${g(78)} 38%, ${g(58)} 62%, ${g(72)} 100%)`;
  const brushed = "repeating-linear-gradient(90deg, rgb(255 255 255 / .035) 0 1px, transparent 1px 3px)";
  const face = "absolute inset-0 overflow-hidden rounded-[1.1rem] shadow-modal ring-1 ring-inset ring-line-strong [backface-visibility:hidden]";
  const Body = (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn("relative aspect-[1.586] w-full [perspective:1200px]", className)}
      style={{ "--rx": "0deg", "--ry": "0deg", "--gx": "30%", "--gy": "20%" } as CSSProperties}
    >
      <div
        className="relative size-full transition-[transform] duration-700 ease-[cubic-bezier(.22,1,.36,1)] [transform-style:preserve-3d]"
        style={{ transform: `rotateX(var(--rx)) rotateY(calc(var(--ry) + ${back ? 180 : 0}deg))` }}
      >
        {/* Ön yüz */}
        <div className={face} style={{ backgroundImage: `${brushed}, ${metal}` }}>
          <div className="absolute inset-y-0 right-0 w-[22%] transition-[background-image] duration-700" style={{ backgroundImage: t.sw.brandGradient }} />
          <div className="absolute inset-y-0 right-[22%] w-px bg-on-brand/25" />
          <div className="absolute top-[12%] left-[7%] grid h-[17%] w-[12%] grid-cols-3 gap-px overflow-hidden rounded-md p-px" style={{ backgroundColor: g(40) }}>
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className="rounded-[2px]" style={{ backgroundColor: g(28) }} />
            ))}
          </div>
          <span className="absolute top-[12%] right-[26%] font-mono text-micro text-on-brand/80">v{uiPackage.version}</span>
          <div className="absolute bottom-[11%] left-[7%] grid gap-0.5 text-left text-on-brand">
            <span className="font-mono text-[0.6rem] tracking-[0.18em] uppercase opacity-80">@ahmetakyapi/ui</span>
            <span className={cn(SERIF, "text-[clamp(1.25rem,2.4vw,1.85rem)] leading-none")}>141 Bileşen</span>
          </div>
          <SlotText text={t.title} className="absolute right-[3%] bottom-[11%] w-[16%] justify-center font-mono text-[0.6rem] tracking-wide text-on-brand uppercase" />
          <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-soft-light" style={{ background: "radial-gradient(circle at var(--gx) var(--gy), rgb(255 255 255 / .55), transparent 45%)" }} />
        </div>
        {/* Arka yüz: paletin dört rengi ve kontrastı */}
        <div className={cn(face, "[transform:rotateY(180deg)]")} style={{ backgroundImage: `${brushed}, ${metal}` }}>
          <div className="absolute inset-x-0 top-[14%] h-[14%]" style={{ backgroundColor: g(85) }} />
          <div className="absolute inset-x-[7%] bottom-[12%] grid grid-cols-4 gap-2">
            {[t.sw.primary, t.sw.primarySoft, t.sw.primaryInk, t.sw.onPrimary].map((c, i) => (
              <span key={i} className="grid gap-1 text-left">
                <span className="aspect-square rounded-lg ring-1 ring-inset ring-on-brand/20" style={{ backgroundColor: c }} />
                <span className="font-mono text-[0.55rem] text-on-brand/85">{c.toUpperCase()}</span>
              </span>
            ))}
          </div>
          <span className="absolute top-[36%] left-[7%] font-mono text-micro text-on-brand/85">
            {t.title} · {ratioText(contrast(t.sw.onPrimary, t.sw.primary))}
          </span>
        </div>
      </div>
    </div>
  );
  if (!flippable) return Body;
  return (
    <button type="button" onClick={() => setBack((v) => !v)} aria-label={back ? "Kartın ön yüzünü göster" : "Kartı çevir, paletin renklerini göster"} className={cn("block w-full rounded-[1.1rem]", FOCUS)}>
      {Body}
    </button>
  );
}

const TECH = ["Next.js 16", "React 19", "Tailwind v4", "Storybook 10", "TypeScript"];
function TechRow({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-base text-muted", className)} aria-label="Kullanılan teknolojiler">
      {TECH.map((x, i) => (
        <li key={x} className={cn(i % 2 ? SERIF + " text-lg italic" : "font-display font-semibold tracking-tight")}>
          {x}
        </li>
      ))}
    </ul>
  );
}

function SerifHead({ className }: { className?: string }) {
  return (
    <h1 id="kapak-baslik" className={cn(SERIF, "text-[clamp(3rem,7vw,6.25rem)] leading-[0.95] tracking-[-0.02em] text-strong", className)}>
      <span className="block">Tek Kimlik,</span> <span className="block">On Palet</span>
    </h1>
  );
}

function MonoPill() {
  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-surface py-1 pr-3 pl-1 font-mono text-micro text-body ring-1 ring-inset ring-line">
      <span className="rounded-full px-2 py-0.5 text-page" style={{ backgroundColor: "var(--text-strong)" }}>
        Yeni
      </span>
      On palet, iki tema, tek token mimarisi
      <ArrowRight aria-hidden className="size-3" />
    </p>
  );
}

/** Taş kaide ve üstündeki nesne; altında müze etiketi. */
function Plinth({ object, label, note, className }: { object: ReactNode; label: string; note: string; className?: string }) {
  return (
    <figure className={cn("grid justify-items-center", className)}>
      <div className="relative z-10 -mb-3">{object}</div>
      <div className="relative w-full">
        <div className="h-4 rounded-t-[0.4rem]" style={{ background: `linear-gradient(180deg, ${stone(14)}, ${stone(20)})` }} />
        <div className="h-[clamp(6rem,11vw,9rem)]" style={{ background: `linear-gradient(90deg, ${stone(22)} 0%, ${stone(12)} 45%, ${stone(18)} 100%)`, boxShadow: "inset 0 1px 0 rgb(255 255 255 / .25)" }} />
      </div>
      <figcaption className="mt-3 grid justify-items-center gap-0.5 font-mono text-micro text-muted">
        <span className="text-strong">{label}</span>
        <span>{note}</span>
      </figcaption>
    </figure>
  );
}

const Sphere = () => (
  <div
    className="hx-breathe size-[clamp(7rem,13vw,11rem)] rounded-full shadow-floating"
    style={{ background: `radial-gradient(circle at 34% 28%, ${stone(4)} 0%, ${stone(14)} 40%, ${stone(32)} 82%, ${stone(40)} 100%)` }}
  />
);
const Arch = () => (
  <div className="relative h-[clamp(9rem,16vw,13rem)] w-[clamp(6.5rem,11vw,9rem)] rounded-t-full shadow-floating" style={{ background: `linear-gradient(90deg, ${stone(26)} 0%, ${stone(10)} 46%, ${stone(20)} 100%)` }}>
    <div className="absolute inset-x-[24%] top-[24%] bottom-0 rounded-t-full" style={{ background: `linear-gradient(90deg, ${stone(34)}, ${stone(24)})`, boxShadow: "inset 0 10px 18px rgb(0 0 0 / .18)" }} />
  </div>
);

/* ── K · Müze ───────────────────────────────────────────────────────── */
export function HeroMuseum({ palette, theme, onPalette, showcase }: HeroProps) {
  const t = usePaletteTour(palette, theme, onPalette);
  return (
    <Shell t={t} showcase={showcase} className="justify-items-center text-center">
      <div className="relative isolate grid w-full justify-items-center overflow-hidden rounded-[2rem] px-4 pt-12 ring-1 ring-inset ring-line-soft" style={{ background: `linear-gradient(180deg, ${stone(3)}, ${stone(6)})` }}>
        <AsciiField className="opacity-30" />
        <MonoPill />
        <SerifHead className="mt-5 text-[clamp(2.75rem,5.6vw,5rem)]" />
        <p className="mt-4 max-w-[46ch] text-base text-pretty text-body">Next 16 projeleri için kopyalanabilir bileşenler, desenler ve ekranlar. Her parça token&apos;dan çizilir; paleti değiştir, hepsi birlikte döner.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <DarkPill href={to("showcase--all-in-one")}>Bileşenleri Gez</DarkPill>
          <LightPill href={to("demo-app--overview")}>Pusula&apos;yı Aç</LightPill>
        </div>
        <TechRow className="mt-8" />
        {/* Sahne: iki kaide arasında kart. Kaideler zemine oturur, kart havada. */}
        <div className="mt-4 grid w-full max-w-6xl grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_minmax(0,1.6fr)_1fr] sm:gap-8">
          <Plinth object={<Sphere />} label="No. 01 · Küre" note="taş, token'dan" className="hidden sm:grid" />
          <div className="grid justify-items-center gap-5 self-center pb-16">
            <MetalCard t={t} theme={theme} flippable className="max-w-md" />
            <div className="flex items-center gap-2" onPointerLeave={() => t.preview(null)}>
              {TOUR.map((p) => (
                <button key={p} {...swatchProps(t, p, palette)} className={cn("grid size-7 place-items-center rounded-full", FOCUS)}>
                  <span className={cn("block rounded-full transition-[width,height,filter] duration-300", p === t.shown ? "size-4 ring-1 ring-strong ring-offset-2 ring-offset-page" : "size-2.5 grayscale hover:grayscale-0")} style={{ backgroundImage: palettes[p][theme].brandGradient }} />
                </button>
              ))}
              <PlayButton t={t} />
            </div>
          </div>
          <Plinth object={<Arch />} label="No. 02 · Kemer" note="aynı taş, başka biçim" className="hidden sm:grid" />
        </div>
      </div>
    </Shell>
  );
}

/* ── L · Metal Kart ─────────────────────────────────────────────────── */
export function HeroCard({ palette, theme, onPalette, showcase }: HeroProps) {
  const t = usePaletteTour(palette, theme, onPalette);
  return (
    <Shell t={t} showcase={showcase} className="justify-items-center text-center">
      <div className="relative isolate grid w-full justify-items-center px-4 pt-10">
        <AsciiField className="opacity-30" />
        <MonoPill />
        <SerifHead className="mt-6" />
        <p className="mt-5 max-w-[46ch] text-base text-pretty text-body">Next 16 projeleri için kopyalanabilir bileşenler, desenler ve ekranlar. Her parça token&apos;dan çizilir; paleti değiştir, hepsi birlikte döner.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <DarkPill href={to("showcase--all-in-one")}>Bileşenleri Gez</DarkPill>
          <LightPill href={to("demo-app--overview")}>Pusula&apos;yı Aç</LightPill>
        </div>
        <TechRow className="mt-12" />
        {/* Kart: arkasında soluk bir kopya (deste), önde eğilen asıl kart. */}
        <div className="relative mt-14 w-full max-w-[34rem]">
          <div aria-hidden className="absolute inset-x-[6%] -top-4 h-full rounded-[1.1rem] ring-1 ring-inset ring-line" style={{ backgroundColor: stone(10) }} />
          <div aria-hidden className="absolute inset-x-[3%] -top-2 h-full rounded-[1.1rem] ring-1 ring-inset ring-line" style={{ backgroundColor: stone(16) }} />
          <MetalCard t={t} theme={theme} flippable />
        </div>
        <p className="mt-4 font-mono text-micro text-muted">Karta tıkla, arkası paletin renklerini gösterir</p>
        {/* Palet satırı: gri ikonlar; üstüne gelince renklenir, tıklayınca katalog döner. */}
        <div className="mt-12 grid w-full max-w-5xl grid-cols-5 gap-y-6 sm:grid-cols-10" onPointerLeave={() => t.preview(null)}>
          {TOUR.map((p) => {
            const active = p === t.shown;
            return (
              <button key={p} {...swatchProps(t, p, palette)} className={cn("group grid justify-items-center gap-2", FOCUS)}>
                <span
                  className={cn("grid size-11 place-items-center rounded-full shadow-raised ring-1 ring-inset ring-line transition-[filter,scale] duration-300", active ? "scale-110 grayscale-0" : "grayscale group-hover:grayscale-0")}
                  style={{ backgroundImage: palettes[p][theme].brandGradient }}
                />
                <span className={cn("font-mono text-[0.625rem] tracking-wide uppercase", active ? "text-strong" : "text-muted")}>{TITLE[p]}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-4">
          <PlayButton t={t} />
        </div>
      </div>
    </Shell>
  );
}

/* ── H2 · İskelet ve H3 · Gece: Fener'in iki gelişmiş hali ───────────────
   Hikaye: karanlıkta İSKELET, ışıkta BİLEŞEN. Fenerin değmediği her parça
   yükleniyor iskeletine döner (yalnız yaprak öğeler yuvarlak gri blok, metin
   görünmez); fenerin dairesinde gerçek, renkli bileşen. İki katman aynı
   ızgarayı aynı yerde çizer, yalnız maske değişir. Mercek kenarı yumuşak,
   imleci ince bir halka izler; imleç yoksa fener kendi dolaşır.
   H3 sahneyi temadan bağımsız karanlık bir odaya çevirir (rol değişkenleri
   bölüme yerel; GEÇİCİ önizleme, seçilirse token olur). */
const LANTERN_CSS = `
.hx-skel * { color: transparent !important; box-shadow: none !important; border-color: transparent !important; background-image: none !important; background-color: transparent !important; }
.hx-skel :where(*):not(:has(*)) { background-color: var(--skel) !important; border-radius: .45rem; }
.hx-skel .hx-tile { background-color: transparent !important; outline: 1px solid var(--skel-line); outline-offset: -1px; }
.hx-wire * { color: transparent !important; box-shadow: none !important; background: transparent !important; border-color: transparent !important; }
.hx-wire .hx-frame :where(*) { outline: 1px dashed var(--wire); outline-offset: -1px; border-radius: .35rem; }
.hx-wire .hx-frame { outline: 1px solid var(--wire); outline-offset: -1px; }
.hx-wire .hx-frame > :first-child, .hx-wire .hx-frame > :first-child * { outline: none; }
.hx-wire span:not(.hx-frame *) { color: var(--wire) !important; }
.hx-faint { opacity: .14; filter: grayscale(1) blur(.3px); }
.hx-night { color-scheme: dark; --page-bg: #0b0b0d; --surface: rgb(255 255 255 / .04); --surface-raised: rgb(255 255 255 / .07); --overlay: #17171a; --text-strong: #f4f4f5; --text-body: #a3a3a8; --text-soft: #a3a3a8; --text-muted: #85858b; --line: rgb(255 255 255 / .08); --line-soft: rgb(255 255 255 / .05); --line-strong: rgb(255 255 255 / .14); --success: #3ddc97; --success-wash: rgb(61 220 151 / .12); --chart-track: rgb(255 255 255 / .08); background-color: var(--page-bg); color: var(--text-body); }`;

function LanternStage({ t, palette, theme, night, layer, base = "skel" }: { t: Tour; palette: PaletteName; theme: ThemeName; night: boolean; layer?: ReactNode; base?: "skel" | "wire" | "faint" }) {
  const stage = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(false);
  useEffect(() => {
    if (t.still || lit) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const el = stage.current;
      if (el) {
        const s = (now - start) / 1000;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--fx", `${r.width * (0.5 + Math.sin(s * 0.32) * 0.36)}px`);
        el.style.setProperty("--fy", `${r.height * (0.5 + Math.sin(s * 0.55 + 1) * 0.3)}px`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [t.still, lit]);
  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (t.still || e.pointerType !== "mouse") return;
    const el = stage.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setLit(true);
    el.style.setProperty("--fx", `${e.clientX - r.left}px`);
    el.style.setProperty("--fy", `${e.clientY - r.top}px`);
  }
  const R = night ? 300 : 340;
  const lens = `radial-gradient(${R}px circle at var(--fx) var(--fy), var(--text-strong) 0%, var(--text-strong) 38%, transparent 70%)`;
  // Ferah, hizalı ızgara: altı sütun, beş sıra, tek sütunlar yarım adım aşağıda. Başlığın
  // çevresi (orta dört sütun, ilk sıra dışında) boş: parçalar başlığı çerçeveler, arkasına girmez.
  const cols = 6;
  const grid = (
    <div className="grid gap-x-8 gap-y-10" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array.from({ length: cols * 5 }, (_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const center = c >= 1 && c <= 4 && r >= 1;
        return (
          <div key={i} className={cn("grid place-items-center", c % 2 ? "translate-y-10" : "", center && "invisible")}>
            <div className="hx-tile rounded-[1rem]">
              <Tile k={i * 3 + 1} />
            </div>
          </div>
        );
      })}
    </div>
  );
  const vars = night ? ({ ...paletteVars(t.shown, "dark"), "--skel": "rgb(255 255 255 / .07)", "--skel-line": "rgb(255 255 255 / .06)", "--wire": "rgb(255 255 255 / .12)" } as CSSProperties) : ({ "--skel": "color-mix(in oklab, var(--text-strong) 7%, transparent)", "--skel-line": "color-mix(in oklab, var(--text-strong) 6%, transparent)", "--wire": "color-mix(in oklab, var(--primary) 30%, transparent)" } as CSSProperties);
  return (
    <div
      ref={stage}
      onPointerMove={onMove}
      onPointerLeave={() => setLit(false)}
      className={cn("relative isolate grid w-full justify-items-center overflow-hidden rounded-[2.5rem] px-4 py-28 sm:py-36", night ? "hx-night" : "bg-surface ring-1 ring-inset ring-line-soft")}
      style={{ "--fx": "50%", "--fy": "45%", ...vars } as CSSProperties}
    >
      <style href="kapak-lantern" precedence="default">
        {LANTERN_CSS}
      </style>
      {/* İskelet katmanı: her yerde, sakin. */}
      <div aria-hidden className={cn(`hx-${base} pointer-events-none absolute -z-10 hidden md:block`, layer ? "inset-0" : "inset-x-8 top-10")}>
        {layer ?? grid}
      </div>
      {/* Işık: gece sahnesinde sıcak, gündüz paletin yıkaması; mercekten geniş ve yumuşak. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: night ? `radial-gradient(${R * 1.5}px circle at var(--fx) var(--fy), color-mix(in oklab, var(--accent-warm, #d3a04a) 22%, transparent), color-mix(in oklab, var(--primary) 10%, transparent) 45%, transparent 72%)` : `radial-gradient(${R * 1.4}px circle at var(--fx) var(--fy), var(--primary-wash), transparent 70%)` }}
      />
      {/* Bileşen katmanı: yalnız merceğin içinde. */}
      <div aria-hidden className={cn("pointer-events-none absolute -z-10 hidden md:block", layer ? "inset-0" : "inset-x-8 top-10")} style={{ maskImage: lens, WebkitMaskImage: lens }}>
        {layer ?? grid}
      </div>
      {/* Mercek halkası: imleci izleyen ince çizgi. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -z-10 hidden rounded-full ring-1 ring-line-strong md:block"
        style={{ width: R * 1.2, height: R * 1.2, left: `calc(var(--fx) - ${R * 0.6}px)`, top: `calc(var(--fy) - ${R * 0.6}px)` }}
      />
      {/* Başlığın arkası: zeminin kendisiyle sakinleşir. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_34%_38%_at_50%_50%,var(--page-bg)_30%,transparent_100%)] opacity-80" style={night ? undefined : { background: "radial-gradient(ellipse 34% 38% at 50% 50%, var(--surface) 30%, transparent 100%)" }} />

      <div className="grid justify-items-center px-2 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-overlay/80 py-1 pr-3.5 pl-1.5 text-small text-body shadow-raised ring-1 ring-inset ring-line-soft">
          <span className="rounded-full bg-primary-wash px-2 py-0.5 font-semibold text-primary-ink">v{uiPackage.version}</span>
          Karanlıkta iskelet, ışıkta bileşen
        </p>
        <h1 id="kapak-baslik" className="mt-7 font-display text-[clamp(3.25rem,8vw,7.5rem)] leading-[0.9] font-bold tracking-[-0.06em] text-strong">
          <span className="block">Tek Kimlik,</span> <span className="display-ink block pb-[0.08em]">On Palet</span>
        </h1>
        <Lead className="mt-7 text-center" />
        <Ctas center className="mt-9" />
        <div className="mt-8 flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-overlay/85 p-1.5 shadow-raised ring-1 ring-inset ring-line-soft [scrollbar-width:none]" onPointerLeave={() => t.preview(null)}>
          {TOUR.map((p) => (
            <button key={p} {...swatchProps(t, p, palette)} className={cn("grid size-7 shrink-0 place-items-center rounded-full sm:size-8", FOCUS)}>
              <span className={cn("block rounded-full transition-[width,height] duration-300", p === t.shown ? "size-5 ring-2 ring-strong ring-offset-2 ring-offset-overlay" : "size-3.5")} style={{ backgroundImage: palettes[p][night ? "dark" : theme].brandGradient }} />
            </button>
          ))}
          <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-line" />
          <span className="hidden min-w-[6.5rem] text-left text-small sm:inline" aria-live="polite">
            <SlotText text={t.title} className="font-semibold text-strong" />
          </span>
          <PlayButton t={t} />
        </div>
        <p className="mt-4 hidden text-small text-muted md:block">İmleci gezdir: karanlıkta 141 bileşen bekliyor</p>
      </div>
    </div>
  );
}

export function HeroSkeleton({ palette, theme, onPalette, showcase }: HeroProps) {
  const t = usePaletteTour(palette, theme, onPalette);
  return (
    <Shell t={t} showcase={showcase} className="justify-items-center">
      <LanternStage t={t} palette={palette} theme={theme} night={false} />
    </Shell>
  );
}

export function HeroNight({ palette, theme, onPalette, showcase }: HeroProps) {
  const t = usePaletteTour(palette, theme, onPalette);
  return (
    <Shell t={t} showcase={showcase} className="justify-items-center">
      <LanternStage t={t} palette={palette} theme={theme} night />
    </Shell>
  );
}


/* ── Fener arka planları: B1 Mozaik, B2 Plan Çizimi, B3 Tasarım Föyü ────────
   Aynı mercek; değişen yalnız arka planın İÇERİĞİ. Parçalar elle yerleşir:
   başlığın çevresi (orta sütun) boş, iki yan bant ve köşeler dolu. */
type Spot = { x: number; y: number; node: ReactNode; w?: number };
function Spots({ items }: { items: Spot[] }) {
  return (
    <>
      {items.map((s, i) => (
        <div key={i} className="absolute" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.w }}>
          {s.node}
        </div>
      ))}
    </>
  );
}
const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("hx-tile rounded-[1rem] bg-overlay p-3 shadow-raised ring-1 ring-inset ring-line-soft", className)}>{children}</div>
);

/* B1 · Mozaik: on altı farklı parça, hiçbiri tekrar etmez. */
const MOSAIC: Spot[] = [
  { x: 3, y: 9, node: <Card><div className="grid grid-cols-7 gap-1 text-center text-[0.6rem] text-muted">{["P", "S", "Ç", "P", "C", "C", "P"].map((d, i) => <span key={i}>{d}</span>)}{Array.from({ length: 21 }, (_, i) => <span key={`d${i}`} className={cn("grid size-5 place-items-center rounded-md", i === 9 ? "bg-primary text-on-primary" : "text-body")}>{i + 1}</span>)}</div></Card> },
  { x: 19, y: 6, node: <Card className="w-44"><div className="grid gap-2 text-left"><span className="text-small font-semibold text-strong">Fiyat listesini güncelle</span><span className="flex items-center justify-between"><span className="rounded-full bg-primary-wash px-2 py-0.5 text-micro font-semibold text-primary-ink">Satış</span><AvatarGroup size="sm" label="Atanan" people={[{ name: "Mert Aksoy" }]} /></span></div></Card> },
  { x: 2, y: 40, node: <Card><span className="flex items-center gap-2 text-small font-medium text-strong"><span className="grid size-6 place-items-center rounded-full bg-success-wash text-success"><Check className="size-3.5" strokeWidth={3} /></span>Değişiklik kaydedildi</span></Card> },
  { x: 12, y: 29, node: <Card className="w-44"><svg viewBox="0 0 160 60" className="h-14 w-full" aria-hidden><polyline fill="none" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="0,48 22,40 44,44 66,26 88,32 110,14 132,20 160,6" /></svg><span className="mt-1 block text-left text-micro text-muted">Son 7 gün · +%12</span></Card> },
  { x: 4, y: 62, node: <Card><span className="flex gap-1.5">{["bg-primary", "bg-primary-soft", "bg-primary-wash", "bg-success", "bg-warning"].map((c) => <span key={c} className={cn("size-7 rounded-lg", c)} />)}</span></Card> },
  { x: 16, y: 54, node: <Card className="w-44"><span className="grid gap-2 text-left"><span className="flex justify-between text-micro text-muted"><span>Ses</span><span>64</span></span><span className="relative h-1.5 rounded-full bg-surface"><span className="absolute inset-y-0 left-0 w-[64%] rounded-full bg-primary" /><span className="absolute top-1/2 left-[64%] size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-overlay shadow-raised ring-1 ring-line" /></span></span></Card> },
  { x: 8, y: 80, node: <Card><span className="flex gap-1 rounded-lg bg-surface p-1 text-small">{["Genel", "Ekip", "Fatura"].map((x, i) => <span key={x} className={cn("rounded-md px-2.5 py-1", i === 1 ? "bg-overlay font-semibold text-strong shadow-raised" : "text-muted")}>{x}</span>)}</span></Card> },
  { x: 76, y: 7, node: <Card><span className="flex items-center gap-3"><AvatarGroup size="sm" label="Ekip" people={[{ name: "Zeynep Kaya" }, { name: "Selin Arslan" }, { name: "Can Demir" }]} /><span className="text-left text-micro leading-tight text-muted"><b className="block text-small text-strong">3 kişi</b>şu an burada</span></span></Card> },
  { x: 86, y: 22, node: <Card><span className="flex items-center gap-2 text-small"><FileText className="size-4 text-primary" /><span className="text-strong">rapor.pdf</span><span className="text-muted">2,4 MB</span></span></Card> },
  { x: 74, y: 30, node: <Card className="w-48"><span className="flex items-center gap-2 rounded-lg bg-surface px-2.5 py-2 text-small text-muted ring-1 ring-inset ring-line"><Search className="size-4" />Bileşen ara</span></Card> },
  { x: 87, y: 42, node: <Card><span className="flex gap-0.5 text-warning">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={cn("size-4", i < 4 && "fill-current")} />)}</span></Card> },
  { x: 76, y: 50, node: <Card><span className="flex items-center gap-3"><svg viewBox="0 0 36 36" className="size-11 -rotate-90" aria-hidden><circle cx="18" cy="18" r="15" fill="none" className="stroke-surface" strokeWidth="4" /><circle cx="18" cy="18" r="15" fill="none" className="stroke-primary" strokeWidth="4" strokeDasharray="94" strokeDashoffset="28" strokeLinecap="round" /></svg><span className="text-left text-micro leading-tight text-muted"><b className="block text-small text-strong">%70</b>tamamlandı</span></span></Card> },
  { x: 88, y: 62, node: <Card><span className="flex flex-wrap gap-1.5">{["Kargo", "Fatura"].map((x) => <span key={x} className="rounded-full bg-primary-wash px-2.5 py-1 text-micro font-semibold text-primary-ink">{x}</span>)}</span></Card> },
  { x: 74, y: 68, node: <Card className="w-52"><pre className="text-left font-mono text-[0.65rem] leading-5 text-body"><span className="text-primary-ink">--primary</span>: <span className="text-strong">#0D74C4</span>;{"\n"}<span className="text-primary-ink">--radius</span>: <span className="text-strong">12px</span>;</pre></Card> },
  { x: 86, y: 80, node: <Card><span className="flex items-center gap-2 text-small"><span className="relative grid size-7 place-items-center rounded-full bg-primary-wash text-primary-ink"><Bell className="size-3.5" /><span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-danger" /></span><span className="text-strong">2 yeni talep</span></span></Card> },
  { x: 72, y: 86, node: <Card><span className="flex gap-1 text-small">{["‹", "1", "2", "3", "›"].map((x, i) => <span key={i} className={cn("grid size-7 place-items-center rounded-md", x === "2" ? "bg-primary text-on-primary" : "text-body")}>{x}</span>)}</span></Card> },
];

/* B2 · Plan Çizimi: altı küçük ekran taslağı; sakinken kesikli çizgi, ışıkta dolu. */
function Frame({ kind }: { kind: number }) {
  const bar = <div className="flex h-4 items-center gap-1 px-2"><span className="size-1.5 rounded-full bg-line-strong" /><span className="size-1.5 rounded-full bg-line-strong" /><span className="size-1.5 rounded-full bg-line-strong" /></div>;
  const bodies: ReactNode[] = [
    <div key="pano" className="grid grid-cols-3 gap-1.5 p-2"><span className="h-9 rounded-md bg-primary-wash" /><span className="h-9 rounded-md bg-surface" /><span className="h-9 rounded-md bg-surface" /><span className="col-span-3 flex h-14 items-end gap-1 rounded-md bg-surface p-1.5">{[30, 55, 40, 70, 50, 85, 65].map((h, i) => <span key={i} className={cn("flex-1 rounded-sm", i === 5 ? "bg-primary" : "bg-primary-wash")} style={{ height: `${h}%` }} />)}</span></div>,
    <div key="gelen" className="grid grid-cols-[3rem_1fr] gap-1.5 p-2"><div className="grid gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className={cn("h-3 rounded-sm", i === 0 ? "bg-primary-wash" : "bg-surface")} />)}</div><div className="grid gap-1">{[0, 1, 2, 3, 4].map((i) => <span key={i} className="flex h-3.5 items-center gap-1 rounded-sm bg-surface px-1"><span className={cn("size-1.5 rounded-full", i < 2 ? "bg-primary" : "bg-line-strong")} /><span className="h-1 flex-1 rounded-full bg-line" /></span>)}</div></div>,
    <div key="takvim" className="grid grid-cols-7 gap-1 p-2">{Array.from({ length: 28 }, (_, i) => <span key={i} className={cn("h-4 rounded-sm", i === 10 || i === 17 ? "bg-primary" : i % 6 === 0 ? "bg-primary-wash" : "bg-surface")} />)}</div>,
    <div key="kanban" className="grid grid-cols-3 gap-1.5 p-2">{[3, 2, 1].map((n, c) => <div key={c} className="grid content-start gap-1 rounded-md bg-surface p-1">{Array.from({ length: n }, (_, i) => <span key={i} className={cn("h-5 rounded-sm bg-overlay", c === 1 && i === 0 && "ring-1 ring-primary")} />)}</div>)}</div>,
    <div key="sohbet" className="grid gap-1.5 p-2"><span className="h-5 w-3/4 rounded-lg bg-surface" /><span className="ml-auto h-5 w-2/3 rounded-lg bg-primary" /><span className="h-5 w-1/2 rounded-lg bg-surface" /><span className="mt-1 h-6 rounded-full bg-surface ring-1 ring-inset ring-line" /></div>,
    <div key="ayar" className="grid gap-1.5 p-2">{[0, 1, 2, 3].map((i) => <span key={i} className="flex h-6 items-center justify-between rounded-md bg-surface px-1.5"><span className="h-1.5 w-1/2 rounded-full bg-line-strong" /><span className={cn("h-3 w-6 rounded-full", i % 2 ? "bg-line-strong" : "bg-primary")} /></span>)}</div>,
  ];
  const names = ["Pano", "Gelen Kutusu", "Takvim", "Görevler", "Asistan", "Ayarlar"];
  return (
    <div className="grid gap-1.5">
      <div className="hx-frame hx-tile w-56 overflow-hidden rounded-xl bg-overlay shadow-raised ring-1 ring-inset ring-line-soft">
        {bar}
        {bodies[kind]}
      </div>
      <span className="pl-1 text-left font-mono text-micro text-muted">{names[kind]}</span>
    </div>
  );
}
const BLUEPRINT: Spot[] = [
  { x: 3, y: 8, node: <Frame kind={0} /> },
  { x: 8, y: 38, node: <Frame kind={1} /> },
  { x: 2, y: 66, node: <Frame kind={2} /> },
  { x: 78, y: 8, node: <Frame kind={3} /> },
  { x: 73, y: 38, node: <Frame kind={4} /> },
  { x: 79, y: 66, node: <Frame kind={5} /> },
];

/* B3 · Tasarım Föyü: dört yazı karakteri, renk, köşe, gölge, aralık. */
const SPEC: Spot[] = [
  { x: 4, y: 8, node: <span className="font-display text-[4.5rem] leading-none font-bold tracking-tight text-strong">Aa</span> },
  { x: 4, y: 24, node: <span className="font-mono text-micro text-muted">Schibsted Grotesk · 700</span> },
  { x: 16, y: 34, node: <span className={cn(SERIF, "text-[4rem] leading-none text-strong")}>Aa</span> },
  { x: 16, y: 48, node: <span className="font-mono text-micro text-muted">Instrument Serif</span> },
  { x: 3, y: 56, node: <span className="grid gap-1.5 text-left">{[["bg-primary", "--primary"], ["bg-primary-soft", "--primary-soft"], ["bg-primary-ink", "--primary-ink"]].map(([c, n]) => <span key={n} className="flex items-center gap-2 font-mono text-micro text-body"><span className={cn("size-5 rounded-md", c)} />{n}</span>)}</span> },
  { x: 7, y: 80, node: <span className="flex items-end gap-2">{[4, 8, 12, 16, 24].map((r) => <span key={r} className="grid justify-items-center gap-1"><span className="size-8 bg-primary-wash ring-1 ring-inset ring-primary/40" style={{ borderRadius: r }} /><span className="font-mono text-[0.6rem] text-muted">{r}</span></span>)}</span> },
  { x: 80, y: 8, node: <span className="font-sans text-[4.5rem] leading-none font-medium tracking-tight text-strong">Aa</span> },
  { x: 80, y: 24, node: <span className="font-mono text-micro text-muted">Inter · 500</span> },
  { x: 72, y: 34, node: <span className="font-mono text-[3.5rem] leading-none text-strong">Aa</span> },
  { x: 72, y: 48, node: <span className="font-mono text-micro text-muted">JetBrains Mono</span> },
  { x: 82, y: 56, node: <span className="flex gap-3">{["shadow-raised", "shadow-floating", "shadow-modal"].map((sh) => <span key={sh} className={cn("size-10 rounded-xl bg-overlay", sh)} />)}</span> },
  { x: 74, y: 78, node: <span className="grid gap-1 text-left"><span className="flex items-end gap-1">{[4, 8, 12, 16, 24, 32].map((w) => <span key={w} className="h-6 rounded-sm bg-primary" style={{ width: w }} />)}</span><span className="font-mono text-[0.6rem] text-muted">aralık · 4 → 32</span></span> },
];

function LanternBg({ palette, theme, onPalette, showcase, layer, base }: HeroProps & { layer: Spot[]; base: "skel" | "wire" | "faint" }) {
  const t = usePaletteTour(palette, theme, onPalette);
  return (
    <Shell t={t} showcase={showcase} className="justify-items-center">
      <LanternStage t={t} palette={palette} theme={theme} night={false} base={base} layer={<Spots items={layer} />} />
    </Shell>
  );
}
export const HeroMosaic = (p: HeroProps) => <LanternBg {...p} layer={MOSAIC} base="skel" />;
export const HeroBlueprint = (p: HeroProps) => <LanternBg {...p} layer={BLUEPRINT} base="wire" />;
export const HeroSpec = (p: HeroProps) => <LanternBg {...p} layer={SPEC} base="faint" />;

export const HEROES = { ...HEROES_FJ, k: HeroMuseum, l: HeroCard, h2: HeroSkeleton, h3: HeroNight, b1: HeroMosaic, b2: HeroBlueprint, b3: HeroSpec } as const;
