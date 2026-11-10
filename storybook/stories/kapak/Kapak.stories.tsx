import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, ArrowUpRight, Check, Inbox } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { useGlobals } from "storybook/preview-api";
import { expect, fireEvent, waitFor, within } from "storybook/test";
import { Reveal, RevealItem } from "@/components/motion/Reveal";
import { AppWindow } from "@/components/ui/app-window";
import { Badge } from "@/components/ui/badge";
import { BarList } from "@/components/ui/bar-list";
import { Dial } from "@/components/ui/dial";
import { MarkAnnotate } from "@/components/ui/mark-annotate";
import { PATTERN_PRESETS, PatternBackground } from "@/components/ui/pattern-bg";
import { SlotText } from "@/components/ui/slot-text";
import { Switch } from "@/components/ui/switch";
import { Terminal } from "@/components/ui/terminal";
import { DUR, EASE, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { palettes } from "../../../packages/@ahmet/theme/tokens";
import uiPackage from "../../../packages/@ahmet/ui/package.json";
import { PALETTES } from "../../.storybook/palettes";
import { GROUPS } from "../amiral/_data";
import { KIT_COUNT, STORY_COUNT, TOTAL, inGroup } from "../amiral/_kapsam";

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
  const links: [string, string][] = [
    ["Başlangıç", "start--overview"],
    ["Bileşenler", "showcase--all-in-one"],
    ["Desenler", "pattern-library--overview"],
    ["Pusula", "demo-app--overview"],
  ];
  return (
    <m.header {...enter(0, 0)} className="flex items-center justify-between gap-4">
      {/* Marka karosu burada YOK: kabuğun sidebar'ında hemen solda duruyor, iki işaret yan yana tekrar olurdu. */}
      <p className="flex items-center gap-2.5">
        <span className="text-read font-semibold tracking-tight text-strong">Görsel Katalog</span>
        <span className="rounded-full bg-surface px-2 py-0.5 font-mono text-micro text-muted tabular-nums">v{uiPackage.version}</span>
      </p>
      <nav aria-label="Katalog" className="hidden items-center gap-1 md:flex">
        {links.map(([label, id]) => (
          <a
            key={id}
            href={to(id)}
            target="_top"
            className={cn("rounded-full px-3 py-1.5 text-base text-body transition-colors duration-150 hover:bg-surface hover:text-strong", FOCUS)}
          >
            {label}
          </a>
        ))}
      </nav>
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

function Hero({ palette, theme, onTheme }: { palette: PaletteName; theme: ThemeName; onTheme: (next: ThemeName) => void }) {
  const enter = useEnter();
  return (
    <section aria-labelledby="kapak-baslik" className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-16">
      <div className="grid justify-items-start">
        <m.p {...enter(1)} className="font-mono text-small text-muted">
          {TOTAL} bileşen · {PALETTES.length} palet · 2 tema
        </m.p>
        <m.h1
          {...enter(2, 24)}
          id="kapak-baslik"
          className="mt-5 font-display text-[clamp(3.25rem,8.2vw,6.5rem)] leading-[0.92] font-bold tracking-[-0.05em] text-strong"
        >
          Tek Kimlik, <span className="display-ink block pb-[0.08em]">On Palet</span>
        </m.h1>
        <m.p {...enter(4)} className="mt-6 max-w-[44ch] text-lead text-pretty text-body">
          Next 16 projeleri için kopyalanabilir bileşenler, desenler ve ekranlar. Her parça{" "}
          <MarkAnnotate type="underline" delay={900}>
            token&apos;dan
          </MarkAnnotate>{" "}
          çizilir, paletle birlikte döner.
        </m.p>
        <m.div {...enter(5)} className="mt-8 flex flex-wrap gap-3">
          <a
            href={to("showcase--all-in-one")}
            target="_top"
            className={cn("group inline-flex min-h-12 items-center gap-2 rounded-full bg-cta px-6 text-base font-semibold text-on-brand shadow-cta hover:-translate-y-px", PRESS, FOCUS)}
          >
            Bileşenleri Gez
            <ArrowRight aria-hidden strokeWidth={2.25} className="size-4 transition-[translate] duration-200 group-hover:translate-x-0.5" />
          </a>
          <a
            href={to("demo-app--overview")}
            target="_top"
            className={cn("inline-flex min-h-12 items-center rounded-full bg-overlay px-6 text-base font-semibold text-strong shadow-raised hover:-translate-y-px hover:shadow-floating", PRESS, FOCUS)}
          >
            Örnek Uygulamayı Aç
          </a>
        </m.div>
      </div>
      <Stage palette={palette} theme={theme} onTheme={onTheme} />
    </section>
  );
}

/* ── Palet numuneleri ───────────────────────────────────────────────────
   Boya kartelası gibi dik numuneler; seçilen yerinden yükselir. Hareket
   (yükselme) tek kanal değil: halka ve onay işareti de aynı şeyi söyler. */
function PaletteChips({ palette, theme, onPick }: { palette: PaletteName; theme: ThemeName; onPick: (value: PaletteName) => void }) {
  const title = PALETTES.find((p) => p.value === palette)?.title ?? "Signature";
  return (
    <section aria-labelledby="kapak-palet" className="grid gap-8">
      <Reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
        <div className="grid gap-2">
          <h2 id="kapak-palet" className="font-display text-display font-bold text-strong">
            Paleti Seç, Katalog Dönsün
          </h2>
          <p className="max-w-[58ch] text-read text-body">
            Numuneye bas: tuval, sidebar ve belge aynı anda o paletle çizilir. Araç çubuğundaki Palet ile aynı ayar.
          </p>
        </div>
        <p className="font-mono text-small text-muted">
          seçili: <SlotText text={title} className="text-primary-ink" />
        </p>
      </Reveal>
      <Reveal>
        <div role="radiogroup" aria-label="Palet" className="grid grid-cols-5 gap-2 pt-2 sm:gap-3 lg:grid-cols-10">
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
                  "group grid gap-2 rounded-xl bg-overlay p-1.5 text-left shadow-raised hover:-translate-y-1 hover:shadow-floating",
                  PRESS,
                  FOCUS,
                  on && "-translate-y-1 shadow-floating ring-2 ring-primary hover:-translate-y-1 sm:-translate-y-2 sm:hover:-translate-y-2",
                )}
              >
                {/* Marka karosu: degradenin izinli üç yerinden biri. */}
                <span aria-hidden className="relative block aspect-[4/5] rounded-lg sm:aspect-[3/4]" style={{ backgroundImage: tones.brandGradient }}>
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
    </section>
  );
}

