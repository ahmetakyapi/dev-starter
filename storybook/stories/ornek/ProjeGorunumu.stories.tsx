import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { ProjeGorunumuPage } from "./_proje";

const meta = {
  title: "Ekranlar/Örnek Sayfalar/Proje Görünümü",
  id: "sample-project",
  component: ProjeGorunumuPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Proje yönetimi sayfası: başlıkta teslim tarihinin sözle farkı, dört `TickMeter` ölçüsü, çıkışı belirleyen zincir (`PathGraph`), yoldaki açık işler (`DataTable`; telefonda `RecordList`) ve tarihi öne çeken \"Yolu kır\" önerileri. Kritik zincir ve gecikme renkle birlikte metinle de söylenir. Veri kurgusal ve \"ÖRNEK VERİ\" künyeli.",
      },
    },
  },
} satisfies Meta<typeof ProjeGorunumuPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("heading", { level: 1, name: /Mobil uygulama 3\.0/ })).toBeInTheDocument();
    await expect(canvas.getAllByRole("meter").length).toBeGreaterThanOrEqual(4);
    // Yolu kır: sonraki öneriye geç.
    await userEvent.click(canvas.getByRole("button", { name: "Sonraki öneri" }));
    await expect(canvas.getByText("Mine'nin iki test turunu ikiye böl")).toBeInTheDocument();
  },
};
