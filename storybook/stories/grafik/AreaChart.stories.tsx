import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";
import { expect, userEvent, within } from "storybook/test";
import { AreaChart } from "@/components/ui/area-chart";
import { ChartCard, ChartLegend } from "@/components/ui/chart-card";
import { Gallery } from "../_lib/Frame";
import { Donem, GrafikHucre, Sahne } from "./_sahne";
import { AYLAR, BILET_ACILAN, BILET_COZULEN, CIRO_BU_YIL, CIRO_GECEN_YIL, KAYIT_BU_YIL, KAYIT_GECEN_YIL, SON_14_GUN, sayi, toplam, yuzdeDegisim } from "./_veri";

type Args = ComponentProps<typeof AreaChart> & { noktaSayisi: number; seriSayisi: 1 | 2 };

const meta = {
  title: "Grafikler/Alan Grafiği",
  id: "charts-area-chart",
  component: AreaChart,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Sıralı bir eksende bir ya da iki seri; \"bu yıl / geçen yıl\" gibi iki dönemi üst üste koymak için. Eğri monoton kübik: noktalar arasında aşmaz, sıfırın altına sarkmaz. Fareyle, parmakla ya da odaklanıp ← → Home End ile gezilir; ekrana girince soldan çizilir, hareket azaltmada son hal anında gelir.",
      },
    },
  },
  args: {
    title: "Aylık Yeni Kayıt",
    labels: AYLAR,
    unit: "kayıt",
    height: "h-52",
    series: [
      { label: "Bu Yıl", values: KAYIT_BU_YIL, series: 1 },
      { label: "Geçen Yıl", values: KAYIT_GECEN_YIL, series: 2 },
    ],
    noktaSayisi: 12,
    seriSayisi: 2,
  },
  argTypes: {
    labels: { control: "object" },
    series: { control: "object" },
    valueFormat: { control: "object" },
    height: { control: "select", options: ["h-40", "h-52", "h-64", "h-80"] },
    noktaSayisi: { control: { type: "range", min: 2, max: 14, step: 1 }, description: "Gösterilen nokta sayısı" },
    seriSayisi: { control: "inline-radio", options: [1, 2], description: "Bir ya da iki seri" },
  },
  render: ({ noktaSayisi, seriSayisi, labels, series, ...args }) => {
    const n = Math.min(noktaSayisi, labels.length);
    const shown = series.slice(0, seriSayisi).map((s) => ({ ...s, values: s.values.slice(0, n) }));
    const sums = shown.map((s) => toplam(s.values));
    return (
      <Sahne width="lg">
        <ChartCard
          id="alan-kart"
          label={args.title}
          value={sayi(sums[0] ?? 0)}
          change={sums[1] !== undefined ? yuzdeDegisim(sums[0], sums[1]) : null}
          changeLabel="geçen yıla göre"
          action={<Donem defaultValue="yil" />}
          footer={
            <ChartLegend
              className="px-1 pb-1"
              items={shown.map((s, i) => ({ label: s.label, value: sums[i], series: s.series ?? 1, unit: args.unit }))}
            />
          }
        >
          <AreaChart {...args} labels={labels.slice(0, n)} series={shown} />
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
    await userEvent.click(plot);
    plot.focus();
    await userEvent.keyboard("{End}");
    // Son nokta canlı bölgede okunur
    await expect(canvasElement.querySelector("[aria-live]")).toHaveTextContent("Ara: Bu Yıl 6.270 kayıt");
    await userEvent.keyboard("{Home}");
    await expect(canvasElement.querySelector("[aria-live]")).toHaveTextContent("Oca: Bu Yıl 2.840 kayıt");
  },
};

export const SingleSeries: Story = {
  name: "Tek Seri",
  args: { seriSayisi: 1 },
};

