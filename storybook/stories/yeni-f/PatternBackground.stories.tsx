import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PatternBackground } from "@/components/ui/pattern-bg";
import { Button } from "@/components/ui/Button";
import { Cell, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Hareket ve Doku/Desen Zemin",
  id: "pattern-bg",
  component: PatternBackground,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Bölümün arkasına token renginde desen, solma maskesi ve ışık: üç bağımsız katman (`pattern`, `fade`, `glow`). Tema ve paletle kendiliğinden döner. Hazır birleşimlerin tamamı **Örnek Tasarım → Desen Kütüphanesi**nde; kartta “Kopyala” JSX'i verir. Kap `relative isolate` olmalı.",
      },
    },
  },
  args: { pattern: "grid", fade: "top", glow: "glow-top", tone: "neutral", size: 32, intensity: 0.45 },
  render: (args) => (
    <section className="relative isolate grid min-h-[520px] place-items-center bg-page px-6 py-24 text-center">
      <PatternBackground {...args} />
      <div className="grid max-w-xl justify-items-center gap-5">
        <h1 className="text-hero font-semibold tracking-tight text-balance text-strong">Siparişler tek ekranda.</h1>
        <p className="text-lead text-body">Web, toptan ve abonelik siparişleri aynı listede; kargoya çıkana kadar.</p>
        <Button>Ücretsiz Dene</Button>
      </div>
    </section>
  ),
} satisfies Meta<typeof PatternBackground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const Layers: Story = {
  name: "Katmanlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      {(
        [
          ["Yalnız desen", { pattern: "dots", size: 16 }],
          ["+ solma (merkez)", { pattern: "dots", size: 16, fade: "center" }],
          ["+ ışık (ufuk)", { pattern: "dots", size: 16, fade: "center", glow: "horizon-bottom", intensity: 0.5 }],
        ] as const
      ).map(([label, props]) => (
        <Cell key={label} label={label} className="relative isolate h-56 overflow-hidden bg-page p-0">
          <PatternBackground {...props} />
        </Cell>
      ))}
    </Gallery>
  ),
};
