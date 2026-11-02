import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { RadioGroup, type RadioOption } from "@/components/ui/radio-group";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const SHIPPING: RadioOption[] = [
  { value: "standart", label: "Standart", hint: "2-4 iş günü, ücretsiz" },
  { value: "hizli", label: "Hızlı", hint: "Ertesi gün, ₺89" },
  { value: "magaza", label: "Mağazadan Teslim", hint: "Kadıköy şubesi, yarın 14.00'ten sonra" },
];

const meta = {
  title: "Bileşenler/Seçim/Seçenek Grubu",
  component: RadioGroup,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Birbirini dışlayan 2-6 seçenek, hepsi aynı anda görünür; yedi ve üstünde seçim kutusu. Yerel `<fieldset>` + `<legend>`: ok tuşu gezinmesini, tek Tab durağını ve form gönderimini tarayıcı yapar.",
      },
    },
  },
  args: {
    name: "kargo",
    legend: "Kargo Seçeneği",
    options: SHIPPING,
    defaultValue: "standart",
    orientation: "vertical",
    hideLegend: false,
    required: false,
  },
  argTypes: { orientation: { control: "inline-radio", options: ["vertical", "horizontal"] } },
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
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("radio", { name: /Hızlı/ }));
    await expect(canvas.getByRole("radio", { name: /Hızlı/ })).toBeChecked();
    await expect(canvas.getByRole("radio", { name: /Standart/ })).not.toBeChecked();
  },
};

export const Yatay: Story = {
  name: "Yatay",
  args: {
    name: "beden",
    legend: "Beden",
    defaultValue: "m",
    orientation: "horizontal",
    options: [
      { value: "s", label: "S" },
      { value: "m", label: "M" },
      { value: "l", label: "L" },
      { value: "xl", label: "XL", disabled: true },
    ],
  },
};

export const SecimsizZorunlu: Story = { name: "Seçimsiz, Zorunlu", args: { defaultValue: undefined, required: true } };

export const DevreDisiSecenek: Story = {
  name: "Devre Dışı Seçenek",
  args: { options: [...SHIPPING.slice(0, 2), { ...SHIPPING[2], disabled: true, hint: "Bu şubede stok yok" }] },
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Dikey, açıklamalı">
        <RadioGroup name="g1" legend="Kargo Seçeneği" options={SHIPPING} defaultValue="hizli" />
      </Cell>
      <Cell label="Yatay, kısa">
        <RadioGroup
          name="g2"
          legend="Fatura Türü"
          orientation="horizontal"
          defaultValue="bireysel"
          options={[
            { value: "bireysel", label: "Bireysel" },
            { value: "kurumsal", label: "Kurumsal" },
          ]}
        />
      </Cell>
      <Cell label="Gizli başlık">
        <RadioGroup
          name="g3"
          legend="Ödeme Yöntemi"
          hideLegend
          defaultValue="kart"
          options={[
            { value: "kart", label: "Kredi Kartı" },
            { value: "havale", label: "Havale / EFT" },
            { value: "kapida", label: "Kapıda Ödeme", disabled: true },
          ]}
        />
      </Cell>
    </Gallery>
  ),
};
