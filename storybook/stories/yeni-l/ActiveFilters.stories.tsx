import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ActiveFilters, type ActiveFilter } from "@/components/ui/active-filters";

const ALL: ActiveFilter[] = [
  { id: "status", label: "Durum", value: "Geciken" },
  { id: "region", label: "Bölge", value: "Kıyı" },
  { id: "kind", label: "Tür", value: "Ticarethane" },
];

function Demo() {
  const [filters, setFilters] = useState<ActiveFilter[]>(ALL);
  return (
    <div className="mx-auto max-w-2xl p-6">
      <ActiveFilters
        filters={filters}
        onRemove={(id) => setFilters((list) => list.filter((f) => f.id !== id))}
        onClear={() => setFilters([])}
        summary={`${filters.length === 0 ? 360 : 37 - filters.length * 8} fatura`}
      />
      {filters.length === 0 ? <p className="text-small text-muted">Etkin süzgeç yok: satır hiçbir şey çizmez.</p> : null}
    </div>
  );
}

const meta = {
  title: "Bileşenler/Gezinme/Etkin Süzgeçler",
  id: "active-filters",
  component: ActiveFilters,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Listenin üstünde \"şu an neye bakıyorum\" satırı: her etkin süzgeç kaldırılabilir bir çip, sonda tek \"Temizle\". Süzgeç yığını (açılır listeler, sekmeler) tek satıra iner, liste neden kısaldığı gözün önünde kalır. Süzgeç yoksa hiçbir şey çizmez. Kaldırılan çipten sonra odağı çağıran taşır. Edaş portalı UX denetiminden (süzgeç yığını).",
      },
    },
  },
  args: { filters: ALL },
  render: () => <Demo />,
} satisfies Meta<typeof ActiveFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Çipleri Kaldır ve Temizle",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Kaldır: Bölge, Kıyı" }));
    await expect(canvas.queryByText("Kıyı")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Temizle" }));
    await expect(canvas.queryByRole("group", { name: "Etkin Süzgeçler" })).not.toBeInTheDocument();
  },
};
