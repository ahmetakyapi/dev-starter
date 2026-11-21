import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { FactorList } from "@/components/ui/factor-list";
import { Frame } from "../_lib/Frame";

const FACTORS = [
  { label: "Fatura Değeri", value: "48.500 AED" },
  { label: "Ödeme Süresi", value: "2 gün içinde", tone: "danger" as const, hint: "6 Ekim'de vadesi doluyor" },
  { label: "Tekrarlayan Hata", value: "90 günde 3." },
  { label: "Uyum", value: "Gönderilemez", tone: "warning" as const },
];

const meta = {
  title: "Bileşenler/Veri/Etken Listesi",
  id: "factor-list",
  component: FactorList,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Bir kaydın NEDEN öne alındığını ağırlıklı etkenlerle söyler: başlıkta genel önem (Düşük, Orta, Yüksek, Kritik; dört çubuklu sinyal), altında etiket solda, değer sağda satırları. İkon karosu yok; vurgu yalnız değerin rengi (`tone`). Önem rengin yanında metinle de yazılır ve ekran okuyucuya \"Önem: Kritik\" gider. Satırlar `dl > div > dt + dd`. Clearbill istisna ekranından (yalnız yapı). Örnek veri ÖRNEK'tir.",
      },
    },
  },
  args: { title: "Neden Önce", severity: "critical", factors: FACTORS },
  render: (args) => (
    <Frame width="sm">
      <FactorList {...args} />
    </Frame>
  ),
} satisfies Meta<typeof FactorList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Kritik",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Neden Önce" })).toBeInTheDocument();
    await expect(canvas.getByText("Kritik")).toBeInTheDocument();
    await expect(canvas.getByText("2 gün içinde")).toBeInTheDocument();
  },
};

export const Levels: Story = {
  name: "Önem Düzeyleri",
  render: () => (
    <Frame width="lg">
      <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
        {(["low", "medium", "high", "critical"] as const).map((severity) => (
          <FactorList
            key={severity}
            title="Öncelik Etkenleri"
            severity={severity}
            factors={[
              { label: "Tutar", value: "12.400 ₺" },
              { label: "Vade", value: "9 gün" },
            ]}
          />
        ))}
      </div>
    </Frame>
  ),
};
