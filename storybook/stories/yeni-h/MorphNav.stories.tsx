import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookOpen, CalendarDays, Inbox, ListChecks, Newspaper, Sparkles } from "lucide-react";
import { MorphNav, MorphNavGrid } from "@/components/ui/morph-nav";

const meta = {
  title: "Bileşenler/Tanıtım/Biçim Değiştiren Menü",
  id: "morph-nav",
  component: MorphNav,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "fullscreen",
    docs: {
      story: { inline: false, height: "480px" },
      description: {
        component:
          "Hap menüde bir başlığın üzerine gelince altında TEK bir kabuk açılır; başlıklar arasında gezerken aynı kabuk yeni panelin boyuna esner, içerik buğulanarak yön yön geçer, başlıkların arkasında vurgu karosu kayar. Menü rolü yok: `nav` + `aria-expanded`; ↓ panele iner, Esc kapatır ve odağı başlığa döndürür, kapalı paneller `inert`. Telefonda menü düğmesi bütün grupları alt alta açar. scrolltide.co turundan.",
      },
    },
  },
  args: {
    brand: <span className="text-read font-bold tracking-tight text-strong">Pusula</span>,
    items: [
      {
        label: "Ürün",
        content: (
          <MorphNavGrid
            links={[
              { href: "#gelen", title: "Gelen Kutusu", description: "Bütün talepler tek listede", icon: Inbox },
              { href: "#gorev", title: "Görevler", description: "Talepten doğan işler", icon: ListChecks },
              { href: "#takvim", title: "Takvim", description: "Toplantı ve teslim tarihleri", icon: CalendarDays },
              { href: "#asistan", title: "Asistan", description: "Özet ve taslak yanıt", icon: Sparkles },
            ]}
          />
        ),
      },
      {
        label: "Kaynaklar",
        content: (
          <MorphNavGrid
            links={[
              { href: "#rehber", title: "Rehber", description: "Kurulumdan ilk yanıta", icon: BookOpen },
              { href: "#gunluk", title: "Günlük", description: "Sürüm notları", icon: Newspaper },
            ]}
            feature={
              <a href="#surum" className="grid h-full content-end gap-1 rounded-xl bg-surface p-4">
                <span className="text-small text-muted">Yeni</span>
                <span className="text-base font-semibold text-strong">Toplu Kurallar Geldi</span>
              </a>
            }
          />
        ),
      },
      { label: "Fiyat", href: "#fiyat" },
    ],
    action: <span className="inline-flex h-10 items-center rounded-full bg-cta px-4 text-base font-semibold text-on-brand shadow-cta">Başla</span>,
  },
  render: (args) => (
    <div className="min-h-[28rem] bg-page px-4 pt-6">
      <MorphNav {...args} />
    </div>
  ),
} satisfies Meta<typeof MorphNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Üzerine Gel" };
