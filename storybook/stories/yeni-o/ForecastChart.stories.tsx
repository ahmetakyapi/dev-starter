import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ForecastChart } from "@/components/ui/forecast-chart";
import { LeverCard } from "@/components/ui/lever-card";

const LABELS = ["Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const ACTUAL = [32.8, 33.5, 34.4, 35.1, 34.9, 35.2, null, null, null];
const CURRENT = [null, null, null, null, null, 35.2, 35.6, 35.9, 36.1];
const LOW = [null, null, null, null, null, 35.2, 34.1, 33.8, 33.6];
const HIGH = [null, null, null, null, null, 35.2, 36.9, 37.6, 38.2];
/** Her açık kaldıraç yolu yukarı iter (ÖRNEK veri). */
const LIFT = [0, 0, 0, 0, 0, 0, 1.1, 1.3, 1.5];
const pct = (v: number) => `%${v.toFixed(1).replace(".", ",")}`;

function Demo() {
  const [on, setOn] = useState(true);
  const withChanges = on ? CURRENT.map((v, i) => (v === null ? null : Math.round((v + LIFT[i]) * 10) / 10)) : undefined;
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <ForecastChart
        title="Marj Görünümü"
        labels={LABELS}
        actual={ACTUAL}
        current={CURRENT}
        withChanges={withChanges}
        range={{ low: LOW, high: HIGH }}
        target={{ value: 38, label: "Hedef" }}
        format={pct}
      />
      <div className="max-w-xs">
        <LeverCard title="Emek Maliyetini Tahminde Tut" effect="+1,5 puan" effectNote="aylık 27,6 bin ₺" progress={0.62} checked={on} onCheckedChange={setOn} description="Kaldıraç açıkken yeşil yol grafikte görünür." />
      </div>
    </div>
  );
}

const meta = {
  title: "Grafikler/Tahmin Grafiği",
  id: "forecast-chart",
  component: ForecastChart,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Gerçekleşen çizgi bugünden sonra ikiye ayrılır: mevcut yol (içi boş nokta, kesik) ve değişikliklerle yol (yeşil, dolu); arkada olası aralık bandı, hedef çizgisi ölçüt. Y ekseni sıfırdan başlamaz. `withChanges` verilmezse yeşil yol çizilmez: kaldıraç anahtarlarına bağlanır. `LineChart` aynı eksendeki serileri kıyaslar, bu bileşen tek ölçünün iki geleceğini ve belirsizliğini çizer. Fare, dokunma ve klavye (← → Home End); asıl veri `sr-only` tabloda. Margin tahmin ekranından (yalnız yapı ve davranış; ÖRNEK veri).",
      },
    },
  },
  args: { title: "Marj Görünümü", labels: LABELS, actual: ACTUAL, current: CURRENT, format: pct },
  render: () => <Demo />,
} satisfies Meta<typeof ForecastChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Kaldıraçlı Marj",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("columnheader", { name: "Değişikliklerle" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("switch", { name: "Emek Maliyetini Tahminde Tut" }));
    await expect(canvas.queryByRole("columnheader", { name: "Değişikliklerle" })).toBeNull();
    const area = canvas.getByRole("group", { name: /ok tuşlarıyla aylar arasında gezin/ });
    area.focus();
    await userEvent.keyboard("{End}");
    await expect(canvas.getByText(/Ara: Mevcut Yol %36,1/)).toBeInTheDocument();
  },
};

export const WithChanges: Story = {
  name: "Değişikliklerle Yol",
  render: () => (
    <div className="mx-auto max-w-4xl p-6">
      <ForecastChart
        title="Marj Görünümü"
        labels={LABELS}
        actual={ACTUAL}
        current={CURRENT}
        withChanges={CURRENT.map((v, i) => (v === null ? null : Math.round((v + LIFT[i]) * 10) / 10))}
        range={{ low: LOW, high: HIGH }}
        target={{ value: 38, label: "Hedef" }}
        format={pct}
      />
    </div>
  ),
};

export const Sparse: Story = {
  name: "Tek Nokta ve Boş Değer",
  render: () => (
    <div className="mx-auto max-w-xl p-6">
      <ForecastChart title="Kısa Seri" labels={["Eyl"]} actual={[35.2]} current={[null]} format={pct} />
    </div>
  ),
};

export const Empty: Story = {
  name: "Veri Yok",
  render: () => (
    <div className="mx-auto max-w-xl p-6">
      <ForecastChart title="Boş Seri" labels={["Nis", "May", "Haz"]} actual={[null, null, null]} current={[null, null, null]} format={pct} />
    </div>
  ),
};
