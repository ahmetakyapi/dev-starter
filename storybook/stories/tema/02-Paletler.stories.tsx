import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";
import { palettes, roles, type PaletteName } from "../../../packages/@ahmet/theme/tokens";
import { formatRatio, ratioOn, worstOnGradient } from "./_lib/color";
import { DocPage, Note, PageHero, Section, ThemeLabel, Token } from "./_lib/doc";
import { ThemeScope, useRootAttr, useRootVar, type ThemeName } from "./_lib/scope";

/* Değerler `tokens.ts → palettes`ten; kartların içindeki düğme, karo ve
   degrade başlık GERÇEK sınıflarla (`bg-cta`, `bg-brand`, `.display-ink`)
   o paletin kapsamında çizilir. Kullanım notları guides/00-brand-identity.md. */

const INFO: Record<PaletteName, { title: string; use: string }> = {
  signature: { title: "Signature", use: "Varsayılan. Finans, veri, editoryal; Açılış Zili'nin lacivert → mavi ailesi." },
  cobalt: { title: "Kobalt", use: "Parlak mavi. SaaS, pano, üretkenlik aracı." },
  violet: { title: "Menekşe", use: "Yaratıcı araç, yapay zekâ ürünü, topluluk." },
  rose: { title: "Gül", use: "Tüketici uygulaması, sosyal, yaşam tarzı." },
  ruby: { title: "Yakut", use: "Medya, spor, etkinlik. Yıkıcı eylem yine danger." },
  tangerine: { title: "Mandalina", use: "Yemek, alışveriş, enerjik tanıtım." },
  jade: { title: "Yeşim", use: "Finans, sağlık, sürdürülebilirlik." },
  verdant: { title: "Zümrüt", use: "Sağlık, terapi, doğa; gündüz, sakin." },
  ember: { title: "Kehribar", use: "Oyun, eğlence, topluluk; gece." },
  iris: { title: "İris", use: "Mor → indigo. Yaratıcı araç, yapay zekâ ürünü." },
};

const ORDER: PaletteName[] = ["signature", "cobalt", "violet", "rose", "ruby", "tangerine", "jade", "verdant", "ember", "iris"];

function Row({ color, label, value }: { color?: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <dt className="flex min-w-0 items-center gap-2 text-small text-muted">
        {color ? <span aria-hidden className="size-3.5 shrink-0 rounded-[4px] border border-line" style={{ background: color }} /> : null}
        {label}
      </dt>
      <dd className="font-mono text-micro whitespace-nowrap text-strong tabular-nums">{value}</dd>
    </div>
  );
}

function PaletteHalf({ name, theme }: { name: PaletteName; theme: ThemeName }) {
  const p = palettes[name][theme];
  const ctaWorst = worstOnGradient("#ffffff", p.ctaGradient);
  const inkOnWash = ratioOn(p.primaryInk, roles[theme].pageBg, p.primaryWash);
  return (
    <ThemeScope theme={theme} palette={name} className="flex flex-col gap-5 p-5">
      <div className="flex items-center justify-between">
        <ThemeLabel theme={theme} />
        <span aria-hidden className="size-9 rounded-md bg-brand shadow-raised" />
      </div>
      <p className="display-ink text-heading font-semibold tracking-[-0.03em]">Gün Sonu Raporu</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="brand" size="sm" tabIndex={-1}>
          Hesap Aç
        </Button>
        <span className="rounded-full bg-primary-wash px-2.5 py-1 text-small font-medium text-primary-ink">Yeni</span>
      </div>
      <dl className="divide-y divide-line-soft rounded-lg bg-surface px-3 py-1">
        <Row color={p.primary} label="Primary" value={p.primary} />
        <Row color={p.primaryInk} label="Ink" value={p.primaryInk} />
        <Row color={p.primaryWash} label="Wash" value={p.primaryWash} />
        <Row label="CTA metni, en kötü durak" value={ctaWorst ? formatRatio(ctaWorst) : "—"} />
        <Row label="Ink, wash üstünde" value={inkOnWash ? formatRatio(inkOnWash) : "—"} />
      </dl>
    </ThemeScope>
  );
}

