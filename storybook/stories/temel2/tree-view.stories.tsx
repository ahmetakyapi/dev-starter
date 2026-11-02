import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FileSpreadsheet, FileText, Folder, FolderOpen, Image } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";
import { TreeView, type TreeNode } from "@/components/ui/tree-view";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const NODES: TreeNode[] = [
  {
    id: "rapor",
    label: "Raporlar",
    icon: <FolderOpen />,
    children: [
      { id: "q3", label: "Üçüncü Çeyrek.pdf", icon: <FileText /> },
      { id: "q2", label: "İkinci Çeyrek.pdf", icon: <FileText /> },
      {
        id: "arsiv",
        label: "Arşiv",
        icon: <Folder />,
        children: [{ id: "2025", label: "2025 Yıl Sonu.pdf", icon: <FileText /> }],
      },
    ],
  },
  {
    id: "fatura",
    label: "Faturalar",
    icon: <Folder />,
    children: [
      { id: "f1", label: "Ekim.xlsx", icon: <FileSpreadsheet /> },
      { id: "f2", label: "Eylül.xlsx", icon: <FileSpreadsheet /> },
    ],
  },
  { id: "logo", label: "Logo.png", icon: <Image /> },
];

const meta = {
  title: "Bileşenler/Veri/Ağaç Görünümü",
  id: "components-data-tree-view",
  component: TreeView,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "WAI-ARIA tree kalıbı: klasör gezgini, kategori ağacı, içindekiler. Ağaç Tab sırasına tek durak olarak girer, içeride ok tuşları, Home/End, `*` ve harf yazarak arama çalışır. Etiketi düz metin olmayan öğelerde `textValue` ver.",
      },
    },
  },
  args: { nodes: NODES, "aria-label": "Proje Dosyaları", defaultExpanded: ["rapor"], selectedId: undefined },
  argTypes: { nodes: { control: false } },
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
} satisfies Meta<typeof TreeView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole("treeitem", { name: /Raporlar/ });
    first.focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(canvas.getByRole("treeitem", { name: "Üçüncü Çeyrek.pdf" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByRole("treeitem", { name: "Üçüncü Çeyrek.pdf" })).toHaveAttribute("aria-selected", "true");
  },
};

export const Selected: Story = { name: "Seçili Öğe", args: { selectedId: "q2" } };

export const AllCollapsed: Story = { name: "Hepsi Kapalı", args: { defaultExpanded: [] } };

export const AllExpanded: Story = { name: "Hepsi Açık", args: { defaultExpanded: ["rapor", "arsiv", "fatura"] } };

export const LongName: Story = {
  name: "Uzun Ad",
  args: {
    nodes: [
      {
        id: "u",
        label: "Müşteri Sözleşmeleri ve Ekleri",
        icon: <FolderOpen />,
        children: [{ id: "u1", label: "Kurumsal Hizmet Sözleşmesi, Ek Protokol ve İmza Sayfası.pdf", icon: <FileText /> }],
      },
    ],
    defaultExpanded: ["u"],
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={3}>
      <Cell label="İkonlu, açık klasör" className="place-items-stretch">
        <TreeView aria-label="İkonlu" nodes={NODES} defaultExpanded={["rapor"]} />
      </Cell>
      <Cell label="Seçili öğe" className="place-items-stretch">
        <TreeView aria-label="Seçili" nodes={NODES} defaultExpanded={["fatura"]} selectedId="f1" />
      </Cell>
      <Cell label="İkonsuz" className="place-items-stretch">
        <TreeView
          aria-label="İkonsuz"
          defaultExpanded={["k"]}
          nodes={[
            { id: "k", label: "Kategoriler", children: [{ id: "k1", label: "Elektronik" }, { id: "k2", label: "Ev ve Yaşam" }] },
            { id: "m", label: "Markalar", children: [{ id: "m1", label: "Yerli Üreticiler" }] },
          ]}
        />
      </Cell>
    </Gallery>
  ),
};
