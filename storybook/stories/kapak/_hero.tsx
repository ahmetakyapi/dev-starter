"use client";

import { ArrowRight, Blocks, Check, Pause, Play, SwatchBook, Layers } from "lucide-react";
import { AnimatePresence, animate, m, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArtMat } from "@/components/ui/art-mat";
import { CopyButton } from "@/components/ui/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Sparkline } from "@/components/ui/sparkline";
import { Switch } from "@/components/ui/switch";
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
 * (güçlü "Tek Kimlik", "On" soluk, "Palet" renk dalgalı).
 * Altında solda kısa tanım + iki eylem + kurulum komutu, sağda mono büyük
 * harf sayılar (dosyalardan sayılır). En altta kareli kağıt paspartusunun
 * (`art-mat`, yırtık kenar) üstünde katalogdaki GERÇEK bileşenlerden kurulan
 * vitrin kolajı; bant görünüme girerken kenarlara taşan halinden karta
 * daralır. Kenarlarda yukarıdan aşağı çizilen kesik kılavuz çizgileri.
 * Başlık iddiasını GÖSTERİR: "Kimlik"in arkasında on paletin şeritleri,
 * "Palet"in harflerinde dalga gibi kayan palet renkleri, sağda aynı kartın
 * on paletteki kopyaları yelpaze halinde (gerçek bileşenler). Denenip
 * bırakılanlar: bej kağıt parçası, numune kartı, kartela destesi, palet
 * küreleri, parmak izi ikonu ("yavan"); karar kaydında.
 *
 * Referans turu: Synaps (sola yaslı başlık, vurgulu kelime + ikon karosu,
 * mono sayılar, kareli mavi kağıt, yırtık kenar, kesik kılavuzlar), Grain
 * (kaydırınca daralan görsel bant), Veridical ve Finance (iki tonlu başlık).
 * Yalnız yapı: renk, metin, görsel ve kod alınmadı; doku token'dan.
 * Karar: knowledge/decisions.md → "Tanıtım Kahramanı: Sergi".
 *
 * Palet turu (Fener'den kaldı): on palet 3,6 sn'de bir bölümü yeniden boyar;
 * spektrum, harf dalgası, yelpaze, paspartu ve vitrin birlikte döner (hepsi token). Şeritte
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
/* Spektrum: "Kimlik"in arkasında on paletin şeritleri alttan sırayla dolar; seçili paletin şeridi genişler. */
@keyframes ks-band { from { transform: scaleY(0); } to { transform: scaleY(1); } }
.ks-band { transform-origin: bottom; animation: ks-band .7s cubic-bezier(.22,1,.36,1) both; animation-delay: calc(0.6s + var(--i) * 55ms); transition: flex-grow .6s cubic-bezier(.22,1,.36,1), opacity .6s; }
/* Renk dalgası: "Palet"in harfleri sırayla bir sonraki paletin rengine geçer. */
.ks-wave { transition: color .6s cubic-bezier(.22,1,.36,1); transition-delay: calc(var(--i) * 70ms); }
/* Kılavuz çizgileri yukarıdan aşağı çizilir. */
@keyframes ks-guide { from { transform: scaleY(0); } to { transform: scaleY(1); } }
.ks-guide { transform-origin: top; animation: ks-guide 1.6s cubic-bezier(.22,1,.36,1) .2s both; }
@media (prefers-reduced-motion: reduce) { .ks-char, .ks-band, .ks-guide { animation: none; } .ks-band, .ks-wave { transition: none; } }
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

/** Spektrum vurgusu: kelimenin arkasında on paletin birincil renginden on dikey şerit (kalem
 *  şeridi yerine). Seçili paletin şeridi genişler; "tek kimlik"in arkasında "on palet". */
function Spectrum({ shown, theme, still, children }: { shown: PaletteName; theme: ThemeName; still: boolean; children: ReactNode }) {
  return (
    <span className="relative isolate inline-block whitespace-nowrap px-[0.06em]">
      <span aria-hidden className="absolute inset-x-0 top-[0.1em] bottom-[0.02em] -z-10 flex gap-[0.025em] overflow-hidden rounded-[0.1em]">
        {TOUR.map((p, i) => (
          <span
            key={p}
            className={cn("ks-band h-full", still && "[animation:none]")}
            style={{
              "--i": i,
              flexGrow: p === shown ? 4 : 1,
              flexBasis: 0,
              opacity: p === shown ? 0.5 : 0.28,
              backgroundColor: palettes[p][theme].primary,
            } as CSSProperties}
          />
        ))}
      </span>
      {children}
    </span>
  );
}

/** Renk dalgası: harf i, turdaki (seçili + i). paletin birincil rengini alır; tur ilerleyince
 *  her harf bir sonraki palete geçer, gecikme harften harfe kayar (dalga). Düz renk (degrade
 *  değil): harfler dönüştürülse de görünür kalır. Büyük punto, birincil renk ≥ 3:1. */
function Wave({ text, shown, theme, from, still }: { text: string; shown: PaletteName; theme: ThemeName; from: number; still: boolean }) {
  const base = TOUR.indexOf(shown);
  return (
    <span className="ks-word">
      {[...text].map((ch, i) => (
        <span
          key={i}
          className={cn("ks-wave", !still && "ks-char")}
          style={{ "--i": from + i, "--d": "120ms", color: palettes[TOUR[(base + i) % TOUR.length]][theme].primary } as CSSProperties}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

/** Aynı kart, on palet: başlığın iddiasının kanıtı. Kart katalogdaki GERÇEK bileşenlerle çizilir
 *  (Button, Switch, Badge, Sparkline); her kopyanın rol değişkenleri kendi paletinden. Yelpaze:
 *  önde seçili palet, arkasında sıradakiler açılarak dizilir; tur ilerleyince öndeki arkaya geçer.
 *  Arkadaki karta basınca o palet bütün kataloğa uygulanır. Kart içi bileşenler `inert` (örnek). */
function SkinDeck({ shown, theme, onPick, still }: { shown: PaletteName; theme: ThemeName; onPick: (p: PaletteName) => void; still: boolean }) {
  const base = TOUR.indexOf(shown);
  const spring = still ? { duration: 0 } : { type: "spring" as const, stiffness: 120, damping: 18 };
  return (
    <div className="relative h-[17rem] w-full max-w-md" style={{ perspective: 1200 }}>
      {TOUR.map((p, i) => {
        const d = (i - base + TOUR.length) % TOUR.length;
        const visible = d < 5;
        const v = palettes[p][theme];
        return (
          <m.div
            key={p}
            className="absolute top-2 right-6 w-64 origin-bottom rounded-2xl text-left"
            style={{ ...paletteVars(p, theme), zIndex: 20 - d, pointerEvents: visible ? "auto" : "none" }}
            initial={false}
            animate={{ rotate: -d * 7, x: -d * 34, y: d * 6, scale: 1 - d * 0.04, opacity: visible ? 1 - d * 0.12 : 0 }}
            transition={spring}
          >
            <span inert className="block rounded-2xl bg-overlay p-4 shadow-floating ring-1 ring-inset ring-line-soft">
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-3.5 rounded-full" style={{ backgroundImage: v.brandGradient }} />
                  <span className="text-base font-semibold text-strong">{TITLE[p]}</span>
                </span>
                <span className="font-mono text-micro text-muted tabular-nums">{v.primary}</span>
              </span>
              <span className="mt-4 flex items-center justify-between gap-3">
                <Button size="sm">
                  <Check aria-hidden />
                  Kaydet
                </Button>
                <Badge tone="primary">Yeni</Badge>
              </span>
              <span className="mt-3 block rounded-lg bg-surface px-3 py-1">
                <Switch label="Bildirimler" defaultChecked />
              </span>
              <span className="mt-3 block">
                <Sparkline values={[8, 12, 10, 15, 13, 19, 22]} title={`${TITLE[p]} örnek eğri`} width={220} height={34} />
              </span>
            </span>
            {/* Tıklama ayrı bir örtü butonunda: kartın içindeki örnek bileşenler de buton (iç içe buton olmaz). */}
            <button
              type="button"
              onClick={() => onPick(p)}
              aria-label={`${TITLE[p]} paletini kataloğa uygula`}
              tabIndex={visible ? 0 : -1}
              className="absolute inset-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2"
            />
          </m.div>
        );
      })}
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
      {/* Çizim masası: iki yanda yukarıdan aşağı çizilen kesik kılavuz çizgileri. */}
      <span aria-hidden className="ks-guide pointer-events-none absolute inset-y-0 -left-3 hidden border-l border-dashed border-line-strong lg:block" />
      <span aria-hidden className="ks-guide pointer-events-none absolute inset-y-0 -right-3 hidden border-r border-dashed border-line-strong lg:block" />

      <div className="grid gap-12 pt-6 sm:pt-10 lg:gap-16 lg:pt-16">
        <m.p {...enter(0)} className="flex items-center gap-3 font-mono text-small tracking-[0.12em] text-muted">
          <span className="rounded-full bg-surface px-2.5 py-1 tabular-nums">v{uiPackage.version}</span>
          {still ? "NEXT 16 · REACT 19 · TAILWIND V4" : <ScrambleText text="NEXT 16 · REACT 19 · TAILWIND V4" trigger="mount" duration={1100} />}
        </m.p>

        {/* Başlık: harfler maskelerinden sırayla yükselir. "Kimlik"in arkasında on paletin şeritleri
            dolar, seçili paletin şeridi genişler (tek kimlik, on palet). "Palet"in harfleri sıradaki
            paletlerin rengini taşır; tur ilerledikçe renk harften harfe dalga gibi kayar. Ad
            `aria-label`den; harf parçaları ekran okuyucuya tek ad. */}
        <h1
          id="kapak-baslik"
          aria-label="Tek Kimlik On Palet"
          className="-mt-4 max-w-[14ch] font-display text-[clamp(3.5rem,10vw,9rem)] leading-[0.88] font-semibold tracking-[-0.065em] text-strong"
        >
          <span aria-hidden className="block">
            <Rise text="Tek" still={still} />{" "}
            <Spectrum shown={t.shown} theme={theme} still={still}>
              <Rise text="Kimlik" from={4} still={still} />
            </Spectrum>
          </span>{" "}
          <span aria-hidden className="block pb-[0.06em]">
            <span className="text-[color-mix(in_srgb,currentColor_52%,transparent)]">
              <Rise text="On" from={10} delay={120} still={still} />
            </span>{" "}
            <Wave text="Palet" shown={t.shown} theme={theme} from={13} still={still} />
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
            {/* Geniş ekranda yelpaze başlığın ikinci satırının yanına yükselir (o satır kısa, sağı boş). */}
            <div className="hidden w-full max-w-md lg:block xl:-mt-28">
              <SkinDeck shown={t.shown} theme={theme} onPick={t.apply} still={still} />
            </div>
            {/* Gerçek sayılar: bileşen ve hikaye dosyalardan, palet palettes.ts'ten. */}
            <dl className="grid w-full max-w-md grid-cols-3 gap-6">
              <Figure icon={<Blocks />} value={total.toLocaleString("tr-TR")} label="Bileşen" />
              <Figure icon={<SwatchBook />} value={stories.toLocaleString("tr-TR")} label="Hikaye" />
              <Figure icon={<Layers />} value={`${PALETTES.length} × 2`} label="Palet ve tema" />
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
