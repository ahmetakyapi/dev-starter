import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { Money } from "@/components/ui/money";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Veri/Para Değeri",
  id: "money",
  component: Money,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Parasal değer: tam kısım güçlü, ondalık ayracı ve kesir sönük (\"54.590**,00**\"). Büyük tutarların yan yana durduğu ekranlarda göz önce liraya takılır. Biçimleme `Intl.NumberFormat.formatToParts` ile, dilin kendi ayracıyla; ekran okuyucuya tam biçimli tutar tek metin gider, sönüklük süstür. Sayı yoksa \"—\". Brick ve Paymie ekranlarından (yalnız yapı). Örnek tutarlar ÖRNEK'tir.",
      },
    },
  },
  args: { value: 54590, currency: "TRY" },
  argTypes: { tone: { control: "inline-radio", options: ["neutral", "danger", "success"] } },
  render: (args) => (
    <Frame width="sm">
      <Money {...args} className="text-display" />
    </Frame>
  ),
} satisfies Meta<typeof Money>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    // Ekran okuyucu tam tutarı tek metin olarak duyar; parçalar aria-hidden.
    await expect(within(canvasElement).getByText(/54\.590,00/, { selector: ".sr-only" })).toBeInTheDocument();
  },
};

export const Variants: Story = {
  name: "Tonlar ve Diller",
  render: () => (
    <Gallery cols={3}>
      <Cell label="Gecikmiş bakiye (danger)">
        <Money value={8352} currency="USD" locale="en-US" tone="danger" className="text-heading" />
      </Cell>
      <Cell label="Tahsil edilen (success)">
        <Money value={12159.5} currency="EUR" tone="success" className="text-heading" />
      </Cell>
      <Cell label="Kesirsiz (fractionless)">
        <Money value={1840000} currency="TRY" fractionless className="text-heading" />
      </Cell>
      <Cell label="Eksi tutar">
        <Money value={-640.9} currency="TRY" className="text-heading" />
      </Cell>
      <Cell label="Değer bilinmiyor (null)">
        <Money value={null} className="text-heading" />
      </Cell>
    </Gallery>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Tutar yok")).toBeInTheDocument();
  },
};
