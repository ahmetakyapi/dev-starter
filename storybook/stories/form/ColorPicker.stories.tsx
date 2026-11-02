import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { ColorPicker } from "@/components/ui/color-picker";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { settle } from "./_a11y";
import { COLORS } from "./_data";

/** Kullanıcının seçtiği renk dışarıda tutulur; önizleme kartı aynı değeri okur. */
function ControlledDemo() {
  const [color, setColor] = useState("#c084fc");
  return (
    <div className="grid w-full gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
      <div className="rounded-lg bg-overlay p-4 shadow-raised">
        <ColorPicker label="Kategori Rengi" value={color} onValueChange={setColor} presets={COLORS} />
      </div>
      <div className="grid content-start gap-3 rounded-lg bg-overlay p-4 shadow-raised">
        <p className="text-small font-semibold text-muted">Önizleme</p>
        <div className="flex items-center gap-2.5">
          {/* Renk kullanıcı verisi: satır içi stil, token değil. */}
          <span aria-hidden className="size-3 rounded-full ring-1 ring-line" style={{ backgroundColor: color }} />
          <span className="text-base font-semibold text-strong">Market Alışverişi</span>
        </div>
        <p className="font-mono text-small text-body uppercase">{color}</p>
        <button
          type="button"
          onClick={() => setColor("#3b82f6")}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-overlay px-3 text-small font-semibold text-strong shadow-raised transition-colors hover:bg-surface pointer-fine:min-h-9"
        >
          Varsayılana Dön
        </button>
      </div>
    </div>
  );
}

const meta = {
  title: "Bileşenler/Form Girişleri/Renk Seçici",
  id: "color-picker",
  component: ColorPicker,
  tags: ["autodocs"],
  // Geçişler otursun, a11y denetimi yarım renk yakalamasın (bkz. _a11y.ts).
  afterEach: settle,
  parameters: {
    docs: {
      description: {
        component:
          "Kullanıcının kendi rengi için (etiket, takvim kategorisi, marka rengi); sistemin vurgu ve durum renkleri bundan seçilmez, token'dır. Alan ←/→ doygunluk, ↑/↓ parlaklık; ton şeridi ayrı bir kaydırıcı. Geçersiz hex yazımı eski renge döner.",
      },
    },
  },
  args: {
    label: "Etiket Rengi",
    defaultValue: "#3b82f6",
    presets: COLORS,
    hint: "Etiket listelerde bu renkte görünür.",
    onValueChange: fn(),
  },
  render: (args) => (
    <Frame width="sm">
      <div className="rounded-lg bg-overlay p-4 shadow-raised">
        <ColorPicker {...args} />
      </div>
    </Frame>
  ),
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const hue = canvas.getByRole("slider", { name: "Ton" });
    hue.focus();
    await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
    await expect(hue).toHaveAttribute("aria-valuenow", "227");
    await expect(args.onValueChange).toHaveBeenCalled();
  },
};

export const Presets: Story = {
  name: "Hazır Renkler",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const leylak = canvas.getByRole("button", { name: "Leylak" });
    await userEvent.click(leylak);
    await expect(leylak).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByRole("textbox", { name: "Onaltılık Renk Kodu" })).toHaveValue("C084FC");
  },
};

export const WithoutPresets: Story = {
  name: "Hazır Renksiz",
  args: { presets: undefined, defaultValue: "#34d399", label: "Marka Rengi", hint: undefined },
};

export const Controlled: Story = {
  name: "Kontrollü",
  parameters: { layout: "padded" },
  render: () => (
    <Frame width="lg">
      <ControlledDemo />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const hex = canvas.getByRole("textbox", { name: "Onaltılık Renk Kodu" });
    await userEvent.clear(hex);
    await userEvent.type(hex, "facc15{Enter}");
    await expect(canvas.getByText("#facc15")).toBeInTheDocument();
  },
};

export const Invalid: Story = {
  name: "Hatalı",
  args: { label: "Etiket Rengi", hint: undefined, error: "Bu renk başka bir etikette kullanılıyor." },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Hazır Renkli">
        <div className="w-full rounded-lg bg-overlay p-4 shadow-raised">
          <ColorPicker label="Etiket Rengi" defaultValue="#3b82f6" presets={COLORS} />
        </div>
      </Cell>
      <Cell label="Hazır Renksiz">
        <div className="w-full rounded-lg bg-overlay p-4 shadow-raised">
          <ColorPicker label="Marka Rengi" defaultValue="#34d399" />
        </div>
      </Cell>
      <Cell label="Hata">
        <div className="w-full rounded-lg bg-overlay p-4 shadow-raised">
          <ColorPicker label="Etiket Rengi" defaultValue="#f472b6" presets={COLORS.slice(0, 4)} error="Bu renk başka bir etikette kullanılıyor." />
        </div>
      </Cell>
    </Gallery>
  ),
};
