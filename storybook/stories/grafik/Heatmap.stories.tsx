import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ChartCard } from "@/components/ui/chart-card";
import { Heatmap } from "@/components/ui/heatmap";
import { Gallery } from "../_lib/Frame";
import { Donem, GrafikHucre, Sahne } from "./_sahne";
import { gunluk, sayi, toplam } from "./_veri";

type Args = ComponentProps<typeof Heatmap> & { haftaSayisi: number; tepe: number };

const meta = {
  title: "Grafikler/Isı Haritası",
  id: "heatmap",
  component: Heatmap,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Günlük bir sayının (sipariş, bilet, katkı) haftalar × günler ritmi; beş basamak, tek renk ailesi: renk değil açıklık sayar. Kare boyu sabit, sığmayan geçmiş yatay kaydırılır ve açılışta en yeni hafta görünür. Izgaraya odaklanıp oklarla gün gün gezilir; koyu temada boş gün ile ilk basamak birbirine yakın.",
      },
    },
  },
  args: {
    title: "Günlük Sipariş",
    data: gunluk({ weeks: 26, peak: 11 }),
    unit: "sipariş",
    haftaSayisi: 26,
    tepe: 11,
  },
  argTypes: {
    data: { control: false },
    end: { control: "text" },
    levels: { control: "object" },
    weeks: { control: false },
    haftaSayisi: { control: { type: "range", min: 4, max: 53, step: 1 }, description: "Kaç hafta (veri de buna göre üretilir)" },
    tepe: { control: { type: "range", min: 0, max: 40, step: 1 }, description: "En yoğun günün kabaca tavanı (0: boş)" },
  },
  render: ({ haftaSayisi, tepe, data: _data, ...args }) => {
    const data = gunluk({ weeks: haftaSayisi, peak: tepe });
    return (
      <Sahne width="lg">
        <ChartCard id="isi-kart" label={args.title} value={sayi(toplam(data.map((d) => d.value)))} change={9.6} action={<Donem defaultValue="90g" />}>
          <Heatmap {...args} data={data} weeks={haftaSayisi} end="2026-10-31" />
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
    const grid = canvas.getByRole("group", { name: /oklarla gün gün/ });
    grid.focus();
    // İlk tuş son güne konar, ← bir hafta geri gider
    await userEvent.keyboard("{ArrowRight}");
    const live = canvasElement.querySelector("figure [aria-live]");
    await expect(live).toHaveTextContent("31 Ekim 2026");
    await userEvent.keyboard("{ArrowLeft}");
    await expect(live).toHaveTextContent("24 Ekim 2026");
  },
};

export const SupportTickets: Story = {
  name: "Destek Bileti, Sabit Basamaklar",
  args: { title: "Günlük Açılan Bilet", unit: "bilet", tepe: 34, levels: [5, 15, 25] },
};

export const FullYear: Story = {
  name: "Tam Yıl (53 Hafta)",
  args: { title: "Yıllık Katkı", unit: "katkı", haftaSayisi: 53 },
};

export const FewData: Story = {
  name: "Az Veri (Altı Hafta)",
  args: { haftaSayisi: 6 },
};

export const Empty: Story = {
  name: "Boş (Hiç Etkinlik Yok)",
  args: { title: "Yeni Mağaza Siparişi", tepe: 0 },
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
        { label: "Seyrek (Tavan 4)", peak: 4, seed: 3 },
        { label: "Orta (Tavan 11)", peak: 11, seed: 7 },
        { label: "Yoğun (Tavan 30)", peak: 30, seed: 11 },
        { label: "Boş", peak: 0, seed: 1 },
      ].map((v) => {
        const data = gunluk({ weeks: 20, peak: v.peak, seed: v.seed });
        return (
          <GrafikHucre key={v.label} label={v.label}>
            <ChartCard id={`isi-${v.seed}`} label={`Günlük Sipariş · ${v.label}`} value={sayi(toplam(data.map((d) => d.value)))}>
              <Heatmap title={`Günlük sipariş, ${v.label}`} data={data} weeks={20} unit="sipariş" />
            </ChartCard>
          </GrafikHucre>
        );
      })}
    </Gallery>
  ),
};
