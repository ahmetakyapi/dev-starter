import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ScrambleText } from "@/components/ui/scramble-text";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Hareket ve Doku/Çözülen Metin",
  id: "scramble-text",
  component: ScrambleText,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Harfler rastgele karakterlerden geçerek soldan sağa yerine oturur. Kısa display metninde bir kez: kahraman satırı, “Bağlantı kuruldu” anı. Gövde metninde kullanma. Eşit enli yazıyla (`font-mono`) satır hiç kımıldamaz; ekran okuyucu yalnız gerçek metni okur.",
      },
    },
  },
  args: { text: "Bağlantı kuruldu", trigger: "mount", className: "font-mono text-title text-strong" },
  render: (args) => (
    <Frame width="sm">
      <div className="grid justify-items-center">
        <ScrambleText {...args} />
      </div>
    </Frame>
  ),
} satisfies Meta<typeof ScrambleText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const Triggers: Story = {
  name: "Tetikler",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Görünür olunca">
        <ScrambleText text="SÜRÜM 4.0" className="font-mono text-title font-semibold text-strong" />
      </Cell>
      <Cell label="Üzerine gelince ve odakta">
        <button type="button" className="min-h-11 rounded-sm font-mono text-base text-primary-ink underline-offset-4 hover:underline">
          <ScrambleText text="Değişiklik günlüğü" trigger="hover" />
        </button>
      </Cell>
      <Cell label="Uzun süre (1,6 sn)">
        <ScrambleText text="Anahtar doğrulandı" trigger="mount" duration={1600} className="font-mono text-base text-success" />
      </Cell>
    </Gallery>
  ),
};
