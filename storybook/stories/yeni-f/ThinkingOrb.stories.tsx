import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useState } from "react";
import { ThinkingOrb, type OrbState } from "@/components/ui/thinking-orb";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Yapay Zekâ/Düşünme Küresi",
  id: "thinking-orb",
  component: ThinkingOrb,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Asistanın durumunu gösteren canlı küre: bekliyor, düşünüyor, konuşuyor (`level` ile ses düzeyi). İçinde paletin birincil ailesinden üç bulanık leke döner; palet değişince küre de döner. Bilgi metinde: `label` verilirse `role=\"status\"`.",
      },
    },
  },
  args: { state: "thinking", size: 120, label: "Asistan düşünüyor" },
} satisfies Meta<typeof ThinkingOrb>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATES = [
  { value: "idle", label: "Bekliyor" },
  { value: "thinking", label: "Düşünüyor" },
  { value: "speaking", label: "Konuşuyor" },
] as const;

function Voice() {
  const [state, setState] = useState<OrbState>("thinking");
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (state !== "speaking") return;
    const id = window.setInterval(() => setLevel(0.25 + Math.abs(Math.sin(Date.now() / 260)) * 0.7), 120);
    return () => window.clearInterval(id);
  }, [state]);
  const label = STATES.find((s) => s.value === state)!.label;
  return (
    <Frame width="sm">
      <div className="grid justify-items-center gap-6 py-4">
        <ThinkingOrb state={state} level={level} size={140} label={`Asistan: ${label}`} />
        <SegmentedControl aria-label="Durum" options={STATES} value={state} onValueChange={setState} />
      </div>
    </Frame>
  );
}

export const Default: Story = { name: "Varsayılan", render: () => <Voice /> };

export const Sizes: Story = {
  name: "Boyutlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={4}>
      <Cell label="24 · satır içi">
        <span className="inline-flex items-center gap-2 text-small text-body">
          <ThinkingOrb state="thinking" size={24} /> Düşünüyor
        </span>
      </Cell>
      <Cell label="48 · avatar">
        <ThinkingOrb size={48} />
      </Cell>
      <Cell label="96 · boş durum">
        <ThinkingOrb state="thinking" size={96} />
      </Cell>
      <Cell label="160 · sesli asistan">
        <ThinkingOrb state="speaking" level={0.6} size={160} />
      </Cell>
    </Gallery>
  ),
};
