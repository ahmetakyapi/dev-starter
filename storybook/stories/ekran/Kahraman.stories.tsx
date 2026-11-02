import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Hero } from "@/components/heroes";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { HERO_VARIANTS } from "@/lib/content";
import { DEFAULT_THEME } from "@/lib/theme";

const meta = {
  title: "Ekranlar/Açılış Sayfası/Kahraman",
  component: Hero,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Sekiz kahraman düzeni (`components/heroes/`), seçim `lib/content.ts` → `hero.variant`. Ürün arayüzü gösterilebiliyorsa `showcase` (varsayılan), mesaj yeterince güçlüyse `statement`, içerik sayfasında `minimal`. Başlık LCP öğesidir: Reveal'e sarılmaz, maske + transform ile açılır; parçacık sahnesi yalnızca hassas işaretçi, 768 px ve serbest harekette iner.",
      },
    },
  },
  args: { variant: "showcase" },
  argTypes: { variant: { control: "select", options: HERO_VARIANTS } },
  // Üst bilgiyle: kahramanın zemini başlığın altına uzanır (-4rem), sayfadaki gibi görünsün.
  render: (args) => (
    <div className="min-h-dvh bg-page text-body">
      <SiteHeader initialTheme={DEFAULT_THEME} />
      <main id="icerik">
        <Hero {...args} />
      </main>
    </div>
  ),
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = { name: "Showcase (Varsayılan)", args: { variant: "showcase" } };
export const EditorialSplit: Story = { name: "Editorial Split", args: { variant: "editorial-split" } };
export const Statement: Story = { name: "Statement", args: { variant: "statement" } };
export const ProductFrame: Story = { name: "Product Frame", args: { variant: "product-frame" } };
export const LiveData: Story = { name: "Live Data", args: { variant: "live-data" } };
export const Bento: Story = { name: "Bento", args: { variant: "bento" } };
export const Minimal: Story = { name: "Minimal", args: { variant: "minimal" } };
export const ScrollStage: Story = { name: "Scroll Stage", args: { variant: "scroll-stage" } };
