import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AtSign, Globe, Link2, Mail, Phone, User } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";
import { Input } from "@/components/ui/input";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { DISABLED_CONTRAST_EXEMPT, settle } from "./_settle";

const meta = {
  title: "Bileşenler/Form Girişleri/Metin Girişi",
  id: "input",
  component: Input,
  tags: ["autodocs"],
  afterEach: settle,
  parameters: {
    docs: {
      description: {
        component:
          "Tek satırlık metin: ad, e-posta, tutar, alan adı, şifre. Şablonun `Field` düzeniyle aynı (etiket, yardım, hata, `aria-describedby`); alanın içine ikon, önek/sonek (₺, .com), temizle ya da şifre göster düğmesi gerekince bu. Önek görsel ipucudur, anlamı etiket taşımalı (\"Tutar (₺)\").",
      },
    },
  },
  args: {
    label: "Ad Soyad",
    placeholder: "Örn. Elif Yıldırım",
    hint: "Faturada bu ad yazacak.",
    size: "md",
    clearable: false,
    disabled: false,
    readOnly: false,
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    leadingIcon: { control: false },
    trailingIcon: { control: false },
  },
  render: (args) => (
    <Frame width="sm">
      <Input {...args} />
    </Frame>
  ),
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("textbox", { name: "Ad Soyad" });
    await userEvent.type(field, "Elif Yıldırım");
    await expect(field).toHaveValue("Elif Yıldırım");
    await expect(field).toHaveAccessibleDescription("Faturada bu ad yazacak.");
  },
};

export const WithIcon: Story = {
  name: "İkonlu",
  args: {
    label: "E-Posta",
    type: "email",
    placeholder: "ad@sirket.com.tr",
    hint: "Sipariş özeti bu adrese gelir.",
    leadingIcon: Mail,
    autoComplete: "email",
  },
};

export const PrefixSuffix: Story = {
  name: "Önek ve Sonek",
  render: () => (
    <Frame width="sm">
      <div className="grid gap-5">
        <Input label="Tutar (₺)" prefix="₺" inputMode="decimal" placeholder="0,00" defaultValue="1.250,00" inputClassName="tabular-nums" />
        <Input label="Alan Adı" prefix="https://" suffix=".com.tr" placeholder="magaza-adi" defaultValue="ozdemir-zeytin" />
        <Input label="Kargo Ağırlığı" suffix="kg" inputMode="decimal" defaultValue="2,4" hint="Kutunun kendisi dahil." />
      </div>
    </Frame>
  ),
};

export const Clearable: Story = {
  name: "Temizlenebilir",
  args: {
    label: "Kupon Kodu",
    placeholder: "Kodu yaz",
    hint: undefined,
    clearable: true,
    defaultValue: "KASIM25",
    leadingIcon: AtSign,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("textbox", { name: "Kupon Kodu" });
    await expect(field).toHaveValue("KASIM25");
    await userEvent.click(canvas.getByRole("button", { name: "Temizle" }));
    await expect(field).toHaveValue("");
    await expect(field).toHaveFocus();
    await expect(canvas.queryByRole("button", { name: "Temizle" })).not.toBeInTheDocument();
  },
};

export const Password: Story = {
  name: "Şifre",
  args: {
    label: "Şifre",
    type: "password",
    placeholder: undefined,
    defaultValue: "zeytin-2024!",
    hint: "En az 10 karakter; bir rakam ve bir simge.",
    autoComplete: "new-password",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByLabelText("Şifre", { selector: "input" });
    await expect(field).toHaveAttribute("type", "password");
    const reveal = canvas.getByRole("button", { name: "Şifreyi Göster" });
    await userEvent.click(reveal);
    await expect(reveal).toHaveAttribute("aria-pressed", "true");
    await expect(field).toHaveAttribute("type", "text");
  },
};

export const Invalid: Story = {
  name: "Hatalı",
  args: {
    label: "Telefon",
    type: "tel",
    leadingIcon: Phone,
    defaultValue: "0532 41",
    error: "Telefon numarası 10 haneli olmalı.",
    placeholder: "05xx xxx xx xx",
  },
};

export const Disabled: Story = {
  name: "Devre Dışı",
  args: { label: "Vergi Numarası", defaultValue: "4810 2276 51", disabled: true, hint: "Muhasebe onayından sonra değiştirilemez." },
  parameters: DISABLED_CONTRAST_EXEMPT,
  render: (args) => (
    <Frame width="sm">
      <div data-a11y-disabled>
        <Input {...args} />
      </div>
    </Frame>
  ),
};

export const ReadOnly: Story = {
  name: "Salt Okunur",
  args: {
    label: "Paylaşım Bağlantısı",
    leadingIcon: Link2,
    readOnly: true,
    defaultValue: "pano.ornek.com.tr/r/k4w9-teklif",
    hint: "Seçip kopyalayabilirsin; bağlantıyı yalnız yönetici yeniler.",
  },
};

export const Sizes: Story = {
  name: "Boylar",
  render: () => (
    <Frame width="sm">
      <div className="grid gap-5">
        <Input size="sm" label="Küçük" leadingIcon={User} placeholder="Tablo içi süzgeç" />
        <Input size="md" label="Orta" leadingIcon={User} placeholder="Form alanı" />
        <Input size="lg" label="Büyük" leadingIcon={User} placeholder="Tek alanlı sayfa" />
      </div>
    </Frame>
  ),
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded", ...DISABLED_CONTRAST_EXEMPT },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Boş">
        <Input label="Şirket Adı" placeholder="Örn. Özdemir Zeytincilik" className="w-full" />
      </Cell>
      <Cell label="İkon + temizle">
        <Input label="E-Posta" leadingIcon={Mail} defaultValue="elif@ozdemir.com.tr" clearable className="w-full" />
      </Cell>
      <Cell label="Önek">
        <Input label="Tutar (₺)" prefix="₺" defaultValue="1.250,00" inputMode="decimal" className="w-full" />
      </Cell>
      <Cell label="Önek + sonek">
        <Input label="Alan Adı" leadingIcon={Globe} suffix=".com.tr" defaultValue="ozdemir-zeytin" className="w-full" />
      </Cell>
      <Cell label="Şifre">
        <Input label="Şifre" type="password" defaultValue="zeytin-2024!" className="w-full" />
      </Cell>
      <Cell label="Hata">
        <Input label="Telefon" leadingIcon={Phone} defaultValue="0532 41" error="Telefon numarası 10 haneli olmalı." className="w-full" />
      </Cell>
      <Cell label="Salt okunur">
        <Input label="Müşteri No" readOnly defaultValue="MS-20481" className="w-full" />
      </Cell>
      <Cell label="Devre dışı">
        <div data-a11y-disabled className="w-full">
          <Input label="Vergi Numarası" disabled defaultValue="4810 2276 51" />
        </div>
      </Cell>
      <Cell label="Gizli etiket, küçük">
        <Input label="Siparişlerde ara" hideLabel size="sm" placeholder="Sipariş no ya da müşteri" className="w-full" />
      </Cell>
    </Gallery>
  ),
};
