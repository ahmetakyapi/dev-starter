import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HalftoneImage } from "@/components/ui/halftone-image";
import { Cell, Frame, Gallery } from "../_lib/Frame";

/* Örnek görsel ağdan gelmez: aynı kökenden, CORS'suz bir SVG (ışık alan iki küre; yarım tonun klasik sınavı). */
const CUP = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
<defs>
<radialGradient id="bg" cx="0.75" cy="0.15" r="1"><stop offset="0" stop-color="white"/><stop offset="1" stop-color="dimgray"/></radialGradient>
<radialGradient id="s" cx="0.34" cy="0.3" r="0.75"><stop offset="0" stop-color="white"/><stop offset="0.45" stop-color="silver"/><stop offset="1" stop-color="black"/></radialGradient>
<radialGradient id="s2" cx="0.3" cy="0.28" r="0.8"><stop offset="0" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient>
<filter id="b"><feGaussianBlur stdDeviation="14"/></filter>
</defs>
<rect width="640" height="480" fill="url(#bg)"/>
<ellipse cx="300" cy="420" rx="190" ry="34" fill="black" opacity="0.55" filter="url(#b)"/>
<circle cx="290" cy="250" r="165" fill="url(#s)"/>
<ellipse cx="515" cy="410" rx="70" ry="14" fill="black" opacity="0.5" filter="url(#b)"/>
<circle cx="510" cy="355" r="58" fill="url(#s2)"/>
</svg>`)}`;

const meta = {
  title: "Bileşenler/Hareket ve Doku/Yarım Ton Görsel",
  id: "halftone-image",
  component: HalftoneImage,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Fotoğrafı token renginde nokta, kare ya da ASCII ızgarasına çevirir; palet ve tema değişince yeniden çizilir. İnce işaretçide imlecin çevresi koyulaşır (yalnız hareket ederken çizilir). `alt` zorunlu; başka kökenden görsel CORS izni ister.",
      },
    },
  },
  args: { src: CUP, alt: "Işık alan iki küre", mode: "dots", cell: 9 },
  render: (args) => (
    <Frame width="lg">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-overlay shadow-raised">
        <HalftoneImage {...args} className="text-primary" />
      </div>
    </Frame>
  ),
} satisfies Meta<typeof HalftoneImage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const Modes: Story = {
  name: "Kipler",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      {(["dots", "squares", "ascii"] as const).map((mode) => (
        <Cell key={mode} label={mode} className="p-3">
          <div className="aspect-[4/3] w-full">
            <HalftoneImage src={CUP} alt="Işık alan iki küre" mode={mode} cell={mode === "ascii" ? 10 : 7} contrast={1.6} className="text-strong" />
          </div>
        </Cell>
      ))}
    </Gallery>
  ),
};
