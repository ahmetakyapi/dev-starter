import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DockingNav } from "@/components/ui/docking-nav";

const meta = {
  title: "Bileşenler/Tanıtım/Yuvaya Oturan Menü",
  id: "docking-nav",
  component: DockingNav,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "fullscreen",
    docs: {
      story: { inline: false, height: "520px" },
      description: {
        component:
          "Sayfanın başında üstten boşluklu tam yuvarlak hap; kaydırınca üst kenara yapışır, üst köşeleri düzleşir, gölgesi derinleşir. Opak: görsel zeminli kahramanda okunurluk bozulmaz. Durum `useSyncExternalStore` ile boole okunur, yalnız eşikte yeniden çizilir. Telefonda bağlantılar açılan panelde; Esc kapatır, odak düğmeye döner.",
      },
    },
  },
  args: {
    brand: <span className="text-read font-bold tracking-tight text-strong">Şerit</span>,
    links: [
      { href: "#demo", label: "Demo" },
      { href: "#fiyat", label: "Fiyat" },
      { href: "#kisayol", label: "Kısayollar" },
      { href: "#sss", label: "SSS" },
    ],
    action: <span className="inline-flex min-h-9 items-center rounded-full bg-cta px-4 text-small font-medium text-on-brand shadow-cta">İndir</span>,
  },
  render: (args) => (
    <div className="min-h-[220vh] bg-page">
      <DockingNav {...args} />
      <div className="h-72 bg-primary" />
      <p className="mx-auto max-w-xl px-4 pt-10 text-read text-soft">Aşağı kaydır: menü yukarı kayıp üst kenara oturur.</p>
    </div>
  ),
} satisfies Meta<typeof DockingNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Kaydırarak Dene" };
