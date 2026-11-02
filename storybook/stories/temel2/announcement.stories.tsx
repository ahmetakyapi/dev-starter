import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Announcement, DismissibleAnnouncement } from "@/components/ui/announcement";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Gezinme/Duyuru",
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
  args: { href: "/surumler/2-4", tag: "Yeni", children: "Grafikler geldi" },
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

export const Varsayilan: Story = { name: "Varsayılan" };

export const SurumKunyesi: Story = { name: "Sürüm Künyesi", args: { tag: "Sürüm 2.4", children: "Panolarda çoklu seçim ve toplu taşıma" } };

export const Kunyesiz: Story = { name: "Künyesiz", args: { tag: undefined, children: "Ekim bülteni yayında" } };

export const UzunMetin: Story = {
  name: "Uzun Metin",
  args: { tag: "Etkinlik", children: "14 Kasım'da İstanbul'da ürün ekibiyle canlı soru-cevap ve yol haritası tanıtımı" },
};

export const Kapatilabilir: Story = {
  name: "Kapatılabilir",
  render: (args) => (
    <DismissibleAnnouncement {...args} storageKey={`sb:duyuru:${Date.now()}`}>
      {args.children}
    </DismissibleAnnouncement>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: /Grafikler geldi/ })).toBeVisible();
    await userEvent.click(canvas.getByRole("button"));
    await expect(canvas.queryByRole("link", { name: /Grafikler geldi/ })).toBeNull();
  },
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Künyeli">
        <Announcement href="/surumler" tag="Yeni">
          Grafikler geldi
        </Announcement>
      </Cell>
      <Cell label="Sürüm künyesi">
        <Announcement href="/surumler/2-4" tag="Sürüm 2.4">
          Panolarda toplu taşıma
        </Announcement>
      </Cell>
      <Cell label="Künyesiz">
        <Announcement href="/bulten">Ekim bülteni yayında</Announcement>
      </Cell>
      <Cell label="Kapatılabilir">
        <DismissibleAnnouncement href="/davet" tag="Ekip" storageKey="sb:duyuru:galeri">
          Panoya misafir davet edin
        </DismissibleAnnouncement>
      </Cell>
    </Gallery>
  ),
};
