import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, Bell, Heart, RefreshCw, Send, Trash2 } from "lucide-react";
import { AnimatedIcon, type IconMotion } from "@/components/ui/animated-icon";
import { Button } from "@/components/ui/Button";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Düğme ve İkon/Canlı İkon",
  id: "animated-icon",
  component: AnimatedIcon,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Düğmenin üzerine gelince (ve klavye odağında) ikon anlamına uygun küçük bir hareket yapar: zil sallanır, ok dürter, yenile döner. Düğmeye `group` sınıfı ver. Hover yalnız ince işaretçide; hareket azaltmada hiç oynamaz. Saf CSS.",
      },
    },
  },
  args: { icon: Bell, motion: "ring" },
  render: () => (
    <Frame width="sm">
      <div className="flex flex-wrap justify-center gap-3">
        <Button className="group">
          Devam Et <AnimatedIcon icon={ArrowRight} motion="nudge" />
        </Button>
        <Button variant="secondary" className="group">
          <AnimatedIcon icon={Bell} motion="ring" /> Bildirimler
        </Button>
      </div>
    </Frame>
  ),
} satisfies Meta<typeof AnimatedIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

const ROWS: { icon: typeof Bell; motion: IconMotion; label: string }[] = [
  { icon: ArrowRight, motion: "nudge", label: "Devam Et" },
  { icon: Bell, motion: "ring", label: "Bildirimler" },
  { icon: RefreshCw, motion: "spin", label: "Yenile" },
  { icon: Heart, motion: "pop", label: "Beğen" },
  { icon: Send, motion: "bounce", label: "Gönder" },
  { icon: Trash2, motion: "wiggle", label: "Sil" },
];

export const Motions: Story = {
  name: "Hareketler",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      {ROWS.map((r) => (
        <Cell key={r.motion} label={`${r.motion}: üzerine gel`}>
          <Button variant="secondary" className="group">
            <AnimatedIcon icon={r.icon} motion={r.motion} /> {r.label}
          </Button>
        </Cell>
      ))}
      <Cell label="Sürekli: senkronize ediliyor">
        <span className="inline-flex items-center gap-2 text-small text-body">
          <AnimatedIcon icon={RefreshCw} motion="spin" trigger="always" loop size={16} /> Senkronize ediliyor
        </span>
      </Cell>
    </Gallery>
  ),
};
