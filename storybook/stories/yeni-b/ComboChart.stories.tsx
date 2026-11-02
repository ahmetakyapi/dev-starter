import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ChartCard } from "@/components/ui/chart-card";
import { ComboChart } from "@/components/ui/combo-chart";
import { Gallery } from "../_lib/Frame";
import { Donem, GrafikHucre, OzetKarolari, Sahne } from "../grafik/_sahne";
import { AYLAR, CIRO, DONUSUM, IADE, SIPARIS, sayi, toplam } from "./_veri";

type Args = ComponentProps<typeof ComboChart> & { noktaSayisi: number };

const TL = { style: "currency", currency: "TRY", maximumFractionDigits: 0 } as const;
const ORAN = { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;
const tl = new Intl.NumberFormat("tr-TR", TL);
const oran = new Intl.NumberFormat("tr-TR", ORAN);

const meta = {
  title: "Grafikler/Birleşik Grafik",
  id: "combo-chart",
  component: ComboChart,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Aynı zaman ekseninde birimi farklı iki ölçü: sütun hacmi (ciro, sipariş) sol eksende, çizgi oranı (dönüşüm, iade) sağ eksende. Sağ eksenin adımı solun adım sayısına uydurulur, ızgara tek. Birimler aynıysa kullanma; tek eksenli çizgi grafiği daha dürüst.",
      },
    },
  },
  args: {
    title: "Aylık Ciro ve Dönüşüm Oranı",
    labels: AYLAR,
    bars: { label: "Ciro", values: CIRO, series: 1, format: TL },
    line: { label: "Dönüşüm Oranı", values: DONUSUM, series: 3, format: ORAN },
    height: "h-56",
    noktaSayisi: 12,
  },
  argTypes: {
    labels: { control: "object" },
    bars: { control: "object" },
    line: { control: "object" },
    height: { control: "select", options: ["h-40", "h-56", "h-72"] },
    noktaSayisi: { control: { type: "range", min: 1, max: 12, step: 1 }, description: "Gösterilen ay sayısı" },
  },
  render: ({ noktaSayisi, labels, bars, line, ...args }) => {
    const n = Math.min(noktaSayisi, labels.length);
    const b = bars.values.slice(0, n);
    const l = line.values.slice(0, n);
    const fb = new Intl.NumberFormat("tr-TR", bars.format);
    const fl = new Intl.NumberFormat("tr-TR", line.format);
    return (
      <Sahne width="lg">
        <ChartCard
          id="birlesik-kart"
          label={args.title}
          value={fb.format(toplam(b))}
          change={b.length > 1 ? ((b.at(-1)! - b.at(-2)!) / (b.at(-2)! || 1)) * 100 : null}
          changeLabel="önceki aya göre"
          action={<Donem defaultValue="yil" />}
          footer={
            <OzetKarolari
              items={[
                { label: `En Yüksek ${bars.label}`, value: b.length ? fb.format(Math.max(...b)) : "—" },
                { label: `Ortalama ${line.label}`, value: l.length ? fl.format(toplam(l) / l.length) : "—" },
              ]}
            />
          }
        >
          <ComboChart {...args} labels={labels.slice(0, n)} bars={{ ...bars, values: b }} line={{ ...line, values: l }} />
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
    const plot = canvas.getByRole("group", { name: /ok tuşlarıyla/ });
    plot.focus();
    await userEvent.keyboard("{End}");
    const live = canvasElement.querySelector("figure [aria-live]");
    // Para birimi ve yüzde, iki ayrı biçimle aynı cümlede
    await expect(live).toHaveTextContent(`Ara: Ciro ${tl.format(1086000)}, Dönüşüm Oranı ${oran.format(0.041)}`);
    await userEvent.keyboard("{ArrowLeft}");
    await expect(live).toHaveTextContent(/^Kas:/);
  },
};

export const OrdersAndReturns: Story = {
  name: "Sipariş ve İade Oranı",
  args: {
    title: "Aylık Sipariş ve İade Oranı",
    bars: { label: "Sipariş", values: SIPARIS, series: 4, unit: "adet" },
    line: { label: "İade Oranı", values: IADE, series: 2, format: ORAN },
  },
};

export const FewData: Story = {
  name: "Az Veri (Üç Ay)",
  args: { noktaSayisi: 3 },
};

export const Empty: Story = {
  name: "Boş (Hepsi Sıfır)",
  args: {
    bars: { label: "Ciro", values: AYLAR.map(() => 0), series: 1, format: TL },
    line: { label: "Dönüşüm Oranı", values: AYLAR.map(() => 0), series: 3, format: ORAN },
  },
};

export const LongLabels: Story = {
  name: "Uzun Ölçü Adları",
  args: {
    title: "Kurumsal Paket Yenileme Cirosu ve Yenileme Oranı",
    bars: { label: "Kurumsal Paket Yenileme Cirosu", values: CIRO.map((v) => Math.round(v * 0.42)), series: 6, format: TL },
    line: { label: "Sözleşme Yenileme Oranı", values: DONUSUM.map((v) => Math.min(0.98, v * 21)), series: 1, format: ORAN },
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
      <GrafikHucre label="Ciro ve dönüşüm">
        <ChartCard id="birlesik-v1" label="Aylık Ciro" value={tl.format(toplam(CIRO))} change={16.3}>
          <ComboChart
            title="Aylık Ciro ve Dönüşüm Oranı"
            labels={AYLAR}
            height="h-44"
            bars={{ label: "Ciro", values: CIRO, series: 1, format: TL }}
            line={{ label: "Dönüşüm Oranı", values: DONUSUM, series: 3, format: ORAN }}
          />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Sipariş ve iade">
        <ChartCard id="birlesik-v2" label="Aylık Sipariş" value={sayi(toplam(SIPARIS))} change={15.5}>
          <ComboChart
            title="Aylık Sipariş ve İade Oranı"
            labels={AYLAR}
            height="h-44"
            bars={{ label: "Sipariş", values: SIPARIS, series: 4, unit: "adet" }}
            line={{ label: "İade Oranı", values: IADE, series: 2, format: ORAN }}
          />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Üç ay, anahtarsız">
        <ChartCard id="birlesik-v3" label="Çeyrek Cirosu" value={tl.format(CIRO[9] + CIRO[10] + CIRO[11])}>
          <ComboChart
            title="Son Çeyrek Ciro ve Dönüşüm"
            labels={AYLAR.slice(9)}
            height="h-44"
            showKey={false}
            bars={{ label: "Ciro", values: CIRO.slice(9), series: 5, format: TL }}
            line={{ label: "Dönüşüm Oranı", values: DONUSUM.slice(9), series: 1, format: ORAN }}
          />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Boş">
        <ChartCard id="birlesik-v4" label="Yeni Mağaza Cirosu" value={tl.format(0)}>
          <ComboChart
            title="Aylık Ciro ve Dönüşüm Oranı"
            labels={AYLAR}
            height="h-44"
            bars={{ label: "Ciro", values: AYLAR.map(() => 0), series: 1, format: TL }}
            line={{ label: "Dönüşüm Oranı", values: AYLAR.map(() => 0), series: 3, format: ORAN }}
          />
        </ChartCard>
      </GrafikHucre>
    </Gallery>
  ),
};
