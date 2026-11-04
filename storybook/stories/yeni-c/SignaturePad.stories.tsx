import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fireEvent, fn, userEvent, within } from "storybook/test";
import { SignaturePad } from "@/components/ui/signature-pad";
import { Frame } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Form Girişleri/İmza Alanı",
  id: "signature-pad",
  component: SignaturePad,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Teslim tutanağı, sözleşme onayı, fatura imzası. Parmakla, kalemle ya da fareyle çizilir; klavye ve ekran okuyucu kullanıcısı aynı işi “Yazarak” yoluyla yapar. Değer SVG (boyuttan bağımsız, `currentColor`): belgede siyah, ekranda temanın metin rengi. Tema değişince ya da kutu boyutlanınca imza noktalardan yeniden çizilir. Geri Al son çizgiyi, Temizle hepsini siler.",
      },
    },
  },
  args: { label: "Teslim Alan İmzası", name: "imza", onValueChange: fn() },
  render: (args) => (
    <Frame width="md">
      <SignaturePad {...args} />
    </Frame>
  ),
} satisfies Meta<typeof SignaturePad>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Çizerek",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const pad = canvas.getByRole("img", { name: /çizim alanı/ });
    const r = pad.getBoundingClientRect();
    fireEvent.pointerDown(pad, { clientX: r.left + 40, clientY: r.top + 60, pointerId: 1 });
    for (let i = 1; i <= 8; i++) fireEvent.pointerMove(pad, { clientX: r.left + 40 + i * 18, clientY: r.top + 60 + Math.sin(i) * 14, pointerId: 1 });
    fireEvent.pointerUp(pad, { pointerId: 1 });
    await expect(args.onValueChange).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "drawn" }));
    const hidden = canvasElement.querySelector<HTMLInputElement>('input[name="imza"]');
    await expect(hidden?.value).toContain("<svg");
    await userEvent.click(canvas.getByRole("button", { name: "İmzayı Temizle" }));
    await expect(args.onValueChange).toHaveBeenLastCalledWith(null);
  },
};

export const Typed: Story = {
  name: "Yazarak",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Yazarak" }));
    await userEvent.type(canvas.getByLabelText("Adın ve soyadın"), "Ahmet Akyapı");
    await expect(args.onValueChange).toHaveBeenLastCalledWith({ kind: "typed", name: "Ahmet Akyapı" });
    await expect(canvasElement.querySelector<HTMLInputElement>('input[name="imza-kind"]')?.value).toBe("typed");
  },
};

export const Short: Story = {
  name: "Kısa Alan",
  args: { height: 110, label: "Paraf" },
};
