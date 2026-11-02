import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";
import { expect, within } from "storybook/test";
import { ChartCard, ChartLegend } from "@/components/ui/chart-card";
import { TrackBarChart } from "@/components/ui/track-bar-chart";
import { Gallery } from "../_lib/Frame";
import { Donem, GrafikHucre, Sahne } from "./_sahne";
import { AYLAR, KAYIT_HUNISI, KAZANC, TARAYICI, tlKisa } from "./_veri";

type Args = ComponentProps<typeof ChartCard> & {
  /** Lejant karosu sayısı (0: lejant yok). */
  lejantKalemi: number;
  lejantSutun: 2 | 3;
  donemSecici: boolean;
};

const SERILER = [1, 2, 3, 4, 5, 6] as const;

const meta = {
  title: "Grafikler/Grafik Kartı",
  component: ChartCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Her grafiğin kabı: etiket, büyük değer, değişim hapı ve sağda dönem seçici; altında `ChartLegend` karoları. Kart gri bir kuyu, karolar beyaz; derinliği gölge değil ton farkı kurar. Seri rengi yalnızca lejanttaki noktada, metin hep `text-strong`/`text-muted`.",
      },
    },
  },
  args: {
    id: "kart-kazanc",
    label: "Bu Yıl Kazanılan",
    value: "₺7.462",
    change: 14.8,
    changeLabel: "geçen yıla göre",
    children: null,
    lejantKalemi: 0,
    lejantSutun: 2,
    donemSecici: true,
  },
  argTypes: {
    children: { control: false },
    footer: { control: false },
    action: { control: false },
    change: { control: { type: "number", step: 0.1 } },
    lejantKalemi: { control: { type: "range", min: 0, max: 6, step: 1 }, description: "Altta kaç lejant karosu" },
    lejantSutun: { control: "inline-radio", options: [2, 3] },
    donemSecici: { control: "boolean", description: "Sağ üstte dönem seçici" },
  },
  render: ({ lejantKalemi, lejantSutun, donemSecici, ...args }) => (
    <Sahne>
      <ChartCard
        {...args}
        action={donemSecici ? <Donem /> : undefined}
        footer={
          lejantKalemi > 0 ? (
            <ChartLegend
              columns={lejantSutun}
              className="px-1 pb-1"
              items={KAYIT_HUNISI.slice(0, lejantKalemi).map((s, i) => ({ label: s.label, value: s.value, series: SERILER[i] }))}
            />
          ) : undefined
        }
      >
        <TrackBarChart title="Aylık Kazanç" data={AYLAR.map((label, i) => ({ label, value: KAZANC[i] }))} ticks={[0, 5000, 10000]} format={tlKisa} />
      </ChartCard>
    </Sahne>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Kart başlığıyla adlanan bölge ve değişimin sözlü okunuşu
    const region = canvas.getByRole("region", { name: "Bu Yıl Kazanılan" });
    await expect(region).toBeInTheDocument();
    await expect(within(region).getByText(/artış, geçen yıla göre/)).toBeInTheDocument();
  },
};

export const LejantliIkiSutun: Story = {
  name: "Lejant (İki Sütun)",
  args: { label: "Ziyaretçi", value: "925", change: 5.2, changeLabel: "geçen haftaya göre", lejantKalemi: 4, lejantSutun: 2 },
};

export const LejantliUcSutun: Story = {
  name: "Lejant (Üç Sütun)",
  args: { label: "Kayıt Hunisi", value: "1.180", change: 2.4, lejantKalemi: 6, lejantSutun: 3 },
};

export const Dusus: Story = {
  name: "Düşüş",
  args: { label: "İade Edilen Sipariş", value: "₺1.284", change: -6.3, changeLabel: "geçen aya göre" },
};

export const DegisimYok: Story = {
  name: "Değişim Yok",
  args: { label: "Ortalama Sepet", value: "₺642", change: 0 },
};

export const UzunEtiket: Story = {
  name: "Uzun Etiket",
  args: {
    label: "Kurumsal Müşterilerden Gelen Yinelenen Aylık Gelir (Vergiler Hariç)",
    value: "₺1.248.930",
    change: 23.6,
    lejantKalemi: 2,
  },
};

export const BosVeri: Story = {
  name: "Boş Değer",
  args: { label: "Bu Yıl Kazanılan", value: "₺0", change: null, donemSecici: false },
  render: ({ lejantKalemi: _l, lejantSutun: _s, donemSecici: _d, ...args }) => (
    <Sahne>
      <ChartCard {...args}>
        <TrackBarChart title="Aylık Kazanç" data={AYLAR.map((label) => ({ label, value: 0 }))} ticks={[0, 5000, 10000]} format={tlKisa} />
      </ChartCard>
    </Sahne>
  ),
};

export const Telefon: Story = {
  name: "Telefon Genişliği",
  args: { lejantKalemi: 4 },
  globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  render: () => (
    <Gallery cols={2}>
      <GrafikHucre label="Artış, dönem seçicili">
        <ChartCard id="v-artis" label="Ziyaretçi" value="925" change={5.2} action={<Donem />}>
          <p className="text-small text-muted">Grafik alanı</p>
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Düşüş">
        <ChartCard id="v-dusus" label="Sepeti Terk" value="%68,4" change={-3.1}>
          <p className="text-small text-muted">Grafik alanı</p>
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Değişim yok">
        <ChartCard id="v-sabit" label="Açık Bilet" value="42" change={0}>
          <p className="text-small text-muted">Grafik alanı</p>
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Değişimsiz, yalnız değer">
        <ChartCard id="v-yalin" label="Toplam Müşteri" value="18.204">
          <p className="text-small text-muted">Grafik alanı</p>
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Lejant, iki sütun">
        <ChartCard
          id="v-lejant2"
          label="Tarayıcıya Göre Ziyaretçi"
          value="925"
          change={5.2}
          footer={<ChartLegend className="px-1 pb-1" items={TARAYICI.slice(0, 4).map((t) => ({ ...t }))} />}
        >
          <p className="text-small text-muted">Grafik alanı</p>
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Lejant, üç sütun ve birim">
        <ChartCard
          id="v-lejant3"
          label="Destek Kanalı"
          value="9.610"
          change={4.1}
          footer={
            <ChartLegend
              columns={3}
              className="px-1 pb-1"
              items={[
                { label: "Canlı Destek", value: 4230, series: 2, unit: "bilet" },
                { label: "E-posta", value: 3420, series: 3, unit: "bilet" },
                { label: "Telefon", value: 1350, series: 1, unit: "bilet" },
              ]}
            />
          }
        >
          <p className="text-small text-muted">Grafik alanı</p>
        </ChartCard>
      </GrafikHucre>
    </Gallery>
  ),
};
