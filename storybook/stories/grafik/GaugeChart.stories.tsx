import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";
import { expect, within } from "storybook/test";
import { ChartCard, ChartLegend } from "@/components/ui/chart-card";
import { GaugeChart } from "@/components/ui/gauge-chart";
import { Gallery } from "../_lib/Frame";
import { Donem, GrafikHucre, Sahne } from "./_sahne";
import { KANAL, sayi, toplam } from "./_veri";

type Args = ComponentProps<typeof GaugeChart> & { parcaSayisi: number };

const meta = {
  title: "Grafikler/Yarım Daire Grafiği",
  id: "gauge-chart",
  component: GaugeChart,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Bir bütünün 2-4 parçası ya da `max` ile tek bir doluluk (kota, SLA); ortada vurgulanan parçanın payı. Panonun üst sırasında tek bakışta okunacak pay için; beşten fazla parça ya da kesin kıyas gerekiyorsa aşama çubukları. Parçalar arası boşluk yuvarlak uçların içinden hesaplanır, uçlar birbirine değmez.",
      },
    },
  },
  args: {
    title: "Kanala Göre Destek Bileti",
    parts: KANAL,
    highlight: 0,
    thickness: 18,
    gap: 7,
    parcaSayisi: 3,
  },
  argTypes: {
    parts: { control: "object" },
    children: { control: false },
    label: { control: "text" },
    max: { control: "number" },
    highlight: { control: { type: "range", min: 0, max: 3, step: 1 } },
    thickness: { control: { type: "range", min: 8, max: 28, step: 1 } },
    gap: { control: { type: "range", min: 0, max: 16, step: 1 } },
    parcaSayisi: { control: { type: "range", min: 1, max: 4, step: 1 }, description: "Gösterilen parça sayısı" },
  },
  render: ({ parcaSayisi, parts, ...args }) => {
    const shown = parts.slice(0, parcaSayisi);
    return (
      <Sahne width="sm">
        <ChartCard
          id="gosterge-kart"
          label={args.title}
          value={sayi(args.max ?? toplam(shown.map((p) => p.value)))}
          change={4.1}
          action={<Donem />}
          footer={<ChartLegend columns={shown.length >= 3 ? 3 : 2} className="px-1 pb-1" items={shown.map((p) => ({ ...p }))} />}
        >
          <GaugeChart {...args} parts={shown} />
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
    // Ad bütün parçaları sayar: renk tek bilgi kaynağı değil
    const img = within(canvasElement).getByRole("img", { name: /Kanala Göre Destek Bileti/ });
    await expect(img).toHaveAccessibleName(/Canlı Destek %47, E-posta %38, Telefon %15/);
  },
};

export const SingleFill: Story = {
  name: "Tek Doluluk (SLA)",
  args: {
    title: "Hedef Sürede Yanıtlanan",
    parts: [{ label: "Hedefte", value: 872, series: 6 }],
    max: 1000,
    label: "SLA Uyumu",
    parcaSayisi: 1,
  },
};

export const FourSlices: Story = {
  name: "Dört Parça",
  args: { parcaSayisi: 4 },
};

export const SecondHighlighted: Story = {
  name: "İkinci Parça Vurgulu",
  args: { highlight: 1 },
};

export const TinySlice: Story = {
  name: "Çok Küçük Parça",
  args: {
    title: "Plan Dağılımı",
    parts: [
      { label: "Ücretsiz", value: 9120, series: 1 },
      { label: "Pro", value: 1840, series: 2 },
      { label: "Kurumsal", value: 42, series: 3 },
    ],
  },
};

export const Empty: Story = {
  name: "Boş (Sıfır Değer)",
  args: {
    title: "Kota Kullanımı",
    parts: [{ label: "Kullanılan", value: 0, series: 2 }],
    max: 50,
    label: "50 GB Kotanın",
    parcaSayisi: 1,
  },
};

export const Mobile: Story = {
  name: "Telefon Genişliği",
  globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  render: () => (
    <Gallery cols={3}>
      <GrafikHucre label="Üç Parça">
        <ChartCard id="g-v1" label="Cihaza Göre Ziyaret" value="9.000">
          <GaugeChart
            title="Cihaza Göre Ziyaret"
            parts={[
              { label: "Masaüstü", value: 4230, series: 2 },
              { label: "Mobil", value: 3420, series: 3 },
              { label: "Tablet", value: 1350, series: 1 },
            ]}
          />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Tek Doluluk, Kalan İz">
        <ChartCard id="g-v2" label="Depolama" value="36 GB">
          <GaugeChart title="Depolama" parts={[{ label: "Kullanılan", value: 36, series: 4 }]} max={50} label="50 GB Kotanın" />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="İnce Yay, Geniş Boşluk">
        <ChartCard id="g-v3" label="Bilet Önceliği" value="1.284">
          <GaugeChart
            title="Bilet Önceliği"
            thickness={10}
            gap={12}
            parts={[
              { label: "Düşük", value: 612, series: 6 },
              { label: "Orta", value: 448, series: 5 },
              { label: "Yüksek", value: 186, series: 4 },
              { label: "Acil", value: 38, series: 3 },
            ]}
          />
        </ChartCard>
      </GrafikHucre>
    </Gallery>
  ),
};
