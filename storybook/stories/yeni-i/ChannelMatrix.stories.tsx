import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ChannelMatrix, type MatrixValue } from "@/components/ui/channel-matrix";

const CHANNELS = [
  { id: "app", label: "Uygulama İçi" },
  { id: "mail", label: "E-Posta" },
  { id: "sms", label: "SMS" },
];
const ROWS = [
  { id: "siparis", label: "Yeni Sipariş", hint: "Web mağaza ve bayi" },
  { id: "iade", label: "İade Talebi", hint: "Müşteri iade formu gönderince" },
  { id: "stok", label: "Stok Azaldı", hint: "Eşiğin altına inen ürün" },
  { id: "guvenlik", label: "Güvenlik", hint: "Yeni cihazdan giriş; kapatılamaz", locked: true },
];
const START: MatrixValue = { siparis: ["app"], iade: ["app", "mail"], stok: ["mail"], guvenlik: ["app", "mail"] };

function Demo() {
  const [value, setValue] = useState<MatrixValue>(START);
  return (
    <div className="mx-auto max-w-2xl p-6">
      <ChannelMatrix caption="Mağaza Bildirimleri" hideCaption={false} channels={CHANNELS} rows={ROWS} value={value} onValueChange={setValue} />
    </div>
  );
}

const meta = {
  title: "Bileşenler/Seçim/Kanal Tablosu",
  id: "channel-matrix",
  component: ChannelMatrix,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Satırlar olay, sütunlar teslimat kanalı; her kesişim bir onay kutusu. Sütun başlığındaki kutu sütunun tamamını açar/kapar ve üç durumludur (hepsi / bir kısmı / hiçbiri). Kilitli satır değişmez, nedeni ipucunda yazılır. Gerçek tablo: ekran okuyucu başlıkları okur, her kutu \"Olay, Kanal\" adını taşır. Axon referans turundan. Pusula: Bildirimler → Tercihler.",
      },
    },
  },
  args: { caption: "Mağaza Bildirimleri", channels: CHANNELS, rows: ROWS, value: START, onValueChange: () => {} },
  render: () => <Demo />,
} satisfies Meta<typeof ChannelMatrix>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Mağaza Bildirimleri",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("checkbox", { name: "SMS: bütün olaylar" }));
    await expect(canvas.getByRole("checkbox", { name: "Stok Azaldı, SMS" })).toBeChecked();
    // Kilitli satır sütun kutusundan etkilenmez.
    await expect(canvas.getByRole("checkbox", { name: "Güvenlik, SMS" })).not.toBeChecked();
  },
};
