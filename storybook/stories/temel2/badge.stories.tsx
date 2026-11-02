import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { Frame } from "../_lib/Frame";

type Tone = NonNullable<ComponentProps<typeof Badge>["tone"]>;

const STATUS = [
  ["neutral", "Taslak"],
  ["primary", "Yeni"],
  ["success", "Tamamlandı"],
  ["warning", "Bekliyor"],
  ["danger", "Gecikti"],
] as const;

const CATEGORY = [
  ["chart-1", "Satış"],
  ["chart-2", "Pazarlama"],
  ["chart-3", "Destek"],
  ["chart-4", "Ürün"],
  ["chart-5", "Finans"],
  ["chart-6", "Operasyon"],
] as const;

const meta = {
  title: "Bileşenler/Seçim/Rozet",
  component: Badge,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Kısa durum ya da kategori etiketi; etkileşimsiz. Durum tonları (`success`, `warning`…) yıkanmış zemin + aynı ailenin mürekkebi; kategori tonları (`chart-1…6`) grafik serisiyle eşleşir, yazı `text-strong`. Renk tek işaret değil: asıl ayırt edici metnin kendisi.",
      },
    },
  },
  args: { children: "Tamamlandı", tone: "success", variant: "soft", shape: "pill", dot: true },
  argTypes: {
    tone: {
      control: "select",
      options: ["neutral", "primary", "success", "warning", "danger", "chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6"],
    },
    variant: { control: "inline-radio", options: ["soft", "outline"] },
    shape: { control: "inline-radio", options: ["pill", "rounded"] },
  },
  decorators: [
    (Story, { parameters }) =>
      parameters.bare ? (
        <Story />
      ) : (
      <Frame width="sm">
        <div className="flex justify-center">
          <Story />
        </div>
      </Frame>
    ),
  ],
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = { name: "Varsayılan" };

export const Noktasiz: Story = { name: "Noktasız", args: { dot: false, tone: "primary", children: "Yeni" } };

export const Cizgili: Story = { name: "Çizgili", args: { variant: "outline", tone: "warning", children: "Bekliyor" } };

export const Kategori: Story = { name: "Kategori", args: { tone: "chart-3", shape: "rounded", dot: false, children: "Destek" } };

function Row({ title, items, variant, dot }: { title: string; items: readonly (readonly [Tone, string])[]; variant: "soft" | "outline"; dot?: boolean }) {
  return (
    <div className="grid gap-3">
      <p className="text-small font-medium text-muted">{title}</p>
      {(["pill", "rounded"] as const).map((shape) => (
        <div key={shape} className="flex flex-wrap items-center gap-2">
          {items.map(([tone, label]) => (
            <Badge key={tone} tone={tone} variant={variant} shape={shape} dot={dot}>
              {label}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  );
}

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  decorators: [
    (Story) => (
      <Frame width="xl">
        <Story />
      </Frame>
    ),
  ],
  render: () => (
    <div className="grid gap-8">
      <Row title="Durum · soft · noktalı (üst sıra pill, alt sıra rounded)" items={STATUS} variant="soft" dot />
      <Row title="Durum · outline" items={STATUS} variant="outline" />
      <Row title="Kategori · soft" items={CATEGORY} variant="soft" />
      <Row title="Kategori · outline · noktalı" items={CATEGORY} variant="outline" dot />
    </div>
  ),
};
