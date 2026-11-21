import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Home } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { SetupCard } from "@/components/ui/setup-card";

function Demo() {
  const [step, setStep] = useState(3);
  const [skipped, setSkipped] = useState(false);
  return (
    <div className="mx-auto w-72 p-6">
      {skipped ? (
        <p className="text-small text-muted">Kurulum kartı kaldırıldı.</p>
      ) : (
        <SetupCard
          icon={Home}
          title="Kurulumu Bitir"
          description="Bina sensörlerini bağla, arızaları erken görelim."
          step={step}
          total={4}
          onSkip={() => setSkipped(true)}
          onNext={() => setStep((s) => Math.min(s + 1, 4))}
        />
      )}
    </div>
  );
}

const meta = {
  title: "Bileşenler/Gezinme/Kurulum Kartı",
  id: "setup-card",
  component: SetupCard,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Kenar çubuğunun dibinde kullanıcıyı kurulumu bitirmeye çağıran küçük kart: başlık, tek cümle, ilerleme halkası (3 / 4), \"Atla\" ve \"Sonraki\". Halka `role=\"progressbar\"` ve \"Adım 3, toplam 4\" okur; sayı da yazılı, çember tek işaret değil. Bitince kısa \"hazır\" metni verir, atlamak kartı çağıranın ağacından kaldırır. 15-17 rem genişlik için ölçüldü. Fixora kenar çubuğundan.",
      },
    },
  },
  args: { title: "Kurulumu Bitir", step: 3, total: 4 },
  render: () => <Demo />,
} satisfies Meta<typeof SetupCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Kenar Çubuğu Kartı",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("progressbar", { name: "Kurulum ilerlemesi" })).toHaveAttribute("aria-valuetext", "Adım 3, toplam 4");
    await userEvent.click(canvas.getByRole("button", { name: "Sonraki" }));
    await expect(canvas.getByText("Kurulum tamamlandı")).toBeInTheDocument();
  },
};
