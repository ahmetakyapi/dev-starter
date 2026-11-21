import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { ValueDiff } from "@/components/ui/value-diff";
import { Frame } from "../_lib/Frame";

const ROWS = [
  { label: "Faturada Yazan", groups: ["100", "3847", "2560", "0003"], tone: "bad" as const, note: "Tedarikçi faturaya elle yazmış (ÖRNEK)" },
  { label: "Doğrulanmış Kayıt", groups: ["100", "3847", "2650", "0003"], tone: "good" as const, note: "Vergi sicilinden 3 Mart'ta doğrulandı (ÖRNEK)" },
];

const meta = {
  title: "Bileşenler/Veri/Değer Farkı",
  id: "value-diff",
  component: ValueDiff,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Aynı kimliğin iki kaynaktaki yazılışı alt alta, FARKLI grup vurgulu: faturadaki vergi numarası ile doğrulanmış kayıt, sözleşme no ile sistem kaydı. Değer parçalara (`groups`) bölünür; farklı gruplar elle verilir ya da satırlardan türer. Renk tek işaret değil: farklı grup kalın altı çizgi taşır ve ekran okuyucuya \"farklı\" okunur, blok başında tek cümlelik özet vardır. Clearbill istisna ekranından (yalnız yapı). Örnek veri ÖRNEK'tir.",
      },
    },
  },
  args: { rows: ROWS },
  render: (args) => (
    <Frame width="md">
      <ValueDiff {...args} />
    </Frame>
  ),
} satisfies Meta<typeof ValueDiff>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Vergi Numarası Farkı",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Farklı grup 3: Faturada Yazan 2560, Doğrulanmış Kayıt 2650/)).toBeInTheDocument();
    await expect(canvas.getAllByText("(farklı)", { exact: false })).toHaveLength(2);
  },
};

export const Same: Story = {
  name: "Değerler Aynı",
  args: {
    rows: [
      { label: "Sistem Kaydı", groups: ["TR33", "0006", "1001"], tone: "neutral" },
      { label: "Banka Kaydı", groups: ["TR33", "0006", "1001"], tone: "neutral" },
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Değerler aynı.")).toBeInTheDocument();
  },
};

export const Explicit: Story = {
  name: "Elle Verilen Fark",
  args: {
    diffGroups: [0, 3],
    rows: [
      { label: "Beklenen", groups: ["SZ", "2026", "114", "A"], tone: "good" },
      { label: "Gelen", groups: ["SX", "2026", "114", "B"], tone: "bad" },
    ],
  },
};
