import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { StageFlow } from "@/components/ui/stage-flow";
import { Frame } from "../_lib/Frame";

const STAGES = [
  { label: "Başvuru Alındı", value: 24 },
  { label: "Evrak Kontrolü", value: 21 },
  { label: "Keşif", value: 16 },
  { label: "Bedel ve Sözleşme", value: 12 },
  { label: "Montaj", value: 9 },
  { label: "Enerjilendirme", value: 6 },
  { label: "Tamamlandı", value: 4 },
];

const meta = {
  title: "Bileşenler/Grafikler/Aşama Akışı",
  id: "stage-flow",
  component: StageFlow,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Bir sürecin aşamaları yan yana sütunlar: alttan dolan kısa çubuk, büyük sayı, ad, ilk aşamaya göre pay; aralarında bir sonrakine geçemeyen sayı. En büyük kayıp uyarı tonunda ve \"En çok burada takılıyor\" yazısıyla. `stage-bars`ın tam genişlik satırları yerine ~180 px'e sığar ve \"nerede takılıyor?\" sorusunu cevaplar.",
      },
    },
  },
  args: { title: "Başvuru aşama akışı", stages: STAGES },
  render: (args) => (
    <Frame width="xl">
      <StageFlow {...args} />
    </Frame>
  ),
} satisfies Meta<typeof StageFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("listitem")).toHaveLength(7);
    await expect(canvas.getByText(/En çok burada takılıyor/)).toBeInTheDocument();
  },
};

export const Short: Story = {
  name: "Dört Aşama",
  args: { stages: [{ label: "Ziyaret", value: 1200 }, { label: "Kayıt", value: 790 }, { label: "Aktif", value: 410 }, { label: "Ücretli", value: 120 }] },
};
