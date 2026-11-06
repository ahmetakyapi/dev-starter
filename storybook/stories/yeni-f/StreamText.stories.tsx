import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useState } from "react";
import { StreamText } from "@/components/ui/stream-text";
import { Frame } from "../_lib/Frame";

const TEXT =
  "Kasım siparişleri ekimden %12 fazla. Artışın çoğu abonelikten geliyor: yeni 38 abonenin 21'i deneme paketiyle başladı. Toptan tarafı yatay; iki kafe siparişi aralığa kaydı.";

const meta = {
  title: "Bileşenler/Yapay Zekâ/Akan Metin",
  id: "stream-text",
  component: StreamText,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Modelin parça parça gelen yanıtı: yalnız yeni gelen sözcükler belirir (solma ya da bulanıktan netleşme), önceki metin kıpırdamaz. Akarken sonda imleç ve kapta `aria-busy`; mesaj listesi bitince okutur. Hareket azaltmada sözcükler doğrudan çizilir.",
      },
    },
  },
  args: { text: TEXT, streaming: false },
} satisfies Meta<typeof StreamText>;

export default meta;
type Story = StoryObj<typeof meta>;

function Live({ effect }: { effect: "fade" | "blur" }) {
  const [n, setN] = useState(0);
  const words = TEXT.split(" ");
  useEffect(() => {
    if (n >= words.length) return;
    // Model parçaları düzensiz gelir: bazen tek sözcük, bazen üç.
    const id = window.setTimeout(() => setN((v) => Math.min(words.length, v + 1 + (v % 3))), 110 + (n % 4) * 40);
    return () => window.clearTimeout(id);
  }, [n, words.length]);
  return (
    <Frame width="md">
      <StreamText text={words.slice(0, n).join(" ")} streaming={n < words.length} effect={effect} className="min-h-24 text-read text-strong" />
    </Frame>
  );
}

export const Default: Story = { name: "Varsayılan", render: () => <Live effect="blur" /> };
export const Fade: Story = { name: "Yalnız Solma", render: () => <Live effect="fade" /> };
