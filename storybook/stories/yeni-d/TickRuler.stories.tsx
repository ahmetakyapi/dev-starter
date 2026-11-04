import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { TickRuler } from "@/components/ui/tick-ruler";
import { Cell, Frame, Gallery } from "../_lib/Frame";

/** Gece yarısından dakika → "09:45". */
const hhmm = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
const spokenTime = (minutes: number) => `Saat ${hhmm(minutes)}`;
const celsius = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const meta = {
  title: "Bileşenler/Form Girişleri/Cetvel Seçici",
  id: "tick-ruler",
  component: TickRuler,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Değer, ortadaki sabit göstergenin altından kayan cetvelle seçilir: saat, süre, sıcaklık. Sürükleme, yatay tekerlek ve klavye (oklar bir adım, PageUp/PageDown bir büyük çentik, Home/End) aynı hareket değerini sürer; bırakınca en yakın adıma yayla oturur. Büyük değer sakin (500 ağırlık), rakamlar değişince yuvarlanır. `role=\"slider\"`; `aria-valuetext` okunuşu özelleştirir. Kesin sayı için Sayı Alanı, aralık için Kaydırıcı.",
      },
    },
  },
  args: {
    label: "Toplantı Saati",
    min: 8 * 60,
    max: 20 * 60,
    step: 15,
    majorEvery: 4,
    defaultValue: 9 * 60 + 45,
    format: hhmm,
    valueText: spokenTime,
  },
  render: (args) => (
    <Frame width="md">
      <div className="rounded-2xl bg-overlay p-5 shadow-raised">
        <TickRuler {...args} />
      </div>
    </Frame>
  ),
} satisfies Meta<typeof TickRuler>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Saat",
  play: async ({ canvasElement }) => {
    const slider = within(canvasElement).getByRole("slider", { name: "Toplantı Saati" });
    await expect(slider).toHaveAttribute("aria-valuetext", "Saat 09:45");
    slider.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await expect(slider).toHaveAttribute("aria-valuenow", String(10 * 60 + 15));
    await userEvent.keyboard("{PageDown}");
    await expect(slider).toHaveAttribute("aria-valuetext", "Saat 09:15");
    await userEvent.keyboard("{Home}");
    await expect(slider).toHaveAttribute("aria-valuetext", "Saat 08:00");
  },
};

export const Temperature: Story = {
  name: "Termostat",
  args: {
    label: "Salon Sıcaklığı",
    min: 16,
    max: 28,
    step: 0.5,
    majorEvery: 2,
    defaultValue: 21.5,
    unit: "°C",
    format: (v: number) => celsius.format(v),
    formatTick: (v: number) => String(v),
    valueText: (v: number) => `${celsius.format(v)} santigrat derece`,
    spacing: 14,
  },
};

function Controlled() {
  const [minutes, setMinutes] = useState(45);
  return (
    <div className="grid gap-4">
      <TickRuler label="Odak Süresi" min={5} max={120} step={5} majorEvery={3} unit="dk" value={minutes} onValueChange={setMinutes} spacing={16} />
      <p className="text-small text-muted">
        Mola <span className="font-medium text-strong tabular-nums">{Math.round(minutes / 5)} dk</span> sonra; seçim üstteki bileşende.
      </p>
    </div>
  );
}

export const ControlledValue: Story = {
  name: "Denetimli Değer",
  render: () => (
    <Frame width="md">
      <div className="rounded-2xl bg-overlay p-5 shadow-raised">
        <Controlled />
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole("slider", { name: "Odak Süresi" });
    slider.focus();
    await userEvent.keyboard("{End}");
    await expect(slider).toHaveAttribute("aria-valuenow", "120");
    await expect(canvas.getByText("24 dk")).toBeInTheDocument();
  },
};

export const Dark: Story = {
  name: "Koyu Tema",
  globals: { theme: "dark" },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Saat · 15 Dakikalık Adım">
        <div className="w-full rounded-2xl bg-overlay p-5 shadow-raised">
          <TickRuler label="Teslim Saati" min={9 * 60} max={18 * 60} step={15} majorEvery={4} defaultValue={14 * 60 + 30} format={hhmm} valueText={spokenTime} />
        </div>
      </Cell>
      <Cell label="Ondalık · Birimli">
        <div className="w-full rounded-2xl bg-overlay p-5 shadow-raised">
          <TickRuler label="Kavurma Ağırlığı" min={1} max={15} step={0.5} majorEvery={2} defaultValue={6} unit="kg" formatTick={(v) => String(v)} spacing={14} />
        </div>
      </Cell>
      <Cell label="Sık Çentik · Etiket Seyrek">
        <div className="w-full rounded-2xl bg-overlay p-5 shadow-raised">
          <TickRuler label="Bütçe Payı" min={0} max={100} step={1} majorEvery={10} labelEvery={20} defaultValue={35} format={(v) => `%${v}`} spacing={8} />
        </div>
      </Cell>
    </Gallery>
  ),
};
