import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, Download, Plus, Trash2 } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";
import { BUTTON_SIZES, BUTTON_VARIANTS, Button, ButtonLink, type ButtonVariant } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/spinner";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const VARIANTS = Object.keys(BUTTON_VARIANTS) as ButtonVariant[];

const VARIANT_NOTES: Record<ButtonVariant, string> = {
  brand: "brand — ekranın tek birincil eylemi",
  primary: "primary — öteki vurgulu eylemler",
  secondary: "secondary — beyaz karo, kıl çizgisi",
  soft: "soft — renkli ama ikinci derece",
  ghost: "ghost — araç çubuğu, satır içi",
  danger: "danger — yıkıcı eylem",
};

const VARIANT_LABELS: Record<ButtonVariant, string> = {
  brand: "Ücretsiz Başla",
  primary: "Kaydet",
  secondary: "Dışa Aktar",
  soft: "Taslağa Kaydet",
  ghost: "Vazgeç",
  danger: "Sil",
};

const meta = {
  title: "Bileşenler/Temel/Düğme",
  id: "components-core-button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Şablonun düğmesi: altı varyant, dört boy. `brand` marka degradesini taşır ve bir ekranda en fazla bir kez kullanılır; öteki vurgulu eylemler `primary`. Bağlantı görünümlü düğme için `ButtonLink`, başka bir öğeye aynı görünüş için `buttonClass()`; dokunmatikte her boy en az 44 piksel.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: VARIANTS },
    size: { control: "inline-radio", options: Object.keys(BUTTON_SIZES) },
    children: { control: "text" },
  },
  args: { children: "Kaydet", variant: "primary", size: "md", disabled: false, onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Kaydet" }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Brand: Story = {
  name: "Marka (Birincil Eylem)",
  args: { variant: "brand", size: "lg", children: "Ücretsiz Başla" },
};

export const WithIcon: Story = {
  name: "İkonlu",
  render: (args) => (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button {...args} variant="primary">
        <Plus aria-hidden />
        Yeni Rapor
      </Button>
      <Button {...args} variant="secondary">
        <Download aria-hidden />
        Dışa Aktar
      </Button>
      <Button {...args} variant="ghost">
        Tümünü Gör
        <ArrowRight aria-hidden />
      </Button>
      <Button {...args} variant="danger">
        <Trash2 aria-hidden />
        Sil
      </Button>
      <Button {...args} variant="secondary" size="icon" aria-label="Yeni Rapor Ekle">
        <Plus aria-hidden />
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  name: "Yükleniyor",
  render: (args) => (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button {...args} variant="primary" disabled aria-busy="true">
        <Spinner size="sm" tone="current" label={null} />
        Kaydediliyor
      </Button>
      <Button {...args} variant="secondary" disabled aria-busy="true">
        <Spinner size="sm" tone="current" label={null} />
        Dışa aktarılıyor
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  name: "Devre Dışı",
  args: { disabled: true, children: "Yayınla" },
};

export const AsLink: Story = {
  name: "Bağlantı Düğmesi",
  render: () => (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <ButtonLink href="/fiyatlar">Fiyatları İncele</ButtonLink>
      <ButtonLink href="/kayit" variant="primary">
        Hesap Oluştur
        <ArrowRight aria-hidden />
      </ButtonLink>
      <ButtonLink href="/belgeler" variant="ghost">
        Belgeler
      </ButtonLink>
    </div>
  ),
};

export const LongText: Story = {
  name: "Uzun Metin",
  args: { children: "Değişiklikleri Kaydet ve Ekibe Bildirim Gönder", variant: "secondary" },
  render: (args) => (
    <Frame width="sm">
      <div className="flex justify-center">
        <Button {...args} />
      </div>
    </Frame>
  ),
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      {VARIANTS.map((variant) => (
        <Cell key={variant} label={VARIANT_NOTES[variant]}>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant={variant} size="sm">
              {VARIANT_LABELS[variant]}
            </Button>
            <Button variant={variant} size="md">
              {VARIANT_LABELS[variant]}
            </Button>
            <Button variant={variant} size="lg">
              {VARIANT_LABELS[variant]}
            </Button>
            <Button variant={variant} size="icon" aria-label={`${VARIANT_LABELS[variant]} (ikon)`}>
              <Plus aria-hidden />
            </Button>
          </div>
        </Cell>
      ))}
    </Gallery>
  ),
};
