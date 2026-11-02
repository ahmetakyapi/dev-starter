import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ChartCard } from "@/components/ui/chart-card";
import { SankeyChart } from "@/components/ui/sankey-chart";
import { Gallery } from "../_lib/Frame";
import { Donem, GrafikHucre, Sahne } from "./_sahne";
import { SANKEY_AKIS, SANKEY_HEDEF, SANKEY_KAYNAK, sayi, toplam } from "./_veri";

type Args = ComponentProps<typeof SankeyChart> & { kaynakSayisi: number; hedefSayisi: number };

const meta = {
  title: "Grafikler/Akış Grafiği",
  id: "charts-sankey-chart",
  component: SankeyChart,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "İki katmanlı akış: ziyaretçi nereden geldi, nereye vardı. Bant kaynağının renginde, hedef etiketinde toplama göre pay. Bir düğüm ya da bandın üstüne gelince yalnızca ona bağlı akış kalır; dokunmatikte etikete dokunmak yalıtımı sabitler. Düğüm adları 10-12 harfi geçmesin, çok küçük düğümlerin etiketleri çakışabilir.",
      },
    },
  },
  args: {
    title: "Kaynağa Göre Sipariş",
    unit: "ziyaretçi",
    height: "h-72",
    sources: SANKEY_KAYNAK,
    targets: SANKEY_HEDEF,
    links: SANKEY_AKIS,
    kaynakSayisi: 4,
    hedefSayisi: 3,
  },
  argTypes: {
    sources: { control: "object" },
    targets: { control: "object" },
    links: { control: "object" },
    height: { control: "select", options: ["h-56", "h-72", "h-96"] },
    kaynakSayisi: { control: { type: "range", min: 1, max: 5, step: 1 }, description: "Soldaki düğüm sayısı" },
    hedefSayisi: { control: { type: "range", min: 1, max: 3, step: 1 }, description: "Sağdaki düğüm sayısı" },
  },
  render: ({ kaynakSayisi, hedefSayisi, sources, targets, links, ...args }) => {
    const s = sources.slice(0, kaynakSayisi);
    const t = targets.slice(0, hedefSayisi);
    const sIds = new Set(s.map((x) => x.id));
    const tIds = new Set(t.map((x) => x.id));
    const l = links.filter((x) => sIds.has(x.source) && tIds.has(x.target));
    return (
      <Sahne width="lg">
        <ChartCard id="sankey-kart" label={args.title} value={sayi(toplam(l.map((x) => x.value)))} change={3.8} action={<Donem defaultValue="30g" />}>
          <SankeyChart {...args} sources={s} targets={t} links={l} />
        </ChartCard>
      </Sahne>
    );
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const arama = canvas.getByRole("button", { name: /Arama/ });
    await expect(arama).toHaveAttribute("aria-pressed", "false");
    // Etikete dokunmak yalıtımı sabitler, ikinci dokunuş bırakır
    await userEvent.click(arama);
    await expect(arama).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(arama);
    await expect(arama).toHaveAttribute("aria-pressed", "false");
    // Odak düğmede kalırsa yalıtım sürer; çizim tam haliyle kalsın
    arama.blur();
  },
};

export const FiveSources: Story = {
  name: "Beş Kaynak",
  args: { kaynakSayisi: 5 },
};

export const FewData: Story = {
  name: "Az Veri (İki → İki)",
  args: {
    title: "Plan Yükseltme",
    unit: "hesap",
    sources: [
      { id: "aylik", label: "Aylık", series: 2 },
      { id: "yillik", label: "Yıllık", series: 3 },
    ],
    targets: [
      { id: "kaldi", label: "Kaldı" },
      { id: "yukseltti", label: "Yükseltti" },
    ],
    links: [
      { source: "aylik", target: "kaldi", value: 1420 },
      { source: "aylik", target: "yukseltti", value: 310 },
      { source: "yillik", target: "kaldi", value: 860 },
      { source: "yillik", target: "yukseltti", value: 140 },
    ],
    kaynakSayisi: 2,
    hedefSayisi: 2,
  },
};

export const ZeroFlow: Story = {
  name: "Sıfır Değerli Akış",
  args: {
    title: "Bilet Yönlendirme",
    unit: "bilet",
    sources: [
      { id: "eposta", label: "E-posta", series: 3 },
      { id: "canli", label: "Canlı Destek", series: 2 },
      { id: "telefon", label: "Telefon", series: 1 },
    ],
    targets: [
      { id: "seviye1", label: "1. Seviye" },
      { id: "seviye2", label: "2. Seviye" },
      { id: "muhendis", label: "Mühendis" },
    ],
    links: [
      { source: "eposta", target: "seviye1", value: 1840 },
      { source: "eposta", target: "seviye2", value: 420 },
      { source: "eposta", target: "muhendis", value: 0 },
      { source: "canli", target: "seviye1", value: 2610 },
      { source: "canli", target: "seviye2", value: 310 },
      { source: "canli", target: "muhendis", value: 64 },
      { source: "telefon", target: "seviye1", value: 980 },
      { source: "telefon", target: "seviye2", value: 0 },
      { source: "telefon", target: "muhendis", value: 0 },
    ],
    kaynakSayisi: 3,
  },
};

export const LongLabel: Story = {
  name: "Uzun Düğüm Adı",
  args: {
    title: "Kampanya Dönüşümü",
    sources: [
      { id: "kara", label: "Kara Cuma Bülteni", series: 4 },
      { id: "influencer", label: "Influencer İş Birliği", series: 5 },
      { id: "ortak", label: "Satış Ortaklığı Programı", series: 6 },
    ],
    targets: [
      { id: "ilk", label: "İlk Siparişini Verdi" },
      { id: "tekrar", label: "Tekrar Sipariş" },
    ],
    links: [
      { source: "kara", target: "ilk", value: 1120 },
      { source: "kara", target: "tekrar", value: 680 },
      { source: "influencer", target: "ilk", value: 940 },
      { source: "influencer", target: "tekrar", value: 120 },
      { source: "ortak", target: "ilk", value: 410 },
      { source: "ortak", target: "tekrar", value: 290 },
    ],
    kaynakSayisi: 3,
    hedefSayisi: 2,
  },
};

export const Mobile: Story = {
  name: "Telefon Genişliği",
  globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  render: () => (
    <Gallery cols={2}>
      {[
        { label: "Dört kaynak, üç hedef", n: 4, m: 3, h: "h-72" },
        { label: "Beş kaynak, iki hedef, kısa", n: 5, m: 2, h: "h-56" },
      ].map((v, i) => {
        const s = SANKEY_KAYNAK.slice(0, v.n);
        const t = SANKEY_HEDEF.slice(0, v.m);
        const l = SANKEY_AKIS.filter((x) => s.some((y) => y.id === x.source) && t.some((y) => y.id === x.target));
        return (
          <GrafikHucre key={v.label} label={v.label}>
            <ChartCard id={`sk-v${i}`} label={`Kaynağa Göre Sipariş · ${v.label}`} value={sayi(toplam(l.map((x) => x.value)))}>
              <SankeyChart title={`Kaynak akışı ${i + 1}`} sources={s} targets={t} links={l} height={v.h} />
            </ChartCard>
          </GrafikHucre>
        );
      })}
    </Gallery>
  ),
};
