import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { ArtMat } from "@/components/ui/art-mat";
import { Cell, Gallery } from "../_lib/Frame";
import { DemoWindow } from "./_sahne";

const meta = {
  title: "Bileşenler/Tanıtım/Sergi Paspartusu",
  id: "art-mat",
  component: ArtMat,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Ürün arayüzünü dokulu bir \"tablo\" zemininin üstünde sergiler: boya katmanları (`strata`), kareli kağıt (`grid`) ya da sulu boya gök (`wash`). Kenar isteğe bağlı yırtık kağıt; `crop` pencerenin altını kırpar, `scrollInset` bandı görünüme girerken karta daraltır. Doku SVG filtresiyle token renklerinden üretilir (hex yok), palet ve temayla döner. Synaps, Lasso, Grain ve Veridical referans turundan (yalnız yapı).",
      },
    },
  },
  args: { variant: "strata", tone: "primary", edge: "torn", crop: false, pad: "md", scrollInset: false },
  argTypes: {
    variant: { control: "inline-radio", options: ["strata", "grid", "wash", "smear"] },
    tone: { control: "inline-radio", options: ["primary", "earth"] },
    edge: { control: "inline-radio", options: ["torn", "clean"] },
    pad: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
  render: (args) => (
    <div className="w-[min(100vw-2rem,64rem)]">
      <ArtMat {...args}>
        <DemoWindow />
      </ArtMat>
    </div>
  ),
} satisfies Meta<typeof ArtMat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // İçerik erişilebilir kalır, doku katmanı gizli.
    await expect(canvas.getByText("Kıyı Kahve · Pano")).toBeInTheDocument();
    await expect(canvasElement.querySelector("svg[aria-hidden]")).not.toBeNull();
  },
};

export const Variants: Story = {
  name: "Dokular",
  render: () => (
    <Gallery cols={2}>
      <Cell label="smear · temiz kenar" className="p-3">
        <ArtMat variant="smear" pad="sm" className="w-full">
          <DemoWindow compact />
        </ArtMat>
      </Cell>
      <Cell label="strata · earth · torn" className="p-3">
        <ArtMat variant="strata" tone="earth" edge="torn" pad="sm" className="w-full">
          <DemoWindow compact />
        </ArtMat>
      </Cell>
      <Cell label="grid · primary · torn" className="p-3">
        <ArtMat variant="grid" edge="torn" pad="sm" className="w-full">
          <DemoWindow compact />
        </ArtMat>
      </Cell>
      <Cell label="wash · primary · clean" className="p-3">
        <ArtMat variant="wash" pad="sm" className="w-full">
          <DemoWindow compact />
        </ArtMat>
      </Cell>
    </Gallery>
  ),
};

export const Cropped: Story = {
  name: "Altta Kırpılmış",
  args: { variant: "grid", crop: true, pad: "lg", className: "h-80 sm:h-96" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Kıyı Kahve · Pano")).toBeInTheDocument();
  },
};

export const ScrollInset: Story = {
  name: "Kaydırınca Daralan Bant",
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className="overflow-x-clip bg-page px-5 py-[40vh] sm:px-10">
      <p className="mx-auto mb-10 max-w-xl text-center text-read text-muted">Aşağı kaydır: bant kenarlara taşan halinden yerine oturan karta daralır.</p>
      <ArtMat {...args} variant="strata" tone="earth" edge="clean" scrollInset bleed={0.08} className="mx-auto max-w-6xl">
        <DemoWindow />
      </ArtMat>
      <div className="h-[60vh]" />
    </div>
  ),
};
