import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "@/components/ui/Button";
import { DigitRoll } from "@/components/ui/digit-roll";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Veri/Rakam Yuvarlama",
  id: "digit-roll",
  component: DigitRoll,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Değer değişince yalnız değişen rakam kendi penceresinde dikey yuvarlanır; ara sayı basılmaz, genişlik sıçramaz (`tabular-nums`). İlk çizim durağan: yüklemede bir kez dönen sayı için `snippets/rolling-number`, ara değerlerden sayan sayaç için `snippets/animated-number`. Biçim `tr-TR`; ekran okuyucu tam değeri tek metin olarak okur, hareketi azaltanda rakam yerinde değişir.",
      },
    },
  },
  args: { value: 24182, className: "text-display font-medium tracking-tight text-strong" },
  render: (args) => (
    <Frame width="sm">
      <p className="flex items-baseline gap-1.5">
        <DigitRoll {...args} />
        <span className="text-base text-muted">ziyaret</span>
      </p>
    </Frame>
  ),
} satisfies Meta<typeof DigitRoll>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

const ORDERS = [1248, 1253, 1261, 1307, 1999, 2004];

function Counter() {
  const [i, setI] = useState(0);
  return (
    <div className="grid justify-items-start gap-4">
      <span className="text-base font-medium text-strong">Bugünkü Sipariş</span>
      <p aria-live="polite" className="flex items-baseline gap-1.5 text-strong">
        <DigitRoll value={ORDERS[i]} className="text-display font-medium tracking-tight" />
        <span className="text-base text-muted">adet</span>
      </p>
      <Button variant="secondary" size="sm" onClick={() => setI((v) => (v + 1) % ORDERS.length)}>
        Yeni Sipariş Geldi
      </Button>
    </div>
  );
}

export const OnChange: Story = {
  name: "Değişince Yuvarlanır",
  render: () => (
    <Frame width="sm">
      <Counter />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("1.248")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Yeni Sipariş Geldi" }));
    await expect(canvas.getByText("1.253")).toBeInTheDocument();
  },
};

export const Dark: Story = {
  name: "Koyu Tema",
  globals: { theme: "dark" },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Para · tr-TR">
        <p className="flex items-baseline gap-1.5 text-strong">
          <DigitRoll value={54114.33} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} className="text-heading font-medium tracking-tight" />
          <span className="text-small text-muted">₺</span>
        </p>
      </Cell>
      <Cell label="Yüzde">
        <DigitRoll value={0.418} format={{ style: "percent", maximumFractionDigits: 1 }} className="text-heading font-medium tracking-tight text-strong" />
      </Cell>
      <Cell label="Biçimlenmiş Metin · Saat">
        <DigitRoll value="09:45" className="text-heading font-medium tracking-tight text-strong" />
      </Cell>
    </Gallery>
  ),
};
