import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { BannerAlert } from "@/components/ui/banner-alert";
import { Button } from "@/components/ui/Button";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { settle } from "./_a11y";

function DismissDemo() {
  const [open, setOpen] = useState(true);
  return open ? (
    <BannerAlert
      tone="warning"
      title="Deneme Süreniz 4 Gün Sonra Bitiyor"
      description="Panolarınız silinmez; yalnızca düzenleme kapanır."
      actions={
        <Button variant="secondary" size="sm">
          Plan Seç
        </Button>
      }
      onDismiss={() => setOpen(false)}
    />
  ) : (
    <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
      Uyarıyı Geri Getir
    </Button>
  );
}

const meta = {
  title: "Bileşenler/Geri Bildirim/Uyarı Satırı",
  id: "banner-alert",
  component: BannerAlert,
  tags: ["autodocs"],
  // Geçişler otursun, a11y denetimi yarım renk yakalamasın (bkz. _a11y.ts).
  afterEach: settle,
  parameters: {
    docs: {
      description: {
        component:
          "Bir bölümün kalıcı durumunu bildirir (ödeme bilgisi eksik, senkron başarısız). Geçici sonuç için toast, kullanıcıyı durduran soru için diyalog kullanın. Ton tek kenar şeridiyle değil wash zemin ve ikonla kurulur; sonradan beliren satıra `announce` verin.",
      },
    },
  },
  args: {
    tone: "info",
    title: "Kur Bilgisi TCMB'den 15.30'da Güncellenir",
    description: "Gün içindeki dövizli işlemler önceki günün kuruyla gösterilir.",
    announce: false,
  },
  argTypes: {
    tone: { control: "inline-radio", options: ["info", "success", "warning", "danger"] },
  },
  render: (args) => (
    <Frame width="lg">
      <BannerAlert {...args} />
    </Frame>
  ),
} satisfies Meta<typeof BannerAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
};

export const FourTones: Story = {
  name: "Dört Ton",
  render: () => (
    <Frame width="lg">
      <div className="grid gap-3">
        <BannerAlert tone="info" title="Kur Bilgisi TCMB'den 15.30'da Güncellenir" />
        <BannerAlert tone="success" title="Ekim Kapanışı Tamamlandı" description="214 işlem eşleşti, fark yok." />
        <BannerAlert tone="warning" title="Fatura Adresi Eksik" description="Kasım faturası adres girilene kadar kesilmeyecek." />
        <BannerAlert tone="danger" title="Banka Senkronu Başarısız" description="Garanti BBVA bağlantısının süresi doldu." />
      </div>
    </Frame>
  ),
};

export const WithAction: Story = {
  name: "Eylemli",
  args: {
    tone: "danger",
    title: "Banka Senkronu Başarısız",
    description: "Garanti BBVA bağlantısının süresi doldu; son işlemler 28 Ekim'den beri gelmiyor.",
    actions: (
      <Button variant="secondary" size="sm">
        <RefreshCw aria-hidden /> Yeniden Bağla
      </Button>
    ),
  },
};

export const Dismissible: Story = {
  name: "Kapatılabilir",
  render: () => (
    <Frame width="lg">
      <DismissDemo />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Uyarıyı Kapat" }));
    await expect(canvas.queryByText("Deneme Süreniz 4 Gün Sonra Bitiyor")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Uyarıyı Geri Getir" }));
    await expect(canvas.getByText("Deneme Süreniz 4 Gün Sonra Bitiyor")).toBeInTheDocument();
  },
};

export const OnDismiss: Story = {
  name: "Kapatılınca Haber Verir",
  args: { tone: "success", title: "Profil Güncellendi", description: undefined, onDismiss: fn() },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Uyarıyı Kapat" }));
    await expect(args.onDismiss).toHaveBeenCalledOnce();
  },
};

export const LongText: Story = {
  name: "Uzun Metin",
  args: {
    tone: "warning",
    title: "Kasım Bordrosunda Üç Çalışanın SGK Bildirgesi Eksik Olduğu için Toplu Ödeme Bekletiliyor",
    description:
      "Ayşe Yılmaz, Mert Kaya ve Zeynep Demir için işe giriş bildirgesi yüklenmedi. Bildirgeler 15 Kasım'a kadar yüklenmezse ödeme bir sonraki döneme kayar ve gecikme cezası doğabilir.",
    actions: (
      <Button variant="secondary" size="sm">
        Bildirge Yükle
      </Button>
    ),
    onDismiss: fn(),
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Bilgi, Yalnız Başlık" className="place-items-stretch">
        <BannerAlert tone="info" title="Kur Bilgisi TCMB'den 15.30'da Güncellenir" />
      </Cell>
      <Cell label="Başarı, Açıklamalı" className="place-items-stretch">
        <BannerAlert tone="success" title="Ekim Kapanışı Tamamlandı" description="214 işlem eşleşti, fark yok." />
      </Cell>
      <Cell label="Uyarı, Kapatılabilir" className="place-items-stretch">
        <BannerAlert tone="warning" title="Deneme Süreniz 4 Gün Sonra Bitiyor" description="Düzenleme kapanır, veriler kalır." onDismiss={() => {}} />
      </Cell>
      <Cell label="Hata, Eylemli" className="place-items-stretch">
        <BannerAlert
          tone="danger"
          title="Banka Senkronu Başarısız"
          description="Bağlantının süresi doldu."
          actions={
            <Button variant="secondary" size="sm">
              <RefreshCw aria-hidden /> Yeniden Bağla
            </Button>
          }
        />
      </Cell>
    </Gallery>
  ),
};
