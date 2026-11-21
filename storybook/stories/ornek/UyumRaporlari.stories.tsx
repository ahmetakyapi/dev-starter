import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { UyumRaporlariPage } from "./_uyumrapor";

const meta = {
  title: "Ekranlar/Örnek Sayfalar/Uyum Raporları",
  id: "sample-compliance",
  component: UyumRaporlariPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Bir kira uyum raporu sayfası (Noticeline referansı: yapı ve davranış; ad, metin ve rakamlar kurgusal, ÖRNEK VERİ). Metrik şeridi zamanında bildirim oranını ince çentikli ölçerle, ödeme süresini, zamanında puanlamayı ve kapatılan boşlukları söyler; dönem seçici (Son 30 / 90 Gün / 12 Ay veya özel aralık) bütün bölümleri ve özet rakamları birlikte değiştirir. Bildirim türü satırları \"14/15\" biçiminde, aylık ödeme hızı hedef çizgili sütunlarla, kamu kaydındaki boşluklar özet ve neden kutusuyla gösterilir. Dışa aktarma paketinde CSV dosyaları gerçekten iner. Sol altta kapatılabilir süre uyarısı. Bileşenler: `date-range-presets`, `tick-meter`, `track-bar-chart`, `insight-callout`, `record-list`, `notice-deck`.",
      },
    },
  },
  args: {},
} satisfies Meta<typeof UyumRaporlariPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  name: "Rapor",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("heading", { level: 1, name: /Uyum Raporları/ })).toBeInTheDocument();
    await expect(canvas.getByText("14/15")).toBeInTheDocument();
    await expect(canvas.getByRole("meter", { name: "Zamanında Bildirim Oranı" })).toBeInTheDocument();
  },
};

export const Period: Story = {
  name: "Dönem Değişir",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: /Son 30 Gün/ }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("radio", { name: "Son 90 Gün" }));
    await waitFor(() => expect(canvas.getByText("41/45")).toBeInTheDocument());
  },
};

export const Notice: Story = {
  name: "Süre Uyarısı",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = await canvas.findByRole("region", { name: "Bildirim Uyarısı" });
    await expect(within(region).getByText("Bildirim Cuma Günü Doluyor")).toBeInTheDocument();
    await userEvent.click(within(region).getByRole("button", { name: /kapat/ }));
    await waitFor(() => expect(canvas.queryByRole("region", { name: "Bildirim Uyarısı" })).toBeNull());
  },
};
