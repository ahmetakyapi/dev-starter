import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import VitrinBlocks from "../../../snippets/ui/vitrin/blocks";
import VitrinCharts from "../../../snippets/ui/vitrin/charts";
import VitrinFeedback from "../../../snippets/ui/vitrin/feedback";
import VitrinForm from "../../../snippets/ui/vitrin/form";
import VitrinIndex from "../../../snippets/ui/vitrin/index";
import VitrinPolish from "../../../snippets/ui/vitrin/polish";

/**
 * `snippets/ui/vitrin/` sayfaları olduğu gibi: projede `app/vitrin/**` altına
 * kopyalanan sayfaların aynısı. Burada metin ya da veri uydurulmaz.
 */
const meta = {
  title: "Vitrin",
  component: VitrinIndex,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Bileşen vitrini: giriş sayfası ve beş grup. Her sayfa bir bileşenin doğru kullanımını gerçekçi Türkçe veriyle gösterir; bileşeni projeye almadan önce buradaki prop ve etiketlere bak. Kurulum `snippets/ui/vitrin/README.md`.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-dvh bg-page text-body">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VitrinIndex>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Giris: Story = { name: "Genel Bakış" };
export const TemelKutuphane: Story = { name: "Temel Kütüphane", render: () => <VitrinPolish /> };
export const FormGirisleri: Story = { name: "Form Girişleri", render: () => <VitrinForm /> };
export const GeriBildirim: Story = { name: "Katman ve Geri Bildirim", render: () => <VitrinFeedback /> };
export const Grafikler: Story = { name: "Grafikler", render: () => <VitrinCharts /> };
export const Bloklar: Story = { name: "Bloklar", render: () => <VitrinBlocks /> };
