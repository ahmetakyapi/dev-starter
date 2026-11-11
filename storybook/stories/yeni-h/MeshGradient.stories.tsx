import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MeshGradient } from "@/components/ui/mesh-gradient";

const meta = {
  title: "Bileşenler/Tanıtım/Hareketli Renk Zemini",
  id: "mesh-gradient",
  component: MeshGradient,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Kahramanın ya da kapanış eyleminin arkasında dört bulanık leke çok yavaş süzülür. Renk paletin birincil ailesinden (`primary`) ya da metin + zemin karışımından (`neutral`); on palet × iki temada kendiliğinden döner. `grain` film greni, `halftone` nokta ekranı, `scrim` içeriğin arkasına yumuşak örtü. Yalnız `transform`; görünümden çıkınca durur, hareketi azaltan kullanıcıda hiç oynamaz. scrolltide.co turundan (shader yerine CSS).",
      },
    },
  },
  args: { tone: "primary", texture: "grain", scrim: true },
  render: (args) => (
    <div className="mx-auto max-w-4xl p-6">
      <MeshGradient {...args} className="grid min-h-80 place-items-center rounded-2xl px-6 py-20 text-center">
        <div className="grid gap-3">
          <h2 className="font-display text-display font-bold text-balance text-strong sm:text-hero">İlk Talebi Bugün Yanıtla</h2>
          <p className="text-read text-soft">Zemin paletle döner; metin her temada okunur.</p>
        </div>
      </MeshGradient>
    </div>
  ),
} satisfies Meta<typeof MeshGradient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Birincil, Grenli" };
export const Neutral: Story = { name: "Nötr", args: { tone: "neutral", texture: "none", scrim: false } };
export const Vivid: Story = { name: "Canlı", args: { intensity: "vivid", texture: "none" } };
export const Halftone: Story = { name: "Nokta Ekranı", args: { texture: "halftone", scrim: true } };
