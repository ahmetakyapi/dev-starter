import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { TimeScrubber } from "@/components/ui/time-scrubber";
import { Cell, Frame, Gallery } from "../_lib/Frame";

function Stateful({ initial = 570, ...rest }: { initial?: number; step?: number; min?: number; max?: number; hint?: string; label?: string }) {
  const [value, setValue] = useState(initial);
  return <TimeScrubber label={rest.label ?? "Günlük Özet Saati"} value={value} onValueChange={setValue} {...rest} />;
}

const meta = {
  title: "Bileşenler/Form Girişleri/Saat Cetveli",
  id: "time-scrubber",
  component: TimeScrubber,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Günün akışında bir an seçmek için: hatırlatma, günlük özet, sessiz saat başlangıcı. İbre sabit, cetvel altından akar; aralık bir bakışta görünür. `role=\"slider\"`: ← → bir dilim, PageUp/PageDown bir saat, Home/End uçlar; değer metni “09.30”. Sürükleme, tekerlek ve dokunmatik çalışır. Kesin saat yazılacaksa Saat Alanı.",
      },
    },
  },
  args: { label: "Günlük Özet Saati", value: 570, onValueChange: () => undefined },
  render: () => (
    <Frame width="sm">
      <Stateful hint="Hafta İçi Her Gün" />
    </Frame>
  ),
} satisfies Meta<typeof TimeScrubber>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole("slider", { name: "Günlük Özet Saati" });
    await expect(slider).toHaveAttribute("aria-valuetext", "09.30");
    slider.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await expect(slider).toHaveAttribute("aria-valuetext", "10.00");
    await userEvent.keyboard("{PageDown}");
    await expect(slider).toHaveAttribute("aria-valuetext", "09.00");
    await userEvent.keyboard("{End}");
    await expect(slider).toHaveAttribute("aria-valuetext", "22.00");
  },
};

export const FiveMinutes: Story = {
  name: "Beş Dakikalık Dilim",
  render: () => (
    <Frame width="sm">
      <Stateful label="Hatırlatma" initial={14 * 60 + 35} step={5} min={12 * 60} max={18 * 60} hint="Bugün" />
    </Frame>
  ),
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="15 Dakika · 06.00-22.00">
        <Stateful />
      </Cell>
      <Cell label="5 Dakika · Öğleden Sonra">
        <Stateful label="Hatırlatma" initial={15 * 60} step={5} min={12 * 60} max={18 * 60} />
      </Cell>
    </Gallery>
  ),
};
