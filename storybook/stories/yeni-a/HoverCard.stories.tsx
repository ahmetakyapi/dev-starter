import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { HoverCard, ProfilePreview } from "@/components/ui/hover-card";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { settle } from "./_settle";

const AYSE = {
  name: "Ayşe Kaya",
  role: "Ürün Tasarımcısı",
  handle: "@aysekaya",
  bio: "Ödeme akışı ve tasarım sisteminden sorumlu. Pazartesi ve çarşamba Ankara ofisinde.",
  stats: [
    { label: "Proje", value: 12 },
    { label: "İnceleme", value: 248 },
    { label: "Yanıt Süresi", value: "2 sa" },
  ],
  meta: "Ankara · Katılım Mart 2024",
};

/** Kartın açık hali, katmansız: galeride yan yana görmek için. */
function StaticCard({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-80 rounded-xl border border-line bg-overlay p-4 text-body shadow-modal">{children}</div>;
}

const meta = {
  title: "Bileşenler/Katmanlar/Önizleme Kartı",
  id: "hover-card",
  component: HoverCard,
  tags: ["autodocs"],
  afterEach: settle,
  parameters: {
    docs: {
      description: {
        component:
          "Bir bağlantının ardındakini oraya gitmeden göstermek: yorumdaki @ad, atanan kişi, proje bağlantısı. Fareyle 500 ms bekleyince ya da klavye odağıyla açılır; dokunmatikte ilk dokunuş kartı açar, ikincisi bağlantıya gider. Kart ek bilgidir, içine tek yolu olan eylem konmaz.",
      },
    },
  },
  args: {
    href: "/ekip/ayse-kaya",
    trigger: "Ayşe Kaya",
    side: "bottom",
    align: "start",
    delay: 500,
    children: <ProfilePreview {...AYSE} />,
  },
  argTypes: {
    side: { control: "inline-radio", options: ["top", "bottom", "left", "right"] },
    align: { control: "inline-radio", options: ["start", "center", "end"] },
    children: { control: false },
  },
  render: (args) => (
    <Frame width="sm" className="min-h-[26rem]">
      <p className="text-read text-body">
        Ödeme sayfası tasarımını <HoverCard {...args} /> inceledi; iki küçük düzeltme istedi.
      </p>
    </Frame>
  ),
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: "Ayşe Kaya" });
    await expect(link).toHaveAttribute("href", "/ekip/ayse-kaya");
    await expect(within(document.body).queryByText(AYSE.meta)).not.toBeInTheDocument();
    // Fareyle açılış Base UI'ın gerçek işaretçi türüne bakar; userEvent.hover
    // onu taklit edemiyor (Playwright gerçek fareyle ayrıca denetlendi). Odak aynı yolu açar.
    link.focus();
    await waitFor(() => expect(within(document.body).getByText(AYSE.meta)).toBeInTheDocument(), { timeout: 3000 });
  },
};

export const Open: Story = {
  name: "Açık",
  args: { defaultOpen: true },
};

export const KeyboardFocus: Story = {
  name: "Klavyeyle",
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole("link", { name: "Ayşe Kaya" })).toHaveFocus();
    await waitFor(() => expect(within(document.body).getByText(AYSE.meta)).toBeVisible(), { timeout: 2000 });
    await userEvent.keyboard("{Escape}");
  },
};

export const Minimal: Story = {
  name: "Yalnız Ad ve Rol",
  args: {
    trigger: "@mert.aydin",
    href: "/ekip/mert-aydin",
    defaultOpen: true,
    children: <ProfilePreview name="Mert Aydın" role="Arka Uç Geliştirici" />,
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Tam profil">
        <StaticCard>
          <ProfilePreview {...AYSE} />
        </StaticCard>
      </Cell>
      <Cell label="Durum rozeti, istatistiksiz">
        <StaticCard>
          <ProfilePreview
            name="Zeynep Öztürk"
            role="Müşteri Başarısı"
            handle="zeynep@ozdemir.com.tr"
            bio="Kurumsal hesaplar ve yenileme görüşmeleri."
            badge={<span className="rounded-full bg-success-wash px-2 py-0.5 text-micro font-semibold text-success">Çevrimiçi</span>}
          />
        </StaticCard>
      </Cell>
      <Cell label="Yalnız ad ve rol">
        <StaticCard>
          <ProfilePreview name="Mert Aydın" role="Arka Uç Geliştirici" />
        </StaticCard>
      </Cell>
    </Gallery>
  ),
};
