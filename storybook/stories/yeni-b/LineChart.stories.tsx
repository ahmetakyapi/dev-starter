import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ChartCard } from "@/components/ui/chart-card";
import { LineChart } from "@/components/ui/line-chart";
import { Gallery } from "../_lib/Frame";
import { Donem, GrafikHucre, Sahne } from "../grafik/_sahne";
import { AKTIF_GERCEK, AKTIF_TAHMIN, AYLAR, HAFTALAR, KANAL_KAYIT, ORGANIK_HEDEF, sayi, toplam } from "./_veri";

type Args = ComponentProps<typeof LineChart> & { noktaSayisi: number; seriSayisi: number };

const yuzde = (a: number, b: number) => ((a - b) / b) * 100;
const SON = KANAL_KAYIT.map((s) => s.values[11]);
const ONCEKI = KANAL_KAYIT.map((s) => s.values[10]);

const meta = {
  title: "Grafikler/Çizgi Grafiği",
  id: "line-chart",
  component: LineChart,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Sıralı bir eksende 2-5 seriyi kıyaslamak için (kanala göre kayıt, şubeye göre satış); hacim okunacaksa alan grafiği. Lejant aynı zamanda süzgeç: seri gizlenince Y ekseni kalanlara göre yeniden ölçeklenir, son seri gizlenemez. Kesik çizgi (tahmin) ve hedef çizgisi renkten bağımsız ikinci işaret; veri her zaman `sr-only` tabloda.",
      },
    },
  },
  args: {
    title: "Kanala Göre Yeni Kayıt",
    labels: AYLAR,
    series: KANAL_KAYIT,
    unit: "kayıt",
    height: "h-56",
    markers: false,
    noktaSayisi: 12,
    seriSayisi: 4,
  },
  argTypes: {
    labels: { control: "object" },
    series: { control: "object" },
    target: { control: "object" },
    valueFormat: { control: "object" },
    defaultHidden: { control: "object" },
    height: { control: "select", options: ["h-40", "h-56", "h-72"] },
    noktaSayisi: { control: { type: "range", min: 2, max: 12, step: 1 }, description: "Gösterilen nokta sayısı" },
    seriSayisi: { control: { type: "range", min: 1, max: 4, step: 1 }, description: "Seri sayısı" },
  },
  render: ({ noktaSayisi, seriSayisi, labels, series, ...args }) => {
    const n = Math.min(noktaSayisi, labels.length);
    const shown = series.slice(0, seriSayisi).map((s) => ({ ...s, values: s.values.slice(0, n) }));
    const son = toplam(shown.map((s) => s.values.at(-1) ?? 0));
    const once = toplam(shown.map((s) => s.values.at(-2) ?? 0));
    return (
      <Sahne width="lg">
        <ChartCard
          id="cizgi-kart"
          label={args.title}
          value={sayi(son)}
          change={once ? yuzde(son, once) : null}
          changeLabel="önceki aya göre"
          action={<Donem defaultValue="yil" />}
        >
          <LineChart {...args} labels={labels.slice(0, n)} series={shown} />
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
    const live = canvasElement.querySelector("figure [aria-live]");
    // Lejant süzgeci: Reklam gizlenir, balon ve canlı bölge onu artık saymaz
    const reklam = canvas.getByRole("button", { name: "Reklam" });
    await userEvent.click(reklam);
    await expect(reklam).toHaveAttribute("aria-pressed", "false");
    await expect(live).toHaveTextContent("Reklam gizlendi");
    const plot = canvas.getByRole("group", { name: /ok tuşlarıyla/ });
    plot.focus();
    await userEvent.keyboard("{End}");
    await expect(live).toHaveTextContent("Ara: Organik 2.350 kayıt");
    await expect(live).not.toHaveTextContent("Reklam");
    await userEvent.click(reklam);
    await expect(reklam).toHaveAttribute("aria-pressed", "true");
  },
};

