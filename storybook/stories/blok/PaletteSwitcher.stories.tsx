import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Check, Orbit } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { PaletteSwitcher } from "@/components/ui/palette-switcher";
import { DEFAULT_THEME, PALETTE } from "@/lib/theme";
import { Cell, Frame, Gallery } from "../_lib/Frame";

/** Paletin dokunduğu yüzeyler: marka karosu, birincil eylem, yıkanmış vurgu, grafik serileri. */
function PalettePreview() {
  const bars = [62, 84, 48, 72, 38, 56];
  const series = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5", "bg-chart-6"];
  return (
    <div className="rounded-xl bg-overlay p-5 shadow-raised ring-1 ring-line sm:p-6">
      <div className="flex items-center gap-3">
        <span aria-hidden className="inline-grid size-10 place-items-center rounded-lg bg-brand text-on-brand">
          <Orbit className="size-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold text-strong">Pusula Çalışma Alanı</p>
          <p className="text-small text-muted">Palet değişince yalnız eylemler ve vurgular renk değiştirir.</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-cta px-4 text-base font-semibold text-on-brand shadow-cta">
          Raporu Paylaş
        </button>
        <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-primary-wash px-3 text-small font-semibold text-primary-ink [&_svg]:size-3.5">
          <Check aria-hidden strokeWidth={2.5} />
          Plan tamamlandı
        </span>
        <a href="/raporlar" className="text-base font-medium text-primary-ink underline-offset-4 hover:underline">
          Bütün raporlar
        </a>
      </div>
      <div aria-hidden className="mt-6 flex h-24 items-end gap-2 rounded-lg bg-surface p-3">
        {bars.map((height, index) => (
          <span key={series[index]} className={`flex-1 rounded-sm ${series[index]}`} style={{ height: `${height}%` }} />
        ))}
      </div>
    </div>
  );
}

const meta = {
  title: "Bloklar/Palet Seçici",
  component: PaletteSwitcher,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "On palet noktası ve açık/koyu anahtarı. Seçim `<html data-palette>`a ve çereze yazılır, anında uygulanır (Kaydet yok). Vitrin ve tema denemesinde altta yüzer; ürün ayarında `floating={false}` ile satıra girer. `app/palettes.css` yüklü olmalı; nokta renkleri oradaki `--swatch-*`.",
      },
    },
  },
  args: {
    initialPalette: PALETTE,
    initialTheme: DEFAULT_THEME,
    floating: true,
    label: "Renk Paleti",
  },
  argTypes: {
    palettes: { control: false },
    initialTheme: { control: "inline-radio", options: ["light", "dark", null] },
  },
} satisfies Meta<typeof PaletteSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Yuzen: Story = {
  name: "Yüzen",
  parameters: {
    layout: "fullscreen",
    docs: { story: { inline: false, height: "32rem" } },
  },
  render: (args) => (
    <div className="grid min-h-dvh place-items-center bg-page px-4 pt-8 pb-32">
      <div className="w-full max-w-xl">
        <PalettePreview />
      </div>
      <PaletteSwitcher {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("radiogroup", { name: "Renk Paleti" });
    await userEvent.click(within(group).getByRole("radio", { name: "Yakut" }));
    await waitFor(() => expect(document.documentElement.dataset.palette).toBe("ruby"));
    await expect(within(group).getByRole("radio", { name: "Yakut" })).toHaveAttribute("aria-checked", "true");
  },
};

export const SatirIci: Story = {
  name: "Satır İçi",
  args: { floating: false },
  render: (args) => (
    <Frame width="lg">
      <div className="grid gap-4">
        <PalettePreview />
        <div className="flex justify-center">
          <PaletteSwitcher {...args} />
        </div>
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("radiogroup");
    const checked = within(group).getByRole("radio", { checked: true });
    checked.focus();
    const before = document.documentElement.dataset.palette;
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(document.documentElement.dataset.palette).not.toBe(before));
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(document.documentElement.dataset.palette).toBe("signature"));
  },
};

export const TemaAnahtarsiz: Story = {
  name: "Tema Anahtarsız",
  args: { floating: false, initialTheme: null },
  render: (args) => (
    <Frame width="md">
      <div className="flex justify-center">
        <PaletteSwitcher {...args} />
      </div>
    </Frame>
  ),
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  render: (args) => (
    <Gallery cols={2}>
      <Cell label="Satır içi · tema anahtarıyla">
        <PaletteSwitcher {...args} floating={false} label="Renk Paleti, tema anahtarıyla" />
      </Cell>
      <Cell label="Satır içi · yalnız paletler">
        <PaletteSwitcher {...args} floating={false} initialTheme={null} label="Renk Paleti, yalnız paletler" />
      </Cell>
      <Cell label="Dört palet · dar seçim">
        <PaletteSwitcher
          {...args}
          floating={false}
          initialTheme={null}
          label="Renk Paleti, dört seçenek"
          palettes={[
            { id: "signature", label: "Signature" },
            { id: "cobalt", label: "Kobalt" },
            { id: "jade", label: "Yeşim" },
            { id: "ember", label: "Kehribar" },
          ]}
        />
      </Cell>
      <Cell label="Paletin dokunduğu yüzeyler" className="block">
        <PalettePreview />
      </Cell>
    </Gallery>
  ),
};
