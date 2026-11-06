import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Dial } from "@/components/ui/dial";
import { Frame } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Form Girişleri/Döner Düğme",
  id: "dial",
  component: Dial,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "270° kadranda sürekli değer: ses, sıcaklık, yoğunluk. Yukarı ya da sağa sürüklemek artırır (160 px tüm aralık, Shift on kat ince); tekerlek yalnız odaktayken. `role=\"slider\"`: oklar, PageUp/PageDown on adım, Home/End. Ortadaki değer `digit-roll` ile yuvarlanır.",
      },
    },
  },
  args: { label: "Sıcaklık", min: 16, max: 30, defaultValue: 22, unit: "°C" },
  render: (args) => (
    <Frame width="sm">
      <div className="grid justify-items-center">
        <Dial {...args} />
      </div>
    </Frame>
  ),
} satisfies Meta<typeof Dial>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dial = canvas.getByRole("slider", { name: "Sıcaklık" });
    await userEvent.click(dial);
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    await expect(dial).toHaveAttribute("aria-valuenow", "24");
    await userEvent.keyboard("{End}");
    await expect(dial).toHaveAttribute("aria-valuetext", "30 °C");
  },
};

export const Panel: Story = {
  name: "Kontrol Paneli",
  render: () => (
    <Frame width="lg">
      <div className="grid grid-cols-1 justify-items-center gap-8 rounded-xl bg-overlay p-6 shadow-raised sm:grid-cols-3">
        <Dial label="Öğütme" min={1} max={40} defaultValue={18} size={120} />
        <Dial label="Su Sıcaklığı" min={85} max={96} defaultValue={93} unit="°C" size={120} />
        <Dial label="Demleme" min={0} max={6} step={0.5} defaultValue={3.5} unit="dk" format={{ minimumFractionDigits: 1 }} size={120} />
      </div>
    </Frame>
  ),
};

export const Disabled: Story = { name: "Devre Dışı", args: { disabled: true } };
