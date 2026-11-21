import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ChoiceChips, type Choice } from "@/components/ui/choice-chips";

const OPTIONS: Choice[] = [
  { value: "gaz", label: "Gazlı Isıtma" },
  { value: "asansor", label: "Yolcu Asansörü" },
  { value: "kazan", label: "Sıcak Su Kazanı" },
  { value: "sprinkler", label: "Yağmurlama Sistemi" },
  { value: "cati", label: "Çatı Klimaları" },
  { value: "gunes", label: "Güneş Panelleri" },
  { value: "sarj", label: "Şarj İstasyonları" },
];

function Demo() {
  const [value, setValue] = useState<string[]>(["gaz", "asansor"]);
  return (
    <div className="mx-auto max-w-xl p-6">
      <ChoiceChips legend="Bina Sistemleri" options={OPTIONS} value={value} onValueChange={setValue} max={4} />
    </div>
  );
}

const meta = {
  title: "Bileşenler/Seçim/Çoklu Seçim Çipleri",
  id: "choice-chips",
  component: ChoiceChips,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Bir listeden birden çok etiket seçen form alanı: seçili çip koyu dolgulu ve ✓'lı, `aria-pressed` butonlar `role=\"group\"` içinde. `FilterChip` bir listeyi süzer (hafif, sayaçlı); bu bileşen formun alanıdır, `legend`li ve isteğe `max` sınırlıdır. Sınır dolunca kalanlar kapanır ve neden yazılıdır. Fixora mülk ekleme formundan.",
      },
    },
  },
  args: { legend: "Bina Sistemleri", options: OPTIONS, value: [], onValueChange: () => {} },
  render: () => <Demo />,
} satisfies Meta<typeof ChoiceChips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Dört Seçimle Sınırlı",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("2 seçildi")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Sıcak Su Kazanı" }));
    await userEvent.click(canvas.getByRole("button", { name: "Yağmurlama Sistemi" }));
    await expect(canvas.getByText("4 seçildi")).toBeInTheDocument();
    // Sınır doldu: seçili olmayanlar kapanır.
    await expect(canvas.getByRole("button", { name: "Güneş Panelleri" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "Gazlı Isıtma" }));
    await expect(canvas.getByRole("button", { name: "Güneş Panelleri" })).toBeEnabled();
  },
};
