import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Download, Sparkles } from "lucide-react";
import { LiquidGlass, LiquidGlassButton, LiquidGlassLink } from "@/components/ui/liquid-glass";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { Media } from "./_media";

const meta = {
  title: "Bileşenler/Tanıtım/Sıvı Cam",
  id: "liquid-glass",
  component: LiquidGlassLink,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Arkasındaki görüntüyü büken, kenarı ışık kıran cam hap. Fotoğraflı ya da çizimli kahramanın tek birincil eylemi için; düz zeminde bükülecek bir şey olmadığından `bg-cta` doğru düğmedir. Bükülme SVG `feDisplacementMap` ile ve yalnız Chromium'da; Safari ve Firefox'ta buğu ve kenar kalır, hiçbir yerde kırılmaz.",
      },
    },
  },
  render: () => (
    <Frame width="xl">
      <Media className="w-full">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <LiquidGlassLink href="/indir/serit.dmg" download tone="media" className="h-12 px-7">
            <Download aria-hidden className="size-4" /> Mac İçin İndir
          </LiquidGlassLink>
          <LiquidGlass tone="media">Erken fiyat · 10 kişilik</LiquidGlass>
        </div>
      </Media>
    </Frame>
  ),
} satisfies Meta<typeof LiquidGlassLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Görsel Zemin Üstünde" };

export const Strength: Story = {
  name: "Bükülme Gücü",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      {[30, 60, 100].map((s) => (
        <Cell key={s} label={`strength={${s}}`}>
          <Media className="min-h-48 w-full p-6">
            <LiquidGlassButton tone="media" strength={s}>
              <Sparkles aria-hidden className="size-4" /> Dene
            </LiquidGlassButton>
          </Media>
        </Cell>
      ))}
    </Gallery>
  ),
};

export const Auto: Story = {
  name: "Tema Tonu (auto)",
  render: () => (
    <Frame>
      <LiquidGlassButton>Düz zeminde: yalnız kenar ve buğu</LiquidGlassButton>
    </Frame>
  ),
};
