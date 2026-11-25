import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CreditCard, MapPinned } from "lucide-react";
import { expect, within } from "storybook/test";
import { HeadMark } from "@/components/ui/head-mark";
import { Frame } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Tanıtım/Başlık İşareti",
  id: "head-mark",
  component: HeadMark,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Büyük başlığın içinde bir kelimeye eşlik eden işaret: `tile` (satır boyunda çizgi ikonlu kare), `highlight` (açılışta çekilen fosforlu kalem şeridi), `dotted` (varlık adının noktalı alt çizgisi). Başlık başına en çok bir işaret; ikon `aria-hidden`, başlık işaretsiz de tam okunur. Synaps, Lasso ve Lindy referans turundan (yalnız yapı).",
      },
    },
  },
  args: { variant: "highlight", children: "Alandan" },
  argTypes: { variant: { control: "inline-radio", options: ["tile", "highlight", "dotted"] } },
  render: (args) => (
    <Frame width="xl">
      <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.98] font-semibold tracking-[-0.05em] text-balance text-strong">
        <HeadMark {...args} icon={<MapPinned />} /> Sunuma Hazır Projeye
      </h2>
    </Frame>
  ),
} satisfies Meta<typeof HeadMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    // İkon süs: başlığın erişilebilir adı yalnız metin.
    await expect(within(canvasElement).getByRole("heading", { level: 2 })).toHaveTextContent("Alandan Sunuma Hazır Projeye");
  },
};

export const Tile: Story = {
  name: "İkon Karesi",
  render: () => (
    <Frame width="xl">
      <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.98] font-semibold tracking-[-0.05em] text-balance text-strong">
        Müşterinin <HeadMark icon={<CreditCard />}>Ödeme</HeadMark> Deneyimini Yönet
      </h2>
    </Frame>
  ),
};

export const Dotted: Story = {
  name: "Noktalı Alt Çizgi",
  render: () => (
    <Frame width="xl">
      <p className="text-center font-display text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.05] font-semibold tracking-[-0.04em] text-balance text-strong">
        Birazdan <HeadMark variant="dotted">Tasarım Eşleme</HeadMark> Toplantın Var
      </p>
    </Frame>
  ),
};
