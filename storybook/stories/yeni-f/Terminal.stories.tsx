import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Terminal, type TerminalLine } from "@/components/ui/terminal";
import { Frame } from "../_lib/Frame";

const INSTALL: TerminalLine[] = [
  { kind: "comment", text: "bileşeni projeye al" },
  { kind: "command", text: "node ~/dev-starter/scripts/add-ui.mjs . terminal" },
  { kind: "output", text: "+ components/ui/terminal.tsx" },
  { kind: "output", text: "+ components/ui/copy-button.tsx (bağımlılık)" },
  { kind: "output", text: "✓ 2 dosya yazıldı, üzerine yazılan yok", tone: "success" },
  { kind: "command", text: "npm run build" },
  { kind: "output", text: "✓ Derleme tamam · 4,2 sn", tone: "success" },
];

const meta = {
  title: "Bileşenler/Hareket ve Doku/Terminal",
  id: "terminal",
  component: Terminal,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Komutların harf harf yazıldığı, çıktının satır satır geldiği pencere: tanıtım sayfasında kurulum akışı, belgede CLI örneği. Görünür olunca bir kez oynar, döngü yok; bitince “Yeniden Oynat”. Kopyala yalnız komutları alır. Ekran okuyucu dökümün tamamını tek seferde okur.",
      },
    },
  },
  args: { lines: INSTALL, title: "~/kahve-dukkani" },
  render: (args) => (
    <Frame width="lg">
      <Terminal {...args} />
    </Frame>
  ),
} satisfies Meta<typeof Terminal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const WithError: Story = {
  name: "Hata Çıktısı",
  args: {
    title: "geçiş",
    lines: [
      { kind: "command", text: "npm run db:migrate" },
      { kind: "output", text: "0007_siparis_notu.sql uygulanıyor…" },
      { kind: "output", text: "✗ \"orders\" tablosu kilitli, 30 sn sonra tekrar dene", tone: "danger" },
    ],
  },
};
