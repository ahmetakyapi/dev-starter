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
      title="Deneme süreniz 4 gün sonra bitiyor"
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
    title: "Kur bilgisi TCMB'den 15.30'da güncellenir",
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

export const Varsayilan: Story = {
  name: "Varsayılan",
};

export const DortTon: Story = {
  name: "Dört Ton",
  render: () => (
    <Frame width="lg">
      <div className="grid gap-3">
        <BannerAlert tone="info" title="Kur bilgisi TCMB'den 15.30'da güncellenir" />
        <BannerAlert tone="success" title="Ekim kapanışı tamamlandı" description="214 işlem eşleşti, fark yok." />
        <BannerAlert tone="warning" title="Fatura adresi eksik" description="Kasım faturası adres girilene kadar kesilmeyecek." />
        <BannerAlert tone="danger" title="Banka senkronu başarısız" description="Garanti BBVA bağlantısının süresi doldu." />
      </div>
    </Frame>
  ),
};

export const Eylemli: Story = {
  name: "Eylemli",
  args: {
    tone: "danger",
    title: "Banka senkronu başarısız",
    description: "Garanti BBVA bağlantısının süresi doldu; son işlemler 28 Ekim'den beri gelmiyor.",
    actions: (
      <Button variant="secondary" size="sm">
        <RefreshCw aria-hidden /> Yeniden Bağla
      </Button>
    ),
  },
};

export const Kapatilabilir: Story = {
  name: "Kapatılabilir",
  render: () => (
    <Frame width="lg">
      <DismissDemo />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Uyarıyı Kapat" }));
    await expect(canvas.queryByText("Deneme süreniz 4 gün sonra bitiyor")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Uyarıyı Geri Getir" }));
    await expect(canvas.getByText("Deneme süreniz 4 gün sonra bitiyor")).toBeInTheDocument();
  },
};

export const KapatmaOlayi: Story = {
  name: "Kapatma Olayı (onDismiss)",
  args: { tone: "success", title: "Profil güncellendi", description: undefined, onDismiss: fn() },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Uyarıyı Kapat" }));
    await expect(args.onDismiss).toHaveBeenCalledOnce();
  },
};

export const UzunMetin: Story = {
  name: "Uzun Metin",
  args: {
    tone: "warning",
    title: "Kasım bordrosunda üç çalışanın SGK bildirgesi eksik olduğu için toplu ödeme bekletiliyor",
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

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Bilgi, yalnız başlık" className="place-items-stretch">
        <BannerAlert tone="info" title="Kur bilgisi TCMB'den 15.30'da güncellenir" />
      </Cell>
      <Cell label="Başarı, açıklamalı" className="place-items-stretch">
        <BannerAlert tone="success" title="Ekim kapanışı tamamlandı" description="214 işlem eşleşti, fark yok." />
      </Cell>
      <Cell label="Uyarı, kapatılabilir" className="place-items-stretch">
        <BannerAlert tone="warning" title="Deneme süreniz 4 gün sonra bitiyor" description="Düzenleme kapanır, veriler kalır." onDismiss={() => {}} />
      </Cell>
      <Cell label="Hata, eylemli" className="place-items-stretch">
        <BannerAlert
          tone="danger"
          title="Banka senkronu başarısız"
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
