import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { House, Package, Settings, User } from "lucide-react";
import { Breadcrumb, type Crumb } from "@/components/ui/breadcrumb";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const ICONS: Crumb[] = [
  { label: "Ana Sayfa", href: "/", icon: <House /> },
  { label: "Ayarlar", href: "/ayarlar", icon: <Settings /> },
  { label: "Profil", icon: <User /> },
];

const PLAIN: Crumb[] = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Siparişler", href: "/siparisler" },
  { label: "SP-2042" },
];

const meta = {
  title: "Bileşenler/Gezinme/Gezinti Yolu",
  id: "breadcrumb",
  component: Breadcrumb,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "\"Ana Sayfa › Ayarlar › Profil\". Son öğe bulunulan sayfa: bağlantı değil, `aria-current=\"page\"`; ayraçlar `aria-hidden`. İkon süstür, ad metinde; `iconOnly` ilk öğeyi yalnızca ikonla gösterir. Telefonda tek bir geri bağlantısına iner.",
      },
    },
  },
  args: { items: ICONS, label: "Sayfa Konumu", iconOnly: false },
  argTypes: { items: { control: false } },
  decorators: [
    (Story, { parameters }) =>
      parameters.bare ? (
        <Story />
      ) : (
      <Frame width="md">
        <Story />
      </Frame>
    ),
  ],
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const IconOnly: Story = { name: "İlk Öğe Yalnız İkon", args: { iconOnly: true } };

export const WithoutIcon: Story = { name: "İkonsuz", args: { items: PLAIN } };

export const DeepPath: Story = {
  name: "Derin Yol",
  args: {
    iconOnly: true,
    items: [
      { label: "Ana Sayfa", href: "/", icon: <House /> },
      { label: "Katalog", href: "/katalog" },
      { label: "Elektronik", href: "/katalog/elektronik" },
      { label: "Kulaklıklar", href: "/katalog/elektronik/kulaklik" },
      { label: "Kablosuz Kulak İçi Kulaklık, Gürültü Engellemeli", icon: <Package /> },
    ],
  },
};

export const Mobile: Story = {
  name: "Telefon",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  parameters: { docs: { description: { story: "Dar ekranda yalnızca bir üst sayfaya geri bağlantısı kalır." } } },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={3}>
      <Cell label="İkonlu">
        <Breadcrumb label="İkonlu Konum" items={ICONS} />
      </Cell>
      <Cell label="iconOnly">
        <Breadcrumb label="Yalnız İkonlu Konum" items={ICONS} iconOnly />
      </Cell>
      <Cell label="İkonsuz">
        <Breadcrumb label="İkonsuz Konum" items={PLAIN} />
      </Cell>
    </Gallery>
  ),
};
