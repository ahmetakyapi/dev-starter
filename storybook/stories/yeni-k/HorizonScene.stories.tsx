import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Inbox, ListChecks } from "lucide-react";
import { expect, within } from "storybook/test";
import { AppWindow } from "@/components/ui/app-window";
import { HorizonScene } from "@/components/ui/horizon-scene";
import { Wallpaper } from "@/components/ui/wallpaper";

const meta = {
  title: "Bileşenler/Tanıtım/Ufuk Sahnesi",
  id: "horizon-scene",
  component: HorizonScene,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "fullscreen",
    docs: {
      story: { inline: false, height: "620px" },
      description: {
        component:
          "Kahraman bölümünde ürün çerçevesi arkada kısmen görünür, önüne manzara biner ve aşağı doğru sayfa zeminine solar. Solma sabit renge değil `mask-image`e bağlı: sayfa zemini ne ise (açık, koyu, palet) o görünür. `peek` çerçevenin görünen payını, `fade` solma uzunluğunu ayarlar. Çerçeve ve manzara süstür (`aria-hidden`). StatiQ referans turundan (yalnız yapı; manzara token'lı `Wallpaper`).",
      },
    },
  },
  args: { peek: "md", fade: "md", frame: null, scene: null, children: null },
  argTypes: { peek: { control: "inline-radio", options: ["sm", "md", "lg"] }, fade: { control: "inline-radio", options: ["md", "lg"] } },
  render: (args) => (
    <div className="min-h-dvh bg-page text-body">
      <HorizonScene
        {...args}
        scene={<Wallpaper scene="dunes" className="size-full" />}
        frame={
          <AppWindow title="Pusula · Gelen Kutusu" icon={<Inbox />} focused className="mx-auto">
            <div className="grid gap-2 p-4 sm:grid-cols-2">
              {["Teslimat gecikti", "İade talebi", "Fiyat sorusu", "Fatura düzeltme"].map((t) => (
                <div key={t} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2.5 text-base text-strong">
                  <ListChecks className="size-4 text-muted" aria-hidden />
                  {t}
                </div>
              ))}
            </div>
          </AppWindow>
        }
      >
        <h1 className="font-display text-hero tracking-tight text-strong">Destek, sakin ve düzenli.</h1>
        <p className="mx-auto mt-4 max-w-xl text-lead text-soft">Talepler, görevler ve takvim tek ekranda.</p>
      </HorizonScene>
    </div>
  ),
} satisfies Meta<typeof HorizonScene>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Kum Tepeleri",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1 })).toBeInTheDocument();
    await expect(canvasElement.querySelector("[data-wallpaper]")).toBeTruthy();
  },
};

export const MorePeek: Story = { name: "Çerçeve Daha Görünür", args: { peek: "lg", fade: "lg" } };
