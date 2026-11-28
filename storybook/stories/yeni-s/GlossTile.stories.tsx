import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarDays, ChartPie, CreditCard, Landmark, PiggyBank, Receipt, ShieldCheck, Wallet } from "lucide-react";
import { expect, within } from "storybook/test";
import { GlossArc, GlossTile, type GlossTone } from "@/components/ui/gloss-tile";

const TONES: GlossTone[] = ["primary", "chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6", "success", "warning", "danger", "neutral"];

const ARC = [
  { icon: Wallet, tone: "primary" },
  { icon: PiggyBank, tone: "chart-6" },
  { icon: CreditCard, tone: "chart-3" },
  { icon: Receipt, tone: "warning" },
  { icon: Landmark, tone: "chart-2" },
  { icon: ChartPie, tone: "chart-4" },
  { icon: ShieldCheck, tone: "success" },
] as const;

const meta = {
  title: "Bileşenler/Tanıtım/Parlak Karo",
  id: "gloss-tile",
  component: GlossTile,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Yumuşak 3B ikon karosu: tonun `color-mix` türeviyle üstten açık alta koyu dolgu, üst yarıda parlama elipsi, iç gölge ve tonun renginde dış hale; ortada beyaz lucide ikonu. Boyut 32/44/56/72 piksel. `GlossArc` karoları bir yay boyunca, açısına göre döndürülmüş dizer; `drift` ile yavaşça döner (görünüm dışında çizilmez, hareketi azaltanda durur). Varsayılan süs; `label` ile `role=\"img\"`. Sunucu bileşeni. Manzara turundan (yalnız davranış ve yapı).",
      },
    },
  },
  args: { icon: Wallet, tone: "primary", size: "xl", label: "Cüzdan" },
} satisfies Meta<typeof GlossTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("img", { name: "Cüzdan" })).toBeVisible();
  },
};

export const Tones: Story = {
  name: "Tonlar ve Boyutlar",
  render: () => (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        {TONES.map((tone) => (
          <GlossTile key={tone} icon={CalendarDays} tone={tone} size="lg" />
        ))}
      </div>
      <div className="flex items-end gap-4">
        <GlossTile icon={PiggyBank} tone="chart-6" size="sm" />
        <GlossTile icon={PiggyBank} tone="chart-6" size="md" />
        <GlossTile icon={PiggyBank} tone="chart-6" size="lg" />
        <GlossTile icon={PiggyBank} tone="chart-6" size="xl" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryAllByRole("img")).toHaveLength(0);
    await expect(canvasElement.querySelectorAll('.ui-gloss[aria-hidden="true"]')).toHaveLength(TONES.length + 4);
  },
};

export const InFeature: Story = {
  name: "Özellik Kartının Başında",
  render: () => (
    <article className="w-[min(100vw-2rem,22rem)] rounded-xl bg-surface p-6">
      <GlossTile icon={<ShieldCheck strokeWidth={2.25} />} tone="success" size="lg" />
      <h3 className="mt-4 text-title font-semibold text-strong">Harcama Sınırı</h3>
      <p className="mt-1.5 text-base text-body">Kategori başına aylık tavan koy; yaklaşınca haber verelim.</p>
    </article>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Harcama Sınırı" })).toBeVisible();
  },
};

export const Arc: Story = {
  name: "Yay Şeridi, Kayan",
  render: () => (
    <div className="grid w-[min(100vw-2rem,48rem)] grid-cols-1 justify-items-center gap-2 rounded-xl bg-surface pt-6 pb-8">
      <GlossArc tiles={ARC} count={7} radius={360} arc={96} size="lg" drift label="Bütçe, birikim, kart ve rapor araçları" />
      <p className="text-lead font-semibold text-strong">Paran Tek Yerde</p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("img", { name: /Bütçe, birikim/ })).toBeVisible();
  },
};

export const StaticArc: Story = {
  name: "Yay Şeridi, Durağan",
  render: () => <GlossArc tiles={ARC} radius={240} arc={120} size="md" />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector(".ui-gloss-arc")).toHaveAttribute("aria-hidden", "true");
    await expect(canvasElement.querySelectorAll(".ui-gloss-slot")).toHaveLength(ARC.length);
  },
};
