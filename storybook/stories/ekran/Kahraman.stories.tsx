import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Hero } from "@/components/heroes";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { HERO_VARIANTS } from "@/lib/content";
import { DEFAULT_THEME } from "@/lib/theme";

const meta = {
  title: "Ekranlar/Açılış Sayfası/Üst Bölüm Varyantları",
  id: "landing-hero",
  component: Hero,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "On iki kahraman düzeni (`components/heroes/`), seçim `lib/content.ts` → `hero.variant`. Ürün arayüzü gösterilebiliyorsa `showcase` (varsayılan: iki tonlu başlık, alta solan canlı pano ve iki kenar notu), mesaj yeterince güçlüyse `statement`, içerik sayfasında `minimal`. Yeni dört düzen (görsel zeminli): `atmosphere`, `floating`, `horizon`, `corner`. Başlık LCP öğesidir: Reveal'e sarılmaz, maske + transform ile açılır; parçacık sahnesi yalnızca hassas işaretçi, 768 px ve serbest harekette iner.",
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

export const Showcase: Story = { name: "Vitrin (Varsayılan)", args: { variant: "showcase" } };
export const EditorialSplit: Story = { name: "İkiye Bölünmüş", args: { variant: "editorial-split" } };
export const Statement: Story = { name: "Tek Cümle", args: { variant: "statement" } };
export const ProductFrame: Story = { name: "Ürün Çerçevesi", args: { variant: "product-frame" } };
export const LiveData: Story = { name: "Canlı Veri", args: { variant: "live-data" } };
export const Bento: Story = { name: "Bento Düzeni", args: { variant: "bento" } };
export const Minimal: Story = { name: "Sade", args: { variant: "minimal" } };
export const ScrollStage: Story = { name: "Kaydırmalı Sahne", args: { variant: "scroll-stage" } };
export const Atmosphere: Story = { name: "Atmosfer", args: { variant: "atmosphere" } };
export const Floating: Story = { name: "Süzülen Kartlar", args: { variant: "floating" } };
export const Horizon: Story = { name: "Ufuk", args: { variant: "horizon" } };
export const Corner: Story = { name: "Köşe Etiketi", args: { variant: "corner" } };
export const Calm: Story = { name: "Sakin Akış", args: { variant: "calm" } };
