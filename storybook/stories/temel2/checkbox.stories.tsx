import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Checkbox } from "@/components/ui/checkbox";
import { Cell, Frame, Gallery } from "../_lib/Frame";

/* Belirsiz durum yalnızca DOM özelliğiyle kurulur (HTML özniteliği yok). */
const indeterminate = (element: HTMLInputElement | null) => {
  if (element) element.indeterminate = true;
};

const meta = {
  title: "Bileşenler/Seçim/Onay Kutusu",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Kaydet düğmesine bağlı ya da çoklu seçim; anında etki eden ayar için anahtar. Yerel giriş `appearance-none` ile çizilir: formla gönderilir, `:checked`, `:indeterminate`, `:disabled` doğrudan stil olur. Belirsiz durum \"bazıları seçili\" demektir ve `ref` ile kurulur.",
      },
    },
  },
  args: { label: "Haftalık Rapor", hint: "Pazartesi sabahı e-postayla gelir.", disabled: false, defaultChecked: false },
  decorators: [
    (Story, { parameters }) =>
      parameters.bare ? (
        <Story />
      ) : (
      <Frame width="sm">
        <Story />
      </Frame>
    ),
  ],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole("checkbox", { name: /Haftalık Rapor/ });
    await userEvent.click(box);
    await expect(box).toBeChecked();
  },
};

export const Secili: Story = { name: "Seçili", args: { defaultChecked: true } };

export const Belirsiz: Story = {
  name: "Belirsiz",
  args: { label: "Bütün Şubeler", hint: "12 şubeden 5'i seçili." },
  render: (args) => <Checkbox {...args} ref={indeterminate} />,
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole("checkbox", { name: /Bütün Şubeler/ });
    await expect(box).toBePartiallyChecked();
  },
};

export const DevreDisi: Story = { name: "Devre Dışı", args: { disabled: true } };

export const Etiketsiz: Story = {
  name: "Etiketsiz (Tablo Satırı)",
  args: { label: undefined, hint: undefined, "aria-label": "SP-2042 siparişini seç" },
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Boş, seçili, belirsiz">
        <div className="grid">
          <Checkbox label="Fatura Bildirimleri" />
          <Checkbox label="Haftalık Rapor" defaultChecked />
          <Checkbox label="Bütün Şubeler" ref={indeterminate} />
        </div>
      </Cell>
      <Cell label="Açıklamalı">
        <div className="grid">
          <Checkbox label="Kampanya E-postaları" hint="Ayda en fazla iki e-posta." />
          <Checkbox label="SMS ile Doğrulama" hint="Girişte telefonuna kod gönderilir." defaultChecked />
        </div>
      </Cell>
      <Cell label="Devre dışı">
        <div className="grid">
          <Checkbox label="Kurumsal Fatura" disabled />
          <Checkbox label="KVKK Aydınlatma Metni" disabled defaultChecked />
        </div>
      </Cell>
    </Gallery>
  ),
};
