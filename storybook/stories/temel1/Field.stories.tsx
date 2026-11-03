import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Field } from "@/components/ui/Field";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Temel/Form Alanı",
  id: "field",
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
    label: "E-Posta",
    name: "email",
    type: "email",
    placeholder: "ahmet@acme.com.tr",
    autoComplete: "email",
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText("E-Posta");
    await userEvent.type(input, "ahmet@acme.com.tr");
    await expect(input).toHaveValue("ahmet@acme.com.tr");
  },
};

export const Hint: Story = {
  name: "İpucu",
  args: { hint: "Fatura ve hesap bildirimleri bu adrese gider." },
};

export const Error: Story = {
  name: "Hata",
  args: {
    defaultValue: "ahmet@acme",
    hint: "Fatura ve hesap bildirimleri bu adrese gider.",
    error: "Geçerli bir e-posta adresi girin.",
  },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText("E-Posta");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription("Geçerli bir e-posta adresi girin.");
  },
};

export const Disabled: Story = {
  name: "Devre Dışı",
  args: { label: "Kurum Kodu", name: "org", type: "text", defaultValue: "ACME-4821", disabled: true, hint: "Yalnızca yönetici değiştirebilir." },
};

export const AllStates: Story = {
  name: "Bütün Durumlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Boş, Yer Tutuculu">
        <Field label="Ad Soyad" name="ad" placeholder="Elif Yıldız" className="w-full max-w-xs" />
      </Cell>
      <Cell label="Dolu, İpuçlu">
        <Field label="Şirket" name="sirket" defaultValue="Acme Lojistik A.Ş." hint="Faturada görünecek unvan." className="w-full max-w-xs" />
      </Cell>
      <Cell label="Hata (İpucu Gizlenir)">
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
      <Cell label="Devre Dışı">
        <Field label="Kurum Kodu" name="kod" defaultValue="ACME-4821" disabled className="w-full max-w-xs" />
      </Cell>
    </Gallery>
  ),
};
