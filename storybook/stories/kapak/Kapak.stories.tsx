import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import "../showcase/pusula.css";
import { Archive, Blocks, CodeXml, Compass as CompassIcon, SwatchBook, ChartColumn, Check, Compass, Grid3x3, Layers, LayoutGrid, LayoutTemplate, Monitor, Palette, PanelsTopLeft, Rocket, Search, type LucideIcon } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { useGlobals } from "storybook/preview-api";
import { expect, fireEvent, waitFor, within } from "storybook/test";
import { Reveal, RevealItem } from "@/components/motion/Reveal";
import { AppWindow } from "@/components/ui/app-window";
import { AreaChart } from "@/components/ui/area-chart";
import { CategoryCard, CategoryGrid, type CategoryTone } from "@/components/ui/category-card";
import { AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DemoFrame } from "@/components/ui/demo-frame";
import { Dial } from "@/components/ui/dial";
import { GlideLink } from "@/components/ui/glide-link";
import { LikeButton } from "@/components/ui/like-button";
import { ProfileIntro } from "@/components/ui/profile-intro";
import { RulerToc } from "@/components/ui/ruler-toc";
import { ScrollFocus } from "@/components/ui/scroll-focus";
import { ShotCard } from "@/components/ui/shot-card";
import { Tabs } from "@/components/ui/tabs";
import { Kbd } from "@/components/ui/kbd";
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
import { KIT_COUNT, STORY_COUNT, TOTAL } from "../amiral/_kapsam";
import { testOnly } from "../_lib/testOnly";
import { SCENES } from "../_lib/sahneler";
import { Hero } from "./_hero";
import { firstOf, under } from "./_harita";

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
        { name: "Desenler", note: "Önizle, kopyala: token'lı zeminler", icon: Grid3x3, id: "pattern-library--overview", count: count(PATTERN_PRESETS.length, "zemin") },
      ],
    },
    {
      label: "Kütüphane",
      rows: [
        { name: "Tema", note: "Renk, palet, tipografi, yüzey, hareket", icon: Palette, id: firstOf(["Tema"], THEME_ORDER) ?? "colors--overview", count: count(under("Tema").length, "sayfa") },
        { name: "Bileşenler", note: "Temelden yapay zekaya, raf raf", icon: Blocks, id: firstOf(["Bileşenler"], COMPONENT_GROUPS) ?? "start--overview", count: count(COMPONENT_GROUPS.length, "grup") },
        { name: "Grafikler", note: "Çizgi, alan, huni, ısı haritası, pano", icon: ChartColumn, id: firstOf(["Grafikler"]) ?? "start--overview", count: count(under("Grafikler").length, "grafik") },
        { name: "Bloklar", note: "Birden çok bileşenin hazır birleşimi", icon: Layers, id: firstOf(["Bloklar"]) ?? "start--overview", count: count(under("Bloklar").length, "blok") },
      ],
    },
    {
      label: "Uygulamada",
      rows: [
        { name: "Pusula", note: "Aynı parçalarla kurulmuş uygulama", icon: Compass, id: "demo-app--overview", count: count(pusula?.stories ?? 0, "ekran") },
        { name: "Ekranlar", note: "Uygulama ekranları ve açılış sayfası", icon: Monitor, id: firstOf(["Ekranlar"], SCREEN_ORDER) ?? "start--overview", count: count(under("Ekranlar").length, "şablon") },
        { name: "Örnek Sayfalar", note: "Kahraman sahneleri, panolar, entegrasyonlar, yardım merkezi", icon: LayoutTemplate, id: "sample-heroes--atmosphere", count: count(under("Ekranlar", "Örnek Sayfalar").length, "sayfa") },
        { name: "Arşiv", note: "Bileşen kapsamı ve referanslar", icon: Archive, id: "coverage--table" },
      ],
    },
  ];
}

const SECTION_TONE: Record<string, CategoryTone> = { Başla: "primary", Kütüphane: "chart-2", Uygulamada: "chart-3" };

