import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import "../showcase/pusula.css";
import { Archive, ArrowRight, ArrowUpRight, Blocks, ChartColumn, Check, Compass, Grid3x3, Layers, LayoutGrid, Monitor, Palette, PanelsTopLeft, Pause, Play, Rocket, Search, type LucideIcon } from "lucide-react";
import { m, type MotionValue, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useGlobals } from "storybook/preview-api";
import { expect, fireEvent, waitFor, within } from "storybook/test";
import { Reveal, RevealItem } from "@/components/motion/Reveal";
import { AppWindow } from "@/components/ui/app-window";
import { AreaChart } from "@/components/ui/area-chart";
import { AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dial } from "@/components/ui/dial";
import { Kbd } from "@/components/ui/kbd";
import { MarkAnnotate } from "@/components/ui/mark-annotate";
import { PATTERN_PRESETS, PatternBackground } from "@/components/ui/pattern-bg";
import { QuickPoll } from "@/components/ui/quick-poll";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SlotText } from "@/components/ui/slot-text";
import { Switch } from "@/components/ui/switch";
import { Terminal } from "@/components/ui/terminal";
import { DUR, EASE, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { palettes } from "../../../packages/@ahmet/theme/tokens";
import uiPackage from "../../../packages/@ahmet/ui/package.json";
import { PALETTES } from "../../.storybook/palettes";
import { KIT_COUNT, TOTAL } from "../amiral/_kapsam";
import { HEROES } from "./_heroes";
import { STORIES, firstOf, under } from "./_harita";

/**
 * Kapak: kataloğun ilk ekranı. Konusu kimlik: tek token mimarisi, on palet,
 * iki tema. Sahnedeki her parça gerçek snippet bileşeni ve gerçek veri
 * (palet değerleri tokens.ts'ten, kontrast WCAG formülüyle burada ölçülür,
 * sayılar kaynak dosyalardan sayılır); sahte ekran görüntüsü ve elle yazılmış
 * sayı yok. Palet karoları araç çubuğundaki Palet globalini, sahnedeki
 * anahtar Tema globalini değiştirir: tuval, sidebar ve belge birlikte döner.
 *
 * Hareket (guides/04-motion.md): giriş bir kez, okuma sırasıyla (künye →
 * başlık → metin → eylem → sahne); bölümler görünüme girince Reveal; palet
 * değişimi yuvarlanan değerlerle (SlotText) ve yükselen karoyla okunur.
 * Hepsi transform + opacity, hareketi azaltan kullanıcıda durağan.
 */

type ThemeName = "light" | "dark";
type PaletteName = keyof typeof palettes;

/** Storybook içinde gezinme: tuval iframe, bağlantı üst pencerede açılır. */
const to = (id: string) => `./?path=/story/${id}`;

/* WCAG 2.x göreli parlaklık: kapaktaki oran token'dan ÖLÇÜLÜR, yazılmaz. */
const channel = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
function luminance(hex: string) {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(n.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const PRESS = "transition-[translate,scale,box-shadow,background-color] duration-200 active:scale-[0.98]";
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page";

/* ── Giriş koreografisi ─────────────────────────────────────────────────
   Tek seferlik karşılama: sıra okuma sırasıdır, başlık kahraman. Kademe
   60 ms, öğe 500 ms; toplam 1 saniyenin altında biter. */
function useEnter() {
  const reduce = useReducedMotion();
  return (step: number, y = 16) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y },
          animate: { opacity: 1, y: 0 },
          transition: { duration: DUR.slow, ease: EASE, delay: step * STAGGER },
        };
}

function BrandMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-block shrink-0 rounded-[26%] bg-brand shadow-raised", className)}>
      <span className="absolute top-[28%] left-1/4 h-[11%] w-1/2 rounded-full bg-on-brand/95" />
      <span className="absolute top-[44.5%] left-1/4 h-[11%] w-[37.5%] rounded-full bg-on-brand/75" />
      <span className="absolute top-[61%] left-1/4 h-[11%] w-1/4 rounded-full bg-on-brand/55" />
    </span>
  );
}

function Masthead() {
  const enter = useEnter();
  return (
    <m.header {...enter(0, 0)} className="relative z-10 flex items-center justify-between gap-4">
      {/* Marka karosu burada YOK: kabuğun sidebar'ında hemen solda duruyor, iki işaret yan yana tekrar olurdu.
          Üst menü de yok: aynı kapılar sağdaki haritada ve kenar çubuğunda (üç gezinme aynı ekranda kalabalıktı). */}
      <p className="flex items-center gap-2.5">
        <span className="text-read font-semibold tracking-tight text-strong">Görsel Katalog</span>
        <span className="rounded-full bg-surface px-2 py-0.5 font-mono text-micro text-muted tabular-nums">v{uiPackage.version}</span>
      </p>
      {/* Arama künyenin karşısında: kahramanın altında eylem kalabalığı yapıyordu (iki buton + arama + palet şeridi). */}
      <SearchLauncher compact />
    </m.header>
  );
}

/* ── Sahne: paletin numune föyü ─────────────────────────────────────────
   Üç karo, üçü de çalışır: rol renkleri seçili paletle döner ve değerleri
   yuvarlanır, kontrast oranı o paletten ölçülür, kadran desenin
   yoğunluğunu, anahtar temayı değiştirir. */
