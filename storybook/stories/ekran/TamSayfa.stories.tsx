import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { HERO_VARIANTS } from "@/lib/content";
import { LandingPage } from "./_sayfa";

const meta = {
  title: "Ekranlar/Açılış Sayfası/Tam Sayfa",
  component: LandingPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Landing şablonunun ana sayfası, `app/page.tsx`teki sırayla: üst bilgi, kahraman, logolar, özellikler, nasıl çalışır, görüşler, fiyatlar, SSS, kapanış ve alt bilgi. Bütün metin `lib/content.ts`ten gelir; kahraman düzenini değiştirmek için `variant`ı seç (projede `hero.variant`, tek satır).",
      },
    },
  },
  args: { variant: "showcase" },
  argTypes: { variant: { control: "select", options: HERO_VARIANTS } },
} satisfies Meta<typeof LandingPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Sayfanın tek h1'i kahramanda; bölümler h2 ile sırada.
    await expect(canvas.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    await expect(canvas.getByRole("contentinfo")).toBeInTheDocument();
  },
};

