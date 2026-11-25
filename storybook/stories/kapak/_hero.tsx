"use client";

import { ArrowRight, Blocks, Fingerprint, Pause, Play, SwatchBook } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArtMat } from "@/components/ui/art-mat";
import { CopyButton } from "@/components/ui/copy-button";
import { HeadMark } from "@/components/ui/head-mark";
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
function Figure({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
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

/** Renk numunesi kartı (boya kartelası gibi): dört rol rengi şerit, palet adı, birincil değer.
 *  Süs değil gösterge: başlıktaki "On Palet"in o anki hali. Geniş ekranda; şeritteki duyuru
 *  ekran okuyucuya aynı bilgiyi verdiği için kart `aria-hidden`. */
function SwatchCard({ palette, theme }: { palette: PaletteName; theme: ThemeName }) {
  const v = palettes[palette][theme];
  const chips = [
    ["primary", v.primary],
    ["hover", v.primaryHover],
    ["soft", v.primarySoft],
    ["ink", v.primaryInk],
  ] as const;
  return (
    <div aria-hidden className="pointer-events-none absolute top-36 right-6 hidden w-56 rotate-[4deg] xl:block">
      {/* Bant: kartı masaya tutturan yarı saydam şerit. */}
      <span className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-3 bg-surface-raised ring-1 ring-inset ring-line-soft backdrop-blur-sm" />
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
    </div>
  );
}

export function Hero({ palette, theme, onPalette, showcase }: { palette: PaletteName; theme: ThemeName; onPalette: (next: PaletteName) => void; showcase: ReactNode }) {
  const reduce = useReducedMotion();
  const still = !!reduce || AUTOMATED;
  const t = usePaletteTour(palette, onPalette, still);
  const enter = (step: number, y = 16) =>
    still ? {} : { initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 }, transition: { duration: DUR.slow, ease: EASE, delay: step * STAGGER } };
  const line = (delay: number) =>
    still ? {} : { initial: { y: 28, filter: "blur(12px)" }, animate: { y: 0, filter: "blur(0px)" }, transition: { duration: 0.85, ease: EASE, delay } };
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
      <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-3 hidden border-l border-dashed border-line-strong lg:block" />
      <span aria-hidden className="pointer-events-none absolute inset-y-0 -right-3 hidden border-r border-dashed border-line-strong lg:block" />
      {/* Renk numunesi: masaya bantla tutturulmuş kart, başlığın "On Palet" iddiasını gösterir.
          Değerler seçili (ya da turda gösterilen) paletten; tur döndükçe kart da döner. */}
      <SwatchCard palette={t.shown} theme={theme} />

      <div className="grid gap-12 pt-6 sm:pt-10 lg:gap-16 lg:pt-16">
        <m.p {...enter(0)} className="flex items-center gap-3 font-mono text-small tracking-[0.12em] text-muted">
          <span className="rounded-full bg-surface px-2.5 py-1 tabular-nums">v{uiPackage.version}</span>
          NEXT 16 · REACT 19 · TAILWIND V4
        </m.p>

        <h1 id="kapak-baslik" className="-mt-4 max-w-[14ch] font-display text-[clamp(3.5rem,10vw,9rem)] leading-[0.88] font-semibold tracking-[-0.065em] text-strong">
          <m.span className="block" {...line(0.08)}>
            Tek{" "}
            <HeadMark variant="highlight" icon={<Fingerprint />}>
              Kimlik
            </HeadMark>
          </m.span>{" "}
          <m.span className="block pb-[0.06em] text-[color-mix(in_srgb,currentColor_52%,transparent)]" {...line(0.2)}>
            On Palet
          </m.span>
        </h1>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end">
          <div className="grid gap-7">
            <m.div {...enter(4)} className="grid max-w-[52ch] gap-2">
              <p className="text-title font-medium text-strong">Next 16 projeleri için görsel katalog</p>
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
              <Figure icon={<Blocks />} value={TOTAL.toLocaleString("tr-TR")} label="Bileşen" />
              <Figure icon={<SwatchBook />} value={STORY_COUNT.toLocaleString("tr-TR")} label="Hikaye" />
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
