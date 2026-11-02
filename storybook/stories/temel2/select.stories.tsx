import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Select } from "@/components/ui/select";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { CITIES } from "./_data";

const ITEMS = CITIES.slice(0, 9);

const meta = {
  title: "Bileşenler/Seçim/Açılır Liste",
  component: Select,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "5-15 seçenekten biri, yer dar; daha azında radyo grubu, aranacaksa aranır seçim. Base UI listbox kalıbı: ok tuşları, harf yazarak atlama, Escape ile kapanma, gizli yerel giriş sayesinde form gönderimi. Basit form alanında yerel `<select>` hâlâ doğru seçim.",
      },
    },
  },
  args: {
    label: "Teslimat Şehri",
    items: ITEMS,
    defaultValue: "izmir",
    placeholder: "Şehir seç",
    hideLabel: false,
    disabled: false,
    required: false,
  },
  argTypes: { items: { control: false } },
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
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("combobox"));
    await userEvent.click(await body.findByRole("option", { name: "Bursa" }));
    await expect(canvas.getByRole("combobox")).toHaveTextContent("Bursa");
  },
};

export const Bos: Story = { name: "Seçimsiz", args: { defaultValue: null } };

export const DevreDisi: Story = { name: "Devre Dışı", args: { disabled: true } };

export const DevreDisiSecenek: Story = {
  name: "Devre Dışı Seçenek",
  args: { items: ITEMS.map((c) => (c.value === "ankara" ? { ...c, disabled: true } : c)), defaultValue: null },
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Seçili">
        <Select label="Teslimat Şehri" items={ITEMS} defaultValue="izmir" className="w-full" />
      </Cell>
      <Cell label="Seçimsiz, yer tutucu">
        <Select label="Fatura Şehri" items={ITEMS} placeholder="Şehir seç" className="w-full" />
      </Cell>
      <Cell label="Devre dışı">
        <Select label="Depo" items={ITEMS} defaultValue="bursa" disabled className="w-full" />
      </Cell>
    </Gallery>
  ),
};
