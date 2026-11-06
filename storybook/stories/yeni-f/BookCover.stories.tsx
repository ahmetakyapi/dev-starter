import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookCover } from "@/components/ui/book-cover";
import { Frame } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Hareket ve Doku/Kitap Kapağı",
  id: "book-cover",
  component: BookCover,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Üç boyutlu duran, üzerine gelince okura dönen kitap: rehber, e-kitap, kaynak kütüphanesi. Ön kapak, sayfa kenarı ve cilt kırığı saf CSS; tonlar token'dan (birincil, mürekkep, kâğıt). `href` verilirse bütün kitap tek bağlantı. Hareket azaltmada dönmez, ton açılır.",
      },
    },
  },
  args: { title: "Tasarım Token'ları", subtitle: "İki katmanlı mimari, on palet", author: "dev-starter rehberi", mark: "02" },
  render: (args) => (
    <Frame width="sm">
      <div className="grid justify-items-center py-6">
        <BookCover {...args} />
      </div>
    </Frame>
  ),
} satisfies Meta<typeof BookCover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const Shelf: Story = {
  name: "Raf",
  render: () => (
    <Frame width="xl">
      <div className="flex flex-wrap items-end justify-center gap-10 py-6">
        <BookCover tone="primary" mark="01" title="İlk Gün" subtitle="Fikirden ilk dağıtıma" author="Rehber" href="https://github.com/ahmetakyapi/dev-starter/blob/main/guides/01-kickoff.md" />
        <BookCover tone="ink" mark="04" title="Hareket" subtitle="Süre, eğri, koreografi" author="Rehber" width={160} />
        <BookCover tone="paper" mark="08" title="Yayına Çıkış" subtitle="Kontrol listesi" author="Rehber" width={200} />
      </div>
    </Frame>
  ),
};
