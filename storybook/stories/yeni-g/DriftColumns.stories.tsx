import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DriftColumns } from "@/components/ui/drift-columns";
import { WALLPAPER_NAMES, WALLPAPER_SCENES, Wallpaper } from "@/components/ui/wallpaper";

const TILES = [...WALLPAPER_SCENES, ...WALLPAPER_SCENES];

const meta = {
  title: "Bileşenler/Tanıtım/Süzülen Sütunlar",
  id: "drift-columns",
  component: DriftColumns,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Görsel kartları dikey sütunlarda, komşu sütunlar zıt yönde ve farklı hızda sonsuz akar. Tek CSS animasyonu, sunucu bileşeni. Üzerine gelince ya da odak içerideyken sütun durur; hareketi azaltan kullanıcıda akış durur ve sütun kaydırılabilir olur. İkinci kopya `aria-hidden` + `inert`. Galeri ve portfolyo kahramanında süs olarak.",
      },
    },
  },
  args: { columns: 3, duration: 60, children: null },
  render: (args) => (
    <div className="mx-auto max-w-3xl p-6">
      <DriftColumns {...args} className="h-[32rem]">
        {TILES.map((s, i) => (
          <figure key={i} className="overflow-hidden rounded-xl ring-1 ring-line">
            <div className="aspect-[3/4]">
              <Wallpaper scene={s} />
            </div>
            <figcaption className="bg-overlay px-3 py-2 text-micro font-medium text-soft">{WALLPAPER_NAMES[s]}</figcaption>
          </figure>
        ))}
      </DriftColumns>
    </div>
  ),
} satisfies Meta<typeof DriftColumns>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Üç Sütun" };
export const Four: Story = { name: "Dört Sütun", args: { columns: 4, duration: 80 } };