function CatalogMap() {
  const reduce = useReducedMotion();
  const sections = mapSections();
  return (
    <m.nav
      aria-label="Katalog Haritası"
      {...(reduce ? {} : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.15 }, transition: { duration: DUR.page, ease: EASE } })}
      className="grid gap-6"
    >
      {sections.map((section) => (
        <section key={section.label} aria-labelledby={`harita-${section.label}`} className="grid gap-3">
          <h2 id={`harita-${section.label}`} className="flex items-center gap-2 text-small font-medium text-muted">
            <span aria-hidden className={cn("size-2 rounded-full", section.label === "Başla" ? "bg-primary" : section.label === "Kütüphane" ? "bg-chart-2" : "bg-chart-3")} />
            {section.label}
          </h2>
          <CategoryGrid className="lg:grid-cols-4">
            {section.rows.map((row) => (
              <CategoryCard
                key={row.name}
                href={to(row.id)}
                title={row.name}
                description={row.note}
                meta={row.count ?? "Aç"}
                icon={<row.icon strokeWidth={1.9} />}
                tone={SECTION_TONE[section.label] ?? "neutral"}
              />
            ))}
          </CategoryGrid>
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
    <div className="relative isolate w-full rounded-[1.75rem] bg-page/85 p-2 text-left shadow-floating ring-1 ring-inset ring-line-soft backdrop-blur-sm sm:p-3">
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
                title="Aylık Ciro: Son 12 Ay ve Önceki 12 Ay"
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

/* ── Katalog haritası bölümü ───────────────────────────────────────────── */
function MapSection() {
  return (
    <section aria-labelledby="kapak-harita" className="grid gap-8">
      <Reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-2">
        <div className="grid gap-2">
          <h2 id="kapak-harita" className="font-display text-display font-bold text-strong">
            Katalogda Ne Var
          </h2>
          <p className="max-w-[58ch] text-read text-body">Kenar çubuğunun üç bölümü ve on iki kapısı; sayılar hikaye dosyalarından sayılır.</p>
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

/* ── Sakin Akış kapağı (27 Kasım 2026) ───────────────────────────────────
   Kataloğun ilk ekranı kişisel bir sayfa gibi: dar sütun, profil açılışı
   (işaret, ad, tazelik, tek koyu eylem, anlamına göre oynayan ikonlar), üç
   kısa paragraf ve altı çizili kapılar; altında sekmeler (Akış · Harita ·
   Paletler · Kurulum). Akış kartlarının sahnesi gerçek bileşenler, kaydırdıkça
   buğudan netleşir. Sergi kahramanı "Sergi" hikayesinde duruyor (OG görseli
   oradan üretilir). Yön: knowledge/design-directions.md → sakin-akis. */

/** Tazelik satırı: sürüm çıkarken (`/release`) güncellenir; uydurma tarih yazılmaz. */
const UPDATED = "2026-11-27";
const REPO = "https://github.com/ahmetakyapi/dev-starter";

function CalmShots() {
  // Sahneler kendi kendine oynayan ürün ekranları (stories/_lib/sahneler.tsx): kuyuya ölçeklenir, kaydırdıkça buğudan netleşir.
  const likes = [64, 31, 18, 22];
  return (
    <div className="grid gap-12">
      {SCENES.map((s, i) => (
        <ScrollFocus key={s.id}>
          <ShotCard title={s.title} description={s.description} meta={s.meta} titleAs="h3" fit={s.fit} ratio={s.ratio} tone={s.tone} actions={<LikeButton count={likes[i] ?? 9} />}>
            {s.render()}
          </ShotCard>
        </ScrollFocus>
      ))}
    </div>
  );
}

/* Harita: kartlı dev ızgara yerine sakin satır listesi (ikon karosu, ad, soluk not, sayı). */
function CalmMap() {
  return (
    <nav aria-label="Katalog Haritası" className="grid gap-8">
      {mapSections().map((section) => (
        <div key={section.label} className="grid gap-2">
          <h2 className="px-3 text-small text-soft">{section.label}</h2>
          <ul className="grid gap-1">
            {section.rows.map((row) => (
              <li key={row.id}>
                <a
                  href={to(row.id)}
                  target="_top"
                  className={cn("grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors duration-200 hover:bg-surface", FOCUS)}
                >
                  <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-surface text-muted ring-1 ring-line-soft">
                    <row.icon className="size-4" strokeWidth={1.8} />
                  </span>
                  <span className="grid min-w-0">
                    <span className="truncate text-base text-strong">{row.name}</span>
                    <span className="truncate text-small text-muted">{row.note}</span>
                  </span>
                  {row.count && <span className="text-small whitespace-nowrap text-soft tabular-nums">{row.count}</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/* Paletler: Lab çerçevesinde on numune (yerel radyo, oklarla gezilir) + tema anahtarı. */
function CalmPalettes({ palette, theme, onPick, onTheme }: { palette: PaletteName; theme: ThemeName; onPick: (value: PaletteName) => void; onTheme: (next: ThemeName) => void }) {
  const current = PALETTES.find((p) => p.value === palette) ?? PALETTES[0];
  const values = palettes[palette][theme];
  return (
    <div className="grid gap-12">
      <DemoFrame title="On palet, iki tema." description="Numuneye bas: tuval, kenar çubuğu ve belge aynı anda o paletle çizilir.">
        <div className="grid w-full max-w-sm justify-items-center gap-5 rounded-2xl bg-overlay p-5 shadow-raised ring-1 ring-line">
          <fieldset className="grid justify-items-center gap-3">
            <legend className="sr-only">Palet</legend>
            <div className="grid grid-cols-5 gap-2.5">
              {PALETTES.map((p) => (
                <label key={p.value} className="relative grid cursor-pointer place-items-center" title={p.title}>
                  <input type="radio" name="kapak-palet" value={p.value} checked={p.value === palette} onChange={() => onPick(p.value as PaletteName)} aria-label={p.title} className="peer sr-only" />
                  <span
                    aria-hidden
                    className="size-8 rounded-full ring-1 ring-line ring-offset-2 ring-offset-overlay transition-[scale,box-shadow] duration-200 peer-checked:ring-2 peer-checked:ring-strong peer-focus-visible:ring-2 peer-focus-visible:ring-line-focus hover:scale-105"
                    style={{ backgroundColor: palettes[p.value as PaletteName][theme].primary }}
                  />
                </label>
              ))}
            </div>
          </fieldset>
          <p className="flex items-center gap-2 text-small">
            <span className="text-strong">{current.title}</span>
            <span className="font-mono text-soft">{values.primary}</span>
          </p>
          <div className="w-full rounded-lg bg-surface px-4 py-1">
            <Switch label="Koyu Tema" checked={theme === "dark"} onChange={(e) => onTheme(e.currentTarget.checked ? "dark" : "light")} />
          </div>
        </div>
      </DemoFrame>
      <DemoFrame title="Rol renkleri." description="Birincil, üstü ve yıkanmış ton paletle birlikte döner; değerler token dosyasından." size="sm">
        <div className="flex flex-wrap justify-center gap-2">
          <span className="rounded-full bg-primary px-3 py-1 text-small text-on-primary">Birincil</span>
          <span className="rounded-full bg-primary-wash px-3 py-1 text-small text-primary-ink">Yıkanmış</span>
          <span className="rounded-full bg-surface px-3 py-1 text-small text-strong ring-1 ring-line">Yüzey</span>
        </div>
      </DemoFrame>
    </div>
  );
}

/* Kurulum: terminal Lab çerçevesinde, künye iki yolu tek cümlede söyler. */
function CalmInstall() {
  return (
    <DemoFrame title="İki yoldan projeye al." description={`Kaynak olarak bağımlılıklarıyla ya da ${KIT_COUNT} bileşenlik paket olarak.`} size="lg">
      <div className="w-full max-w-lg min-h-56">
        <Terminal
          title="~/yeni-proje"
          lines={[
            { kind: "comment", text: "kaynak olarak, bağımlılıklarıyla" },
            { kind: "command", text: "node ~/dev-starter/scripts/add-ui.mjs . shot-card profile-intro" },
            { kind: "output", text: "+ shot-card.tsx, profile-intro.tsx, animated-icon.tsx", tone: "success" },
            { kind: "comment", text: "ya da paket olarak" },
            { kind: "command", text: "npm i @ahmetakyapi/ui @ahmetakyapi/theme" },
            { kind: "output", text: `+ @ahmetakyapi/ui@${uiPackage.version}`, tone: "success" },
          ]}
        />
      </div>
    </DemoFrame>
  );
}

function CalmCover({ palette, theme, onPick, onTheme }: { palette: PaletteName; theme: ThemeName; onPick: (value: PaletteName) => void; onTheme: (next: ThemeName) => void }) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-page text-body">
      <RulerToc
        label="Kapakta"
        sections={[
          { id: "kapak-giris", label: "Hoş geldin" },
          { id: "kapak-sekmeler", label: "Katalog" },
          { id: "kapak-kunye", label: "Künye" },
        ]}
      />
      <main className="mx-auto grid max-w-3xl gap-16 px-5 pt-14 pb-12 sm:px-8 sm:pt-20">
        <section id="kapak-giris" aria-label="Hoş geldin" className="mx-auto w-full max-w-[34rem]">
          <ProfileIntro
            name="dev-starter"
            avatar={<BrandMark className="size-full rounded-none shadow-none" />}
            updated={UPDATED}
            cta={{ label: "Kataloğa Başla", href: to("showcase--all-in-one"), target: "_top" }}
            links={[
              { label: "Kod Deposu", href: REPO, icon: CodeXml, motion: "spin" },
              { label: "Örnek Uygulama", href: to("demo-app--overview"), icon: CompassIcon, motion: "wiggle", target: "_top" },
              { label: "Paletler", href: to("cover--exhibit"), icon: SwatchBook, motion: "bounce", target: "_top" },
            ]}
          >
            <p>Kişisel geliştirme ekosistemi: yeni proje başlatmak, tema uygulamak ve yayına çıkmak buradan başlar.</p>
            <p>
              {TOTAL} bileşen, {STORY_COUNT} hikaye, {PALETTES.length} palet ve iki tema; hepsi tek token mimarisinden. Kod, metin ve görsel
              kopyalanmaz, her şey token&rsquo;la yazılır.
            </p>
            <p>
              Örnek sayfalar:{" "}
              <GlideLink href={to("demo-app--overview")} target="_top">
                Pusula
              </GlideLink>
              ,{" "}
              <GlideLink href={to("demo-app--landing")} target="_top">
                Tanıtım
              </GlideLink>
              ,{" "}
              <GlideLink href={to("demo-app--portfolio")} target="_top">
                Portfolyo
              </GlideLink>
              ,{" "}
              <GlideLink href={to("showcase--all-in-one")} target="_top">
                Her Şey Bir Arada
              </GlideLink>
              .
            </p>
          </ProfileIntro>
        </section>
        <section id="kapak-sekmeler" aria-label="Katalog" className="grid gap-8">
          <Tabs
            aria-label="Kapak Bölümleri"
            className="mx-auto"
            items={[
              { value: "akis", label: "Akış", panel: <CalmShots /> },
              { value: "harita", label: "Harita", panel: <CalmMap /> },
              { value: "paletler", label: "Paletler", panel: <CalmPalettes palette={palette} theme={theme} onPick={onPick} onTheme={onTheme} /> },
              { value: "kurulum", label: "Kurulum", panel: <CalmInstall /> },
            ]}
          />
        </section>
        <div id="kapak-kunye">
          <Colophon />
        </div>
      </main>
    </div>
  );
}

export const Overview: Story = {
  name: "Tanıtım",
  render: function Render() {
    const [globals, updateGlobals] = useGlobals();
    const palette = (String(globals.palette ?? "signature") in palettes ? String(globals.palette ?? "signature") : "signature") as PaletteName;
    const theme: ThemeName = ["dark", "Koyu"].includes(String(globals.theme)) ? "dark" : "light";
    return <CalmCover palette={palette} theme={theme} onPick={(value) => updateGlobals({ palette: value })} onTheme={(next) => updateGlobals({ theme: next })} />;
  },
  // Yalnız test koşusunda: arayüzde sekme kendi kendine değişmesin (ziyaretçi ilk ekranda Akış'ı görür).
  play: testOnly(async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("dev-starter");
    await expect(canvas.getByRole("link", { name: "Kataloğa Başla" })).toHaveAttribute("target", "_top");
    await fireEvent.click(canvas.getByRole("tab", { name: "Paletler" }));
    await expect(await canvas.findByRole("radio", { name: "Yeşim" })).toBeInTheDocument();
    await fireEvent.click(canvas.getByRole("tab", { name: "Harita" }));
    await expect(await canvas.findByRole("navigation", { name: "Katalog Haritası" })).toBeInTheDocument();
  }),
};

export const Exhibit: Story = {
  name: "Sergi",
  render: function Render() {
    const [globals, updateGlobals] = useGlobals();
    const palette = (String(globals.palette ?? "signature") in palettes ? String(globals.palette ?? "signature") : "signature") as PaletteName;
    const theme: ThemeName = ["dark", "Koyu"].includes(String(globals.theme)) ? "dark" : "light";
    const setTheme = (next: ThemeName) => updateGlobals({ theme: next });
    return (
      <Frame>
        <div className="grid gap-10 lg:gap-14">
          <Masthead />
          <Hero palette={palette} theme={theme} onPalette={(value) => updateGlobals({ palette: value })} showcase={<Showcase />} />
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
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Tek Kimlik On Palet");
    // fireEvent: userEvent odağı karoya taşır ve sayfayı kaydırır; kapak açılışta
    // en üstte kalmalı. Sınama sonunda ziyaretçinin paleti (adresten gelen) geri yüklenir.
    // Palet global'i Storybook kanalından döner; Vitest'te (taşınabilir hikaye) kanal yok, bu adım atlanır.
    if (typeof (globalThis as { __vitest_browser__?: unknown }).__vitest_browser__ !== "undefined") return;
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