export const Currency: Story = {
  name: "Para Birimi (Aylık Ciro)",
  args: {
    title: "Aylık Ciro",
    unit: undefined,
    valueFormat: { style: "currency", currency: "TRY", maximumFractionDigits: 0 },
    series: [
      { label: "Bu Yıl", values: CIRO_BU_YIL.map((v) => v * 1000), series: 3 },
      { label: "Geçen Yıl", values: CIRO_GECEN_YIL.map((v) => v * 1000), series: 4 },
    ],
  },
};

export const DailyTickets: Story = {
  name: "On Dört Gün, Seyreltilmiş Etiket",
  args: {
    title: "Açılan ve Çözülen Bilet",
    labels: SON_14_GUN,
    unit: "bilet",
    noktaSayisi: 14,
    series: [
      { label: "Çözülen", values: BILET_COZULEN, series: 6 },
      { label: "Açılan", values: BILET_ACILAN, series: 2 },
    ],
  },
};

export const FewData: Story = {
  name: "Az Veri (İki Nokta)",
  args: { noktaSayisi: 2 },
};

export const ZeroValues: Story = {
  name: "Sıfıra İnen Değerler",
  args: {
    title: "Kampanya Siparişi",
    unit: "sipariş",
    labels: ["1 Kas", "2 Kas", "3 Kas", "4 Kas", "5 Kas", "6 Kas", "7 Kas", "8 Kas"],
    noktaSayisi: 8,
    series: [
      { label: "Bu Kampanya", values: [0, 0, 42, 318, 506, 122, 8, 0], series: 1 },
      { label: "Önceki Kampanya", values: [0, 12, 96, 240, 188, 64, 0, 0], series: 2 },
    ],
  },
};

export const Empty: Story = {
  name: "Boş (Hepsi Sıfır)",
  args: {
    title: "Kampanya Siparişi",
    unit: "sipariş",
    noktaSayisi: 12,
    seriSayisi: 1,
    series: [{ label: "Bu Yıl", values: AYLAR.map(() => 0), series: 1 }],
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
      <GrafikHucre label="İki seri, sayı">
        <ChartCard id="alan-v1" label="Aylık Yeni Kayıt" value={sayi(toplam(KAYIT_BU_YIL))} change={yuzdeDegisim(toplam(KAYIT_BU_YIL), toplam(KAYIT_GECEN_YIL))}>
          <AreaChart
            title="Aylık Yeni Kayıt"
            labels={AYLAR}
            unit="kayıt"
            height="h-40"
            series={[
              { label: "Bu Yıl", values: KAYIT_BU_YIL, series: 1 },
              { label: "Geçen Yıl", values: KAYIT_GECEN_YIL, series: 2 },
            ]}
          />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Tek seri, para birimi">
        <ChartCard id="alan-v2" label="Aylık Ciro" value="₺7.848.000" change={18.2}>
          <AreaChart
            title="Aylık Ciro"
            labels={AYLAR}
            height="h-40"
            valueFormat={{ style: "currency", currency: "TRY", maximumFractionDigits: 0 }}
            series={[{ label: "Ciro", values: CIRO_BU_YIL.map((v) => v * 1000), series: 3 }]}
          />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Günlük, iki seri">
        <ChartCard id="alan-v3" label="Açılan ve Çözülen Bilet" value={sayi(toplam(BILET_ACILAN))} change={-4.6}>
          <AreaChart
            title="Açılan ve Çözülen Bilet"
            labels={SON_14_GUN}
            unit="bilet"
            height="h-40"
            series={[
              { label: "Çözülen", values: BILET_COZULEN, series: 6 },
              { label: "Açılan", values: BILET_ACILAN, series: 2 },
            ]}
          />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Boş">
        <ChartCard id="alan-v4" label="Kampanya Siparişi" value="0">
          <AreaChart title="Kampanya Siparişi" labels={AYLAR} unit="sipariş" height="h-40" series={[{ label: "Sipariş", values: AYLAR.map(() => 0), series: 1 }]} />
        </ChartCard>
      </GrafikHucre>
    </Gallery>
  ),
};