function Stage({ palette, theme, onTheme }: { palette: PaletteName; theme: ThemeName; onTheme: (next: ThemeName) => void }) {
  const reduce = useReducedMotion();
  const [density, setDensity] = useState(5);
  const title = PALETTES.find((p) => p.value === palette)?.title ?? "Signature";
  const p = palettes[palette][theme];
  const ratio = contrast(p.primary, p.onPrimary);
  const swatches: { role: string; className: string; value: string }[] = [
    { role: "primary", className: "bg-primary", value: p.primary },
    { role: "hover", className: "bg-primary-hover", value: p.primaryHover },
    { role: "soft", className: "bg-primary-soft", value: p.primarySoft },
    { role: "ink", className: "bg-primary-ink", value: p.primaryInk },
  ];
  const tile = (step: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: DUR.slow, ease: EASE, delay: 0.32 + step * 0.09 },
        };

  return (
    <m.div
      {...(reduce ? {} : { initial: { opacity: 0, y: 24, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: DUR.page, ease: EASE, delay: 0.2 } })}
      className="relative isolate overflow-hidden rounded-[2rem] bg-surface edge-lit p-3 sm:p-4"
    >
      <PatternBackground pattern="rings" size={30} fade="edges" glow="bloom" tone="primary" intensity={0.08 + density * 0.07} />
      <div className="relative grid grid-cols-1 gap-3 sm:gap-4">
        <m.section {...tile(0)} aria-label="Seçili Palet" className="min-w-0 rounded-xl bg-overlay p-4 shadow-floating sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <BrandMark className="size-11" />
              <div className="min-w-0">
                <p className="font-display text-title font-semibold text-strong">
                  <SlotText text={title} live />
                </p>
                <p className="truncate font-mono text-micro text-muted">
                  data-palette=&quot;{palette}&quot; data-theme=&quot;{theme}&quot;
                </p>
              </div>
            </div>
            <Switch
              label={<><span className="sm:hidden">Koyu</span><span className="max-sm:hidden">Koyu Tema</span></>}
              aria-label="Koyu Tema"
              placement="start"
              checked={theme === "dark"}
              onChange={(event) => onTheme(event.currentTarget.checked ? "dark" : "light")}
              className="shrink-0"
            />
          </div>
          <ul className="mt-5 grid grid-cols-4 gap-2 sm:gap-3">
            {swatches.map((s) => (
              <li key={s.role} className="min-w-0">
                <span aria-hidden className={cn("block h-16 rounded-lg transition-colors duration-300 sm:h-24", s.className)} />
                <p className="mt-2 font-mono text-micro text-muted">{s.role}</p>
                <p className="font-mono text-micro text-strong tabular-nums">
                  <SlotText text={s.value} />
                </p>
              </li>
            ))}
          </ul>
        </m.section>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 sm:gap-4">
          <m.section {...tile(1)} aria-label="Ölçülen Kontrast" className="grid min-w-0 content-between gap-4 rounded-xl bg-overlay p-4 shadow-floating sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-small text-muted">Metin Kontrastı</p>
              <Badge tone={ratio >= 4.5 ? "success" : "warning"}>{ratio >= 4.5 ? "AA" : "AA Büyük"}</Badge>
            </div>
            <p className="flex items-baseline gap-1.5 font-display text-[clamp(2rem,5vw,2.75rem)] leading-none font-semibold tracking-[-0.04em] text-strong">
              <SlotText text={ratio.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
              <span className="text-title font-medium tracking-normal text-muted">: 1</span>
            </p>
            <p className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary px-3 py-1 text-small font-semibold text-on-primary transition-colors duration-300">on-primary</span>
              <span className="rounded-full bg-primary-wash px-3 py-1 text-small font-semibold text-primary-ink transition-colors duration-300">ink / wash</span>
            </p>
          </m.section>
          <m.div {...tile(2)} className="grid place-items-center rounded-xl bg-overlay p-3 shadow-floating sm:p-4">
            <Dial label="Desen Yoğunluğu" min={0} max={10} value={density} onValueChange={setDensity} size={112} />
          </m.div>
        </div>
      </div>
    </m.div>
  );
}

/* ── Katalog haritası ───────────────────────────────────────────────────
   İlk ekranın sağ yarısı: kenar çubuğunun üç bölümü ve on bir kapısı, her
   biri ne içerdiğini ve kaç parça olduğunu söyler. Sayılar ve bağlantılar
   `_harita.ts`ten (hikaye dosyalarından sayılır, elle yazılmaz). Sayı
   sütunu her satırda aynı genişlikte: alt alta sayılar hizalı okunur. */

/** preview.tsx → storySort ile aynı sıra: "ilk bileşen" kenar çubuğundaki ilk satır olsun. */
const COMPONENT_GROUPS = ["Temel", "Buton ve İkon", "Form Girişleri", "Seçim", "Gezinme", "Katmanlar", "Geri Bildirim", "Yükleme", "Veri", "Verimlilik", "Hareket ve Doku", "Tanıtım", "Yapay Zeka"] as const;
const THEME_ORDER = ["Renkler", "Paletler", "Tipografi", "Yüzeyler", "Grafik Renkleri", "Hareket"];
const SCREEN_ORDER = ["Uygulama", "Açılış Sayfası"];

type MapRow = { name: string; note: string; icon: LucideIcon; id: string; count?: string };
const count = (n: number, unit: string) => `${n.toLocaleString("tr-TR")} ${unit}`;

function mapSections(): { label: string; rows: MapRow[] }[] {
  const pusula = under("Pusula")[0];
  return [
    {
      label: "Başla",
      rows: [
        { name: "Başlangıç", note: "Manifesto, token'lar, kimlik kuralları", icon: Rocket, id: "start--overview" },
        { name: "Her Şey Bir Arada", note: "Bütün kütüphane tek uzun sayfada", icon: PanelsTopLeft, id: "showcase--all-in-one", count: count(TOTAL, "bileşen") },
        { name: "Vitrin", note: "Gruplara göre seçilmiş örnekler", icon: LayoutGrid, id: "gallery--overview", count: count(under("Vitrin")[0]?.stories ?? 0, "sayfa") },
      ],
    },
    {
      label: "Kütüphane",
      rows: [
        { name: "Tema", note: "Renk, palet, tipografi, yüzey, hareket", icon: Palette, id: firstOf(["Tema"], THEME_ORDER) ?? "colors--overview", count: count(under("Tema").length, "sayfa") },
        { name: "Bileşenler", note: "Temelden yapay zekaya, raf raf", icon: Blocks, id: firstOf(["Bileşenler"], COMPONENT_GROUPS) ?? "start--overview", count: count(COMPONENT_GROUPS.length, "grup") },
        { name: "Grafikler", note: "Çizgi, alan, huni, ısı haritası, pano", icon: ChartColumn, id: firstOf(["Grafikler"]) ?? "start--overview", count: count(under("Grafikler").length, "grafik") },
        { name: "Bloklar", note: "Birden çok bileşenin hazır birleşimi", icon: Layers, id: firstOf(["Bloklar"]) ?? "start--overview", count: count(under("Bloklar").length, "blok") },
        { name: "Desenler", note: "Önizle, kopyala: token'lı zeminler", icon: Grid3x3, id: "pattern-library--overview", count: count(PATTERN_PRESETS.length, "zemin") },
      ],
    },
    {
      label: "Uygulamada",
      rows: [
        { name: "Pusula", note: "Aynı parçalarla kurulmuş uygulama", icon: Compass, id: "demo-app--overview", count: count(pusula?.stories ?? 0, "ekran") },
        { name: "Ekranlar", note: "Uygulama ekranları ve açılış sayfası", icon: Monitor, id: firstOf(["Ekranlar"], SCREEN_ORDER) ?? "start--overview", count: count(under("Ekranlar").length, "şablon") },
        { name: "Arşiv", note: "Bileşen kapsamı ve referanslar", icon: Archive, id: "coverage--table" },
      ],
    },
  ];
}

