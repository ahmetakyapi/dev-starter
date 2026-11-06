import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PixelLoader } from "@/components/ui/pixel-loader";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Yükleme/Piksel Yükleyici",
  id: "pixel-loader",
  component: PixelLoader,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Nokta matrisinde dolaşan ışık: üretim süren yapay zekâ kartı, geliştirici aracı, oyun ekranı. Beş desen (dalga, sarmal, nabız, yılan, yağmur); nokta hiç kaybolmaz (en sönük %18, boy 0,7). `role=\"status\"` + gizli etiket, hareket azaltmada durağan dama.",
      },
    },
  },
  args: { pattern: "spiral", grid: 5, dot: 7, glow: true, label: "Görsel üretiliyor" },
  render: (args) => (
    <Frame width="sm">
      <div className="flex items-center justify-center gap-4 rounded-xl bg-overlay p-6 shadow-raised">
        <PixelLoader {...args} />
        <TextShimmer>Görsel üretiliyor…</TextShimmer>
      </div>
    </Frame>
  ),
} satisfies Meta<typeof PixelLoader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const Patterns: Story = {
  name: "Desenler",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      {(["wave", "spiral", "pulse", "snake", "rain"] as const).map((p) => (
        <Cell key={p} label={p}>
          <PixelLoader pattern={p} grid={5} dot={7} />
        </Cell>
      ))}
      <Cell label="3 × 3, satır içi">
        <span className="inline-flex items-center gap-2 text-small text-body">
          <PixelLoader grid={3} dot={4} /> Yükleniyor
        </span>
      </Cell>
    </Gallery>
  ),
};
