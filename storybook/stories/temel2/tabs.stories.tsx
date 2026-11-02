import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { TabLinks, Tabs, type TabItem } from "@/components/ui/tabs";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const panel = (text: string) => <p className="text-base text-body">{text}</p>;

const ITEMS: TabItem[] = [
  { value: "genel", label: "Genel Bakış", panel: panel("Bu hafta 128 sipariş, 4 iade. Ciro geçen haftaya göre %6,4 arttı.") },
  { value: "ekip", label: "Ekip", panel: panel("7 kişi, 2 davet bekliyor.") },
  { value: "ayar", label: "Ayarlar", panel: panel("Bildirim ve fatura tercihleri.") },
  { value: "arsiv", label: "Arşiv", panel: panel("Arşivlenmiş projeler."), disabled: true },
];

const meta = {
  title: "Bileşenler/Gezinme/Sekmeler",
  component: Tabs,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "`Tabs` aynı sayfada içerik değiştirir (WAI-ARIA tabs): ok tuşları gezer ve hemen etkinleştirir, paneller `hidden` ile saklanır, DOM'dan atılmaz. Her sekme ayrı bir adresse `TabLinks`: `role=\"tab\"` yok, etkin olan `aria-current=\"page\"`. Kuyu (`well`) varsayılan, alt çizgi (`underline`) seçenek.",
      },
    },
  },
  args: { items: ITEMS, "aria-label": "Proje Bölümleri", variant: "well", defaultValue: "genel" },
  argTypes: { variant: { control: "inline-radio", options: ["well", "underline"] }, items: { control: false } },
  decorators: [
    (Story, { parameters }) =>
      parameters.bare ? (
        <Story />
      ) : (
      <Frame width="lg">
        <Story />
      </Frame>
    ),
  ],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole("tab", { name: "Genel Bakış" });
    await userEvent.click(first);
    await userEvent.keyboard("{ArrowRight}");
    const second = canvas.getByRole("tab", { name: "Ekip" });
    await expect(second).toHaveAttribute("aria-selected", "true");
    await expect(second).toHaveFocus();
    await expect(canvas.getByRole("tabpanel")).toHaveTextContent("7 kişi");
    // Devre dışı "Arşiv" atlanır, sondan başa döner.
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await expect(first).toHaveAttribute("aria-selected", "true");
  },
};

export const AltCizgi: Story = { name: "Alt Çizgi", args: { variant: "underline", "aria-label": "Rapor Türü" } };

export const IkinciSecili: Story = { name: "İkinci Sekme Seçili", args: { defaultValue: "ayar" } };

export const CokSekme: Story = {
  name: "Çok Sekme (taşma)",
  args: {
    items: ["Özet", "Siparişler", "Müşteriler", "Ürünler", "Kampanyalar", "Raporlar", "Entegrasyonlar", "Faturalandırma"].map((label) => ({
      value: label.toLocaleLowerCase("tr-TR"),
      label,
      panel: panel(`${label} bölümü.`),
    })),
    defaultValue: "özet",
  },
};

export const SekmeBaglantilari: Story = {
  name: "Sekme Bağlantıları (TabLinks)",
  render: (args) => (
    <div className="grid gap-6">
      <TabLinks
        aria-label="Ayarlar"
        variant={args.variant}
        current="/ayarlar/guvenlik"
        items={[
          { href: "/ayarlar/profil", label: "Profil" },
          { href: "/ayarlar/guvenlik", label: "Güvenlik" },
          { href: "/ayarlar/bildirim", label: "Bildirimler" },
        ]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: "Güvenlik" })).toHaveAttribute("aria-current", "page");
    await expect(canvas.queryByRole("tab")).toBeNull();
  },
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Tabs, well" className="place-items-stretch">
        <Tabs aria-label="Well Sekmeler" items={ITEMS} />
      </Cell>
      <Cell label="Tabs, underline" className="place-items-stretch">
        <Tabs aria-label="Alt Çizgili Sekmeler" variant="underline" items={ITEMS} />
      </Cell>
      <Cell label="TabLinks, well" className="content-center place-items-stretch">
        <TabLinks
          aria-label="Ayarlar, kuyu"
          current="/ayarlar/profil"
          items={[
            { href: "/ayarlar/profil", label: "Profil" },
            { href: "/ayarlar/guvenlik", label: "Güvenlik" },
            { href: "/ayarlar/bildirim", label: "Bildirimler" },
          ]}
        />
      </Cell>
      <Cell label="TabLinks, underline" className="content-center place-items-stretch">
        <TabLinks
          aria-label="Ayarlar, alt çizgi"
          variant="underline"
          current="/ayarlar/bildirim"
          items={[
            { href: "/ayarlar/profil", label: "Profil" },
            { href: "/ayarlar/guvenlik", label: "Güvenlik" },
            { href: "/ayarlar/bildirim", label: "Bildirimler" },
          ]}
        />
      </Cell>
    </Gallery>
  ),
};
