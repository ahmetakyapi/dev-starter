import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { CardShowcase } from "./_kartlar";

const meta = {
  title: "Ekranlar/Örnek Sayfalar/Kart Vitrini",
  id: "sample-cards",
  component: CardShowcase,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Yapay zeka ve araştırma ürünleri için yedi tanıtım kartı: kadrajda dönen dünya + smear dokusu, numaralı künye + küre şeridi, sahne + sayı sütunu, oyuk ızgara + parlak küre, \"Düşünüyor…\" kartı, cam soru kutusu, zirve kartı. Fotoğraf yerine `art-mat` ve `wallpaper`, 3D yerine `orb`. Markalar kurgusal, sayılar ÖRNEK.",
      },
    },
  },
} satisfies Meta<typeof CardShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  name: "Kart Vitrini",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Araştırma Kartları" })).toBeInTheDocument();
    // Küre şeridi: yandakine basınca o seçilir.
    await userEvent.click(canvas.getByRole("button", { name: "Dünya" }));
    await expect(canvas.getByRole("button", { name: "Dünya" })).toHaveAttribute("aria-pressed", "true");
  },
};
