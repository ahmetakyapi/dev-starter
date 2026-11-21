import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CornerLabel } from "@/components/ui/corner-label";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { Media } from "../yeni-g/_media";

const meta = {
  title: "Bileşenler/Tanıtım/Köşe Ayraçlı Etiket",
  id: "corner-label",
  component: CornerLabel,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Dört köşesinde vizör ayracı olan mono, büyük harfli kısa etiket; başlığın üstünde eyebrow. Hap rozetin teknik karşılığı: yoğun uygulama ekranında değil, görsel zeminli tanıtım sayfasında, sayfada bir ya da iki tane. Büyük harf `uppercase` CSS'iyle: `<html lang=\"tr\">` ise İ ve I doğru çıkar. Ayraçlar süstür. Sightline referans turundan.",
      },
    },
  },
  args: { children: "Birleşik zekâ katmanı" },
  render: (args) => (
    <Frame>
      <CornerLabel {...args} />
    </Frame>
  ),
} satisfies Meta<typeof CornerLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Eyebrow" };

export const Tones: Story = {
  name: "Zeminler",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Yüzey üstü">
        <CornerLabel>Sürüm 3.1</CornerLabel>
      </Cell>
      <Cell label="Görsel üstü (tone=media)" className="p-0">
        <Media className="w-full">
          <CornerLabel tone="media">Birleşik zekâ katmanı</CornerLabel>
        </Media>
      </Cell>
    </Gallery>
  ),
};
