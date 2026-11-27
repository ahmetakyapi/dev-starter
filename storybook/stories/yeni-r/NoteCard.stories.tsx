import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AtSign } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";
import { NoteCard, NoteList, NoteMedia } from "@/components/ui/note-card";
import { Frame } from "../_lib/Frame";

const NOW = new Date("2026-11-27T10:00:00");
const AUTHOR = { name: "Derin Aksoy", handle: "derinaksoy" };

function Tabs() {
  return (
    <div className="grid aspect-[16/9] place-items-center">
      <div className="flex gap-1 rounded-full bg-overlay p-1 text-small shadow-raised">
        {["Keşfet", "Kişisel", "Çalışma Alanı", "Paylaşılan"].map((t, i) => (
          <span key={t} className={i === 3 ? "rounded-full bg-surface px-3 py-1 text-strong" : "px-3 py-1 text-muted"}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

const meta = {
  title: "Bileşenler/Tanıtım/Not Kartı",
  id: "note-card",
  component: NoteCard,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Kısa not ya da gönderi: avatar, ad, @kullanıcı · göreli zaman, sağ üstte kaynak ikonu; boş satırlarda paragraflanan metin, isteğe oynat butonlu poster, altta yanıt / yeniden paylaş / beğeni. Her kart `<article>`, adı yazar + zaman. `NoteList` 8 px aralıkla dizer. Sakin Akış turundan (yalnız davranış).",
      },
    },
  },
  args: {
    author: AUTHOR,
    time: "2026-11-26T22:00:00",
    now: NOW,
    children: "arayüz, durum değişince kayarsa daha yumuşak hissettiriyor.\n\nsekmeler, anahtarlar, menüler. bir şeyi oynat, gerisi takip etsin.",
    likes: 14,
    replies: 2,
  },
  render: (args) => (
    <Frame width="md">
      <NoteCard {...args} />
    </Frame>
  ),
} satisfies Meta<typeof NoteCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("article", { name: "Derin Aksoy 12 sa" })).toBeInTheDocument();
    await expect(canvas.getAllByRole("paragraph").length).toBeGreaterThan(0);
    await userEvent.click(canvas.getByRole("button", { name: "Beğen, 14 beğeni" }));
    await expect(canvas.getByRole("button", { name: "Beğen, 15 beğeni" })).toHaveAttribute("aria-pressed", "true");
  },
};

export const Feed: Story = {
  name: "Not Akışı",
  render: () => (
    <Frame width="md">
      <NoteList label="Notlar">
        <NoteCard author={AUTHOR} time="2026-11-27T08:00:00" now={NOW} source={<AtSign />} sourceLabel="İlk yayımlandığı yer" likes={6} replies={1}>
          {"sekmelerde seçili zemin aralarında gezince daha yumuşak.\n\ntek hap hem yerini hem genişliğini yayla değiştirir.\nyay sertliği: 260\nsönüm oranı: 0,725"}
        </NoteCard>
        <NoteCard
          author={AUTHOR}
          time="2026-11-16T09:00:00"
          now={NOW}
          likes={220}
          liked
          replies={14}
          media={
            <NoteMedia label="Sekme geçişi" onPlay={() => {}}>
              <Tabs />
            </NoteMedia>
          }
        >
          {"kenar çubuğu yerinde kalsın, içerik üstünden kaysın. daha az yarışan hareket, daha az zıplama."}
        </NoteCard>
      </NoteList>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: "Notlar" })).toBeInTheDocument();
    await expect(canvas.getAllByRole("article")).toHaveLength(2);
    await expect(canvas.getByRole("button", { name: "Oynat: Sekme geçişi" })).toBeInTheDocument();
  },
};
