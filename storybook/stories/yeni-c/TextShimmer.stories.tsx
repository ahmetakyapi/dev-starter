import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Yükleme/Parıltılı Metin",
  id: "text-shimmer",
  component: TextShimmer,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Süren bir işin kısa etiketi: “Asistan düşünüyor…”. Metin tek token renginde kalır, ışık bir alfa maskesinin kaymasıyla geçer; degrade metin değildir. Maskenin en sönük yeri %60 opaklık, metin hiçbir karede AA'nın altına düşmez. Etiket değişince okunması gerekiyorsa `live`. Hareketi azaltanda düz metin. Sunucu bileşeni, JavaScript'siz.",
      },
    },
  },
  args: { children: "Asistan yanıt yazıyor…" },
  render: (args) => (
    <Frame width="sm">
      <TextShimmer {...args} />
    </Frame>
  ),
} satisfies Meta<typeof TextShimmer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const Live: Story = {
  name: "Canlı Bölge",
  args: { live: true, children: "Kaynaklar taranıyor…" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("status")).toHaveTextContent("Kaynaklar taranıyor…");
  },
};

export const Slow: Story = {
  name: "Yavaş",
  args: { duration: 3.5, children: "Rapor hazırlanıyor…" },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Satır İçi · Küçük">
        <TextShimmer className="text-small">Taslaklar yazılıyor…</TextShimmer>
      </Cell>
      <Cell label="Gövde">
        <TextShimmer live>Asistan düşünüyor…</TextShimmer>
      </Cell>
      <Cell label="Başlık">
        <TextShimmer as="p" className="text-title font-semibold">
          Panonuz Kuruluyor
        </TextShimmer>
      </Cell>
    </Gallery>
  ),
};
