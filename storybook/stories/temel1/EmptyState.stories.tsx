import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FileSearch, Inbox, MapPinOff, Plus, Users } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Temel/Boş Durum",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Listede ya da panelde gösterilecek bir şey yokken yer tutar: Title Case başlık, ne olacağını söyleyen tek cümle ve varsa tek eylem. Sayfanın tek içeriğiyse (404) `titleAs=\"h1\"` ver, sayfa başlıksız kalmasın.",
      },
    },
  },
  render: (args) => (
    <Frame width="md">
      <EmptyState {...args} />
    </Frame>
  ),
  argTypes: { icon: { control: false }, action: { control: false }, titleAs: { control: "inline-radio", options: ["p", "h1", "h2", "h3"] } },
  args: {
    title: "Henüz Rapor Yok",
    hint: "İlk raporunuzu oluşturduğunuzda burada listelenir.",
    icon: <Inbox aria-hidden />,
    action: (
      <Button variant="primary">
        <Plus aria-hidden />
        Rapor Oluştur
      </Button>
    ),
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = { name: "Varsayılan" };

export const AramaSonucuYok: Story = {
  name: "Arama Sonucu Yok",
  args: {
    title: "Eşleşen Müşteri Yok",
    hint: "“Kuzey Mimarlık” için sonuç bulunamadı. Yazımı kontrol edin ya da filtreleri temizleyin.",
    icon: <FileSearch aria-hidden />,
    action: <Button variant="secondary">Filtreleri Temizle</Button>,
  },
};

export const IkonsuzEylemsiz: Story = {
  name: "İkonsuz, Eylemsiz",
  args: { title: "Bildirim Yok", hint: "Biri sizi andığında burada görünür.", icon: undefined, action: undefined },
};

export const SayfaBulunamadi: Story = {
  name: "Sayfa Bulunamadı",
  args: {
    title: "Sayfa Bulunamadı",
    titleAs: "h1",
    hint: "Aradığınız sayfa taşınmış ya da kaldırılmış olabilir.",
    icon: <MapPinOff aria-hidden />,
    action: <ButtonLink href="/">Ana Sayfaya Dön</ButtonLink>,
  },
};

export const TumVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="İkon + eylem" className="block">
        <EmptyState title="Henüz Rapor Yok" hint="İlk raporunuz burada listelenir." icon={<Inbox aria-hidden />} action={<Button>Rapor Oluştur</Button>} />
      </Cell>
      <Cell label="Arama sonucu yok" className="block">
        <EmptyState title="Eşleşen Kayıt Yok" hint="Filtreleri temizleyip yeniden deneyin." icon={<FileSearch aria-hidden />} action={<Button variant="secondary">Filtreleri Temizle</Button>} />
      </Cell>
      <Cell label="Davet bekleyen ekip" className="block">
        <EmptyState title="Ekipte Kimse Yok" hint="Takım arkadaşlarınızı e-postayla davet edin." icon={<Users aria-hidden />} action={<Button variant="secondary">Davet Gönder</Button>} />
      </Cell>
    </Gallery>
  ),
};
