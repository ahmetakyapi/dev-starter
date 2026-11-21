import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { OptionCards, type OptionCard } from "@/components/ui/option-cards";

const OPTIONS: OptionCard[] = [
  { value: "iste", title: "Tedarikçiden Düzeltme İste", description: "Hazır bir mesaj ve güvenli bağlantı gönderilir; tedarikçi tek alanı düzeltip yeniden gönderir.", badge: "Önerilen" },
  { value: "burada", title: "Burada Düzelt ve Yeniden Gönder", description: "Alanı kendin düzeltip faturayı yeniden gönderirsin.", locked: { reason: "Mevcut değil: kesilmiş bir vergi faturasını yalnız tedarikçi değiştirebilir." } },
  { value: "reddet", title: "Faturayı Reddet", description: "Fatura durdurulur; tedarikçi yenisini keser ve ödeme 6 Ekim'den sonraya kayar." },
];

function Demo() {
  const [value, setValue] = useState("iste");
  return (
    <div className="mx-auto max-w-xl p-6">
      <OptionCards legend="Nasıl Çözmek İstiyorsun?" name="cozum" options={OPTIONS} value={value} onValueChange={setValue} />
      <p className="mt-3 text-small text-muted">Seçili: {value}</p>
    </div>
  );
}

const meta = {
  title: "Bileşenler/Seçim/Seçenek Kartları",
  id: "option-cards",
  component: OptionCards,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Birbirini dışlayan birkaç yoldan biri; her yolun sonucu kartın içinde yazılı. Gerçek radyo grubu: `fieldset` + `legend`, ok tuşları tarayıcıdan. Kilitli seçenek gizlenmez, neden zorunlu ve hem kartta hem `aria-describedby` ile okunur; ok tuşları onu atlar. Önerilen rozetli seçeneği önceden seçmek çağıranın işi. Kısa etiketler için `radio-group`, çok seçenek için `select`. Clearbill çözüm ekranından.",
      },
    },
  },
  args: { legend: "Seçenekler", options: OPTIONS },
  render: () => <Demo />,
} satisfies Meta<typeof OptionCards>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Kilitli Seçenek ve Önerilen",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "Nasıl Çözmek İstiyorsun?" });
    const [iste, burada, reddet] = within(group).getAllByRole("radio");
    await expect(iste).toBeChecked();
    await expect(burada).toBeDisabled();
    await expect(burada).toHaveAccessibleDescription(/Mevcut değil/);
    // Ok tuşu kilitliyi atlar.
    iste.focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(reddet).toBeChecked();
    await expect(canvas.getByText("Seçili: reddet")).toBeInTheDocument();
  },
};
