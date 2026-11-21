import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { StatStrip } from "@/components/ui/stat-strip";
import { Frame } from "../_lib/Frame";

/** ÖRNEK veri: gerçek ölçüm değil (guides/08). */
const ITEMS = [
  { value: "99%", label: "İşlem başarı oranı" },
  { value: "12.000+", label: "Ortalama tasarruf" },
  { value: "85%", label: "Daha hızlı raporlama" },
  { value: "50 bin+", label: "Aktif kullanıcı" },
];

const meta = {
  title: "Bileşenler/Tanıtım/İstatistik Şeridi",
  id: "stat-strip",
  component: StatStrip,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Üç ya da dört büyük sayı, altında etiket, aralarında ince dikey ayraç; telefonda 2×2. Sayı düz metin (sunucu bileşeni). Doğrulanamayan sayı yazılmaz; buradaki değerler ÖRNEK veridir. `dl` yapısı: ekran okuyucu \"etiket, değer\" okur. Synais referans turundan (yalnız yapı).",
      },
    },
  },
  args: { items: ITEMS, tone: "light", divided: true },
  argTypes: { tone: { control: "inline-radio", options: ["light", "dark"] } },
  render: (args) => (
    <Frame width="xl">
      <p className="mb-6 text-center text-micro text-muted">ÖRNEK VERİ</p>
      <div className={args.tone === "dark" ? "rounded-xl bg-strong py-10" : "py-4"}>
        <StatStrip {...args} />
      </div>
    </Frame>
  ),
} satisfies Meta<typeof StatStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Dört Sayı",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Aktif kullanıcı")).toBeInTheDocument();
    await expect(canvas.getByText("99%")).toBeInTheDocument();
  },
};

export const Three: Story = { name: "Üç Sayı, Koyu", args: { items: ITEMS.slice(0, 3), tone: "dark" } };
