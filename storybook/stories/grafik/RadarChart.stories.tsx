import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";
import { expect, within } from "storybook/test";
import { ChartCard, ChartLegend } from "@/components/ui/chart-card";
import { RadarChart } from "@/components/ui/radar-chart";
import { Gallery } from "../_lib/Frame";
import { Donem, GrafikHucre, Sahne } from "./_sahne";
import { RADAR_EKIP_A, RADAR_EKIP_B, RADAR_EKSEN } from "./_veri";

type Args = ComponentProps<typeof RadarChart> & { eksenSayisi: number; seriSayisi: 1 | 2 };

const ort = (v: readonly number[]) => (v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0);

const meta = {
  title: "Grafikler/Radar",
  component: RadarChart,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "5-8 ölçütte bir ya da iki profil; okunan şey şekil: dengeli mi, bir yöne mi çekiyor. Üçüncü çokgen dolguları çamura çevirir; üç ve üstü varlık için yan yana küçük radarlar. Eksen adları kısa tutulmalı (telefonda etiket başına ~70 px); kesin değerler `sr-only` tabloda.",
      },
    },
  },
  args: {
    title: "Destek Ekibi Profili",
    axes: RADAR_EKSEN,
    unit: "puan",
    max: 100,
    series: [
      { label: "Gündüz Ekibi", values: RADAR_EKIP_A, series: 2 },
      { label: "Gece Ekibi", values: RADAR_EKIP_B, series: 4 },
    ],
    eksenSayisi: 6,
    seriSayisi: 2,
  },
  argTypes: {
    axes: { control: "object" },
    series: { control: "object" },
    max: { control: "number" },
    eksenSayisi: { control: { type: "range", min: 3, max: 8, step: 1 }, description: "Ölçüt sayısı (önerilen 5-8)" },
    seriSayisi: { control: "inline-radio", options: [1, 2] },
  },
  render: ({ eksenSayisi, seriSayisi, axes, series, ...args }) => {
    const n = Math.min(eksenSayisi, axes.length);
    const shown = series.slice(0, seriSayisi).map((s) => ({ ...s, values: s.values.slice(0, n) }));
    return (
      <Sahne>
        <ChartCard
          id="radar-kart"
          label={args.title}
          value={String(ort(shown[0]?.values ?? []))}
          change={shown[1] ? Math.round(((ort(shown[0].values) - ort(shown[1].values)) / Math.max(ort(shown[1].values), 1)) * 1000) / 10 : null}
          changeLabel="gece ekibine göre"
          action={<Donem defaultValue="30g" />}
          footer={
            <ChartLegend className="px-1 pb-1" items={shown.map((s, i) => ({ label: s.label, value: ort(s.values), series: s.series ?? (i === 0 ? 1 : 2), unit: "ort." }))} />
          }
        >
          <RadarChart {...args} axes={axes.slice(0, n)} series={shown} />
        </ChartCard>
      </Sahne>
    );
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const table = within(canvasElement).getByRole("table", { name: "Destek Ekibi Profili" });
    // Ölçüt × seri tablosu: başlık + 6 ölçüt satırı
    await expect(within(table).getAllByRole("row")).toHaveLength(7);
    await expect(within(table).getByRole("row", { name: /Memnuniyet/ })).toHaveTextContent("88");
  },
};

export const TekSeri: Story = {
  name: "Tek Seri",
  args: { seriSayisi: 1, title: "Sürüm 3.2 Kalite Profili", axes: ["Hız", "Erişilebilirlik", "SEO", "Güvenlik", "Kararlılık", "Kullanım"], series: [{ label: "Sürüm 3.2", values: [92, 96, 88, 81, 90, 82], series: 2 }] },
};

export const SekizEksen: Story = {
  name: "Sekiz Ölçüt",
  args: { eksenSayisi: 8 },
};

export const BesEksen: Story = {
  name: "Az Veri (Beş Ölçüt)",
  args: { eksenSayisi: 5 },
};

export const SifirDegerler: Story = {
  name: "Sıfır Değerli Ölçüt",
  args: {
    title: "Yeni Temsilci Profili",
    series: [
      { label: "İlk Hafta", values: [64, 40, 0, 72, 58, 0], series: 3 },
      { label: "Ekip Ortalaması", values: [83, 87, 85, 83, 83, 80], series: 1 },
    ],
  },
};

export const UzunEtiket: Story = {
  name: "Uzun Eksen Adı",
  args: {
    title: "Ürün Değerlendirmesi",
    axes: ["Kurulum Kolaylığı", "Fiyat / Performans", "Müşteri Desteği", "Entegrasyonlar", "Belgelendirme Kalitesi", "Mobil Uygulama"],
    series: [
      { label: "Bizim Ürün", values: [86, 72, 94, 68, 81, 77], series: 2 },
      { label: "Rakip Ortalaması", values: [70, 80, 66, 84, 62, 71], series: 5 },
    ],
  },
};

export const Telefon: Story = {
  name: "Telefon Genişliği",
  globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  render: () => (
    <Gallery cols={3}>
      <GrafikHucre label="İki profil, altı ölçüt">
        <ChartCard id="r-v1" label="Destek Ekibi · Altı Ölçüt" value="84">
          <RadarChart
            title="Destek ekibi, iki profil"
            axes={RADAR_EKSEN.slice(0, 6)}
            series={[
              { label: "Gündüz", values: RADAR_EKIP_A.slice(0, 6), series: 2 },
              { label: "Gece", values: RADAR_EKIP_B.slice(0, 6), series: 4 },
            ]}
          />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Tek profil, beş ölçüt">
        <ChartCard id="r-v2" label="Sürüm 3.2" value="89">
          <RadarChart title="Sürüm 3.2" axes={["Hız", "SEO", "Güvenlik", "Kararlılık", "Kullanım"]} series={[{ label: "Sürüm 3.2", values: [92, 88, 81, 90, 82], series: 6 }]} />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="İki profil, sekiz ölçüt">
        <ChartCard id="r-v3" label="Destek Ekibi · Sekiz Ölçüt" value="82">
          <RadarChart
            title="Destek ekibi, sekiz ölçüt"
            axes={RADAR_EKSEN}
            series={[
              { label: "Gündüz", values: RADAR_EKIP_A, series: 3 },
              { label: "Gece", values: RADAR_EKIP_B, series: 1 },
            ]}
          />
        </ChartCard>
      </GrafikHucre>
    </Gallery>
  ),
};
