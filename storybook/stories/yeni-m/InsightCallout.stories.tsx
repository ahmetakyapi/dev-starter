import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "@/components/ui/Button";
import { InsightCallout } from "@/components/ui/insight-callout";

function Demo() {
  const [planned, setPlanned] = useState(false);
  return (
    <div className="mx-auto grid max-w-xl gap-4 p-6">
      <InsightCallout
        title="Kazan Dairesi Arızası Yaklaşıyor"
        label="Öneri"
        actions={
          <Button variant="secondary" size="sm" onClick={() => setPlanned(true)}>
            {planned ? "Servis Planlandı" : "Servis Planla"}
          </Button>
        }
      >
        Kazanın 21 gün içinde arızalanması olası. Bakımı 30 Ekim&apos;den önce yaptırmak tahmini ₺6.400&apos;lik acil onarımı önler.
      </InsightCallout>
      <InsightCallout kind="warning" title="Fatura Tedarikçi Kaydıyla Uyuşmuyor" label="Dikkat">
        Faturadaki vergi numarasında iki hane yer değiştirmiş. Bu durumda fatura reddedilir; düzeltmeyi yalnız tedarikçi yapabilir.
      </InsightCallout>
      <InsightCallout kind="success" title="Düzeltme Kabul Edildi">
        Tedarikçi vergi numarasını düzeltti, tüm kontroller geçti. Ödeme planlandığı gibi sürüyor.
      </InsightCallout>
    </div>
  );
}

const meta = {
  title: "Bileşenler/Geri Bildirim/Öneri Kutusu",
  id: "insight-callout",
  component: InsightCallout,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Bir kaydın yanında duran kısa değerlendirme: tür etiketi, gerçek başlık, 2-3 cümle ve en çok iki eylem. `banner-alert` bölümün durumunu söyler, bu kutu kayda bağlı öneriyi. Üç tür (öneri, dikkat, sonuç); zemin tonu ince çerçeveyle gelir, tek kenar şeridi yok. Etiket metindir, renk tek işaret değil; model iddiası taşımaz, kaynağı çağıran yazar. Fixora, Clearbill ve Noticeline ekranlarının ortak kalıbı.",
      },
    },
  },
  args: { title: "Başlık", children: "Gövde" },
  render: () => <Demo />,
} satisfies Meta<typeof InsightCallout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Üç Tür",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 3, name: "Kazan Dairesi Arızası Yaklaşıyor" })).toBeInTheDocument();
    await expect(canvas.getByRole("complementary", { name: "Kazan Dairesi Arızası Yaklaşıyor" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Servis Planla" }));
    await expect(canvas.getByRole("button", { name: "Servis Planlandı" })).toBeInTheDocument();
  },
};
