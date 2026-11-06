import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MarkAnnotate } from "@/components/ui/mark-annotate";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Hareket ve Doku/Elle İşaretleme",
  id: "mark-annotate",
  component: MarkAnnotate,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Metnin üstüne kalemle çizilmiş gibi altı çizgi, fosforlu kalem, daire, kutu ya da üstü çizili; görünür olunca çizilerek gelir. Titreklik metinden türeyen sabit tohumla, her çizimde aynı. Sayfada en çok iki-üç tane. İşaret süstür; anlam taşıyorsa metinle de söyle.",
      },
    },
  },
  args: { type: "underline", children: "üç komutta" },
  render: () => (
    <Frame width="lg">
      <p className="text-center text-heading leading-snug font-semibold tracking-tight text-balance text-strong">
        Yeni projeyi <MarkAnnotate type="underline">üç komutta</MarkAnnotate> kur, ilk gün{" "}
        <MarkAnnotate type="highlight" delay={500}>
          yayına
        </MarkAnnotate>{" "}
        çık.
      </p>
    </Frame>
  ),
} satisfies Meta<typeof MarkAnnotate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const Types: Story = {
  name: "Türler",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="underline">
        <span className="text-title text-strong">
          <MarkAnnotate type="underline">en sık soru</MarkAnnotate>
        </span>
      </Cell>
      <Cell label="highlight">
        <span className="text-title text-strong">
          <MarkAnnotate type="highlight" tone="warning">son gün cuma</MarkAnnotate>
        </span>
      </Cell>
      <Cell label="circle">
        <span className="text-title text-strong">
          <MarkAnnotate type="circle">ücretsiz</MarkAnnotate>
        </span>
      </Cell>
      <Cell label="box">
        <span className="text-title text-strong">
          <MarkAnnotate type="box" tone="strong">tek dosya</MarkAnnotate>
        </span>
      </Cell>
      <Cell label="strike: eski fiyat">
        <span className="text-title text-muted">
          <s className="no-underline">
            <MarkAnnotate type="strike" tone="strong">
              640 ₺
            </MarkAnnotate>
          </s>{" "}
          <span className="font-semibold text-strong">520 ₺</span>
        </span>
      </Cell>
    </Gallery>
  ),
};
