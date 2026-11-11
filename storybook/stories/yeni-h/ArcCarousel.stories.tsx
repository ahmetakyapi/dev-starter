import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArcCarousel } from "@/components/ui/arc-carousel";
import { WALLPAPER_NAMES, WALLPAPER_SCENES, Wallpaper } from "@/components/ui/wallpaper";

const ITEMS = WALLPAPER_SCENES.map((scene, i) => ({
  id: scene,
  title: WALLPAPER_NAMES[scene],
  meta: `Duvar Kâğıdı · ${i + 1}. Sahne`,
  href: `#${scene}`,
  media: <Wallpaper scene={scene} />,
}));

const meta = {
  title: "Bileşenler/Tanıtım/Kavisli Galeri",
  id: "arc-carousel",
  component: ArcCarousel,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Kartlar büyük bir çemberin üst yayına dizilir: ortadaki dik ve tam parlak, kenara doğru eğilir, küçülür, söner. Dönüş dış katmanda (merkez çemberin altında), küçülme iç katmanda (kartın kendi ortası). Oklar, ←/→, Home/End, yan karta tıklama ve yatay sürükleme; tekerlek dinlenmez, kendiliğinden dönmez. Değişim \"3 / 8: Ad\" diye okunur. scrolltide.co turundan (WebGL yerine CSS dönüşümü).",
      },
    },
  },
  args: { items: ITEMS, label: "Duvar Kâğıtları", visible: 3 },
  render: (args) => (
    <div className="mx-auto max-w-5xl p-6">
      <ArcCarousel {...args} />
    </div>
  ),
} satisfies Meta<typeof ArcCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Sekiz Sahne" };
export const Narrow: Story = { name: "İki Yan", args: { visible: 2, initialIndex: 0 } };
