import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Reactions } from "@/components/ui/reactions";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Temel/Tepkiler",
  id: "reactions",
  component: Reactions,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Mesaja, nota ya da duyuruya tek dokunuşla tepki. Emoji yerine altı sabit ikon, her birinin Türkçe adı var. Hap bir aç-kapa düğmesi: `aria-pressed` senin tepkini, ad sayıyı söyler (“Beğendim: 3 kişi, sen dahil”). Sayısı sıfıra inen hap kalkar; gülen yüz artısı tepki ekler.",
      },
    },
  },
  args: { label: "Ekip tepkileri", defaultValue: [{ kind: "begen", count: 2 }, { kind: "goz", count: 1, mine: true }] },
  render: (args) => (
    <Frame width="sm">
      <div className="grid gap-2.5">
        <p className="rounded-xl bg-overlay px-4 py-3 text-base text-strong shadow-raised">Yeni karşılama akışı yayında.</p>
        <Reactions {...args} />
      </div>
    </Frame>
  ),
} satisfies Meta<typeof Reactions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const like = canvas.getByRole("button", { name: "Beğendim: 2 kişi" });
    await expect(like).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(like);
    await expect(canvas.getByRole("button", { name: "Beğendim: 3 kişi, sen dahil" })).toHaveAttribute("aria-pressed", "true");
    // Kendi tek tepkini geri alınca hap kalkar.
    await userEvent.click(canvas.getByRole("button", { name: "Bakıyorum: 1 kişi, sen dahil" }));
    await expect(canvas.queryByRole("button", { name: /Bakıyorum/ })).toBeNull();
    // Ekle katmanından yeni tepki.
    await userEvent.click(canvas.getByRole("button", { name: "Tepki Ekle" }));
    await userEvent.click(await page.findByRole("button", { name: "Tebrikler" }));
    await expect(await canvas.findByRole("button", { name: "Tebrikler: 1 kişi, sen dahil" })).toBeVisible();
  },
};

export const Empty: Story = {
  name: "Boş",
  args: { defaultValue: [] },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Boş">
        <Reactions label="Tepkiler" />
      </Cell>
      <Cell label="Senin Tepkin Var">
        <Reactions label="Tepkiler" defaultValue={[{ kind: "kalp", count: 5, mine: true }, { kind: "tamam", count: 2 }]} />
      </Cell>
      <Cell label="Hepsi">
        <Reactions
          label="Tepkiler"
          defaultValue={[
            { kind: "begen", count: 12 },
            { kind: "kalp", count: 4 },
            { kind: "tebrik", count: 3, mine: true },
            { kind: "ates", count: 2 },
            { kind: "goz", count: 1 },
            { kind: "tamam", count: 1 },
          ]}
        />
      </Cell>
    </Gallery>
  ),
};
