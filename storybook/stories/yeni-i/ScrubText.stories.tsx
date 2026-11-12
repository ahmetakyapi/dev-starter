import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ScrubText } from "@/components/ui/scrub-text";

const meta = {
  title: "Bileşenler/Tanıtım/Kaydırdıkça Koyulaşan Yazı",
  id: "scrub-text",
  component: ScrubText,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "fullscreen",
    docs: {
      story: { inline: false, height: "640px" },
      description: {
        component:
          "Paragraf soluk başlar, okur aşağı indikçe cümle cümle tam renge döner. Az seçenekli fiyatı tablo yerine iki cümleyle anlatmak için (gethoy.app turu). Metin gerçek metin, soluk hâli `text-muted` (AA); hareketi azaltan kullanıcıda bütün metin baştan tam renkte. `lead` baştan koyu gelen parça sayısı.",
      },
    },
  },
  args: {
    lead: 1,
    phrases: ["Pusula üç kişiye kadar ücretsiz.", "Ekip büyüyünce koltuk başına öde,", "yıllık alırsan iki ay bizden.", "Verini istediğin an dışa aktar."],
  },
  render: (args) => (
    <div className="bg-page px-4">
      <p className="grid h-[70svh] place-items-center text-read text-soft">Aşağı kaydır.</p>
      <div className="mx-auto max-w-3xl">
        <ScrubText {...args} className="font-display text-heading leading-snug font-semibold sm:text-display" />
      </div>
      <div className="h-[80svh]" />
    </div>
  ),
} satisfies Meta<typeof ScrubText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Fiyat Cümlesi" };
