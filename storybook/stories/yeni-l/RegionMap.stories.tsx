import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { RegionMap, type MapRegion } from "@/components/ui/region-map";
import { MAP_SHAPES, MAP_VIEWBOX } from "../edas/_harita";

const NAMES: Record<string, string> = { yayla: "Yayla", ova: "Ova", vadi: "Vadi", merkez: "Merkez", sanayi: "Sanayi", kiyi: "Kıyı" };
/** Kayıp-kaçak yüzdesi ve hedef (ÖRNEK veri). */
const LOSS: Record<string, [number, number]> = { yayla: [13.6, 12], ova: [10.8, 10], vadi: [8.2, 9], merkez: [6.4, 7], sanayi: [5.9, 5], kiyi: [8.9, 8] };

const regions: MapRegion[] = MAP_SHAPES.map((s) => {
  const [value, target] = LOSS[s.id];
  return { id: s.id, label: NAMES[s.id], path: s.path, at: s.at, value, note: `hedef %${target}`, tone: value > target ? "danger" : undefined };
});

const pct = (v: number) => `%${v.toFixed(1).replace(".", ",")}`;

function Demo() {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-xl p-6">
      <RegionMap title="Bölgeye göre kayıp/kaçak" regions={regions} viewBox={MAP_VIEWBOX} format={pct} legend={["Düşük kayıp", "Yüksek kayıp"]} selectedId={sel} onSelect={setSel} />
      <p className="mt-3 text-small text-muted">Seçili: {sel ? NAMES[sel] : "yok"}</p>
    </div>
  );
}

const meta = {
  title: "Grafikler/Bölge Haritası",
  id: "region-map",
  component: RegionMap,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Bölgeye göre dağılım şematik SVG haritada: renk değer ölçeğinden ya da açık durum tonundan (hedefi aşan bölge kırmızı + çizgili kenar). Gerçek coğrafya değil, çağıran stilize poligonlarını verir (sınır dosyası ya da harita sağlayıcısı yok). Balon yalnız ince işaretçide; bölge seçilebilir buton; asıl veri `sr-only` tabloda. Edaş portalının kayıp/kaçak haritası (Kuzeyova, ÖRNEK veri).",
      },
    },
  },
  args: { title: "Bölgeye göre kayıp/kaçak", regions, viewBox: MAP_VIEWBOX, format: pct },
  render: () => <Demo />,
} satisfies Meta<typeof RegionMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Kayıp/Kaçak Haritası",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^Yayla: %13,6/ }));
    await expect(canvas.getByRole("button", { name: /^Yayla/ })).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByText("Seçili: Yayla")).toBeInTheDocument();
  },
};
