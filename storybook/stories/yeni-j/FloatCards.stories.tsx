import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FloatCard, FloatCards } from "@/components/ui/float-cards";
import { ToneText } from "@/components/ui/tone-text";

const meta = {
  title: "Bileşenler/Tanıtım/Süzülen Kartlar",
  id: "float-cards",
  component: FloatCards,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "fullscreen",
    docs: {
      story: { inline: false, height: "520px" },
      description: {
        component:
          "Ortadaki başlığın çevresine dağılmış, hafif döndürülmüş, kenara taşan kartlar. `FloatCards` taşanı kesen sahne kabı; `FloatCard` mutlak konumlu (`at`: kenardan uzaklık, negatif değer dışarı taşırır; `rotate`, `depth` 0-2, `lift`/`duration`/`delay` süzülme). Kartlar süstür: `aria-hidden`, `pointer-events: none`, telefonda (`md` altı) gizlenir; içlerindeki bilgi sayfanın başka yerinde de olmalı. Hareketi azaltanda durur. Socialscale kahramanı referans turundan.",
      },
    },
  },
  args: { children: null },
  render: () => (
    <FloatCards className="min-h-[32rem] bg-page">
      <FloatCard at={{ left: "-3%", top: "10%" }} rotate={-5} depth={1} className="w-60">
        <p className="text-small text-muted">Kampanya Durumu</p>
        <p className="mt-1 text-read font-semibold text-strong">Bahar Lansmanı</p>
      </FloatCard>
      <FloatCard at={{ right: "-3%", top: "6%" }} rotate={4} depth={2} delay={2} className="w-64">
        <p className="text-small text-muted">Toplam Satış</p>
        <p className="mt-1 text-heading font-semibold text-strong tabular-nums">₺24.780</p>
      </FloatCard>
      <FloatCard at={{ left: "6%", bottom: "8%" }} rotate={3} depth={0} delay={4} className="w-60">
        <p className="text-small text-muted">İçerik İsteği</p>
        <p className="mt-1 text-base text-strong">Sabah rutininde serum videosu</p>
      </FloatCard>
      <FloatCard at={{ right: "5%", bottom: "6%" }} rotate={-4} depth={1} delay={3} className="w-60">
        <p className="text-small text-muted">İş Birliği Talebi</p>
        <p className="mt-1 text-base text-strong">Yüksek öncelik</p>
      </FloatCard>
      <div className="relative z-10 mx-auto grid min-h-[32rem] max-w-2xl place-items-center px-6 text-center">
        <ToneText as="h1" className="text-hero">
          Sosyal ticaretin <ToneText.Soft>işletim sistemi</ToneText.Soft>
        </ToneText>
      </div>
    </FloatCards>
  ),
} satisfies Meta<typeof FloatCards>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Kahraman Sahnesi" };
