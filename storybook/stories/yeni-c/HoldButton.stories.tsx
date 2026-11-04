import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fireEvent, fn, waitFor, within } from "storybook/test";
import { HoldButton } from "@/components/ui/hold-button";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Düğme ve İkon/Basılı Tut Onayı",
  id: "hold-button",
  component: HoldButton,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Yıkıcı ama geri alınabilir eylemde diyalog yerine: basılı tutunca dolar, süre dolmadan bırakılırsa geri sarılır. Tıklama tek başına onaylamaz; ipucu bunu herkese söyler. Klavyede Boşluk ya da Enter basılı tutulur. Dolgu `clip-path` ile, metin hiçbir anda kontrastsız kalmaz. Geri alınamaz eylemde `confirm` diyaloğu.",
      },
    },
  },
  args: { children: "Basılı Tutarak Arşivle", doneLabel: "Arşivlendi", onConfirm: fn(), holdMs: 600 },
  render: (args) => (
    <Frame width="sm">
      <HoldButton {...args} />
    </Frame>
  ),
} satisfies Meta<typeof HoldButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /Basılı Tutarak Arşivle/ });
    await expect(button).toHaveAccessibleDescription("Onaylamak için basılı tut");
    // Kısa basış: hiçbir şey olmaz.
    fireEvent.pointerDown(button, { button: 0 });
    fireEvent.pointerUp(button);
    await new Promise((r) => setTimeout(r, 700));
    await expect(args.onConfirm).not.toHaveBeenCalled();
    // Klavyede basılı tutma: onaylar.
    button.focus();
    fireEvent.keyDown(button, { key: " " });
    await waitFor(() => expect(args.onConfirm).toHaveBeenCalledTimes(1), { timeout: 2000 });
    fireEvent.keyUp(button, { key: " " });
    await expect(canvas.getByRole("status")).toHaveTextContent("Arşivlendi");
  },
};

export const Neutral: Story = {
  name: "Nötr",
  args: { tone: "neutral", children: "Basılı Tutarak Çıkış Yap", doneLabel: "Çıkış Yapıldı" },
};

export const Disabled: Story = {
  name: "Devre Dışı",
  args: { disabled: true },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Tehlike">
        <HoldButton onConfirm={() => undefined} doneLabel="Arşivlendi">
          Basılı Tutarak Arşivle
        </HoldButton>
      </Cell>
      <Cell label="Nötr">
        <HoldButton tone="neutral" onConfirm={() => undefined} doneLabel="Çıkış Yapıldı">
          Basılı Tutarak Çıkış Yap
        </HoldButton>
      </Cell>
      <Cell label="Devre Dışı">
        <HoldButton disabled onConfirm={() => undefined}>
          Basılı Tutarak Sil
        </HoldButton>
      </Cell>
    </Gallery>
  ),
};
