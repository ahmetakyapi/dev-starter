import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PhoneFrame } from "@/components/ui/phone-frame";

const ROWS = [
  { name: "Hana", note: "Fotoğraf · 12 dk" },
  { name: "Stüdyo", note: "Yarın onda görüşürüz · 8 dk" },
  { name: "Rodrigo", note: "0:07 · Sesli not · 21 dk" },
  { name: "Finn", note: "2 fotoğraf · 1 sa" },
];

const meta = {
  title: "Bileşenler/Tanıtım/Telefon Maketi",
  id: "phone-frame",
  component: PhoneFrame,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Token'la çizilmiş telefon: ince çerçeve, kamera adası, durum çubuğu. Çerçeve donanım rengi iki temada aynı koyu (`--chart-ink`), ekran sayfanın kendi zemini; içerik temayla döner. Bütün ölçüler genişlikten (`--u`). `label` verilirse maket tek resim (`role=\"img\"`). `app-window`ın telefon karşılığı; gethoy.app turundan.",
      },
    },
  },
  args: { width: 280, time: "9:41", label: "Telefonda kanal listesi", children: null },
  render: (args) => (
    <div className="grid place-items-center p-8">
      <PhoneFrame {...args}>
        <div className="grid gap-2 px-3 pt-1">
          <p className="px-1 text-title font-bold text-strong">Kanallar</p>
          {ROWS.map((r) => (
            <div key={r.name} className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2">
              <span aria-hidden className="size-9 shrink-0 rounded-full bg-primary-wash" />
              <span className="grid min-w-0">
                <span className="truncate text-small font-semibold text-strong">{r.name}</span>
                <span className="truncate text-micro text-muted">{r.note}</span>
              </span>
            </div>
          ))}
        </div>
      </PhoneFrame>
    </div>
  ),
} satisfies Meta<typeof PhoneFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Kanal Listesi" };
export const Small: Story = { name: "Küçük", args: { width: 180 } };
