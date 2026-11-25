import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bot, Boxes, Grid3x3, Server } from "lucide-react";
import { expect, within } from "storybook/test";
import { SignalHub } from "@/components/ui/signal-hub";

const meta = {
  title: "Bileşenler/Yapay Zeka/Sinyal Göbeği",
  id: "signal-hub",
  component: SignalHub,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Ortada ürünün işareti, ondan dirsekli çizgilerle bağlanan 2-3 çalışma kartı (ad, durum, parçalı ilerleme, alt satır) ve çevrede süzülen \"yapıldı\" çipleri. Yapay zeka ürününün arka planda ne yaptığını tek bakışta anlatır. Çizgiler görünüme girince bir kez çizilir; hareketi azaltan kullanıcıda durağan. Telefonda çipler kartların altında liste olur. Veridical ve Xenora referansından (yalnız yapı; veri ÖRNEK).",
      },
    },
  },
  args: {
    label: "Ajanların çalışma durumu (örnek)",
    mark: <Grid3x3 />,
    nodes: [
      { id: "a", name: "Pusula Projesi", status: "Etkin", progress: 0.25, detail: "4 adımın 1'i tamam", icon: <Boxes /> },
      { id: "b", name: "API Servisleri", status: "Etkin", progress: 0.8, segments: 5, detail: "8.096 / 10.000 çağrı kotası", icon: <Server /> },
      { id: "c", name: "Analist v1.2", status: "Etkin", progress: 0.75, detail: "%98 doğruluk · 5.490 iş", icon: <Bot /> },
    ],
    done: ["2 araştırma özeti yazıldı", "12 tasarım belgesi üretildi", "Sonuç Slack'e gönderildi", "90 kod parçası doğrulandı"],
  },
  render: (args) => (
    <div className="min-h-dvh bg-page px-5 py-16 sm:px-10">
      <SignalHub {...args} />
    </div>
  ),
} satisfies Meta<typeof SignalHub>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: /Ajanların/ })).toBeInTheDocument();
    await expect(canvas.getByText("API Servisleri")).toBeInTheDocument();
  },
};

export const TwoNodes: Story = {
  name: "İki Kart",
  args: {
    nodes: [
      { id: "a", name: "Gelen Kutusu", status: "Etkin", progress: 0.5, detail: "48 e-postanın 24'ü sınıflandı" },
      { id: "b", name: "Takvim", status: "Beklemede", progress: 0.25, detail: "3 toplantı önerisi" },
    ],
    done: ["Sabah özeti hazır", "2 yanıt taslağı yazıldı"],
  },
};
