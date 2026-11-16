import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { DateRangePresets, rangeOf, type DateRangeValue, type RangePreset } from "@/components/ui/date-range-presets";

/** Sabit "bugün": hikâye her gün aynı görünsün (Pusula'nın örnek verisiyle aynı gün). */
const TODAY = new Date(2026, 10, 2);
const DAY = 86_400_000;
/** Kurgusal sipariş günleri: son 40 günde düzensiz. */
const ORDERS = [0, 0, 1, 2, 2, 3, 5, 6, 6, 8, 11, 13, 15, 20, 22, 27, 29, 33, 38].map((d) => new Date(TODAY.getTime() - d * DAY + 10 * 3_600_000));

const PRESETS: readonly RangePreset[] = [
  { id: "7", label: "Son 7 Gün", days: 7 },
  { id: "30", label: "Son 30 Gün", days: 30 },
  { id: "90", label: "Son 90 Gün", days: 90 },
  { id: "tum", label: "Tümü", days: null },
];

function Demo() {
  const [value, setValue] = useState<DateRangeValue>({ kind: "preset", id: "30" });
  const span = rangeOf(value, PRESETS, TODAY);
  const n = ORDERS.filter((d) => !span || (d >= span.start && d <= span.end)).length;
  return (
    <div className="grid min-h-[34rem] content-start gap-3 p-6">
      <DateRangePresets label="Sipariş" presets={PRESETS} value={value} onValueChange={setValue} today={TODAY} className="justify-self-start" />
      <p aria-live="polite" className="text-small text-muted">
        {n} sipariş
      </p>
    </div>
  );
}

const meta = {
  title: "Bileşenler/Form Girişleri/Tarih Aralığı Süzgeci",
  id: "date-range-presets",
  component: DateRangePresets,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Hazır aralıklar (Son 7 / 30 / 90 Gün, Tümü) ve aynı açılır kutuda özel aralık takvimi. İnsanların çoğu \"son 30 gün\" ister, takvimde iki gün tıklamamalı; tam aralık gerekince de ikinci bir bileşene gitmemeli. Süzme için `rangeOf(value, presets, today)`. Hazır aralıklar radyo grubu (ok tuşları); bitiş günü seçilince kutu kapanır, odak tetikleyiciye döner. Assetora turundan (orada iki ayrı düğmeydi, burada tek). Pusula: Gelen Kutusu → Geldi.",
      },
    },
  },
  args: { label: "Sipariş", presets: PRESETS, value: { kind: "preset", id: "30" }, onValueChange: () => {}, today: TODAY },
  render: () => <Demo />,
} satisfies Meta<typeof DateRangePresets>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Sipariş Aralığı",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await expect(canvas.getByText("17 sipariş")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: /Sipariş/ }));
    await userEvent.click(await body.findByRole("radio", { name: "Son 7 Gün" }));
    await expect(canvas.getByText("9 sipariş")).toBeInTheDocument();
  },
};