function Figures() {
  const items: [number, string, string][] = [
    [TOTAL, "Bileşen", "hepsi kaynak olarak kopyalanır"],
    [STORY_COUNT, "Hikâye", "her biri açık ve koyu temada"],
    [PALETTES.length, "Palet", "tek token mimarisinde"],
    [KIT_COUNT, "Paket Bileşeni", "@ahmetakyapi/ui içinde"],
  ];
  return (
    <dl className="grid grid-cols-2 gap-y-10 border-t border-line pt-10 lg:grid-cols-4">
      {items.map(([n, label, note], i) => (
        <RevealItem key={label} index={i} className="grid content-start gap-1 pr-4 lg:border-l lg:border-line lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
          <dt className="order-2 mt-2 text-base font-medium text-strong">{label}</dt>
          <dd className="order-1 font-display text-[clamp(2.75rem,5.4vw,4.25rem)] leading-none font-semibold tracking-[-0.045em] text-strong tabular-nums">
            {n.toLocaleString("tr-TR")}
          </dd>
          <dd className="order-3 text-small text-muted">{note}</dd>
        </RevealItem>
      ))}
    </dl>
  );
}

/* ── Nereden başlamalı: dört kapı, her birinin içinde kendi parçası ───── */
function DoorCard({
  index,
  id,
  mark,
  title,
  note,
  className,
  children,
}: {
  index: number;
  id: string;
  mark: string;
  title: string;
  note: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <RevealItem index={index} className={className}>
      <a
        href={to(id)}
        target="_top"
        className={cn("group grid h-full grid-rows-[1fr_auto] gap-2 rounded-[1.75rem] bg-surface p-2 edge-lit transition-[background-color] duration-200 hover:bg-surface-raised", FOCUS)}
      >
        <div
          aria-hidden
          inert
          className="relative h-52 overflow-hidden rounded-[1.25rem] bg-overlay shadow-raised transition-[translate,box-shadow] duration-300 group-hover:-translate-y-0.5 group-hover:shadow-floating"
        >
          {children}
        </div>
        <div className="flex items-end justify-between gap-4 px-3 pt-2 pb-3">
          <div className="min-w-0">
            <p className="font-mono text-micro text-muted">{mark}</p>
            <h3 className="mt-1 font-display text-title font-semibold text-strong">{title}</h3>
            <p className="mt-0.5 text-base text-body">{note}</p>
          </div>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-overlay text-strong shadow-raised transition-[translate,background-color,color] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-primary group-hover:text-on-primary">
            <ArrowUpRight className="size-4" strokeWidth={2.25} />
          </span>
        </div>
      </a>
    </RevealItem>
  );
}

