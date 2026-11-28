import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";
import { EdgeBlur } from "@/components/ui/edge-blur";
import { Wallpaper, type WallpaperScene } from "@/components/ui/wallpaper";

const SCENES: { scene: WallpaperScene; name: string }[] = [
  { scene: "sunset", name: "Gün Batımı Koyu" },
  { scene: "dunes", name: "Kum Tepeleri" },
  { scene: "lagoon", name: "Lagün Kıyısı" },
  { scene: "alpine", name: "Yayla Evi" },
  { scene: "aurora", name: "Kuzey Işığı" },
  { scene: "silk", name: "İpek Yolu Hanı" },
  { scene: "mesh", name: "Bağ Evi" },
  { scene: "paper", name: "Taş Mahalle" },
];

function Tile({ scene, name }: { scene: WallpaperScene; name: string }) {
  return (
    <figure className="m-0 overflow-hidden rounded-lg bg-surface">
      <Wallpaper scene={scene} className="aspect-[4/3] w-full" />
      <figcaption className="px-3 py-2 text-base font-medium text-strong">{name}</figcaption>
    </figure>
  );
}

const meta = {
  title: "Bileşenler/Tanıtım/Kenar Buğusu",
  id: "edge-blur",
  component: EdgeBlur,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Yatay kayan şeridin iki kenarında kademeli buğu: kenara yaklaştıkça artan `backdrop-filter` katmanları (maske dilimli) ve hafif zemin solması. `scrollable` çocukları kendi listesine koyar, kenarları kaydırma konumuna göre IntersectionObserver ile ayrı ayrı gösterir. Desteksiz tarayıcıda ve saydamlığı azaltan kullanıcıda yalnız solma. Manzara turundan (yalnız davranış ve yapı).",
      },
    },
  },
  args: {
    scrollable: true,
    label: "Öne çıkan konaklamalar",
    itemClassName: "w-64",
    listClassName: "gap-4 py-1",
    children: null,
  },
  render: (args) => (
    <div className="mx-auto w-full max-w-4xl">
      <EdgeBlur {...args}>
        {SCENES.map((s) => (
          <Tile key={s.scene} {...s} />
        ))}
      </EdgeBlur>
    </div>
  ),
} satisfies Meta<typeof EdgeBlur>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Kendi Kaydırıcısıyla",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region", { name: "Öne çıkan konaklamalar" });
    await expect(region).toHaveAttribute("tabindex", "0");
    await expect(within(region).getAllByRole("listitem")).toHaveLength(SCENES.length);

    const sides = canvasElement.querySelectorAll<HTMLElement>(".ui-edge-side");
    await expect(sides).toHaveLength(2);
    // Başlangıçta en solda: sol buğu gizli, sağ görünür.
    await waitFor(() => expect(sides[0]).toHaveAttribute("data-hidden", "true"));
    await expect(sides[1]).toHaveAttribute("data-hidden", "false");

    region.scrollLeft = region.scrollWidth;
    await waitFor(() => expect(sides[0]).toHaveAttribute("data-hidden", "false"));
    await waitFor(() => expect(sides[1]).toHaveAttribute("data-hidden", "true"));
  },
};

export const Wrapped: Story = {
  name: "Hazır Şeridi Sarar",
  args: { scrollable: false, size: "6rem", strength: 12, layers: 3 },
  render: (args) => (
    <div className="mx-auto w-full max-w-4xl">
      <EdgeBlur {...args}>
        <div className="flex gap-4 overflow-hidden py-1">
          {SCENES.slice(0, 5).map((s) => (
            <div key={s.scene} className="w-56 shrink-0">
              <Tile {...s} />
            </div>
          ))}
        </div>
      </EdgeBlur>
    </div>
  ),
};
