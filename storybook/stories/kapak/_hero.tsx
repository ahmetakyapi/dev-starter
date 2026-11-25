"use client";

import { ArrowRight, Blocks, Fingerprint, Pause, Play, SwatchBook } from "lucide-react";
import { AnimatePresence, animate, m, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArtMat } from "@/components/ui/art-mat";
import { CopyButton } from "@/components/ui/copy-button";
import { HeadMark } from "@/components/ui/head-mark";
import { ScrambleText } from "@/components/ui/scramble-text";
import { DUR, EASE, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { palettes } from "../../../packages/@ahmet/theme/tokens";
import uiPackage from "../../../packages/@ahmet/ui/package.json";
import { PALETTES } from "../../.storybook/palettes";
import { STORY_COUNT, TOTAL } from "../amiral/_kapsam";

/**
 * Tanıtım kahramanı: SERGİ (25 Kasım 2026, Fener'in yerine).
 *
 * Kompozisyon bir çizim masası gibi: sola yaslı dev, iki tonlu başlık
 * (güçlü "Tek Kimlik", soluk "On Palet"); "Kimlik" kelimesinin arkasında
 * paletin rengiyle çekilen kalem şeridi ve satır boyunda parmak izi karosu.
 * Altında solda kısa tanım + iki eylem + kurulum komutu, sağda mono büyük
 * harf sayılar (dosyalardan sayılır). En altta kareli kağıt paspartusunun
 * (`art-mat`, yırtık kenar) üstünde katalogdaki GERÇEK bileşenlerden kurulan
 * vitrin kolajı; bant görünüme girerken kenarlara taşan halinden karta
 * daralır. Kenarlarda kesik kılavuz çizgileri ve sağ üstte yırtık bir kağıt
 * parçası: çizim masası hissi.
 *
 * Referans turu: Synaps (sola yaslı başlık, vurgulu kelime + ikon karosu,
 * mono sayılar, kareli mavi kağıt, yırtık kenar, kesik kılavuzlar), Grain
 * (kaydırınca daralan görsel bant), Veridical ve Finance (iki tonlu başlık).
 * Yalnız yapı: renk, metin, görsel ve kod alınmadı; doku token'dan.
 * Karar: knowledge/decisions.md → "Tanıtım Kahramanı: Sergi".
 *
 * Palet turu (Fener'den kaldı): on palet 3,6 sn'de bir bölümü yeniden boyar;
 * kalem şeridi, paspartu ve vitrin birlikte döner (hepsi token). Şeritte
 * üstüne gelince önizler, tıklayınca bütün kataloğa geçer; tur her an durur
 * (WCAG 2.2.2). Hareket azaltmada ve otomasyonda (OG görseli, play testleri)
 * tur ve daralma kapalı.
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
const INSTALL = "node ~/dev-starter/scripts/add-ui.mjs . art-mat step-tabs";

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
/* Harf harf açılış: her kelime kendi maskesinde, harfler alttan yükselir (yalnız transform). */
@keyframes ks-rise { from { transform: translate3d(0, 105%, 0) rotate(6deg); } to { transform: none; } }
.ks-word { display: inline-block; overflow: clip; overflow-clip-margin: 0.12em; padding-bottom: 0.06em; margin-bottom: -0.06em; vertical-align: bottom; }
.ks-char { display: inline-block; transform-origin: 0 100%; animation: ks-rise .9s cubic-bezier(.22,1,.36,1) both; animation-delay: calc(var(--i) * 34ms + var(--d, 0ms)); }
/* Parmak izi kendini çizer: yol uzunluğu 1'e normalize, kesik ofset 1 → 0. */
@keyframes ks-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
.ks-draw path { stroke-dasharray: 1; animation: ks-draw 1.4s cubic-bezier(.65,0,.35,1) both; animation-delay: calc(0.55s + var(--p, 0) * 90ms); }
/* Kılavuz çizgileri yukarıdan aşağı çizilir. */
@keyframes ks-guide { from { transform: scaleY(0); } to { transform: scaleY(1); } }
.ks-guide { transform-origin: top; animation: ks-guide 1.6s cubic-bezier(.22,1,.36,1) .2s both; }
@media (prefers-reduced-motion: reduce) { .ks-char, .ks-draw path, .ks-guide { animation: none; } }
@layer base {
  .ks-tour, .ks-tour * { transition-property: color, background-color, border-color, fill, stroke, stop-color, box-shadow; transition-duration: 600ms; transition-timing-function: cubic-bezier(.22,1,.36,1); }
}`;

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

/** Mono büyük harf sayı sütunu (Synaps "100+ COUNTRIES"): ikon, değer, etiket. */
function Figure({ icon, value, label }: { icon: ReactNode; value: ReactNode; label: string }) {
  return (
    <div className="grid gap-2">
      <span aria-hidden className="text-muted [&_svg]:size-5 [&_svg]:stroke-[1.5]">
        {icon}
      </span>
      <dt className="order-3 font-mono text-small tracking-[0.12em] text-muted">{label.toLocaleUpperCase("tr-TR")}</dt>
      <dd className="order-2 font-mono text-read leading-tight text-strong tabular-nums">{value}</dd>
    </div>
  );
}

/** Kelimeyi harflerine böler; her harf maskesinden sırayla yükselir. Görünen kopya `aria-hidden`
 *  değil: başlığın adı `aria-label`den gelir, harfler arama ve OG için düz metin kalır. */
function Rise({ text, from = 0, delay = 0, still }: { text: string; from?: number; delay?: number; still: boolean }) {
  if (still) return <span className="ks-word">{text}</span>;
  return (
    <span className="ks-word">
      {[...text].map((ch, i) => (
        <span key={i} className="ks-char" style={{ "--i": from + i, "--d": `${delay}ms` } as CSSProperties}>
          {ch}
        </span>
      ))}
    </span>
  );
}

/** Çizerek beliren ikon: lucide yollarının uzunluğu 1'e normalize edilir, CSS kesik ofseti çeker. */
function DrawIcon({ children, still }: { children: ReactNode; still: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    ref.current?.querySelectorAll("path").forEach((p, i) => {
      p.setAttribute("pathLength", "1");
      p.style.setProperty("--p", String(i));
    });
  }, []);
  return (
    <span ref={ref} className={cn("contents", !still && "ks-draw")}>
      {children}
    </span>
  );
}

/** Sayı sayarak gelir (görünüme girince bir kez); hareket azaltmada doğrudan son değer. */
function useCountUp(target: number, still: boolean) {
  const [value, setValue] = useState(still ? target : 0);
  useEffect(() => {
    if (still) {
      setValue(target);
      return;
    }
    const c = animate(0, target, { duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.9, onUpdate: (v) => setValue(Math.round(v)) });
    return () => c.stop();
  }, [target, still]);
  return value;
}

/** Renk numunesi kartı (boya kartelası gibi): dört rol rengi şerit, palet adı, birincil değer.
 *  Süs değil gösterge: başlıktaki "On Palet"in o anki hali. Geniş ekranda; şeritteki duyuru
 *  ekran okuyucuya aynı bilgiyi verdiği için kart `aria-hidden`. */
function SwatchFace({ palette, theme }: { palette: PaletteName; theme: ThemeName }) {
  const v = palettes[palette][theme];
  const chips = [
    ["primary", v.primary],
    ["hover", v.primaryHover],
    ["soft", v.primarySoft],
    ["ink", v.primaryInk],
  ] as const;
  return (
    <div className="rounded-sm bg-overlay p-2.5 shadow-floating ring-1 ring-inset ring-line-soft">
      <div className="grid gap-1">
        {chips.map(([role, value]) => (
          <span key={role} className="flex h-9 items-end justify-between rounded-[2px] px-2 pb-1 font-mono text-micro" style={{ backgroundColor: value, color: v.onPrimary }}>
            <span>{role}</span>
            <span className="tabular-nums">{value}</span>
          </span>
        ))}
      </div>
      <div className="mt-2.5 flex items-baseline justify-between px-0.5">
        <span className="font-display text-title font-semibold tracking-tight text-strong">{TITLE[palette]}</span>
        <span className="font-mono text-micro tracking-[0.12em] text-muted">{theme === "dark" ? "KOYU" : "AÇIK"}</span>
      </div>
    </div>
  );
}

/** Kartela destesi: üstte seçili paletin kartı, arkasında sıradaki ikisi yelpaze gibi. Palet
 *  değişince üstteki kart sağa kayıp düşer, arkadaki öne gelir (kartela çevrilir). Süs değil
 *  gösterge; şeritteki duyuru aynı bilgiyi verdiği için `aria-hidden`. Geniş ekranda. */
function SwatchDeck({ palette, theme, still }: { palette: PaletteName; theme: ThemeName; still: boolean }) {
  const i = TOUR.indexOf(palette);
  const next = (k: number) => TOUR[(i + k) % TOUR.length];
  const spring = { type: "spring" as const, stiffness: 170, damping: 22 };
  return (
    <div aria-hidden className="pointer-events-none absolute top-32 right-4 hidden w-56 xl:block" style={{ perspective: 900 }}>
      {[2, 1].map((k) => (
        <m.div key={`back-${k}`} className="absolute inset-x-0 top-0" initial={false} animate={{ rotate: 4 + k * 5, x: k * 14, y: k * 6, opacity: 1 - k * 0.22 }} transition={spring}>
          <SwatchFace palette={next(k)} theme={theme} />
        </m.div>
      ))}
      <AnimatePresence initial={false} mode="popLayout">
        <m.div
          key={palette}
          className="relative"
          initial={still ? false : { rotate: 9, x: 14, y: 6, opacity: 0.8 }}
          animate={{ rotate: 4, x: 0, y: 0, opacity: 1 }}
          exit={still ? undefined : { rotate: -18, x: -120, y: 60, opacity: 0, transition: { duration: 0.55, ease: [0.55, 0, 0.75, 0.2] } }}
          transition={spring}
        >
          {/* Bant: kartı masaya tutturan yarı saydam şerit. */}
          <span className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-3 bg-surface-raised ring-1 ring-inset ring-line-soft backdrop-blur-sm" />
          <SwatchFace palette={palette} theme={theme} />
        </m.div>
      </AnimatePresence>
    </div>
  );
}

export function Hero({ palette, theme, onPalette, showcase }: { palette: PaletteName; theme: ThemeName; onPalette: (next: PaletteName) => void; showcase: ReactNode }) {
  const reduce = useReducedMotion();
  const still = !!reduce || AUTOMATED;
  const t = usePaletteTour(palette, onPalette, still);
  const enter = (step: number, y = 16) =>
    still ? {} : { initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 }, transition: { duration: DUR.slow, ease: EASE, delay: step * STAGGER } };
  const total = useCountUp(TOTAL, still);
  const stories = useCountUp(STORY_COUNT, still);
  const ogCounts = `${TOTAL} bileşen · ${STORY_COUNT} hikaye · ${PALETTES.length} palet · 2 tema`;
  return (
    <section
      ref={t.ref}
      aria-labelledby="kapak-baslik"
      data-og-counts={ogCounts}
      style={t.previewing ? paletteVars(t.shown, theme) : undefined}
      className={cn("relative isolate grid grid-cols-[minmax(0,1fr)]", !still && "ks-tour")}
    >
      <style href="kapak-sergi" precedence="default">
        {CSS}
      </style>
      {/* Çizim masası: iki yanda kesik kılavuz çizgileri, sağ üstte yırtık kağıt parçası. */}
      <span aria-hidden className="ks-guide pointer-events-none absolute inset-y-0 -left-3 hidden border-l border-dashed border-line-strong lg:block" />
      <span aria-hidden className="ks-guide pointer-events-none absolute inset-y-0 -right-3 hidden border-r border-dashed border-line-strong lg:block" />
      {/* Renk numunesi: masaya bantla tutturulmuş kart, başlığın "On Palet" iddiasını gösterir.
          Değerler seçili (ya da turda gösterilen) paletten; tur döndükçe kart da döner. */}
      <SwatchDeck palette={t.shown} theme={theme} still={still} />

      <div className="grid gap-12 pt-6 sm:pt-10 lg:gap-16 lg:pt-16">
        <m.p {...enter(0)} className="flex items-center gap-3 font-mono text-small tracking-[0.12em] text-muted">
          <span className="rounded-full bg-surface px-2.5 py-1 tabular-nums">v{uiPackage.version}</span>
          {still ? "NEXT 16 · REACT 19 · TAILWIND V4" : <ScrambleText text="NEXT 16 · REACT 19 · TAILWIND V4" trigger="mount" duration={1100} />}
        </m.p>

        {/* Başlık: harfler maskelerinden sırayla yükselir, ardından "Kimlik"in arkasına paletin kalem
            şeridi çekilir ve parmak izi kendini çizer. "Palet" o anki paletin display degradesini taşır;
            tur döndükçe kelime bulanıklaşıp yeni renkte netleşir (yalnız kısa display metni: kimlik
            kuralının izinli degrade yeri). Ad `aria-label`den; harf parçaları ekran okuyucuya tek ad. */}
        <h1
          id="kapak-baslik"
          aria-label="Tek Kimlik On Palet"
          className="-mt-4 max-w-[14ch] font-display text-[clamp(3.5rem,10vw,9rem)] leading-[0.88] font-semibold tracking-[-0.065em] text-strong"
        >
          <span aria-hidden className="block">
            <Rise text="Tek" still={still} />{" "}
            <HeadMark variant="highlight" delay={still ? 0 : 0.75} icon={<DrawIcon still={still}><Fingerprint /></DrawIcon>}>
              <Rise text="Kimlik" from={4} still={still} />
            </HeadMark>
          </span>{" "}
          <span aria-hidden className="block pb-[0.06em]">
            <span className="text-[color-mix(in_srgb,currentColor_52%,transparent)]">
              <Rise text="On" from={10} delay={120} still={still} />
            </span>{" "}
            {/* Degradeli kelime BÜTÜN olarak yükselir: `background-clip: text` dönüştürülen alt öğeleri
                kırpmaz (harfler görünmez olur), bu yüzden harf harf değil kelime maskesinde. */}
            <span className="ks-word">
              <m.span className="inline-grid" initial={still ? false : { y: "105%" }} animate={{ y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.5 }}>
                <AnimatePresence initial={false} mode="popLayout">
                  <m.span
                    key={t.shown}
                    className="col-start-1 row-start-1 bg-clip-text text-transparent [-webkit-background-clip:text]"
                    style={{ backgroundImage: palettes[t.shown][theme].displayGradient }}
                    initial={still ? false : { opacity: 0, filter: "blur(10px)", y: "0.18em" }}
                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    exit={still ? undefined : { opacity: 0, filter: "blur(10px)", y: "-0.18em" }}
                    transition={{ duration: 0.6, ease: EASE }}
                  >
                    Palet
                  </m.span>
                </AnimatePresence>
              </m.span>
            </span>
          </span>
        </h1>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end">
          <div className="grid gap-7">
            <m.div {...enter(4)} className="grid max-w-[52ch] gap-2">
              <p className="text-title font-medium text-strong">Next 16 Projeleri için Görsel Katalog</p>
              <p className="text-lead text-pretty text-body">
                Kopyalanabilir bileşenler, desenler ve ekranlar. Her parça token&apos;dan çizilir; paleti değiştir, hepsi birlikte döner.
              </p>
            </m.div>
            <m.div {...enter(5)} className="flex flex-wrap items-center gap-3">
              <a
                href={to("showcase--all-in-one")}
                target="_top"
                className={cn("group inline-flex min-h-12 items-center gap-2 rounded-full bg-strong px-6 text-base font-semibold text-page shadow-raised hover:-translate-y-px hover:shadow-floating", PRESS, FOCUS)}
              >
                Bileşenleri Gez
                <ArrowRight aria-hidden strokeWidth={2.25} className="size-4 transition-[translate] duration-200 group-hover:translate-x-0.5" />
              </a>
              <a href={to("demo-app--overview")} target="_top" className={cn("inline-flex min-h-12 items-center rounded-full bg-surface px-6 text-base font-semibold text-strong ring-1 ring-inset ring-line hover:-translate-y-px hover:bg-surface-raised", PRESS, FOCUS)}>
                Pusula&apos;yı Aç
              </a>
            </m.div>
            <m.div {...enter(6)} className="flex w-full max-w-md min-w-0 items-center gap-1 rounded-full bg-surface py-1 pr-1 pl-4 ring-1 ring-inset ring-line-soft">
              <code className="min-w-0 truncate font-mono text-small text-body">
                <span aria-hidden className="mr-2 text-muted">$</span>
                {INSTALL}
              </code>
              <CopyButton value={INSTALL} label="Kurulum komutunu kopyala" />
            </m.div>
          </div>

          <m.div {...enter(7)} className="grid gap-8 lg:justify-items-end">
            {/* Gerçek sayılar: bileşen ve hikaye dosyalardan, palet palettes.ts'ten. */}
            <dl className="grid w-full max-w-md grid-cols-3 gap-6">
              <Figure icon={<Blocks />} value={total.toLocaleString("tr-TR")} label="Bileşen" />
              <Figure icon={<SwatchBook />} value={stories.toLocaleString("tr-TR")} label="Hikaye" />
              <Figure icon={<Fingerprint />} value={`${PALETTES.length} × 2`} label="Palet ve tema" />
            </dl>
            {/* Palet şeridi: turun göstergesi ve kumandası. */}
            <div className="flex w-full max-w-md items-center gap-1 overflow-x-auto rounded-full bg-surface p-1.5 ring-1 ring-inset ring-line-soft [scrollbar-width:none]" onPointerLeave={() => t.preview(null)}>
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
                  className={cn("grid size-7 shrink-0 place-items-center rounded-full", FOCUS)}
                >
                  <span className={cn("block rounded-full transition-[width,height] duration-300", p === t.shown ? "size-5 ring-2 ring-strong ring-offset-2 ring-offset-page" : "size-3.5")} style={{ backgroundImage: palettes[p][theme].brandGradient }} />
                </button>
              ))}
              <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-line" />
              {/* Duyuru yalnız tur dururken: dönen turda ekran okuyucu 3,6 sn'de bir palet adı okuyordu. */}
              <span className="flex min-w-[5.5rem] flex-1 items-baseline gap-1.5 text-left text-small" aria-live={t.playing ? "off" : "polite"}>
                <span className="relative inline-grid">
                  <AnimatePresence initial={false} mode="popLayout">
                    <m.span key={t.shown} className="font-semibold text-strong" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25, ease: EASE }}>
                      {TITLE[t.shown]}
                    </m.span>
                  </AnimatePresence>
                </span>
                <span className="max-sm:hidden text-muted">{t.previewing ? "önizleme" : "seçili"}</span>
              </span>
              {!still ? (
                <button type="button" onClick={t.togglePlay} aria-label={t.playing ? "Palet turunu durdur" : "Palet turunu başlat"} className={cn("grid size-9 shrink-0 place-items-center rounded-full text-body hover:bg-surface-raised hover:text-strong", FOCUS)}>
                  {t.playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
                </button>
              ) : null}
            </div>
          </m.div>
        </div>
      </div>

      {/* build-og.mjs bu sarmalayıcıyı (`> div.mt-14`) yakalar: sınıfı ve yeri sabit.
          Paspartu: kareli kağıt, yırtık kenar; vitrin altta kırpılır, bant daralarak oturur. */}
      <div className="col-span-full mt-14 w-full lg:mt-20">
        <ArtMat variant="grid" edge="torn" pad="lg" scrollInset={!still} bleed={0.05} className="w-full" contentClassName="max-w-[68rem]">
          {showcase}
        </ArtMat>
      </div>
    </section>
  );
}
