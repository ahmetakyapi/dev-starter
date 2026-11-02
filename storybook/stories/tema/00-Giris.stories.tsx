import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, ArrowUpRight, CreditCard, MousePointerClick, UserPlus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { ChartCard, ChartLegend } from "@/components/ui/chart-card";
import { CopyButton } from "@/components/ui/copy-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StageBars } from "@/components/ui/stage-bars";
import { Switch } from "@/components/ui/switch";
import { TrackBarChart } from "@/components/ui/track-bar-chart";
import { palettes } from "../../../packages/@ahmet/theme/tokens";
import { expect, userEvent, within } from "storybook/test";
import { DocPage, Note, Section, Token, storyHref } from "./_lib/doc";

/* Kataloğun vitrin yüzü. Kompozisyondaki her parça gerçek snippet
   bileşeni; renkler toolbar'daki tema ve paletle döner. */

const WEEK = [
  { label: "Pzt", value: 42 },
  { label: "Sal", value: 58 },
  { label: "Çar", value: 51 },
  { label: "Per", value: 73 },
  { label: "Cum", value: 66 },
  { label: "Cmt", value: 31 },
  { label: "Paz", value: 24 },
];

function Composition() {
  const [range, setRange] = useState<"gun" | "hafta" | "ay">("hafta");
  return (
    <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr] lg:items-start">
      <ChartCard
        id="giris-huni"
        label="Kayıt Hunisi"
        value="%10,5"
        change={2.4}
        changeLabel="geçen aya göre"
        action={
          <SegmentedControl
            aria-label="Zaman Aralığı"
            size="sm"
            value={range}
            onValueChange={setRange}
            options={[
              { value: "gun", label: "Gün" },
              { value: "hafta", label: "Hafta" },
              { value: "ay", label: "Ay" },
            ]}
          />
        }
        footer={
          <ChartLegend
            className="px-1 pb-1"
            items={[
              { label: "Ziyaret", value: 11800, series: 1, unit: "kişi" },
              { label: "Kayıt", value: 7900, series: 2, unit: "kişi" },
              { label: "Aktif", value: 4310, series: 3, unit: "kişi" },
              { label: "Ücretli", value: 1240, series: 4, unit: "kişi" },
            ]}
          />
        }
      >
        <StageBars
          title="Kayıt Hunisi"
          stages={[
            { label: "Ziyaret", value: 11800, icon: <MousePointerClick /> },
            { label: "Kayıt", value: 7900, icon: <UserPlus /> },
            { label: "Aktif", value: 4310 },
            { label: "Ücretli", value: 1240, icon: <CreditCard /> },
          ]}
        />
      </ChartCard>
      <div className="grid gap-3">
        <div className="rounded-xl bg-surface p-2">
          <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-2">
            <div>
              <p className="text-small font-medium text-muted">Seans Takvimi</p>
              <p className="mt-1 text-title font-semibold text-strong">Perşembe, 14.30</p>
            </div>
            <Badge tone="success" dot>
              Onaylandı
            </Badge>
          </div>
          <div className="rounded-lg bg-overlay px-4 py-1 shadow-raised">
            <Switch label="Hatırlatma gönder" hint="Seanstan bir saat önce SMS" defaultChecked />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 pt-3 pb-2">
            <AvatarGroup size="sm" label="Katılımcılar" people={[{ name: "Derya Aksoy" }, { name: "Kerem Yıldız" }, { name: "Selin Başaran" }]} />
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">
                Ertele
              </Button>
              <Button variant="primary" size="sm">
                Başlat
              </Button>
            </div>
          </div>
        </div>
        <ChartCard id="giris-hafta" label="Haftalık Seans" value="345" change={6.1} changeLabel="geçen haftaya göre">
          <TrackBarChart title="Haftalık Seans" data={WEEK} series={1} height="h-28" />
        </ChartCard>
      </div>
    </div>
  );
}

const PRINCIPLES = [
  { t: "Nötr sistem", d: "Zemin, metin ve çizgi gri. Renk yalnızca paletten ve veriden gelir." },
  { t: "Derinlik tondan", d: "Gri kuyu, beyaz karo. Gölge yalnızca gerçekten yüzen katmanda." },
  { t: "Degrade üç yerde", d: "Kısa başlık, tek birincil eylem, marka karosu. Hepsi tek aile." },
  { t: "Tek eğri", d: "Her geçiş cubic-bezier(0.22, 1, 0.36, 1); hareketi azaltana saygı." },
];

