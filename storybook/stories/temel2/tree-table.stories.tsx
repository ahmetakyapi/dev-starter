import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { TreeTable, type TreeTableColumn, type TreeTableRow } from "@/components/ui/tree-table";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const COLUMNS: TreeTableColumn[] = [
  { key: "kalem", header: "Kalem" },
  { key: "plan", header: "Plan", numeric: true },
  { key: "gercek", header: "Gerçekleşen", numeric: true },
];

const ROWS: TreeTableRow[] = [
  {
    id: "pazarlama",
    cells: { kalem: "Pazarlama", plan: "₺120.000", gercek: "₺98.400" },
    children: [
      { id: "reklam", cells: { kalem: "Dijital Reklam", plan: "₺80.000", gercek: "₺71.200" } },
      { id: "etkinlik", cells: { kalem: "Etkinlik", plan: "₺40.000", gercek: "₺27.200" } },
    ],
  },
  {
    id: "altyapi",
    cells: { kalem: "Altyapı", plan: "₺45.000", gercek: "₺46.900" },
    children: [
      { id: "sunucu", cells: { kalem: "Sunucu", plan: "₺32.000", gercek: "₺34.100" } },
      { id: "lisans", cells: { kalem: "Yazılım Lisansı", plan: "₺13.000", gercek: "₺12.800" } },
    ],
  },
  { id: "egitim", cells: { kalem: "Eğitim", plan: "₺18.000", gercek: "₺9.600" } },
];

const meta = {
  title: "Bileşenler/Veri/Ağaç Tablo",
  id: "tree-table",
  component: TreeTable,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "WAI-ARIA treegrid: satırlar bir ağaç, sütunlar bir tablo (bütçe → alt kalemler, portföy → pozisyonlar). Odak satırda gezer; → açar, ← kapatır. Hücreler hazır içerik (ReactNode), sayı biçimlemesi çağıranın işi.",
      },
    },
  },
  args: { caption: "Bütçe", columns: COLUMNS, rows: ROWS, defaultExpanded: ["pazarlama"], minWidth: "24rem" },
  argTypes: { columns: { control: false }, rows: { control: false } },
  decorators: [
    (Story, { parameters }) =>
      parameters.bare ? (
        <Story />
      ) : (
      <Frame width="lg">
        <Story />
      </Frame>
    ),
  ],
} satisfies Meta<typeof TreeTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByRole("row", { name: /Altyapı/ });
    await expect(row).toHaveAttribute("aria-expanded", "false");
    row.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(row).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByRole("row", { name: /Sunucu/ })).toBeInTheDocument();
  },
};

export const Collapsed: Story = { name: "Hepsi Kapalı", args: { defaultExpanded: [] } };

export const AllExpanded: Story = { name: "Hepsi Açık", args: { defaultExpanded: ["pazarlama", "altyapi"] } };

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Kapalı" className="place-items-stretch">
        <TreeTable caption="Bütçe, kapalı" columns={COLUMNS} rows={ROWS} />
      </Cell>
      <Cell label="Bir Kalem Açık" className="place-items-stretch">
        <TreeTable caption="Bütçe, bir kalem açık" columns={COLUMNS} rows={ROWS} defaultExpanded={["altyapi"]} />
      </Cell>
    </Gallery>
  ),
};