function CatalogMap() {
  const reduce = useReducedMotion();
  const sections = mapSections();
  return (
    <m.nav
      aria-label="Katalog Haritası"
      {...(reduce ? {} : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 }, transition: { duration: DUR.page, ease: EASE } })}
      // Üç bölüm yan yana, eşit boy (kartlar `h-full`): yan yana duran şeyler aynı çizgide başlayıp biter.
      className="grid items-stretch gap-2 rounded-[1.75rem] bg-surface p-2 edge-lit lg:grid-cols-3"
    >
      {sections.map((section) => (
        <section key={section.label} aria-labelledby={`harita-${section.label}`} className="h-full rounded-[1.25rem] bg-overlay p-2 shadow-raised">
          <h2 id={`harita-${section.label}`} className="px-2.5 pt-1.5 pb-1 text-small font-medium text-muted">
            {section.label}
          </h2>
          <ul className="grid">
            {section.rows.map((row) => (
              <li key={row.name}>
                <a
                  href={to(row.id)}
                  target="_top"
                  className={cn("group grid min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-xl px-2.5 py-2 transition-colors duration-150 hover:bg-surface", FOCUS)}
                >
                  <span aria-hidden className="mt-0.5 grid size-8 place-items-center rounded-lg bg-primary-wash text-primary-ink [&_svg]:size-4">
                    <row.icon strokeWidth={1.9} />
                  </span>
                  {/* Üç sütunda dar: ad ile sayı aynı satırda (sayı sağa yaslı, alt alta hizalı), açıklama altında iki satıra kadar. */}
                  <span className="grid min-w-0 gap-0.5">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-base font-semibold text-strong">{row.name}</span>
                      {row.count ? <span className="shrink-0 text-small text-muted tabular-nums">{row.count}</span> : null}
                    </span>
                    <span className="line-clamp-2 text-small text-muted">{row.note}</span>
                  </span>
                  <ArrowUpRight aria-hidden className="mt-1 size-4 text-muted transition-[translate,color] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-strong" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </m.nav>
  );
}

/** Kabuğun arama kutusunu açar: kapaktan ayrılmadan bileşen, desen ya da ekran ara. */
function SearchLauncher({ compact = false }: { compact?: boolean }) {
  // Kabuk yoksa (hikaye tek başına, `iframe.html`) aranacak kenar çubuğu da yok: buton kabuğu açar.
  const inShell = typeof window !== "undefined" && window.top !== window && !!window.top?.document.getElementById("storybook-explorer-searchfield");
  const open = () => {
    if (!inShell) {
      window.location.href = "./?path=/story/cover--overview";
      return;
    }
    const field = window.top?.document.getElementById("storybook-explorer-searchfield") as HTMLInputElement | null;
    field?.focus();
    field?.select();
  };
  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        "flex items-center gap-3 rounded-full bg-overlay text-left text-muted shadow-raised ring-1 ring-inset ring-line transition-[box-shadow] duration-200 hover:shadow-floating",
        compact ? "min-h-11 w-11 justify-center sm:w-72 sm:justify-start sm:pr-1.5 sm:pl-3.5 text-small" : "min-h-12 w-full max-w-md pr-2 pl-4 text-base",
        FOCUS,
      )}
    >
      <Search aria-hidden className="size-4 shrink-0" />
      <span className={cn("min-w-0 flex-1 truncate", compact && "sr-only sm:not-sr-only")}>Bileşen, desen ya da ekran ara</span>
      <span aria-hidden className={cn("flex gap-1", compact && "hidden sm:flex")}>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </span>
    </button>
  );
}

/* ── Vitrin kolajı ──────────────────────────────────────────────────────
   İlk ekranın "ürün fotoğrafı": katalogdaki GERÇEK bileşenlerden kurulmuş,
   çalışan bir kompozisyon (sahte ekran görüntüsü yok). Solda Pusula'nın
   panosu (ölçü + alan grafiği), sağda üstte ekip oylaması, altta ayar
   kartı. Hepsi seçili palet ve temayla döner; oy verilir, anahtar açılır. */
/* Pusula'nın "bugünü" 2 Kasım: grafik son on iki TAM ay (Kas–Eki), bin ₺.
   Son ay (1.088) başlıktaki 30 günlük cironun (₺1,09 M) karşılığı; eskiden
   grafik ayda 118 bin gösteriyordu, başlıkla dokuz kat çelişiyordu. */
const MONTHS = ["Kas", "Ara", "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki"];
const THIS_YEAR = [640, 690, 580, 620, 710, 760, 830, 880, 840, 910, 1010, 1088];
const LAST_YEAR = [520, 560, 470, 500, 560, 600, 650, 700, 680, 720, 790, 860];

function Showcase() {
  const reduce = useReducedMotion();
  const [vote, setVote] = useState<string | null>(null);
  const [range, setRange] = useState("hafta");
  const tile = (step: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 }, transition: { duration: DUR.page, ease: EASE, delay: 0.35 + step * 0.1 } };
  return (
    <div className="relative isolate w-full rounded-[2rem] bg-surface p-2 text-left edge-lit sm:p-3">
      <div className="grid gap-2 sm:gap-3 lg:grid-cols-12 lg:grid-rows-[auto_auto]">
        <m.div {...tile(0)} className="min-w-0 lg:col-span-7 lg:row-span-2">
          {/* Pusula'nın kendi grafik paleti (paletin birincil renginden türer): pencere Pusula'yı gösteriyor. */}
          <AppWindow title="Pusula · Pano" icon={<Compass className="size-3.5" />} focused className="h-full" data-product="pusula">
            <div className="grid gap-4 p-4 sm:p-5">
              <dl className="grid grid-cols-3 divide-x divide-line-soft rounded-xl bg-surface">
                {[
                  ["Ciro", "₺1,09 M", "+%0,5", "success"],
                  ["Sipariş", "113", "+%16,5", "success"],
                  ["Dönüşüm", "%1,7", "+0,1 puan", "success"],
                ].map(([label, value, change]) => (
                  <div key={label} className="grid min-w-0 gap-1 px-3 py-3 sm:px-4">
                    <dt className="truncate text-small text-muted">{label}</dt>
                    <dd className="text-read font-semibold tracking-tight whitespace-nowrap text-strong tabular-nums sm:text-title">{value}</dd>
                    <dd>
                      <Badge tone="success">{change}</Badge>
                    </dd>
                  </div>
                ))}
              </dl>
              <AreaChart
                title="Aylık Ciro, Son 12 Ay ve Önceki 12 Ay"
                labels={MONTHS}
                series={[
                  { label: "Son 12 Ay", values: THIS_YEAR.map((v) => v * 1000), series: 1 },
                  { label: "Önceki 12 Ay", values: LAST_YEAR.map((v) => v * 1000), series: 2 },
                ]}
                // Eksen "₺1,5 Mn": "bin ₺" birimiyle kısaltma "1,5 B" (bin bin ₺) okunuyordu.
                valueFormat={{ style: "currency", currency: "TRY", notation: "compact", maximumFractionDigits: 1 }}
                height="h-52 lg:h-64"
              />
            </div>
          </AppWindow>
        </m.div>
        <m.section {...tile(1)} aria-label="Ekip Oylaması Örneği" className="min-w-0 rounded-[1.25rem] bg-overlay p-4 shadow-raised sm:p-5 lg:col-span-5">
          <QuickPoll
            question="Yeni sezonda hangi palet?"
            meta="Tasarım ekibi · cumaya kadar"
            options={[
              { id: "signature", label: "Signature · mavi" },
              { id: "jade", label: "Yeşim · yeşil" },
              { id: "iris", label: "İris · mor" },
            ]}
            counts={{ signature: 5, jade: 3, iris: 2 }}
            value={vote}
            onValueChange={setVote}
          />
        </m.section>
        <m.section {...tile(2)} aria-label="Ayar Kartı Örneği" className="grid min-w-0 content-between gap-4 rounded-[1.25rem] bg-overlay p-4 shadow-raised sm:p-5 lg:col-span-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-small text-muted">Haftalık Özet</p>
              <p className="mt-0.5 truncate text-base font-semibold text-strong">Pazartesi 09.00, ekibe</p>
            </div>
            <AvatarGroup size="sm" label="Alıcılar" people={[{ name: "Zeynep Kaya" }, { name: "Mert Aksoy" }, { name: "Selin Arslan" }, { name: "Can Demir" }]} />
          </div>
          <SegmentedControl
            aria-label="Özet Sıklığı"
            size="sm"
            value={range}
            onValueChange={setRange}
            options={[
              { value: "gun", label: "Günlük" },
              { value: "hafta", label: "Haftalık" },
              { value: "ay", label: "Aylık" },
            ]}
          />
          <div className="rounded-lg bg-surface px-4 py-1">
            <Switch label="Geciken Siparişleri Ekle" hint="Teslim tarihi geçenler özetin başında" defaultChecked />
          </div>
        </m.section>
      </div>
    </div>
  );
}

