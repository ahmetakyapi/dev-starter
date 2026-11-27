import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AtSign, CodeXml, PenLine } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";
import { ProfileIntro } from "@/components/ui/profile-intro";

const LINKS = [
  { label: "@denizaydin sosyal ağda", href: "https://ornek.com/denizaydin", icon: AtSign, motion: "bounce" as const },
  { label: "Kod Deposu", href: "https://ornek.com/kod", icon: CodeXml, motion: "spin" as const },
  { label: "Yazılar", href: "/yazilar", icon: PenLine, motion: "wiggle" as const },
];

const meta = {
  title: "Bileşenler/Tanıtım/Profil Açılışı",
  id: "profile-intro",
  component: ProfileIntro,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Kişisel sitenin, ekip ya da yazar sayfasının sakin girişi: dar sütunda avatar, ad, \"Güncellendi\" tazelik satırı, koyu hap eylem + anlamına göre oynayan ikon bağlantıları ve kısa biyografi. Açılış yalnız CSS (ad hiç gizlenmez); e-posta ikonu adresi kopyalar, balon \"Panoya kopyalandı\" olur (canlı bölge). Sakin Akış turundan (yalnız davranış).",
      },
    },
  },
  args: {
    name: "Deniz Aydın",
    updated: "2026-11-22",
    cta: { label: "Görüşme Planla", href: "#gorusme" },
    links: LINKS,
    email: "deniz@ornek.com",
  },
  render: (args) => (
    <div className="min-h-[36rem] bg-page px-5 py-14">
      <ProfileIntro {...args}>
        <p>İzmir'de doğdum, büyüdüm; şu an bir sağlık girişiminde ürün tasarımına liderlik ediyorum.</p>
        <p>Ürünleri ve siteleri hem tasarlıyor hem kuruyorum: bazen sıfırdan, bazen şirket büyümeye hazır olduğunda.</p>
        <p>Dokuz yılda kurucu tasarımcılıktan tasarım yöneticiliğine her rolde çalıştım.</p>
      </ProfileIntro>
    </div>
  ),
} satisfies Meta<typeof ProfileIntro>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Deniz Aydın");
    await expect(canvas.getByText("22 Kas 2026")).toHaveAttribute("dateTime", "2026-11-22");
    await expect(canvas.getByRole("link", { name: "Kod Deposu" })).toHaveAttribute("target", "_blank");
    await expect(canvas.getByRole("link", { name: "Yazılar" })).not.toHaveAttribute("target");
    await expect(canvas.getByRole("button", { name: "E-postayı kopyala: deniz@ornek.com" })).toBeInTheDocument();
  },
};

export const CopyEmail: Story = {
  name: "E-postayı Kopyala",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /E-postayı kopyala/ });
    await userEvent.click(button);
    // Pano izni yoksa hata da canlı bölgede söylenir: iki sonuçtan biri.
    await expect(await canvas.findByText(/Panoya kopyalandı|E-posta kopyalanamadı/, { selector: "[role=status]" })).toBeInTheDocument();
  },
};

export const Minimal: Story = {
  name: "Yalnız Ad ve Eylem",
  args: { links: [], email: undefined, updated: undefined, cta: { label: "Yazı Gönder", onClick: () => {} } },
  render: (args) => (
    <div className="bg-page px-5 py-14">
      <ProfileIntro {...args} />
    </div>
  ),
};
