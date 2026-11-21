import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CreditCard, Mail, Rocket, ShieldCheck, Users, Zap } from "lucide-react";
import { expect, within } from "storybook/test";
import { CategoryCard, CategoryGrid } from "@/components/ui/category-card";

const meta = {
  title: "Bileşenler/Gezinme/Kategori Kartı",
  id: "category-card",
  component: CategoryCard,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Yardım merkezi ve kaynak kütüphanesi konu karosu: yumuşak renkli ikon karosu, başlık, açıklama, \"12 makale →\". Kartın tamamı tek bağlantıdır (gerilmiş bağlantı); ekran okuyucu bağlantı adını \"Başlangıç\", açıklamasını \"12 makale\" diye okur. MailPulse yardım merkezinden (yapı).",
      },
    },
  },
  args: { href: "#", title: "Başlangıç", description: "İlk kurulum", meta: "12 makale", icon: <Rocket />, tone: "chart-3" },
  render: () => (
    <div className="mx-auto max-w-4xl p-6">
      <CategoryGrid>
        <CategoryCard href="#baslangic" title="Başlangıç" description="Çalışma alanını kur, ekibi ekle ve ilk talebi yanıtla." meta="12 makale" icon={<Rocket />} tone="chart-3" />
        <CategoryCard href="#eposta" title="E-Posta ve Teslimat" description="Alan adı, doğrulama ve gelen kutusu eşleştirme." meta="18 makale" icon={<Mail />} tone="chart-2" />
        <CategoryCard href="#ekip" title="Ekip ve Yetkiler" description="Rol, davet ve erişim ayarları." meta="14 makale" icon={<Users />} tone="success" />
        <CategoryCard href="#odeme" title="Ödeme ve Faturalar" description="Planlar, faturalar ve vergi bilgileri." meta="11 makale" icon={<CreditCard />} tone="warning" />
        <CategoryCard href="#otomasyon" title="Otomasyonlar" description="Tetikleyici ve koşullarla tekrarlayan işleri devret." meta="9 makale" icon={<Zap />} tone="primary" />
        <CategoryCard href="#guvenlik" title="Hesap ve Güvenlik" description="Oturum, iki adımlı doğrulama ve veri dışa aktarma." meta="10 makale" icon={<ShieldCheck />} tone="danger" />
      </CategoryGrid>
    </div>
  ),
} satisfies Meta<typeof CategoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Yardım Kategorileri",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Başlangıç" });
    await expect(link).toHaveAttribute("href", "#baslangic");
    await expect(link).toHaveAccessibleDescription("12 makale");
    await expect(canvas.getAllByRole("link")).toHaveLength(6);
  },
};