/* ── Kahraman: canlı palet turu ─────────────────────────────────────────
   Başlık "Tek Kimlik, On Palet" diyor; kahraman bunu GÖSTERİR. Rol
   değişkenleri (`--primary`, degradeler…) bu bölüme satır içi verilir:
   başlığın mürekkebi, butonlar, ışık ve alttaki kolaj (Pusula'nın grafik
   rengi dahil) seçilen paletle yeniden boyanır, kataloğun geri kalanı
   yerinde durur. Tur kendiliğinden döner; üstüne gelince önizler, tıklayınca
   palet bütün kataloğa (araç çubuğu global'i) geçer.

   Hareket kuralları: dönüş 3,6 sn'de bir, renk geçişi 600 ms (yalnız renk
   özellikleri). Tur ekrandan çıkınca, sekme gizlenince, imleç şeridin
   üstündeyken durur; "Durdur" butonu her an (WCAG 2.2.2). Hareketi azaltan
   kullanıcıda ve otomasyonda (OG görseli, play testleri: `navigator.webdriver`)
   tur, ışık ve eğim kapalı: sahne durağan ve kararlı. */
const TOUR_MS = 3600;
const TOUR = PALETTES.map((p) => p.value as PaletteName);
const AUTOMATED = typeof navigator !== "undefined" && navigator.webdriver === true;

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

const grade = (ratio: number) => (ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : "AA Büyük");
const ratioText = (ratio: number) => `${ratio.toFixed(1).replace(".", ",")}:1`;

const HERO_CSS = `
@layer base {
  /* Palet değişince renkler süzülür; transform/opacity geçişleri utility'lerde kalır (katman sırası). */
  .kapak-tour, .kapak-tour * { transition-property: color, background-color, border-color, fill, stroke, box-shadow, outline-color; transition-duration: 600ms; transition-timing-function: cubic-bezier(.22,1,.36,1); }
}
.kapak-spot { background: radial-gradient(560px circle at var(--mx, 50%) var(--my, 30%), var(--primary-wash), transparent 68%); opacity: var(--lit, 0); transition: opacity .5s; }
@keyframes kapak-drift-a { 0% { transform: translate3d(-8%, 0, 0) scale(1); } 100% { transform: translate3d(10%, 12%, 0) scale(1.15); } }
@keyframes kapak-drift-b { 0% { transform: translate3d(6%, 8%, 0) scale(1.1); } 100% { transform: translate3d(-12%, -4%, 0) scale(.95); } }
@keyframes kapak-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
/* Alan derinliği: numune varsayılan olarak SAKİN (soluk, buğulu, rengi kısık); imleç yaklaştıkça
   --focus 0'dan 1'e çıkar ve netleşir. Başlık tek odak kalır, yan parçalar gözü yormaz.
   backdrop-filter kullanılmaz: filtreli ebeveynin içinde bozuluyor. */
.kapak-spec { --focus: var(--rest, .55); opacity: calc(.38 + .62 * var(--focus)); filter: blur(calc((1 - var(--focus)) * var(--dof, 1.6px))) saturate(calc(.55 + .45 * var(--focus))); transition: opacity .5s cubic-bezier(.22,1,.36,1), filter .5s cubic-bezier(.22,1,.36,1); }
.kapak-spec figcaption { opacity: calc(var(--focus) * 1.8 - .8); transition: opacity .4s; }
.kapak-drift-a { animation: kapak-drift-a 16s cubic-bezier(.45,0,.55,1) infinite alternate; }
.kapak-drift-b { animation: kapak-drift-b 21s cubic-bezier(.45,0,.55,1) infinite alternate; }
.kapak-bob { animation: kapak-bob 9s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .kapak-drift-a, .kapak-drift-b, .kapak-bob { animation: none; } }`;

/* Numune katmanları: yakın büyük ve net, uzak küçük, soluk ve hafif buğulu.
   İmleçle kayma derinlikle orantılı (yakın çok, uzak az): göz bunu derinlik okur. */
const LAYER = {
  near: { depth: 22, scale: 0.96, dof: "1.2px" },
  mid: { depth: 13, scale: 0.88, dof: "1.7px" },
  far: { depth: 6, scale: 0.8, dof: "2.2px" },
} as const;

/** İmleçle derinliğine göre kayan sarmalayıcı. */
function Parallax({ depth, sx, sy, still, className, children }: { depth: number; sx: MotionValue<number>; sy: MotionValue<number>; still: boolean; className?: string; children: ReactNode }) {
  const x = useTransform(sx, (v) => v * depth);
  const y = useTransform(sy, (v) => v * depth * 0.7);
  return (
    <m.div className={className} style={still ? undefined : { x, y }}>
      {children}
    </m.div>
  );
}

/** Numune: kartın altında dosya adı, katalogdaki gerçek bileşen. */
function Specimen({ file, children, className }: { file: string; children: ReactNode; className?: string }) {
  return (
    <figure className={cn("grid justify-items-start gap-2", className)}>
      <div className="edge-lit rounded-[1.25rem] bg-overlay/95 p-3 shadow-floating ring-1 ring-inset ring-line-soft">{children}</div>
      <figcaption className="flex items-center gap-1.5 pl-1 font-mono text-micro text-muted">
        <span aria-hidden className="size-1 rounded-full bg-primary" />
        {file}.tsx
      </figcaption>
    </figure>
  );
}

