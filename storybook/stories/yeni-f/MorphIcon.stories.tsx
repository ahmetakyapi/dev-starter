import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { MorphIcon, type MorphShape } from "@/components/ui/morph-icon";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Düğme ve İkon/Biçim Değiştiren İkon",
  id: "morph-icon",
  component: MorphIcon,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Aynı düğmenin iki hali arasında çizgiler yeniden dizilir: menü ↔ kapat, artı ↔ eksi, oynat ↔ duraklat. Göz düğmenin aynı düğme olduğunu görür. Her biçim üç çizgi, uçlar yayla kayar; gereksiz çizgi noktaya toplanıp söner. Hal bilgisi düğmenin adında.",
      },
    },
  },
  args: { icon: "menu" },
} satisfies Meta<typeof MorphIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

function Toggle({ a, b, labelA, labelB }: { a: MorphShape; b: MorphShape; labelA: string; labelB: string }) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      aria-label={on ? labelB : labelA}
      className="grid size-12 place-items-center rounded-xl bg-overlay text-strong shadow-raised"
    >
      <MorphIcon icon={on ? b : a} size={22} />
    </button>
  );
}

export const Default: Story = {
  name: "Varsayılan",
  render: () => (
    <Frame width="sm">
      <div className="grid justify-items-center">
        <Toggle a="menu" b="close" labelA="Menüyü Aç" labelB="Menüyü Kapat" />
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Menüyü Aç" }));
    await expect(canvas.getByRole("button", { name: "Menüyü Kapat" })).toBeVisible();
  },
};

const PAIRS: [MorphShape, MorphShape, string, string][] = [
  ["plus", "minus", "Genişlet", "Daralt"],
  ["play", "pause", "Oynat", "Duraklat"],
  ["chevron-down", "chevron-up", "Ayrıntıyı Göster", "Ayrıntıyı Gizle"],
  ["arrow-right", "check", "Gönder", "Gönderildi"],
  ["arrow-left", "close", "Geri", "Kapat"],
];

export const Pairs: Story = {
  name: "Çiftler",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      {PAIRS.map(([a, b, la, lb]) => (
        <Cell key={a} label={`${a} ↔ ${b}`}>
          <Toggle a={a} b={b} labelA={la} labelB={lb} />
        </Cell>
      ))}
    </Gallery>
  ),
};
