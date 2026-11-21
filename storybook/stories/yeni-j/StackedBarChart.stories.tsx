import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { ChartCard } from "@/components/ui/chart-card";
import { StackedBarChart } from "@/components/ui/stacked-bar-chart";

const SERIES = [
  { name: "Destek", color: 4 },
  { name: "Özet", color: 3 },
  { name: "Geri bildirim", color: 2 },
  { name: "Rakip takibi", color: 6 },
] as const;
const DATA = [
  { label: "Per 12", values: [26, 14, 0, 0] },
  { label: "Cum 13", values: [26, 14, 16, 0] },
  { label: "Cmt 14", values: [0, 12, 0, 0] },
  { label: "Paz 15", values: [0, 12, 0, 0] },
  { label: "Pzt 16", values: [26, 14, 38, 0] },
  { label: "Sal 17", values: [26, 14, 0, 0] },
  { label: "Bugün", values: [8, 12, 0, 24] },
];

const meta = {
  title: "Grafikler/Yığılı Sütun Grafiği",
  id: "stacked-bar-chart",
  component: StackedBarChart,
  tags: ["autodocs", "yeni"],
  parameters: {
    // a11y TODO (Sütun butonu adı görünen balon metnini aynen içermiyor (label-content-name-mismatch), bileşen düzeltmesi bekliyor): bkz. storybook/A11Y-DURUM.md
    a11y: { test: "todo" },
    layout: "padded",
    docs: {
      description: {
        component:
          "Aynı günün toplamı ve neyden oluştuğu: her sütun birkaç serinin üst üste yığılmış hali. `highlight` sütunu doygun kalır ve balonu kalıcıdır, ötekiler soluklaşır; fareyle ya da oklarla başka sütuna gelince balon oraya geçer. Çizim alanı bir grup, her sütun odaklanabilir bir buton (← → Home End) ve adı bütün değeri söyler. Asıl soru toplam değilse `line-chart` kullan. baobun.studio turundan.",
      },
    },
  },
  args: { title: "Gün başına kredi", series: SERIES, data: DATA, ticks: [0, 20, 40, 60, 80], highlight: 6, unit: "/gün" },
  render: (args) => (
    <div className="mx-auto max-w-2xl">
      <ChartCard label="Gün başına kredi" value="276" action={<span className="text-small text-muted">Son 7 gün</span>}>
        <StackedBarChart {...args} />
      </ChartCard>
    </div>
  ),
} satisfies Meta<typeof StackedBarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Gün Başına Kredi",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const col = canvas.getByRole("button", { name: /^Pzt 16:/ });
    await userEvent.hover(col);
    await expect(canvas.getByText("78/gün")).toBeVisible();
    // Klavye: Tab grafiğe girer, oklar sütun değiştirir.
    await userEvent.click(canvas.getByRole("button", { name: /^Bugün:/ }));
    await userEvent.keyboard("{ArrowLeft}");
    await expect(canvas.getByRole("button", { name: /^Sal 17:/ })).toHaveFocus();
  },
};

export const TekSeri: Story = {
  name: "Tek Seri, Vurgusuz",
  args: { series: [SERIES[0]], data: DATA.map((d) => ({ label: d.label, values: [d.values[0] + 10] })), highlight: undefined, ticks: [0, 20, 40] },
};