function Doors() {
  const groups = GROUPS.map((g) => ({ label: g.title, value: inGroup(g.id).length }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);
  const patterns = ["noktalar", "izgara", "halkalar"].map((key) => PATTERN_PRESETS.find((p) => p.id === key)).filter((p) => p !== undefined);
  const samples = patterns.length === 3 ? patterns : PATTERN_PRESETS.filter((p) => p.props.pattern && p.props.pattern !== "none").slice(0, 3);
  return (
    <section aria-labelledby="kapak-kapilar" className="grid gap-8">
      <Reveal className="grid gap-2">
        <h2 id="kapak-kapilar" className="font-display text-display font-bold text-strong">
          Nereden Başlamalı
        </h2>
        <p className="max-w-[58ch] text-read text-body">Dört kapı. Kuralları oku, bütün kütüphaneyi tek sayfada gör, bir zemin seç ya da aynı parçalarla kurulmuş uygulamayı dolaş.</p>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
        <DoorCard index={0} id="showcase--all-in-one" mark="01" title="Her Şey Bir Arada" note={`${TOTAL} bileşen tek sayfada, tek kurgunun verisiyle.`} className="lg:col-span-7">
          <div className="p-4 pt-3">
            <BarList title="Gruplara Göre Bileşen Sayısı" items={groups} columns={["Grup", "Bileşen"]} series={2} />
          </div>
        </DoorCard>
        <DoorCard index={1} id="start--overview" mark="02" title="Başlangıç" note="Manifesto, token'lar ve kimlik kuralları." className="lg:col-span-5">
          <div className="flex h-full items-end justify-between gap-4 p-5">
            <p className="display-ink font-display text-[7.5rem] leading-[0.8] font-bold tracking-[-0.06em]">Aa</p>
            <ul className="grid gap-1.5 pb-1 text-right font-mono text-micro text-muted">
              <li className="font-display text-base font-semibold text-strong">Schibsted Grotesk</li>
              <li className="font-sans text-base text-body">Inter</li>
              <li>JetBrains Mono</li>
            </ul>
          </div>
        </DoorCard>
        <DoorCard index={2} id="pattern-library--overview" mark="03" title="Desen Kütüphanesi" note={`${PATTERN_PRESETS.length} token'lı zemin; önizle, kopyala.`} className="lg:col-span-5">
          <div className="grid h-full grid-cols-3 gap-1.5 p-1.5">
            {samples.map((s) => (
              <div key={s.id} className="relative isolate overflow-hidden rounded-lg bg-surface">
                <PatternBackground {...s.props} tone="primary" intensity={0.8} />
              </div>
            ))}
          </div>
        </DoorCard>
        <DoorCard index={3} id="demo-app--overview" mark="04" title="Pusula Paneli" note="Aynı parçalarla kurulmuş bir uygulama." className="lg:col-span-7">
          <div className="relative h-full bg-surface-sunken">
            <AppWindow title="Gelen Kutusu" icon={<Inbox className="size-3.5" />} focused className="absolute inset-x-6 top-6 h-64">
              <ul className="grid grid-cols-1 text-small">
                {[
                  ["Siparişimiz hâlâ teslim edilmedi", "PSL-1186", "Açık"],
                  ["Kasım faturasında KDV iki kez yansımış", "PSL-1185", "Bekliyor"],
                  ["Toplu yenileme için teklif rica ediyoruz", "PSL-1184", "Yanıtlandı"],
                ].map(([subject, code, state]) => (
                  <li key={code} className="flex items-center justify-between gap-3 border-b border-line-soft px-3 py-2.5 last:border-0">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-strong">{subject}</span>
                      <span className="font-mono text-micro text-muted">{code}</span>
                    </span>
                    <Badge tone={state === "Açık" ? "primary" : state === "Bekliyor" ? "warning" : "success"}>{state}</Badge>
                  </li>
                ))}
              </ul>
            </AppWindow>
          </div>
        </DoorCard>
      </div>
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
  title: "Kapak",
  id: "cover",
  parameters: { layout: "fullscreen", docs: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  name: "Kapak",
  render: function Render() {
    const [globals, updateGlobals] = useGlobals();
    const palette = (String(globals.palette ?? "signature") in palettes ? String(globals.palette ?? "signature") : "signature") as PaletteName;
    const theme: ThemeName = ["dark", "Koyu"].includes(String(globals.theme)) ? "dark" : "light";
    const setTheme = (next: ThemeName) => updateGlobals({ theme: next });
    return (
      <Frame>
        <div className="grid gap-10 lg:gap-14">
          <Masthead />
          <Hero palette={palette} theme={theme} onTheme={setTheme} />
        </div>
        <PaletteChips palette={palette} theme={theme} onPick={(value) => updateGlobals({ palette: value })} />
        <Figures />
        <Doors />
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
    await waitFor(() => expect(root.dataset.palette).toBe(other === "Yeşim" ? "jade" : "cobalt"));
    await waitFor(() => expect(canvas.getByRole("radio", { name: other })).toBeChecked());
    await fireEvent.click(canvas.getByRole("radio", { name: initial.title }));
    await waitFor(() => expect(root.dataset.palette).toBe(initial.value));
  },
};
