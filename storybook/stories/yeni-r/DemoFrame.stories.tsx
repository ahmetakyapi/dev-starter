import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { DemoFrame } from "@/components/ui/demo-frame";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";

function Periods() {
  const [value, setValue] = useState<"gun" | "hafta" | "ay">("gun");
  const bars = { gun: [4, 7, 5, 9, 6, 8, 5], hafta: [6, 5, 8, 7, 9, 6, 7], ay: [3, 6, 9, 8, 5, 7, 9] }[value];
  return (
    <div className="w-60 rounded-xl bg-overlay p-4 shadow-raised">
      <SegmentedControl
        aria-label="Dönem"
        value={value}
        onValueChange={setValue}
        size="sm"
        options={[
          { value: "gun", label: "Gün" },
          { value: "hafta", label: "Hafta" },
          { value: "ay", label: "Ay" },
        ]}
      />
      <div aria-hidden className="mt-4 flex h-16 items-end gap-1.5">
        {bars.map((h, i) => (
          <span key={i} className="flex-1 rounded-sm bg-chart-track transition-[height] duration-300" style={{ height: `${h * 10}%` }} />
        ))}
      </div>
    </div>
  );
}

const meta = {
  title: "Bileşenler/Tanıtım/Lab Çerçevesi",
  id: "demo-frame",
  component: DemoFrame,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Canlı bileşeni noktalı zeminli yuvarlak kuyuda sergiler; altında tek paragraf künye (\"**Kalın başlık.** soluk açıklama\") ve isteğe \"Devamı\" hapı. Kişisel sitenin Lab sekmesi, desen sayfası, etkileşim denemesi. Sunucu bileşeni. Sakin Akış turundan (yalnız davranış).",
      },
    },
  },
  args: {
    title: "Kayan seçim.",
    description: "Sekme ve anahtarlar yeni durumlarına sıçramaz, kayar.",
    href: "#kayan-secim",
    children: null,
  },
  render: (args) => (
    <div className="w-[min(100vw-2rem,36rem)]">
      <DemoFrame {...args}>
        <Periods />
      </DemoFrame>
    </div>
  ),
} satisfies Meta<typeof DemoFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const figure = canvas.getByRole("figure");
    await expect(figure).toHaveAccessibleName(/Kayan seçim\./);
    await userEvent.click(canvas.getByRole("radio", { name: "Hafta" }));
    await expect(canvas.getByRole("radio", { name: "Hafta" })).toBeChecked();
    await expect(canvas.getByRole("link", { name: "Devamı" })).toHaveAttribute("href", "#kayan-secim");
  },
};

export const WithControls: Story = {
  name: "Sahne Seçicili, Küçük",
  args: { title: "Anında etki.", description: "Kaydet butonu yok; anahtar değeri hemen uygular.", href: undefined, size: "sm" },
  render: (args) => (
    <div className="w-[min(100vw-2rem,36rem)]">
      <DemoFrame
        {...args}
        controls={<span className="inline-flex min-h-8 items-center rounded-lg bg-overlay px-2.5 text-small text-strong shadow-raised">Anahtar</span>}
      >
        <div className="w-60 rounded-xl bg-overlay px-4 py-1 text-small text-strong shadow-raised">
          <Switch label="Haftalık özet" defaultChecked />
        </div>
      </DemoFrame>
    </div>
  ),
};