export const WithTarget: Story = {
  name: "Hedef Çizgisi",
  args: {
    title: "Organik Kayıt ve Aylık Hedef",
    series: [KANAL_KAYIT[0], KANAL_KAYIT[2]],
    seriSayisi: 2,
    target: { value: ORGANIK_HEDEF, label: "Hedef" },
  },
};

export const MarkersAndForecast: Story = {
  name: "Noktalı, Kesik Tahmin",
  args: {
    title: "Haftalık Aktif Kullanıcı",
    labels: HAFTALAR,
    unit: "kişi",
    markers: true,
    noktaSayisi: 8,
    seriSayisi: 2,
    series: [
      { label: "Gerçekleşen", values: AKTIF_GERCEK, series: 1 },
      { label: "Tahmin", values: AKTIF_TAHMIN, series: 5, dashed: true },
    ],
  },
};

export const StartHidden: Story = {
  name: "Başta Gizli Seriler",
  args: { defaultHidden: ["Reklam", "E-Posta"] },
};

export const FewData: Story = {
  name: "Az Veri (İki Nokta)",
  args: { noktaSayisi: 2, markers: true },
};

export const Empty: Story = {
  name: "Boş (Veri Yok)",
  args: { labels: [], noktaSayisi: 0, series: KANAL_KAYIT.map((s) => ({ ...s, values: [] })) },
};

export const LongLabels: Story = {
  name: "Uzun Seri Adları",
  args: {
    title: "Bölge Müdürlüğüne Göre Aylık Yeni Kayıt",
    series: [
      { label: "Marmara ve Trakya Bölge Müdürlüğü", values: KANAL_KAYIT[0].values, series: 1 },
      { label: "İç Anadolu Bölge Müdürlüğü", values: KANAL_KAYIT[1].values, series: 2 },
      { label: "Ege ve Akdeniz Kıyıları Bölge Müdürlüğü", values: KANAL_KAYIT[2].values, series: 3 },
      { label: "Karadeniz Bölge Müdürlüğü", values: KANAL_KAYIT[3].values, series: 4 },
    ],
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
      <GrafikHucre label="Dört seri, lejant süzgeç">
        <ChartCard id="cizgi-v1" label="Kanala Göre Yeni Kayıt" value={sayi(toplam(SON))} change={yuzde(toplam(SON), toplam(ONCEKI))}>
          <LineChart title="Kanala Göre Yeni Kayıt" labels={AYLAR} series={KANAL_KAYIT} unit="kayıt" height="h-44" />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Hedef çizgisi">
        <ChartCard id="cizgi-v2" label="Organik Kayıt" value={sayi(SON[0])} change={yuzde(SON[0], ONCEKI[0])}>
          <LineChart
            title="Organik Kayıt"
            labels={AYLAR}
            series={[KANAL_KAYIT[0]]}
            unit="kayıt"
            height="h-44"
            target={{ value: ORGANIK_HEDEF, label: "Hedef" }}
          />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Noktalı, kesik tahmin">
        <ChartCard id="cizgi-v3" label="Haftalık Aktif Kullanıcı" value={sayi(AKTIF_GERCEK.at(-1)!)} change={yuzde(AKTIF_GERCEK.at(-1)!, AKTIF_GERCEK.at(-2)!)}>
          <LineChart
            title="Haftalık Aktif Kullanıcı"
            labels={HAFTALAR}
            unit="kişi"
            markers
            height="h-44"
            series={[
              { label: "Gerçekleşen", values: AKTIF_GERCEK, series: 1 },
              { label: "Tahmin", values: AKTIF_TAHMIN, series: 5, dashed: true },
            ]}
          />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Boş">
        <ChartCard id="cizgi-v4" label="Yeni Pazar Kayıtları" value="0">
          <LineChart title="Yeni Pazar Kayıtları" labels={[]} series={[{ label: "Organik", values: [] }]} height="h-44" />
        </ChartCard>
      </GrafikHucre>
    </Gallery>
  ),
};
