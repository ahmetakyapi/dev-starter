import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { TahminSenaryoPage } from "./_tahmin";

const meta = {
  title: "Ekranlar/Örnek Sayfalar/Tahmin ve Senaryo",
  id: "sample-forecast",
  component: TahminSenaryoPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Bir marj tahmin ekranı (margin referansı: yapı ve davranış; ad, metin ve rakamlar kurgusal, ÖRNEK VERİ). Çizgisiz metrik şeridi tahmini marjı, geliri, hedefe farkı ve değişikliklerle marjı söyler; tahmin grafiği gerçekleşeni, mevcut yolu, olası aralığı ve hedefi çizer. Dört kaldıraç kartının anahtarı marjı, farkı ve grafikteki yeşil yolu canlı değiştirir. \"Senaryoyu Kaydet\" penceresi adı ve sonuç özetini alır, haftalık karşılaştırma anahtarıyla kayıtlı senaryolar listesine ekler. Bileşenler: `forecast-chart`, `lever-card`, `record-list`, `segmented-control`, `dialog`, `switch`, `toast`.",
      },
    },
  },
  args: {},
} satisfies Meta<typeof TahminSenaryoPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  name: "Tahmin",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("heading", { level: 1, name: /Tahmin/ })).toBeInTheDocument();
    await expect(canvas.getByRole("switch", { name: "Emek Maliyetini Tahminde Tut" })).toBeChecked();
  },
};

export const Levers: Story = {
  name: "Kaldıraçlar Marjı Değiştirir",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("switch", { name: "Malzeme Fiyatlarını Sabitle" }));
    await waitFor(() => expect(canvas.getByText("Hedefin 0,3 puan üstünde")).toBeInTheDocument());
  },
};

export const SaveScenario: Story = {
  name: "Senaryoyu Kaydet",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "Senaryoyu Kaydet" }));
    const dialog = await within(canvasElement.ownerDocument.body).findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Senaryo Adı"), "Kış Planı");
    await userEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    await waitFor(() => expect(canvas.getByText("Kış Planı")).toBeInTheDocument());
  },
};
