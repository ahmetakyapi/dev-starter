import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Check, Copy } from "lucide-react";
import { SlotText } from "@/components/ui/slot-text";
import { Button } from "@/components/ui/Button";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Hareket ve Doku/Kayan Metin",
  id: "slot-text",
  component: SlotText,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Metin değişince harfler slot makinesi gibi yerine yuvarlanır; değişmeyen harf yerinde kalır (“Kaydet” → “Kaydedildi”). Durum etiketi, düğmenin yeni hali, dönen kahraman sözcüğü. İlk çizim durağan, tam metin `sr-only`, `live` ile duyurulur.",
      },
    },
  },
  args: { text: "Taslak" },
} satisfies Meta<typeof SlotText>;

export default meta;
type Story = StoryObj<typeof meta>;

function CopyDemo() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => setDone(false), 1800);
    return () => window.clearTimeout(id);
  }, [done]);
  return (
    <Button variant="secondary" onClick={() => setDone(true)}>
      {done ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
      <SlotText text={done ? "Kopyalandı" : "Kopyala"} live />
    </Button>
  );
}

const WORDS = ["randevu", "fatura", "stok", "vardiya"] as const;
function Rotating() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((n) => (n + 1) % WORDS.length), 2200);
    return () => window.clearInterval(id);
  }, []);
  return (
    <p className="text-heading font-semibold tracking-tight text-strong">
      Ekibinin <SlotText text={WORDS[i]} className="text-primary-ink" /> işi tek yerde.
    </p>
  );
}

export const Default: Story = {
  name: "Varsayılan",
  render: () => (
    <Frame width="sm">
      <div className="grid justify-items-center">
        <CopyDemo />
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Kopyala/ }));
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Kopyalandı"));
  },
};

export const Uses: Story = {
  name: "Kullanımlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Dönen kahraman sözcüğü">
        <Rotating />
      </Cell>
      <Cell label="Aşağı yönlü">
        <SlotText text="Yayında" direction="down" className="text-title font-semibold text-strong" />
      </Cell>
    </Gallery>
  ),
};
