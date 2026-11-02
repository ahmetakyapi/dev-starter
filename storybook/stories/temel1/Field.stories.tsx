import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Field } from "@/components/ui/Field";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Temel/Form Alanı",
  component: Field,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Etiket + giriş + hata. Hata ve ipucu `aria-describedby` ile girişe bağlıdır; hata varken ipucu gizlenir. Doğrulama sunucuda yapılır, `error` sunucu eyleminin döndürdüğü alan hatasıdır.",
      },
    },
  },
  render: (args) => (
    <Frame width="sm">
      <Field {...args} />
    </Frame>
  ),
  args: {
    label: "E-posta",
    name: "email",
    type: "email",
    placeholder: "elif@acme.com.tr",
    autoComplete: "email",
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText("E-posta");
    await userEvent.type(input, "elif@acme.com.tr");
    await expect(input).toHaveValue("elif@acme.com.tr");
  },
};

export const Ipucu: Story = {
  name: "İpucu",
  args: { hint: "Fatura ve hesap bildirimleri bu adrese gider." },
};

export const Hata: Story = {
  name: "Hata",
  args: {
    defaultValue: "elif@acme",
    hint: "Fatura ve hesap bildirimleri bu adrese gider.",
    error: "Geçerli bir e-posta adresi girin.",
  },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText("E-posta");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription("Geçerli bir e-posta adresi girin.");
  },
};

export const DevreDisi: Story = {
  name: "Devre Dışı",
  args: { label: "Kurum Kodu", name: "org", type: "text", defaultValue: "ACME-4821", disabled: true, hint: "Yalnızca yönetici değiştirebilir." },
};

export const TumDurumlar: Story = {
  name: "Bütün Durumlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Boş, yer tutuculu">
        <Field label="Ad Soyad" name="ad" placeholder="Elif Yıldız" className="w-full max-w-xs" />
      </Cell>
      <Cell label="Dolu, ipuçlu">
        <Field label="Şirket" name="sirket" defaultValue="Acme Lojistik A.Ş." hint="Faturada görünecek unvan." className="w-full max-w-xs" />
      </Cell>
      <Cell label="Hata (ipucu gizlenir)">
        <Field
          label="Telefon"
          name="tel"
          type="tel"
          defaultValue="0532 41"
          hint="Başında 0 ile, 11 hane."
          error="Telefon numarası 11 haneli olmalı."
          className="w-full max-w-xs"
        />
      </Cell>
      <Cell label="Devre dışı">
        <Field label="Kurum Kodu" name="kod" defaultValue="ACME-4821" disabled className="w-full max-w-xs" />
      </Cell>
    </Gallery>
  ),
};
