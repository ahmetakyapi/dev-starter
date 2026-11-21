"use client";

import { ArrowRight, Bell, Check, FileText, Pause, Play, Search, Truck } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { FilterChip } from "@/components/ui/chip";
import { CopyButton } from "@/components/ui/copy-button";
import { CornerLabel } from "@/components/ui/corner-label";
import { IntegrationCard } from "@/components/ui/integration-card";
import { Kbd } from "@/components/ui/kbd";
import { Progress } from "@/components/ui/progress";
import { Rating } from "@/components/ui/rating";
import { ScheduleList } from "@/components/ui/schedule-list";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sparkline } from "@/components/ui/sparkline";
import { Spinner } from "@/components/ui/spinner";
import { StackedBarChart } from "@/components/ui/stacked-bar-chart";
import { Stat } from "@/components/ui/stat";
import { StatStrip } from "@/components/ui/stat-strip";
import { StatusList } from "@/components/ui/status-list";
import { Switch } from "@/components/ui/switch";
import { TickMeter } from "@/components/ui/tick-meter";
import { ToneText } from "@/components/ui/tone-text";
import { DUR, EASE, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { palettes } from "../../../packages/@ahmet/theme/tokens";
import uiPackage from "../../../packages/@ahmet/ui/package.json";
import { PALETTES } from "../../.storybook/palettes";
import { KIT_COUNT, STORY_COUNT, TOTAL } from "../amiral/_kapsam";

/**
 * Tanıtım kahramanı: FENER. Sahnenin iki yanında katalogdaki GERÇEK
 * bileşenler (snippets/ui) kayan sütunlarda durur; dinlenirken soluk ve
 * renksiz (başlık tek odak), fener yaklaştıkça parça parça renklenir. Fener imleci yumuşak bir
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
@keyframes kf-up { to { transform: translateY(-50%); } }
@keyframes kf-down { from { transform: translateY(-50%); } to { transform: translateY(0); } }
.kf-up { animation: kf-up linear infinite; }
.kf-down { animation: kf-down linear infinite; }
.kf-stage:hover .kf-up, .kf-stage:hover .kf-down { animation-play-state: paused; }
/* Her parça kendi odağını taşır (--f, 0-1): dinlenirken renksiz ve soluk, fener yaklaştıkça
   netleşir, renklenir, hafifçe öne gelir. Yeniden çizim yok; değişken JS'ten. */
.kf-cell { --f: 0; opacity: calc(.34 + .66 * var(--f)); filter: grayscale(calc(1 - var(--f))); transform: scale(calc(.96 + .04 * var(--f))); transition: opacity .35s, filter .35s, transform .35s cubic-bezier(.22,1,.36,1); }
[data-theme="dark"] .kf-cell { opacity: calc(.28 + .72 * var(--f)); }
@media (prefers-reduced-motion: reduce) { .kf-up, .kf-down { animation: none; } }`;

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

const noop = () => {};
const Tile = ({ children, w = "w-60" }: { children: ReactNode; w?: string }) => (
  <div className={cn("kf-tile rounded-[1.1rem] bg-overlay p-3.5 shadow-raised ring-1 ring-inset ring-line-soft", w)}>{children}</div>
);

/* Sahnenin parçaları: katalogdaki GERÇEK bileşenler (snippets/ui), uygulamada nasıl duruyorsa öyle.
   İki yanda birer sütun (on parça, hiçbiri tekrar etmez); sütun kendi içinde iki kez (dikişsiz kayma). */
const COLUMNS: ReactNode[][] = [
  [
    <Tile key="a"><Button size="sm">Değişiklikleri Kaydet</Button></Tile>,
    <Tile key="b"><Stat label="Haftalık Ciro" value="₺84.120" change={6.4} changeLabel="geçen haftaya göre" /></Tile>,
    <Tile key="c"><Switch label="Bildirimler" hint="Acil talepler anında" defaultChecked /></Tile>,
    <Tile key="d" w="w-auto"><Rating value={4} showValue count={128} /></Tile>,
    <Tile key="e"><Progress value={68} label="Yükleniyor" valueText="%68" /></Tile>,
    <Tile key="f" w="w-64">
      <span className="grid gap-2 text-left">
        <span className="text-small text-muted">Gün ve kanala göre talep</span>
        <StackedBarChart
          title="Gün ve kanala göre talep"
          showLegend={false}
          height="h-24"
          series={[{ name: "E-posta", color: 1 }, { name: "Form", color: 2 }]}
          data={[
            { label: "Pzt", values: [14, 8] },
            { label: "Sal", values: [18, 11] },
            { label: "Çar", values: [12, 9] },
            { label: "Per", values: [21, 12] },
            { label: "Cum", values: [16, 7] },
          ]}
        />
      </span>
    </Tile>,
  ],
  [
    <Tile key="a" w="w-auto"><SegmentedControl aria-label="Dönem" size="sm" value="hafta" onValueChange={noop} options={[{ value: "gun", label: "Gün" }, { value: "hafta", label: "Hafta" }, { value: "ay", label: "Ay" }]} /></Tile>,
    <Tile key="b" w="w-auto"><span className="flex items-center gap-3"><AvatarGroup size="sm" label="Ekip" people={[{ name: "Zeynep Kaya" }, { name: "Mert Aksoy" }, { name: "Selin Arslan" }]} /><span className="text-left text-small leading-tight"><b className="block text-strong">3 kişi</b><span className="text-muted">şu an burada</span></span></span></Tile>,
    <Tile key="c"><span className="grid gap-1 text-left"><span className="text-small text-muted">Son 7 gün</span><Sparkline values={[12, 18, 14, 22, 19, 28, 31]} title="Son 7 gün" width={200} height={40} /></span></Tile>,
    <Tile key="d" w="w-auto"><span className="flex gap-1.5"><Badge tone="success">Yayında</Badge><Badge tone="primary">Yeni</Badge><Badge tone="warning">Taslak</Badge></span></Tile>,
    <Tile key="e"><Checkbox label="Haftalık özeti e-postayla al" defaultChecked /></Tile>,
    <Tile key="f" w="w-64">
      <ScheduleList
        label="Sıradakiler"
        items={[
          { id: "1", at: "2026-11-21T09:00", time: "09:00", day: "Bugün", title: "Haftalık özet", detail: "Ekibe gönderilir", color: 1 },
          { id: "2", at: "2026-11-21T14:30", time: "14:30", day: "Bugün", title: "Kargo eşitleme", detail: "Her saat başı", color: 2 },
        ]}
      />
    </Tile>,
  ],
  [
    <Tile key="a" w="w-auto"><span className="flex flex-wrap gap-1.5"><FilterChip selected count={12}>Kargo</FilterChip><FilterChip selected={false} count={4}>Fatura</FilterChip></span></Tile>,
    <Tile key="b"><Stat label="Açık Talep" value="9" change={-12.5} changeLabel="dünden" /></Tile>,
    <Tile key="c" w="w-auto"><span className="flex items-center gap-2 text-small text-muted"><Search className="size-4" />Bileşen ara<Kbd>⌘</Kbd><Kbd>K</Kbd></span></Tile>,
    <Tile key="d" w="w-auto"><span className="flex items-center gap-3 text-small"><Spinner size="sm" label={null} /><span className="text-strong">Eşitleniyor</span></span></Tile>,
    <Tile key="e" w="w-auto"><span className="flex items-center gap-2 text-small"><FileText className="size-4 text-primary-ink" /><span className="text-strong">rapor.pdf</span><span className="text-muted">2,4 MB</span></span></Tile>,
    <Tile key="f" w="w-64">
      <span className="grid gap-2 text-left">
        <span className="text-small text-muted">Çıkışa kalan iş</span>
        <TickMeter label="Biten görev" value={31} max={50} ticks={25} text="%62" valueText="50 görevin 31'i bitti, yüzde 62" />
      </span>
    </Tile>,
  ],
  [
    <Tile key="a"><Switch label="Koyu Tema" hint="Sistemi izler" /></Tile>,
    <Tile key="b" w="w-auto"><Button size="sm" variant="secondary">Taslağı Önizle</Button></Tile>,
    <Tile key="c"><Progress value={42} label="Depolama" valueText="4,2 / 10 GB" /></Tile>,
    <Tile key="d" w="w-auto"><span className="flex items-center gap-2 text-small font-medium text-strong"><span className="grid size-6 place-items-center rounded-full bg-success-wash text-success"><Check className="size-3.5" strokeWidth={3} /></span>Değişiklik kaydedildi</span></Tile>,
    <Tile key="e" w="w-auto"><span className="flex items-center gap-2 text-small"><span className="relative grid size-7 place-items-center rounded-full bg-primary-wash text-primary-ink"><Bell className="size-3.5" /><span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-danger" /></span><span className="text-strong">2 yeni talep</span></span></Tile>,
    <div key="f" className="w-64 text-left">
      <IntegrationCard name="Kargo Takip" category="Lojistik" description="Sevkiyat durumu talebe düşer." icon={<Truck />} connected lastSync="4 dk önce" />
    </div>,
    <Tile key="g" w="w-64">
      <StatusList
        title="Sistem Durumu"
        items={[
          { id: "api", label: "API", status: "operational" },
          { id: "mail", label: "E-posta", status: "operational" },
          { id: "pay", label: "Ödeme", status: "degraded" },
        ]}
      />
    </Tile>,
  ],
];

/** Kayan sütun: içerik iki kez, -%50'ye kayar (dikişsiz). Yön ve hız sütuna göre. */
function Column({ items, dir, dur, still }: { items: ReactNode[]; dir: "up" | "down"; dur: number; still: boolean }) {
  return (
    <div className="h-full overflow-hidden">
      <div className={cn("grid justify-items-center gap-6", !still && (dir === "up" ? "kf-up" : "kf-down"))} style={{ animationDuration: `${dur}s` }}>
        {[...items, ...items].map((node, i) => (
          <div key={i} className="kf-cell">
            {node}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Fener: imleci yumuşak gecikmeyle izler (her karede kalan yolun %12'si); imleç 1,5 sn
 *  durunca yavaş bir Lissajous yoluna döner. Her karede parçaların fenere uzaklığı ölçülür,
 *  odak (`--f`) yakında 1, 320 px'te 0. Konum ve odak CSS değişkeni: yeniden çizim yok. */
function useLantern(stage: React.RefObject<HTMLDivElement | null>, still: boolean) {
  const target = useRef<{ x: number; y: number } | null>(null);
  const lastMove = useRef(0);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const focus = (fx: number, fy: number) => {
      const sr = el.getBoundingClientRect();
      el.querySelectorAll<HTMLElement>(".kf-cell").forEach((c) => {
        const b = c.getBoundingClientRect();
        const d = Math.hypot(b.left + b.width / 2 - sr.left - fx, b.top + b.height / 2 - sr.top - fy);
        const f = Math.max(0, Math.min(1, 1 - (d - 70) / 250));
        c.style.setProperty("--f", (f * f * (3 - 2 * f)).toFixed(3));
      });
    };
    if (still) {
      // Otomasyon ve hareket azaltma: fener sol bantta sabit (OG görseli kararlı).
      const fx = el.clientWidth * 0.18;
      const fy = el.clientHeight * 0.42;
      el.style.setProperty("--fx", `${fx}px`);
      el.style.setProperty("--fy", `${fy}px`);
      const id = window.setTimeout(() => focus(fx, fy), 50);
      return () => window.clearTimeout(id);
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
      focus(x, y);
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
  const ogCounts = `${TOTAL} bileşen · ${STORY_COUNT} hikaye · ${PALETTES.length} palet · 2 tema`;
  return (
    <section
      ref={t.ref}
      aria-labelledby="kapak-baslik"
      style={t.previewing ? paletteVars(t.shown, theme) : undefined}
      className={cn("relative isolate grid grid-cols-[minmax(0,1fr)] gap-y-12", !still && "kf-tour")}
    >
      <style href="kapak-fener" precedence="default">
        {CSS}
      </style>
      <div
        ref={stage}
        onPointerMove={onMove}
        onPointerDown={onMove}
        className="kf-stage relative isolate grid w-full grid-cols-[minmax(0,1fr)] justify-items-center overflow-hidden rounded-[2.5rem] bg-surface px-4 py-28 ring-1 ring-inset ring-line-soft sm:py-36"
        style={{ "--fx": "22%", "--fy": "40%" } as CSSProperties}
      >
        {/* Sahne: iki yanda birer sütun gerçek bileşen, karşılıklı yönlerde kayar; üst ve alt kenarda
            söner. Başlığın sütunu (orta, 2,3 pay) boş. İmleç sahnedeyken kayma durur (okunsun). */}
        <div aria-hidden inert className="pointer-events-none absolute inset-0 -z-10 hidden grid-cols-[minmax(0,1fr)_minmax(0,2.3fr)_minmax(0,1fr)] gap-6 px-8 [mask-image:linear-gradient(to_bottom,transparent,var(--text-strong)_14%,var(--text-strong)_86%,transparent)] lg:grid">
          <Column items={[...COLUMNS[0], ...COLUMNS[1]]} dir="up" dur={70} still={still} />
          <span />
          <Column items={[...COLUMNS[2], ...COLUMNS[3]]} dir="down" dur={76} still={still} />
        </div>
        {/* Işık: fenerin altında paletin yumuşak yıkaması. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden lg:block" style={{ background: `radial-gradient(${R * 1.4}px circle at var(--fx) var(--fy), var(--primary-wash), transparent 70%)` }} />
        {/* 4 · Başlığın arkası: zeminin kendisiyle sakinleşir (fener başlığın altından geçerken okunurluk korunur). */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse 30% 40% at 50% 50%, var(--surface) 35%, transparent 100%)" }} />

        <div className="grid w-full min-w-0 justify-items-center text-center">
          <m.p {...enter(1)} data-og-counts={ogCounts}>
            <CornerLabel className="max-w-full bg-transparent px-3.5 py-2 text-micro tracking-[0.08em] whitespace-normal sm:px-5 sm:py-3 sm:text-small sm:tracking-[0.12em] sm:whitespace-nowrap">
              v{uiPackage.version} · Next 16 · React 19 · Tailwind v4
            </CornerLabel>
          </m.p>
          <ToneText as="h1" id="kapak-baslik" className="mt-8 font-display text-[clamp(3.25rem,8vw,7.5rem)] leading-[0.9] font-bold tracking-[-0.06em]">
            <m.span className="block" initial={still ? false : { y: 28, filter: "blur(12px)" }} animate={{ y: 0, filter: "blur(0px)" }} transition={{ duration: 0.85, ease: EASE, delay: 0.1 }}>
              <span className="text-soft">Tek Kimlik,</span>
            </m.span>{" "}
            <m.span className="display-ink block pb-[0.08em]" initial={still ? false : { y: 28, filter: "blur(12px)" }} animate={{ y: 0, filter: "blur(0px)" }} transition={{ duration: 0.85, ease: EASE, delay: 0.22 }}>
              On Palet
            </m.span>
          </ToneText>
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
          {/* Nasıl kopyalanır: beş saniyede üçüncü cevap (ne var, ne kadar, nasıl alınır). */}
          <m.div {...enter(6)} className="mt-6 flex w-full max-w-md min-w-0 items-center gap-1 rounded-full bg-overlay/85 py-1 pr-1 pl-4 shadow-raised ring-1 ring-inset ring-line-soft backdrop-blur">
            <code className="min-w-0 truncate font-mono text-small text-body">
              <span aria-hidden className="mr-2 text-muted">$</span>node ~/dev-starter/scripts/add-ui.mjs . dial terminal
            </code>
            <CopyButton value="node ~/dev-starter/scripts/add-ui.mjs . dial terminal" label="Kurulum komutunu kopyala" />
          </m.div>
          {/* Palet şeridi: turun göstergesi ve kumandası. */}
          <m.div {...enter(7)} className="mt-6 grid justify-items-center gap-3">
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
              {/* Duyuru yalnız tur dururken: kendi dönen turda ekran okuyucu 3,6 sn'de bir palet adı okuyordu. */}
              <span className="hidden min-w-[6.5rem] items-baseline gap-1.5 text-left text-small sm:flex" aria-live={t.playing ? "off" : "polite"}>
                {/* Ad yumuşak geçişle değişir (harf harf yuvarlanan SlotText, turda anlık karelerde yarım okunuyordu). */}
                <span className="relative inline-grid">
                  <AnimatePresence initial={false} mode="popLayout">
                    <m.span key={t.shown} className="font-semibold text-strong" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25, ease: EASE }}>
                      {TITLE[t.shown]}
                    </m.span>
                  </AnimatePresence>
                </span>
                <span className="text-muted">{t.previewing ? "önizleme" : "seçili"}</span>
              </span>
              {!still ? (
                <button type="button" onClick={t.togglePlay} aria-label={t.playing ? "Palet turunu durdur" : "Palet turunu başlat"} className={cn("grid size-9 shrink-0 place-items-center rounded-full text-body hover:bg-surface hover:text-strong", FOCUS)}>
                  {t.playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
                </button>
              ) : null}
            </div>
            <p className="hidden text-small text-muted lg:block">İmleci yaklaştır: arkadakiler katalogdaki gerçek bileşenler</p>
          </m.div>
        </div>
      </div>
      {/* Gerçek sayılar: bileşen ve hikaye dosyalardan sayılır, palet sayısı palettes.ts'ten. */}
      <m.div {...enter(8)} className="col-span-full -mt-4 w-full border-y border-line py-10">
        <StatStrip
          numberClassName="font-semibold"
          items={[
            { value: TOTAL.toLocaleString("tr-TR"), label: "kopyalanabilir bileşen" },
            { value: KIT_COUNT.toLocaleString("tr-TR"), label: "bileşen paket kitinde" },
            { value: STORY_COUNT.toLocaleString("tr-TR"), label: "çalışan hikaye" },
            { value: `${PALETTES.length} × 2`, label: "palet ve tema" },
          ]}
        />
      </m.div>
      {/* build-og.mjs bu sarmalayıcıyı (`> div.mt-14`) yakalar: sınıfı ve yeri sabit. */}
      <div className="col-span-full mt-14 w-full">{showcase}</div>
    </section>
  );
}
