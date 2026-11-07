import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { NoticeDeck } from "@/components/ui/notice-deck";

const ITEMS = [
  { id: "surum", eyebrow: "Yeni Sürüm", title: "Pusula 3.1 yayında", body: "Pencere şeridi ve kısayol paleti.", action: <a href="/surum-notlari" className="text-primary-ink underline-offset-2 hover:underline">Sürüm notları</a> },
  { id: "canli", eyebrow: "Canlı Yayın", title: "Cuma 20.00'de soru-cevap" },
  { id: "duvar", eyebrow: "Duvar Kâğıtları", title: "Altı yeni sahne", body: "Çalışma alanının paletiyle çizilir." },
];

const meta = {
  title: "Bileşenler/Tanıtım/Duyuru Destesi",
  id: "notice-deck",
  component: NoticeDeck,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Köşede üst üste duran duyuru kartları: öndeki aralıkla arkaya kayar, sayaç \"2/3\" der, arkadaki kartların kenarı görünür. Duyuru, sürüm notu, etkinlik; hata ve sonuç bildirimi için değil (`toast`). Üzerine gelince ve odakta durur, hareketi azaltanda kendiliğinden dönmez; değişim ekran okuyucuya duyurulmaz, sayaç düğmesi elle geçirir.",
      },
    },
  },
  args: { items: ITEMS, label: "Duyurular", interval: 4000 },
  render: (args) => (
    <div className="grid min-h-64 place-items-center p-8">
      <NoticeDeck {...args} />
    </div>
  ),
} satisfies Meta<typeof NoticeDeck>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Pusula 3.1 yayında");
    await userEvent.click(canvas.getByRole("button", { name: /Sıradaki duyuru/ }));
    await expect(await canvas.findByText("Cuma 20.00'de soru-cevap")).toBeInTheDocument();
  },
};

export const Single: Story = { name: "Tek Duyuru", args: { items: ITEMS.slice(0, 1) } };
