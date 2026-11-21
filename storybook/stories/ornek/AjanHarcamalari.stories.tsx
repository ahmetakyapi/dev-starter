import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { AjanHarcamalariPage } from "./_ajan";

const meta = {
  title: "Ekranlar/Örnek Sayfalar/Ajan Harcamaları",
  id: "sample-agent-spend",
  component: AjanHarcamalariPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Yapay zekâ ajanlarının harcama panosu: dört ölçü karosu, canlı karar akışı (`DataTable`; telefonda `RecordList`), karar dağılımı (üç parçalı çubuk, satırlarda sayı ve yüzde), onay kuyruğu ve olağan dışı harcama uyarısı. Karar her yerde renkle birlikte metinle de yazılır (Otomatik onaylı, Onay bekliyor, Engellendi). Açık ve koyu tema aynı sayfa; araç çubuğundaki tema anahtarıyla değişir. Veri kurgusal ve \"ÖRNEK VERİ\" künyeli.",
      },
    },
  },
  args: { initialPeriod: "ay" },
  argTypes: { initialPeriod: { control: "inline-radio", options: ["gun", "hafta", "ay"] } },
} satisfies Meta<typeof AjanHarcamalariPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("heading", { level: 1, name: /Günaydın/ })).toBeInTheDocument();
    await expect(canvas.getByText(/bu ay ₺84\.420 harcandı/)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("radio", { name: "Bugün" }));
    await expect(canvas.getByText(/Bugün 18 ajan çalıştı/)).toBeInTheDocument();
  },
};
