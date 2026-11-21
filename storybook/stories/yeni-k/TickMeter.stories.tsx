import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { TickMeter } from "@/components/ui/tick-meter";
import { Frame } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Geri Bildirim/Çentikli Çubuk",
  id: "tick-meter",
  component: TickMeter,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Birimi sayılabilen işin gidişatı: her çentik bir gün ya da görev. Dolu çentikler birincil renk, tahmini AŞAN kısım `danger` çentik olarak uzar, tahmine girmemiş planlanan iş çizgili çentik olur, istenirse bir eşik işaretçisi çubuğun üstünden geçer. Doluluk için Ölçer; bu bir işin ilerleyişi ve aşımı. Aşım yalnız renkle değil, görünen metin ve `aria-valuetext` ile söylenir. Plotline panosu referans turundan (yalnız yapı). Örnek veri ÖRNEK'tir.",
      },
    },
  },
  args: { label: "Biten Görev", value: 31, max: 50, text: "%62", valueText: "31 / 50 görev, %62" },
  render: (args) => (
    <Frame width="md">
      <TickMeter {...args} />
    </Frame>
  ),
} satisfies Meta<typeof TickMeter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const meter = within(canvasElement).getByRole("meter", { name: "Biten Görev" });
    await expect(meter).toHaveAttribute("aria-valuetext", "31 / 50 görev, %62");
  },
};

export const Over: Story = {
  name: "Tahmin Aşıldı ve Planlanan",
  render: () => (
    <Frame width="md">
      <div className="grid gap-5 text-small text-muted">
        <div className="grid gap-1.5">
          Ödeme Servisi (ÖRNEK)
          <TickMeter label="Ödeme Servisi" value={9} max={6} planned={3} text="9 / 6g" valueText="9 / 6 gün, 3 gün fazla" />
        </div>
        <div className="grid gap-1.5">
          Yarım Kalan İş (ÖRNEK)
          <TickMeter label="Yarım Kalan İş" value={4} max={5} planned={2} text="4 / 5g" />
        </div>
        <div className="grid gap-1.5">
          Başlanmamış (ÖRNEK)
          <TickMeter label="Başlanmamış" value={0} max={3} text="0 / 3g" />
        </div>
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const meter = within(canvasElement).getByRole("meter", { name: "Ödeme Servisi" });
    await expect(meter).toHaveAttribute("aria-valuetext", "9 / 6 gün, 3 gün fazla");
  },
};

export const Marker: Story = {
  name: "Eşik İşaretçisi",
  render: () => (
    <Frame width="md">
      <TickMeter label="Ekip Yükü" value={95} max={100} ticks={30} marker={0.95} size="md" text="95 / 100%" valueText="Ekip yükü %95, eşik %95" />
    </Frame>
  ),
};
