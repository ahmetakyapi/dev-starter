import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState, type ReactNode } from "react";
import { BlurIn } from "@/components/ui/blur-in";
import { Frame } from "../_lib/Frame";

/** Hikâyede yeniden oynatmak için: anahtar değişince öğe baştan kurulur, CSS animasyonu yeniden başlar. */
function Replay({ children }: { children: (key: number) => ReactNode }) {
  const [key, setKey] = useState(0);
  return (
    <div className="grid justify-items-center gap-6">
      {children(key)}
      <button type="button" onClick={() => setKey((k) => k + 1)} className="rounded-full bg-surface px-4 py-2 text-small font-medium text-strong shadow-raised">
        Yeniden Oynat
      </button>
    </div>
  );
}

const meta = {
  title: "Bileşenler/Tanıtım/Bulanıktan Netleşen Başlık",
  id: "blur-in",
  component: BlurIn,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Kahraman başlığının sözcükleri buğudan çıkıp sırayla yerine oturur. CSS animasyonu: ilk boyamayla başlar, JavaScript beklemez (LCP), JS kapalıyken de biter. `<em>` gibi öğeler bölünmez; serif başlıkta tek italik vurgu (editorial preset). Okunan kopya `sr-only` ve bütün halinde; sayfada yalnız bir tane.",
      },
    },
  },
  args: { children: "Pencereleri küçültmeden kaydır." },
  render: () => (
    <Frame width="xl">
      <Replay>
        {(key) => (
          <BlurIn key={key} as="h2" className="text-center font-[family-name:var(--font-serif-face),serif] text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.05] font-normal text-strong text-balance">
            Pencereleri <em>küçültmeden</em> kaydır.
          </BlurIn>
        )}
      </Replay>
    </Frame>
  ),
} satisfies Meta<typeof BlurIn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Serif Vurgulu" };

export const Block: Story = {
  name: "Tek Parça (by=block)",
  render: () => (
    <Frame width="lg">
      <Replay>
        {(key) => (
          <BlurIn key={key} as="p" by="block" duration={900} className="text-center text-heading font-semibold tracking-tight text-strong text-balance">
            Uzun bir başlık sözcük sözcük gelirse okuru bekletir; bütün halinde bir kez netleşsin.
          </BlurIn>
        )}
      </Replay>
    </Frame>
  ),
};
