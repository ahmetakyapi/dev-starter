import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { ToneText } from "@/components/ui/tone-text";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { Media } from "../yeni-g/_media";

const meta = {
  title: "Bileşenler/Tanıtım/İki Tonlu Başlık",
  id: "tone-text",
  component: ToneText,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Cümlenin bir bölümü güçlü, öbürü soluk: okur önce güçlü kısmı okur, soluk kısım bağlam olarak arkadan gelir. `ToneText.Soft` soluk bölümü, `fade` bütün başlığı soldan sağa açar (renk `currentColor`, sabit renk yok; kırpma desteklenmezse düz renk), `<em>` serif display fontuyla tek italik vurgu. Soluk bölüm yalnız büyük metinde; küçük metinde kontrast AA altına iner. Metin bölünmez: ekran okuyucu başlığı tek cümle okur. Synais, Qbick ve Respan referans turundan.",
      },
    },
  },
  args: { children: "" },
  render: () => (
    <Frame width="lg">
      <ToneText as="h2" className="text-display">
        Daha akıllı <ToneText.Soft>finans yönetimi</ToneText.Soft>
      </ToneText>
    </Frame>
  ),
} satisfies Meta<typeof ToneText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "İki Ton",
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole("heading", { level: 2 });
    await expect(heading).toHaveTextContent("Daha akıllı finans yönetimi");
  },
};

export const Variants: Story = {
  name: "Biçimler",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="İki ton (Soft)">
        <ToneText as="p" className="text-display">
          Gelir ve giderde <ToneText.Soft>tek bakışta netlik</ToneText.Soft>
        </ToneText>
      </Cell>
      <Cell label="Soldan sağa solma (fade=in)">
        <ToneText as="p" fade="in" className="text-display">
          Modern işletmeler için enerji zekâsı
        </ToneText>
      </Cell>
      <Cell label="Tek italik serif vurgu (em)">
        <ToneText as="p" className="text-display">
          Her kuruşu <em>kes</em>
        </ToneText>
      </Cell>
      <Cell label="Koyu görsel üstünde (tone=media)" className="p-0">
        <Media className="w-full">
          <ToneText as="p" tone="media" fade="in" className="text-display">
            Işığı ölç, israfı kes
          </ToneText>
        </Media>
      </Cell>
    </Gallery>
  ),
};
