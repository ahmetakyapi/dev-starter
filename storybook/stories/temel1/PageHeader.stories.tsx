import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Plus } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Temel/Sayfa Başlığı",
  component: PageHeader,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Sayfanın tek h1'i: künye, başlık, tek cümlelik açıklama ve sağda ekranın tek denetimi; sırası her ekranda aynı. `ink` başlığı degrade mürekkeple çizer, yalnızca bir-üç kelimelik başlıkta kullanılır.",
      },
    },
  },
  render: (args) => (
    <Frame width="xl">
      <PageHeader {...args} />
    </Frame>
  ),
  argTypes: { action: { control: false } },
  args: {
    eyebrow: "Ekim 2026",
    title: "Raporlar",
    description: "Satış, tahsilat ve müşteri hareketlerinin aylık özeti.",
    ink: false,
    action: (
      <Button variant="primary">
        <Plus aria-hidden />
        Yeni Rapor
      </Button>
    ),
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = { name: "Varsayılan" };

export const Murekkepli: Story = {
  name: "Degrade Başlık",
  args: { title: "Fiyatlar", eyebrow: "Şeffaf plan", ink: true, description: "Ekip büyüdükçe ödeyin; gizli ücret yok.", action: undefined },
};

export const Yalin: Story = {
  name: "Yalın (Yalnızca Başlık)",
  args: { eyebrow: undefined, description: undefined, action: undefined, title: "Ayarlar" },
};

export const UzunBaslik: Story = {
  name: "Uzun Başlık",
  args: {
    title: "Müşteri Sözleşmeleri ve Yenileme Takvimi",
    description: "Önümüzdeki 90 gün içinde süresi dolacak sözleşmeler, sorumlu kişi ve son görüşme tarihiyle.",
    action: <ButtonLink href="/sozlesmeler/arsiv">Arşiv</ButtonLink>,
  },
};

export const TumVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Künye + açıklama + eylem" className="block">
        <article aria-label="Künye + açıklama + eylem">
          <PageHeader eyebrow="Ekim 2026" title="Raporlar" description="Aylık satış ve tahsilat özeti." action={<Button>Yeni Rapor</Button>} />
        </article>
      </Cell>
      <Cell label="Mürekkepli kısa başlık" className="block">
        <article aria-label="Mürekkepli kısa başlık">
          <PageHeader title="Fiyatlar" ink description="Ekip büyüdükçe ödeyin." />
        </article>
      </Cell>
      <Cell label="Yalnızca başlık" className="block">
        <article aria-label="Yalnızca başlık">
          <PageHeader title="Ayarlar" />
        </article>
      </Cell>
      <Cell label="Bağlantı eylemi" className="block">
        <article aria-label="Bağlantı eylemi">
          <PageHeader eyebrow="Destek" title="Yardım Merkezi" action={<ButtonLink href="/iletisim">İletişim</ButtonLink>} />
        </article>
      </Cell>
    </Gallery>
  ),
};
