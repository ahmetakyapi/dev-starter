import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Combobox } from "@/components/ui/combobox";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { CITIES } from "./_data";

const meta = {
  title: "Bileşenler/Seçim/Aranır Seçim",
  component: Combobox,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Çok sayıda seçenekten biri (şehir, sembol, kişi); yazdıkça süzülür, liste dışında değer kabul etmez. Süzgeç `locale=\"tr-TR\"`: \"istanbul\" yazan \"İstanbul\"u, \"ığdır\" yazan \"Iğdır\"ı bulur. Serbest metinli arama gerekiyorsa bu değil, Base UI `Autocomplete`.",
      },
    },
  },
  args: {
    label: "Şube",
    items: CITIES,
    placeholder: "Şehir yazın",
    emptyText: "Eşleşen şube yok.",
    hideLabel: false,
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
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = { name: "Varsayılan" };

export const TurkceSuzgec: Story = {
  name: "Türkçe Süzgeç",
  parameters: { docs: { description: { story: "\"istanbul\" yazınca yalnızca \"İstanbul\" kalır; seçince girişe yazılır." } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole("combobox", { name: "Şube" });
    await userEvent.type(input, "istanbul");
    const option = await body.findByRole("option", { name: "İstanbul" });
    await waitFor(() => expect(body.getAllByRole("option")).toHaveLength(1));
    await userEvent.click(option);
    await expect(input).toHaveValue("İstanbul");
  },
};

export const Secili: Story = { name: "Seçili", args: { defaultValue: CITIES.find((c) => c.value === "iğdır") } };

export const SonucYok: Story = {
  name: "Sonuç Yok",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.type(within(canvasElement).getByRole("combobox", { name: "Şube" }), "zonguldak");
    await expect(await body.findByText("Eşleşen şube yok.")).toBeVisible();
  },
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Boş">
        <Combobox label="Şube" items={CITIES} placeholder="Şehir yazın" className="w-full" />
      </Cell>
      <Cell label="Seçili">
        <Combobox label="Depo" items={CITIES} defaultValue={CITIES[7]} className="w-full" />
      </Cell>
      <Cell label="Gizli etiket">
        <Combobox label="Şehir Ara" hideLabel items={CITIES} placeholder="Şehir ara" className="w-full" />
      </Cell>
    </Gallery>
  ),
};