function PaletteCard({ name }: { name: PaletteName }) {
  const info = INFO[name];
  return (
    <article aria-labelledby={`palet-${name}`} className="flex flex-col overflow-hidden rounded-2xl border border-line">
      <header className="flex items-start justify-between gap-4 p-5">
        <div>
          <h3 id={`palet-${name}`} className="text-title font-semibold text-strong">
            {info.title}
          </h3>
          <p className="mt-1 text-base text-body">{info.use}</p>
        </div>
        <Token className="shrink-0">{name}</Token>
      </header>
      <div className="grid flex-1 sm:grid-cols-2">
        <PaletteHalf name={name} theme="light" />
        <PaletteHalf name={name} theme="dark" />
      </div>
    </article>
  );
}

function PaletlerSayfasi() {
  return (
    <DocPage>
      <PageHero
        eyebrow="Tema / Paletler"
        title="On palet, tek kimlik."
        lead="Palet yalnızca vurgu ailesini ve degradeleri değiştirir; zemin, metin ve durum renkleri sistemde kalır. Her palet iki temada ölçülür: CTA'nın beyaz metni her durakta, ink kendi wash'ı üstünde AA."
      >
        <div className="mt-8 flex flex-wrap gap-2" aria-hidden>
          {ORDER.map((n) => (
            <span key={n} className="h-3 w-10 rounded-full" style={{ backgroundImage: palettes[n].light.brandGradient }} />
          ))}
        </div>
      </PageHero>

      <Section
        id="paletler"
        title="Bütün Paletler"
        description={
          <>
            Seçim <Token>{'<html data-palette="cobalt">'}</Token> ile; şablon <Token>app/palettes.css</Token>i taşır. Kararsız kalınca{" "}
            <Token>signature</Token> + açık tema.
          </>
        }
      >
        <div className="grid gap-5 xl:grid-cols-2">
          {ORDER.map((name) => (
            <PaletteCard key={name} name={name} />
          ))}
        </div>
      </Section>

      <Section
        id="disiplin"
        title="Degrade Üç Yerde"
        description="Degrade kısa display başlıkta, ekranın tek birincil eyleminde ve marka karosunda. Veri yüzeyi ve gövde metni düz renk; degradeler tek aile içinde kalır."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { cls: ".display-ink", text: "Kısa başlık; küçük puntoda -tight." },
            { cls: "bg-cta text-on-brand", text: "Ekranda bir kez. Diğer vurgulu düğmeler primary." },
            { cls: "bg-brand", text: "Logo karosu. Açık ucu beyaz metinle AA tutmaz, üstüne yazı yok." },
          ].map((item, i) => (
            <div key={item.cls} className="rounded-2xl bg-surface p-5">
              <div className="grid h-20 place-items-center rounded-xl bg-overlay shadow-raised">
                {i === 0 ? <span className="display-ink text-heading font-semibold tracking-tight">Pazar Özeti</span> : null}
                {i === 1 ? (
                  <Button variant="brand" tabIndex={-1}>
                    Yayınla
                  </Button>
                ) : null}
                {i === 2 ? <span aria-hidden className="size-11 rounded-xl bg-brand shadow-raised" /> : null}
              </div>
              <p className="mt-4">
                <Token>{item.cls}</Token>
              </p>
              <p className="mt-2 text-small text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </Section>
    </DocPage>
  );
}

/* --- Seçili Palet: toolbar'daki palet, gerçek bileşenlerle --------------- */

const VARS = [
  { name: "--primary", cls: "bg-primary", label: "Primary" },
  { name: "--primary-hover", cls: "bg-primary-hover", label: "Hover" },
  { name: "--primary-soft", cls: "bg-primary-soft", label: "Soft" },
  { name: "--primary-ink", cls: "bg-primary-ink", label: "Ink" },
  { name: "--primary-wash", cls: "bg-primary-wash", label: "Wash" },
  { name: "--on-primary", cls: "bg-on-primary", label: "On Primary" },
] as const;

function VarSwatch({ name, cls, label }: (typeof VARS)[number]) {
  const value = useRootVar(name);
  return (
    <div className="rounded-xl bg-overlay p-2 shadow-raised">
      <div aria-hidden className={`h-16 rounded-lg border border-line-soft ${cls}`} />
      <p className="mt-2 px-1 text-small font-medium text-strong">{label}</p>
      <p className="truncate px-1 pb-1 font-mono text-micro text-muted">{value || name}</p>
    </div>
  );
}

function SeciliPalet() {
  const palette = useRootAttr("palette", "signature") as PaletteName;
  const theme = useRootAttr("theme", "light");
  const [range, setRange] = useState<"gun" | "hafta" | "ay">("hafta");
  const info = INFO[palette] ?? INFO.signature;
  return (
    <DocPage>
      <PageHero
        eyebrow={`Tema / Paletler / ${palette} · ${theme === "dark" ? "koyu" : "açık"}`}
        title={<span className="display-ink">{info.title}</span>}
        lead={
          <>
            {info.use} Toolbar'dan paleti ve temayı değiştir: aşağıdaki her şey gerçek bileşen, değerler kökten canlı okunur.
          </>
        }
      />

      <div className="mt-10 grid grid-cols-2 gap-2 rounded-2xl bg-surface p-2 sm:grid-cols-3 lg:grid-cols-6">
        {VARS.map((v) => (
          <VarSwatch key={v.name} {...v} />
        ))}
      </div>

      <Section id="bilesenler" title="Bileşenlerde" description="Aynı ekran, palet değişince yalnızca vurgu ailesi döner; gri sistem yerinde kalır.">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl bg-surface p-5 sm:p-6">
            <p className="text-small font-medium text-muted">Düğmeler</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="brand">
                Siparişi Onayla <ArrowRight />
              </Button>
              <Button variant="primary">
                <Plus /> Yeni Kayıt
              </Button>
              <Button variant="soft">Taslağa Kaydet</Button>
              <Button variant="secondary">Önizle</Button>
              <Button variant="ghost">Vazgeç</Button>
            </div>
            <p className="mt-6 text-small font-medium text-muted">Rozetler</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="primary" dot>
                Yayında
              </Badge>
              <Badge tone="primary" variant="outline">
                Beta
              </Badge>
              <Badge tone="success">Tamamlandı</Badge>
              <Badge tone="warning">Bekliyor</Badge>
              <Badge tone="neutral">Taslak</Badge>
            </div>
            <p className="mt-6 text-small font-medium text-muted">Seçim</p>
            <div className="mt-3">
              <SegmentedControl
                aria-label="Zaman Aralığı"
                value={range}
                onValueChange={setRange}
                options={[
                  { value: "gun", label: "Gün" },
                  { value: "hafta", label: "Hafta" },
                  { value: "ay", label: "Ay" },
                ]}
              />
            </div>
          </div>
          <div className="rounded-2xl bg-surface p-5 sm:p-6">
            <Tabs
              aria-label="Bildirim Ayarları"
              items={[
                {
                  value: "eposta",
                  label: "E-posta",
                  panel: (
                    <div className="mt-4 rounded-xl bg-overlay px-4 py-2 shadow-raised">
                      <Switch label="Haftalık özet" hint="Her pazartesi 09.00'da" defaultChecked />
                      <Switch label="Yeni yorum" hint="Birisi kaydına yorum yazınca" />
                      <Checkbox label="Pazarlama e-postalarını da al" defaultChecked />
                    </div>
                  ),
                },
                { value: "anlik", label: "Anlık", panel: <p className="mt-4 text-base text-body">Tarayıcı bildirimleri kapalı.</p> },
              ]}
            />
            <p className="mt-5 text-base text-body">
              Bağlantı rengi: <a className="font-medium text-primary-ink underline underline-offset-4" href="#bilesenler">bölüme dön</a>
            </p>
          </div>
        </div>
      </Section>
      <Note className="mt-6">
        Palet <Token>:root[data-palette]</Token> seçicisiyle yazılı; alt öğeye vermek işe yaramaz, bu yüzden bu hikâye toolbar'ı okur.
      </Note>
    </DocPage>
  );
}

const meta = {
  title: "Tema/Paletler",
  component: PaletlerSayfasi,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "On paletin her biri iki temada: primary, ink, wash, CTA degradesi, marka karosu ve display başlık; kontrast oranları tokens.ts'ten hesaplanır.",
      },
    },
  },
} satisfies Meta<typeof PaletlerSayfasi>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ButunPaletler: Story = { name: "Bütün Paletler" };

export const SeciliPaletHikayesi: Story = {
  name: "Seçili Palet",
  render: () => <SeciliPalet />,
};
