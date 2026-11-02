import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Switch } from "@/components/ui/switch";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Seçim/Aç-Kapa Düğmesi",
  id: "switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Anında etki eden aç/kapa ayarı (\"Bildirimler\", \"Koyu Tema\"); kaydet düğmesine bağlı bir seçimse onay kutusu kullan. Yerel `<input type=\"checkbox\" role=\"switch\">`: JavaScript'siz çalışır, formla gönderilir, ekran okuyucu \"anahtar, açık\" der.",
      },
    },
  },
  args: { label: "Bildirimler", hint: "Yeni sipariş gelince haber ver.", placement: "end", disabled: false, defaultChecked: false },
  argTypes: { placement: { control: "inline-radio", options: ["start", "end"] } },
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
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: /Bildirimler/ });
    await expect(control).not.toBeChecked();
    await userEvent.click(canvas.getByText("Bildirimler"));
    await expect(control).toBeChecked();
    await userEvent.click(canvas.getByText("Bildirimler"));
    await expect(control).not.toBeChecked();
  },
};

export const Open: Story = { name: "Açık", args: { defaultChecked: true } };

export const Disabled: Story = { name: "Devre Dışı", args: { label: "Otomatik Fatura", hint: "Yalnızca kurumsal planda.", disabled: true } };

export const LeftRail: Story = { name: "Solda Ray", args: { placement: "start", hint: undefined, label: "Hatırla" } };

export const LongText: Story = {
  name: "Uzun Metin",
  args: {
    label: "Model Eğitimine Katkı",
    hint: "Adı ve e-postası çıkarılmış örnek sohbetler, yanıt kalitesini iyileştirmek için kullanılır. İstediğin zaman kapatabilirsin.",
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Ayar Listesi: Ray Sağda" className="place-items-stretch">
        <div className="grid divide-y divide-line-soft">
          <Switch label="Bildirimler" hint="Yeni sipariş gelince haber ver." defaultChecked />
          <Switch label="Sessiz Saatler" hint="22.00 ile 08.00 arası bildirim yok." />
          <Switch label="Otomatik Fatura" disabled />
          <Switch label="Haftalık Özet" disabled defaultChecked />
        </div>
      </Cell>
      <Cell label="Satır İçi: Ray Solda">
        <div className="grid gap-1">
          <Switch placement="start" label="Hareketi Azalt" />
          <Switch placement="start" label="Sıkı Düzen" defaultChecked />
        </div>
      </Cell>
    </Gallery>
  ),
};