/* Tema sayfaları: her kartın küçük bir canlı önizlemesi var. */
const THEME_PAGES: { id: string; title: string; text: string; preview: ReactNode }[] = [
  {
    id: "tema-renkler--renkler",
    title: "Renkler",
    text: "Sistem rolleri iki temada, WCAG oranlarıyla.",
    preview: (
      <div className="flex items-end gap-1.5">
        <span className="size-8 rounded-md border border-line bg-page" />
        <span className="size-8 rounded-md bg-surface" />
        <span className="size-8 rounded-md bg-surface-raised" />
        <span className="grid size-8 place-items-center rounded-md text-small font-semibold text-strong">Aa</span>
        <span className="grid size-8 place-items-center rounded-md text-small font-semibold text-muted">Aa</span>
      </div>
    ),
  },
  {
    id: "tema-paletler--butun-paletler",
    title: "Paletler",
    text: "On palet; CTA, karo ve display başlık.",
    preview: (
      <div className="flex gap-1">
        {Object.values(palettes).map((p, i) => (
          <span key={i} className="h-8 w-3.5 rounded-full" style={{ backgroundImage: p.light.brandGradient }} />
        ))}
      </div>
    ),
  },
  {
    id: "tema-tipografi--tipografi",
    title: "Tipografi",
    text: "Rol adlı punto ölçeği ve font presetleri.",
    preview: (
      <p className="flex items-baseline gap-2 text-strong">
        <span className="text-display font-semibold tracking-[-0.04em]">Ağ</span>
        <span className="text-title font-medium">Ağ</span>
        <span className="text-small">Ağ</span>
      </p>
    ),
  },
  {
    id: "tema-yüzeyler--yuzeyler",
    title: "Yüzeyler",
    text: "Sayfa, kuyu, karo, katman; köşe ve gölge.",
    preview: (
      <div className="w-24 rounded-lg bg-surface p-1.5">
        <div className="h-4 rounded-sm bg-overlay shadow-raised" />
        <div className="mt-1 h-4 rounded-sm bg-overlay shadow-raised" />
      </div>
    ),
  },
  {
    id: "tema-grafik-renkleri--grafik-renkleri",
    title: "Grafik Renkleri",
    text: "Altı seri, iz ve mürekkep.",
    preview: (
      <div className="flex h-9 items-end gap-1">
        {["bg-chart-1 h-9", "bg-chart-2 h-6", "bg-chart-3 h-7", "bg-chart-4 h-4", "bg-chart-5 h-5", "bg-chart-6 h-8"].map((c) => (
          <span key={c} className={`w-3 rounded-sm ${c}`} />
        ))}
      </div>
    ),
  },
  {
    id: "tema-hareket--hareket",
    title: "Hareket",
    text: "İmza eğrisi, süreler, yaylar.",
    preview: (
      <svg viewBox="0 0 60 36" className="h-9 w-16">
        <path d="M 2 34 C 15 2, 22 2, 58 2" className="stroke-primary" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
];

const OTHER = [
  { t: "Bileşenler", d: "Düğmeden diyaloğa; her biri durumları ve klavye davranışıyla." },
  { t: "Grafikler", d: "ChartCard kuyusunda, lejant karolarıyla on bir grafik." },
  { t: "Bloklar", d: "Uygulama kabuğu, sohbet, giriş, ayarlar: birleşmiş parçalar." },
  { t: "Ekranlar", d: "Şablonların tam sayfaları, iki temada." },
];

const STEPS = [
  {
    t: "Bileşeni projeye al",
    d: "Paket değil kaynak: dosyayı components/ui altına kopyala ya da komutu çalıştır.",
    code: "/snippet chart-card\n# ya da\ncp ~/dev-starter/snippets/ui/chart-card.tsx components/ui/",
  },
  {
    t: "Paleti seç",
    d: "Şablonda signature hazır. Diğerleri palettes.css'te; html'e bir öznitelik yeter.",
    code: '/* app/globals.css */\n@import "tailwindcss";\n@import "./palettes.css";\n\n<html data-palette="cobalt" data-theme="light">',
  },
  {
    t: "Yazı tipini bağla",
    d: "Board dilinin preseti Inter + JetBrains Mono; latin-ext ile Türkçe harfler tam.",
    code: '// app/layout.tsx\nimport { fontClass } from "./fonts";\n<html className={fontClass("board")}>',
  },
];

function GirisSayfasi() {
  return (
    <DocPage>
      <header className="grid gap-10">
        <div className="max-w-4xl">
          <p className="font-mono text-small text-muted">dev-starter · görsel katalog</p>
          <h1 className="mt-5 text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.98] font-semibold tracking-[-0.045em] text-strong">
            Sakin yüzey, <span className="display-ink">renkli veri.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lead text-body">
            Ekosistemin bütün arayüzleri tek bir dille konuşur: beyaz sayfa, gri kuyu, içinde beyaz karolar. Arayüz geri çekilir, renk
            yalnızca veride ve tek bir birincil eylemde kalır. Bu katalogdaki her şey projeye kopyalanan gerçek kaynak.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <a href={storyHref("tema-renkler--renkler")} target="_top" className={buttonClass({ variant: "brand", size: "lg" })}>
              Temayı İncele <ArrowRight />
            </a>
            <a href="#kurulum" className={buttonClass({ variant: "secondary", size: "lg" })}>
              Kurulum
            </a>
          </div>
        </div>
        <section aria-labelledby="kompozisyon">
          <h2 id="kompozisyon" className="sr-only">
            Canlı Kompozisyon
          </h2>
          <Composition />
        </section>
        <Note>
          Toolbar'dan temayı ve paleti değiştir: kompozisyon gerçek bileşenlerden, anında döner.
        </Note>
      </header>

      <Section id="ilkeler" title="Dört İlke" description="Kararların gerekçesi knowledge/decisions.md → Board Görsel Dili.">
        <ol className="grid gap-2 rounded-2xl bg-surface p-2 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((p, i) => (
            <li key={p.t} className="rounded-xl bg-overlay p-5 shadow-raised">
              <p className="font-mono text-small text-muted tabular-nums">0{i + 1}</p>
              <p className="mt-6 text-title font-semibold tracking-[-0.02em] text-strong">{p.t}</p>
              <p className="mt-2 text-base text-body">{p.d}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="tema" title="Tema" description="Token'ların kendisi: değerler kaynaktan okunur, oranlar hesaplanır.">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {THEME_PAGES.map((page) => (
            <li key={page.id}>
              <a
                href={storyHref(page.id)}
                target="_top"
                className="group flex h-full flex-col rounded-2xl bg-surface p-2 transition-colors hover:bg-surface-raised"
              >
                <span aria-hidden className="grid h-28 place-items-center rounded-xl bg-overlay shadow-raised">
                  {page.preview}
                </span>
                <span className="flex items-start justify-between gap-3 px-3 pt-4 pb-3">
                  <span>
                    <span className="block text-title font-semibold text-strong">{page.title}</span>
                    <span className="mt-1 block text-base text-body">{page.text}</span>
                  </span>
                  <ArrowUpRight
                    aria-hidden
                    className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-strong"
                  />
                </span>
              </a>
            </li>
          ))}
        </ul>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {OTHER.map((o) => (
            <li key={o.t} className="rounded-2xl border border-line p-5">
              <p className="text-base font-semibold text-strong">{o.t}</p>
              <p className="mt-1.5 text-small text-body">{o.d}</p>
              <p className="mt-3 text-micro text-muted">Kenar çubuğunda</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="kurulum"
        title="Kurulum"
        description={
          <>
            Next 16 + Tailwind v4 şablonunda üç adım. Bağımlılıklar yalnızca <Token>@/lib/utils</Token>, <Token>@/lib/motion</Token>, token
            sınıfları ve <Token>lucide-react</Token>.
          </>
        }
      >
        <ol className="grid gap-3 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.t} className="flex min-w-0 flex-col rounded-2xl bg-surface p-2">
              <div className="px-3 pt-3 pb-4">
                <p className="font-mono text-small text-muted">Adım {i + 1}</p>
                <p className="mt-2 text-title font-semibold text-strong">{s.t}</p>
                <p className="mt-1.5 text-base text-body">{s.d}</p>
              </div>
              <div className="relative mt-auto rounded-xl bg-overlay shadow-raised">
                <pre className="overflow-x-auto p-4 pr-12 font-mono text-small leading-relaxed text-strong" tabIndex={0} aria-label={`Adım ${i + 1} kodu`}>
                  <code>{s.code}</code>
                </pre>
                <div className="absolute top-0 right-0">
                  <CopyButton value={s.code} label={`Adım ${i + 1} kodunu kopyala`} className="size-11" />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Section>
    </DocPage>
  );
}

const meta = {
  title: "Giriş",
  component: GirisSayfasi,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Kataloğun vitrini: board dilinin manifestosu, gerçek bileşenlerden canlı kompozisyon, bölümler ve kurulum özeti.",
      },
    },
  },
} satisfies Meta<typeof GirisSayfasi>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Giris: Story = {
  name: "Giriş",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const month = canvas.getByRole("radio", { name: "Ay" });
    await userEvent.click(month);
    await expect(month).toHaveAttribute("aria-checked", "true");
  },
};
