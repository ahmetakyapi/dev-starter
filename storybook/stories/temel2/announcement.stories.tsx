import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Announcement, DismissibleAnnouncement } from "@/components/ui/announcement";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Gezinme/Duyuru",
  id: "announcement",
  component: Announcement,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Sayfanın üst bölümündeki başlığın üstünde tek satırlık haber (\"Yeni · Grafikler geldi →\"); bilgi vermek için değil tıklanmak için durur. Noktasız ve yanıp sönmez; hapın tamamı tek bağlantı. Kapatılabilir hâlde × bağlantının kardeşidir ve kapatma tarayıcıda hatırlanır.",
      },
    },
  },
  args: { href: "/surumler/2-4", tag: "Yeni", children: "Grafikler Geldi" },
  decorators: [
    (Story, { parameters }) =>
      parameters.bare ? (
        <Story />
      ) : (
      <Frame width="md">
        <div className="flex justify-center">
          <Story />
        </div>
      </Frame>
    ),
  ],
} satisfies Meta<typeof Announcement>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const VersionTag: Story = { name: "Sürüm Künyesi", args: { tag: "Sürüm 2.4", children: "Panolarda Çoklu Seçim ve Toplu Taşıma" } };

export const WithoutEyebrow: Story = { name: "Künyesiz", args: { tag: undefined, children: "Ekim Bülteni Yayında" } };

export const LongText: Story = {
  name: "Uzun Metin",
  args: { tag: "Etkinlik", children: "14 Kasım'da İstanbul'da Ürün Ekibiyle Canlı Soru-Cevap ve Yol Haritası Tanıtımı" },
};

export const Dismissible: Story = {
  name: "Kapatılabilir",
  render: (args) => (
    <DismissibleAnnouncement {...args} storageKey={`sb:duyuru:${Date.now()}`}>
      {args.children}
    </DismissibleAnnouncement>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: /Grafikler Geldi/ })).toBeVisible();
    await userEvent.click(canvas.getByRole("button"));
    await expect(canvas.queryByRole("link", { name: /Grafikler Geldi/ })).toBeNull();
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Künyeli">
        <Announcement href="/surumler" tag="Yeni">
          Grafikler Geldi
        </Announcement>
      </Cell>
      <Cell label="Sürüm Künyesi">
        <Announcement href="/surumler/2-4" tag="Sürüm 2.4">
          Panolarda Toplu Taşıma
        </Announcement>
      </Cell>
      <Cell label="Künyesiz">
        <Announcement href="/bulten">Ekim Bülteni Yayında</Announcement>
      </Cell>
      <Cell label="Kapatılabilir">
        <DismissibleAnnouncement href="/davet" tag="Ekip" storageKey="sb:duyuru:galeri">
          Panoya Misafir Davet Edin
        </DismissibleAnnouncement>
      </Cell>
    </Gallery>
  ),
};
