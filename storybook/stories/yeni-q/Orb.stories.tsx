import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Orb, OrbCarousel } from "@/components/ui/orb";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Tanıtım/Küre",
  id: "orb",
  component: Orb,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Kartın ya da kahramanın odak nesnesi: `swirl` (içinde renkler dönen parlak cam küre, isteğe bağlı yer gölgesi) ve `globe` (meridyenleri dönen, şehir noktaları nabız atan noktalı dünya). `OrbCarousel` küreleri sıralar: ortadaki net ve büyük, yandakiler küçülür, bulanıklaşır, kenarda kesilir. 3D varlık yok; CSS degrade ve SVG, renkler token'dan ya da `colors` ile. Hareket azaltmada durağan.",
      },
    },
  },
  args: { variant: "swirl", size: 140, shadow: true },
  argTypes: { variant: { control: "inline-radio", options: ["swirl", "globe"] }, size: { control: { type: "range", min: 32, max: 240, step: 4 } } },
  render: (args) => (
    <Frame width="sm">
      <div className="grid place-items-center py-6">
        <Orb {...args} />
      </div>
    </Frame>
  ),
} satisfies Meta<typeof Orb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    // Süs küre: erişilebilirlik ağacında yer tutmaz.
    await expect(canvasElement.querySelector("[aria-hidden='true']")).not.toBeNull();
  },
};

export const Variants: Story = {
  name: "Biçimler",
  render: () => (
    <Gallery cols={3}>
      <Cell label="swirl · varsayılan renk">
        <Orb size={120} shadow />
      </Cell>
      <Cell label="swirl · sıcak">
        <Orb size={120} shadow colors={["var(--danger)", "var(--accent-warm)", "var(--primary-soft)"]} />
      </Cell>
      <Cell label="globe">
        <Orb variant="globe" size={140} label="Dünya, 40 ülkede kullanılıyor (örnek)" />
      </Cell>
    </Gallery>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("img", { name: /Dünya/ })).toBeInTheDocument();
  },
};

export const Carousel: Story = {
  name: "Küre Şeridi",
  render: function Render() {
    const [value, setValue] = useState("b");
    return (
      <Frame width="lg">
        <OrbCarousel
          label="Araştırma alanları"
          value={value}
          onSelect={setValue}
          items={[
            { id: "a", label: "Görsel Veri", colors: ["var(--primary)", "var(--accent-warm)", "var(--primary-soft)"] },
            { id: "b", label: "Model" },
            { id: "c", label: "Dünya", variant: "globe" },
            { id: "d", label: "Ses", colors: ["var(--primary-hover)", "var(--primary-soft)", "var(--text-muted)"] },
          ]}
        />
      </Frame>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Model" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Dünya" }));
    await expect(canvas.getByRole("button", { name: "Dünya" })).toHaveAttribute("aria-pressed", "true");
  },
};
