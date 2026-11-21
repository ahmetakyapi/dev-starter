import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { PathGraph, type PathColumn } from "@/components/ui/path-graph";
import { Frame } from "../_lib/Frame";

/** ÖRNEK veri: kişi ya da marka yok. */
const COLUMNS: readonly PathColumn[] = [
  {
    id: "yap",
    label: "Yap",
    nodes: [
      { id: "ios", title: "iOS ödeme", meta: "2g · 23 Kas", after: [] },
      { id: "api", title: "Ödeme servisi", meta: "1g · 25 Kas", critical: true, blocked: true, after: [] },
      { id: "android", title: "Android ödeme", meta: "1g · 20 Kas", after: [] },
      { id: "sync", title: "Çevrimdışı eşitleme", meta: "3g · 24 Kas", after: [] },
    ],
  },
  {
    id: "test",
    label: "Test",
    nodes: [
      { id: "qa", title: "Ödeme ekranı testi", meta: "5g · 3 Ara", critical: true, after: ["ios", "api"] },
      { id: "reg", title: "Gerileme turu", meta: "3g · 30 Kas", after: ["android", "sync"] },
    ],
  },
  {
    id: "yayin",
    label: "Yayın",
    nodes: [{ id: "store", title: "Mağaza incelemesi", meta: "3g · 8 Ara", critical: true, after: ["qa", "reg"] }],
  },
];

const meta = {
  title: "Grafikler/Kritik Yol",
  id: "path-graph",
  component: PathGraph,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Bağımlılığı olan işleri aşama aşama dizer; teslim tarihini belirleyen zincir `danger` tonunda kalın, boşluğu olan bağlantılar ince gri. Ölçüler sabit piksel: bağlantı yolları bunlardan hesaplanır, ölçüm ve istemci kodu yok. Telefonda tuval yatay kayar (odaklanabilir bölge). Çizim `aria-hidden`; her iş sıralı listede \"kritik yolda\", \"engelli\", \"şunlardan sonra\" diye okunur. Plotline panosu referans turundan (yalnız yapı). Örnek veri ÖRNEK'tir.",
      },
    },
  },
  args: {
    label: "Sürüm Yolu",
    start: { title: "Bugün", meta: "20 Kas", note: "+2g geç" },
    columns: COLUMNS,
    goal: { title: "Çıkış", meta: "8 Ara", note: "sözü 4 Ara", after: ["store"] },
  },
  render: (args) => (
    <Frame width="full">
      <PathGraph {...args} />
    </Frame>
  ),
} satisfies Meta<typeof PathGraph>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Sürüm Yolu",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("list", { name: "Sürüm Yolu" });
    await expect(within(list).getByText(/Ödeme servisi, 1g · 25 Kas, kritik yolda, engelli/)).toBeInTheDocument();
    await expect(canvas.getByRole("region", { name: /Sürüm Yolu/ })).toHaveAttribute("tabindex", "0");
  },
};

export const NoEnds: Story = {
  name: "Başlangıçsız ve Hedefsiz",
  args: { start: undefined, goal: undefined, hideLegend: true },
};
