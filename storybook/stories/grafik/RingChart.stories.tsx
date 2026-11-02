import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";
import { expect, within } from "storybook/test";
import { ChartCard, ChartLegend } from "@/components/ui/chart-card";
import { RingChart } from "@/components/ui/ring-chart";
import { Gallery } from "../_lib/Frame";
import { Donem, GrafikHucre, Sahne } from "./_sahne";
import { TARAYICI, sayi, toplam } from "./_veri";

type Args = ComponentProps<typeof RingChart> & { halkaSayisi: number };

/** Ortadaki değer: en büyük halkanın payı. */
function Orta({ rings }: { rings: ComponentProps<typeof RingChart>["rings"] }) {
  const sum = toplam(rings.map((r) => r.value));
  const top = [...rings].sort((a, b) => b.value - a.value)[0];
  if (!top || sum === 0) return <span className="text-small text-muted">Veri yok</span>;
  return (
    <div>
      <p className="text-heading font-semibold tracking-tight text-strong tabular-nums">%{Math.round((top.value / sum) * 100)}</p>
      <p className="text-small text-muted">{top.label}</p>
    </div>
  );
}

const meta = {
  title: "Grafikler/Halka Grafiği",
  component: RingChart,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "2-5 kategorinin büyüklük sırası iç içe halkalarda; en büyüğü bile tam tur dönmez (`sweep`), çünkü burada bütün değil kıyas var. Kesin pay okunacaksa aşama çubukları daha dürüst. Renklerin açıklaması altındaki `ChartLegend` karolarında, sıra halkalarla aynı.",
      },
    },
  },
  args: {
    title: "Tarayıcıya Göre Ziyaretçi",
    rings: TARAYICI,
    sweep: 0.92,
    thickness: 9,
    gap: 4,
    halkaSayisi: 5,
  },
  argTypes: {
    rings: { control: "object" },
    children: { control: false },
    sweep: { control: { type: "range", min: 0.5, max: 1, step: 0.01 } },
    thickness: { control: { type: "range", min: 4, max: 16, step: 1 } },
    gap: { control: { type: "range", min: 0, max: 10, step: 1 } },
    halkaSayisi: { control: { type: "range", min: 1, max: 5, step: 1 }, description: "Gösterilen halka sayısı" },
  },
  render: ({ halkaSayisi, rings, ...args }) => {
    const shown = rings.slice(0, halkaSayisi);
    return (
      <Sahne>
        <ChartCard
          id="halka-kart"
          label="Ziyaretçi"
          value={sayi(toplam(shown.map((r) => r.value)))}
          change={5.2}
          changeLabel="geçen haftaya göre"
          action={<Donem />}
          footer={<ChartLegend className="px-1 pb-1" items={shown.map((r) => ({ ...r }))} />}
        >
          <RingChart {...args} rings={shown}>
            <Orta rings={shown} />
          </RingChart>
        </ChartCard>
      </Sahne>
    );
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("img", { name: "Tarayıcıya Göre Ziyaretçi" })).toBeInTheDocument();
    // Ortadaki değer en büyük halkanın payı: Chrome 275 / 925
    await expect(canvas.getByText("%30")).toBeInTheDocument();
  },
};

export const IkiHalka: Story = {
  name: "Az Veri (İki Halka)",
  args: {
    title: "Plan Dağılımı",
    rings: [
      { label: "Aylık Plan", value: 1840, series: 2 },
      { label: "Yıllık Plan", value: 1120, series: 3 },
    ],
    halkaSayisi: 2,
  },
};

export const SifirDeger: Story = {
  name: "Sıfır Değerli Kategori",
  args: {
    title: "Ödeme Yöntemi",
    rings: [
      { label: "Kredi Kartı", value: 3120, series: 2 },
      { label: "Havale", value: 640, series: 3 },
      { label: "Kapıda Ödeme", value: 0, series: 4 },
    ],
    halkaSayisi: 3,
  },
};

export const Bos: Story = {
  name: "Boş (Hepsi Sıfır)",
  args: {
    title: "Ödeme Yöntemi",
    rings: [
      { label: "Kredi Kartı", value: 0, series: 2 },
      { label: "Havale", value: 0, series: 3 },
    ],
    halkaSayisi: 2,
  },
};

export const InceHalka: Story = {
  name: "İnce, Tam Tura Yakın",
  args: { thickness: 5, gap: 3, sweep: 0.98 },
};

export const Telefon: Story = {
  name: "Telefon Genişliği",
  globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  render: () => (
    <Gallery cols={3}>
      {[
        { label: "Beş halka, varsayılan", n: 5, thickness: 9, gap: 4 },
        { label: "Üç halka, kalın", n: 3, thickness: 14, gap: 5 },
        { label: "İki halka, ince", n: 2, thickness: 6, gap: 3 },
      ].map((v) => {
        const rings = TARAYICI.slice(0, v.n);
        return (
          <GrafikHucre key={v.label} label={v.label}>
            <ChartCard id={`halka-${v.n}`} label={`Ziyaretçi · ${v.n} Kategori`} value={sayi(toplam(rings.map((r) => r.value)))}>
              <RingChart title={`Tarayıcıya göre ziyaretçi, ${v.n} kategori`} rings={rings} thickness={v.thickness} gap={v.gap}>
                <Orta rings={rings} />
              </RingChart>
            </ChartCard>
          </GrafikHucre>
        );
      })}
    </Gallery>
  ),
};