function Hero({ palette, theme, onPalette }: { palette: PaletteName; theme: ThemeName; onPalette: (next: PaletteName) => void }) {
  const enter = useEnter();
  const reduce = useReducedMotion();
  const still = !!reduce || AUTOMATED;
  const sectionRef = useRef<HTMLElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const specRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* Tur durumu: gösterilen palet = üstüne gelinen ?? turdaki ?? kataloğunki. */
  const [playing, setPlaying] = useState(!still);
  const [index, setIndex] = useState(() => Math.max(0, TOUR.indexOf(palette)));
  const [hover, setHover] = useState<PaletteName | null>(null);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const running = playing && !hover && inView && pageVisible;
  const shown: PaletteName = hover ?? (playing ? TOUR[index] : palette);

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % TOUR.length), TOUR_MS);
    return () => window.clearTimeout(id);
  }, [running, index]);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    const onVis = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  useEffect(() => {
    if (!playing) setIndex(Math.max(0, TOUR.indexOf(palette)));
  }, [palette, playing]);

  /* "On Palet" mürekkebi: degrade geçiş yapamaz; eski paletin kopyası üstte söner. */
  const [ghost, setGhost] = useState<{ p: PaletteName; k: number } | null>(null);
  const last = useRef(shown);
  useEffect(() => {
    if (last.current === shown) return;
    if (!still) setGhost({ p: last.current, k: performance.now() });
    last.current = shown;
  }, [shown, still]);

  /* İmleç: arkadaki ışık imleci izler, numuneler derinliklerine göre kayar. */
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 80, damping: 18, mass: 0.8 });
  const sy = useSpring(py, { stiffness: 80, damping: 18, mass: 0.8 });
  function onMove(e: ReactPointerEvent<HTMLElement>) {
    if (still || e.pointerType !== "mouse") return;
    const light = lightRef.current;
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!light || !rect) return;
    const lr = light.getBoundingClientRect();
    light.style.setProperty("--mx", `${e.clientX - lr.left}px`);
    light.style.setProperty("--my", `${e.clientY - lr.top}px`);
    light.style.setProperty("--lit", "1");
    px.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    py.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
    // Odak: imlece en yakın numune netleşir (120 px içinde tam, 520 px'te dinlenme hali).
    for (const el of specRefs.current) {
      if (!el) continue;
      const b = el.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (b.left + b.width / 2), e.clientY - (b.top + b.height / 2));
      const f = Math.min(1, Math.max(0.55, 1 - ((d - 120) / 400) * 0.45));
      el.style.setProperty("--focus", f.toFixed(3));
    }
  }
  function onLeave() {
    for (const el of specRefs.current) el?.style.removeProperty("--focus");
    lightRef.current?.style.setProperty("--lit", "0");
    px.set(0);
    py.set(0);
  }

  /* Kolaj kaydırmayla doğrulur: 14° yatık ve hafif küçük gelir, ekranın üçte birinde düzleşir. */
  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: stageRef, offset: ["start end", "start 0.3"] });
  const tilt = useTransform(scrollYProgress, [0, 1], [14, 0]);
  const lift = useTransform(scrollYProgress, [0, 1], [0.94, 1]);

  /* Numunelerin kendi durumu: dokunulur, çalışır. */
  const [saved, setSaved] = useState(false);
  const [notify, setNotify] = useState(true);
  const [span, setSpan] = useState("hafta");
  useEffect(() => {
    if (!saved) return;
    const id = window.setTimeout(() => setSaved(false), 1600);
    return () => window.clearTimeout(id);
  }, [saved]);

  const sw = palettes[shown][theme];
  const ratio = contrast(sw.onPrimary, sw.primary);
  const title = PALETTES.find((p) => p.value === shown)?.title ?? shown;
  const previewing = shown !== palette;
  const activeIndex = TOUR.indexOf(shown);
  const ogCounts = `${TOTAL} bileşen · ${STORIES.toLocaleString("tr-TR")} hikaye · ${PALETTES.length} palet · 2 tema`;
  const bars = span === "gun" ? [44, 61, 38, 72, 55, 80, 66] : span === "hafta" ? [38, 52, 44, 66, 58, 74, 90] : [52, 48, 63, 70, 66, 84, 96];

  /* Altı numune, başlığın iki yanında üçer. Sıra: yakın → uzak dengeli dağılır. */
  const specimens: { at: string; layer: keyof typeof LAYER; rot: number; from: [number, number]; node: ReactNode }[] = [
    {
      at: "top-[2%] left-[3%]",
      layer: "mid",
      rot: -1.5,
      from: [320, 180],
      node: (
        <Specimen file="button">
          <button
            type="button"
            onClick={() => setSaved(true)}
            className={cn("inline-flex min-h-10 items-center gap-2 rounded-full bg-cta px-5 text-small font-semibold text-on-brand shadow-cta", PRESS, FOCUS)}
          >
            {saved ? <Check aria-hidden className="size-4" strokeWidth={2.5} /> : null}
            {saved ? "Kaydedildi" : "Değişiklikleri Kaydet"}
          </button>
        </Specimen>
      ),
    },
    {
      at: "top-[38%] -left-[2%]",
      layer: "near",
      rot: 1.5,
      from: [380, 0],
      node: (
        <Specimen file="area-chart">
          <div className="grid w-60 gap-3 p-1 text-left">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-small text-muted">Haftalık Ciro</span>
              <Badge tone="success">+%6,4</Badge>
            </div>
            <span className="font-display text-heading leading-none font-bold tracking-[-0.03em] text-strong">₺84.120</span>
            <div aria-hidden className="flex h-14 items-end gap-1.5">
              {bars.map((h, i) => (
                <span key={i} className={cn("flex-1 rounded-t-[0.3rem] transition-[height] duration-500 ease-out", i === bars.length - 1 ? "bg-primary" : "bg-primary-wash")} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </Specimen>
      ),
    },
    {
      at: "bottom-[0%] left-[7%]",
      layer: "far",
      rot: -1,
      from: [300, -160],
      node: (
        <Specimen file="avatar">
          <div className="flex items-center gap-3 pr-2">
            <AvatarGroup size="md" label="Düzenleyenler" people={[{ name: "Zeynep Kaya" }, { name: "Mert Aksoy" }, { name: "Selin Arslan" }, { name: "Can Demir" }]} />
            <span className="text-left text-small leading-tight">
              <span className="block font-semibold text-strong">4 kişi</span>
              <span className="text-muted">şu an düzenliyor</span>
            </span>
          </div>
        </Specimen>
      ),
    },
    {
      at: "top-[0%] right-[4%]",
      layer: "far",
      rot: 1.5,
      from: [-300, 180],
      node: (
        <Specimen file="switch">
          <div className="w-60 rounded-[0.7rem] bg-surface px-3 text-left">
            <Switch label="Bildirimler" hint={notify ? "Acil talepler anında gelir" : "Yalnız günlük özet"} checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          </div>
        </Specimen>
      ),
    },
    {
      at: "top-[40%] -right-[1%]",
      layer: "near",
      rot: -1.5,
      from: [-380, 0],
      node: (
        <Specimen file="contrast">
          <div className="grid w-52 gap-2 p-1 text-left">
            <span className="text-small text-muted">Birincil üstünde metin</span>
            <span className="flex items-center gap-2.5">
              <span aria-hidden className="grid size-10 place-items-center rounded-[0.7rem] bg-primary font-display text-base font-bold text-on-primary">Aa</span>
              <span className="grid">
                <SlotText text={ratioText(ratio)} className="font-display text-title leading-tight font-bold tracking-[-0.02em] text-strong" />
                <span className="text-micro font-semibold text-success">WCAG {grade(ratio)}</span>
              </span>
            </span>
          </div>
        </Specimen>
      ),
    },
    {
      at: "bottom-[2%] right-[8%]",
      layer: "mid",
      rot: 1,
      from: [-300, -160],
      node: (
        <Specimen file="segmented-control">
          <SegmentedControl
            aria-label="Grafik dönemi"
            size="sm"
            value={span}
            onValueChange={setSpan}
            options={[
              { value: "gun", label: "Gün" },
              { value: "hafta", label: "Hafta" },
              { value: "ay", label: "Ay" },
            ]}
          />
        </Specimen>
      ),
    },
  ];

  return (
    <section
      ref={sectionRef}
      aria-labelledby="kapak-baslik"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      // minmax(0,1fr): en geniş içerik sütunu ekrandan taşırmasın.
      className={cn("relative isolate grid grid-cols-[minmax(0,1fr)] justify-items-center gap-y-12 text-center", !still && "kapak-tour")}
      style={previewing ? paletteVars(shown, theme) : undefined}
    >
      <style href="kapak-hero" precedence="default">
        {HERO_CSS}
      </style>
      {/* Zemin: ızgara yok. Başlığın arkasında paletin iki yavaş bulutu, imleci izleyen ışık, soluk nokta dokusu. */}
      <div ref={lightRef} aria-hidden className="pointer-events-none absolute inset-x-[-14%] -top-40 -z-10 h-[60rem] overflow-hidden">
        <div className="kapak-drift-a absolute top-[10%] left-[30%] size-[34rem] rounded-full bg-primary opacity-[0.14] blur-[120px]" />
        <div className="kapak-drift-b absolute top-[26%] right-[24%] size-[26rem] rounded-full bg-primary-soft opacity-[0.16] blur-[110px]" />
        {/* Yörünge: başlığın arkasında ince eş merkezli halkalar, kenara doğru söner; numuneler bir yörüngede durur gibi. */}
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_46%_52%_at_50%_44%,var(--text-strong)_20%,transparent_75%)] opacity-45">
          <PatternBackground pattern="rings" size={84} tone="primary" intensity={0} />
        </div>
        <PatternBackground pattern="noise" tone="neutral" intensity={0} className="opacity-40" />
        <div className="kapak-spot absolute inset-0" />
      </div>

      <div className="relative grid w-full min-w-0 justify-items-center py-4 xl:py-20">
        {/* Numuneler başlığın arkasından saçılır (merkezden dışarı), sonra derinliklerinde süzülür. Geniş ekranda; dar ekranda başlık tek başına. */}
        {specimens.map((s, i) => {
          const layer = LAYER[s.layer];
          return (
            <Parallax key={i} depth={layer.depth} sx={sx} sy={sy} still={still} className={cn("absolute z-10 hidden xl:block", s.at, s.layer === "near" ? "z-20" : "")}>
              <div
                ref={(el) => {
                  specRefs.current[i] = el;
                }}
                className="kapak-spec"
                style={{ "--dof": layer.dof, "--rest": still ? 0.9 : 0.6 } as CSSProperties}
              >
              <m.div
                initial={still ? false : { opacity: 0, x: s.from[0], y: s.from[1], scale: 0.6, rotate: 0 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: layer.scale, rotate: s.rot }}
                whileHover={still ? undefined : { rotate: 0, scale: layer.scale * 1.03 }}
                transition={{ type: "spring", stiffness: 60, damping: 14, mass: 1, delay: still ? 0 : 0.55 + i * 0.07 }}
              >
                <div className="kapak-bob" style={{ animationDelay: `${-i * 1.3}s` }}>
                  {s.node}
                </div>
              </m.div>
              </div>
            </Parallax>
          );
        })}

        <m.p
          {...enter(1)}
          data-og-counts={ogCounts}
          className="relative z-30 inline-flex items-center gap-2 rounded-full bg-overlay/80 py-1 pr-3.5 pl-1.5 text-small text-body shadow-raised ring-1 ring-inset ring-line-soft backdrop-blur"
        >
          <span className="rounded-full bg-primary-wash px-2 py-0.5 font-semibold text-primary-ink">v{uiPackage.version}</span>
          Next 16 · React 19 · Tailwind v4
        </m.p>

        <h1
          id="kapak-baslik"
          className="relative z-30 mt-7 font-display text-[clamp(3.25rem,8.4vw,7.75rem)] leading-[0.9] font-bold tracking-[-0.06em] text-strong"
        >
          {/* İki satır, iki parça: "Tek Kimlik," sabit, "On Palet" paletle döner. Parçalar buğudan çıkar. */}
          <m.span
            className="block"
            initial={still ? false : { opacity: 0, y: 32, filter: "blur(14px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.85, ease: EASE, delay: 0.1 }}
          >
            Tek Kimlik,
          </m.span>{" "}
          <m.span
            className="relative block"
            initial={still ? false : { opacity: 0, y: 32, filter: "blur(14px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.85, ease: EASE, delay: 0.22 }}
          >
            <span className="display-ink pb-[0.08em]">On Palet</span>
            {ghost ? (
              <m.span
                key={ghost.k}
                aria-hidden
                className="display-ink pointer-events-none absolute inset-0 pb-[0.08em]"
                style={paletteVars(ghost.p, theme)}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
                onAnimationComplete={() => setGhost((g) => (g?.k === ghost.k ? null : g))}
              >
                On Palet
              </m.span>
            ) : null}
          </m.span>
        </h1>

        <m.p {...enter(4)} className="relative z-30 mt-7 max-w-[44ch] text-lead text-pretty text-body">
          Next 16 projeleri için kopyalanabilir bileşenler, desenler ve ekranlar. Her parça{" "}
          <MarkAnnotate type="underline" delay={900}>
            token&apos;dan
          </MarkAnnotate>{" "}
          çizilir; paleti değiştir, hepsi birlikte döner.
        </m.p>

        <m.div {...enter(5)} className="relative z-30 mt-9 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={to("showcase--all-in-one")}
            target="_top"
            className={cn(
              "group relative inline-flex min-h-12 items-center gap-2 overflow-hidden rounded-full bg-cta px-6 text-base font-semibold text-on-brand shadow-cta hover:-translate-y-px",
              PRESS,
              FOCUS,
            )}
          >
            {/* Işık süpürmesi: imleç gelince bir kez geçer. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full skew-x-[-20deg] bg-on-brand/25 blur-sm transition-[translate] duration-700 ease-out group-hover:translate-x-[380%]"
            />
            Bileşenleri Gez
            <ArrowRight aria-hidden strokeWidth={2.25} className="size-4 transition-[translate] duration-200 group-hover:translate-x-0.5" />
          </a>
          <a
            href={to("demo-app--overview")}
            target="_top"
            className={cn("inline-flex min-h-12 items-center rounded-full bg-overlay px-6 text-base font-semibold text-strong shadow-raised hover:-translate-y-px hover:shadow-floating", PRESS, FOCUS)}
          >
            Pusula&apos;yı Aç
          </a>
        </m.div>

        {/* Palet şeridi: turun göstergesi ve kumandası. Üstüne gel: önizle; tıkla: bütün katalog o paletle döner. */}
        <m.div {...enter(6)} className="relative z-30 mt-10 grid justify-items-center gap-2.5">
          <div className="flex max-w-full items-center gap-1 rounded-full bg-overlay/85 p-1.5 shadow-raised ring-1 ring-inset ring-line-soft backdrop-blur" onPointerLeave={() => setHover(null)}>
            <div role="group" aria-label="Palet önizlemesi" className="flex items-center gap-0.5 overflow-x-auto px-0.5 [scrollbar-width:none]">
              {TOUR.map((p, i) => (
                <button
                  key={p}
                  type="button"
                  aria-label={`${PALETTES[i].title} paletini kataloğa uygula`}
                  aria-pressed={p === palette}
                  onPointerEnter={(e) => e.pointerType === "mouse" && setHover(p)}
                  onFocus={() => setHover(p)}
                  onBlur={() => setHover(null)}
                  onClick={() => {
                    setPlaying(false);
                    setHover(null);
                    onPalette(p);
                  }}
                  className={cn("grid size-7 shrink-0 place-items-center rounded-full sm:size-9", FOCUS)}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "block rounded-full shadow-raised transition-[width,height,box-shadow] duration-300",
                      i === activeIndex ? "size-5 ring-2 ring-strong ring-offset-2 ring-offset-overlay sm:size-6" : "size-3.5 sm:size-4.5",
                    )}
                    style={{ backgroundImage: palettes[p][theme].brandGradient }}
                  />
                </button>
              ))}
            </div>
            <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-line" />
            <span className="hidden min-w-[7rem] items-baseline gap-1.5 text-left text-small sm:flex" aria-live="polite">
              <SlotText text={title} className="font-semibold text-strong" />
              <span className="text-muted">{previewing ? "önizleme" : "seçili"}</span>
            </span>
            <button
              type="button"
              onClick={() => setPlaying((v) => !v)}
              disabled={still}
              aria-label={playing ? "Palet turunu durdur" : "Palet turunu başlat"}
              className={cn("grid size-9 shrink-0 place-items-center rounded-full text-body hover:bg-surface hover:text-strong disabled:hidden", FOCUS)}
            >
              {playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
            </button>
          </div>
          <p className="text-small text-muted">
            <span className="hidden sm:inline">Üstüne gel, önizle · </span>Tıkla, bütün katalog o paletle döner
          </p>
        </m.div>
      </div>

      {/* build-og.mjs bu sarmalayıcıyı (`> div.mt-14`) yakalar: sınıfı ve yeri sabit. */}
      <div ref={stageRef} className="relative col-span-full mt-14 w-full [perspective:1800px] sm:mt-20">
        <m.div style={still ? undefined : { rotateX: tilt, scale: lift, transformOrigin: "50% 0%" }}>
          <Showcase />
        </m.div>
      </div>
    </section>
  );
}

/* ── Katalog haritası bölümü ───────────────────────────────────────────── */
function MapSection() {
  return (
    <section aria-labelledby="kapak-harita" className="grid gap-8">
      <Reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-2">
        <div className="grid gap-2">
          <h2 id="kapak-harita" className="font-display text-display font-bold text-strong">
            Katalogda Ne Var
          </h2>
          <p className="max-w-[58ch] text-read text-body">Kenar çubuğunun üç bölümü ve on bir kapısı; sayılar hikaye dosyalarından sayılır.</p>
        </div>
      </Reveal>
      <CatalogMap />
    </section>
  );
}

/* ── Palet numuneleri ───────────────────────────────────────────────────
   Boya kartelası gibi dik numuneler; seçilen yerinden yükselir. Hareket
   (yükselme) tek kanal değil: halka ve onay işareti de aynı şeyi söyler. */
function PaletteChips({ palette, theme, onPick, onTheme }: { palette: PaletteName; theme: ThemeName; onPick: (value: PaletteName) => void; onTheme: (next: ThemeName) => void }) {
  const title = PALETTES.find((p) => p.value === palette)?.title ?? "Signature";
  return (
    <section aria-labelledby="kapak-palet" className="grid gap-8">
      <Reveal className="grid gap-2">
        <h2 id="kapak-palet" className="font-display text-display font-bold text-strong">
          Paleti Seç, Katalog Dönsün
        </h2>
        <p className="max-w-[58ch] text-read text-body">
          Numuneye bas: tuval, sidebar ve belge aynı anda o paletle çizilir. Araç çubuğundaki Palet ile aynı ayar.
        </p>
      </Reveal>
      {/* İki eşit sütun, AYNI çerçeve ve AYNI boy: solda numune föyü, sağda on palet. Numuneler sütunun
          boyunu doldurur (eskiden sağ sütun föyün yarısında bitiyordu, "seçili" yazısı başlığın sağında
          havada kalıyordu; şimdi panelin kendi başlığında). */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8">
      <Stage palette={palette} theme={theme} onTheme={onTheme} />
      <Reveal className="flex h-full flex-col gap-3 rounded-[2rem] bg-surface p-3 edge-lit sm:p-4">
        <div className="flex items-baseline justify-between gap-3 px-1 pt-1">
          <p className="text-base font-semibold text-strong">{PALETTES.length} Palet</p>
          <p className="text-small text-muted">
            Seçili: <SlotText text={title} className="font-semibold text-primary-ink" />
          </p>
        </div>
        <div role="radiogroup" aria-label="Palet" className="grid flex-1 grid-cols-5 gap-2 sm:gap-3 lg:grid-rows-2">
          {PALETTES.map((p) => {
            const on = p.value === palette;
            const tones = palettes[p.value][theme];
            return (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={p.title}
                onClick={() => onPick(p.value)}
                className={cn(
                  "group flex flex-col gap-2 rounded-xl bg-overlay p-1.5 text-left shadow-raised hover:-translate-y-1 hover:shadow-floating",
                  PRESS,
                  FOCUS,
                  on && "-translate-y-1 shadow-floating ring-2 ring-primary hover:-translate-y-1 sm:-translate-y-2 sm:hover:-translate-y-2",
                )}
              >
                {/* Marka karosu: degradenin izinli üç yerinden biri. */}
                <span aria-hidden className="relative block aspect-[4/5] rounded-lg sm:aspect-[3/4] lg:aspect-auto lg:min-h-24 lg:flex-1" style={{ backgroundImage: tones.brandGradient }}>
                  <span
                    className={cn(
                      "absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-overlay text-strong transition-[opacity,scale] duration-200",
                      on ? "scale-100 opacity-100" : "scale-90 opacity-0",
                    )}
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                </span>
                <span aria-hidden className="hidden min-w-0 px-1 pb-1 sm:grid">
                  <span className="truncate text-small font-medium text-strong">{p.title}</span>
                  <span className="truncate font-mono text-micro text-muted">{tones.primary}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Reveal>
      </div>
    </section>
  );
}

/* ── Bileşen grupları ───────────────────────────────────────────────────
   Kenar çubuğundaki on üç rafın hepsi bir bakışta: adı, kaç bileşen olduğu
   ve içindeki ilk birkaç parça. "Aradığım şey nerede" sorusu kapakta
   biter; kart grubun ilk bileşenini açar. */
const GROUP_NOTES: Record<(typeof COMPONENT_GROUPS)[number], string> = {
  Temel: "Her ekranın harfleri",
  "Buton ve İkon": "Basılan her şey",
  "Form Girişleri": "Aynı etiket, yardım ve hata düzeni",
  Seçim: "Anında etki eden kararlar",
  Gezinme: "Nerede, nereye gidebilir",
  Katmanlar: "Sayfanın üstüne açılanlar",
  "Geri Bildirim": "Durum, uyarı, doluluk",
  Yükleme: "Beklemenin biçimleri",
  Veri: "Tablo, liste, sayı, ağaç",
  Verimlilik: "Pano, görev, hafta",
  "Hareket ve Doku": "Her hareket bir şey söyler",
  Tanıtım: "Açılış sayfasının parçaları",
  "Yapay Zeka": "Asistan ne yaptığını gösterir",
};

function ComponentGroups() {
  // On üç bileşen rafı + Grafikler ve Bloklar: 15 kart, üç sütunda beş tam satır (son satırda tek kart kalmıyordu).
  const shelves = [
    ...COMPONENT_GROUPS.map((g) => ({ name: g, path: ["Bileşenler", g], note: GROUP_NOTES[g] })),
    { name: "Grafikler", path: ["Grafikler"], note: "Seri rengi yalnız --chart-*" },
    { name: "Bloklar", path: ["Bloklar"], note: "Birden çok bileşenin birleşimi" },
  ];
  return (
    <section aria-labelledby="kapak-gruplar" className="grid gap-8">
      <Reveal className="grid gap-2">
        <h2 id="kapak-gruplar" className="font-display text-display font-bold text-strong">
          Her Parça Kendi Rafında
        </h2>
        <p className="max-w-[58ch] text-read text-body">
          {shelves.length} raf, kenar çubuğundaki sırayla; sayı o raftaki sayfa. Karta bas: rafın ilk sayfası açılır.
        </p>
      </Reveal>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shelves.map((shelf, i) => {
          const list = under(...shelf.path);
          const names = [...new Set(list.map((c) => c.path[shelf.path.length]).filter(Boolean))];
          return (
            <li key={shelf.name}>
              <RevealItem index={i % 6} className="h-full">
                <a
                  href={to(firstOf(shelf.path) ?? "start--overview")}
                  target="_top"
                  className={cn("group grid h-full content-start gap-3 rounded-2xl bg-surface p-4 transition-[background-color] duration-200 hover:bg-surface-raised", FOCUS)}
                >
                  <span className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
                    <span className="min-w-0">
                      <span className="block truncate font-display text-title font-semibold text-strong">{shelf.name}</span>
                      <span className="block truncate text-small text-muted">{shelf.note}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-display text-title font-semibold text-strong tabular-nums">{list.length}</span>
                      <span className="block text-micro text-muted">sayfa</span>
                    </span>
                  </span>
                  <span className="line-clamp-2 text-small text-body">
                    {names.slice(0, 5).join(" · ")}
                    {names.length > 5 ? ` ve ${names.length - 5} daha` : ""}
                  </span>
                </a>
              </RevealItem>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Install() {
  const ways: [string, string, string][] = [
    ["01", "Kaynak Olarak", "Bileşen senin olur, bağımlılıklarıyla gelir; istediğin gibi değiştirirsin."],
    ["02", "Paket Olarak", `${KIT_COUNT} bileşen tek kurulumla; güncellemeyi sürüm taşır.`],
  ];
  return (
    <section aria-labelledby="kapak-kur" className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
      <Reveal className="grid gap-6">
        <h2 id="kapak-kur" className="font-display text-display font-bold text-strong">
          İki Yoldan Projeye Al
        </h2>
        <ol className="grid gap-5">
          {ways.map(([mark, title, note]) => (
            <li key={mark} className="grid grid-cols-[auto_1fr] gap-x-4 border-t border-line pt-4">
              <span className="font-mono text-small text-muted">{mark}</span>
              <span>
                <span className="block text-read font-semibold text-strong">{title}</span>
                <span className="mt-0.5 block max-w-[44ch] text-base text-body">{note}</span>
              </span>
            </li>
          ))}
        </ol>
      </Reveal>
      {/* min-h: terminal yazdıkça uzar; yer baştan ayrılır ki altındaki künye satırı zıplamasın. */}
      <Reveal delay={0.08} className="min-h-64 min-w-0">
        <Terminal
          title="~/yeni-proje"
          lines={[
            { kind: "comment", text: "kaynak olarak, bağımlılıklarıyla" },
            { kind: "command", text: "node ~/dev-starter/scripts/add-ui.mjs . terminal dial" },
            { kind: "output", text: "+ terminal.tsx, dial.tsx, copy-button.tsx, digit-roll.tsx", tone: "success" },
            { kind: "comment", text: "ya da paket olarak" },
            { kind: "command", text: "npm i @ahmetakyapi/ui @ahmetakyapi/theme" },
            { kind: "output", text: `+ @ahmetakyapi/ui@${uiPackage.version}`, tone: "success" },
          ]}
        />
      </Reveal>
    </section>
  );
}

function Colophon() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-line pt-6 font-mono text-small text-muted">
      <p className="flex items-center gap-2">
        <BrandMark className="size-5" />
        dev-starter · @ahmetakyapi/ui {uiPackage.version}
      </p>
      <p>Next 16 · React 19 · Tailwind v4 · motion</p>
    </footer>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-page text-body">
      <div className="mx-auto grid max-w-[78rem] gap-24 px-5 pt-6 pb-12 sm:px-8 lg:gap-32 lg:px-10 lg:pt-8">{children}</div>
    </div>
  );
}

const meta = {
  title: "Tanıtım",
  id: "cover",
  parameters: { layout: "fullscreen", docs: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  name: "Tanıtım",
  render: function Render() {
    const [globals, updateGlobals] = useGlobals();
    const palette = (String(globals.palette ?? "signature") in palettes ? String(globals.palette ?? "signature") : "signature") as PaletteName;
    const theme: ThemeName = ["dark", "Koyu"].includes(String(globals.theme)) ? "dark" : "light";
    const setTheme = (next: ThemeName) => updateGlobals({ theme: next });
    return (
      <Frame>
        <div className="grid gap-10 lg:gap-14">
          <Masthead />
          {(() => {
            // GEÇİCİ: yeni yönlerin önizlemesi (?hero=f|g|h|i|j); seçim yapılınca kalkar.
            const key = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("hero") : null;
            const Alt = key && key in HEROES ? HEROES[key as keyof typeof HEROES] : null;
            const onPalette = (value: PaletteName) => updateGlobals({ palette: value });
            return Alt ? <Alt palette={palette} theme={theme} onPalette={onPalette} showcase={<Showcase />} /> : <Hero palette={palette} theme={theme} onPalette={onPalette} />;
          })()}
        </div>
        <MapSection />
        <ComponentGroups />
        <PaletteChips palette={palette} theme={theme} onPick={(value) => updateGlobals({ palette: value })} onTheme={setTheme} />
        <Install />
        <Colophon />
      </Frame>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.ownerDocument.documentElement;
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Tek Kimlik, On Palet");
    // fireEvent: userEvent odağı karoya taşır ve sayfayı kaydırır; kapak açılışta
    // en üstte kalmalı. Sınama sonunda ziyaretçinin paleti (adresten gelen) geri yüklenir.
    const initial = PALETTES.find((p) => p.value === root.dataset.palette) ?? PALETTES[0];
    const other = initial.value === "jade" ? "Kobalt" : "Yeşim";
    await fireEvent.click(canvas.getByRole("radio", { name: other }));
    // Palet global'i kabuk üzerinden döner; yük altında bir saniyeyi aşabiliyor (kapak Yeşim'de kalıyordu).
    await waitFor(() => expect(root.dataset.palette).toBe(other === "Yeşim" ? "jade" : "cobalt"), { timeout: 5000 });
    await waitFor(() => expect(canvas.getByRole("radio", { name: other })).toBeChecked());
    await fireEvent.click(canvas.getByRole("radio", { name: initial.title }));
    await waitFor(() => expect(root.dataset.palette).toBe(initial.value), { timeout: 5000 });
  },
};
