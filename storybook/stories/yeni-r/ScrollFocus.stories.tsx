import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { ScrollFocus } from "@/components/ui/scroll-focus";
import { ShotCard } from "@/components/ui/shot-card";
import { WORKS } from "./_akis";

const meta = {
  title: "Bileşenler/Hareket ve Doku/Kaydırma Odağı",
  id: "scroll-focus",
  component: ScrollFocus,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Öğe ekranın altından yükselirken buğudan netleşir: saydamlık .34→1, bulanıklık 8px→0, kayma 18px→0, ölçek 1.012→1 (`title`: .2→1, 10px, 14px). Kaydırma konumuna bağlı, geri kaydırınca geri sarar. Sunucu bileşeni: CSS `animation-timeline: view()`; desteklemeyen tarayıcıda ve hareket azaltmada içerik düz ve tam görünür. Kahramana ve gövde metnine verilmez. Sakin Akış turundan (yalnız davranış).",
      },
    },
  },
  args: { children: null },
  render: () => (
    <div className="mx-auto grid max-w-2xl gap-16 px-4 py-[40vh]">
      <ScrollFocus variant="title" as="h2" className="text-title font-medium text-strong">
        Son İşler
      </ScrollFocus>
      {WORKS.slice(0, 4).map((w) => {
        const Scene = w.scene;
        return (
          <ScrollFocus key={w.id}>
            <ShotCard title={w.title} description={w.description} meta={w.meta}>
              <Scene />
            </ShotCard>
          </ScrollFocus>
        );
      })}
    </div>
  ),
} satisfies Meta<typeof ScrollFocus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // İçerik DOM'da hep tam: geçiş yalnız görsel.
    await expect(canvas.getByRole("heading", { level: 2, name: "Son İşler" })).toBeInTheDocument();
    await expect(canvas.getAllByRole("article")).toHaveLength(4);
  },
};
