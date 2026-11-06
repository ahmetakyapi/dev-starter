import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ToolCall } from "@/components/ui/tool-call";
import { Button } from "@/components/ui/Button";
import { Frame } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Yapay Zekâ/Araç Çağrısı",
  id: "tool-call",
  component: ToolCall,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Asistanın bir aracı çağırdığı anın kaydı: kapalıyken tek satır (ne yaptı, durum, süre), açınca girdi ve çıktı. Dört durum: onay bekliyor, çalışıyor (parıltılı etiket + ışık kenarı), tamamlandı, hata; durum metinle de yazılır. `<details>`: JavaScript'siz açılır, Ctrl+F içini bulur.",
      },
    },
  },
  args: {
    name: "calendar.search",
    label: "Takvim Araması",
    status: "success",
    durationMs: 840,
    input: { kişi: "Selin Aydın", gün: "2026-11-12", süre_dk: 30 },
    output: { boş_aralıklar: ["10:00-10:30", "13:30-14:00", "16:00-16:30"] },
    defaultOpen: true,
  },
  render: (args) => (
    <Frame width="md">
      <ToolCall {...args} />
    </Frame>
  ),
} satisfies Meta<typeof ToolCall>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const States: Story = {
  name: "Durumlar",
  render: () => (
    <Frame width="md">
      <div className="grid gap-3">
        <ToolCall name="orders.query" label="Siparişler Sorgulanıyor" status="running" input={{ durum: "kargoda", gün: 7 }} />
        <ToolCall
          name="email.send"
          label="Tedarikçiye E-posta"
          status="pending"
          input={{ alıcı: "satis@kiyikavurma.com.tr", konu: "Kasım siparişi: 40 kg Kıyı Harmanı" }}
          actions={
            <>
              <Button size="sm" variant="secondary">Reddet</Button>
              <Button size="sm">Onayla ve Gönder</Button>
            </>
          }
        />
        <ToolCall name="stock.update" label="Stok Güncellemesi" status="success" durationMs={312} output="Kıyı Harmanı 1 kg: 18 → 58" />
        <ToolCall name="invoice.create" label="Fatura Oluşturma" status="error" durationMs={2140} output="e-Arşiv servisi 503 döndü; 2 deneme yapıldı." />
      </div>
    </Frame>
  ),
};
