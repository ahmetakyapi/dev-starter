import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Info } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";
import { CloseButton } from "@/components/ui/close-button";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Düğme ve İkon/Kapat Düğmesi",
  component: CloseButton,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Diyalog, uyarı satırı, duyuru ve çipteki “×”. Dokunma alanı görselden büyük (44 piksel, görünen daire 28/32); fazlası negatif kenar boşluğuyla taşar. Ad tipte zorunlu ve neyi kapattığını söyler (“Duyuruyu Kapat”); odak halkası dairenin çevresinde.",
      },
    },
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    tone: { control: "inline-radio", options: ["default", "onWash"] },
  },
  args: { "aria-label": "Duyuruyu Kapat", size: "md", bleed: true, tone: "default", disabled: false, onClick: fn() },
} satisfies Meta<typeof CloseButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan",
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Duyuruyu Kapat" }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const DevreDisi: Story = {
  name: "Devre Dışı",
  args: { disabled: true },
};

export const UyariSatirinda: Story = {
  name: "Uyarı Satırında",
  render: (args) => (
    <Frame width="lg">
      <div role="note" className="flex items-start gap-3 rounded-lg bg-primary-wash px-4 py-3 text-primary-ink">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        <p className="min-w-0 flex-1 text-base">Kasım faturanız hazır. Ödeme son günü 15 Kasım.</p>
        <CloseButton {...args} tone="onWash" aria-label="Uyarıyı Kapat" />
      </div>
    </Frame>
  ),
};

export const KartKosesinde: Story = {
  name: "Kart Köşesinde",
  render: (args) => (
    <Frame width="md">
      <section aria-labelledby="davet-baslik" className="rounded-xl bg-overlay p-5 shadow-raised">
        <header className="flex items-start gap-4">
          <h2 id="davet-baslik" className="min-w-0 flex-1 text-title font-semibold text-strong">
            Ekibinizi Davet Edin
          </h2>
          <CloseButton {...args} aria-label="Daveti Kapat" />
        </header>
        <p className="mt-2 text-base text-muted">Panoyu birlikte kullanmak için en fazla 5 kişiyi ücretsiz ekleyebilirsiniz.</p>
      </section>
    </Frame>
  ),
};

export const TumVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={4}>
      <Cell label="md · 32 piksel daire">
        <CloseButton aria-label="Diyaloğu Kapat" />
      </Cell>
      <Cell label="sm · 28 piksel daire">
        <CloseButton aria-label="Filtreyi Kaldır" size="sm" />
      </Cell>
      <Cell label="onWash · renkli zeminde" className="bg-primary-wash">
        <CloseButton aria-label="Uyarıyı Kapat" tone="onWash" />
      </Cell>
      <Cell label="Devre dışı">
        <CloseButton aria-label="Kapat" disabled />
      </Cell>
    </Gallery>
  ),
};
