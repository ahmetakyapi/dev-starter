import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarX } from "lucide-react";
import { expect, within } from "storybook/test";
import { Avatar } from "@/components/ui/avatar";
import { AttentionList } from "@/components/ui/attention-list";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const ITEMS = [
  { id: "1", title: "Boya", subject: "Ada Yılmaz", leading: <Avatar name="Ada Yılmaz" size="sm" />, tone: "danger" as const, detail: "Gecikti · vade 27 Eki · %75 tamam" },
  { id: "2", title: "Kapı Montajı", subject: "Ada Yılmaz", leading: <Avatar name="Ada Yılmaz" size="sm" />, tone: "warning" as const, icon: <CalendarX aria-hidden strokeWidth={1.75} className="size-4 shrink-0" />, detail: "Geçersiz tarih · 5 Kas – 12 Eki", action: <a href="#tarih">Tarihleri düzelt</a> },
  { id: "3", title: "Dış Cephe Boyası", subject: "Mert Kaya", leading: <Avatar name="Mert Kaya" size="sm" />, tone: "danger" as const, detail: "Gecikti · vade 9 Kas · %75 tamam" },
];

const meta = {
  title: "Bileşenler/Veri/Dikkat Listesi",
  id: "attention-list",
  component: AttentionList,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "\"Şimdi bakman gerekenler\": kısa, işlem odaklı satırlar. Her satırda kim/ne, ikonlu durum cümlesi ve mümkünse tek tıkla çözüm (`action` yuvası: bağlantı ya da buton). Başlıktaki sayaç satır sayısından türer. Renk tek işaret değil: durum metni ve ikon aynı şeyi söyler. Boşken `emptyText` yalnız veri geldiyse verilir. Brick zaman çizelgesinden (yalnız yapı). Örnek kayıtlar ÖRNEK'tir.",
      },
    },
  },
  args: { title: "Dikkat Gerekenler", items: ITEMS },
  argTypes: { items: { control: false } },
  render: (args) => (
    <Frame width="lg">
      <AttentionList {...args} />
    </Frame>
  ),
} satisfies Meta<typeof AttentionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: /Dikkat Gerekenler/ })).toHaveTextContent("3");
    await expect(canvas.getAllByRole("listitem")).toHaveLength(3);
    await expect(canvas.getByRole("link", { name: "Tarihleri düzelt" })).toBeInTheDocument();
  },
};

export const Variants: Story = {
  name: "Bugün Başlayanlar ve Boş Hal",
  render: () => (
    <Gallery cols={2}>
      <Cell label="Nötr (saat)" className="place-items-start">
        <AttentionList
          title="Bugün Başlayanlar"
          items={[
            { id: "a", title: "Banyo Fayansı", subject: "Ada Yılmaz", detail: "08:30" },
            { id: "b", title: "Duş Montajı", subject: "Kaan Çelik", detail: "09:30" },
          ]}
        />
      </Cell>
      <Cell label="Boş (veri geldi, kayıt yok)" className="place-items-start">
        <AttentionList title="Dikkat Gerekenler" items={[]} emptyText="Şu an dikkat gerektiren bir kayıt yok." />
      </Cell>
    </Gallery>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Şu an dikkat gerektiren bir kayıt yok.")).toBeInTheDocument();
    await expect(canvas.getByText("08:30")).toBeInTheDocument();
  },
};
