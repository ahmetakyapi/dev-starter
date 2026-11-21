import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Clock, Layers, Repeat, Tag } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { LeverCard, LeverGrid } from "@/components/ui/lever-card";

const LEVERS = [
  { id: "emek", title: "Emek Maliyetini Tahminde Tut", effect: "+1,5 puan", note: "aylık 27,6 bin ₺", progress: 0.62, icon: <Clock />, text: "Montaj 7,8 saatte biter, acil işler teklife sadık kalır." },
  { id: "malzeme", title: "Malzeme Fiyatlarını Sabitle", effect: "+0,7 puan", note: "aylık 12,9 bin ₺", progress: 0.29, icon: <Layers />, text: "Mart zammını fiyat listesine yansıt." },
  { id: "geri", title: "Geri Dönüşleri %4'e İndir", effect: "+0,4 puan", note: "aylık 7,0 bin ₺", progress: 0.16, icon: <Repeat />, text: "Her teslimde tahliye hattı kontrolü ekle." },
  { id: "indirim", title: "İndirimi %5 ile Sınırla", effect: "+0,2 puan", note: "aylık 3,7 bin ₺", progress: 0.08, icon: <Tag />, text: "%5 üstü talepler onay için sahibine gider." },
] as const;

function Demo({ start = ["emek"] }: { start?: string[] }) {
  const [on, setOn] = useState<readonly string[]>(start);
  return (
    <div className="mx-auto max-w-6xl p-6">
      <LeverGrid label="Marj Kaldıraçları">
        {LEVERS.map((l) => (
          <LeverCard
            key={l.id}
            title={l.title}
            effect={l.effect}
            effectNote={l.note}
            progress={l.progress}
            icon={l.icon}
            description={l.text}
            checked={on.includes(l.id)}
            onCheckedChange={(next) => setOn((prev) => (next ? [...prev, l.id] : prev.filter((id) => id !== l.id)))}
          />
        ))}
      </LeverGrid>
      <p className="mt-4 text-small text-muted">Açık kaldıraç: {on.length}</p>
    </div>
  );
}

const meta = {
  title: "Bileşenler/Seçim/Kaldıraç Kartı",
  id: "lever-card",
  component: LeverCard,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Bir senaryo kaldıracı: anahtar, büyük etki değeri ve hedef açığının kapanan payı. Kapalıyken etki nötr ve çubuk çizgili (\"henüz uygulanmadı\"), açıkken etki yeşil ve çubuk dolu: iki işaret, renk körlüğünde de ayrışır. Anahtarın adı başlık, açıklaması etki değeri; çubuk `role=\"meter\"`. Tahmin grafiğiyle (`ForecastChart`) birlikte kullanılır. Margin tahmin ekranından (yalnız yapı ve davranış; ÖRNEK veri).",
      },
    },
  },
  args: { title: "Emek Maliyetini Tahminde Tut", effect: "+1,5 puan", progress: 0.62, checked: false },
  render: () => <Demo />,
} satisfies Meta<typeof LeverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Dört Kaldıraç",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole("switch", { name: "Malzeme Fiyatlarını Sabitle" });
    await expect(sw).not.toBeChecked();
    await userEvent.click(sw);
    await expect(sw).toBeChecked();
    await expect(canvas.getByText("Açık kaldıraç: 2")).toBeInTheDocument();
    await expect(canvas.getAllByRole("meter")[1]).toHaveAttribute("aria-valuetext", expect.stringContaining("uygulanıyor"));
  },
};

export const Single: Story = {
  name: "Tek Kart",
  render: () => (
    <div className="mx-auto max-w-xs p-6">
      <LeverCard title="Emek Maliyetini Tahminde Tut" effect="+1,5 puan" effectNote="aylık 27,6 bin ₺" progress={0.62} icon={<Clock />} description="Montaj 7,8 saatte biter." checked onCheckedChange={() => {}} />
    </div>
  ),
};
