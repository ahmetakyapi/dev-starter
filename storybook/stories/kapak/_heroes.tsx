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
import { ArrowRight, Check, Pause, Play } from "lucide-react";
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

export const HEROES = { f: HeroPrism, g: HeroWall, h: HeroLantern, i: HeroMagazine, j: HeroOrb } as const;
