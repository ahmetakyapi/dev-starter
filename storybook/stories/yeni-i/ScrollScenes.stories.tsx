import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Inbox, ListChecks, Mic } from "lucide-react";
import { AppWindow } from "@/components/ui/app-window";
import { ScrollScenes } from "@/components/ui/scroll-scenes";

const Mock = ({ title, icon, lines }: { title: string; icon: React.ReactNode; lines: string[] }) => (
  <AppWindow title={title} icon={icon} focused className="w-[min(26rem,86vw)]">
    <ul className="grid gap-2 p-4">
      {lines.map((line) => (
        <li key={line} className="rounded-lg bg-surface px-3 py-2 text-base text-body">
          {line}
        </li>
      ))}
    </ul>
  </AppWindow>
);

const meta = {
  title: "Bileşenler/Tanıtım/Kaydırmalı Sahneler",
  id: "scroll-scenes",
  component: ScrollScenes,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "fullscreen",
    docs: {
      story: { inline: false, height: "720px" },
      description: {
        component:
          "Sahne ekranda sabit kalır, kaydırdıkça sahneler sırayla değişir ve altta her sahnenin tek cümlelik başlığı sözcük sözcük buğudan netleşir. Görsel sahne `aria-hidden`; `narration` zorunlu ve filmin düz anlatımı olarak okunur. Hareketi azaltan kullanıcıda sabitleme kalkar, sahneler başlıklarıyla alt alta durur (yalnız CSS). gethoy.app turundan.",
      },
    },
  },
  args: {
    narration: "Kaydırınca sayfa üç adımı gösterir: önce sesli not yazıya döner, sonra talep gelen kutusuna düşer, en son iş görevlere devredilir.",
    scenes: [
      { id: "ses", caption: "Basılı tut, söyle.", content: <Mock title="Sesli Not" icon={<Mic />} lines={["0:07 · Kargo yarın öğlen teslim edilecek."]} /> },
      { id: "gelen", caption: "Talep şeridin başına düşer.", content: <Mock title="Gelen Kutusu" icon={<Inbox />} lines={["Siparişimiz hâlâ teslim edilmedi", "Kasım faturasında KDV iki kez yansımış"]} /> },
      { id: "gorev", caption: "İşi devret, takvime düşsün.", content: <Mock title="Görevler" icon={<ListChecks />} lines={["Kargo firmasını ara", "Teslimi onayla"]} /> },
    ],
  },
  render: (args) => (
    <div className="bg-page">
      <p className="grid h-[60svh] place-items-center text-read text-soft">Aşağı kaydır.</p>
      <ScrollScenes {...args} />
      <p className="grid h-[60svh] place-items-center text-read text-soft">Film bitti.</p>
    </div>
  ),
} satisfies Meta<typeof ScrollScenes>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Üç Sahne" };
