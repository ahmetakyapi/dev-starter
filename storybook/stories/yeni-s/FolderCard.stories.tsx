import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { FolderCard } from "@/components/ui/folder-card";
import { Wallpaper } from "@/components/ui/wallpaper";

const meta = {
  title: "Bileşenler/Tanıtım/Klasör Kartı",
  id: "folder-card",
  component: FolderCard,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Cam klasör: sekmeli arka kapak, içinde beyaz kağıtlar, önde `backdrop-filter` camı; camın üstünde başlık, sol altta kişi, sağ altta durum hapı. Üzerine gelince (ince işaretçi) ya da klavye odağında ön kapak menteşe gibi açılır, kağıtlar sırayla yükselir. `href` verilirse tek bağlantı, değilse `role=\"img\"` süs. Hareketi azaltanda kağıtlar hafif yükselmiş durağan. Sunucu bileşeni, yalnız CSS. Manzara turundan (yalnız davranış ve yapı).",
      },
    },
  },
  args: {
    title: "Marka Kitabı",
    subtitle: "Deniz Aydın",
    status: "Taslak",
    tone: "primary",
    href: "#marka-kitabi",
  },
} satisfies Meta<typeof FolderCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: /Marka Kitabı/ });
    await expect(link).toHaveAccessibleName(/Deniz Aydın/);
    await expect(link).toHaveAttribute("href", "#marka-kitabi");
    await userEvent.tab();
    await expect(link).toHaveFocus();
  },
};

export const Grid: Story = {
  name: "Proje Izgarası, Duvar Kağıdı Üstünde",
  render: () => (
    <div className="relative isolate overflow-hidden rounded-xl p-6 sm:p-10">
      <Wallpaper scene="lagoon" className="absolute inset-0 -z-10" />
      <div className="grid grid-cols-1 justify-items-center gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <FolderCard title="Marka Kitabı" subtitle="Deniz Aydın" status="Taslak" tone="primary" href="#marka" />
        <FolderCard title="Bahar Kampanyası" subtitle="Ece Yıldız" status="3 Dosya" tone="chart-2" papers={2} href="#kampanya" />
        <FolderCard title="Yıllık Rapor" subtitle="Mert Kaya" status="Onaylandı" tone="chart-6" papers={4} href="#rapor" />
        <FolderCard title="Ürün Fotoğrafları" subtitle="Selin Arı" status="Yeni" tone="chart-4" href="#foto" />
        <FolderCard title="Sözleşmeler" subtitle="Hukuk Ekibi" status="Arşiv" tone="neutral" papers={1} href="#sozlesme" />
        <FolderCard title="Etkinlik Planı" subtitle="Can Demir" status="Bu Hafta" tone="chart-5" href="#etkinlik" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("link")).toHaveLength(6);
    await userEvent.tab();
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: /Bahar Kampanyası/ })).toHaveFocus();
  },
};

export const Decorative: Story = {
  name: "Bağlantısız Süs",
  args: { href: undefined, tone: "chart-3", status: "12 Not", title: "Okuma Notları", subtitle: "Kişisel" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("img")).toHaveAccessibleName("Okuma Notları, Kişisel");
    await expect(canvas.queryByRole("link")).toBeNull();
  },
};
