import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { QuickPoll } from "@/components/ui/quick-poll";

const OPTIONS = [
  { id: "kisa", label: "Kısa ve net şablon" },
  { id: "ozur", label: "Özür + tazminat teklifi" },
  { id: "ara", label: "Telefonla arayalım" },
];

function Demo() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-overlay p-5 shadow-raised ring-1 ring-line">
      <QuickPoll question="Gecikme yanıtında hangi şablon?" meta="Zeynep soruyor · bugün" options={OPTIONS} counts={{ kisa: 2, ozur: 1, ara: 1 }} value={value} onValueChange={setValue} />
    </div>
  );
}

const meta = {
  title: "Bileşenler/Seçim/Hızlı Oylama",
  id: "quick-poll",
  component: QuickPoll,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Ekip içi küçük karar tek dokunuşla. Oydan önce sonuçlar gizli (sürü etkisi olmasın); oy verince çubuklar oranına dolar, yüzdeler belirir, önde olan koyu. Kendi seçimine yeniden basmak oyu geri alır. Aç-kapa butonları (`aria-pressed`): oy geri alınabilir, radyo bunu söyleyemez. Allo turundan. Pusula: Görevler → Ekip Kararı.",
      },
    },
  },
  args: { question: "", options: OPTIONS, counts: {}, value: null, onValueChange: () => {} },
  render: () => <Demo />,
} satisfies Meta<typeof QuickPoll>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Şablon Kararı",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/sonuçlar oy verince görünür/)).toBeInTheDocument();
    const opt = canvas.getByRole("button", { name: /^Kısa ve net şablon/ });
    await userEvent.click(opt);
    await expect(opt).toHaveAccessibleName(/%60, 3 oy, senin oyun/);
    await userEvent.click(canvas.getByRole("button", { name: /^Telefonla arayalım/ }));
    await expect(opt).toHaveAttribute("aria-pressed", "false");
  },
};
